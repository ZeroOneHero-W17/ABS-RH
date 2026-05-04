import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password, department } = await request.json();
    console.log('[AUTH] login attempt', { department, passwordProvided: !!password });
    let role = '';

    // Admin and DG quick checks
    if (password === process.env.ADMIN_PASSWORD) {
      role = 'rh';
    } else if (password === process.env.DG_PASSWORD) {
      role = 'dg';
    }

    // Chef: allow either global CHEF_PASSWORD or department-specific vars like DEPT_INFORMATIQUE_PASSWORD
    if (!role) {
      // If department was provided, try department-specific password
      if (department) {
        const sanitize = (s: string) => s.trim().replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
        const key = `DEPT_${sanitize(department)}_PASSWORD`;
        const deptPwd = process.env[key];
        console.log('[AUTH] dept key', key, 'env present', !!deptPwd);
        if (deptPwd && password === deptPwd) {
          role = 'chef';
        }
      }

      // fallback to global CHEF_PASSWORD
      if (!role && password === process.env.CHEF_PASSWORD) {
        role = 'chef';
      }
    }

    if (role) {
      // For chef role, department is required
      if (role === 'chef' && !department) {
        return NextResponse.json({ error: 'Département requis pour Chef de Service' }, { status: 400 });
      }

      const response = NextResponse.json({ success: true, role });

      response.cookies.set('admin_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });

      response.cookies.set('user_role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });

      // Store department for chef isolation
      if (role === 'chef' && department) {
        response.cookies.set('user_department', department, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
        });
      }

      return response;
    } else {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }
  } catch (error) {
    console.error('[AUTH] error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
