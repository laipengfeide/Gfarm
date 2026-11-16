'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CROPS, CLOCK_TEXT, NAV_ICONS, NPCS, QUESTS, SCENES, SCENE_ORDER, TIME_LABEL, WEATHER_INFO,
  SEASON_INFO, createInitialState, festivalForDay, npcScheduleFor, npcVisibleFor, seasonForDay, seasonDayForDay, seasonText,
} from '@/lib/data';
import { GameEngine, type SleepSummary } from '@/lib/engine';
import {
  GUEST_LIMIT_EVENT, SESSION_LOST_EVENT, flushSave, hasLegacySave, readLegacyRaw, saveGame,
} from '@/lib/save';
import { api, ApiError, type AccountUser } from '@/lib/api';
import { migrateSave } from '@/lib/save-migrate';
import { isSoundEnabled, loadSoundPref, play, setSoundEnabled, type SoundKind } from '@/lib/audio';
import { armMusic, isMusicEnabled, loadMusicPref, musicScene, setMusicEnabled } from '@/lib/music';
import { FESTIVAL_HOTSPOT } from '@/lib/hotspot-layout';
import ClickFX from '@/components/ClickFX';
import BgImage from '@/components/BgImage';
import type { GameState, NpcId, OfflineReport, SceneId, ToastKind } from '@/lib/types';
import FarmPanel from '@/components/panels/FarmPanel';
import CookingPanel from '@/components/panels/CookingPanel';
import { NpcPanel, ShopPanel, CardsPanel } from '@/components/panels/VillagePanels';
import { FishingPanel } from '@/components/panels/FishingPanel';
import {
  BagPanel, CodexPanel, MealsPanel, ChickenPanel, PigPanel, SleepPanel, SummaryPanel, MenuPanel, OfflinePanel,
  FestivalPanel,
} from '@/components/panels/SidePanels';
import { WashPanel, RadioPanel, HealthPanel } from '@/components/panels/CarePanels';
import DrinksPanel from '@/components/panels/DrinksPanel';
import Petals from '@/components/Petals';
import AuthSheet from '@/components/AuthSheet';
import AccountPanel from '@/components/panels/AccountPanel';

type Overlay =
  | { type: 'farm' } | { type: 'cook' } | { type: 'meals' } | { type: 'bag' } | { type: 'codex' }
  | { type: 'shop' } | { type: 'cards' } | { type: 'fishing' } | { type: 'sleep' }
  | { type: 'menu' } | { type: 'chicken' } | { type: 'pig' } | { type: 'radio' } | { type: 'health' }
  | { type: 'wash'; location: 'home' | 'well' | 'stream' }
  | { type: 'drink' }
  | { type: 'npc'; id: NpcId } | { type: 'summary'; data: SleepSummary }
  | { type: 'offline'; data: OfflineReport }
  | { type: 'festival' }
  | { type: 'account' }
  | { type: 'auth'; mode: 'login' | 'register'; reason?: 'guest' };

interface ToastItem { id: number; msg: string; kind: ToastKind }

interface BootInfo {
  user: AccountUser | null;
  hasSave: boolean;
  hasLegacy: boolean;
  guestLocked: boolean;
}

export default function GameClient() {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [offline, setOffline] = useState<OfflineReport | null>(null);
  const [boot, setBoot] = useState<BootInfo | null>(null);
  const [bootError, setBootError] = useState('');
  const [starting, setStarting] = useState(false);

  // 进游戏前先问服务端「我是谁、我有没有存档」，前端不碰正式存档
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.me();
        if (!me.user) await api.ensureGuest();
        const payload = await api.loadSave();
        if (!alive) return;
        setBoot({ user: me.user, hasSave: !!payload.state, hasLegacy: hasLegacySave(), guestLocked: !!payload.locked });
      } catch {
        if (!alive) return;
        setBootError('没有连上小院的服务端，请确认本地服务在运行后刷新。');
        setBoot({ user: null, hasSave: false, hasLegacy: hasLegacySave(), guestLocked: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  const start = async (fresh: boolean) => {
    const info = boot;
    if (!info || starting) return;
    setStarting(true);
    setBootError('');
    try {
      let state: GameState | null = null;
      let restored = false;
      if (!fresh && info.hasSave) {
        const payload = await api.loadSave();
        state = migrateSave(payload.state);
        restored = !!state;
      }
      if (!state) {
        state = createInitialState(info.user?.gender ?? 'female');
        saveGame(state);
        await flushSave();
      }
      const eng = new GameEngine(state, info.user?.gender ?? 'female', info.user ? undefined : 1);
      const report = restored ? eng.applyOffline() : null;
      try { void loadSoundPref(); } catch { /* ignore */ }
      setOffline(report);
      setEngine(eng);
    } catch (e) {
      setBootError(e instanceof ApiError ? e.message : '读取进度失败了，刷新后再试一次。');
      setStarting(false);
    }
  };

  if (!engine) {
    return (
      <>
        <BootScreen
          info={boot}
          error={bootError}
          starting={starting}
          onStart={(fresh) => { void start(fresh); }}
          onAuthed={() => window.location.reload()}
        />
        <ClickFX />
      </>
    );
  }
  return (
    <>
      <ClickFX />
      <GameView engine={engine} offlineReport={offline} user={boot?.user ?? null} />
    </>
  );
}

/* ==================== 标题页 ==================== */
function BootScreen({
  info, error, starting, onStart, onAuthed,
}: {
  info: BootInfo | null;
  error: string;
  starting: boolean;
  onStart: (fresh: boolean) => void;
  onAuthed: () => void;
}) {
  const [askNew, setAskNew] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [busy, setBusy] = useState('');

  useEffect(() => { armMusic(); }, []);

  const user = info?.user ?? null;
  const hasSave = info?.hasSave ?? false;
  const hasLegacy = info?.hasLegacy ?? false;

  const logout = async () => {
    setBusy('logout');
    try {
      await api.logout();
      window.location.reload();
    } catch {
      setBusy('');
    }
  };

  const importLegacy = async () => {
    const raw = readLegacyRaw();
    if (!raw) return;
    if (!window.confirm('导入会用这份旧进度覆盖当前账号的存档，且每个账号只能导入一次。继续吗？')) return;
    setBusy('import');
    try {
      await api.importLegacy(raw);
      window.location.reload();
    } catch {
      setBusy('');
      window.alert('导入失败，稍后再试。');
    }
  };

  return (
    <section className="boot">
      <BgImage className="boot-bg" src="assets/title.jpg" />
      <div className="boot-grain" />
      <div className="boot-content">
        <div className="boot-mark">田 园 生 活</div>
        <h1 className="boot-title">晚风小院</h1>
        <div className="boot-sub">在山与海之间，耕种、做饭、慢慢生活</div>

        {user && (
          <div className="boot-user">
            以 {user.username} 的身份 · {user.gender === 'female' ? '女号' : '男号'} · 可攻略 {user.gender === 'female' ? '程远 / 陈石' : '苏棠 / 林知夏'}
          </div>
        )}
        {!user && info && (
          <div className="boot-user">游客体验 · 女号 · 只能玩一天</div>
        )}
        {!user && info?.guestLocked && (
          <div className="auth-err boot-err">这份游客进度已经用完一天了。注册后，就能接着把故事过下去。</div>
        )}
        {error && <div className="auth-err boot-err">{error}</div>}

        <div className="boot-buttons">
          {hasSave && !askNew && (
            <button className="btn btn-primary" disabled={starting} onClick={() => onStart(false)}>
              {starting ? '正在回到小院…' : '继续上次的生活'}
            </button>
          )}
          {!askNew && (
            <button className="btn btn-primary" disabled={!info || starting} onClick={() => { if (hasSave) setAskNew(true); else onStart(true); }}>
              {!info ? '正在翻找信箱…' : hasSave ? '重新开始' : '开始新的生活'}
            </button>
          )}
          {askNew && (
            <>
              <button className="btn btn-primary" onClick={() => { setAskNew(false); onStart(true); }}>确认覆盖进度</button>
              <button className="btn" onClick={() => setAskNew(false)}>取消</button>
            </>
          )}
          {user && hasLegacy && !user.legacyImported && (
            <button className="btn btn-ghost" disabled={busy === 'import'} onClick={() => void importLegacy()}>
              {busy === 'import' ? '正在导入…' : '导入旧的本地进度'}
            </button>
          )}
        </div>

        {info && (
          <div className="boot-links">
            {user ? (
              <button className="boot-link" disabled={busy === 'logout'} onClick={() => void logout()}>
                {busy === 'logout' ? '正在退出…' : '退出登录'}
              </button>
            ) : (
              <>
                <button className="boot-link" onClick={() => setAuthMode('login')}>登录</button>
                <span className="boot-dot">·</span>
                <button className="boot-link" onClick={() => setAuthMode('register')}>注册</button>
              </>
            )}
          </div>
        )}

        <div className="boot-foot">
          {user ? '进度保存在账号里，换台设备登录也能回到自己的小院' : '游客可体验一天，注册后长期保存进度'}
        </div>
      </div>

      {authMode && (
        <div className="overlay" onClick={() => setAuthMode(null)}>
          <AuthSheet
            initialMode={authMode}
            close={() => setAuthMode(null)}
            onDone={onAuthed}
          />
        </div>
      )}
    </section>
  );
}

/* ==================== 主游戏 ==================== */
function GameView({ engine, offlineReport, user }: { engine: GameEngine; offlineReport: OfflineReport | null; user: AccountUser | null }) {
  useSyncExternalVersion(engine);
  const [scene, setScene] = useState<SceneId>('home');
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const toastId = useRef(0);
  const welcomed = useRef(false);
  const state = engine.state;
  // 主角名字跟随账号；游客没有账号，仍用原本的「阿禾」
  const playerName = user?.username ?? '阿禾';

  const pushToast = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, msg, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    engine.notifyToast = pushToast;
    engine.fx = (kind: SoundKind) => { if (isSoundEnabled()) play(kind); };
  }, [engine, pushToast]);

  // 游客跨夜 / 登录过期都由服务端回执触发，前端只负责把界面切到注册或登录
  useEffect(() => {
    const onLimit = () => setOverlay({ type: 'auth', mode: 'register', reason: 'guest' });
    const onLost = () => {
      pushToast('登录状态过期了，请重新登录。', 'warn');
      setOverlay({ type: 'auth', mode: 'login' });
    };
    window.addEventListener(GUEST_LIMIT_EVENT, onLimit);
    window.addEventListener(SESSION_LOST_EVENT, onLost);
    return () => {
      window.removeEventListener(GUEST_LIMIT_EVENT, onLimit);
      window.removeEventListener(SESSION_LOST_EVENT, onLost);
    };
  }, [pushToast]);

  useEffect(() => {
    const on = loadSoundPref();
    setSoundOn(on);
    armMusic();
    setMusicOn(loadMusicPref());
  }, []);

  // 场景切换：同一首曲子，只轻微调音量；同时换水波纹的浅色调
  useEffect(() => {
    musicScene(scene);
    document.documentElement.style.setProperty('--fx-ripple', SCENE_TINT[scene] || SCENE_TINT.home);
  }, [scene]);

  useEffect(() => {
    if (welcomed.current) return;
    welcomed.current = true;
    if (offlineReport) {
      setOverlay({ type: 'offline', data: offlineReport });
      pushToast(`回来了。你不在的这几天，院子悄悄发生了些变化。`, 'good');
      return;
    }
    pushToast('晨光落在木地板上。新的一天，从照顾好自己开始。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const close = useCallback(() => setOverlay(null), []);

  const hotAction = (action: string) => {
    if (action.startsWith('go:')) {
      setScene(action.slice(3) as SceneId);
      return;
    }
    if (action.startsWith('npc:')) {
      setOverlay({ type: 'npc', id: action.slice(4) as NpcId });
      return;
    }
    if (action.startsWith('wash:')) {
      setOverlay({ type: 'wash', location: action.slice(5) as 'home' | 'well' | 'stream' });
      return;
    }
    if (action.startsWith('open:')) {
      const key = action.slice(5) as Overlay['type'];
      setOverlay({ type: key } as Overlay);
      return;
    }
    switch (action) {
      case 'act:chicken': setOverlay({ type: 'chicken' }); break;
      case 'act:pig': setOverlay({ type: 'pig' }); break;
      case 'act:clean': engine.cleanYard(); break;
      case 'act:rest': engine.rest(); break;
      case 'act:stroll': engine.stroll(); break;
      case 'act:cloud': engine.lookClouds(); break;
      case 'act:forage': engine.forage(); break;
      case 'act:bugs': engine.catchInsect(scene); break;
      case 'open:festival': setOverlay({ type: 'festival' }); break;
      case 'act:help': engine.helpNeighbor(); break;
      default: break;
    }
  };

  const def = SCENES[scene];
  const w = WEATHER_INFO[state.weather];
  const season = seasonForDay(state.day);
  const seasonMeta = SEASON_INFO[season];
  const seasonNum = seasonDayForDay(state.day);
  const NPC_ICONS: Record<NpcId, string> = {
    grandma: '👵', girl: '👧', uncle: '🧓', student: '🧑‍🎓', buddy: '🔧', sweetheart: '👩', teacher: '👩‍🏫',
  };
  const baseHotspots = SCENES[scene].hotspots.filter((h) => !h.action.startsWith('npc:'));
  const npcHotspots = npcVisibleFor(state.gender).flatMap((id) => {
    const block = npcScheduleFor(id, state.minutes);
    if (!block || block.scene !== scene) return [];
    return [{
      id: `npc-${id}`, icon: NPC_ICONS[id], label: NPCS[id].name,
      note: block.note, x: block.x, y: block.y, action: `npc:${id}`,
    }];
  });
  const hotspots = [
    ...baseHotspots,
    ...npcHotspots,
    ...(scene === 'village' && festivalForDay(state.day)
      ? [{ id: 'festival', icon: '🏮', label: '节日', note: '今天的村子格外热闹', ...FESTIVAL_HOTSPOT, action: 'open:festival' }]
      : []),
  ];
  const hour = state.minutes / 60;
  const late = state.minutes >= 22 * 60;
  const matureCount = state.plots.filter((p) => p.crop && p.stage >= CROPS[p.crop].growDays).length;
  const weedCount = state.plots.filter((p) => p.weed).length;
  const tint = tintFor(hour, state.weather);
  const bgSrc = scene === 'home'
    ? (hour >= 18.5 ? 'assets/living.jpg' : (state.weather === 'rain' || state.weather === 'storm') ? 'assets/dining.jpg' : 'assets/home.jpg')
    : def.bg;

  const questDone = QUESTS.filter((q) => state.quests[q.key]).length;

  const stuffed = engine.isStuffed();
  const tip = useMemo(() => {
    if (late) return '夜深了，回屋睡觉吧。明天的菜地还等着你。';
    if (stuffed) return '肚子还撑着呢。缓一缓，晚点再吃下一顿。';
    if (state.cold > 0) return '鼻子有点堵……记得按时吃药，别硬撑着下地。';
    if (state.hygiene < 32) return '身上都是泥和汗，去水缸边洗洗吧，不然容易生病。';
    if (state.hunger < 25) return '肚子空了，去厨房做点吃的吧——饿着干活会没力气。';
    if (state.energy < 22) return '体力见底了，吃点东西，或者在田埂上歇一会儿。';
    if (hour >= 17 && state.mealsToday < 2) return `今天才吃了 ${state.mealsToday} 顿，晚点记得再给自己做一顿。`;
    if (hour >= 12 && state.mealsToday === 0) return '灶台还没热过。先做顿饭，再想别的。';
    if (matureCount > 0) return `菜园里有 ${matureCount} 畦作物熟了，去收下来吧。`;
    if (weedCount > 0) return '菜地冒草了，趁小拔掉，别让它们抢养分。';
    if (state.weather === 'rain') return '下雨了，菜地不用浇水，正好在家做顿饭。';
    if (state.weather === 'storm') return '雷雨正紧，别下地。在家听听收音机，看看明天什么天。';
    if (state.weather === 'fog') return '起雾了，海边的路看不清，走路慢一点。';
    if (hour >= 17) return '傍晚风凉，去村口溜达一圈，心情会好起来。';
    return '先去看看菜地，再决定今天做什么菜。';
  }, [late, stuffed, state.hunger, state.energy, state.hygiene, state.cold, state.mealsToday, matureCount, weedCount, state.weather, hour]);

  const badgeFor = (id: string): string | undefined => {
    if (id === 'plots' && matureCount > 0) return `${matureCount} 畦可收`;
    if (id === 'chicken') {
      if (state.chickens.eggs > 0) return `蛋 ${state.chickens.eggs}`;
      if (!state.chickens.fed && state.inventory.feed > 0) return '待喂';
    }
    if (id === 'pig' && state.pig.manure > 0) return `肥 ${state.pig.manure}`;
    if (id === 'meal' && state.dishes.length > 0) return `${state.dishes.length} 道菜`;
    if (id === 'clean' && state.yardClean < 55) return '该扫了';
    return undefined;
  };

  return (
    <main className="game">
      <div className="stage">
        <div className="bg-layer">
          <BgImage
            key={bgSrc}
            className="bg-img active"
            src={bgSrc}
          />
        </div>
        <div className="tint" style={{ background: tint }} />
        <div className="season-tone" style={{ background: seasonMeta.tint }} />
        {(state.weather === 'rain' || state.weather === 'storm') && <RainOverlay storm={state.weather === 'storm'} />}
        {state.weather === 'fog' && <div className="fog-fx" />}
        {state.hygiene < 78 && (
          <div className="mud-fx" style={{ opacity: Math.min(0.55, (78 - state.hygiene) / 78 * 0.6) }} />
        )}
        <Petals active={state.weather !== 'rain' && state.weather !== 'storm'} />
        <div className="vignette" />

        <header className="topbar">
          <div className="scene-title">
            <span className="scene-cn">{def.name}</span>
            <span className="scene-sub">{def.sub}</span>
          </div>
          <div className="top-right">
            <div className="pill"><span>{w.icon}</span> {w.label}</div>
            <div className="pill clock">第 {state.day} 天 · {seasonMeta.name} D{seasonNum} · {CLOCK_TEXT(state.minutes)}</div>
            <button
              className={`icon-btn music ${musicOn ? '' : 'off'}`}
              title={musicOn ? '背景音乐：开' : '背景音乐：关'}
              onClick={toggleMusic}
            >♫</button>
            <button className={`icon-btn ${soundOn ? '' : 'off'}`} title="音效" onClick={toggleSound}>♪</button>
            <button className="icon-btn" title={user ? `${user.username} 的账号` : '游客模式 · 注册后可长期保存'} onClick={() => setOverlay({ type: 'account' })}>👤</button>
            <button className="icon-btn" title="菜单" onClick={() => setOverlay({ type: 'menu' })}>≡</button>
          </div>
        </header>

        <div className="hotspots">
          {hotspots.map((h, i) => {
            const badge = badgeFor(h.id);
            return (
              <button
                key={h.id}
                className="hotspot"
                style={{ left: `${h.x}%`, top: `${h.y}%`, animationDelay: `${i * 0.08}s` }}
                onClick={() => hotAction(h.action)}
              >
                <span className="hs-ico">{h.icon}</span>
                <span className="hs-label">
                  {h.label}
                  {h.note && <span className="hs-note">{h.note}</span>}
                </span>
                {badge && <span className="hs-badge">{badge}</span>}
              </button>
            );
          })}
        </div>

        <aside className="journal">
          <div className="journal-head">
            <span className="journal-title">今日小事</span>
            <span className="journal-date">第 {state.day} 天 · {seasonText(state.day)}</span>
          </div>
          <ul className="quests">
            {QUESTS.map((q) => {
              const done = state.quests[q.key];
              return (
                <li key={q.key} className={`quest ${done ? 'done' : ''}`}>
                  <span className="qbox">{done ? '✓' : ''}</span>
                  <span className="qtext">{q.icon} {q.text}</span>
                  <span className="qcoin">{done ? '已完成' : `+${q.reward} 文`}</span>
                </li>
              );
            })}
          </ul>
          <div className="journal-tip">
            {tip}
            <div style={{ marginTop: 6, color: '#a48a6d' }}>
              {w.note} · 今天第 {state.mealsToday} 顿饭 · 小事 {questDone}/4
            </div>
          </div>
        </aside>

        <div className="hud">
          <div className="hud-portrait"><img src="assets/portrait.jpg" alt={playerName} /></div>
          <div className="hud-main">
            <div className="hud-name">
              <span className="hud-player" title={playerName}>{playerName}</span>
              <span className="hud-title">{TIME_LABEL(state.minutes)} · {w.label}
                {state.cold > 0 ? ' · 🤒' : ''}
                {stuffed ? ' · 有点撑' : ''}
              </span>
            </div>
            <StatRow icon="🍚" value={state.hunger} className="hunger" />
            <StatRow icon="🌤️" value={state.mood} className="mood" />
            <StatRow icon="⚡" value={state.energy} className="energy" />
            <StatRow icon="🧼" value={state.hygiene} className="clean" />
            <StatRow icon="❤️" value={state.health} className="health" />
          </div>
          <div className="hud-side">
            <div className="coin-chip"><span>🪙</span><b>{state.coins}</b></div>
            <button
              className={`health-chip ${state.cold > 0 ? 'sick' : ''}`}
              onClick={() => setOverlay({ type: 'health' })}
            >
              {state.cold > 0 ? '🤒' : '🌿'} 身体
            </button>
            <button className="hud-bag" onClick={() => setOverlay({ type: 'bag' })}>背包</button>
          </div>
        </div>

        <nav className="nav">
          {SCENE_ORDER.map((id) => (
            <button key={id} className={`nav-item ${scene === id ? 'active' : ''}`} onClick={() => setScene(id)}>
              <span className="ni">{NAV_ICONS[id]}</span>{SCENES[id].name}
            </button>
          ))}
        </nav>

        <div className="toast-wrap">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>
          ))}
        </div>
      </div>

      {overlay && (
        <div className="overlay" onClick={() => { if (overlay.type !== 'cook') close(); }}>
          <OverlayRouter engine={engine} overlay={overlay} close={close} setOverlay={setOverlay} soundOn={soundOn} toggleSound={toggleSound} user={user} />
        </div>
      )}
    </main>
  );
}

function OverlayRouter({
  engine, overlay, close, setOverlay, soundOn, toggleSound, user,
}: {
  engine: GameEngine; overlay: Overlay; close: () => void;
  setOverlay: (o: Overlay | null) => void; soundOn: boolean; toggleSound: () => void;
  user: AccountUser | null;
}) {
  switch (overlay.type) {
    case 'farm': return <FarmPanel engine={engine} close={close} />;
    case 'cook': return <CookingPanel engine={engine} close={close} />;
    case 'meals': return <MealsPanel engine={engine} close={close} />;
    case 'bag': return <BagPanel engine={engine} close={close} />;
    case 'codex': return <CodexPanel engine={engine} close={close} />;
    case 'shop': return <ShopPanel engine={engine} close={close} />;
    case 'cards': return <CardsPanel engine={engine} close={close} />;
    case 'fishing': return <FishingPanel engine={engine} close={close} />;
    case 'chicken': return <ChickenPanel engine={engine} close={close} />;
    case 'pig': return <PigPanel engine={engine} close={close} />;
    case 'wash': return <WashPanel engine={engine} location={overlay.location} close={close} />;
    case 'drink': return <DrinksPanel engine={engine} close={close} />;
    case 'radio': return <RadioPanel engine={engine} close={close} />;
    case 'health': return <HealthPanel engine={engine} close={close} />;
    case 'sleep': return (
      <SleepPanel
        engine={engine}
        close={close}
        onSleep={(data) => setOverlay({ type: 'summary', data })}
        onGuestBlocked={() => setOverlay({ type: 'auth', mode: 'register', reason: 'guest' })}
      />
    );
    case 'summary': return <SummaryPanel summary={overlay.data} close={close} />;
    case 'offline': return <OfflinePanel engine={engine} report={overlay.data} close={close} />;
    case 'festival': return <FestivalPanel engine={engine} close={close} />;
    case 'menu': return <MenuPanel engine={engine} close={close} soundOn={soundOn} toggleSound={toggleSound} />;
    case 'account': return (
      <AccountPanel
        user={user}
        close={close}
        openAuth={(mode) => setOverlay({ type: 'auth', mode })}
      />
    );
    case 'auth': return (
      <AuthSheet
        initialMode={overlay.mode}
        reason={overlay.reason}
        close={close}
        onDone={() => window.location.reload()}
      />
    );
    case 'npc':
      return (
        <NpcPanel
          engine={engine}
          npcId={overlay.id}
          close={close}
          openCards={() => setOverlay({ type: 'cards' })}
        />
      );
    default: return null;
  }
}

function StatRow({ icon, value, className }: { icon: string; value: number; className: string }) {
  const low = value < 25;
  return (
    <div className="stat-row">
      <span className="stat-ico">{icon}</span>
      <div className={`bar ${className} ${low ? 'low' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
      <span className="stat-val">{Math.round(value)}</span>
    </div>
  );
}

/* 水波纹用当前场景的浅色调，看着像光落进画面里 */
const SCENE_TINT: Record<string, string> = {
  home: 'rgba(247,231,197,.9)',
  kitchen: 'rgba(250,226,190,.9)',
  farm: 'rgba(230,241,201,.9)',
  yard: 'rgba(246,226,190,.9)',
  village: 'rgba(247,220,186,.9)',
  pond: 'rgba(216,236,243,.9)',
};

function tintFor(hour: number, weather: string) {
  if (weather === 'storm') return 'rgba(32,46,62,.42)';
  if (weather === 'fog') return 'rgba(206,214,210,.22)';
  if (hour < 7) return 'rgba(255,196,150,.16)';
  if (hour < 16) return 'rgba(255,255,255,0)';
  if (hour < 18.5) return 'rgba(255,178,116,.18)';
  if (hour < 20.5) return 'rgba(232,132,84,.24)';
  return 'rgba(30,44,82,.46)';
}

function RainOverlay({ storm }: { storm?: boolean }) {
  const drops = useMemo(
    () => Array.from({ length: storm ? 50 : 38 }, (_, i) => ({
      left: `${(i * 2.7 + Math.random() * 3) % 100}%`,
      delay: `${Math.random() * 2.4}s`,
      duration: `${0.7 + Math.random() * 0.6}s`,
      opacity: 0.3 + Math.random() * 0.4,
    })),
    [storm],
  );
  return (
    <div className="weather-fx">
      <div className="rain-fx" />
      {drops.map((d, i) => (
        <span
          key={i}
          className="rain-drop"
          style={{ left: d.left, animationDelay: d.delay, animationDuration: d.duration, opacity: d.opacity, height: storm ? '18vh' : undefined }}
        />
      ))}
      {storm && <div className="storm-flash" />}
    </div>
  );
}

/* 订阅引擎状态 */
function useSyncExternalVersion(engine: GameEngine) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = engine.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [engine]);
  return engine.getVersion();
}
