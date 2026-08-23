import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { resolveUnitPrice, type CountryContext } from "@/lib/pricing";
import type { Prisma } from "@prisma/client";

type ProductCardData = Prisma.ProductGetPayload<{
  include: { prices: true; media: { take: 1 } };
}>;

export default function ProductCard({
  product,
  country,
}: {
  product: ProductCardData;
  country: CountryContext;
}) {
  const image = product.media.find((m) => m.type === "IMAGE");
  const countryPrice = product.prices.find((p) => p.countryId === country.id);
  const { list, effective, isSale } = resolveUnitPrice({
    basePrice: product.basePrice,
    salePrice: product.salePrice,
    countryPrice: countryPrice?.price ?? null,
    countrySalePrice: countryPrice?.salePrice ?? null,
    currency: country.currency,
  });

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden border border-line bg-sand">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-stone-400">No image</div>
        )}
        {isSale && (
          <span className="badge absolute left-3 top-3 border-rose/40 bg-white text-rose">Sale</span>
        )}
        {product.productType === "MADE_TO_ORDER" && (
          <span className="badge absolute bottom-3 left-3 border-line bg-white/90 text-stone-600">
            Made to order · 30–45 days
          </span>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug group-hover:text-gold-deep">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          {isSale && (
            <span className="mr-2 text-stone-400 line-through">{formatMoney(list, country.currency)}</span>
          )}
          <span className={isSale ? "text-rose" : ""}>{formatMoney(effective, country.currency)}</span>
        </p>
      </div>
    </Link>
  );
}
