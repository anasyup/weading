import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import ProductForm from "@/components/admin/product-form";
import { addMedia, removeMedia } from "../actions";
import MediaUploader from "@/components/admin/media-uploader";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      prices: { include: { country: true } },
      countries: true,
      media: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: {
          values: { include: { attributeValue: true } },
          inventoryItems: true,
        },
      },
      attributes: true,
      customizations: { include: { option: { include: { values: true } } } },
    },
  });
  if (!product) notFound();

  const [categories, countries] = await Promise.all([
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.country.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const pk = product.prices.find((p) => p.country.code === "PK");

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
        ← Products
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{product.name}</h1>
        <Link href={`/products/${product.slug}`} className="text-[11px] uppercase tracking-[0.14em] text-gold-deep hover:underline">
          View in store ↗
        </Link>
      </div>
      {saved && (
        <p className="mt-4 border border-moss/40 bg-moss/10 px-4 py-2.5 text-xs text-moss">Saved ✓</p>
      )}

      <div className="mt-8">
        <ProductForm
          isNew={false}
          categories={categories}
          countries={countries}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: product.categoryId,
            productType: product.productType,
            productionDaysMin: product.productionDaysMin,
            productionDaysMax: product.productionDaysMax,
            basePrice: product.basePrice,
            salePrice: product.salePrice,
            sizeChart: product.sizeChart,
            careInstructions: product.careInstructions,
            isFeatured: product.isFeatured,
            status: product.status,
            pkPrice: pk?.price,
            pkSalePrice: pk?.salePrice,
            countries: product.countries.map((c) => c.countryId),
          }}
        />
      </div>

      {/* Variants */}
      <section className="mt-12">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Variants ({product.variants.length})
        </h2>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-line bg-sand/60"><tr>
              <th className="th">SKU</th><th className="th">Options</th><th className="th">Price</th>
              <th className="th">On hand</th><th className="th">Reserved</th><th className="th">Available</th><th className="th">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {product.variants.map((v) => {
                const inv = v.inventoryItems[0];
                const available = (inv?.stockQuantity ?? 0) - (inv?.reservedQuantity ?? 0);
                return (
                  <tr key={v.id}>
                    <td className="td font-mono text-xs">{v.sku}</td>
                    <td className="td">{v.values.map((x) => x.attributeValue.value).join(" · ")}</td>
                    <td className="td">{v.price ? formatMoney(v.price, "USD") : "Inherit"}</td>
                    <td className="td">{inv?.stockQuantity ?? 0}</td>
                    <td className="td">{inv?.reservedQuantity ?? 0}</td>
                    <td className={`td ${available <= (inv?.lowStockThreshold ?? 3) ? "font-semibold text-rose" : ""}`}>{available}</td>
                    <td className="td text-stone-500">{v.status}</td>
                  </tr>
                );
              })}
              {product.variants.length === 0 && (
                <tr><td colSpan={7} className="td py-6 text-center text-stone-500">
                  No variants — the full matrix builder arrives in Stage 4.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Media */}
      <section className="mt-12">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Media</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {product.media.map((m) => (
            <div key={m.id} className="group relative border border-line bg-white">
              <div className="aspect-[3/4] overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.altText ?? ""} className="h-full w-full object-cover" />
              </div>
              <form action={removeMedia} className="absolute right-1.5 top-1.5">
                <input type="hidden" name="mediaId" value={m.id} />
                <input type="hidden" name="productId" value={product.id} />
                <button className="bg-white/90 px-2 py-1 text-[10px] uppercase tracking-wider text-rose">Remove</button>
              </form>
            </div>
          ))}
        </div>
        <div className="mt-4 flex max-w-xl flex-wrap items-center gap-3">
          <MediaUploader productId={product.id} />
          <span className="text-[11px] text-stone-400">or paste a URL:</span>
          <form action={addMedia} className="flex min-w-64 flex-1 gap-2">
            <input type="hidden" name="productId" value={product.id} />
            <input name="url" placeholder="/uploads/…" className="input" />
            <button className="btn-ghost btn-sm shrink-0">Add</button>
          </form>
        </div>
      </section>

      {/* Customizations */}
      <section className="mt-12 mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Customization options</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {product.customizations.filter((pc) => pc.option.status === "ACTIVE").map((pc) => (
            <div key={pc.customizationOptionId} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{pc.option.name}</p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                {pc.option.values.filter((v) => v.status === "ACTIVE").map((v) => (
                  <li key={v.id} className="flex justify-between">
                    <span>{v.name}</span>
                    <span className="text-gold-deep">{v.additionalPrice ? `+${formatMoney(v.additionalPrice, "USD")}` : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {product.customizations.length === 0 && (
            <p className="text-sm text-stone-500">No customization options linked (manage globally in Stage 4).</p>
          )}
        </div>
      </section>
    </div>
  );
}
