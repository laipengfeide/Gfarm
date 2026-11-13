'use client';
import { useEffect, useRef } from 'react';

interface Petal {
  x: number; y: number; r: number; vx: number; vy: number;
  rot: number; vr: number; color: string; alpha: number;
}

const COLORS = ['#f0c3bd', '#efb98a', '#dcc98f', '#c5d6a4', '#e8d3b0'];

export default function Petals({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const petals: Petal[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (initial: boolean) => {
      const p: Petal = {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20,
        r: 3 + Math.random() * 4,
        vx: -0.25 + Math.random() * 0.5,
        vy: 0.35 + Math.random() * 0.65,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.03,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.35 + Math.random() * 0.35,
      };
      petals.push(p);
    };

    resize();
    for (let i = 0; i < 20; i++) spawn(true);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.6);
      last = now;
      ctx.clearRect(0, 0, w, h);
      if (activeRef.current) {
        for (const p of petals) {
          p.x += (p.vx + Math.sin((now / 1000) * 0.8 + p.y / 90) * 0.35) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y > h + 20) { p.y = -16; p.x = Math.random() * w; }
          if (p.x < -20) p.x = w + 10;
          if (p.x > w + 20) p.x = -10;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.5, p.r * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = p.alpha * 0.5;
          ctx.fillStyle = '#fff9ec';
          ctx.beginPath();
          ctx.ellipse(-p.r * 0.4, -p.r * 0.2, p.r * 0.55, p.r * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (petals.length < 26 && Math.random() < 0.02) spawn(false);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas className="petal-canvas" ref={canvasRef} />;
}
