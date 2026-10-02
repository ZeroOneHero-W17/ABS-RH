import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { clearLoginFailures, isLoginBlocked, recordFailedLogin } from '@/lib/loginRateLimit';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    if (await isLoginBlocked(request)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
    }

    const { email, password, rememberMe } = await request.json();

    const user = await User.findOne({ email });
    if (!user) {
      const blocked = await recordFailedLogin(request);
      return NextResponse.json(
        { error: blocked ? 'Trop de tentatives. Réessayez dans 15 minutes.' : 'Email ou mot de passe incorrect' },
        { status: blocked ? 429 : 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const blocked = await recordFailedLogin(request);
      return NextResponse.json(
        { error: blocked ? 'Trop de tentatives. Réessayez dans 15 minutes.' : 'Email ou mot de passe incorrect' },
        { status: blocked ? 429 : 401 }
      );
    }

    await clearLoginFailures(request);
    const response = NextResponse.json({ success: true, role: user.role });
    const maxAge = rememberMe === true ? 60 * 60 * 24 * 30 : 10 * 60;

    response.cookies.set('admin_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    response.cookies.set('user_role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    response.cookies.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });
    
    if (user.matricule) {
      response.cookies.set('user_matricule', user.matricule, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
      });
    }
    
    if (user.department) {
      response.cookies.set('user_department', user.department, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
      });
    }

    return response;
  } catch (error) {
    console.error('[AUTH] employee login error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
