import Link from "next/link";
import { prisma } from "@/lib/db";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";
import HoverSwapCard from "@/components/hover-swap-card";

export const dynamic = "force-dynamic";

const MOST_LOVED = [
  { name: "The A-Line", sub: "Fluid Crepe", img: "/uploads/lux-p-aline.jpg", detail: "/uploads/lux-d-aline.jpg" },
  { name: "Mikado Mermaid", sub: "Sculpted Silk", img: "/uploads/lux-p-mermaid.jpg", detail: "/uploads/lux-d-mermaid.jpg" },
  { name: "Lace Corset", sub: "Corded Lace", img: "/uploads/lux-p-corset.jpg", detail: "/uploads/lux-d-corset.jpg" },
  { name: "Silk Slip", sub: "Bias-Cut Satin", img: "/uploads/lux-p-slip.jpg", detail: "/uploads/lux-d-slip.jpg" },
];

const STORES = [
  {
    city: "New York",
    label: "US Flagship — Madison Avenue",
    detail: "Private salon fittings by appointment · Mon–Sat",
    img: "/uploads/lux-salon-nyc.jpg",
  },
  {
    city: "Warsaw",
    label: "European Atelier — Old Town",
    detail: "The maison's founding atelier · Tue–Sat",
    img: "/uploads/lux-salon-warsaw.jpg",
  },
];

export default async function HomePage() {
  const [featuredCount, categories] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take: 6 }),
  ]);

  return (
    <div className="bg-cream">
      {/* ================================================================ */}
      {/* 1 — HERO (full-bleed, parallax)                                   */}
      {/* ================================================================ */}
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[600px]">
        <ParallaxImage src="/uploads/lux-hero.jpg" alt="Bridal Dresses — US debut" strength={0.22} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-ink/10 to-ink/20" />

        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="hero-entrance max-w-3xl text-center text-cream">
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/80">
              The Maison Arrives in America
            </p>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-light leading-[1.05] tracking-wide sm:text-7xl lg:text-8xl">
              Bridal Dresses
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed tracking-wide text-cream/85">
              High-fashion wedding dresses, cut to a single silhouette and sewn to a single bride.
              Made-to-measure in our atelier — {featuredCount} silhouettes, one of one, every time.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/shop" className="btn-gold px-10 py-4">
                Explore Collection
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center border border-cream/50 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream transition-all duration-300 hover:border-cream hover:bg-cream/10"
              >
                Book NYC Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-cream/60">Scroll</p>
          <div className="mx-auto mt-2 h-10 w-px overflow-hidden bg-cream/20">
            <div className="h-1/2 w-full animate-bounce bg-cream/80" />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2 — FEATURED COLLECTION (Prima Forma)                             */}
      {/* ================================================================ */}
      <section className="relative">
        <div className="relative h-[80vh] min-h-[480px] w-full overflow-hidden">
          <ParallaxImage src="/uploads/lux-prima.jpg" alt="Prima Forma collection" strength={0.18} />
          <div className="absolute inset-0 bg-ink/25" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-6 pb-16">
              <Reveal>
                <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/75">
                  Featured Collection
                </p>
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-light tracking-wide text-cream sm:text-6xl">
                  Prima Forma
                </h2>
                <p className="mt-4 max-w-lg text-sm font-light leading-relaxed text-cream/85">
                  An ode to the silhouette itself. Uncomplicated lines, minimal embellishment, and
                  construction that takes years to learn and hours to place — nothing added, nothing
                  missing.
                </p>
                <Link
                  href="/collections"
                  className="mt-8 inline-flex items-center gap-3 border border-cream/60 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream transition-all duration-300 hover:bg-cream hover:text-ink"
                >
                  Discover Collection →
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3 — QUICK CATEGORIES (3-column grid)                              */}
      {/* ================================================================ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow">The Edit</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
            Begin with one question
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Wedding Dresses", copy: "Signature silhouettes, made to measure", img: "/uploads/lux-cat-dresses.jpg", href: "/shop" },
            { title: "All Collections", copy: "Explore every chapter of the maison", img: "/uploads/lux-cat-collections.jpg", href: "/collections" },
            { title: "Accessories", copy: "Veils, silk ribbons & fine jewelry", img: "/uploads/lux-cat-accessories.jpg", href: "/accessories" },
          ].map((c, i) => (
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
      {/* 4 — CRAFTSMANSHIP / BRAND STORY                                   */}
      {/* ================================================================ */}
      <section className="border-y border-line bg-sand/60">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[560px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/uploads/lux-craft.jpg" alt="Hand-appliqué in the atelier" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </Reveal>

          <div className="flex flex-col justify-center">
            <Reveal>
              <p className="eyebrow">The Atelier</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light leading-tight tracking-wide sm:text-5xl">
                Quiet hands,<br />
                patient hours.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-7 max-w-lg text-[15px] font-light leading-loose text-stone-700">
                Every gown begins as unpinned silk on a cutting table in our atelier. Lace is
                hand-appliquéd motive by motive — not machine-placed — so each vine falls exactly
                where the body turns. Our fitters tailor precision into every seam through a series
                of calico fittings before a single metre of silk is cut.
              </p>
              <p className="mt-4 max-w-lg text-[15px] font-light leading-loose text-stone-700">
                The result is a dress that feels like it was always yours — because it was made only
                for you.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
                {[
                  ["120+", "Hours of hand-appliqué per couture gown"],
                  ["3", "Precision fittings before final silk is cut"],
                  ["1 of 1", "Every dress cut for one bride, only"],
                ].map(([n, label]) => (
                  <div key={label}>
                    <dt className="font-[family-name:var(--font-display)] text-4xl font-light text-gold-deep">{n}</dt>
                    <dd className="mt-2 text-[10px] uppercase leading-relaxed tracking-[0.18em] text-stone-500">{label}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/pages/about" className="btn-ghost btn-sm mt-10">
                Our story
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5 — MOST LOVED (bestsellers with hover detail)                    */}
      {/* ================================================================ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bestsellers</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              Most Loved
            </h2>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-stone-600">
              The silhouettes brides return to, season after season. Hover to see the detail work.
            </p>
          </div>
          <Link href="/shop" className="nav-link text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
            View all silhouettes →
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {MOST_LOVED.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <HoverSwapCard
                mainSrc={p.img}
                detailSrc={p.detail}
                name={p.name}
                sub={p.sub}
                href="/shop"
                index={`0${i + 1}`}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6 — FLAGSHIP STORES & SALON LOCATOR                               */}
      {/* ================================================================ */}
      <section id="stores" className="border-t border-line bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <Reveal className="mb-14 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-gold">Salons</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              Visit the maison
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-cream/70">
              Private appointments in our flagship salons — your silhouette, considered over
              champagne and calico.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {STORES.map((s, i) => (
              <Reveal key={s.city} delay={i * 140}>
                <div className="group relative aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt={`${s.city} salon`} loading="lazy" className="media-zoom h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-7">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-gold">{s.label}</p>
                      <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-light tracking-wide">{s.city}</h3>
                      <p className="mt-1 text-[11px] font-light tracking-wide text-cream/70">{s.detail}</p>
                    </div>
                    <Link
                      href="/support"
                      className="inline-flex items-center border border-cream/50 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:bg-cream hover:text-ink"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150} className="mt-12 text-center">
            <Link href="/support" className="btn-gold px-10 py-4">
              Book a Private Appointment
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
