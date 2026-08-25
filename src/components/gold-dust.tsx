"use client";

import { useEffect, useRef } from "react";

// Floating gold-dust particle field (Canvas 2D — no WebGL dependency).
// Elegant, slow, champagne-toned. GPU-light: pre-rendered radial sprite,
// DPR-capped, paused off-screen/hidden, reduced count on low-power devices,
// fully disabled under prefers-reduced-motion.
export default function GoldDust({
  className = "",
  density = 1,
}: {
  className?: string;
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lowPower = cores <= 4 || mem <= 4;

    // Pre-rendered gold radial sprite (single draw, reused every frame)
    const sprite = document.createElement("canvas");
    const S = 32;
    sprite.width = S;
    sprite.height = S;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const g = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.addColorStop(0, "rgba(216, 180, 130, 0.85)");
      g.addColorStop(0.4, "rgba(200, 160, 110, 0.30)");
      g.addColorStop(1, "rgba(200, 160, 110, 0)");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, S, S);
    }

    const base = Math.min(80, Math.max(22, Math.floor((w * h) / 30000) * density));
    const count = lowPower ? Math.max(8, Math.floor(base / 3)) : base;

    type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number; sp: number };
    const parts: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.1 + Math.random() * 3.2,
      vx: (Math.random() - 0.5) * 0.07,
      vy: -(0.04 + Math.random() * 0.15),
      a: 0.2 + Math.random() * 0.5,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.8,
    }));

    let tx = 0.5;
    let ty = 0.5;
    let mx = 0.5;
    let my = 0.5;
    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      tx = (e.clientX - rect.left) / Math.max(rect.width, 1);
      ty = (e.clientY - rect.top) / Math.max(rect.height, 1);
    };
    parent.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    let inView = true;
    let raf = 0;
    let t = 0;
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    io.observe(parent);
    const onVis = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || !inView) return;
      t += 0.016;
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx + (mx - 0.5) * 0.2 * p.sp;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        const tw = p.a * (0.66 + 0.34 * Math.sin(t * p.sp * 1.6 + p.ph));
        ctx.globalAlpha = tw;
        const d = p.r * 6;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      parent.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ zIndex: 1 }}
    />
  );
}

// Soft luminous champagne shape that follows the cursor with heavy easing.
export function CursorGlow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    let tx = 0.5;
    let ty = 0.5;
    let x = 0.5;
    let y = 0.5;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      tx = (e.clientX - rect.left) / Math.max(rect.width, 1);
      ty = (e.clientY - rect.top) / Math.max(rect.height, 1);
    };
    parent.addEventListener("pointermove", onMove, { passive: true });
    const loop = () => {
      raf = requestAnimationFrame(loop);
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      el.style.transform = `translate3d(${(x * 100).toFixed(2)}%, ${(y * 100).toFixed(2)}%, 0) translate(-50%, -50%)`;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 top-0 h-[36rem] w-[36rem] rounded-full ${className}`}
      style={{
        background:
          "radial-gradient(closest-side, rgba(216,180,130,0.22), rgba(216,180,130,0.06) 55%, transparent 72%)",
        zIndex: 1,
      }}
    />
  );
}
