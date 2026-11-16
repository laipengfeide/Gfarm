import type { GameState } from './types';
import { createInitialState, initialPlot } from './data';

/**
 * 把任意来源的旧存档（localStorage / 数据库里的 JSON）补齐成当前版本的完整状态。
 * 客户端读取本地老存档、服务端导入老存档都走这里，避免两套兼容逻辑。
 */
export function migrateSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as Partial<GameState>;
  const base = createInitialState();
  const merged: GameState = {
    ...base,
    ...parsed,
    inventory: { ...base.inventory, ...(parsed.inventory ?? {}) },
    chickens: { ...base.chickens, ...(parsed.chickens ?? {}) },
    pig: { ...base.pig, ...(parsed.pig ?? {}) },
    npcs: { ...base.npcs, ...(parsed.npcs ?? {}) },
    meta: { ...base.meta, ...(parsed.meta ?? {}) },
    stock: { ...base.stock, ...(parsed.stock ?? {}) },
    quests: { ...base.quests, ...(parsed.quests ?? {}) },
    discovered: { ...base.discovered, ...(parsed.discovered ?? {}) },
    counters: { ...base.counters, ...(parsed.counters ?? {}) },
    streak: { ...base.streak, ...(parsed.streak ?? {}) },
    rating: {
      ...base.rating,
      ...(parsed.rating ?? {}),
      dims: { ...base.rating.dims, ...(parsed.rating?.dims ?? {}) },
    },
    collections: { ...base.collections, ...(parsed.collections ?? {}) },
    npcStories: { ...base.npcStories, ...(parsed.npcStories ?? {}) },
    lastSavedAt: typeof parsed.lastSavedAt === 'number' ? parsed.lastSavedAt : Date.now(),
    offlineReport: parsed.offlineReport ?? null,
    version: 2,
    plots: (parsed.plots ?? base.plots).map((p) => ({ ...initialPlot(), ...p })).slice(0, 6),
    dishes: Array.isArray(parsed.dishes) ? parsed.dishes : [],
  };
  while (merged.plots.length < 6) merged.plots.push(initialPlot());
  return merged;
}
