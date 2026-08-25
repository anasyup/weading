"use client";

import Link from "next/link";
import { useState } from "react";

// Editorial label/image switcher (Milla-style): large stacked text labels on
// the left, crossfading imagery on the right. Hover on desktop, tap on mobile.
const ITEMS = [
  { label: "NIKKAH", href: "/occasions/nikkah", img: "/uploads/pk-nikkah.jpg", note: "Ivory whites & pearl details" },
  { label: "MEHNDI", href: "/occasions/mehndi", img: "/uploads/pk-mehndi.jpg", note: "Colour, mirror-work & joy" },
  { label: "BARAAT", href: "/occasions/baraat", img: "/uploads/pk-baraat.jpg", note: "The classic red lehenga" },
  { label: "WALIMA", href: "/occasions/walima", img: "/uploads/pk-walima.jpg", note: "Soft pastels & reception gowns" },
  { label: "ACCESSORIES", href: "/accessories", img: "/uploads/lux-cat-accessories.jpg", note: "Veils, sleeves & finishing pieces" },
] as const;

export default function OccasionSwitcher() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16">
      {/* Labels */}
      <div>
        <ul className="flex gap-6 overflow-x-auto pb-2 lg:block lg:space-y-7 lg:overflow-visible lg:pb-0">
          {ITEMS.map((item, i) => {
            const isActive = i === active;
            return (
              <li key={item.label} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  className={`nav-link whitespace-nowrap text-left text-xl font-light uppercase tracking-[0.3em] transition-colors duration-500 sm:text-2xl lg:text-[1.7rem] ${
                    isActive ? "text-ink" : "text-stone-300 hover:text-stone-500"
                  }`}
                  data-active={isActive}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 hidden lg:block">
          <p className="text-xs font-light tracking-wide text-stone-500 transition-opacity duration-500">
            {ITEMS[active].note}
          </p>
          <Link
            href={ITEMS[active].href}
            className="nav-link mt-3 inline-block border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
          >
            Discover
          </Link>
        </div>
      </div>

      {/* Crossfading imagery */}
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand sm:aspect-[5/4] lg:aspect-auto lg:h-[62vh] lg:min-h-[440px]">
          {ITEMS.map((item, i) => {
            const isActive = i === active;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.label}
                src={item.img}
                alt={isActive ? `${item.label} — Pakistani bridal couture` : ""}
                aria-hidden={!isActive}
                loading={i === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.6,0.2,1)] ${
                  isActive ? "scale-100 opacity-100" : "scale-[1.05] opacity-0"
                }`}
              />
            );
          })}
        </div>
        {/* Mobile discover link */}
        <div className="mt-5 lg:hidden">
          <p className="text-xs font-light tracking-wide text-stone-500">{ITEMS[active].note}</p>
          <Link
            href={ITEMS[active].href}
            className="nav-link mt-2 inline-block border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink"
          >
            Discover
          </Link>
        </div>
      </div>
    </div>
  );
}
