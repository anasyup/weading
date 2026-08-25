import Link from "next/link";
import { prisma } from "@/lib/db";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collections — Every Chapter of the Maison",
  description:
    "Explore the collections of Bridal Dresses — Prima Forma and the silhouette chapters, from fluid A-line crepe to sculpted mikado mermaid. Made to measure, one of one.",
};

// Editorial chapters — the permanent story of the maison. Each chapter opens
// the live boutique so every piece shown is a real, orderable silhouette.
const CHAPTERS = [
  { index: "01", name: "The A-Line", copy: "Fluid crepe, engineered to move", img: "/uploads/lux-p-aline.jpg" },
  { index: "02", name: "The Mermaid", copy: "Sculpted mikado, second-skin fit", img: "/uploads/lux-p-mermaid.jpg" },
  { index: "03", name: "The Corset", copy: "Corded lace over couture boning", img: "/uploads/lux-p-corset.jpg" },
  { index: "04", name: "The Slip", copy: "Bias-cut satin, almost weightless", img: "/uploads/lux-p-slip.jpg" },
] as const;

export default async function CollectionsPage() {
  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return (
    <div className="pb-16">
      {/* ============================================================ */}
      {/* 1 — PAGE HEADER                                                */}
      {/* ============================================================ */}
      <header className="mx-auto max-w-[1600px] border-b border-line px-4 pb-8 pt-7 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow">The Maison</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl">
            Collections
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">
            Every chapter of the maison — cut to a single silhouette, sewn for a single bride.
          </p>
        </Reveal>
      </header>

      {/* ============================================================ */}
      {/* 2 — FEATURED CHAPTER (Prima Forma)                             */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative h-[70vh] min-h-[440px] w-full overflow-hidden">
            <ParallaxImage src="/uploads/lux-prima.jpg" alt="Prima Forma collection" strength={0.16} />
            <div className="absolute inset-0 bg-ink/25" />
            <div className="absolute inset-0 flex items-end">
              <div className="w-full px-6 pb-12 sm:px-10 sm:pb-16">
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
                  href="/shop"
                  className="mt-8 inline-flex items-center gap-3 border border-cream/60 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream transition-all duration-300 hover:bg-cream hover:text-ink"
                >
                  Discover the chapter →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 3 — THE SILHOUETTE CHAPTERS                                    */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Four silhouettes</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
              The Chapters
            </h2>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-stone-600">
              Choose the line your dress will draw — the atelier cuts everything else around it.
            </p>
          </div>
          <Link href="/shop" className="nav-link text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
            View all silhouettes →
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.name} delay={i * 100}>
              <Link href="/shop" className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.name} loading="lazy" className="media-zoom h-full w-full object-cover" />
                  <span className="absolute left-4 top-4 text-[10px] font-medium tracking-[0.3em] text-cream/90 [text-shadow:0_1px_8px_rgba(28,26,23,0.35)]">
                    {c.index}
                  </span>
                </div>
                <div className="pt-4">
                  <h3 className="font-[family-name:var(--font-display)] text-xl leading-snug tracking-wide transition group-hover:text-gold-deep">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-xs font-light tracking-wide text-stone-500">{c.copy}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4 — SHOP BY CATEGORY (live from the boutique)                  */}
      {/* ============================================================ */}
      {categories.length > 0 && (
        <section className="border-t border-line bg-sand/60">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <Reveal className="mb-12 text-center">
              <p className="eyebrow">The live boutique</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide sm:text-5xl">
                Shop by Category
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm font-light leading-relaxed text-stone-600">
                Every piece below is in the atelier&apos;s current book — made to order in 30–45 days.
              </p>
            </Reveal>

            <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c, i) => (
                <Reveal key={c.id} delay={i * 80} className="h-full">
                  <Link
                    href={`/shop?category=${c.slug}`}
                    className="group flex h-full flex-col justify-between bg-cream p-8 transition-colors duration-300 hover:bg-white"
                  >
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-2xl font-light tracking-wide transition group-hover:text-gold-deep">
                        {c.name}
                      </h3>
                      {c.description ? (
                        <p className="mt-2 line-clamp-2 text-xs font-light leading-relaxed text-stone-500">
                          {c.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-8 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 transition group-hover:text-gold-deep">
                      <span>
                        {c._count.products} {c._count.products === 1 ? "piece" : "pieces"}
                      </span>
                      <span aria-hidden="true">→</span>
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5 — ACCESSORIES CHAPTER                                        */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <Link href="/accessories" className="group relative block overflow-hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uploads/lux-cat-accessories.jpg"
                alt="Accessories — the finishing pieces"
                loading="lazy"
                className="media-zoom h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/25 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-7 sm:p-12">
                <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/75">
                  The finishing chapter
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-light tracking-wide text-cream sm:text-5xl">
                  Accessories
                </h2>
                <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-cream/85">
                  Veils, silk ribbons and fine jewellery — the pieces that make a look entirely your own.
                </p>
                <span className="mt-6 inline-flex w-fit items-center border border-cream/60 px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream transition-all duration-300 group-hover:bg-cream group-hover:text-ink">
                  Explore the edit →
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 6 — CLOSING CTA                                                */}
      {/* ============================================================ */}
      <section className="border-t border-line py-12 text-center sm:py-16">
        <Reveal>
          <p className="eyebrow">Advice from the atelier</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
            Not sure which chapter is yours?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl px-6 text-sm leading-6 text-stone-600">
            Book a styling appointment and our bridal team will read your silhouette with you —
            over champagne and calico, in New York or on video.
          </p>
          <Link href="/support" className="btn-primary mt-7">
            Book an appointment
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
