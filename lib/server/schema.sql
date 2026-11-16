-- 晚风小院 · 账号层表结构（测试期可直接删库重建）
-- users          账号：用户名 / 密码哈希 / 性别 / 创建时间 / 最后登录
-- saves          正式存档：每个账号一份，带存档版本号、状态 JSON、更新时间
-- sessions       登录会话：HttpOnly cookie 里的随机 token 只做索引，权限在服务端判定
-- guest_sessions 游客会话：临时身份 + 一天上限的判定依据
-- guest_saves    游客临时存档：与正式存档隔离，过了第一天就不能再写

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male')),
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  legacy_imported INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL,
  state TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guest_sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  day_limit INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS guest_saves (
  guest_id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  state TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (guest_id) REFERENCES guest_sessions(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_saves_updated ON saves(updated_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_guest_saves_updated ON guest_saves(updated_at);
