import type { Gender, GameState } from './types';

export interface AccountUser {
  username: string;
  gender: Gender;
  legacyImported: boolean;
}

export interface SavePayload {
  owner: 'user' | 'guest';
  state: GameState | null;
  /** 游客模式只允许体验一天，服务端也会再校验一次 */
  dayLimit: number | null;
  /** 游客进度已经越过一天上限，只能注册后继续 */
  locked?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? '请求失败，请稍后再试。', res.status, (data as { code?: string }).code);
  }
  return data as T;
}

export const api = {
  me: () => request<{ user: AccountUser | null }>('/api/auth/me'),
  ensureGuest: () => request<{ guest: string }>('/api/guest', { method: 'POST' }),
  register: (username: string, password: string, gender: Gender) =>
    request<{ user: AccountUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, gender }),
    }),
  login: (username: string, password: string) =>
    request<{ user: AccountUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  checkUsername: (username: string) =>
    request<{ available: boolean; reason?: 'taken' | 'invalid' }>(
      `/api/auth/available?username=${encodeURIComponent(username)}`,
    ),
  loadSave: () => request<SavePayload>('/api/save'),
  save: (state: GameState) =>
    request<{ ok: true }>('/api/save', { method: 'PUT', body: JSON.stringify({ state }) }),
  importLegacy: (state: unknown) =>
    request<{ ok: true }>('/api/save/import', {
      method: 'PUT',
      body: JSON.stringify({ state }),
    }),
};
