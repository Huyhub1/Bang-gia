import { NextResponse } from 'next/server';
import { validatePassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Sai mật khẩu!' }, { status: 401 });
    }
    return NextResponse.json({ token: generateToken() });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
