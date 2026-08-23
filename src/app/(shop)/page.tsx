import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import ProductCard from "@/components/product-card";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Choose your piece", body: "Browse bridal dresses, gowns and lehengas crafted in our atelier." },
  { n: "02", title: "Customize it", body: "Select fabric, embroidery, neckline and sleeves — made your way." },
  { n: "03", title: "Send measurements", body: "A simple measurement form with every order. Private, one-time, exact." },
  { n: "04", title: "We handcraft it", body: "Your garment is cut, stitched and finished in 30–45 days." },
  { n: "05", title: "Delivered to you", body: "Tracked delivery to the USA, Canada and Pakistan." },
];

export default async function HomePage() {
  const [banners, featured, latest, categories] = await Promise.all([
    prisma.cmsBanner.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE", isFeatured: true },
      include: { prices: true, media: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { prices: true, media: true },
      take: 8,
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take: 6 }),
  ]);
  const country = await getCountry();
  const hero = banners[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[68vh] min-h-[440px] w-full overflow-hidden">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.imageUrl} alt={hero.title} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-4">
              <div className="max-w-xl text-cream">
                <p className="eyebrow !text-gold">{hero?.subtitle ?? "Made-to-order bridal couture"}</p>
                <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
                  {hero?.title ?? "Your dress, made for you."}
                </h1>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/85">
                  Handcrafted bridal dresses, gowns and lehengas — customized, measured and delivered to
                  the USA, Canada and Pakistan in 30–45 days.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/shop" className="btn-gold">
                    {hero?.ctaLabel ?? "Shop the Collection"}
                  </Link>
                  <Link
                    href="/shop?category=lehengas"
                    className="inline-flex items-center border border-cream/40 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream transition hover:border-cream"
                  >
                    Explore Lehengas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-line px-4 text-center sm:grid-cols-4 sm:divide-x">
          {[
            ["Made to Order", "Handcrafted in 30–45 days"],
            ["Custom Fit", "Your measurements, every order"],
            ["Premium Fabrics", "Velvet · Silk · Organza"],
            ["3 Countries", "USA · Canada · Pakistan"],
          ].map(([title, sub]) => (
            <div key={title} className="px-4 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</p>
              <p className="mt-1 text-[11px] text-stone-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow">Atelier favourites</p>
              <h2 className="section-title mt-2">Featured Collection</h2>
            </div>
            <Link href="/shop" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} country={country} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-y border-line bg-sand py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="eyebrow">The made-to-order journey</p>
          <h2 className="section-title mt-2">How it works</h2>
          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white p-6">
                <p className="font-[family-name:var(--font-display)] text-2xl text-gold">{s.n}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em]">{s.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog preview */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">The boutique</p>
            <h2 className="section-title mt-2">Shop by category</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group border border-line bg-white p-5 text-center transition hover:border-gold"
            >
              <p className="font-[family-name:var(--font-display)] text-lg group-hover:text-gold-deep">{c.name}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-stone-400">Explore →</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {latest.slice(4).map((p) => (
            <ProductCard key={p.id} product={p} country={country} />
          ))}
        </div>
      </section>
    </div>
  );
}
