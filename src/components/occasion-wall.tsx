"use client";

import Link from "next/link";
import { useState } from "react";

// Full-screen occasion wall: a full-bleed background that crossfades as you
// hover the four centered occasion names. Text-only, minimalist.
const ITEMS = [
  { label: "NIKKAH", href: "/occasions/nikkah", img: "/uploads/pk-nikkah.jpg" },
  { label: "MEHNDI", href: "/occasions/mehndi", img: "/uploads/pk-mehndi.jpg" },
  { label: "BARAAT", href: "/occasions/baraat", img: "/uploads/pk-baraat.jpg" },
  { label: "WALIMA", href: "/occasions/walima", img: "/uploads/pk-walima.jpg" },
] as const;

export default function OccasionWall() {
  const [active, setActive] = useState(0);

  return (
    <div className="absolute inset-0">
      {/* Crossfading full-bleed backgrounds */}
      {ITEMS.map((item, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.label}
          src={item.img}
          alt=""
          aria-hidden={i !== active}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1300ms] ease-[cubic-bezier(0.2,0.6,0.2,1)] ${
            i === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
          }`}
        />
      ))}

      {/* Light dark overlay — text stays readable */}
      <div className="absolute inset-0 bg-ink/45" />

      {/* Centered occasion names (text only) */}
      <nav
        aria-label="Shop by occasion"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-7 px-6 sm:gap-9"
      >
        {ITEMS.map((item, i) => {
          const isActive = i === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`nav-roman nav-link whitespace-nowrap py-1 text-[1.55rem] font-normal leading-none tracking-[0.34em] transition-all duration-500 sm:text-4xl lg:text-[2.55rem] ${
                isActive ? "text-cream" : "text-cream/55 hover:text-cream/85"
              }`}
              data-active={isActive}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
