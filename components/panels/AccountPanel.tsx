'use client';
import { useState } from 'react';
import { api, ApiError, type AccountUser } from '@/lib/api';
import { hasLegacySave, readLegacyRaw } from '@/lib/save';

export default function AccountPanel({
  user, openAuth, close,
}: {
  user: AccountUser | null;
  openAuth: (mode: 'login' | 'register') => void;
  close: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const legacy = hasLegacySave();
  const canImport = !!user && legacy && !user.legacyImported;

  const logout = async () => {
    setBusy(true);
    try {
      await api.logout();
      window.location.reload();
    } catch {
      setBusy(false);
      setErr('退出失败，稍后再试。');
    }
  };

  const importLegacy = async () => {
    const raw = readLegacyRaw();
    if (!raw) { setErr('没有找到本地旧进度。'); return; }
    if (!window.confirm('导入会用这份旧进度覆盖当前账号的存档，且每个账号只能导入一次。继续吗？')) return;
    setBusy(true);
    setErr('');
    try {
      await api.importLegacy(raw);
      setMsg('导入成功，正在回到小院…');
      window.setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '导入失败，稍后再试。');
      setBusy(false);
    }
  };

  return (
    <div className="sheet account-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="acc-head">
        <div className="acc-avatar">{user ? '🏡' : '🌾'}</div>
        <div>
          <div className="acc-name">{user ? user.username : '游客'}</div>
          <div className="acc-sub">
            {user ? `${user.gender === 'female' ? '女号' : '男号'} · 进度已保存到账号` : '女号 · 只能体验一天'}
          </div>
        </div>
      </div>

      {!user && (
        <>
          <div className="acc-note">
            游客进度存在服务端，但只能停在第一个夜晚之前。注册后可以长期保存，也会按你选择的性别安排可攻略的人。
          </div>
          <div className="acc-btns">
            <button className="btn btn-primary" onClick={() => openAuth('register')}>注册账号</button>
            <button className="btn" onClick={() => openAuth('login')}>登录已有账号</button>
          </div>
        </>
      )}

      {user && (
        <>
          {canImport && (
            <div className="acc-import">
              <div className="acc-import-title">找到一份旧的本地进度</div>
              <div className="acc-import-sub">导入后会写进当前账号，每个账号只能导入一次。</div>
              <button className="btn" disabled={busy} onClick={() => void importLegacy()}>导入旧进度</button>
            </div>
          )}
          {msg && <div className="auth-ok">{msg}</div>}
          {err && <div className="auth-err">{err}</div>}
          <div className="acc-btns">
            <button className="btn btn-ghost" disabled={busy} onClick={() => void logout()}>退出登录</button>
          </div>
        </>
      )}

      {!user && err && <div className="auth-err">{err}</div>}
      <div className="acc-close"><button className="btn btn-ghost" onClick={close}>回到小院</button></div>
    </div>
  );
}
