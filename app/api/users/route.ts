import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const isEmployeeAdministrator = (request: NextRequest) => {
  const role = request.cookies.get('user_role')?.value;
  return Boolean(request.cookies.get('admin_token')?.value) &&
    (role === 'rh' || role === 'super_admin');
};

const normalizeEmail = (email: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function GET(request: NextRequest) {
  try {
    if (!isEmployeeAdministrator(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await connectDB();
    const users = await User.find({ role: 'employee' })
      .select('name firstName email department matricule createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error('[API] list employees error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isEmployeeAdministrator(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { email: rawEmail, password, name, firstName, department, matricule } = body;
    const email = normalizeEmail(rawEmail);

    if (
      !isValidEmail(email) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      typeof name !== 'string' ||
      !name.trim() ||
      typeof firstName !== 'string' ||
      !firstName.trim() ||
      typeof department !== 'string' ||
      !department.trim() ||
      typeof matricule !== 'string' ||
      !matricule.trim()
    ) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis. Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      firstName,
      department,
      role: 'employee',
      matricule
    });

    return NextResponse.json({ success: true, user: { email: newUser.email, role: newUser.role } }, { status: 201 });

  } catch (error) {
    console.error('[API] create user error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isEmployeeAdministrator(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { id, email: rawEmail, password } = body;
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const updates: { email?: string; password?: string } = {};
    if (rawEmail !== undefined) {
      const email = normalizeEmail(rawEmail);
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
      }

      const duplicate = await User.findOne({
        _id: { $ne: id },
        email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
      }
      updates.email = email;
    }

    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au moins 8 caractères' },
          { status: 400 }
        );
      }
      updates.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune modification à enregistrer' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: 'employee' },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('name firstName email department matricule createdAt');

    if (!user) {
      return NextResponse.json({ error: 'Compte employé introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[API] update employee error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isEmployeeAdministrator(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await connectDB();
    const id = request.nextUrl.searchParams.get('id');
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const user = await User.findOneAndDelete({ _id: id, role: 'employee' });
    if (!user) {
      return NextResponse.json({ error: 'Compte employé introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] delete employee error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
