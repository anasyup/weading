"use client";

import { Children, useRef } from "react";

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

/* Horizontal product carousel — 4 cards visible on desktop (lg+),
   ~1.6 cards on mobile with touch swipe + snap. Side arrows on desktop,
   native swipe on mobile. Scrollbar hidden for a clean editorial look. */
export default function ArrivalsCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <div className="flex-none basis-[62%] snap-start sm:basis-[45%] lg:basis-[calc(25%-1.125rem)]">
            {child}
          </div>
        ))}
      </div>

      {/* Prev / Next — luxury minimal circles, desktop only (mobile swipes) */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Previous products"
        className="absolute left-2 top-[33%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_10px_28px_rgba(28,26,23,0.16)] transition-all duration-300 hover:bg-ink hover:text-cream lg:flex"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Next products"
        className="absolute right-2 top-[33%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_10px_28px_rgba(28,26,23,0.16)] transition-all duration-300 hover:bg-ink hover:text-cream lg:flex"
      >
        <Chevron dir="right" />
      </button>
    </div>
  );
}
