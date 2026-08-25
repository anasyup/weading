"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AnnouncementBar from "./announcement-bar";

const OCCASIONS = [
  { label: "Nikkah", slug: "nikkah", line: "Ivory whites & pearl details" },
  { label: "Mehndi", slug: "mehndi", line: "Colour, mirror-work & joy" },
  { label: "Baraat", slug: "baraat", line: "The classic red lehenga" },
  { label: "Walima", slug: "walima", line: "Soft pastels & reception gowns" },
  { label: "Party", slug: "party", line: "Festive formal wear" },
  { label: "Others", slug: "others", line: "Dholki, engagement & more" },
] as const;

const NAV = [
  { label: "Bridal", href: "/shop" },
  { label: "Occasions", href: "/occasions", dropdown: true },
  { label: "Collections", href: "/collections" },
  { label: "Craftsmanship", href: "/#craft" },
  { label: "Journal", href: "/blog" },
  { label: "Order Tracking", href: "/account" },
] as const;

// Luxury sticky header: announcement strip on top, main bar below.
// Home: transparent over the full-bleed hero → white glass on scroll
// (announcement slides away). Inner pages: always clean solid cream.
export default function SiteHeader({
  brand,
  currencyComponent,
  cartCount,
  isLoggedIn,
  isAdmin,
}: {
  brand: string;
  currencyComponent: React.ReactNode;
  cartCount: number;
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [occOpen, setOccOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const prevCart = useRef(cartCount);
  const [cartPulse, setCartPulse] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Cart feedback animation — pop the badge whenever the count grows
  useEffect(() => {
    if (cartCount > prevCart.current) {
      setCartPulse(true);
      prevCart.current = cartCount;
      const t = setTimeout(() => setCartPulse(false), 500);
      return () => clearTimeout(t);
    }
    prevCart.current = cartCount;
  }, [cartCount]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q && String(q).trim()) router.push(`/shop?q=${encodeURIComponent(String(q).trim())}`);
    setSearchOpen(false);
  }

  // Over-hero (light text) only on the homepage before scrolling
  const light = isHome && !scrolled;

  const navItem =
    "nav-link whitespace-nowrap py-1 text-[10px] font-medium uppercase tracking-[0.26em] opacity-90 transition-opacity hover:opacity-100";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* Announcement — slides away on scroll */}
        <div
          className={`overflow-hidden transition-all duration-500 ${
            scrolled ? "max-h-0" : "max-h-9"
          }`}
        >
          <AnnouncementBar />
        </div>

        {/* Main bar */}
        <div
          className={`transition-all duration-500 ${
            scrolled || !isHome
              ? "border-b border-line/70 bg-cream/95 shadow-[0_1px_24px_rgba(28,26,23,0.05)] backdrop-blur-md"
              : "bg-gradient-to-b from-ink/35 via-ink/15 to-transparent"
          } ${light ? "text-cream" : "text-ink"}`}
        >
          <div
            className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-6 transition-all duration-500 ${
              scrolled ? "h-16" : "h-20"
            }`}
          >
            {/* Brand */}
            <Link href="/" className="flex min-w-0 items-center gap-2.5 lg:pr-8">
              <span className="whitespace-nowrap font-[family-name:var(--font-display)] text-[22px] font-light leading-none tracking-[0.14em] transition-opacity hover:opacity-80">
                {brand.toUpperCase()}
              </span>
              <span
                className={`hidden text-[8px] font-semibold uppercase leading-none tracking-[0.4em] sm:block ${
                  light ? "text-gold" : "text-gold-deep"
                }`}
              >
                USA
              </span>
            </Link>

            {/* Center nav (desktop) */}
            <nav className="hidden items-center justify-self-center gap-8 xl:gap-10 lg:flex">
              {NAV.map((n) =>
                "dropdown" in n && n.dropdown ? (
                  <div key={n.label} className="group relative">
                    <Link href={n.href} className={`${navItem} inline-flex items-center gap-1.5`}>
                      {n.label}
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="transition-transform duration-300 group-hover:rotate-180"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Link>
                    {/* Editorial dropdown panel */}
                    <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100">
                      <div className="grid w-[600px] translate-y-2 grid-cols-[1fr_230px] overflow-hidden border border-line bg-white text-ink shadow-[0_28px_60px_rgba(28,26,23,0.14)] transition-all duration-300 group-hover:translate-y-0">
                        <ul className="p-7">
                          {OCCASIONS.map((o) => (
                            <li key={o.slug}>
                              <Link
                                href={`/occasions/${o.slug}`}
                                className="group/item flex items-baseline justify-between gap-4 border-b border-line/60 py-3 transition-colors hover:border-gold/40"
                              >
                                <span className="font-[family-name:var(--font-display)] text-lg font-light tracking-wide transition group-hover/item:text-gold-deep">
                                  {o.label}
                                </span>
                                <span className="text-[9px] font-light uppercase tracking-[0.18em] text-stone-400 transition group-hover/item:text-stone-500">
                                  {o.line}
                                </span>
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href="/occasions"
                              className="mt-4 inline-block text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep"
                            >
                              All occasions →
                            </Link>
                          </li>
                        </ul>
                        <Link href="/occasions" className="group/img relative block overflow-hidden bg-sand">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/uploads/pk-ceremony.jpg"
                            alt="Pakistani wedding celebration"
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-700 group-hover/img:scale-[1.05]"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 text-[9px] font-medium uppercase tracking-[0.28em] text-cream">
                            Every celebration
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link key={n.label} href={n.href} className={navItem}>
                    {n.label}
                  </Link>
                )
              )}
            </nav>

            {/* Utility (right) */}
            <div className="flex items-center justify-self-end gap-4 md:gap-5">
              {/* Search */}
              <div className="relative">
                <button
                  aria-label="Search"
                  onClick={() => setSearchOpen((s) => !s)}
                  className="flex h-9 w-9 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                {searchOpen && (
                  <form
                    onSubmit={submitSearch}
                    className={`absolute right-0 top-11 flex overflow-hidden border shadow-xl ${
                      light ? "border-cream/25 bg-ink/85 backdrop-blur" : "border-line bg-white"
                    }`}
                  >
                    <input
                      ref={searchRef}
                      name="q"
                      placeholder="Search lehenga, sharara…"
                      className={`w-60 px-4 py-2.5 text-xs font-light tracking-wide outline-none ${
                        light ? "bg-transparent text-cream placeholder:text-cream/50" : "text-ink"
                      }`}
                    />
                    <button
                      className={`px-5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        light ? "bg-cream text-ink" : "bg-ink text-cream"
                      }`}
                    >
                      Go
                    </button>
                  </form>
                )}
              </div>

              {/* Currency */}
              <div className="hidden sm:block">{currencyComponent}</div>

              {/* Account */}
              <Link
                href={isAdmin ? "/admin" : isLoggedIn ? "/account" : "/login"}
                aria-label="Account"
                className="flex h-9 w-9 items-center justify-center opacity-90 transition-opacity hover:opacity-100"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
                </svg>
              </Link>

              {/* Wishlist */}
              <Link
                href="/account"
                aria-label="Wishlist"
                className="hidden h-9 w-9 items-center justify-center opacity-90 transition-opacity hover:opacity-100 sm:flex"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 20.5C7 16.5 3.5 13.2 3.5 9.4 3.5 6.8 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 1.8 4.5 4.4 0 3.8-3.5 7.1-8.5 11.1Z" />
                </svg>
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                aria-label="Cart"
                className="relative flex h-9 w-9 items-center justify-center opacity-90 transition-opacity hover:opacity-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 8h12l-1 12H7L6 8Z" />
                  <path d="M9 8a3 3 0 0 1 6 0" />
                </svg>
                {cartCount > 0 && (
                  <span
                    className={`absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-white ${
                      cartPulse ? "badge-pop" : ""
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                aria-label="Menu"
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center opacity-90 transition-opacity hover:opacity-100 lg:hidden"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== mobile overlay menu ==================== */}
      <div
        className={`fixed inset-0 z-[70] flex flex-col bg-cream text-ink transition-all duration-500 lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <span className="font-[family-name:var(--font-display)] text-xl font-light tracking-[0.14em]">
            {brand.toUpperCase()}
          </span>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="divide-y divide-line/70">
            <li>
              <Link
                href="/shop"
                className="block py-4 font-[family-name:var(--font-display)] text-2xl font-light tracking-wide"
              >
                Bridal
              </Link>
            </li>
            <li>
              <button
                onClick={() => setOccOpen((o) => !o)}
                aria-expanded={occOpen}
                className="flex w-full items-center justify-between py-4 text-left font-[family-name:var(--font-display)] text-2xl font-light tracking-wide"
              >
                Occasions
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`transition-transform duration-300 ${occOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="acc-panel" data-open={occOpen}>
                <div>
                  <ul className="pb-4 pl-4">
                    {OCCASIONS.map((o) => (
                      <li key={o.slug}>
                        <Link
                          href={`/occasions/${o.slug}`}
                          className="flex items-baseline justify-between gap-3 py-2.5 text-sm font-light text-stone-600"
                        >
                          <span>{o.label}</span>
                          <span className="text-[9px] uppercase tracking-[0.18em] text-stone-400">{o.line}</span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/occasions"
                        className="inline-block py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep"
                      >
                        All occasions →
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
            {NAV.filter((n) => !("dropdown" in n && n.dropdown) && n.label !== "Bridal").map((n) => (
              <li key={n.label}>
                <Link
                  href={n.href}
                  className="block py-4 font-[family-name:var(--font-display)] text-2xl font-light tracking-wide"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line px-6 py-4">
          <p className="text-center text-[9px] uppercase tracking-[0.28em] text-stone-400">
            Handcrafted Pakistani Bridal Couture · USA
          </p>
        </div>
      </div>
    </>
  );
}
