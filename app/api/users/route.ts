import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Auth check should be here in prod to ensure only admin can do this
    const roleCookie = request.cookies.get('user_role')?.value;
    if (roleCookie !== 'rh' && roleCookie !== 'super_admin') {
      return NextResponse.json({ error: 'Non autorisA(c)' }, { status: 403 });
    }

    const { email, password, name, firstName, department, role, matricule } = await request.json();

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est dA(c)jA  utilisA(c)' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      firstName,
      department,
      role: role || 'employee',
      matricule
    });

    return NextResponse.json({ success: true, user: { email: newUser.email, role: newUser.role } });

  } catch (error) {
    console.error('[API] create user error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
