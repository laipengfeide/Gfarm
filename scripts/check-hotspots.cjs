/**
 * 热点重叠防回归检查（开发时运行：npm run check:hotspots）
 *
 * 坐标来自 lib/hotspot-layout.ts，出现条件来自 lib/data.ts：
 * - 固定互动点：始终出现
 * - 日程 NPC：按性别可见范围 + 时段 + 场景
 * - 村口节日：每季第 4 天（第 4/11/18/25 天）
 * 天气与季节只影响背景，不影响热点出现与坐标，因此不参与枚举。
 *
 * 检测规则：按实际药丸尺寸（按文字长度估算，另加安全边距）换算成像素，
 * 同场景同一条件下任意两个热点矩形不得相交，且至少保留 8px 间距。
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');

/* ---- 允许直接 require 项目里的 .ts 配置 ---- */
require.extensions['.ts'] = function (module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const out = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  module._compile(out, filename);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if ((request.startsWith('./') || request.startsWith('../')) && !path.extname(request)) {
    const base = path.resolve(path.dirname(parent.filename), request);
    for (const ext of ['.ts', '.tsx', '.js', '.json']) {
      if (fs.existsSync(base + ext)) return originalResolve.call(this, base + ext, parent, isMain, options);
    }
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const {
  SCENES, SCENE_ORDER, NPCS, NPC_SCHEDULES, npcVisibleFor, festivalForDay, seasonForDay, seasonDayForDay,
} = require(path.join(ROOT, 'lib/data.ts'));
const { FIXED_HOTSPOTS, FESTIVAL_HOTSPOT, NPC_HOTSPOTS } = require(path.join(ROOT, 'lib/hotspot-layout.ts'));

/* ---- 尺寸估算：与 app/globals.css 中 .hotspot 的字号/padding 对齐 ---- */
function metrics(viewportWidth) {
  const compact = viewportWidth <= 1180;
  return {
    base: compact ? 23 + 28 + 10 : 29 + 32 + 10, // padding + 图标 + 间距
    labelFont: compact ? 13 : 14,
    labelSpacing: compact ? 0.08 : 0.08,
    noteFont: 10,
    noteSpacing: 0.05,
    height: compact ? 50 : 54,
    safety: 3,
  };
}
function isCJK(ch) {
  return /[\u3000-\u9fff\uff00-\uffef]/.test(ch);
}
function textWidth(text, font, spacing) {
  let w = 0;
  for (const ch of text) {
    if (ch === ' ') w += 3;
    else if (ch === '·' || ch === '•') w += 5;
    else if (isCJK(ch)) w += font + font * spacing;
    else if (/[0-9]/.test(ch)) w += 6.2;
    else w += 7.2;
  }
  return w;
}
function pillSize(spot, m) {
  const label = textWidth(spot.label, m.labelFont, m.labelSpacing);
  const note = spot.note ? textWidth(spot.note, m.noteFont, m.noteSpacing) : 0;
  const width = m.base + Math.max(label, note) + m.safety;
  return { w: width, h: m.height };
}
function rectAt(spot, vw, vh, m) {
  const { w, h } = pillSize(spot, m);
  return { left: (spot.x / 100) * vw - w / 2, top: (spot.y / 100) * vh - h / 2, right: (spot.x / 100) * vw + w / 2, bottom: (spot.y / 100) * vh + h / 2, w, h };
}
function intersects(a, b, pad) {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

/* ---- 出现条件枚举 ---- */
const HOURS = Array.from({ length: 24 }, (_, h) => h * 60 + 30); // 每个整点时段取 :30，覆盖所有日程块
const VIEWPORTS = [
  { w: 1920, h: 1080 },
  { w: 1600, h: 900 },
  { w: 1440, h: 900 },
  { w: 1366, h: 768 },
  { w: 1280, h: 720 },
  { w: 1180, h: 800 },
  { w: 1024, h: 768 },
];

function spotsFor(scene, gender, minutes, day) {
  const list = [];
  for (const h of SCENES[scene].hotspots) {
    if (h.action.startsWith('npc:')) continue; // 固定 npc 点由日程坐标接管
    list.push({ key: `${scene}:${h.id}`, label: h.label, note: h.note, x: h.x, y: h.y });
  }
  for (const id of npcVisibleFor(gender)) {
    const block = NPC_SCHEDULES[id].find((b) => minutes / 60 >= b.from && minutes / 60 < b.to);
    if (!block || block.scene !== scene) continue;
    const point = NPC_HOTSPOTS[id][block.from];
    list.push({ key: `${scene}:npc-${id}@${block.from}`, label: NPCS[id].name, note: block.note, x: point.x, y: point.y });
  }
  if (scene === 'village' && festivalForDay(day)) {
    list.push({ key: 'village:festival', label: '节日', note: '今天的村子格外热闹', x: FESTIVAL_HOTSPOT.x, y: FESTIVAL_HOTSPOT.y });
  }
  return list;
}

/* ---- 坐标表 ---- */
console.log('# 热点坐标表（x/y 为舞台百分比）\n');
console.log('| 场景 | 热点 | x | y | 出现条件 |');
console.log('| --- | --- | --- | --- | --- |');
for (const scene of SCENE_ORDER) {
  for (const h of SCENES[scene].hotspots) {
    if (h.action.startsWith('npc:')) continue;
    console.log(`| ${SCENES[scene].name} | ${h.label} | ${h.x} | ${h.y} | 固定 |`);
  }
}
for (const id of Object.keys(NPC_SCHEDULES)) {
  for (const b of NPC_SCHEDULES[id]) {
    const p = NPC_HOTSPOTS[id][b.from];
    const gender = id === 'grandma' || id === 'girl' || id === 'uncle'
      ? '游客/全部'
      : (npcVisibleFor('female').includes(id) ? '女号' : '男号');
    console.log(`| ${SCENES[b.scene].name} | ${NPCS[id].name} | ${p.x} | ${p.y} | ${gender} · ${b.from}:00-${b.to}:00 |`);
  }
}
console.log(`| 村口 | 节日 | ${FESTIVAL_HOTSPOT.x} | ${FESTIVAL_HOTSPOT.y} | 每季第 4 天（第 4/11/18/25 天） |\n`);

/* ---- 全条件扫描 ---- */
const overlaps = [];
let checked = 0;
for (const vp of VIEWPORTS) {
  const m = metrics(vp.w);
  for (const gender of ['female', 'male']) {
    for (const scene of SCENE_ORDER) {
      for (const minutes of HOURS) {
        for (let day = 1; day <= 28; day++) {
          const festival = scene === 'village' ? festivalForDay(day) : null;
          if (scene === 'village' && !festival && day > 7) continue; // 非节日时村口与 day 无关，取前 7 天即可
          const spots = spotsFor(scene, gender, minutes, day);
          checked++;
          for (let i = 0; i < spots.length; i++) {
            for (let j = i + 1; j < spots.length; j++) {
              const a = rectAt(spots[i], vp.w, vp.h, m);
              const b = rectAt(spots[j], vp.w, vp.h, m);
              if (intersects(a, b, 4)) {
                overlaps.push({
                  vp, gender, scene, minutes, day,
                  a: spots[i], b: spots[j],
                  gapX: Math.round(Math.max(a.left - b.right, b.left - a.right)),
                  gapY: Math.round(Math.max(a.top - b.bottom, b.top - a.bottom)),
                });
              }
            }
          }
        }
      }
    }
  }
}

if (!overlaps.length) {
  console.log(`检查通过：${VIEWPORTS.length} 种视口 × 2 性别 × 6 场景 × 24 时段 × 28 天，共 ${checked} 组条件，0 处重叠。`);
  process.exit(0);
}

console.log(`发现 ${overlaps.length} 处重叠：\n`);
const seen = new Set();
for (const o of overlaps) {
  const key = `${o.vp.w}x${o.vp.h}|${o.gender}|${o.scene}|${o.a.key}|${o.b.key}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`- ${o.vp.w}×${o.vp.h} ${o.scene} ${String(Math.floor(o.minutes / 60)).padStart(2, '0')}:30 ${o.gender === 'female' ? '女号' : '男号'} 第${o.day}天`);
  console.log(`  ${o.a.label}(${o.a.x},${o.a.y}) × ${o.b.label}(${o.b.x},${o.b.y})  间距 x=${o.gapX} y=${o.gapY}`);
}
process.exit(1);
