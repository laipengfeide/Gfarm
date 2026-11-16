import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * 账号层表结构见 lib/server/schema.sql：
 * users / saves / sessions / guest_sessions / guest_saves
 */
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'server', 'schema.sql');
const SCHEMA = fs.readFileSync(SCHEMA_PATH, 'utf8');

type Cache = { db: Database.Database | null };

const cache = globalThis as unknown as { __wanfengDb?: Cache };
if (!cache.__wanfengDb) cache.__wanfengDb = { db: null };

export const SAVE_VERSION = 2;

export function getDb(): Database.Database {
  if (cache.__wanfengDb!.db) return cache.__wanfengDb!.db;
  const dir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, 'wanfeng.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  cache.__wanfengDb!.db = db;
  return db;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  gender: 'female' | 'male';
  created_at: number;
  last_login_at: number | null;
  legacy_imported: number;
}

export interface SaveRow {
  user_id: number;
  version: number;
  state: string;
  updated_at: number;
}

export interface GuestSessionRow {
  id: string;
  created_at: number;
  last_seen_at: number;
  day_limit: number;
}
