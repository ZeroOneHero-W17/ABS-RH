import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Department from '@/models/Department';

export async function GET() {
  await dbConnect();
  const deps = await Department.find().sort({ name: 1 }).lean();
  return NextResponse.json(deps);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    await dbConnect();
    const exists = await Department.findOne({ name: body.name });
    if (exists) return NextResponse.json({ error: 'exists' }, { status: 409 });
    const doc = await Department.create({ name: body.name });
    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 });
  }
}
