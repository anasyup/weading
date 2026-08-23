import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getCountry, SUPPORTED } from "@/lib/country";
import { getCartCount } from "@/lib/cart";
import { getStoreName } from "@/lib/settings";
import CountrySelect from "./country-select";

export default async function SiteHeader() {
  const [user, country, storeName] = await Promise.all([getSessionUser(), getCountry(), getStoreName()]);
  const cartCount = await getCartCount(user?.customerId ?? null);

  return (
    <header className="border-b border-line bg-cream">
      {/* Announcement bar */}
      <div className="bg-ink text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em]">
          <p className="hidden sm:block">Handcrafted · Made-to-order 30–45 days</p>
          <p className="sm:hidden">Made-to-order · 30–45 days</p>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Ships to USA · Canada · Pakistan</span>
            <CountrySelect current={country.code} />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-[family-name:var(--font-display)] text-2xl tracking-[0.08em]">
            {storeName.toUpperCase()}
            <span className="block text-center text-[9px] font-sans font-semibold tracking-[0.4em] text-gold-deep">
              MADE TO ORDER
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
            <Link href="/shop" className="hover:text-gold-deep">Shop</Link>
            <Link href="/shop?category=bridal-dresses" className="hover:text-gold-deep">Bridal</Link>
            <Link href="/shop?category=bridal-gowns" className="hover:text-gold-deep">Gowns</Link>
            <Link href="/shop?category=lehengas" className="hover:text-gold-deep">Lehengas</Link>
            <Link href="/shop?category=party-wear" className="hover:text-gold-deep">Party Wear</Link>
            <Link href="/blog" className="hover:text-gold-deep">Journal</Link>
            <Link href="/faq" className="hover:text-gold-deep">FAQs</Link>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          {/* Search */}
          <form action="/shop" className="hidden md:block">
            <input
              type="search"
              name="q"
              placeholder="Search…"
              className="w-40 border border-line bg-white px-3 py-2 text-xs outline-none transition focus:w-56 focus:border-gold"
            />
          </form>
          {user ? (
            <Link href={user.isAdmin ? "/admin" : "/account"} className="text-[11px] font-semibold uppercase tracking-[0.16em] hover:text-gold-deep">
              {user.isAdmin ? "Admin" : "Account"}
            </Link>
          ) : (
            <Link href="/login" className="text-[11px] font-semibold uppercase tracking-[0.16em] hover:text-gold-deep">
              Sign in
            </Link>
          )}
          <Link href="/cart" className="relative text-[11px] font-semibold uppercase tracking-[0.16em] hover:text-gold-deep">
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-line px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-600 lg:hidden">
        <Link href="/shop">Shop</Link>
        <Link href="/shop?category=bridal-dresses">Bridal</Link>
        <Link href="/shop?category=bridal-gowns">Gowns</Link>
        <Link href="/shop?category=lehengas">Lehengas</Link>
        <Link href="/shop?category=party-wear">Party Wear</Link>
        <Link href="/blog">Journal</Link>
        <Link href="/faq">FAQs</Link>
      </nav>
    </header>
  );
}
