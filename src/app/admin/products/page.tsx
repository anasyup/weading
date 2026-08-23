import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { setProductStatus } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      prices: { include: { country: true } },
      media: { where: { type: "IMAGE" }, take: 1 },
      inventoryItems: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Products</h1>
        </div>
        <Link href="/admin/products/new" className="btn-gold btn-sm">+ New product</Link>
      </div>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-line bg-sand/60"><tr>
            <th className="th">Product</th><th className="th">Category</th><th className="th">Type</th>
            <th className="th">USD</th><th className="th">PKR</th><th className="th">Stock</th>
            <th className="th">Status</th><th className="th"></th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => {
              const pk = p.prices.find((x) => x.country.code === "PK");
              const stock = p.inventoryItems.reduce(
                (s, i) => s + (i.stockQuantity - i.reservedQuantity), 0
              );
              const img = p.media[0];
              return (
                <tr key={p.id} className="hover:bg-sand/30">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-9 shrink-0 overflow-hidden border border-line bg-sand">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-gold-deep">{p.name}</Link>
                        <span className="block text-[10px] text-stone-400">{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td text-stone-600">{p.category?.name ?? "—"}</td>
                  <td className="td text-stone-600">{p.productType === "MADE_TO_ORDER" ? "MTO" : "RTW"}</td>
                  <td className="td">{formatMoney(p.salePrice ?? p.basePrice, "USD")}</td>
                  <td className="td">{pk ? formatMoney(pk.salePrice ?? pk.price, "PKR") : "—"}</td>
                  <td className={`td ${stock <= 3 ? "font-semibold text-rose" : "text-stone-600"}`}>{stock}</td>
                  <td className="td">
                    <span className={`badge ${p.status === "ACTIVE" ? "border-moss/40 bg-moss/10 text-moss" : "border-line bg-white text-stone-500"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="td">
                    <form action={setProductStatus}>
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="status" value={p.status === "ACTIVE" ? "DRAFT" : "ACTIVE"} />
                      <button className="text-[10px] uppercase tracking-[0.12em] text-stone-500 underline hover:text-gold-deep">
                        {p.status === "ACTIVE" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={8} className="td py-10 text-center text-stone-500">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
