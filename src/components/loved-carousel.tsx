"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Most Loved" silhouettes carousel — touch-swipe (native scroll + snap),
 * mouse drag on desktop, discreet arrows + pagination dots.
 * Zero dependencies: CSS scroll-snap + pointer events.
 */

type Slide = {
  title: string;
  line: string;
  img: string;
  href: string;
  position?: string;
};

const SLIDES: Slide[] = [
  { title: "The Nikkah Ivory", line: "Ivory whites & pearl details", img: "/uploads/pk-nikkah.jpg", href: "/occasions/nikkah" },
  { title: "The Mehndi Green", line: "Colour, mirror-work & joy", img: "/uploads/pk-mehndi.jpg", href: "/occasions/mehndi" },
  { title: "The Baraat Red", line: "The classic red lehenga", img: "/uploads/pk-hero.jpg", href: "/occasions/baraat", position: "50% 30%" },
  { title: "The Walima Pastel", line: "Soft pastels & reception gowns", img: "/uploads/pk-walima.jpg", href: "/occasions/walima" },
  { title: "The Festive Organza", line: "Festive formal wear", img: "/uploads/p-blush-organza.jpg", href: "/occasions/party", position: "50% 25%" },
  { title: "The Ceremony Blush", line: "Dholki, engagement & more", img: "/uploads/pk-ceremony.jpg", href: "/occasions/others" },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export default function LovedCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const rafRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);

  const step = useCallback(() => {
    const t = trackRef.current;
    if (!t) return 0;
    if (t.children.length > 1) {
      return (
        (t.children[1] as HTMLElement).offsetLeft - (t.children[0] as HTMLElement).offsetLeft
      );
    }
    return t.clientWidth;
  }, []);

  const smooth = useCallback(
    (): ScrollBehavior =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    []
  );

  const update = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const s = step();
    if (s > 0) setIndex(clamp(Math.round(t.scrollLeft / s), 0, SLIDES.length - 1));
    setAtStart(t.scrollLeft <= 6);
    setAtEnd(t.scrollLeft >= t.scrollWidth - t.clientWidth - 6);
  }, [step]);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(update);
  }, [update]);

  const scrollToIndex = useCallback(
    (i: number) => {
      const t = trackRef.current;
      if (!t) return;
      const target = clamp(i, 0, SLIDES.length - 1);
      t.scrollTo({ left: target * step(), behavior: smooth() });
    },
    [step, smooth]
  );

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  /* -------- mouse drag (touch uses native swipe) -------- */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const t = trackRef.current;
    if (!t) return;
    dragRef.current = { startX: e.clientX, startScroll: t.scrollLeft, moved: false };
    t.style.scrollSnapType = "none";
    t.style.scrollBehavior = "auto";
    t.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const t = trackRef.current;
    if (!d || !t) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    t.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const t = trackRef.current;
    if (!d || !t) return;
    dragRef.current = null;
    try {
      t.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    t.style.scrollSnapType = "";
    t.style.scrollBehavior = "";
    setDragging(false);
    if (d.moved) {
      suppressClickRef.current = true;
      const s = step();
      if (s > 0) {
        const idx = clamp(Math.round(t.scrollLeft / s), 0, SLIDES.length - 1);
        t.scrollTo({ left: idx * s, behavior: smooth() });
      }
      // release click-suppression after the trailing click events fire
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    }
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div>
      <div className="relative">
        {/* arrows */}
        <button
          type="button"
          aria-label="Previous silhouette"
          onClick={() => scrollToIndex(index - 1)}
          disabled={atStart}
          className="absolute -left-2 top-[42%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-cream/85 text-ink backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold-deep disabled:pointer-events-none disabled:opacity-0 sm:-left-5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next silhouette"
          onClick={() => scrollToIndex(index + 1)}
          disabled={atEnd}
          className="absolute -right-2 top-[42%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-cream/85 text-ink backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold-deep disabled:pointer-events-none disabled:opacity-0 sm:-right-5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* track */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          className={`no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto select-none ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {SLIDES.map((s) => (
            <div
              key={s.title}
              className="w-[76%] flex-none snap-start sm:w-[44%] lg:w-[31.5%]"
            >
              <Link
                href={s.href}
                className="group relative block aspect-[3/4] overflow-hidden bg-sand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt={`${s.title} — Pakistani bridal couture`}
                  loading="lazy"
                  draggable={false}
                  className="media-zoom h-full w-full object-cover"
                  style={s.position ? { objectPosition: s.position } : undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-cream sm:p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-light tracking-wide sm:text-[1.7rem]">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[9px] font-light uppercase tracking-[0.22em] text-cream/75 sm:text-[10px]">
                    {s.line}
                  </p>
                  <span className="nav-link mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.24em] text-cream">
                    Explore →
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* pagination dots */}
      <div className="mt-8 flex items-center justify-center gap-2.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Go to ${s.title}`}
            aria-current={i === index}
            onClick={() => scrollToIndex(i)}
            className={`h-[5px] rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-gold-deep" : "w-[5px] bg-ink/20 hover:bg-ink/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
