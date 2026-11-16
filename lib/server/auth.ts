import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { getDb, type UserRow } from './db';
import type { Gender } from '@/lib/types';

export const SESSION_COOKIE = 'wy_session';
export const GUEST_COOKIE = 'wy_guest';
const SESSION_DAYS = 30;

export interface SessionUser {
  id: number;
  username: string;
  gender: Gender;
  legacyImported: boolean;
}

export function isGender(v: unknown): v is Gender {
  return v === 'female' || v === 'male';
}

export function publicUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    username: row.username,
    gender: row.gender,
    legacyImported: row.legacy_imported === 1,
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function createSession(userId: number): { token: string; expiresAt: number } {
  const db = getDb();
  const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, userId, now, expiresAt);
  return { token, expiresAt };
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: number) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export function destroySession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function userFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, Date.now()) as UserRow | undefined;
  return row ? publicUser(row) : null;
}

/** 游客身份只存在于 httpOnly cookie + 服务端，前端拿不到也改不了别人的存档 */
export function resolveGuestId(req: NextRequest): { id: string; isNew: boolean } {
  const db = getDb();
  const existing = req.cookies.get(GUEST_COOKIE)?.value;
  if (existing) {
    const row = db.prepare('SELECT id FROM guest_sessions WHERE id = ?').get(existing) as { id: string } | undefined;
    if (row) {
      db.prepare('UPDATE guest_sessions SET last_seen_at = ? WHERE id = ?').run(Date.now(), row.id);
      return { id: row.id, isNew: false };
    }
  }
  const id = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO guest_sessions (id, created_at, last_seen_at, day_limit) VALUES (?, ?, ?, 1)')
    .run(id, now, now);
  return { id, isNew: true };
}

export function setGuestCookie(res: NextResponse, id: string) {
  res.cookies.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  });
}

/** 兼容写法：拿到游客 id，必要时顺手把 cookie 种到响应上 */
export function resolveGuest(req: NextRequest, res: NextResponse): string {
  const { id, isNew } = resolveGuestId(req);
  if (isNew) setGuestCookie(res, id);
  return id;
}

export function guestIdFrom(req: NextRequest): string | null {
  const id = req.cookies.get(GUEST_COOKIE)?.value;
  if (!id) return null;
  const row = getDb().prepare('SELECT id FROM guest_sessions WHERE id = ?').get(id) as { id: string } | undefined;
  return row ? id : null;
}

export function isValidUsername(name: string): boolean {
  if (name.length < 2 || name.length > 20) return false;
  return /^[\w\u4e00-\u9fa5-]+$/.test(name);
}

export function validateCredentials(username: unknown, password: unknown): { username: string; password: string } | null {
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  const name = username.trim();
  if (!isValidUsername(name)) return null;
  if (password.length < 6 || password.length > 72) return null;
  return { username: name, password };
}
