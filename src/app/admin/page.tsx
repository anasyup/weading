import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "border-gold/60 bg-sand" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-stone-500">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const abandonedSince = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [
    ordersToday,
    pendingOrders,
    productionOrders,
    readyOrders,
    revenueTodayAgg,
    revenueMonthAgg,
    lowStock,
    newCustomers,
    abandonedCarts,
    refundsMonth,
    recentOrders,
    topProducts,
    countrySplit,
    openTickets,
    pendingReviews,
  ] = await Promise.all([
    prisma.order.count({ where: { placedAt: { gte: startToday } } }),
    prisma.order.count({ where: { paymentStatus: "PENDING", stage: { isSystem: false } } }),
    prisma.order.count({ where: { stageName: "In Production" } }),
    prisma.order.count({ where: { stageName: "Ready" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS", createdAt: { gte: startToday } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS", createdAt: { gte: monthStart } } }),
    prisma.inventoryItem.count({
      where: { product: { status: "ACTIVE" }, stockQuantity: { lte: prisma.inventoryItem.fields.reservedQuantity } },
    }),
    prisma.customer.count({ where: { createdAt: { gte: startToday } } }),
    prisma.cart.count({
      where: { status: "ACTIVE", updatedAt: { lt: abandonedSince }, items: { some: { savedForLater: false } } },
    }),
    prisma.refund.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { placedAt: "desc" },
      include: { customer: true, country: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({ by: ["countryId", "currency"], _sum: { totalAmount: true }, _count: true }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const countries = await prisma.country.findMany();
  const totalCountryRevenue = countrySplit.reduce((s, c) => s + (c._sum.totalAmount ?? 0), 0) || 1;

  const todo: { label: string; href: string; count: number }[] = [
    { label: "orders awaiting payment", href: "/admin/orders?payment=PENDING", count: pendingOrders },
    { label: "open support tickets", href: "/admin/orders", count: openTickets },
    { label: "reviews to moderate", href: "/admin/orders", count: pendingReviews },
    { label: "low-stock variants", href: "/admin/inventory", count: lowStock },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">{greeting}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Here&apos;s your day at a glance</h1>
      <p className="mt-2 text-sm text-stone-600">
        {todo.filter((t) => t.count > 0).length > 0
          ? `You have ${todo.filter((t) => t.count > 0).map((t) => `${t.count} ${t.label}`).join(", ")}.`
          : "Everything is under control — nothing needs your attention right now."}
      </p>

      {/* KPI grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Orders today" value={String(ordersToday)} />
        <StatCard label="Revenue today" value={formatMoney(revenueTodayAgg._sum.amount ?? 0, "USD")} accent />
        <StatCard label="Pending payment" value={String(pendingOrders)} hint="Awaiting confirmation" />
        <StatCard label="In production" value={String(productionOrders)} hint={`${readyOrders} ready to ship`} />
        <StatCard label="Revenue this month" value={formatMoney(revenueMonthAgg._sum.amount ?? 0, "USD")} />
        <StatCard label="New customers today" value={String(newCustomers)} />
        <StatCard label="Abandoned carts" value={String(abandonedCarts)} hint="Idle > 48h" />
        <StatCard label="Refunds this month" value={String(refundsMonth)} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Recent orders */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Recent orders</h2>
            <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.14em] text-gold-deep hover:underline">
              All orders →
            </Link>
          </div>
          <div className="overflow-x-auto border border-line bg-white">
            <table className="w-full min-w-[620px]">
              <thead className="border-b border-line bg-sand/60"><tr>
                <th className="th">Order</th><th className="th">Customer</th><th className="th">Country</th>
                <th className="th">Stage</th><th className="th">Payment</th><th className="th text-right">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-sand/30">
                    <td className="td">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-gold-deep">{o.orderNumber}</Link>
                      <span className="block text-[10px] text-stone-400">
                        {o.placedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="td">{o.customer.firstName} {o.customer.lastName}</td>
                    <td className="td text-stone-600">{o.country.code}</td>
                    <td className="td"><span className="badge border-line bg-sand">{o.stageName}</span></td>
                    <td className="td">
                      <span className={`badge ${o.paymentStatus === "PAID" ? "border-moss/40 bg-moss/10 text-moss" : "border-gold/40 bg-gold/10 text-gold-deep"}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="td text-right font-semibold">{formatMoney(o.totalAmount, o.currency)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="td text-center text-stone-500">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Top products */}
          <div className="mb-3 mt-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Best sellers</h2>
          </div>
          <div className="border border-line bg-white">
            {topProducts.map((p) => (
              <div key={p.productName} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
                <span className="text-sm">{p.productName}</span>
                <span className="text-xs text-stone-500">
                  {p._sum.quantity} sold · {formatMoney(p._sum.lineTotal ?? 0, "USD")}
                </span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="px-4 py-3 text-sm text-stone-500">No sales yet.</p>}
          </div>
        </section>

        {/* Country split */}
        <aside>
          <div className="mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Sales by country</h2>
          </div>
          <div className="card space-y-4 p-5">
            {countrySplit.length === 0 && <p className="text-sm text-stone-500">No orders yet.</p>}
            {countrySplit.map((c) => {
              const country = countries.find((x) => x.id === c.countryId);
              const share = Math.round(((c._sum.totalAmount ?? 0) / totalCountryRevenue) * 100);
              return (
                <div key={c.countryId}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{country?.name ?? "—"} ({c._count} orders)</span>
                    <span className="text-stone-500">{formatMoney(c._sum.totalAmount ?? 0, c.currency)}</span>
                  </div>
                  <div className="h-1.5 bg-sand"><div className="h-full bg-gold" style={{ width: `${share}%` }} /></div>
                </div>
              );
            })}
          </div>

          <div className="card mt-6 p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Needs attention</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {todo.map((t) => (
                <li key={t.label} className="flex justify-between">
                  <Link href={t.href} className="text-stone-600 capitalize hover:text-gold-deep">{t.label}</Link>
                  <span className={`font-semibold ${t.count > 0 ? "text-rose" : "text-stone-400"}`}>{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
