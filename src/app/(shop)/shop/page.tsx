import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import ProductCard from "@/components/product-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  if (category) {
    const c = await prisma.category.findUnique({ where: { slug: category } });
    if (c) return { title: c.seoTitle ?? c.name, description: c.seoDescription ?? c.description ?? undefined };
  }
  return { title: "Shop — Made-to-Order Bridal Couture" };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;
  const country = await getCountry();

  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });
  const activeCategory = category ? categories.find((c) => c.slug === category) : null;

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      countries: { some: { countryId: country.id } },
      ...(activeCategory ? { categoryId: activeCategory.id } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: { prices: true, media: true },
    orderBy: sort === "price-asc" ? { basePrice: "asc" } : sort === "price-desc" ? { basePrice: "desc" } : { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="eyebrow">The boutique</p>
      <h1 className="section-title mt-2">
        {activeCategory ? activeCategory.name : q ? `Results for “${q}”` : "All Products"}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        {products.length} {products.length === 1 ? "piece" : "pieces"} · made to order in 30–45 days
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Filters */}
        <aside className="space-y-6">
          <div>
            <p className="label">Categories</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className={!activeCategory ? "font-semibold text-gold-deep" : "text-stone-600 hover:text-ink"}>
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop?category=${c.slug}`}
                    className={activeCategory?.id === c.id ? "font-semibold text-gold-deep" : "text-stone-600 hover:text-ink"}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Sort</p>
            <ul className="space-y-2 text-sm">
              {[
                ["", "Newest"],
                ["price-asc", "Price: low to high"],
                ["price-desc", "Price: high to low"],
              ].map(([val, label]) => (
                <li key={label}>
                  <Link
                    href={`/shop?${new URLSearchParams({ ...(category ? { category } : {}), ...(val ? { sort: val } : {}) }).toString()}`}
                    className={(sort ?? "") === val ? "font-semibold text-gold-deep" : "text-stone-600 hover:text-ink"}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {products.length === 0 ? (
            <div className="border border-line bg-white px-6 py-16 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl">Nothing found</p>
              <p className="mt-2 text-sm text-stone-600">Try another category or search term.</p>
              <Link href="/shop" className="btn-ghost btn-sm mt-6">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} country={country} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
