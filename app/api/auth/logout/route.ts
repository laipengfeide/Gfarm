import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie, destroySession } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  destroySession(req);
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
