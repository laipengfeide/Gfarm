'use client';
import { useState } from 'react';
import { COOKABLE_IDS, DISHES, ITEMS, matchRecipe } from '@/lib/data';
import type { GameEngine } from '@/lib/engine';
import type { CookResult } from '@/lib/types';
import BgImage from '@/components/BgImage';
import ArtThumb from '@/components/Art';
import TimingBar from '@/components/TimingBar';
import { itemArt, recipeArt } from '@/lib/art';

export default function CookingPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<'select' | 'cook' | 'result'>('select');
  const [result, setResult] = useState<CookResult | null>(null);
  const [runId, setRunId] = useState(0);

  const owned = Object.keys(s.inventory).filter(
    (id) => COOKABLE_IDS.includes(id) && (s.inventory[id] ?? 0) > 0,
  );
  const preview = selected.length ? matchRecipe(selected) : null;
  const stuffed = engine.isStuffed();
  const cabinet = preview ? engine.seasoningCheck(preview.recipe) : null;
  const seasonText = (r: typeof DISHES[number]) =>
    Object.entries(r.seasoning ?? {}).map(([id, n]) => `${ITEMS[id].name}×${n}`).join(' · ') || '不用调料';

  const toggle = (id: string) => {
    if (phase !== 'select') return;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const autoPick = (need: string[]) => {
    if (phase !== 'select') return;
    const can = need.every((id) => (s.inventory[id] ?? 0) > 0);
    if (!can) return;
    setSelected(need);
  };

  const startCooking = () => {
    if (!engine.beginCook(selected)) return;
    setRunId((n) => n + 1);
    setPhase('cook');
  };

  const finish = (score: number) => {
    const r = engine.finishCook(selected, score);
    setResult(r);
    setPhase('result');
  };

  const reset = () => {
    setSelected([]);
    setResult(null);
    setPhase('select');
  };

  return (
    <div className="sheet cook-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <BgImage className="cook-stage" src="assets/bg_stove.jpg">
        <div className="cook-head">
          <div className="cook-title">
            <div className="ct-1">灶台</div>
            <div className="ct-2">{phase === 'cook' ? '盯着火候 · 别走神' : '冰箱里有什么，就做什么'}</div>
          </div>
          {phase !== 'cook' && <button className="sheet-close" onClick={close}>✕</button>}
        </div>
      </BgImage>

      <div className="cook-bottom">
        <div className="cook-scroll">
        {phase === 'result' && result ? (
          <div className="dish-result">
            <div className="dish-art">
              <ArtThumb src={recipeArt(result.dish.recipeId)} icon={result.dish.icon} alt={result.dish.name} size={132} />
            </div>
            <div className="dish-name">{result.dish.name}</div>
            <div className="dish-stars">{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</div>
            <div className="dish-desc">
              {result.recipe.desc}
              <br />
              饥饿 +{result.dish.food} · 心情 +{result.dish.mood} · 售价 {result.dish.price} 文
            </div>
          </div>
        ) : phase === 'cook' ? (
          <>
            <div className="cook-row" style={{ marginBottom: 8 }}>
              <div className="cook-label">掌握火候<small>光标停在金色窄带里最香</small></div>
              <span className="chip">🍳 小火慢炒 · 35 分钟</span>
            </div>
            <TimingBar
              active={phase === 'cook'}
              runId={runId}
              speed={2.1}
              perfect={[64, 74]}
              success={[50, 86]}
              buttonLabel="起锅装盘"
              onJudge={(res) => finish(res === 'perfect' ? 1 : res === 'success' ? 0.72 : 0.25)}
            />
            <div className="recipe-hint" style={{ marginTop: 10 }}>
              锅里咕嘟作响。完美区最窄，多试两次就能找到手感。
            </div>
          </>
        ) : (
          <>
            <div className="cook-row">
              <div className="cook-label">下锅的食材<small>最多三样 · 点一下放入 / 再点取出</small></div>
              <span className="chip">{selected.length}/3</span>
            </div>
            <div className="cook-row" style={{ alignItems: 'flex-start' }}>
              <div className="ingredients">
                {owned.length === 0 && <span className="bag-empty">冰箱空了，先去菜园收点菜，或者去小卖部买些食材。</span>}
                {owned.map((id) => (
                  <button
                    key={id}
                    className={`ing ${selected.includes(id) ? 'selected' : ''}`}
                    onClick={() => toggle(id)}
                  >
                    <ArtThumb src={itemArt(id)} icon={ITEMS[id].icon} alt={ITEMS[id].name} size={40} />
                    {ITEMS[id].name}
                    <b>×{s.inventory[id]}</b>
                  </button>
                ))}
              </div>
              <div className="slots">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`slot ${selected[i] ? 'filled' : ''}`}>
                    {selected[i] ? (
                      <>
                        <ArtThumb src={itemArt(selected[i])} icon={ITEMS[selected[i]].icon} alt={ITEMS[selected[i]].name} size={36} />
                        <span className="slot-x">{ITEMS[selected[i]].name}</span>
                      </>
                    ) : <span style={{ fontSize: 18 }}>＋</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="recipe-book">
              <div className="recipe-book-title">灶台边的菜谱灵感 · 点一下自动配好食材</div>
              <div className="recipe-cards">
                {DISHES.map((r) => {
                  const can = r.need.every((id) => (s.inventory[id] ?? 0) > 0);
                  return (
                    <button
                      key={r.id}
                      className={`recipe-card ${can ? 'doable' : ''}`}
                      disabled={!can}
                      onClick={() => autoPick(r.need)}
                      title={`${r.name}：${r.need.map((id) => ITEMS[id].name).join(' + ')} · 调料 ${seasonText(r)}`}
                    >
                      <ArtThumb src={recipeArt(r.id)} icon={r.icon} alt={r.name} size={52} />
                      <span>
                        <b>{r.name}</b>
                        <small>{can ? '食材齐了 · 点一下配好' : '食材不足'}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </div>
        {phase === 'result' && result ? (
          <div className="dish-btns">
            <button
              className="btn btn-primary"
              onClick={() => { engine.eatDish(engine.state.dishes.length - 1); close(); }}
            >
              趁热吃掉
            </button>
            <button className="btn" onClick={close}>放进饭篮</button>
            <button className="btn btn-ghost" onClick={reset}>再做一道</button>
          </div>
        ) : phase !== 'cook' ? (
          <div className="cook-actions">
            <div className="recipe-hint">
              {stuffed
                ? '刚吃撑了，等肚子缓一缓再动锅铲吧。'
                : preview
                  ? cabinet && !cabinet.ok
                    ? <>打开橱柜看了一眼：{cabinet.missing.map((m) => `${m.name}还差 ${m.need - m.have}`).join('、')}。这锅先做不成。</>
                    : <>看起来能做「{preview.recipe.name}」（{seasonText(preview.recipe)}）
                      {!preview.exact && '，食材多了，味道可能差一点'}。</>
                  : selected.length
                    ? '这些食材凑不出菜谱，可能会变成黑暗料理……'
                    : '选一两样食材，或直接点上面的菜谱灵感。'}
            </div>
            <button
              className="btn btn-primary"
              disabled={selected.length === 0 || stuffed || (cabinet ? !cabinet.ok : false)}
              onClick={startCooking}
            >
              {stuffed ? '肚子还撑着' : cabinet && !cabinet.ok ? '橱柜缺料' : '生火做饭 · 35 分钟'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
