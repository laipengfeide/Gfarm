'use client';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { probeImage } from '@/lib/media';

/**
 * 带兜底的场景图：图加载失败时显示暖色占位卡，并把缺失路径打到控制台，
 * 不会静默留白。src 使用相对路径（assets/xxx.jpg），静态导出后同样可用。
 */
export default function BgImage({
  src, className, style, children,
}: { src: string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    probeImage(src).then((ok) => { if (alive && !ok) setFailed(true); });
    return () => { alive = false; };
  }, [src]);

  return (
    <div
      className={`${className ?? ''} ${failed ? 'bg-failed' : ''}`}
      style={{ ...style, backgroundImage: `url('${src}')` }}
    >
      {failed && (
        <div className="bg-holder">
          <span>这张图没找到</span>
          <small>{src}</small>
        </div>
      )}
      {children}
    </div>
  );
}
