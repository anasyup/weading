import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";
import GoldDust, { CursorGlow } from "@/components/gold-dust";
import ProductCard from "@/components/product-card";
import { OCCASIONS, PRIMARY_OCCASIONS } from "@/lib/occasions";

export const dynamic = "force-dynamic";

const OCCASION_CARDS = PRIMARY_OCCASIONS.map((slug) => OCCASIONS.find((o) => o.slug === slug)!);

const BEYOND_BRIDE = [
  {
    title: "Wedding Guest",
    copy: "Elegant, never louder than the bride",
    img: "/uploads/p-blush-organza.jpg",
    href: "/occasions/wedding-guest",
  },
  {
    title: "Bridesmaids",
    copy: "Coordinated festive sets",
    img: "/uploads/p-emerald-zardozi.jpg",
    href: "/occasions/bridesmaids",
  },
  {
    title: "Mother of the Bride & Groom",
    copy: "Graceful heirloom formals",
    img: "/uploads/p-ivory-gown.jpg",
    href: "/occasions/mother-of-the-bride",
  },
];

const OCCASION_CHIPS: [string, string][] = [
  ["Dholki", "/occasions/others"],
  ["Mehndi", "/occasions/mehndi"],
  ["Nikkah", "/occasions/nikkah"],
  ["Baraat", "/occasions/baraat"],
  ["Walima", "/occasions/walima"],
  ["Reception", "/occasions/party"],
];

const TECHNIQUES = ["Zardozi", "Dabka", "Resham", "Pearls", "Beads", "Sequins", "Threadwork"];

export default async function HomePage() {
  const country = await getCountry();

  const [featured, reviews] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", isFeatured: true, countries: { some: { countryId: country.id } } },
      include: { prices: true, media: true },
      take: 4,
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      include: { customer: true, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const products =
    featured.length > 0
      ? featured
      : await prisma.product.findMany({
          where: { status: "ACTIVE", countries: { some: { countryId: country.id } } },
          include: { prices: true, media: true },
          orderBy: { createdAt: "desc" },
          take: 4,
        });

  return (
    <div className="bg-cream">
      {/* ================================================================ */}
      {/* 1 — HERO (full-bleed parallax + gold dust + cursor glow)        */}
      {/* ================================================================ */}
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[600px]">
        <ParallaxImage
          src="/uploads/pk-hero.jpg"
          alt="Pakistani bride in red couture with gold embroidery"
          strength={0.22}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/20 to-ink/25" />
        <GoldDust density={1.1} />
        <CursorGlow />

        <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
          <div className="hero-entrance max-w-3xl text-center text-cream">
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/80">
              Handcrafted in Pakistan · Worn across America
            </p>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-light leading-[1.06] tracking-wide sm:text-7xl">
              Handcrafted Pakistani
              <br />
              Bridal Couture
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed tracking-wide text-cream/85">
              Zardozi, dabka and resham — hand-embroidered bridal wear, made to order in 30–45
              days and shipped to your door across the USA.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/shop" className="btn-gold px-10 py-4">
                Shop Bridal
              </Link>
              <Link
                href="/occasions"
                className="inline-flex items-center border border-cream/50 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream transition-all duration-300 hover:border-cream hover:bg-cream/10"
              >
                Explore Occasions
              </Link>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-cream/60">Scroll</p>
          <div className="mx-auto mt-2 h-10 w-px overflow-hidden bg-cream/20">
            <div className="h-1/2 w-full animate-bounce bg-cream/80" />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2 — SHOP BY OCCASION                                            */}
      {/* ================================================================ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shop by Occasion</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              Every moment of the wedding
            </h2>
          </div>
          <Link href="/occasions" className="nav-link text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
            All occasions →
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {OCCASION_CARDS.map((o, i) => (
            <Reveal key={o.slug} delay={i * 110}>
              <Link href={`/occasions/${o.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.img}
                  alt={`${o.name} — Pakistani bridal couture`}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="media-zoom h-full w-full object-cover"
                  style={o.position ? { objectPosition: o.position } : undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-cream sm:p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-light tracking-wide sm:text-[1.7rem]">
                    {o.name}
                  </h3>
                  <p className="mt-1 text-[9px] font-light uppercase tracking-[0.22em] text-cream/75 sm:text-[10px]">
                    {o.line}
                  </p>
                  <span className="nav-link mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.24em] text-cream">
                    Explore →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3 — FEATURED (live from the boutique)                           */}
      {/* ================================================================ */}
      {products.length > 0 && (
        <section className="border-y border-line bg-white/60">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-28">
            <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">From the current book</p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
                  Featured pieces
                </h2>
                <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-stone-600">
                  Handmade to your measurements after you order — never pulled from a rack.
                </p>
              </div>
              <Link href="/shop" className="nav-link text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
                View all bridal →
              </Link>
            </Reveal>

            <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <ProductCard product={p} country={country} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 4 — CRAFTSMANSHIP (parallax detail + techniques)                */}
      {/* ================================================================ */}
      <section id="craft" className="relative overflow-hidden border-b border-line bg-sand/60">
        <div
          className="glow-orb left-[-6rem] top-16 h-72 w-72 bg-gold/25"
          aria-hidden="true"
        />
        <div
          className="glow-orb bottom-10 right-[-8rem] h-96 w-96 bg-gold/15"
          style={{ animationDelay: "2s" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[560px]">
              <ParallaxImage src="/uploads/pk-craft-zardozi.jpg" alt="Zardozi hand embroidery on red silk" strength={0.12} />
            </div>
            {/* Floating pearl/threadwork detail frame */}
            <div className="absolute -bottom-6 right-4 hidden w-40 overflow-hidden border-4 border-cream shadow-[0_18px_44px_rgba(28,26,23,0.18)] sm:block lg:right-8 lg:w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uploads/pk-detail-pearl.jpg"
                alt="Pearl, bead and resham embroidery detail"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </div>
          </Reveal>

          <div className="flex flex-col justify-center">
            <Reveal>
              <p className="eyebrow">Handmade Craftsmanship</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light leading-tight tracking-wide sm:text-5xl">
                Zardozi, dabka, resham —<br />
                by hand, only.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-7 max-w-lg text-[15px] font-light leading-loose text-stone-700">
                Every piece is hand-embroidered in Pakistan using the techniques our craft is known
                for — gold zardozi and dabka, silk resham threadwork, and pearls, beads and sequins
                set one at a time.
              </p>
              <p className="mt-4 max-w-lg text-[15px] font-light leading-loose text-stone-700">
                Nothing here is mass-made. Your dress is cut and embellished after you order it, to
                your measurements — the way bridal wear is meant to be.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <ul className="mt-9 flex flex-wrap gap-2.5">
                {TECHNIQUES.map((t) => (
                  <li
                    key={t}
                    className="border border-line bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors duration-300 hover:border-gold/50 hover:text-gold-deep"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/pages/about" className="btn-ghost btn-sm mt-10">
                Our story
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5 — OCCASION STRIP (layered parallax band)                      */}
      {/* ================================================================ */}
      <section className="relative">
        <div className="relative h-[68vh] min-h-[440px] w-full overflow-hidden">
          <ParallaxImage src="/uploads/pk-ceremony.jpg" alt="Pakistani wedding celebration" strength={0.18} />
          <div className="absolute inset-0 bg-ink/45" />
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <Reveal className="text-center text-cream">
              <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/75">
                From dholki to walima
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-light leading-tight tracking-wide sm:text-6xl">
                One wardrobe for the whole wedding
              </h2>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                {OCCASION_CHIPS.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="border border-cream/45 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:bg-cream hover:text-ink"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6 — BEYOND THE BRIDE (guests, bridesmaids, mothers)             */}
      {/* ================================================================ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow">Beyond the bride</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
            For everyone at the wedding
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {BEYOND_BRIDE.map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <Link href={c.href} className="group relative block aspect-[4/5] overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.title} loading="lazy" className="media-zoom h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-cream">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-light tracking-wide">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-[10px] font-light uppercase tracking-[0.22em] text-cream/75">
                    {c.copy}
                  </p>
                  <span className="nav-link mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.24em] text-cream">
                    Explore →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 7 — MADE TO ORDER (30–45 days)                                  */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden border-t border-line bg-ink text-cream">
        <GoldDust density={0.5} />
        <div className="glow-orb left-1/3 top-0 h-80 w-80 bg-gold/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <Reveal className="mb-16 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-gold">Made to Order</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              Your dress is made after — and for — you
            </h2>
          </Reveal>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Choose your piece",
                copy: "Pick a silhouette from the collection and make it yours — fabric, colour and finishing touches.",
              },
              {
                n: "02",
                title: "Handmade to your measurements",
                copy: "Hand embroidery begins on your order. Crafting a couture piece takes 30–45 days — and it is worth every one.",
              },
              {
                n: "03",
                title: "Shipped across the USA",
                copy: "Finished, checked and sent with tracked delivery — across the United States, Canada and Pakistan.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 130}>
                <div className="border-t border-cream/20 pt-7">
                  <p className="font-[family-name:var(--font-display)] text-4xl font-light text-gold">{s.n}</p>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-light tracking-wide">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-cream/70">{s.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160} className="mt-16 text-center">
            <Link href="/shop" className="btn-gold px-10 py-4">
              Start with the collection
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 8 — REVIEWS (live, approved)                                    */}
      {/* ================================================================ */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 lg:py-28">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow">Brides across America</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              What our brides say
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 110}>
                <figure className="flex h-full flex-col border border-line bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(28,26,23,0.08)]">
                  <p className="text-gold">
                    {"★".repeat(r.rating)}
                    <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  {r.title && (
                    <figcaption className="mt-3 font-[family-name:var(--font-display)] text-xl font-light">
                      {r.title}
                    </figcaption>
                  )}
                  {r.body && (
                    <blockquote className="mt-2 flex-1 text-sm font-light leading-relaxed text-stone-700">
                      {r.body}
                    </blockquote>
                  )}
                  <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-stone-400">
                    {r.customer.firstName} {r.customer.lastName.charAt(0)}. · Verified purchase
                    {r.product ? <> · {r.product.name}</> : null}
                  </p>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
