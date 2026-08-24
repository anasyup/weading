"use client";

import { useEffect, useRef } from "react";

// Full-bleed cinematic hero with a gentle scroll parallax (rAF-smoothed).
export default function ParallaxImage({
  src,
  alt,
  strength = 0.25,
  className = "",
}: {
  src: string;
  alt: string;
  strength?: number;
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = img.parentElement?.getBoundingClientRect();
        if (!rect) return;
        // Only translate while the section is in view
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const progress = -rect.top / Math.max(rect.height, 1); // 0 → 1
          img.style.transform = `translateY(${(progress * strength * 100).toFixed(2)}%) scale(1.12)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="h-full w-full object-cover will-change-transform"
        style={{ transform: "scale(1.12)" }}
      />
    </div>
  );
}
