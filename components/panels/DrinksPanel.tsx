'use client';
import { useState } from 'react';
import { DRINKS, ITEMS } from '@/lib/data';
import { ECON, SEASONING_IDS } from '@/lib/economy';
import type { GameEngine } from '@/lib/engine';
import type { CookResult, Recipe } from '@/lib/types';
import BgImage from '@/components/BgImage';
import ArtThumb from '@/components/Art';
import { itemArt, recipeArt } from '@/lib/art';

export default function DrinksPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  const [result, setResult] = useState<CookResult | null>(null);

  const make = (r: Recipe) => {
    const res = engine.brew(r.id);
    if (res) setResult(res);
  };

  return (
    <div className="sheet drink-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <BgImage className="cook-stage" src="assets/bg_stove.jpg">
        <div className="cook-head">
          <div className="cook-title">
            <div className="ct-1">茶壶与糖罐</div>
            <div className="ct-2">垫一下心情，但顶不了一顿饭</div>
          </div>
          {!result && <button className="sheet-close" onClick={close}>✕</button>}
        </div>
      </BgImage>

      <div className="cook-bottom">
        <div className="cook-scroll">
        {result ? (
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
        ) : (
          <>
            <div className="cook-row">
              <div className="cook-label">今天想喝点什么<small>饮品不占正餐，但别拿它当饭吃</small></div>
              <span className="chip">🫖 已喝 {s.drinksToday} 杯</span>
            </div>

            <div className="drink-grid">
              {DRINKS.map((r) => {
                const lack = r.need.find((id) => (s.inventory[id] ?? 0) <= 0);
                const cab = engine.seasoningCheck(r);
                const ok = !lack && cab.ok;
                return (
                  <div className={`drink-tile ${ok ? '' : 'short'}`} key={r.id}>
                    <div className="dt-top">
                      <ArtThumb src={recipeArt(r.id)} icon={r.icon} alt={r.name} size={64} />
                      <b>{r.name}</b>
                    </div>
                    <span className="dt-desc">{r.desc}</span>
                    <span className="dt-need">
                      {r.need.map((id) => `${ITEMS[id].icon}${ITEMS[id].name}×1`).join(' + ')}
                      {Object.entries(r.seasoning ?? {}).map(([id, n]) => ` · ${ITEMS[id].icon}${ITEMS[id].name}×${n}`).join('')}
                    </span>
                    {!ok && (
                      <span className="dt-miss">
                        橱柜里不够：
                        {lack ? `${ITEMS[lack].name}没了` : cab.missing.map((m) => `${m.name}还差 ${m.need - m.have}`).join('、')}
                      </span>
                    )}
                    <button className="btn btn-sm" disabled={!ok} onClick={() => make(r)}>
                      {ok ? `煮一壶 · ${ECON.brew.minutes} 分钟` : '缺料'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pantry-strip">
              <div className="ps-title">橱柜里的小罐子</div>
              <div className="ps-jars">
                {SEASONING_IDS.map((id) => {
                  const n = s.inventory[id] ?? 0;
                  return (
                    <span className={`jar ${n <= 0 ? 'empty' : n <= 1 ? 'low' : ''}`} key={id} title={ITEMS[id].name}>
                      <ArtThumb src={itemArt(id)} icon={ITEMS[id].icon} alt={ITEMS[id].name} size={32} />
                      <span className="jar-name">{ITEMS[id].name}</span>
                      <b>{n}</b>
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </div>
        {result ? (
          <div className="dish-btns">
            <button
              className="btn btn-primary"
              onClick={() => { engine.drinkDish(engine.state.dishes.length - 1); close(); }}
            >
              现在就喝
            </button>
            <button className="btn" onClick={close}>放进饭篮</button>
            <button className="btn btn-ghost" onClick={() => setResult(null)}>再做一杯</button>
          </div>
        ) : (
          <div className="cook-actions">
            <div className="recipe-hint">
              喝茶、喝柠檬水能缓一缓心情，但饥饿值只涨一点点。今天已经喝 {s.drinksToday} 杯，喝太多就只是灌水了。
            </div>
            <button className="btn btn-ghost" onClick={close}>回厨房</button>
          </div>
        )}
      </div>
    </div>
  );
}
