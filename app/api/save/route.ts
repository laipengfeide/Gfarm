import { NextResponse, type NextRequest } from 'next/server';
import { getDb, SAVE_VERSION, type GuestSessionRow, type SaveRow } from '@/lib/server/db';
import { resolveGuestId, setGuestCookie, userFromRequest } from '@/lib/server/auth';
import type { GameState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_STATE_BYTES = 2 * 1024 * 1024;

function validState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<GameState>;
  return Array.isArray(s.plots) && typeof s.day === 'number';
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const user = userFromRequest(req);

  if (user) {
    const row = db.prepare('SELECT state FROM saves WHERE user_id = ?').get(user.id) as Pick<SaveRow, 'state'> | undefined;
    return NextResponse.json({
      owner: 'user',
      state: row ? (JSON.parse(row.state) as GameState) : null,
      dayLimit: null,
      locked: false,
    });
  }

  const { id, isNew } = resolveGuestId(req);
  const session = db.prepare('SELECT day_limit FROM guest_sessions WHERE id = ?').get(id) as Pick<GuestSessionRow, 'day_limit'>;
  const row = db.prepare('SELECT state FROM guest_saves WHERE guest_id = ?').get(id) as { state: string } | undefined;
  let state: GameState | null = row ? (JSON.parse(row.state) as GameState) : null;
  let locked = false;
  // 服务端发现游客已经越过第一天，就直接锁住这份临时进度，只留注册入口
  if (state && Number(state.day) > session.day_limit) {
    state = null;
    locked = true;
  }
  const res = NextResponse.json({ owner: 'guest', state, dayLimit: session.day_limit, locked });
  if (isNew) setGuestCookie(res, id);
  return res;
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null) as { state?: unknown } | null;
  const state = body?.state;
  if (!validState(state)) return NextResponse.json({ error: '存档格式不对。' }, { status: 400 });
  if (JSON.stringify(state).length > MAX_STATE_BYTES) return NextResponse.json({ error: '存档过大。' }, { status: 413 });

  const db = getDb();
  const user = userFromRequest(req);

  if (user) {
    // 账号的性别以服务端为准，前端改 state.gender 也不会串到别的攻略线
    state.gender = user.gender;
    const payload = JSON.stringify(state);
    db.prepare('INSERT OR REPLACE INTO saves (user_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
      .run(user.id, SAVE_VERSION, payload, Date.now());
    return NextResponse.json({ ok: true, version: SAVE_VERSION });
  }

  // 游客：服务端强制女号，且只允许停在第一天
  state.gender = 'female';
  const { id, isNew } = resolveGuestId(req);
  const session = db.prepare('SELECT day_limit FROM guest_sessions WHERE id = ?').get(id) as Pick<GuestSessionRow, 'day_limit'>;
  if (state.day > session.day_limit) {
    return NextResponse.json(
      { error: '游客只能体验一天，注册后可以继续这段生活。', code: 'guest_limit' },
      { status: 403 },
    );
  }

  const payload = JSON.stringify(state);
  db.prepare('INSERT OR REPLACE INTO guest_saves (guest_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
    .run(id, SAVE_VERSION, payload, Date.now());
  const res = NextResponse.json({ ok: true, version: SAVE_VERSION });
  if (isNew) setGuestCookie(res, id);
  return res;
}
