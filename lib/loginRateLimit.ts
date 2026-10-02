import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
let indexesPromise: Promise<void> | undefined;

function getRateLimitKey(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}

async function getAttemptsCollection() {
  await connectDB();
  const collection = mongoose.connection.collection('login_attempts');

  if (!indexesPromise) {
    indexesPromise = Promise.all([
      collection.createIndex({ key: 1 }, { unique: true }),
      collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).then(() => undefined);
  }

  await indexesPromise;
  return collection;
}

export async function isLoginBlocked(request: NextRequest) {
  const collection = await getAttemptsCollection();
  const attempt = await collection.findOne({ key: getRateLimitKey(request) });

  return Boolean(
    attempt &&
    attempt.attempts >= MAX_FAILED_ATTEMPTS &&
    attempt.windowEndsAt instanceof Date &&
    attempt.windowEndsAt.getTime() > Date.now()
  );
}

export async function recordFailedLogin(request: NextRequest) {
  const collection = await getAttemptsCollection();
  const key = getRateLimitKey(request);
  const now = new Date();
  const windowEndsAt = new Date(now.getTime() + WINDOW_MS);
  const pipeline = [{
    $set: {
      key: { $literal: key },
      attempts: {
        $cond: [
          { $gt: ['$windowEndsAt', now] },
          { $add: [{ $ifNull: ['$attempts', 0] }, 1] },
          1,
        ],
      },
      windowEndsAt: { $cond: [{ $gt: ['$windowEndsAt', now] }, '$windowEndsAt', windowEndsAt] },
      expiresAt: { $cond: [{ $gt: ['$windowEndsAt', now] }, '$windowEndsAt', windowEndsAt] },
    },
  }];

  try {
    await collection.updateOne({ key }, pipeline, { upsert: true });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    await collection.updateOne({ key }, pipeline);
  }

  return isLoginBlocked(request);
}

export async function clearLoginFailures(request: NextRequest) {
  const collection = await getAttemptsCollection();
  await collection.deleteOne({ key: getRateLimitKey(request) });
}