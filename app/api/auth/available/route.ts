import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/server/db';
import { isValidUsername } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 只读的用户名占用检查：注册规则与注册接口本身不变 */
export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get('username') ?? '').trim();
  if (!isValidUsername(name)) return NextResponse.json({ available: false, reason: 'invalid' });
  const row = getDb().prepare('SELECT id FROM users WHERE username = ?').get(name);
  return NextResponse.json({ available: !row, reason: row ? 'taken' : undefined });
}
