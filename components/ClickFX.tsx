'use client';
import { useEffect } from 'react';
import { playClick } from '@/lib/audio';

/** 可点击的地方：按钮、场景热区、卡片、页签等 */
const CLICKABLE = 'button, a, [role="button"], .hotspot, .item-card, .tab, .nav-item, .recipe-pill';

/**
 * 统一的点击反馈：水波纹 + 一声轻响。
 * 挂在 document 上，所有按钮/热区自动生效，不需要在每个地方手写。
 */
export default function ClickFX() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest(CLICKABLE) as HTMLElement | null;
      if (!el) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      if ((e as PointerEvent).button !== 0) return;

      playClick();

      const color = getComputedStyle(document.documentElement).getPropertyValue('--fx-ripple').trim()
        || 'rgba(248,232,198,.85)';
      const dot = document.createElement('span');
      dot.className = 'click-ripple';
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.setProperty('--ripple-color', color);
      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 260);
    };

    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);

  return null;
}
