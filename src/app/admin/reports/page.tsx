import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    paidOrders30,
    allOrders,
    topProducts,
    lowPerformers,
    customers,
    lowStock,
    movements,
    couponUsage,
    abandoned,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] }, placedAt: { gte: since30 } },
      select: { totalAmount: true, currency: true },
    }),
    prisma.order.groupBy({ by: ["stageName"], _count: true }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "asc" } },
      take: 5,
    }),
    prisma.customer.findMany({
      include: { orders: { where: { paymentStatus: "PAID" }, select: { totalAmount: true, currency: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.inventoryItem.findMany({
      where: { product: { status: "ACTIVE" } },
      include: { product: true, variant: { include: { values: { include: { attributeValue: true } } } } },
    }),
    prisma.inventoryTransaction.count({ where: { createdAt: { gte: since30 } } }),
    prisma.coupon.findMany({
      include: { _count: { select: { redemptions: true } } },
      orderBy: { usageCount: "desc" },
      take: 5,
    }),
    prisma.cart.count({
      where: { status: "ACTIVE", updatedAt: { lt: new Date(Date.now() - 48 * 3600_000) }, items: { some: {} } },
    }),
  ]);

  const revenue30 = paidOrders30.filter((o) => o.currency === "USD").reduce((s, o) => s + o.totalAmount, 0);
  const aov = paidOrders30.length ? Math.round(revenue30 / paidOrders30.length) : 0;

  const repeatCustomers = customers.filter((c) => c.orders.length >= 2);
  const highValue = customers
    .map((c) => ({ ...c, ltv: c.orders.reduce((s, o) => s + (o.currency === "USD" ? o.totalAmount : 0), 0) }))
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 5);

  const lowStockItems = lowStock.filter((i) => i.stockQuantity - i.reservedQuantity <= i.lowStockThreshold);
  const maxQty = Math.max(1, ...topProducts.map((p) => p._sum.quantity ?? 0));

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="card p-5">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="eyebrow">Insight</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Reports</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Revenue (30d)</p><p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{formatMoney(revenue30, "USD")}</p></div>
        <div className="card p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Paid orders (30d)</p><p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{paidOrders30.length}</p></div>
        <div className="card p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Avg order value</p><p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{formatMoney(aov, "USD")}</p></div>
        <div className="card p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Repeat customers</p><p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{repeatCustomers.length}</p></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Best sellers (all time)">
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.productName}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{p.productName}</span>
                  <span className="text-stone-500">{p._sum.quantity} sold · {formatMoney(p._sum.lineTotal ?? 0, "USD")}</span>
                </div>
                <div className="h-1.5 bg-sand"><div className="h-full bg-gold" style={{ width: `${((p._sum.quantity ?? 0) / maxQty) * 100}%` }} /></div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-stone-500">No sales yet.</p>}
          </div>
        </Section>

        <Section title="Orders by stage">
          <ul className="space-y-2 text-sm">
            {allOrders.map((s) => (
              <li key={s.stageName} className="flex justify-between">
                <span>{s.stageName}</span>
                <span className="font-semibold">{s._count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs text-stone-500">
            Abandoned carts (48h+): <strong className="text-ink">{abandoned}</strong> · Stock movements (30d): <strong className="text-ink">{movements}</strong>
          </p>
        </Section>

        <Section title="Top customers by value">
          <ul className="space-y-2.5 text-sm">
            {highValue.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.firstName} {c.lastName} <span className="text-xs text-stone-400">({c.orders.length} orders)</span></span>
                <span className="font-semibold">{c.ltv > 0 ? formatMoney(c.ltv, "USD") : "—"}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Low stock (needs attention)">
          <ul className="space-y-2.5 text-sm">
            {lowStockItems.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.product.name} · {i.variant?.values.map((v) => v.attributeValue.value).join(" ") ?? "Base"}</span>
                <span className="font-semibold text-rose">{i.stockQuantity - i.reservedQuantity} left</span>
              </li>
            ))}
            {lowStockItems.length === 0 && <p className="text-stone-500">All stocked ✓</p>}
          </ul>
        </Section>

        <Section title="Coupon performance">
          <ul className="space-y-2.5 text-sm">
            {couponUsage.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span className="font-mono text-xs">{c.code}</span>
                <span>{c._count.redemptions} redemptions · {c.usageCount} uses</span>
              </li>
            ))}
            {couponUsage.length === 0 && <p className="text-stone-500">No coupons yet.</p>}
          </ul>
        </Section>

        <Section title="Needs a push (fewest sales)">
          <ul className="space-y-2 text-sm">
            {lowPerformers.filter((p) => (p._sum.quantity ?? 0) <= 1).map((p) => (
              <li key={p.productName} className="flex justify-between">
                <span>{p.productName}</span>
                <span className="text-stone-500">{p._sum.quantity ?? 0} sold</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">Tip: feature these on the homepage or run a coupon.</p>
        </Section>
      </div>
    </div>
  );
}
