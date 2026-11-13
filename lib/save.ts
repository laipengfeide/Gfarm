import type { GameState } from './types';
import { createInitialState, initialPlot } from './data';

const SAVE_KEY = 'wanfeng-yard-save-v1';

export function saveGame(state: GameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage 不可用时静默降级 */
  }
}

export function hasSave(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed !== 'object') return null;
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
      plots: (parsed.plots ?? base.plots).map((p) => ({ ...initialPlot(), ...p })).slice(0, 6),
      dishes: Array.isArray(parsed.dishes) ? parsed.dishes : [],
    };
    if (merged.plots.length < 6) {
      while (merged.plots.length < 6) merged.plots.push(initialPlot());
    }
    return merged;
  } catch {
    return null;
  }
}

export function clearSave() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
