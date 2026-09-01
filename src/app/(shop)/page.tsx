import Link from "next/link";
import { prisma } from "@/lib/db";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";
import GoldDust, { CursorGlow } from "@/components/gold-dust";
import OccasionWall from "@/components/occasion-wall";
import SnapRoot from "@/components/snap-root";
import CollectionsCanvas from "@/components/collections-canvas";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED" },
    include: { customer: true, product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="bg-cream">
      <SnapRoot />
      {/* ================================================================ */}
      {/* 1 — HERO (parallax + gold dust + cursor glow + single CTA)      */}
      {/* ================================================================ */}
      <section className="snap-slide relative h-screen min-h-[600px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[600px]">
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
      <section className="snap-slide relative">
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
      <section className="snap-slide relative h-screen min-h-[560px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[560px]">
        <OccasionWall />
      </section>

      {/* ================================================================ */}
      {/* 4 — MOST LOVED / COLLECTIONS (editorial layered canvas)         */}
      {/* ================================================================ */}
      <section className="snap-slide mx-auto max-w-7xl overflow-x-clip px-6 py-16 lg:py-20">
        <Reveal className="mb-12 text-center sm:mb-14">
          <h2 className="font-[family-name:var(--font-display)] text-5xl font-light uppercase tracking-[0.14em] sm:text-6xl">
            Collections
          </h2>
          <p className="mt-3 text-sm font-light tracking-wide text-stone-600 sm:text-[15px]">
            Stories of celebration, craftsmanship, and style
          </p>
        </Reveal>

        <Reveal>
          <CollectionsCanvas />
        </Reveal>
      </section>

      {/* ================================================================ */}
      {/* 5 — CRAFTSMANSHIP (video left, text right)                      */}
      {/* ================================================================ */}
      <section id="craft" className="snap-slide relative overflow-hidden border-y border-line bg-sand/60">
        <div className="glow-orb left-[-6rem] top-16 h-72 w-72 bg-gold/25" aria-hidden="true" />
        <div className="glow-orb bottom-10 right-[-8rem] h-96 w-96 bg-gold/15" style={{ animationDelay: "2s" }} aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-2 lg:py-20">
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
      {/* ================================================================ */}
      {/* 6 — REVIEWS (live, approved)                                    */}
      {/* ================================================================ */}
      {reviews.length > 0 && (
        <section className="snap-slide mx-auto max-w-7xl px-6 py-16 lg:py-20">
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
      {/* 7 — OCCASION JOURNAL (editorial card grid + vertical VIEW ALL)  */}
      {/* ================================================================ */}
      <section className="snap-slide relative border-t border-line bg-white">
        <div className="mx-auto flex max-w-[1600px] items-stretch gap-10 px-6 py-16 lg:py-20">
          {/* Vertical VIEW ALL rail — extreme left */}
          <div className="hidden w-10 items-center justify-center lg:flex">
            <Link
              href="/occasions"
              className="group flex flex-col items-center gap-6"
              aria-label="View all occasions"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.5em] text-ink [writing-mode:vertical-rl] rotate-180 transition-colors group-hover:text-gold-deep">
                View all
              </span>
              <span className="h-20 w-px bg-ink/30 transition-colors group-hover:bg-gold-deep" />
            </Link>
          </div>

          {/* Cards */}
          <div className="flex-1">
            <div className="mb-8 lg:hidden">
              <Link
                href="/occasions"
                className="nav-link border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
              >
                View all occasions
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-8">
              {[
                {
                  img: "/uploads/pk-baraat.jpg",
                  alt: "Baraat bride in crimson couture",
                  metaL: "Zardozi · Dabka",
                  metaR: "30–45 days",
                  title: "Crimson pomp, the baraat bride",
                  href: "/occasions/baraat",
                  featured: true,
                },
                {
                  img: "/uploads/pk-nikkah.jpg",
                  alt: "Nikkah bride in ivory",
                  metaL: "Resham · Pearl",
                  metaR: "Made to order",
                  title: "Ivory vows for the nikkah",
                  href: "/occasions/nikkah",
                  featured: false,
                },
                {
                  img: "/uploads/pk-mehndi.jpg",
                  alt: "Mehndi night attire in green",
                  metaL: "Gota · Mirror",
                  metaR: "Made to order",
                  title: "Dholki colour, mehndi green",
                  href: "/occasions/mehndi",
                  featured: false,
                },
                {
                  img: "/uploads/pk-walima.jpg",
                  alt: "Walima reception wear in pastel",
                  metaL: "Sequin Work",
                  metaR: "Made to order",
                  title: "Pastel grace for the walima",
                  href: "/occasions/walima",
                  featured: false,
                },
              ].map((c) => (
                <Link key={c.href} href={c.href} className="group block">
                  <div
                    className={`relative overflow-hidden bg-sand ${
                      c.featured ? "aspect-[3/4]" : "aspect-[4/5] lg:aspect-[3/4]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.img}
                      alt={c.alt}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">
                    <span>{c.metaL}</span>
                    <span className="text-stone-400">{c.metaR}</span>
                  </div>
                  <h3
                    className={`mt-3 font-[family-name:var(--font-display)] font-light leading-snug text-ink transition-colors group-hover:text-gold-deep ${
                      c.featured ? "text-3xl sm:text-4xl" : "text-2xl"
                    }`}
                  >
                    {c.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
