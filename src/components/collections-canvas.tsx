"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
type Item = { title: string; line: string; img: string; href: string; position?: string };

type CollectionItem = Item;
type ArrowStyle = "filigree" | "line";

const ITEMS: CollectionItem[] = [
  { title: "The Mehndi Green", line: "Colour, mirror-work & joy", img: "/uploads/pk-mehndi.jpg", href: "/occasions/mehndi" },
  { title: "The Nikkah Ivory", line: "Ivory whites & pearl details", img: "/uploads/pk-nikkah.jpg", href: "/occasions/nikkah" },
  { title: "The Baraat Red", line: "The classic red lehenga", img: "/uploads/pk-hero.jpg", href: "/occasions/baraat" },
  { title: "The Walima Pastel", line: "Soft pastels & reception gowns", img: "/uploads/pk-walima.jpg", href: "/occasions/walima" },
  { title: "The Festive Organza", line: "Festive formal wear", img: "/uploads/p-blush-organza.jpg", href: "/occasions/party" },
  { title: "The Ceremony Blush", line: "Dholki, engagement & more", img: "/uploads/pk-ceremony.jpg", href: "/occasions/others" },
];

/* Allure-style 3-frame geometry (unchanged): the center frame is tallest and
   top-anchored; flankers are shorter, offset downward and overlap its edges in
   front, with a soft shadow. */
const FRAMES = {
  left: { left: "0%", top: "6.6%", width: "33.7%", height: "86.1%", z: "z-20", shadow: true },
  center: { left: "32.1%", top: "0%", width: "39.7%", height: "100%", z: "z-10", shadow: false },
  right: { left: "71%", top: "11.5%", width: "29%", height: "75.4%", z: "z-20", shadow: true },
} as const;

/* Custom navigation arrow — polished copper archway outline filled with a
   delicate filigree pattern, with an integrated copper arrowhead. `flip`
   mirrors the same piece for the right arrow. */
function CopperArrow({ flip = false }: { flip?: boolean }) {
  const u = flip ? "r" : "l";
  return (
    <svg
      viewBox="0 0 60 96"
      aria-hidden="true"
      className={`h-16 w-10 sm:h-[4.5rem] sm:w-11 lg:h-20 lg:w-[3.25rem] ${flip ? "-scale-x-100" : ""}`}
    >
      <defs>
        <linearGradient id={`cu-a-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eec39a" />
          <stop offset="0.45" stopColor="#cf8f4e" />
          <stop offset="1" stopColor="#7e4c21" />
        </linearGradient>
        <linearGradient id={`cu-b-${u}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#e8b47f" />
          <stop offset="1" stopColor="#9a6230" />
        </linearGradient>
      </defs>
      {/* archway outline */}
      <path
        d="M30 7C19 7 11 17 11 31v56h38V31C49 17 41 7 30 7Z"
        fill="rgba(250,248,244,0.55)"
        stroke={`url(#cu-a-${u})`}
        strokeWidth="2.5"
      />
      {/* inner arch echo */}
      <path
        d="M30 14c-8 0-13.5 7.5-13.5 19.5V81h27V33.5C43.5 21.5 38 14 30 14Z"
        fill="none"
        stroke={`url(#cu-a-${u})`}
        strokeWidth="1"
        opacity="0.6"
      />
      {/* filigree heart + curls */}
      <path
        d="M30 77c-5-3.5-5-10.5 0-13.5 5 3 5 10 0 13.5Z"
        fill="none"
        stroke={`url(#cu-b-${u})`}
        strokeWidth="1.1"
        opacity="0.9"
      />
      <path
        d="M22.5 72c-3-3.5-2.3-8 1-10"
        fill="none"
        stroke={`url(#cu-b-${u})`}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M37.5 72c3-3.5 2.3-8-1-10"
        fill="none"
        stroke={`url(#cu-b-${u})`}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="30" cy="82.5" r="1.4" fill={`url(#cu-b-${u})`} />
      <circle cx="24" cy="80" r="0.9" fill={`url(#cu-b-${u})`} opacity="0.85" />
      <circle cx="36" cy="80" r="0.9" fill={`url(#cu-b-${u})`} opacity="0.85" />
      {/* integrated arrowhead (points left; mirrored for the right arrow) */}
      <path d="M41 47H21" stroke={`url(#cu-a-${u})`} strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M31 37.5 17.5 47 31 56.5"
        fill="none"
        stroke={`url(#cu-a-${u})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44.5" cy="47" r="1.3" fill={`url(#cu-a-${u})`} />
    </svg>
  );
}

/* Minimalist alternative — thin ring + line chevron in ink/gold. */
function LineArrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={`h-10 w-10 text-ink transition-colors duration-300 group-hover/arrow:text-gold-deep sm:h-12 sm:w-12 ${flip ? "-scale-x-100" : ""}`}
    >
      <circle cx="24" cy="24" r="21" fill="rgba(250,248,244,0.75)" stroke="currentColor" strokeWidth="1.4" />
      <path d="M27 16l-8 8 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CollectionsCanvas({
  items = ITEMS,
  arrowStyle = "filigree",
}: {
  items?: CollectionItem[];
  arrowStyle?: ArrowStyle;
}) {
  const list = items.length >= 3 ? items : ITEMS;
  const N = list.length;
  const [index, setIndex] = useState(1);
  const prev = useCallback(() => setIndex((i) => (i - 1 + N) % N), [N]);
  const next = useCallback(() => setIndex((i) => (i + 1) % N), [N]);

  const shown = {
    left: list[(index - 1 + N) % N],
    center: list[index % N],
    right: list[(index + 1) % N],
  };

  const Arrow = arrowStyle === "line" ? LineArrow : CopperArrow;

  return (
    <div className="relative">
      {/* nav arrows — vertically centred on the image row */}
      <button
        type="button"
        aria-label="Previous dress"
        onClick={prev}
        className="group/arrow absolute left-0.5 top-1/2 z-30 -translate-y-1/2 transition-all duration-300 hover:scale-110 sm:left-1 lg:left-2"
        style={arrowStyle === "filigree" ? { filter: "drop-shadow(0 6px 14px rgba(126,76,33,0.4))" } : undefined}
      >
        <Arrow />
      </button>
      <button
        type="button"
        aria-label="Next dress"
        onClick={next}
        className="group/arrow absolute right-0.5 top-1/2 z-30 -translate-y-1/2 transition-all duration-300 hover:scale-110 sm:right-1 lg:right-2"
        style={arrowStyle === "filigree" ? { filter: "drop-shadow(0 6px 14px rgba(126,76,33,0.4))" } : undefined}
      >
        <Arrow flip />
      </button>

      {/* 3-frame layered canvas (composition itself unchanged) */}
      <div className="relative mx-auto aspect-[1108/610] w-[135%] max-w-none -translate-x-[12.9%] sm:w-[82%] sm:max-w-[820px] sm:translate-x-0">
        {(["left", "center", "right"] as const).map((slot) => {
          const g = FRAMES[slot];
          const it = shown[slot];
          return (
            <Link
              key={`${slot}-${it.img}-${it.title}`}
              href={it.href}
              aria-label={it.line ? `${it.title} — ${it.line}` : it.title}
              className={`group absolute block overflow-hidden bg-sand ${g.z} ${
                g.shadow ? "shadow-[0_18px_50px_rgba(28,26,23,0.16)]" : ""
              } transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.2,0.6,0.2,1)] hover:z-50 hover:scale-[1.045] hover:shadow-[0_26px_64px_rgba(28,26,23,0.28)] motion-reduce:transition-none motion-reduce:hover:transform-none`}
              style={{ left: g.left, top: g.top, width: g.width, height: g.height }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={it.img}
                src={it.img}
                alt={`${it.title} — Pakistani bridal couture`}
                draggable={false}
                className="swap-in h-full w-full object-cover"
              />
              {/* hover caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-cream opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:p-4">
                <p className="font-[family-name:var(--font-display)] text-base font-light tracking-wide sm:text-xl">
                  {it.title}
                </p>
                {it.line && (
                  <p className="mt-0.5 hidden text-[8px] font-light uppercase tracking-[0.2em] text-cream/75 sm:block sm:text-[9px]">
                    {it.line}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
