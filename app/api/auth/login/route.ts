import { NextResponse, type NextRequest } from 'next/server';
import { getDb, type UserRow } from '@/lib/server/db';
import { createSession, publicUser, setSessionCookie, verifyPassword } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { username?: unknown; password?: unknown } | null;
  if (typeof body?.username !== 'string' || typeof body?.password !== 'string') {
    return NextResponse.json({ error: '请输入用户名和密码。' }, { status: 400 });
  }

  const row = getDb()
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(body.username.trim()) as UserRow | undefined;
  if (!row || !verifyPassword(body.password, row.password_hash)) {
    return NextResponse.json({ error: '用户名或密码不对。' }, { status: 401 });
  }

  const { token, expiresAt } = createSession(row.id);
  getDb().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(Date.now(), row.id);
  const res = NextResponse.json({ user: publicUser(row) });
  setSessionCookie(res, token, expiresAt);
  return res;
}
