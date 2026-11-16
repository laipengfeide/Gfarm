'use client';
import { useState } from 'react';
import { CROPS, CROP_ORDER, FURNITURE_IDS, INSECT_DEFS, ITEMS, NPCS, RECIPES, COLLECTIBLE_TOTALS, festivalForDay, npcVisibleFor, seasonForDay, SEASON_INFO, seasonText } from '@/lib/data';
import { itemArt, recipeArt, cropStageArt } from '@/lib/art';
import ArtThumb from '@/components/Art';
import type { GameEngine, SleepSummary } from '@/lib/engine';
import { WEATHER_INFO } from '@/lib/data';
import type { ItemKind, OfflineReport } from '@/lib/types';

/* ==================== 背包 ==================== */
const GROUP_TITLES: Record<string, string> = {
  seed: '种子', produce: '收成', material: '食材', fish: '鱼获', tool: '农资', insect: '昆虫', furniture: '家具',
};

export function BagPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  const ids = Object.keys(s.inventory).filter((id) => (s.inventory[id] ?? 0) > 0 && ITEMS[id]);
  const kinds: ItemKind[] = ['seed', 'produce', 'material', 'fish', 'tool', 'insect', 'furniture'];

  return (
    <div className="sheet bag-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🧺</span>背包</div>
          <div className="sheet-sub">所有收成和家当 · 🪙 {s.coins} 文</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>
      <div className="bag-groups pop-body">
        {kinds.map((kind) => {
          const list = ids.filter((id) => ITEMS[id].kind === kind);
          if (list.length === 0) return null;
          return (
            <div key={kind}>
              <div className="bag-group-title">{GROUP_TITLES[kind]}</div>
              <div className="card-grid card-grid--lg">
                {list.map((id) => (
                  <div key={id} className="art-card">
                    <ArtThumb src={itemArt(id)} icon={ITEMS[id].icon} alt={ITEMS[id].name} size={104} />
                    <b>{ITEMS[id].name}</b>
                    <span>持有 {s.inventory[id]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {ids.length === 0 && <div className="bag-empty">背包空空的，去菜园里看看吧。</div>}
      </div>

      <div className="farm-foot" style={{ marginTop: 18 }}>
        <div className="farm-tip">做好的菜在「饭篮」里，可以吃、也可以卖给小卖部。</div>
        <button className="btn btn-sm" onClick={close}>收好</button>
      </div>
    </div>
  );
}

/* ==================== 饭篮 / 吃饭 ==================== */
export function MealsPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  return (
    <div className="sheet bag-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🍚</span>饭篮</div>
          <div className="sheet-sub">饥饿 {Math.round(s.hunger)}/100 · 心情 {Math.round(s.mood)}/100</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>
      {s.dishes.length === 0 ? (
        <div className="empty-note">
          饭篮是空的。去厨房选几样食材做一道菜吧，饿着肚子可干不动活。
        </div>
      ) : (
        <div className="dish-cards pop-body">
          {s.dishes.map((d, i) => (
            <div className="dish-card" key={i}>
              <div className="dc-thumb">
                <ArtThumb src={recipeArt(d.recipeId)} icon={d.icon} alt={d.name} size={108} />
              </div>
              <div className="dc-name">{d.name}</div>
              <div className="dish-stars">{'★'.repeat(d.stars)}</div>
              <div className="dc-meta">饥饿 +{d.food} · 心情 +{d.mood} · 售价 {d.price} 文</div>
              <div className="dc-acts">
                <button className="btn btn-sm btn-primary" disabled={engine.isStuffed()} onClick={() => engine.eatDish(i)}>
                  {engine.isStuffed() ? '还撑着' : '吃掉'}
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => engine.sellDish(i)}>卖 {d.price} 文</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="farm-foot" style={{ marginTop: 16 }}>
        <div className="farm-tip">
          今天第 {s.mealsToday} 顿饭。一天两顿刚好，三顿更舒坦；
          吃太急太饱会撑到，行动也会慢下来。
        </div>
        <button className="btn btn-sm" onClick={close}>放下碗</button>
      </div>
    </div>
  );
}

/* ==================== 鸡舍 / 猪圈 ==================== */
export function ChickenPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  return (
    <div className="sheet" style={{ width: 'min(460px,92vw)' }} onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🐔</span>鸡舍</div>
          <div className="sheet-sub">三只母鸡 · 今天 {s.chickens.fed ? '已喂食' : '还没喂'} · 窝里 {s.chickens.eggs} 个蛋</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 58, margin: '6px 0 2px' }}>🐔🐔🐔</div>
      <div className="farm-tip" style={{ textAlign: 'center', margin: '8px 0 16px' }}>
        {s.chickens.fed
          ? '鸡们吃得饱饱的，正刨土找虫子。明早又能收蛋。'
          : '它们在你脚边打转，等着今天的谷粒。'}
        <br />饲料：{(s.inventory.feed ?? 0)} 份 · 鸡蛋：{(s.inventory.egg ?? 0)} 个
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn-primary" disabled={s.chickens.fed || (s.inventory.feed ?? 0) <= 0} onClick={() => engine.feedChickens()}>
          撒谷粒喂鸡
        </button>
        <button className="btn" disabled={s.chickens.eggs <= 0} onClick={() => engine.collectEggs()}>
          收鸡蛋
        </button>
      </div>
      <div className="farm-tip" style={{ textAlign: 'center', marginTop: 12 }}>
        喂鸡能提升心情；鸡蛋是番茄炒蛋、蛋炒饭的关键食材。
      </div>
    </div>
  );
}

export function PigPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  return (
    <div className="sheet" style={{ width: 'min(460px,92vw)' }} onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🐷</span>猪圈</div>
          <div className="sheet-sub">一只花猪 · 今天 {s.pig.fed ? '已喂食' : '还没喂'} · 肥料 {s.pig.manure} 份</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 58, margin: '6px 0 2px' }}>🐷</div>
      <div className="farm-tip" style={{ textAlign: 'center', margin: '8px 0 16px' }}>
        {s.pig.fed
          ? '花猪吃饱了，躺在地上哼哼，尾巴一甩一甩。'
          : '它趴在槽边，眼巴巴地看着你手里的饲料桶。'}
        <br />饲料：{(s.inventory.feed ?? 0)} 份 · 厩肥：{s.pig.manure} 份 · 院子整洁：{Math.round(s.yardClean)}%
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn-primary" disabled={s.pig.fed || (s.inventory.feed ?? 0) <= 0} onClick={() => engine.feedPig()}>
          倒猪食喂猪
        </button>
        <button className="btn" disabled={s.pig.manure <= 0} onClick={() => engine.collectManure()}>
          清理厩肥
        </button>
      </div>
      <div className="farm-tip" style={{ textAlign: 'center', marginTop: 12 }}>
        厩肥可以直接当肥料用。院子太脏会让心情变差，记得常打扫。
      </div>
    </div>
  );
}

/* ==================== 图鉴 ==================== */
export function CodexPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const [tab, setTab] = useState<'crops' | 'recipes' | 'fish' | 'insects' | 'furniture' | 'rating'>('crops');
  const s = engine.state;
  const rating = engine.ratingNow();
  const season = seasonForDay(s.day);
  const recipeFound = s.discovered.recipes.filter((id) => !id.startsWith('gift_')).length;
  const foundTotal = s.discovered.crops.length + s.discovered.fish.length
    + recipeFound + s.collections.insects.length + s.collections.furniture.length;
  const allTotal = COLLECTIBLE_TOTALS.crops + COLLECTIBLE_TOTALS.fish + COLLECTIBLE_TOTALS.recipes
    + COLLECTIBLE_TOTALS.insects + COLLECTIBLE_TOTALS.furniture;
  const percent = Math.round(foundTotal / allTotal * 100);
  const nextGrade = rating.score < 60 ? { g: 'B', need: 60 }
    : rating.score < 75 ? { g: 'A', need: 75 }
      : rating.score < 90 ? { g: 'S', need: 90 } : null;

  return (
    <div className="sheet codex-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">📖</span>小院图鉴</div>
          <div className="sheet-sub">作物 · 菜谱 · 鱼获 · 昆虫 · 家具 · 小院评级</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>
      <div className="codex-progress">
        <div className="cp-bar"><i style={{ width: `${percent}%` }} /></div>
        <span>总收集 {foundTotal}/{allTotal} · {percent}%</span>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === 'crops' ? 'active' : ''}`} onClick={() => setTab('crops')}>作物 {s.discovered.crops.length}/{COLLECTIBLE_TOTALS.crops}</button>
        <button className={`tab ${tab === 'recipes' ? 'active' : ''}`} onClick={() => setTab('recipes')}>菜谱 {recipeFound}/{COLLECTIBLE_TOTALS.recipes}</button>
        <button className={`tab ${tab === 'fish' ? 'active' : ''}`} onClick={() => setTab('fish')}>鱼获 {s.discovered.fish.length}/{COLLECTIBLE_TOTALS.fish}</button>
        <button className={`tab ${tab === 'insects' ? 'active' : ''}`} onClick={() => setTab('insects')}>昆虫 {s.collections.insects.length}/{COLLECTIBLE_TOTALS.insects}</button>
        <button className={`tab ${tab === 'furniture' ? 'active' : ''}`} onClick={() => setTab('furniture')}>家具 {s.collections.furniture.length}/{COLLECTIBLE_TOTALS.furniture}</button>
        <button className={`tab ${tab === 'rating' ? 'active' : ''}`} onClick={() => setTab('rating')}>小院评级</button>
      </div>

      {tab === 'crops' && (
        <div className="codex-grid pop-body">
          {CROP_ORDER.map((id) => {
            const c = CROPS[id];
            const found = s.discovered.crops.includes(id);
            const seasonLabel = c.seasons
              ? c.seasons.map((x) => SEASON_INFO[x].name).join('/')
              : '四季';
            const offSeason = !!c.seasons && !c.seasons.includes(season);
            return (
              <div key={id} className={`codex-card ${found ? '' : 'locked'}`}>
                <ArtThumb src={found ? (cropStageArt(id, 4) ?? itemArt(id)) : undefined} icon={found ? c.icon : '🌱'} alt={found ? c.name : '未解锁'} size={64} />
                <div>
                  <b>{found ? c.name : '？？？'}</b>
                  <span>
                    {found
                      ? <>{c.desc}<br />{c.growDays} 天成熟 · 适宜 {seasonLabel}{offSeason ? '（当前错季，生长减半）' : ''}</>
                      : <>收获一次后解锁<br />在菜园播种 · 适宜 {seasonLabel}</>}
                  </span>
                  {found && (
                    <div className="stage-strip">
                      {([1, 2, 3, 4] as const).map((n) => (
                        <ArtThumb key={n} src={cropStageArt(id, n)} icon={c.icon} alt={`${c.name}生长阶段${n}`} size={30} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'recipes' && (
        <div className="codex-grid pop-body">
          {RECIPES.map((r) => {
            const found = s.discovered.recipes.includes(r.id);
            return (
              <div key={r.id} className={`codex-card ${found ? '' : 'locked'}`}>
                <ArtThumb src={found ? recipeArt(r.id) : undefined} icon={found ? r.icon : '🍲'} alt={found ? r.name : '未解锁'} size={58} />
                <div>
                  <b>{r.name}</b>
                  <span>
                    {r.need.map((id) => ITEMS[id].icon + ITEMS[id].name).join(' + ')}
                    <br />{found ? '已做过 · 饥饿 +' + r.food : '还没做过'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'fish' && (
        <div className="codex-grid pop-body">
          {['fish_crucian', 'fish_grass', 'fish_carp'].map((id) => {
            const found = s.discovered.fish.includes(id);
            return (
              <div key={id} className={`codex-card ${found ? '' : 'locked'}`}>
                <ArtThumb src={found ? itemArt(id) : undefined} icon={found ? ITEMS[id].icon : '🎣'} alt={found ? ITEMS[id].name : '未解锁'} size={58} />
                <div>
                  <b>{found ? ITEMS[id].name : '？？？'}</b>
                  <span>{found ? ITEMS[id].desc : '在池塘钓到一次后解锁'}</span>
                </div>
              </div>
            );
          })}
          {npcVisibleFor(s.gender).map((id) => (
            <div key={id} className="codex-card">
              <span className="cc-ico">{engine.hearts(id) >= 3 ? '💛' : '🤍'}</span>
              <b>{NPCS[id].name}</b>
              <span>好感 {engine.hearts(id)}/5 · {NPCS[id].title}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'insects' && (
        <div className="codex-grid pop-body">
          {INSECT_DEFS.map((bug) => {
            const found = s.collections.insects.includes(bug.id);
            return (
              <div key={bug.id} className={`codex-card ${found ? '' : 'locked'}`}>
                <ArtThumb src={found ? itemArt(bug.id) : undefined} icon={found ? bug.emoji : '🔍'} alt={found ? bug.name : '未解锁'} size={58} />
                <div>
                  <b>{found ? bug.name : '？？？'}</b>
                  <span>{found ? ITEMS[bug.id]?.desc : `还没遇见 · ${bug.hint}`}</span>
                </div>
              </div>
            );
          })}
          <div className="codex-hint">在菜园、村口老槐树、池塘水边的「找虫子」热点蹲一会儿，按时段与天气出现。</div>
        </div>
      )}

      {tab === 'furniture' && (
        <div className="codex-grid pop-body">
          {FURNITURE_IDS.map((id) => {
            const found = s.collections.furniture.includes(id);
            const def = ITEMS[id];
            return (
              <div key={id} className={`codex-card ${found ? '' : 'locked'}`}>
                <ArtThumb src={found ? itemArt(id) : undefined} icon={found ? def.icon : '🪑'} alt={found ? def.name : '未解锁'} size={58} />
                <div>
                  <b>{found ? def.name : '？？？'}</b>
                  <span>{found ? def.desc : `还没买过 · 小卖部有售 ${def.buy ?? '?'} 文`}</span>
                </div>
              </div>
            );
          })}
          <div className="codex-hint">家具在小卖部「家具」一栏购买；买到一件就自动记入图鉴。</div>
        </div>
      )}

      {tab === 'rating' && (
        <div className="rating-wrap pop-body">
          <div className={`rating-hero grade-${rating.grade}`}>
            <div className="rating-grade">{rating.grade}</div>
            <div className="rating-hero-text">
              <b>{rating.score} 分 · 小院评级</b>
              <span>
                {rating.grade === 'S' ? '这一院子的日子，已经过成了别人羡慕的样子。'
                  : rating.grade === 'A' ? '井井有条，再添几页图鉴就更好了。'
                    : rating.grade === 'B' ? '日子稳当，还有不少可以慢慢打磨的地方。'
                      : '刚起步的小院，先把今天过好。'}
              </span>
            </div>
          </div>
          {([
            ['collection', '收集', rating.dims.collection, 40],
            ['harvest', '收成', rating.dims.harvest, 20],
            ['bonds', '关系', rating.dims.bonds, 15],
            ['home', '家务', rating.dims.home, 10],
            ['savings', '积蓄', rating.dims.savings, 10],
          ] as const).map(([key, label, value, max]) => (
            <div className="rating-row" key={key}>
              <span className="rating-label">{label}</span>
              <div className="rating-bar"><i style={{ width: `${Math.min(100, value / max * 100)}%` }} /></div>
              <span className="rating-val">{value}/{max}</span>
            </div>
          ))}
          <div className="rating-note">
            图鉴进度：作物 {s.discovered.crops.length}/{COLLECTIBLE_TOTALS.crops} · 鱼获 {s.discovered.fish.length}/{COLLECTIBLE_TOTALS.fish} ·
            菜谱 {recipeFound}/{COLLECTIBLE_TOTALS.recipes} · 昆虫 {s.collections.insects.length}/{COLLECTIBLE_TOTALS.insects} ·
            家具 {s.collections.furniture.length}/{COLLECTIBLE_TOTALS.furniture}（总 {percent}%）
            <br />评级只看「有没有在变好」，不会因为一次失误掉级。
            <br />{nextGrade ? `距离下一级 ${nextGrade.g} 还差 ${nextGrade.need - rating.score} 分。` : '已经是最高评级 S，慢慢享受这一院子就好。'}
          </div>
        </div>
      )}

      <div className="farm-foot">
        <div className="farm-tip">
          收获 {s.counters.harvest} 次 · 做过 {s.counters.cooked} 道菜 · 钓到 {s.counters.fish} 条鱼
        </div>
        <button className="btn btn-sm" onClick={close}>合上</button>
      </div>
    </div>
  );
}

/* ==================== 睡觉 / 结算 ==================== */
export function SleepPanel({
  engine, close, onSleep, onGuestBlocked,
}: { engine: GameEngine; close: () => void; onSleep: (summary: SleepSummary) => void; onGuestBlocked?: () => void }) {
  const s = engine.state;
  return (
    <div className="sheet sleep-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sleep-icon">🌙</div>
      <div className="sleep-title">第 {s.day} 天，要睡了吗？</div>
      <div className="sleep-sub">
        油灯快见底了，海风从窗缝里钻进来。<br />
        睡前记得看一眼菜地有没有浇水。
      </div>
      <div className="sleep-stats">
        <div className="sleep-stat"><b>{Math.round(s.energy)}</b><span>体力</span></div>
        <div className="sleep-stat"><b>{Math.round(s.hunger)}</b><span>饥饿</span></div>
        <div className="sleep-stat"><b>{Math.round(s.mood)}</b><span>心情</span></div>
        <div className="sleep-stat"><b>{s.coins}</b><span>铜钱</span></div>
      </div>
      <div className="sleep-btns">
        <button className="btn btn-primary" onClick={() => { const sum = engine.sleep(); if (sum) onSleep(sum); else onGuestBlocked?.(); }}>睡觉，等天亮</button>
        <button className="btn btn-ghost" onClick={close}>再忙一会儿</button>
      </div>
    </div>
  );
}

export function SummaryPanel({ summary, close }: { summary: SleepSummary; close: () => void }) {
  const w = WEATHER_INFO[summary.nextWeather];
  return (
    <div className="sheet sleep-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sleep-icon">🌅</div>
      <div className="sleep-title">第 {summary.day} 天 · 清晨</div>
      <div className="sleep-sub">
        你是被鸡叫醒的。窗外 {w.icon} {w.label}，{w.note}
      </div>
      <div className="sleep-stats">
        <div className="sleep-stat"><b>{summary.questDone}</b><span>今日小事</span></div>
        <div className="sleep-stat"><b>{summary.meals}</b><span>今天吃饭</span></div>
        <div className="sleep-stat"><b>{summary.sales}</b><span>昨日卖出(文)</span></div>
        <div className="sleep-stat"><b>{summary.harvest}</b><span>累计收获</span></div>
        <div className="sleep-stat"><b>{summary.cooked}</b><span>做过菜</span></div>
      </div>
      <div className="sleep-sub">
        {summary.cold > 0
          ? `感冒还没好（${Math.round(summary.cold)}）。今天记得吃两次药，慢慢会好。`
          : `身体 ${Math.round(summary.health)} · 清洁 ${Math.round(summary.hygiene)}。`}
        <br />
        昨天赚下的铜钱都还在：{summary.coins} 文。今天想先做点什么？
      </div>
      <div className="sleep-btns">
        <button className="btn btn-primary" onClick={close}>起床，开始新的一天</button>
      </div>
    </div>
  );
}

/* ==================== 季节节日 ==================== */
export function FestivalPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const festival = festivalForDay(engine.state.day);
  const joined = festival ? engine.state.collections.festivals.includes(festival.id) : false;
  if (!festival) {
    return (
      <div className="sheet sleep-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sleep-icon">🍃</div>
        <div className="sleep-title">今天没有节日</div>
        <div className="sleep-sub">日子平常，也是一种好。</div>
        <div className="sleep-btns"><button className="btn" onClick={close}>回去</button></div>
      </div>
    );
  }
  return (
    <div className="sheet sleep-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sleep-icon">{festival.icon}</div>
      <div className="sleep-title">{festival.name}</div>
      <div className="sleep-sub">{festival.desc}<br />今天是 {SEASON_INFO[festival.season].name} 季的第 {festival.day} 天。</div>
      <div className="sleep-stats">
        <div className="sleep-stat"><b>{festival.reward.coins}</b><span>文钱</span></div>
        <div className="sleep-stat"><b>{festival.reward.note}</b><span>节日回礼</span></div>
      </div>
      <div className="sleep-btns">
        {joined
          ? <button className="btn" onClick={close}>已经参加过了</button>
          : (
            <button className="btn btn-primary" onClick={() => { engine.joinFestival(); close(); }}>
              参加 · 60 分钟
            </button>
          )}
      </div>
    </div>
  );
}

/* ==================== 离线回归 ==================== */
export function OfflinePanel({ engine, report, close }: {
  engine: GameEngine; report: OfflineReport; close: () => void;
}) {
  const season = seasonText(engine.state.day);
  return (
    <div className="sheet sleep-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sleep-icon">🌤️</div>
      <div className="sleep-title">你离开了 {report.days} 天</div>
      <div className="sleep-sub">
        院子没有停：菜地按着季节慢慢长，鸡窝和猪圈也照常过日子。<br />
        现在是第 {engine.state.day} 天 · {season}。
      </div>
      <div className="sleep-stats">
        <div className="sleep-stat"><b>{report.grown}</b><span>作物生长</span></div>
        <div className="sleep-stat"><b>{report.eggs}</b><span>新鸡蛋</span></div>
        <div className="sleep-stat"><b>{report.manure}</b><span>新肥料</span></div>
        <div className="sleep-stat"><b>{report.spoiled}</b><span>新鲜度流失</span></div>
      </div>
      <div className="sleep-sub">
        连续回来第 {report.streak} 天。没有作物会因为你不在就彻底枯死，
        <br />回来补一次水、做一顿饭，日子就能接上。
      </div>
      {report.news && <div className="offline-news">村里这几天的消息：{report.news}</div>}
      <div className="sleep-btns">
        <button className="btn btn-primary" onClick={close}>看看院子，开始今天</button>
      </div>
    </div>
  );
}

/* ==================== 菜单 ==================== */
export function MenuPanel({ engine, close, soundOn, toggleSound }: {
  engine: GameEngine; close: () => void; soundOn: boolean; toggleSound: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="sheet menu-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">☰</span>小院手记</div>
          <div className="sheet-sub">第 {engine.state.day} 天 · 自动存档已开启</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>
      <div className="menu-btns">
        <button className="btn" onClick={toggleSound}>{soundOn ? '♪ 音效开着' : '♪ 音效已关'}</button>
        <button className="btn" onClick={close}>继续今天</button>
        {confirm ? (
          <>
            <div className="farm-tip" style={{ textAlign: 'center' }}>确定要重新开始吗？当前进度会被清空。</div>
            <button className="btn btn-primary" onClick={() => { import('@/lib/save').then(({ resetRemoteSave }) => { void resetRemoteSave(engine.state.gender).finally(() => window.location.reload()); }); }}>
              确认重来
            </button>
          </>
        ) : (
          <button className="btn btn-ghost" onClick={() => setConfirm(true)}>重新开始</button>
        )}
      </div>
      <div className="farm-tip" style={{ marginTop: 16, textAlign: 'center' }}>
        鼠标点击场景里的木牌就能互动。<br />饿了就做饭，累了就睡觉，心情差了去村口走走。
      </div>
    </div>
  );
}
