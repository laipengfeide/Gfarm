'use client';
import { useState } from 'react';
import { WEATHER_INFO } from '@/lib/data';
import type { GameEngine } from '@/lib/engine';

/* ==================== 洗漱 / 洗澡 ==================== */
const LOCATION_TEXT = {
  home: { name: '家里的水缸', note: '烧一锅热水，关起门慢慢洗。', bath: '烧水洗澡' },
  well: { name: '小院井边', note: '井水凉，洗起来痛快。', bath: '打水冲澡' },
  stream: { name: '村口溪边', note: '活水清凉，洗完神清气爽。', bath: '下溪洗澡' },
};

export function WashPanel({
  engine, location, close,
}: { engine: GameEngine; location: 'home' | 'well' | 'stream'; close: () => void }) {
  const s = engine.state;
  const [bathDone, setBathDone] = useState(false);
  const loc = LOCATION_TEXT[location];
  const dirtyLevel = s.hygiene > 75 ? '还算清爽' : s.hygiene > 50 ? '有些灰尘' : s.hygiene > 28 ? '身上都是泥点子' : '脏得不行了';

  if (bathDone) {
    return (
      <div className="sheet bath-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bubbles">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="bubble" style={{
              left: `${(i * 5.4 + 6) % 100}%`,
              animationDelay: `${(i % 6) * 0.25}s`,
              width: `${12 + (i % 4) * 8}px`,
              height: `${12 + (i % 4) * 8}px`,
            }} />
          ))}
        </div>
        <div className="sleep-icon">🫧</div>
        <div className="sleep-title">洗好了，一身松快</div>
        <div className="sleep-sub">
          {loc.name}的水汽把镜子糊住了。<br />
          清洁度 {Math.round(s.hygiene)} · 健康 {Math.round(s.health)} · 感冒 {s.cold > 0 ? '还没好' : '无'}
        </div>
        <div className="sleep-btns"><button className="btn btn-primary" onClick={close}>擦干头发</button></div>
      </div>
    );
  }

  return (
    <div className="sheet" style={{ width: 'min(560px,94vw)' }} onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🛁</span>洗漱</div>
          <div className="sheet-sub">{loc.name} · {loc.note}</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>

      <div className="care-stat">
        <div className="care-row">
          <span>清洁度</span>
          <div className="bar"><i style={{ width: `${s.hygiene}%` }} /></div>
          <b>{Math.round(s.hygiene)}</b>
        </div>
        <div className="care-row">
          <span>健康度</span>
          <div className="bar health"><i style={{ width: `${s.health}%` }} /></div>
          <b>{Math.round(s.health)}</b>
        </div>
        <div className="care-state">{dirtyLevel}{s.hygiene < 30 ? ' · 再拖下去身体会吃不消' : ''}</div>
      </div>

      <div className="care-actions">
        <button className="care-card" onClick={() => engine.washFace()}>
          <span className="care-ico">💧</span>
          <b>洗把脸</b>
          <span>10 分钟 · 清洁 +10</span>
        </button>
        <button className="care-card" onClick={() => engine.washClothes()}>
          <span className="care-ico">👗</span>
          <b>洗衣服</b>
          <span>30 分钟 · 清洁 +26</span>
        </button>
        <button
          className="care-card primary"
          disabled={(s.inventory.tea ?? 0) < 0}
          onClick={() => { if (engine.takeBath(location)) setBathDone(true); }}
        >
          <span className="care-ico">🫧</span>
          <b>{loc.bath}</b>
          <span>45 分钟 · 清洁 +{55 + (location === 'stream' ? 8 : location === 'well' ? 4 : 0)} · 心情 +8</span>
        </button>
      </div>

      <div className="farm-tip" style={{ marginTop: 14 }}>
        干农活会沾一身泥，下雨天衣服湿了也容易着凉。
        洗澡效果最好，但更花时间和体力；洗脸只能应个急。
      </div>
    </div>
  );
}

/* ==================== 收音机 / 天气 ==================== */
export function RadioPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const f = engine.forecast();
  const s = engine.state;
  return (
    <div className="sheet radio-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">📻</span>旧收音机</div>
          <div className="sheet-sub">吱呀两声，播音员的声音从海那边传过来</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>

      <div className="radio-box">
        <div className="radio-dial">
          <span className="radio-wave" />
          <div className="radio-numbers"><span>88</span><span>96</span><span>104</span><span>108</span></div>
        </div>
        <div className="forecast">
          <div className="forecast-today">
            <span className="fc-ico">{f.today.icon}</span>
            <div>
              <b>今天 · {f.today.label}</b>
              <span>{f.today.note}</span>
            </div>
          </div>
          <div className="forecast-next">
            <span className="fc-ico">{f.tomorrow.icon}</span>
            <div>
              <b>明天 · {f.tomorrow.label}</b>
              <span>{f.tomorrow.note}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="care-actions" style={{ marginTop: 14 }}>
        <button className="care-card" onClick={() => engine.drinkTea()} disabled={(s.inventory.tea ?? 0) <= 0}>
          <span className="care-ico">🍵</span>
          <b>泡一壶茶</b>
          <span>15 分钟 · 心情 +10 · 茶叶 {(s.inventory.tea ?? 0)}</span>
        </button>
        <button className="care-card" onClick={close}>
          <span className="care-ico">🌙</span>
          <b>关掉收音机</b>
          <span>把明天的安排记在心里</span>
        </button>
      </div>

      <div className="farm-tip" style={{ marginTop: 12 }}>
        雷雨天不要下地；小雨会把菜地浇透，但淋久了容易感冒。
        知道明天的天气，就能提前决定今天是先干活还是先洗澡。
      </div>
    </div>
  );
}

/* ==================== 健康 / 吃药 ==================== */
export function HealthPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  const cold = s.cold;
  const state = cold <= 0 ? '没感冒' : cold < 35 ? '有点鼻塞' : cold < 65 ? '感冒加重了' : '咳得厉害';
  return (
    <div className="sheet" style={{ width: 'min(540px,94vw)' }} onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">{cold > 0 ? '🤒' : '🌿'}</span>身体状况</div>
          <div className="sheet-sub">健康 {Math.round(s.health)} / 100 · 清洁 {Math.round(s.hygiene)} / 100</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>

      <div className="care-stat">
        <div className="care-row">
          <span>健康度</span>
          <div className="bar health"><i style={{ width: `${s.health}%` }} /></div>
          <b>{Math.round(s.health)}</b>
        </div>
        <div className="care-row">
          <span>感冒</span>
          <div className="bar cold"><i style={{ width: `${cold}%` }} /></div>
          <b>{cold > 0 ? Math.round(cold) : 0}</b>
        </div>
        <div className="care-state">
          {cold > 0
            ? `${state}。今天已服药 ${s.medicineToday}/2 次，按时吃完两天才会好转。`
            : `${state}。身体状态还算稳，注意别淋雨。`}
        </div>
      </div>

      <div className="care-actions">
        <button className="care-card primary" onClick={() => engine.takeMedicine()} disabled={cold <= 0 || s.medicineToday >= 2 || (s.inventory.medicine ?? 0) <= 0}>
          <span className="care-ico">💊</span>
          <b>吃感冒药</b>
          <span>剩 {(s.inventory.medicine ?? 0)} 盒 · 今天第 {s.medicineToday}/2 次</span>
        </button>
        <button className="care-card" onClick={() => engine.washFace()}>
          <span className="care-ico">💧</span>
          <b>洗把脸</b>
          <span>清醒一下 · 清洁 +10</span>
        </button>
      </div>

      <div className="farm-tip" style={{ marginTop: 12 }}>
        清洁度低于 30、或者饿着肚子睡觉，健康都会慢慢往下掉。
        感冒期间干活会更累、收获也会少一些，早点吃药。
      </div>
    </div>
  );
}
