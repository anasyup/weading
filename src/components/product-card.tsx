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
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? product.name}
            loading="lazy"
            className="media-zoom h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-stone-400">No image</div>
        )}
        {isSale && (
          <span className="badge absolute left-3 top-3 border-rose/40 bg-white/95 text-rose">Sale</span>
        )}
      </div>
      <div className="pt-3.5">
        <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug transition-colors duration-300 group-hover:text-gold-deep">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          {isSale && (
            <span className="mr-2 text-stone-400 line-through">{formatMoney(list, country.currency)}</span>
          )}
          <span className={isSale ? "text-rose" : ""}>{formatMoney(effective, country.currency)}</span>
        </p>
        {product.productType === "MADE_TO_ORDER" && (
          <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-stone-400">
            Made to order · {product.productionDaysMin}–{product.productionDaysMax} days
          </p>
        )}
      </div>
    </Link>
  );
}
