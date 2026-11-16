import { NextResponse, type NextRequest } from 'next/server';
import { userFromRequest } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  return NextResponse.json({
    user: user
      ? { username: user.username, gender: user.gender, legacyImported: user.legacyImported }
      : null,
  });
}
