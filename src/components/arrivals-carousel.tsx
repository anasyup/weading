"use client";

import { Children, useEffect, useRef } from "react";

/* Slow luxury drift — px per animation frame (~33px/s at 60fps). */
const DRIFT_SPEED = 0.55;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {dir === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}

/* Continuous auto-scrolling marquee — 4 cards visible on desktop (lg+),
   ~1.6 on mobile. The card set is rendered twice and the track wraps at
   exactly one set-width, so the loop is seamless with no empty gap.
   - Hover any card → auto-scroll pauses (resumes on leave)
   - Touch swipe → pauses briefly, then resumes
   - Side arrows step one card at a time (auto-drift resumes after)     */
export default function ArrivalsCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const resumeAtRef = useRef(0);
  const items = Children.toArray(children);

  /* Seamless wrap distance = distance between the two identical copies. */
  const getWrap = (el: HTMLDivElement) => {
    const half = el.children.length / 2;
    const a = el.children[0] as HTMLElement | undefined;
    const b = el.children[half] as HTMLElement | undefined;
    if (!a || !b) return 0;
    return b.offsetLeft - a.offsetLeft;
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const tick = () => {
      const paused = hoverRef.current || Date.now() < resumeAtRef.current;
      if (!paused && !reduce) {
        el.scrollLeft += DRIFT_SPEED;
        const wrap = getWrap(el);
        if (wrap > 0 && el.scrollLeft >= wrap) el.scrollLeft -= wrap;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  /* Manual step — exactly one card width, pausing the drift briefly. */
  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const w = first ? first.offsetWidth + 24 : el.clientWidth / 4; // card + gap
    const wrap = getWrap(el);
    resumeAtRef.current = Date.now() + 2200;

    // Normalize before stepping so the smooth animation never crosses a seam
    if (wrap > 0 && el.scrollLeft + w >= wrap) el.scrollLeft -= wrap;
    if (wrap > 0 && dir === -1 && el.scrollLeft <= 0) el.scrollLeft += wrap;

    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      onTouchStart={() => (resumeAtRef.current = Date.now() + 5000)}
    >
      {/* Track — duplicates the card set for a gapless infinite loop */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div
            key={i}
            className="flex-none basis-[62%] sm:basis-[45%] lg:basis-[calc(25%-1.125rem)]"
          >
            {child}
          </div>
        ))}
        {items.map((child, i) => (
          <div
            key={`dup-${i}`}
            aria-hidden="true"
            className="flex-none basis-[62%] sm:basis-[45%] lg:basis-[calc(25%-1.125rem)]"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Prev / Next — clean round arrows, desktop only (mobile drags) */}
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous products"
        className="absolute left-2 top-[33%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_10px_28px_rgba(28,26,23,0.16)] transition-all duration-300 hover:bg-ink hover:text-cream lg:flex"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Next products"
        className="absolute right-2 top-[33%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_10px_28px_rgba(28,26,23,0.16)] transition-all duration-300 hover:bg-ink hover:text-cream lg:flex"
      >
        <Chevron dir="right" />
      </button>
    </div>
  );
}
