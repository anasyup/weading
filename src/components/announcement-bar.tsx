const MESSAGE =
  "Handcrafted Pakistani Bridal Couture • Made to Order 30–45 Days • Shipping Across USA";

// Premium fashion-house announcement strip — white, slim, slow seamless marquee.
export default function AnnouncementBar() {
  return (
    <div
      className="flex h-9 items-center overflow-hidden border-b border-line/60 bg-white text-ink"
      role="note"
      aria-label={MESSAGE}
    >
      <span className="sr-only">{MESSAGE}</span>
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="mx-10 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.3em] sm:text-[10px]"
              >
                {MESSAGE}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
