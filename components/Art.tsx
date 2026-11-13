'use client';
import { useEffect, useState } from 'react';
import { probeImage } from '@/lib/media';
import { warnMissingArt } from '@/lib/art';

/**
 * 物品 / 菜谱插画缩略图。传 src 就显示插画；
 * 没有图或加载失败则用同风格奶油色占位（带淡化的图标），并在控制台打出缺图路径。
 */
export default function ArtThumb({
  src, icon, alt, size = 56, className = '',
}: { src?: string; icon: string; alt?: string; size?: number; className?: string }) {
  const [bad, setBad] = useState(false);

  useEffect(() => {
    if (!src) { warnMissingArt('thumb', alt || 'unknown'); return; }
    let alive = true;
    setBad(false);
    probeImage(src).then((ok) => { if (alive && !ok) setBad(true); });
    return () => { alive = false; };
  }, [src, alt]);

  if (!src || bad) {
    return (
      <span className={`art-ph ${className}`} style={{ width: size, height: size }} aria-label={alt} role="img">
        <span className="art-ph-ico" style={{ fontSize: Math.round(size * 0.42) }}>{icon}</span>
      </span>
    );
  }
  return (
    <img
      className={`art-thumb ${className}`}
      style={{ width: size, height: size }}
      src={src}
      alt={alt ?? ''}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBad(true)}
    />
  );
}
