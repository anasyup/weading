import Link from "next/link";
import NewsletterForm from "./newsletter-form";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-sand">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.08em]">NOOR BRIDAL</p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-stone-600">
            Made-to-order bridal couture — dresses, gowns and lehengas handcrafted for your measurements
            and delivered in 30–45 days.
          </p>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            USA · Canada · Pakistan
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2.5 text-xs text-stone-600">
            <li><Link href="/shop" className="hover:text-gold-deep">All Products</Link></li>
            <li><Link href="/shop?category=bridal-dresses" className="hover:text-gold-deep">Bridal Dresses</Link></li>
            <li><Link href="/shop?category=bridal-gowns" className="hover:text-gold-deep">Bridal Gowns</Link></li>
            <li><Link href="/shop?category=lehengas" className="hover:text-gold-deep">Lehengas</Link></li>
            <li><Link href="/shop?category=party-wear" className="hover:text-gold-deep">Party Wear</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Support</p>
          <ul className="space-y-2.5 text-xs text-stone-600">
            <li>
              <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" className="hover:text-gold-deep">
                WhatsApp · +92 300 1234567
              </a>
            </li>
            <li>
              <a href="mailto:care@noorbridal.test" className="hover:text-gold-deep">care@noorbridal.test
              </a>
            </li>
            <li><Link href="/account" className="hover:text-gold-deep">My Account</Link></li>
            <li><Link href="/account#orders" className="hover:text-gold-deep">Track My Order</Link></li>
            <li><Link href="/blog" className="hover:text-gold-deep">Journal</Link></li>
            <li><Link href="/faq" className="hover:text-gold-deep">FAQs</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Newsletter</p>
          <p className="mb-3 text-xs text-stone-600">
            New collections, atelier stories and early access — straight to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-[10px] uppercase tracking-[0.16em] text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Noor Bridal. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/pages/terms" className="hover:text-gold-deep">Terms</Link>
            <Link href="/pages/privacy" className="hover:text-gold-deep">Privacy</Link>
            <Link href="/pages/shipping" className="hover:text-gold-deep">Shipping</Link>
            <Link href="/pages/returns" className="hover:text-gold-deep">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
