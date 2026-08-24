import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; payment?: string }>;
}) {
  const { q, stage, payment } = await searchParams;

  const stages = await prisma.workflowStage.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  const orders = await prisma.order.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q.toUpperCase() } },
              { customer: { firstName: { contains: q } } },
              { customer: { lastName: { contains: q } } },
              { customer: { user: { email: { contains: q } } } },
            ],
          }
        : {}),
      ...(stage ? { stageName: stage } : {}),
      ...(payment ? { paymentStatus: payment } : {}),
    },
    include: { customer: { include: { user: true } }, country: true },
    orderBy: { placedAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Fulfilment</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Orders</h1>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=orders" className="btn-ghost btn-sm">⬇ CSV</a>
          <Link href="/admin/orders/new" className="btn-gold btn-sm">+ Manual order</Link>
          <form className="flex gap-2">
            <input name="q" defaultValue={q ?? ""} placeholder="Search order #, name, email…" className="input !w-64" />
            <button className="btn-primary btn-sm">Search</button>
          </form>
        </div>
      </div>

      {/* Stage filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`badge ${!stage && !payment ? "border-ink bg-ink text-cream" : "border-line bg-white text-stone-600"}`}
        >
          All
        </Link>
        {stages.map((s) => (
          <Link
            key={s.id}
            href={`/admin/orders?stage=${encodeURIComponent(s.name)}`}
            className={`badge ${stage === s.name ? "border-ink bg-ink text-cream" : "border-line bg-white text-stone-600"}`}
          >
            {s.name} · {s._count.orders}
          </Link>
        ))}
        <Link
          href="/admin/orders?payment=PENDING"
          className={`badge ${payment === "PENDING" ? "border-gold bg-gold text-white" : "border-gold/40 bg-white text-gold-deep"}`}
        >
          Unpaid
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-line bg-sand/60"><tr>
            <th className="th">Order</th><th className="th">Customer</th><th className="th">Country</th>
            <th className="th">Stage</th><th className="th">Payment</th>
            <th className="th">Est. delivery</th><th className="th text-right">Total</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-sand/30">
                <td className="td">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-gold-deep">{o.orderNumber}</Link>
                  <span className="block text-[10px] text-stone-400">
                    {o.placedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </td>
                <td className="td">
                  {o.customer.firstName} {o.customer.lastName}
                  <span className="block text-[10px] text-stone-400">{o.customer.user.email}</span>
                </td>
                <td className="td text-stone-600">{o.country.code} · {o.currency}</td>
                <td className="td"><span className="badge border-line bg-sand">{o.stageName}</span></td>
                <td className="td">
                  <span className={`badge ${o.paymentStatus === "PAID" ? "border-moss/40 bg-moss/10 text-moss" : o.paymentStatus === "PENDING" ? "border-gold/40 bg-gold/10 text-gold-deep" : "border-line bg-white text-stone-500"}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="td text-stone-600">
                  {o.estimatedDelivery?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "—"}
                </td>
                <td className="td text-right font-semibold">{formatMoney(o.totalAmount, o.currency)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="td py-10 text-center text-stone-500">No orders match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
