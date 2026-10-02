import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Absence from '@/models/Absence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // In a real app we'd decode a JWT, but here we can read the email from cookies
    const userEmail = request.cookies.get('user_email')?.value;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Non autorisA(c)' }, { status: 401 });
    }

    const absences = await Absence.find({ 'employee.email': userEmail }).sort({ createdAt: -1 });

    return NextResponse.json(absences);
  } catch (error) {
    console.error('[API] Error fetching employee absences', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
