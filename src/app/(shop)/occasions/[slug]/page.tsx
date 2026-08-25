import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";
import ProductCard from "@/components/product-card";
import { OCCASIONS, getOccasion } from "@/lib/occasions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const occasion = getOccasion(slug);
  if (!occasion) return { title: "Occasion" };
  return {
    title: `${occasion.name} Dresses — Pakistani Bridal Couture`,
    description: `Handcrafted Pakistani ${occasion.name.toLowerCase()} dresses — ${occasion.line.toLowerCase()}. Made to order in 30–45 days, shipped across the USA.`,
  };
}

export default async function OccasionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const occasion = getOccasion(slug);
  if (!occasion) notFound();

  const country = await getCountry();

  const keywordOr = occasion.match.flatMap((k) => [
    { name: { contains: k, mode: "insensitive" as const } },
    { description: { contains: k, mode: "insensitive" as const } },
  ]);

  const products =
    keywordOr.length > 0
      ? await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            countries: { some: { countryId: country.id } },
            OR: keywordOr,
          },
          include: { prices: true, media: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : [];

  const otherOccasions = OCCASIONS.filter((o) => o.slug !== occasion.slug).slice(0, 6);

  return (
    <div className="pb-16">
      {/* Hero band */}
      <section className="relative h-[46vh] min-h-[320px] w-full overflow-hidden">
        <ParallaxImage src={occasion.img} alt={`${occasion.name} — Pakistani bridal couture`} strength={0.16} />
        <div className="absolute inset-0 bg-ink/40" />
        <div className="absolute inset-0 z-10 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-6 pb-10">
            <Reveal>
              <nav className="mb-4 text-[10px] uppercase tracking-[0.2em] text-cream/70">
                <Link href="/occasions" className="transition hover:text-cream">
                  Occasions
                </Link>
                <span className="mx-2">/</span>
                <span className="text-cream">{occasion.name}</span>
              </nav>
              <h1 className="font-[family-name:var(--font-display)] text-5xl font-light tracking-wide text-cream sm:text-6xl">
                {occasion.name}
              </h1>
              <p className="mt-2 text-sm font-light tracking-wide text-cream/85">{occasion.line}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        {products.length > 0 ? (
          <>
            <Reveal className="mb-8 flex items-end justify-between gap-4">
              <p className="text-sm text-stone-600">
                {products.length} {products.length === 1 ? "piece" : "pieces"} · handmade to order in 30–45 days
              </p>
              <Link href="/shop" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition hover:text-gold-deep">
                Full boutique →
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 4) * 80}>
                  <ProductCard product={p} country={country} />
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <Reveal className="border border-line bg-white px-6 py-16 text-center sm:py-20">
            <p className="eyebrow justify-center">In the atelier</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-light sm:text-4xl">
              {occasion.name} pieces are being finished by hand
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-600">
              Couture takes a little longer to arrive online. Meanwhile, the full boutique has
              pieces that dress this moment beautifully.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/shop" className="btn-primary">
                Explore the boutique
              </Link>
              <Link href="/support" className="btn-ghost">
                Ask about {occasion.name}
              </Link>
            </div>
          </Reveal>
        )}
      </section>

      {/* Other occasions */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-light tracking-wide sm:text-3xl">
            More celebrations
          </h2>
        </Reveal>
        <div className="flex flex-wrap gap-3">
          {otherOccasions.map((o) => (
            <Reveal key={o.slug}>
              <Link
                href={`/occasions/${o.slug}`}
                className="inline-block border border-line bg-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600 transition-colors duration-300 hover:border-gold/50 hover:text-gold-deep"
              >
                {o.name}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
