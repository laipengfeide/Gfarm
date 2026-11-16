#!/usr/bin/env node
/**
 * 仅测试数据，上线前必须清理。
 * 给本地账号层塞两个可试玩的账号 + 一份超出一天的游客记录。
 * 生产环境不要执行这个脚本，也不要把生成的 data/ 提交到仓库。
 *
 * 用法：node scripts/seed-test-data.cjs
 * 账号：test_girl / wanfeng123（女号）、test_boy / wanfeng123（男号）
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'wanfeng.db');
const USER_PASSWORD = 'wanfeng123';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function npc(points, lastTalkDay) {
  return { points, lastTalkDay };
}

function story(level, romance, seen) {
  return { level, seen: seen || [], romance };
}

function baseNpcs(overrides) {
  const ids = ['grandma', 'girl', 'uncle', 'student', 'buddy', 'sweetheart', 'teacher'];
  const out = {};
  ids.forEach((id) => { out[id] = npc(0, 0); });
  Object.keys(overrides).forEach((id) => { out[id] = overrides[id]; });
  return out;
}

function baseStories(overrides) {
  const ids = ['grandma', 'girl', 'uncle', 'student', 'buddy', 'sweetheart', 'teacher'];
  const out = {};
  ids.forEach((id) => { out[id] = story(0, false, []); });
  Object.keys(overrides).forEach((id) => { out[id] = overrides[id]; });
  return out;
}

function femaleSave() {
  return {
    version: 2,
    gender: 'female',
    day: 5,
    minutes: 9 * 60 + 20,
    coins: 486,
    lastSavedAt: Date.now(),
    plots: [],
    npcs: baseNpcs({
      grandma: npc(14, 4),
      girl: npc(11, 4),
      uncle: npc(9, 3),
      student: npc(24, 5),
      buddy: npc(10, 3),
    }),
    npcStories: baseStories({
      student: story(3, true, ['老屋能不能做成客栈', '游客路线吵起来了']),
      buddy: story(2, false, ['修车摊前的沉默']),
      grandma: story(2, false, ['晒被子那天']),
    }),
  };
}

function maleSave() {
  return {
    version: 2,
    gender: 'male',
    day: 9,
    minutes: 18 * 60 + 40,
    coins: 912,
    lastSavedAt: Date.now(),
    plots: [],
    npcs: baseNpcs({
      grandma: npc(16, 8),
      girl: npc(12, 7),
      uncle: npc(11, 6),
      sweetheart: npc(28, 9),
      teacher: npc(15, 8),
    }),
    npcStories: baseStories({
      sweetheart: story(4, true, ['太熟了反而说不出', '豆角架下的那句没说出口']),
      teacher: story(2, false, ['城里来的第一堂课']),
      grandma: story(3, false, ['阿婆的旧相册']),
    }),
  };
}

function overLimitGuestSave() {
  return {
    version: 2,
    gender: 'female',
    day: 2,
    minutes: 8 * 60,
    coins: 120,
    lastSavedAt: Date.now(),
    plots: [],
    npcs: baseNpcs({ student: npc(6, 1) }),
    npcStories: baseStories({}),
  };
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('没有找到 data/wanfeng.db，先启动一次服务端让表结构建好再执行 seed。');
    process.exit(1);
  }
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(ROOT, 'lib', 'server', 'schema.sql'), 'utf8'));

  const now = Date.now();
  const femaleHash = hashPassword(USER_PASSWORD);
  const maleHash = hashPassword(USER_PASSWORD);

  const seed = db.transaction(() => {
    db.prepare("DELETE FROM users WHERE username IN ('test_girl', 'test_boy')").run();
    db.prepare("DELETE FROM guest_sessions WHERE id = 'test_guest_overlimit'").run();

    const girlId = Number(db.prepare(
      'INSERT INTO users (username, password_hash, gender, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)',
    ).run('test_girl', femaleHash, 'female', now - 86400000, now).lastInsertRowid);
    db.prepare('INSERT INTO saves (user_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
      .run(girlId, 2, JSON.stringify(femaleSave()), now - 3600000);

    const boyId = Number(db.prepare(
      'INSERT INTO users (username, password_hash, gender, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)',
    ).run('test_boy', maleHash, 'male', now - 172800000, now - 7200000).lastInsertRowid);
    db.prepare('INSERT INTO saves (user_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
      .run(boyId, 2, JSON.stringify(maleSave()), now - 7200000);

    db.prepare('INSERT INTO guest_sessions (id, created_at, last_seen_at, day_limit) VALUES (?, ?, ?, 1)')
      .run('test_guest_overlimit', now - 86400000, now - 3600000);
    db.prepare('INSERT INTO guest_saves (guest_id, version, state, updated_at) VALUES (?, ?, ?, ?)')
      .run('test_guest_overlimit', 2, JSON.stringify(overLimitGuestSave()), now - 3600000);

    return { girlId, boyId };
  });

  const ids = seed();
  const rows = db.prepare('SELECT id, username, gender, last_login_at FROM users ORDER BY id').all();
  const guestRows = db.prepare('SELECT id, day_limit FROM guest_sessions').all();
  const guestSaveRows = db.prepare('SELECT guest_id, version FROM guest_saves').all();
  db.close();

  console.log('测试数据已写入（仅测试用途，勿用于正式环境）');
  console.log(`库文件：${DB_PATH}`);
  console.log(`账号：test_girl / ${USER_PASSWORD}（女号，第 5 天，486 文，程远好感 24） id=${ids.girlId}`);
  console.log(`账号：test_boy / ${USER_PASSWORD}（男号，第 9 天，912 文，苏棠好感 28） id=${ids.boyId}`);
  console.log('游客超限记录：guest_id=test_guest_overlimit（存档第 2 天，day_limit=1，用于验证拦截）');
  console.log('当前 users：', JSON.stringify(rows));
  console.log('当前 guest_sessions：', JSON.stringify(guestRows));
  console.log('当前 guest_saves：', JSON.stringify(guestSaveRows));
}

main();
