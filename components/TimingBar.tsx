'use client';
import { useEffect, useRef, useState } from 'react';

export type Judgement = 'perfect' | 'success' | 'fail';

interface Props {
  /** 是否处于判定阶段 */
  active: boolean;
  /** 每次重新开始时 +1，用来复位 */
  runId: number;
  /** 光标往返速度（越大越快） */
  speed?: number;
  /** 完美区间（百分比 0~100） */
  perfect?: [number, number];
  /** 成功区间 */
  success?: [number, number];
  buttonLabel?: string;
  onJudge: (result: Judgement, value: number) => void;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/**
 * 统一的时机判定条：色带看得见、光标够粗、判定按时间戳算（掉帧也不影响结果）。
 * 做饭与钓鱼都用它，改一次全局生效。
 */
export default function TimingBar({
  active, runId, speed = 2.1, perfect = [64, 76], success = [48, 88], buttonLabel = '落铲', onJudge,
}: Props) {
  const [value, setValue] = useState(50);
  const [judged, setJudged] = useState<Judgement | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const holdRef = useRef<number | undefined>(undefined);
  const valueRef = useRef(50);

  useEffect(() => {
    setJudged(null);
    setValue(50);
    valueRef.current = 50;
    if (!active) { cancelAnimationFrame(rafRef.current); return; }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      // 只用于画面，判定会另外用按下那一刻的时间戳重算
      const v = 50 + 47 * Math.sin(t * speed);
      valueRef.current = v;
      setValue(v);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (holdRef.current) window.clearTimeout(holdRef.current);
    };
  }, [active, runId, speed]);

  const judgeAt = (v: number): Judgement => {
    if (v >= perfect[0] && v <= perfect[1]) return 'perfect';
    if (v >= success[0] && v <= success[1]) return 'success';
    return 'fail';
  };

  const stop = () => {
    if (!active || judged) return;
    cancelAnimationFrame(rafRef.current);
    // 用按下这一刻的时间戳判定：即使这一帧丢了，结果也一致
    const elapsed = (performance.now() - startRef.current) / 1000;
    const exact = clamp(50 + 47 * Math.sin(elapsed * speed));
    valueRef.current = exact;
    setValue(exact);
    const result = judgeAt(exact);
    setJudged(result);
    holdRef.current = window.setTimeout(() => onJudge(result, exact), 700);
  };

  const label = judged === 'perfect' ? '完美' : judged === 'success' ? '成功' : '失败';
  const inPerfect = value >= perfect[0] && value <= perfect[1];
  const inSuccess = !inPerfect && value >= success[0] && value <= success[1];

  return (
    <div className="tbar">
      <div className="tbar-track" role="presentation">
        <span className="tbar-zone tbar-fail" />
        <span
          className="tbar-zone tbar-success"
          style={{ left: `${success[0]}%`, width: `${success[1] - success[0]}%` }}
        />
        <span className="tbar-zone tbar-perfect-glow" style={{ left: `${perfect[0]}%`, width: `${perfect[1] - perfect[0]}%` }} />
        <span
          className="tbar-zone tbar-perfect"
          style={{ left: `${perfect[0]}%`, width: `${perfect[1] - perfect[0]}%` }}
        />
        <span className={`tbar-tick ${inPerfect ? 'on' : ''}`} style={{ left: `${value}%` }} />
        {judged && <span className={`tbar-judge ${judged}`}>{label}</span>}
      </div>

      <div className="tbar-labels">
        <span className={`tbar-tag fail ${judged === 'fail' ? 'hit' : ''}`}>失败区</span>
        <span className={`tbar-tag success ${judged === 'success' || inSuccess ? 'hit' : ''}`}>成功</span>
        <span className={`tbar-tag perfect ${judged === 'perfect' || inPerfect ? 'hit' : ''}`}>完美</span>
      </div>

      <div className="tbar-foot">
        <span className="tbar-hint">
          {judged
            ? judged === 'perfect' ? '手感正好。' : judged === 'success' ? '还差一点点火候。' : '这次没赶上，下次慢半拍。'
            : '让光标停在金色窄带里，落点越快越准。'}
        </span>
        <button className="btn btn-primary" disabled={!active || !!judged} onClick={stop}>
          {judged ? '…' : buttonLabel}
        </button>
      </div>
    </div>
  );
}
