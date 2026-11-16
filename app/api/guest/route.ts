import { NextResponse, type NextRequest } from 'next/server';
import { resolveGuest } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 游客身份由服务端签发 httpOnly cookie，前端拿不到 id，也就伪造不了别人的进度 */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ guest: 'ok' });
  resolveGuest(req, res);
  return res;
}
