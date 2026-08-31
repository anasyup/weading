"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type CollectionItem = { title: string; line: string; img: string; href: string; position?: string };

const ITEMS: CollectionItem[] = [
  { title: "The Mehndi Green", line: "Colour, mirror-work & joy", img: "/uploads/pk-mehndi.jpg", href: "/occasions/mehndi" },
  { title: "The Nikkah Ivory", line: "Ivory whites & pearl details", img: "/uploads/pk-nikkah.jpg", href: "/occasions/nikkah" },
  { title: "The Baraat Red", line: "The classic red lehenga", img: "/uploads/pk-hero.jpg", href: "/occasions/baraat", position: "50% 30%" },
  { title: "The Walima Pastel", line: "Soft pastels & reception gowns", img: "/uploads/pk-walima.jpg", href: "/occasions/walima" },
  { title: "The Festive Organza", line: "Festive formal wear", img: "/uploads/p-blush-organza.jpg", href: "/occasions/party", position: "50% 25%" },
  { title: "The Ceremony Blush", line: "Dholki, engagement & more", img: "/uploads/pk-ceremony.jpg", href: "/occasions/others" },
];

/* White circular chevron button (reference style) — sits over the card edges. */
function CircleArrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={flip ? "-scale-x-100" : ""}>
      <path d="M14.5 5 7.5 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const arrowBtn =
  "absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_10px_26px_rgba(28,26,23,0.3)] transition-all duration-300 hover:scale-105 hover:text-gold-deep sm:h-11 sm:w-11";

export default function CollectionsCanvas() {
  const N = ITEMS.length;
  const [index, setIndex] = useState(1); // centre starts on The Nikkah Ivory
  const prev = useCallback(() => setIndex((i) => (i - 1 + N) % N), [N]);
  const next = useCallback(() => setIndex((i) => (i + 1) % N), [N]);

  const shown = [ITEMS[(index - 1 + N) % N], ITEMS[index], ITEMS[(index + 1) % N]];

  return (
    <div className="relative">
      {/* left/right circular arrows — vertically centred over the outer cards */}
      <button type="button" aria-label="Previous collection" onClick={prev} className={`${arrowBtn} left-2 sm:left-4`}>
        <CircleArrow />
      </button>
      <button type="button" aria-label="Next collection" onClick={next} className={`${arrowBtn} right-2 sm:right-4`}>
        <CircleArrow flip />
      </button>

      {/* 3 vertical cards — tight editorial gap */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {shown.map((it) => (
          <Link
            key={`${it.img}-${it.title}`}
            href={it.href}
            aria-label={it.line ? `${it.title} — ${it.line}` : it.title}
            className="group relative block aspect-[3/4] overflow-hidden bg-sand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={it.img}
              src={it.img}
              alt={`${it.title} — Pakistani bridal couture`}
              draggable={false}
              className="swap-in h-full w-full object-cover"
              style={it.position ? { objectPosition: it.position } : undefined}
            />
            {/* floating white label button */}
            <span className="absolute inset-x-0 bottom-4 flex justify-center sm:bottom-7">
              <span className="bg-white/95 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.22em] text-ink shadow-[0_8px_22px_rgba(28,26,23,0.18)] transition-all duration-300 group-hover:bg-white group-hover:text-gold-deep sm:px-6 sm:py-3 sm:text-[11px]">
                {it.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
