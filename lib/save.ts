import type { GameState, Gender } from './types';
import { api, ApiError } from './api';
import { migrateSave } from './save-migrate';
import { createInitialState } from './data';

/** 旧版本存在浏览器里的进度，只作为「一次性导入」的来源，不再作为正式存档 */
const LEGACY_KEY = 'wanfeng-yard-save-v1';

export const GUEST_LIMIT_EVENT = 'wy:guest-limit';
export const SESSION_LOST_EVENT = 'wy:session-lost';

export function readLegacyRaw(): unknown | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function loadLegacySave(): GameState | null {
  return migrateSave(readLegacyRaw());
}

export function hasLegacySave(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(LEGACY_KEY);
  } catch {
    return false;
  }
}

export function clearLegacySave() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
}

/** 重新开始：直接用初始状态覆盖服务端存档（游客仍停在第一天） */
export async function resetRemoteSave(gender: Gender): Promise<void> {
  await api.save(createInitialState(gender));
}

/* ---------------- 服务端存档（写多走这里，前端不再落地正式进度） ---------------- */

let pending: GameState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let saving = false;

function emit(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(name));
}

export function saveGame(state: GameState) {
  if (typeof window === 'undefined') return;
  pending = state;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void flushSave(); }, 500);
}

/** 立刻把排队中的状态写到服务端；失败时保留，等待下一次提交重试 */
export async function flushSave(): Promise<void> {
  if (typeof window === 'undefined' || !pending || saving) return;
  if (timer) { clearTimeout(timer); timer = null; }
  const state = pending;
  pending = null;
  saving = true;
  try {
    await api.save(state);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403 && err.code === 'guest_limit') {
        emit(GUEST_LIMIT_EVENT);
      } else if (err.status === 401) {
        emit(SESSION_LOST_EVENT);
      }
    }
    // 网络抖动时把状态放回队列，下一次操作会再试一次
    if (!pending) pending = state;
  } finally {
    saving = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (!pending) return;
    const state = pending;
    pending = null;
    try {
      fetch('/api/save', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({ state }),
      });
    } catch {
      /* ignore */
    }
  });
}
