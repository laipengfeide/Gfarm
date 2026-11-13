'use client';
import { useState } from 'react';
import { CROPS, CROP_ORDER, ITEMS } from '@/lib/data';
import type { GameEngine } from '@/lib/engine';
import type { CropId } from '@/lib/types';
import ArtThumb from '@/components/Art';
import { cropStageArt, seedArt } from '@/lib/art';

/** 播种后的天数映射到 4 张连续生长插画 */
function stageIndex(stage: number, growDays: number): 1 | 2 | 3 | 4 {
  if (stage >= growDays) return 4;
  const t = growDays <= 1 ? 1 : stage / growDays;
  if (t < 0.34) return 1;
  if (t < 0.67) return 2;
  return 3;
}

export default function FarmPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const s = engine.state;
  const [planting, setPlanting] = useState<number | null>(null);

  const mature = s.plots.some((p) => p.crop && p.stage >= CROPS[p.crop].growDays);

  return (
    <div className="sheet farm-sheet pop-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <div className="sheet-title"><span className="st-ico">🌱</span>菜园</div>
          <div className="sheet-sub">海风里的六畦地 · 记得浇水，别让草抢了养分</div>
        </div>
        <button className="sheet-close" onClick={close}>✕</button>
      </div>

      {engine.weatherInfo().field === false && (
        <div className="weather-warning">⛈️ 雷雨太大，今天不宜下地，田里的活先放一放。</div>
      )}
      {s.cold > 0 && (
        <div className="weather-warning">🤒 感冒还没好，干活会慢一些、收成也会少一点。先去吃点药吧。</div>
      )}

      <div className="farm-grid pop-body">
        {s.plots.map((p, i) => {
          const crop = p.crop ? CROPS[p.crop] : null;
          const isMature = !!(crop && p.stage >= crop.growDays);
          return (
            <div className={`plot ${!p.crop ? 'soil-empty' : ''}`} key={i}>
              <div className="plot-head">
                <span className="plot-no">第 {(i + 1).toString()} 畦</span>
                <span>{crop ? (isMature ? '已成熟' : `${p.stage}/${crop.growDays} 天`) : p.tilled ? '已犁好' : '荒地'}</span>
              </div>
              <div className="plot-body">
                {crop ? (
                  <div className="plot-stage">
                    <ArtThumb
                      src={cropStageArt(crop.id, stageIndex(p.stage, crop.growDays))}
                      icon={crop.icon}
                      alt={`${crop.name}${isMature ? '成熟' : '生长中'}`}
                      size={118}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#a08a6d', fontSize: 12, lineHeight: 2 }}>
                    <div style={{ fontSize: 30, opacity: p.tilled ? .8 : .5 }}>{p.tilled ? '🟫' : '🌾'}</div>
                    <div>{p.tilled ? '松软的土，等你播种' : '还没翻过的硬土'}</div>
                  </div>
                )}
              </div>
              <div className="plot-name">
                {crop ? crop.name : '空畦'}
                {crop && <small>{crop.icon}</small>}
              </div>
              <div className="plot-tags">
                {crop && p.watered && <span className="tag good">💧 已浇水</span>}
                {crop && p.weed && <span className="tag warn">🌿 杂草</span>}
                {crop && p.pest && <span className="tag warn">🐛 虫害</span>}
                {crop && p.fert && <span className="tag good">✨ 已施肥</span>}
                {crop && !p.watered && !p.weed && !p.pest && <span className="tag">🌤️ 等水</span>}
              </div>
              <div className="plot-actions">
                {!crop && !p.tilled && (
                  <button className="pa primary" onClick={() => engine.plow(i)}>犁田</button>
                )}
                {!crop && p.tilled && (
                  <button className="pa primary" onClick={() => setPlanting(i)}>播种</button>
                )}
                {crop && isMature && (
                  <button className="pa primary" onClick={() => engine.harvest(i)}>{crop.harvestLabel}</button>
                )}
                {crop && !isMature && (
                  <>
                    <button className="pa" disabled={p.watered} onClick={() => engine.water(i)}>浇水</button>
                    {p.weed && <button className="pa" onClick={() => engine.pullWeed(i)}>拔草</button>}
                    {p.pest && <button className="pa" onClick={() => engine.sprayPest(i)}>打农药</button>}
                    {!p.fert && (
                      <button className="pa" disabled={(s.inventory.fertilizer ?? 0) <= 0} onClick={() => engine.fertilize(i)}>
                        施肥{(s.inventory.fertilizer ?? 0) <= 0 ? '（无）' : ''}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="farm-foot">
        <div className="farm-tip">
          {mature
            ? '有作物熟透了，收下来就能拿去做饭或卖掉。'
            : '每天睡前记得浇水，作物才会长；下雨天可以省点力气。'}
          <br />
          种子：🌱{s.inventory.seed_tomato ?? 0} 番茄 · {s.inventory.seed_carrot ?? 0} 胡萝卜 ·
          {' '}{s.inventory.seed_cabbage ?? 0} 白菜 · 肥料 {(s.inventory.fertilizer ?? 0)} · 农药 {(s.inventory.pesticide ?? 0)}
        </div>
        <button className="btn btn-sm" onClick={close}>收起</button>
      </div>

      {planting !== null && (
        <div className="seed-drawer">
          <div className="cook-row" style={{ marginBottom: 2 }}>
            <div className="cook-label">选择种子<small>第 {(planting + 1)} 畦</small></div>
            <button className="sheet-close" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => setPlanting(null)}>✕</button>
          </div>
          <div className="seed-grid">
            {CROP_ORDER.map((id: CropId) => {
              const crop = CROPS[id];
              const have = s.inventory[crop.seedId] ?? 0;
              return (
                <button
                  key={id}
                  className="seed-card"
                  disabled={have <= 0}
                  onClick={() => { engine.plant(planting, crop.seedId); setPlanting(null); }}
                >
                  <ArtThumb src={seedArt(crop.seedId)} icon={crop.icon} alt={`${crop.name}种子`} size={46} />
                  <b>{crop.name}种子</b>
                  <span>{have > 0 ? `种子 ${have} 颗 · ${crop.growDays} 天成熟` : `没有种子 · 小卖部 ${crop.seedPrice} 文`}</span>
                  <span>{crop.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="farm-tip" style={{ marginTop: 10 }}>
            也可以去村口小卖部补种子。种下后每天浇水，成熟后就能收获。
            {' '}现有种子：{CROP_ORDER.map((id) => {
              const crop = CROPS[id];
              const n = s.inventory[crop.seedId] ?? 0;
              return n > 0 ? `${ITEMS[crop.seedId].icon}${crop.name}${n}` : null;
            }).filter(Boolean).join(' · ') || '暂无'}
          </div>
        </div>
      )}
    </div>
  );
}
