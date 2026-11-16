import { NextResponse, type NextRequest } from 'next/server';
import { getDb, SAVE_VERSION, type UserRow } from '@/lib/server/db';
import {
  createSession, guestIdFrom, hashPassword, isGender, publicUser, setSessionCookie,
  validateCredentials,
} from '@/lib/server/auth';
import { migrateSave } from '@/lib/save-migrate';
import type { GameState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { username?: unknown; password?: unknown; gender?: unknown } | null;
  const creds = validateCredentials(body?.username, body?.password);
  const gender = body?.gender;
  if (!creds) return NextResponse.json({ error: '用户名需 2-20 个字符（字母/数字/中文），密码 6-72 位。' }, { status: 400 });
  if (!isGender(gender)) return NextResponse.json({ error: '请选择性别。' }, { status: 400 });

  const db = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(creds.username);
  if (exists) return NextResponse.json({ error: '这个用户名已经被用掉了。' }, { status: 409 });

  let user: UserRow;
  try {
    const now = Date.now();
    const info = db.prepare(
      'INSERT INTO users (username, password_hash, gender, created_at) VALUES (?, ?, ?, ?)',
    ).run(creds.username, hashPassword(creds.password), gender, now);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid)) as UserRow;
  } catch {
    return NextResponse.json({ error: '注册失败，请换个用户名再试。' }, { status: 409 });
  }

  // 游客的临时进度：性别一致就自然继承过来，不一致就当开一段新生活
  const guestId = guestIdFrom(req);
  if (guestId) {
    const guestSave = db.prepare('SELECT state FROM guest_saves WHERE guest_id = ?').get(guestId) as { state: string } | undefined;
    if (guestSave) {
      const state = migrateSave(JSON.parse(guestSave.state)) as GameState | null;
      if (state && state.gender === gender && state.day <= 1) {
        state.gender = gender;
        db.prepare('INSERT OR REPLACE INTO saves (user_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
          .run(user.id, SAVE_VERSION, JSON.stringify(state), Date.now());
      }
    }
    db.prepare('DELETE FROM guest_saves WHERE guest_id = ?').run(guestId);
  }

  const { token, expiresAt } = createSession(user.id);
  const res = NextResponse.json({ user: publicUser(user) });
  setSessionCookie(res, token, expiresAt);
  return res;
}
