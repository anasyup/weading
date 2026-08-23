import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getCountry } from "@/lib/country";
import { formatMoney } from "@/lib/money";
import AddToCartForm, { type VariantOption } from "@/components/add-to-cart-form";
import WishlistButton from "@/components/wishlist-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  return {
    title: product?.name ?? "Product",
    description: product?.description?.slice(0, 155),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      prices: true,
      variants: {
        where: { status: "ACTIVE" },
        include: { values: { include: { attributeValue: { include: { attribute: true } }, attribute: true } } },
      },
      customizations: {
        include: { option: { include: { values: true } } },
      },
    },
  });
  if (!product || product.status !== "ACTIVE") notFound();

  const [country, user] = await Promise.all([getCountry(), getSessionUser()]);

  // Behaviour tracking (Enterprise §20)
  if (user?.customerId) {
    prisma.customerEvent
      .create({
        data: { customerId: user.customerId, eventType: "PRODUCT_VIEW", productId: product.id },
      })
      .catch(() => {});
  }

  const countryPrice = product.prices.find((p) => p.countryId === country.id);
  const pkrSetting = await prisma.systemSetting.findUnique({ where: { key: "currency.pkr_per_usd" } });
  const pkrPerUsd = pkrSetting ? parseInt(pkrSetting.value, 10) || 280 : 280;

  const template = await prisma.measurementTemplate.findFirst({
    where: { isDefault: true, status: "ACTIVE" },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });

  const variants: VariantOption[] = product.variants
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.values
        .slice()
        .sort((a, b) => (a.attribute?.name ?? "").localeCompare(b.attribute?.name ?? ""))
        .map((vv) => vv.attributeValue.value)
        .join(" · "),
      priceUsd: v.price,
      salePriceUsd: v.salePrice,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const customizations = product.customizations
    .filter((pc) => pc.option.status === "ACTIVE")
    .map((pc) => ({
      optionId: pc.option.id,
      optionName: pc.option.name,
      values: pc.option.values
        .filter((v) => v.status === "ACTIVE")
        .map((v) => ({ id: v.id, name: v.name, additionalPrice: v.additionalPrice }))
        .sort((a, b) => a.additionalPrice - b.additionalPrice),
    }));

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const inWishlist = user?.customerId
    ? !!(await prisma.wishlistItem.findFirst({
        where: { productId: product.id, wishlist: { customerId: user.customerId } },
      }))
    : false;

  const images = product.media.filter((m) => m.type === "IMAGE");
  const baseEffectiveUsd = product.salePrice ?? product.basePrice;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: variants[0]?.sku,
    brand: { "@type": "Brand", name: "Noor Bridal" },
    offers: {
      "@type": "Offer",
      price: ((countryPrice ? countryPrice.salePrice ?? countryPrice.price : product.salePrice ?? product.basePrice) / 100).toFixed(2),
      priceCurrency: country.currency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Breadcrumb */}
      <nav className="mb-6 text-[11px] uppercase tracking-[0.14em] text-stone-400">
        <Link href="/shop" className="hover:text-gold-deep">Shop</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-gold-deep">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-[3/4] border border-line bg-sand">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0].url} alt={images[0].altText ?? product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-stone-400">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((m) => (
                <div key={m.id} className="aspect-square border border-line bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.altText ?? ""} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <p className="eyebrow">{product.category.name}</p>}
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-stone-500">
            <span className="badge border-line bg-white text-stone-600">
              {product.productType === "MADE_TO_ORDER" ? "Made to Order" : "Ready to Wear"}
            </span>
            <span>Ships to US · CA · PK</span>
          </div>

          <div className="mt-8">
            <div className="mb-5"><WishlistButton productId={product.id} initialInWishlist={inWishlist} loggedIn={!!user} /></div>
            <AddToCartForm
              productId={product.id}
              slug={product.slug}
              productType={product.productType}
              leadMin={product.productionDaysMin}
              leadMax={product.productionDaysMax}
              variants={variants}
              customizations={customizations}
              measurementFields={
                product.productType === "MADE_TO_ORDER" && template
                  ? template.fields.map((f) => ({ id: f.id, fieldKey: f.fieldKey, fieldName: f.fieldName, required: f.required }))
                  : []
              }
              baseEffectiveUsd={baseEffectiveUsd}
              countryPriceMinor={countryPrice ? (countryPrice.salePrice ?? countryPrice.price) : null}
              currency={country.currency}
              pkrPerUsd={pkrPerUsd}
              isLoggedIn={!!user}
            />
          </div>

      {/* Details */}
      <div className="mt-10 divide-y divide-line border-y border-line">
            <details open className="group py-4">
              <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em]">
                Description
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{product.description}</p>
            </details>
            {product.sizeChart && (
              <details className="py-4">
                <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Size chart
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-80 border-collapse text-xs" dangerouslySetInnerHTML={{ __html: product.sizeChart }} />
                </div>
              </details>
            )}
            {product.careInstructions && (
              <details className="py-4">
                <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Care instructions
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{product.careInstructions}</p>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-line pt-10">
        <h2 className="section-title">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">
            No reviews yet — reviews open for customers once their order is delivered.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-6">
                <p className="text-gold">{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></p>
                {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                {r.body && <p className="mt-2 text-sm leading-relaxed text-stone-700">{r.body}</p>}
                <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-stone-400">
                  {r.customer.firstName} {r.customer.lastName.charAt(0)}. · Verified purchase
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
