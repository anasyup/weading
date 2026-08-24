"use client";

// "Most Loved" card — hover crossfades from the full silhouette to a
// tighter detail crop of the same image (alt-angle feel) + gentle zoom.
export default function HoverSwapCard({
  mainSrc,
  name,
  sub,
  href,
  index,
}: {
  mainSrc: string;
  name: string;
  sub: string;
  href: string;
  index: string;
}) {
  return (
    <a href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        {/* Full silhouette */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainSrc}
          alt={name}
          loading="lazy"
          className="media-zoom absolute inset-0 h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-0"
        />
        {/* Detail crop (same frame, zoomed to the neckline/bodice) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainSrc}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{ objectPosition: "50% 18%", transform: "scale(1.35)", transformOrigin: "50% 18%" }}
        />
        <span className="absolute left-4 top-4 text-[10px] font-medium tracking-[0.3em] text-white/90 mix-blend-difference">
          {index}
        </span>
      </div>
      <div className="flex items-baseline justify-between pt-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl tracking-wide transition-colors duration-300 group-hover:text-gold-deep">
            {name}
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-stone-500">{sub}</p>
        </div>
        <span className="nav-link text-[10px] uppercase tracking-[0.24em] text-stone-500">Shop</span>
      </div>
    </a>
  );
}
