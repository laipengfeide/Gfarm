'use client';
import { useState } from 'react';
import { ITEMS } from '@/lib/data';
import type { GameEngine } from '@/lib/engine';
import BgImage from '@/components/BgImage';
import ArtThumb from '@/components/Art';
import TimingBar from '@/components/TimingBar';
import { itemArt } from '@/lib/art';

export function FishingPanel({ engine, close }: { engine: GameEngine; close: () => void }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'result'>('ready');
  const [attempts, setAttempts] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [caught, setCaught] = useState<string | null>(null);
  const [note, setNote] = useState('水面很静，荷叶底下偶尔有鱼影。');
  const [runId, setRunId] = useState(0);

  const start = () => {
    if (!engine.beginFishing()) return;
    setPhase('play');
    setAttempts(0);
    setSuccesses(0);
    setRunId((n) => n + 1);
    setNote('浮子动了。等光标回到水域中央再提竿。');
  };

  const judge = (res: 'perfect' | 'success' | 'fail') => {
    const hit = res !== 'fail';
    const nextSuccess = successes + (hit ? 1 : 0);
    const nextAttempts = attempts + 1;
    setSuccesses(nextSuccess);
    setAttempts(nextAttempts);
    setNote(
      res === 'perfect' ? '提竿！水面炸开一圈涟漪，手感正好。'
        : res === 'success' ? '提竿！鱼线绷了一下，勉强算稳。'
          : '晚了半拍，鱼线轻轻一颤，鱼跑了。',
    );

    if (nextAttempts >= 3) {
      const result = engine.resolveFishing(nextSuccess);
      setCaught(result);
      setPhase('result');
    } else {
      setRunId((n) => n + 1);
    }
  };

  return (
    <div className="sheet fish-sheet" onClick={(e) => e.stopPropagation()}>
      <BgImage className="fish-hero" src="assets/bg_pond.jpg">
        <button className="sheet-close" style={{ position: 'absolute', right: 16, top: 16, zIndex: 4 }} onClick={close}>✕</button>
        {(phase === 'play' || phase === 'ready') && <span className="fish-float" />}
      </BgImage>
      <div className="fish-body">
        <div className="cook-row">
          <div className="cook-label">池塘边<small>钓一次 40 分钟 · 心情会好起来</small></div>
          <span className="chip">🎣 老周的旧竹竿</span>
        </div>

        {phase === 'ready' && (
          <>
            <div className="fish-note">
              老周说，浮子动三下再提竿。等指针扫到绿色水域时点「提竿」，一共三次机会。
              <br />三次都稳，才有可能钓到鲤鱼。
            </div>
            <div className="fish-actions">
              <button className="btn btn-primary" onClick={start}>抛竿</button>
            </div>
          </>
        )}

        {phase === 'play' && (
          <>
            <TimingBar
              active={phase === 'play'}
              runId={runId}
              speed={2.6}
              perfect={[58, 68]}
              success={[44, 74]}
              buttonLabel="提竿"
              onJudge={judge}
            />
            <div className="fish-progress">
              <span style={{ fontSize: 11, color: '#7d664c' }}>收获</span>
              {[0, 1, 2].map((i) => <span key={i} className={`fish-dot ${i < successes ? 'on' : ''}`} />)}
              <span style={{ fontSize: 11, color: '#a48a6c', marginLeft: 'auto' }}>第 {attempts + 1}/3 次</span>
            </div>
            <div className="fish-note">{note}</div>
          </>
        )}

        {phase === 'result' && (
          <>
            {caught ? (
              <div className="dish-result">
                <div className="dish-big"><ArtThumb src={itemArt(caught)} icon={ITEMS[caught].icon} alt={ITEMS[caught].name} size={132} /></div>
                <div className="dish-name">{ITEMS[caught].name}</div>
                <div className="dish-desc">钓上来了！{ITEMS[caught].desc}</div>
              </div>
            ) : (
              <div className="dish-result">
                <div className="dish-big">🌿</div>
                <div className="dish-name">空军</div>
                <div className="dish-desc">只钓上来一片荷叶。不过在水边坐了一会儿，心倒是静了。</div>
              </div>
            )}
            <div className="fish-actions">
              <button className="btn btn-primary" onClick={close}>收起鱼竿</button>
            </div>
          </>
        )}

        <div className="farm-tip" style={{ marginTop: 12 }}>
          钓到的鱼可以拿去做菜，也能在小卖部卖钱。心情不好的时候，来池塘边坐坐总是没错的。
        </div>
      </div>
    </div>
  );
}
