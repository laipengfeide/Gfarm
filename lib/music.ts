// 背景音乐：一首《故乡的原风景》循环，首次交互后淡入，音量随场景轻微变化
const KEY = 'wanfeng-music';
const SRC = 'assets/bgm/guxiang.mp3';

let audio: HTMLAudioElement | null = null;
let enabled = true;
let target = 0.32;
let timer: number | null = null;
let armed = false;

function track(scene?: string) {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
  }
  return audio;
}

function fadeTo(next: number) {
  const a = track();
  if (!a) return;
  target = next;
  if (timer !== null) return;
  timer = window.setInterval(() => {
    if (!audio) return;
    const diff = target - audio.volume;
    if (Math.abs(diff) < 0.01) {
      audio.volume = Math.max(0, Math.min(1, target));
      window.clearInterval(timer as number);
      timer = null;
      if (target === 0) audio.pause();
      return;
    }
    audio.volume = Math.max(0, Math.min(1, audio.volume + (diff > 0 ? 0.012 : -0.02)));
  }, 100);
}

function start() {
  const a = track();
  if (!a) return;
  const p = a.play();
  if (p && typeof p.then === 'function') {
    p.then(() => fadeTo(target)).catch(() => { /* 浏览器仍禁止则等下一次手势 */ });
  } else {
    fadeTo(target);
  }
}

export function loadMusicPref() {
  try {
    const v = localStorage.getItem(KEY);
    if (v) enabled = v === '1';
  } catch { /* 忽略隐私模式限制 */ }
  return enabled;
}

export function isMusicEnabled() {
  return enabled;
}

/** 首次点击/按键后开始播放（浏览器自动播放策略） */
export function armMusic() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  loadMusicPref();
  const kick = () => {
    window.removeEventListener('pointerdown', kick);
    window.removeEventListener('keydown', kick);
    if (enabled) start();
  };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('keydown', kick, { once: true });
}

export function setMusicEnabled(v: boolean) {
  enabled = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
  if (v) start();
  else fadeTo(0);
}

/** 场景切换：只是轻微调整音量，曲子仍是同一首 */
export function musicScene(scene: string) {
  const map: Record<string, number> = {
    home: 0.32, kitchen: 0.3, farm: 0.28, yard: 0.3, village: 0.34, pond: 0.3,
  };
  const vol = map[scene] ?? 0.3;
  if (audio && enabled) fadeTo(vol);
  else target = vol;
}
