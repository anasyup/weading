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
      ["Wedding Dresses", "/shop"],
      ["Collections", "/collections"],
      ["Accessories", "/accessories"],
      ["Appointment Request", "/support"],
    ],
  },
  {
    title: "Services",
    links: [
      ["Store Finder", "/#stores"],
      ["Trunk Shows", "/blog"],
      ["Consultations", "/support"],
      ["Order Tracking", "/account"],
    ],
  },
  {
    title: "Company & Legal",
    links: [
      ["About Us", "/pages/about"],
      ["Press", "/blog"],
      ["Contact", "/support"],
      ["Terms & Privacy", "/pages/terms"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream">
      {/* Newsletter band */}
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-6 py-12 md:grid-cols-2">
          <div>
            <p className="eyebrow">The List</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-light tracking-wide">
              First looks, trunk shows &amp; atelier stories
            </h2>
          </div>
          <div className="md:justify-self-end md:w-96">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-light tracking-[0.14em]">
            BRIDAL DRESSES
          </p>
          <p className="mt-4 max-w-xs text-xs font-light leading-relaxed text-stone-500">
            High-fashion wedding dresses, made to measure. Hand-crafted in our atelier —
            debuting in the United States.
          </p>
          <div className="mt-6 flex gap-4 text-stone-500">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.name}
                className="transition-all duration-300 hover:-translate-y-0.5 hover:text-ink"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-400">{col.title}</p>
            <ul className="mt-5 space-y-3">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="nav-link text-xs font-light tracking-wide text-stone-600 hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Legal bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-[10px] font-light uppercase tracking-[0.22em] text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Bridal Dresses. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/pages/terms" className="hover:text-ink">Terms</Link>
            <Link href="/pages/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/pages/shipping" className="hover:text-ink">Shipping</Link>
            <Link href="/pages/returns" className="hover:text-ink">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
