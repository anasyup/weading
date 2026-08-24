"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Wedding Dresses", href: "/shop" },
  { label: "Accessories", href: "/shop?category=accessories" },
  { label: "Collections", href: "/shop" },
  { label: "Store Finder", href: "/#stores" },
];

// Luxury sticky header: transparent over the hero, glass-cream once scrolled.
// Utility: search, Book Appointment, currency (USD) selector.
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

  const light = !scrolled; // over the full-bleed hero

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-line bg-cream/90 shadow-[0_1px_30px_rgba(28,26,23,0.06)] backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-ink/30 to-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 transition-all duration-500 ${
          scrolled ? "py-3.5" : "py-6"
        } ${light ? "text-cream" : "text-ink"}`}
      >
        {/* Brand */}
        <Link href="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl font-light tracking-[0.14em] transition-opacity group-hover:opacity-80">
            {brand.toUpperCase()}
          </span>
          <span className={`hidden text-[8px] font-semibold uppercase tracking-[0.4em] sm:block ${light ? "text-gold" : "text-gold-deep"}`}>
            USA · MMXXVI
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="nav-link text-[10px] font-medium uppercase tracking-[0.26em] opacity-90 transition-opacity hover:opacity-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Utility */}
        <div className="flex items-center gap-5">
          {/* Search */}
          <div className="relative">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((s) => !s)}
              className="opacity-80 transition-opacity hover:opacity-100"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            {searchOpen && (
              <form
                onSubmit={submitSearch}
                className={`absolute right-0 top-9 flex overflow-hidden border ${light ? "border-cream/30 bg-ink/70 backdrop-blur" : "border-line bg-white"}`}
              >
                <input
                  ref={searchRef}
                  name="q"
                  placeholder="Search silhouettes…"
                  className={`w-56 px-4 py-2.5 text-xs font-light tracking-wide outline-none ${light ? "bg-transparent text-cream placeholder:text-cream/50" : "text-ink"}`}
                />
                <button className={`px-4 text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? "bg-cream text-ink" : "bg-ink text-cream"}`}>
                  Go
                </button>
              </form>
            )}
          </div>

          {/* Currency / country */}
          <div className={light ? "[&_select]:border-cream/30 [&_select]:bg-ink/40 [&_select]:text-cream" : ""}>
            {currencyComponent}
          </div>

          {/* Account */}
          <Link
            href={isAdmin ? "/admin" : isLoggedIn ? "/account" : "/login"}
            className="nav-link hidden text-[10px] font-medium uppercase tracking-[0.26em] opacity-90 hover:opacity-100 sm:block"
          >
            {isLoggedIn ? "Account" : "Sign in"}
          </Link>

          {/* Cart */}
          <Link href="/cart" aria-label="Cart" className="relative opacity-90 transition-opacity hover:opacity-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Book appointment */}
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

      {/* Mobile nav */}
      <nav
        className={`flex gap-6 overflow-x-auto px-6 pb-3 text-[10px] font-medium uppercase tracking-[0.22em] lg:hidden ${light ? "text-cream/85" : "text-stone-600"}`}
      >
        {NAV.map((n) => (
          <Link key={n.label} href={n.href} className="shrink-0">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
