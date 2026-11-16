import type { NpcId, SceneId } from './types';

/**
 * 热点坐标的唯一来源。
 * 坐标是舞台宽高的百分比（舞台左上角为 0,0），热点以坐标为中心绘制。
 * 规则：同一场景同一时段内，任意两个热点之间至少留出一个药丸宽/高以上的空隙；
 * 修改后请运行 `npm run check:hotspots`，它会枚举性别、时段、节日等全部出现条件做重叠检测。
 */

export interface HotspotPoint {
  x: number;
  y: number;
}

/** 固定互动点（不含日程 NPC；`npc:` 类固定点只是历史占位，实际由日程坐标接管） */
export const FIXED_HOTSPOTS: Record<SceneId, Record<string, HotspotPoint>> = {
  home: {
    meal: { x: 48, y: 62 },
    kitchen: { x: 24, y: 66 },
    wash: { x: 66, y: 64 },
    radio: { x: 58, y: 48 },
    sleep: { x: 45, y: 26 },
  },
  kitchen: {
    cook: { x: 46, y: 62 },
    drink: { x: 28, y: 76 },
    fridge: { x: 20, y: 50 },
    book: { x: 76, y: 46 },
  },
  farm: {
    plots: { x: 50, y: 66 },
    forage: { x: 76, y: 44 },
    tip: { x: 26, y: 42 },
    bugs: { x: 86, y: 72 },
  },
  yard: {
    chicken: { x: 26, y: 56 },
    pig: { x: 70, y: 62 },
    clean: { x: 50, y: 74 },
    well: { x: 46, y: 34 },
  },
  village: {
    grandma: { x: 16, y: 50 },
    cards: { x: 50, y: 62 },
    shop: { x: 78, y: 62 },
    stroll: { x: 46, y: 24 },
    help: { x: 10, y: 36 },
    stream: { x: 64, y: 84 },
    bugs: { x: 30, y: 34 },
  },
  pond: {
    fish: { x: 36, y: 66 },
    uncle: { x: 74, y: 60 },
    bugs: { x: 60, y: 74 },
    cloud: { x: 52, y: 33 },
  },
};

/** 村口节日热点（仅节日当天出现） */
export const FESTIVAL_HOTSPOT: HotspotPoint = { x: 46, y: 88 };

/** 日程 NPC 坐标，键为时间块起始小时（与 NPC_SCHEDULES 的 from 对应） */
export const NPC_HOTSPOTS: Record<NpcId, Record<number, HotspotPoint>> = {
  grandma: {
    6: { x: 16, y: 50 },
    11: { x: 72, y: 32 },
    15: { x: 16, y: 50 },
  },
  girl: {
    9: { x: 60, y: 48 },
    12: { x: 58, y: 42 },
    17: { x: 46, y: 44 },
  },
  uncle: {
    6: { x: 74, y: 60 },
    11: { x: 76, y: 46 },
    14: { x: 74, y: 60 },
  },
  student: {
    6: { x: 22, y: 22 },
    10: { x: 68, y: 30 },
    16: { x: 30, y: 40 },
  },
  buddy: {
    6: { x: 50, y: 26 },
    11: { x: 30, y: 70 },
    17: { x: 30, y: 56 },
  },
  sweetheart: {
    6: { x: 32, y: 26 },
    11: { x: 40, y: 44 },
    17: { x: 55, y: 60 },
  },
  teacher: {
    8: { x: 66, y: 20 },
    12: { x: 64, y: 72 },
    17: { x: 50, y: 55 },
  },
};

export function fixedHotspot(scene: SceneId, id: string): HotspotPoint {
  const point = FIXED_HOTSPOTS[scene][id];
  if (!point) throw new Error(`缺少热点坐标：${scene}:${id}`);
  return point;
}

export function npcHotspot(id: NpcId, from: number): HotspotPoint {
  const point = NPC_HOTSPOTS[id][from];
  if (!point) throw new Error(`缺少 NPC 热点坐标：${id}@${from}`);
  return point;
}
