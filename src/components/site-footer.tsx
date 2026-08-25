import Link from "next/link";
import NewsletterForm from "./newsletter-form";

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M10 20c1-4 1.5-6 2-8.5" />
        <path d="M12 9.5c2.5-1 4.5.5 4.5 2.5S15 16 13 16s-2.6-1-2.5-2" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 3v9.5a3.5 3.5 0 1 1-3.5-3.5" />
        <path d="M14 5c.8 2.2 2.4 3.5 5 3.8" />
      </svg>
    ),
  },
];

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "For Brides",
    links: [
      ["Shop All", "/shop"],
      ["Collections", "/collections"],
      ["Accessories", "/accessories"],
      ["Journal", "/blog"],
    ],
  },
  {
    title: "Occasions",
    links: [
      ["Nikkah", "/occasions/nikkah"],
      ["Mehndi", "/occasions/mehndi"],
      ["Baraat", "/occasions/baraat"],
      ["Walima", "/occasions/walima"],
    ],
  },
  {
    title: "Explore",
    links: [
      ["About Us", "/pages/about"],
      ["FAQ", "/faq"],
      ["Contact", "/support"],
      ["Track Order", "/account"],
      ["Terms & Privacy", "/pages/terms"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer>
      {/* Manifesto — centered, white */}
      <div className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.34em] text-ink">
            The dress of your celebration
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-light leading-relaxed text-stone-600">
            Some dresses are worn once and remembered forever. Ours are hand-embroidered in
            Pakistan — zardozi, dabka, resham — cut to your measurements and made only after you
            order, then shipped across the USA.
          </p>
          <div className="mx-auto mt-9 max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Dark footer — navy ink, big brand + columns */}
      <div className="bg-ink text-cream">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,1fr))] lg:py-20">
          {/* Brand */}
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-light tracking-[0.22em] sm:text-3xl">
              BRIDAL DRESSES
            </p>
            <p className="mt-5 max-w-xs text-xs font-light leading-relaxed text-cream/60">
              Handcrafted Pakistani bridal couture — zardozi, dabka and resham, made to order and
              shipped across the USA.
            </p>
            <div className="mt-6 flex gap-4 text-cream/50">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:text-cream"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/40">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="nav-link text-xs font-light uppercase tracking-[0.18em] text-cream/70 transition-colors hover:text-cream"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Legal bar */}
        <div className="border-t border-cream/15">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-6 py-6 text-[10px] font-light uppercase tracking-[0.22em] text-cream/40 sm:flex-row">
            <p>© {new Date().getFullYear()} Bridal Dresses. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/pages/terms" className="transition-colors hover:text-cream">Terms</Link>
              <Link href="/pages/privacy" className="transition-colors hover:text-cream">Privacy</Link>
              <Link href="/pages/shipping" className="transition-colors hover:text-cream">Shipping</Link>
              <Link href="/pages/returns" className="transition-colors hover:text-cream">Returns</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
