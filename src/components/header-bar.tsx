"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Wedding Dresses", href: "/shop" },
  { label: "Accessories", href: "/accessories" },
  { label: "Collections", href: "/collections" },
  { label: "Store Finder", href: "/#stores" },
];

// Luxury sticky header.
// Home: transparent over the full-bleed hero → glass on scroll.
// Inner pages: always clean solid cream (no band, no line) → glass on scroll.
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
  const searchRef = useRef<HTMLInputElement>(null);
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

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q && String(q).trim()) router.push(`/shop?q=${encodeURIComponent(String(q).trim())}`);
    setSearchOpen(false);
  }

  // Over-hero (light text) only on the homepage before scrolling
  const light = isHome && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? "border-b border-line/70 bg-cream/95 shadow-[0_1px_24px_rgba(28,26,23,0.05)] backdrop-blur-md"
          : "bg-gradient-to-b from-ink/35 via-ink/15 to-transparent"
      } ${light ? "text-cream" : "text-ink"}`}
    >
      {/* ============================ main bar ============================ */}
      <div
        className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-6 transition-all duration-500 ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        {/* Brand sits in its own column, so it never crowds the category links. */}
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
        <nav className="hidden items-center justify-self-center gap-10 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="nav-link whitespace-nowrap py-1 text-[10px] font-medium uppercase tracking-[0.26em] opacity-90 transition-opacity hover:opacity-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Utility (right) — aligned single row, consistent heights */}
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
                  placeholder="Search silhouettes…"
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
            className="nav-link hidden py-1 text-[10px] font-medium uppercase tracking-[0.26em] opacity-90 hover:opacity-100 md:block"
          >
            {isLoggedIn ? "Account" : "Sign in"}
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
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Book appointment (desktop) */}
          <Link
            href="/support"
            className={`hidden items-center border px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 md:inline-flex ${
              light
                ? "border-cream/60 text-cream hover:bg-cream hover:text-ink"
                : "border-ink text-ink hover:bg-ink hover:text-cream"
            }`}
          >
            Book Appointment
          </Link>
        </div>
      </div>

      {/* ========================= mobile nav row ========================= */}
      <nav
        className={`flex items-center gap-8 overflow-x-auto px-6 pb-2.5 text-[10px] font-medium uppercase tracking-[0.22em] lg:hidden ${
          light ? "text-cream/85" : "text-stone-600"
        }`}
      >
        {NAV.map((n) => (
          <Link key={n.label} href={n.href} className="shrink-0 whitespace-nowrap py-0.5">
            {n.label}
          </Link>
        ))}
        <Link href="/support" className="shrink-0 whitespace-nowrap py-0.5 text-gold-deep lg:hidden md:hidden">
          Book Appointment
        </Link>
      </nav>
    </header>
  );
}
