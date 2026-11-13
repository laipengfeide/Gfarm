// 纯前端轻量音效：用 WebAudio 现场合成，不依赖任何音频文件
type SoundKind =
  | 'click' | 'page' | 'harvest' | 'water' | 'feed' | 'cook' | 'success'
  | 'fail' | 'coin' | 'sleep' | 'cast' | 'reel';

const KEY = 'wanfeng-sound';
let enabled = true;
let ctx: AudioContext | null = null;

export function loadSoundPref() {
  try {
    const v = localStorage.getItem(KEY);
    if (v) enabled = v === '1';
  } catch { /* 忽略隐私模式限制 */ }
  return enabled;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
}

export function isSoundEnabled() {
  return enabled;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.06, delay = 0) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  const t0 = ac.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export function play(kind: SoundKind) {
  if (!enabled) return;
  switch (kind) {
    case 'click': tone(520, 0.07, 'sine', 0.035); break;
    case 'page': tone(420, 0.1, 'triangle', 0.04); break;
    case 'harvest':
      tone(660, 0.1, 'sine', 0.05);
      tone(880, 0.12, 'sine', 0.04, 0.07);
      break;
    case 'water':
      tone(300, 0.18, 'triangle', 0.05);
      tone(240, 0.14, 'sine', 0.03, 0.08);
      break;
    case 'feed':
      tone(480, 0.08, 'square', 0.025);
      tone(560, 0.08, 'square', 0.02, 0.06);
      break;
    case 'cook':
      tone(220, 0.3, 'sine', 0.04);
      tone(330, 0.24, 'sine', 0.03, 0.12);
      break;
    case 'success':
      tone(523, 0.14, 'sine', 0.05);
      tone(784, 0.16, 'sine', 0.05, 0.1);
      tone(1046, 0.22, 'sine', 0.04, 0.2);
      break;
    case 'fail': tone(180, 0.28, 'triangle', 0.05); break;
    case 'coin':
      tone(900, 0.07, 'square', 0.03);
      tone(1200, 0.09, 'square', 0.025, 0.05);
      break;
    case 'sleep':
      tone(392, 0.4, 'sine', 0.035);
      tone(262, 0.5, 'sine', 0.03, 0.2);
      break;
    case 'cast': tone(600, 0.2, 'sine', 0.03); break;
    case 'reel': tone(340, 0.16, 'triangle', 0.04); break;
    default: break;
  }
}

let lastClick = 0;

/** 全局点击反馈音：一声很轻的水滴/铃，几十毫秒，音量克制 */
export function playClick() {
  if (!enabled) return;
  const now = Date.now();
  if (now - lastClick < 45) return;
  lastClick = now;
  const base = 720 + Math.random() * 120;
  tone(base, 0.055, 'sine', 0.016);
  tone(base * 1.9, 0.035, 'sine', 0.006, 0.012);
}

export type { SoundKind };
