'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Gender } from '@/lib/types';

const NAME_POOLS = {
  female: {
    surnames: ['林', '苏', '何', '沈', '顾', '许', '温', '江'],
    given: ['晓月', '知夏', '晚晴', '清和', '南枝', '予安', '听澜', '今夏'],
    english: ['Lili', 'Nora', 'June', 'Mia', 'Iris', 'Hazel', 'Elin', 'Sora'],
  },
  male: {
    surnames: ['陈', '程', '周', '陆', '宋', '谢', '江', '许'],
    given: ['砚青', '远舟', '知野', '临川', '牧之', '望舒', '南乔', '屿川'],
    english: ['Theo', 'Miles', 'Noah', 'Finn', 'Leo', 'Evan', 'Rowan', 'Kai'],
  },
} as const;

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** 中文「姓+名」为主，偶尔来个英文名；不掺任何测试前缀 */
function makeName(gender: Gender): string {
  const pool = NAME_POOLS[gender];
  if (Math.random() < 0.62) return `${pick(pool.surnames)}${pick(pool.given)}`;
  return pick(pool.english);
}

export default function AuthSheet({
  initialMode = 'login', reason, close, onDone,
}: {
  initialMode?: 'login' | 'register';
  reason?: 'guest';
  close: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [flash, setFlash] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const rollName = async (target: Gender = gender) => {
    if (rolling) return;
    setRolling(true);
    setErr('');
    let candidate = makeName(target);
    // 重名就自己再摇一次，不把「已存在」留到点注册才报
    for (let i = 0; i < 24; i += 1) {
      candidate = makeName(target);
      try {
        const res = await api.checkUsername(candidate);
        if (res.available) break;
      } catch {
        break; // 网络抖动时先填上，注册接口仍会兜底校验
      }
    }
    setUsername(candidate);
    setAutoFilled(true);
    setFlash(true);
    setRolling(false);
    window.setTimeout(() => setFlash(false), 620);
  };

  const switchGender = (next: Gender) => {
    setGender(next);
    if (autoFilled || !username.trim()) void rollName(next);
  };

  const submit = async () => {
    if (busy) return;
    setErr('');
    setBusy(true);
    try {
      if (mode === 'register') await api.register(username, password, gender);
      else await api.login(username, password);
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '网络好像断了，稍后再试。');
      setBusy(false);
    }
  };

  return (
    <div className="sheet auth-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="auth-tabs">
        <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErr(''); }}>登录</button>
        <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErr(''); }}>注册</button>
      </div>

      {reason === 'guest' && (
        <div className="auth-tip">游客只能体验一天。注册之后，今晚和明天都会留在你的小院里。</div>
      )}

      <div className="auth-field">
        <div className="auth-field-head">
          <span>用户名</span>
          {mode === 'register' && (
            <button
              type="button"
              className={`name-dice ${rolling ? 'is-rolling' : ''} ${flash ? 'flash' : ''}`}
              disabled={rolling || busy}
              onClick={() => void rollName()}
            >
              <span className="name-dice-icon">↻</span>{rolling ? '正在想…' : '随机'}
            </button>
          )}
        </div>
        <input
          value={username}
          maxLength={20}
          autoComplete="username"
          placeholder="2-20 个字符，字母 / 数字 / 中文"
          className={flash ? 'auth-input-flash' : ''}
          onChange={(e) => { setUsername(e.target.value); setAutoFilled(false); }}
        />
      </div>
      <label className="auth-field">
        <span>密码</span>
        <input
          type="password"
          value={password}
          maxLength={72}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          placeholder="至少 6 位"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
        />
      </label>

      {mode === 'register' && (
        <div className="auth-gender">
          <span>这段生活的视角</span>
          <div className="auth-gender-btns">
            <button className={`auth-gender-btn ${gender === 'female' ? 'active' : ''}`} onClick={() => switchGender('female')}>
              女 · 她的故事
            </button>
            <button className={`auth-gender-btn ${gender === 'male' ? 'active' : ''}`} onClick={() => switchGender('male')}>
              男 · 他的故事
            </button>
          </div>
          <div className="auth-gender-note">
            {gender === 'female' ? '可攻略：回乡创业的大学生、发小' : '可攻略：青梅竹马、下乡支教的女老师'}
          </div>
        </div>
      )}

      {err && <div className="auth-err">{err}</div>}

      <div className="auth-btns">
        <button className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
          {busy ? '正在核对…' : mode === 'register' ? '注册并回到小院' : '登录'}
        </button>
        <button className="btn btn-ghost" onClick={close}>先不折腾</button>
      </div>

      {mode === 'register' && (
        <div className="auth-foot">游客的进度在性别一致时会带进新账号；密码只以哈希形式保存在本地数据库。</div>
      )}
    </div>
  );
}
