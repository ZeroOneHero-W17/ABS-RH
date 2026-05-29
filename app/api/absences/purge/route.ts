import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  await dbConnect();
  try {
    const result = await Absence.deleteMany({
      status: { $in: ['approved', 'rejected'] }
    });
    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression des demandes' }, { status: 500 });
  }
}
