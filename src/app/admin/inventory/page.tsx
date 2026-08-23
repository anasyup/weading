import { prisma } from "@/lib/db";
import { adjustStock, setThreshold } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    include: {
      product: { select: { name: true, slug: true } },
      variant: { include: { values: { include: { attributeValue: true } } } },
      location: true,
    },
    orderBy: { productId: "asc" },
  });

  const lowCount = items.filter((i) => i.stockQuantity - i.reservedQuantity <= i.lowStockThreshold).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Central atelier</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Inventory</h1>
          <p className="mt-2 text-sm text-stone-600">
            Available = On hand − Reserved · {items.length} tracked variants ·{" "}
            <span className={lowCount > 0 ? "font-semibold text-rose" : ""}>{lowCount} low</span>
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-line bg-sand/60"><tr>
            <th className="th">Product / variant</th><th className="th">On hand</th><th className="th">Reserved</th>
            <th className="th">Available</th><th className="th">Low threshold</th><th className="th">Adjust stock</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {items.map((i) => {
              const available = i.stockQuantity - i.reservedQuantity;
              const low = available <= i.lowStockThreshold;
              return (
                <tr key={i.id} className="hover:bg-sand/30">
                  <td className="td">
                    <span className="font-medium">{i.product.name}</span>
                    <span className="block text-[11px] text-stone-400">
                      {i.variant?.values.map((v) => v.attributeValue.value).join(" · ") ?? "Base"}
                      {i.location ? ` · ${i.location.name}` : ""}
                    </span>
                  </td>
                  <td className="td">{i.stockQuantity}</td>
                  <td className="td text-stone-600">{i.reservedQuantity}</td>
                  <td className={`td font-semibold ${low ? "text-rose" : "text-moss"}`}>{available}</td>
                  <td className="td">
                    <form action={setThreshold} className="flex items-center gap-1.5">
                      <input type="hidden" name="inventoryItemId" value={i.id} />
                      <input name="threshold" defaultValue={i.lowStockThreshold} className="input !w-16 !px-2 !py-1 text-center" inputMode="numeric" />
                      <button className="text-[10px] uppercase tracking-wider text-stone-500 underline">Set</button>
                    </form>
                  </td>
                  <td className="td">
                    <form action={adjustStock} className="flex items-center gap-1.5">
                      <input type="hidden" name="inventoryItemId" value={i.id} />
                      <input name="delta" placeholder="±N" className="input !w-16 !px-2 !py-1 text-center" inputMode="numeric" required />
                      <input name="reason" placeholder="Reason" className="input !w-36 !px-2 !py-1" />
                      <button className="btn-primary !px-3 !py-1.5 !text-[10px]">Apply</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="td py-10 text-center text-stone-500">No inventory items yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
