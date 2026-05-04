import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  const role = cookieStore.get('user_role');
  const department = cookieStore.get('user_department');

  return NextResponse.json({
    authenticated: !!token,
    role: role?.value || null,
    department: department?.value || null,
  });
}
