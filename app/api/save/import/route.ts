import { NextResponse, type NextRequest } from 'next/server';
import { getDb, SAVE_VERSION, type UserRow } from '@/lib/server/db';
import { userFromRequest } from '@/lib/server/auth';
import { migrateSave } from '@/lib/save-migrate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 旧 localStorage 进度的一次性导入：每个账号只允许导入一次 */
export async function PUT(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: '请先登录。' }, { status: 401 });

  const db = getDb();
  const row = db.prepare('SELECT legacy_imported FROM users WHERE id = ?').get(user.id) as Pick<UserRow, 'legacy_imported'> | undefined;
  if (!row) return NextResponse.json({ error: '账号不存在。' }, { status: 401 });
  if (row.legacy_imported === 1) {
    return NextResponse.json({ error: '这个账号已经导入过旧存档了。', code: 'already_imported' }, { status: 409 });
  }

  const body = await req.json().catch(() => null) as { state?: unknown } | null;
  const state = migrateSave(body?.state);
  if (!state) return NextResponse.json({ error: '旧存档读不出来。' }, { status: 400 });
  state.gender = user.gender;

  const payload = JSON.stringify(state);
  if (payload.length > 2 * 1024 * 1024) return NextResponse.json({ error: '旧存档过大。' }, { status: 413 });

  db.prepare('INSERT OR REPLACE INTO saves (user_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
    .run(user.id, SAVE_VERSION, payload, Date.now());
  db.prepare('UPDATE users SET legacy_imported = 1 WHERE id = ?').run(user.id);
  return NextResponse.json({ ok: true });
}
