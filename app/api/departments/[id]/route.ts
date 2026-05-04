import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Department from '@/models/Department';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    await Department.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 });
  }
}
