import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";
import GoldDust, { CursorGlow } from "@/components/gold-dust";
import ProductCard from "@/components/product-card";
import OccasionWall from "@/components/occasion-wall";
import SnapRoot from "@/components/snap-root";

export const dynamic = "force-dynamic";

/* Editorial layered canvas — overlapping, custom-cut compositions (Allure-style).
   Pure CSS hover: the hovered layer lifts, grows and comes to the front. */
const MOST_LOVED_LAYERS: {
  title: string;
  line: string;
  img: string;
  href: string;
  position?: string;
  left: string;
  top: string;
  width: string;
  aspect: string;
  z: string;
}[] = [
  { title: "The Mehndi Green", line: "Colour, mirror-work & joy", img: "/uploads/pk-mehndi.jpg", href: "/occasions/mehndi", left: "0%", top: "14%", width: "23%", aspect: "aspect-[3/4]", z: "z-10" },
  { title: "The Walima Pastel", line: "Soft pastels & reception gowns", img: "/uploads/pk-walima.jpg", href: "/occasions/walima", left: "13%", top: "6%", width: "20%", aspect: "aspect-[4/5]", z: "z-20" },
  { title: "The Nikkah Ivory", line: "Ivory whites & pearl details", img: "/uploads/pk-nikkah.jpg", href: "/occasions/nikkah", left: "31%", top: "0%", width: "25%", aspect: "aspect-[3/4]", z: "z-30" },
  { title: "The Ceremony Blush", line: "Dholki, engagement & more", img: "/uploads/pk-ceremony.jpg", href: "/occasions/others", left: "50%", top: "44%", width: "14%", aspect: "aspect-[4/3]", z: "z-40" },
  { title: "The Baraat Red", line: "The classic red lehenga", img: "/uploads/pk-hero.jpg", href: "/occasions/baraat", position: "50% 30%", left: "60%", top: "9%", width: "22%", aspect: "aspect-[4/5]", z: "z-20" },
  { title: "The Festive Organza", line: "Festive formal wear", img: "/uploads/p-blush-organza.jpg", href: "/occasions/party", position: "50% 25%", left: "78%", top: "15%", width: "22%", aspect: "aspect-[3/4]", z: "z-10" },
];

const BEYOND_BRIDE = [
  { title: "Wedding Guest", img: "/uploads/p-blush-organza.jpg", href: "/occasions/wedding-guest" },
  { title: "Bridesmaids", img: "/uploads/p-emerald-zardozi.jpg", href: "/occasions/bridesmaids" },
  { title: "Mother of the Bride", img: "/uploads/p-ivory-gown.jpg", href: "/occasions/mother-of-the-bride" },
];

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
      <SnapRoot />
      {/* ================================================================ */}
      {/* 1 — HERO (parallax + gold dust + cursor glow + single CTA)      */}
      {/* ================================================================ */}
      <section className="snap-section relative h-screen min-h-[600px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[600px]">
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
            <div className="mt-10">
              <Link
                href="/shop"
                className="nav-link inline-block border-b border-cream/80 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-cream transition-colors hover:border-gold"
                data-active="true"
              >
                Discover
              </Link>
            </div>
          </div>
        </div>

        {/* scroll cue — right edge, vertical */}
        <div className="absolute bottom-10 right-8 z-10 hidden flex-col items-center gap-3 sm:flex">
          <span className="h-16 w-px overflow-hidden bg-cream/25">
            <span className="block h-1/2 w-full animate-bounce bg-cream/80" />
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cream/70">
            <path d="M12 4v16m0 0 6-6m-6 6-6-6" />
          </svg>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2 — BEGIN YOUR BRIDAL STORY (full-width CTA banner)             */}
      {/* ================================================================ */}
      <section className="snap-section relative">
        <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden lg:h-screen">
          <ParallaxImage src="/uploads/pk-baraat.jpg" alt="Baraat bride in red lehenga" strength={0.18} />
          <div className="absolute inset-0 bg-ink/40" />
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <Reveal className="max-w-2xl text-center text-cream">
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-6xl">
                Begin your bridal story
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-sm font-light leading-relaxed tracking-wide text-cream/85">
                Every celebration deserves a dress that was made for it — and only for it.
              </p>
              <Link
                href="/shop"
                className="nav-link mt-9 inline-block border-b border-cream/80 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-cream transition-colors hover:border-gold"
              >
                Shop bridal
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3 — SHOP BY OCCASION (full-bleed wall, dynamic hover background)*/}
      {/* ================================================================ */}
      <section className="snap-section relative h-screen min-h-[560px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[560px]">
        <OccasionWall />
      </section>

      {/* ================================================================ */}
      {/* 3 — CRAFTSMANSHIP (image left, text right)                      */}
      {/* ================================================================ */}
      <section id="craft" className="snap-section snap-pad relative overflow-hidden border-y border-line bg-sand/60">
        <div className="glow-orb left-[-6rem] top-16 h-72 w-72 bg-gold/25" aria-hidden="true" />
        <div className="glow-orb bottom-10 right-[-8rem] h-96 w-96 bg-gold/15" style={{ animationDelay: "2s" }} aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:py-0">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[560px]">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/uploads/craft-aari.mp4"
                poster="/uploads/pk-craft-zardozi.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label="Hand embroidery worked on an aari frame"
              />
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
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4 — MOST LOVED (editorial layered canvas + text below)         */}
      {/* ================================================================ */}
      <section className="snap-section snap-pad mx-auto max-w-7xl px-6 py-24 lg:py-0">
        <Reveal>
          <div className="relative mx-auto h-[62vw] min-h-[240px] sm:h-[46vw] sm:min-h-[300px] lg:h-[48vh] lg:min-h-[400px] lg:max-h-[580px]">
            {MOST_LOVED_LAYERS.map((l, i) => (
              <Link
                key={l.title}
                href={l.href}
                aria-label={`${l.title} — ${l.line}`}
                className={`group absolute block overflow-hidden bg-sand ${l.aspect} ${l.z} transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.2,0.6,0.2,1)] hover:z-50 hover:scale-[1.045] hover:shadow-[0_26px_64px_rgba(28,26,23,0.28)] motion-reduce:transition-none motion-reduce:hover:transform-none`}
                style={{ left: l.left, top: l.top, width: l.width }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.img}
                  alt={`${l.title} — Pakistani bridal couture`}
                  loading={i < 3 ? "eager" : "lazy"}
                  draggable={false}
                  className="h-full w-full object-cover"
                  style={l.position ? { objectPosition: l.position } : undefined}
                />
                {/* hover caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-cream opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:p-4">
                  <p className="font-[family-name:var(--font-display)] text-base font-light tracking-wide sm:text-xl">
                    {l.title}
                  </p>
                  <p className="mt-0.5 hidden text-[8px] font-light uppercase tracking-[0.2em] text-cream/75 sm:block sm:text-[9px]">
                    {l.line}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal className="mx-auto mt-10 max-w-2xl text-center sm:mt-12 lg:mt-14">
          <p className="eyebrow justify-center">Most Loved</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
            Silhouettes brides return to
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-stone-600">
            The pieces our brides choose again and again — each one handmade to order.
          </p>
          <Link
            href="/shop"
            className="nav-link mt-6 inline-block border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
          >
            Discover
          </Link>
        </Reveal>
      </section>

      {/* ================================================================ */}
      {/* 5 — FEATURED PIECES (live, shoppable)                           */}
      {/* ================================================================ */}
      {products.length > 0 && (
        <section className="snap-section snap-pad border-y border-line bg-white/60">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-0">
            <Reveal className="mx-auto mb-14 max-w-2xl text-center lg:mb-10">
              <p className="eyebrow justify-center">From the current book</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
                Featured pieces
              </h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-stone-600">
                Handmade to your measurements after you order — never pulled from a rack.
              </p>
            </Reveal>

            <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <ProductCard product={p} country={country} />
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-14 text-center">
              <Link
                href="/shop"
                className="nav-link inline-block border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
              >
                Discover all
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 6 — REVIEWS (live, approved)                                    */}
      {/* ================================================================ */}
      {reviews.length > 0 && (
        <section className="snap-section snap-pad mx-auto max-w-7xl px-6 py-24 lg:py-0">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow justify-center">Brides across America</p>
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

      {/* ================================================================ */}
      {/* 7 — BEYOND THE BRIDE (dark band, 3 dimmed image cards)          */}
      {/* ================================================================ */}
      <section className="snap-section snap-pad bg-ink py-24 text-cream lg:py-0">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-14 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-gold">Beyond the bride</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              For everyone at the wedding
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {BEYOND_BRIDE.map((c, i) => (
              <Reveal key={c.title} delay={i * 130}>
                <Link href={c.href} className="group relative block aspect-[3/4] overflow-hidden lg:aspect-auto lg:h-[54vh]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    className="media-zoom h-full w-full object-cover opacity-70 transition-opacity duration-700 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-light uppercase tracking-[0.18em]">
                      {c.title}
                    </h3>
                    <span className="nav-link mt-3 inline-block border-b border-cream/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream transition-colors group-hover:border-gold">
                      Discover
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 8 — FOR EVERY CELEBRATION (text left, image right)              */}
      {/* ================================================================ */}
      <section className="snap-section snap-pad mx-auto max-w-7xl px-6 py-24 lg:py-0">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">From dholki to walima</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light leading-tight tracking-wide sm:text-5xl">
              One wedding, many celebrations.
            </h2>
            <p className="mt-6 max-w-md text-[15px] font-light leading-loose text-stone-700">
              From the dholki night to the walima reception — every moment of a South Asian wedding
              asks for its own dress. Discover pieces for each celebration, handcrafted with the
              same devotion.
            </p>
            <Link
              href="/occasions"
              className="nav-link mt-8 inline-block border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
            >
              Discover occasions
            </Link>
          </Reveal>

          <Reveal delay={140}>
            <div className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-[5/4]">
              <ParallaxImage src="/uploads/pk-ceremony.jpg" alt="Pakistani wedding celebration" strength={0.12} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 9 — MADE TO ORDER (30–45 days)                                  */}
      {/* ================================================================ */}
      <section className="snap-section snap-pad relative overflow-hidden border-t border-line bg-ink text-cream">
        <GoldDust density={0.5} />
        <div className="glow-orb left-1/3 top-0 h-80 w-80 bg-gold/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:py-0">
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
                  <p className="mt-3 max-w-xs text-sm font-light leading-loose text-cream/70">{s.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160} className="mt-16 text-center">
            <Link
              href="/shop"
              className="nav-link inline-block border-b border-cream/70 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-cream transition-colors hover:border-gold"
            >
              Start with the collection
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
