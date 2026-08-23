import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { addExpense, deleteExpense, processRefund } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finance" };

export default async function AdminFinancePage() {
  const [paidOrders, refunds, expenses, recentPayments] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
      select: { subtotal: true, discountAmount: true, shippingAmount: true, taxAmount: true, totalAmount: true, currency: true },
    }),
    prisma.refund.findMany({ include: { order: true }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ orderBy: { incurredAt: "desc" } }),
    prisma.payment.findMany({
      where: { status: "SUCCESS" },
      include: { order: true, gateway: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const usd = (orders: typeof paidOrders) => orders.filter((o) => o.currency === "USD");
  const gross = usd(paidOrders).reduce((s, o) => s + o.totalAmount, 0);
  const shippingCollected = usd(paidOrders).reduce((s, o) => s + o.shippingAmount, 0);
  const taxesCollected = usd(paidOrders).reduce((s, o) => s + o.taxAmount, 0);
  const discountsGiven = usd(paidOrders).reduce((s, o) => s + o.discountAmount, 0);
  const refundsUsd = refunds.filter((r) => r.currency === "USD").reduce((s, r) => s + r.amount, 0);
  const expensesUsd = expenses.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
  const net = gross - refundsUsd - expensesUsd;

  const Stat = ({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) => (
    <div className="card p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className={`mt-2 font-[family-name:var(--font-display)] text-2xl ${tone === "good" ? "text-moss" : tone === "bad" ? "text-rose" : ""}`}>{value}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="eyebrow">Money</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Finance</h1>
        <p className="mt-2 text-sm text-stone-600">
          Finance-lite (USD view) — a full accounting integration can slot in later without changing this module.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Gross revenue (paid)" value={formatMoney(gross, "USD")} />
        <Stat label="Refunds" value={formatMoney(refundsUsd, "USD")} tone={refundsUsd > 0 ? "bad" : undefined} />
        <Stat label="Expenses" value={formatMoney(expensesUsd, "USD")} />
        <Stat label="Estimated net" value={formatMoney(net, "USD")} tone={net >= 0 ? "good" : "bad"} />
        <Stat label="Shipping collected" value={formatMoney(shippingCollected, "USD")} />
        <Stat label="Taxes collected" value={formatMoney(taxesCollected, "USD")} />
        <Stat label="Discounts given" value={formatMoney(discountsGiven, "USD")} />
        <Stat label="Avg order value" value={formatMoney(paidOrders.length ? Math.round(gross / paidOrders.length) : 0, "USD")} />
      </div>

      {/* Pending refunds */}
      {refunds.filter((r) => r.status === "PENDING").length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Pending refunds</h2>
          <div className="card divide-y divide-line">
            {refunds.filter((r) => r.status === "PENDING").map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{r.order.orderNumber} — {formatMoney(r.amount, r.currency)}</p>
                  <p className="text-xs text-stone-500">{r.reason ?? "No reason given"}</p>
                </div>
                <form action={processRefund}>
                  <input type="hidden" name="refundId" value={r.id} />
                  <button className="btn-primary btn-sm">Mark processed (in gateway)</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent payments + expenses */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Recent payments</h2>
          <div className="card divide-y divide-line">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{p.order.orderNumber}</p>
                  <p className="text-[11px] text-stone-500">
                    {p.gateway?.name ?? "Gateway"} · {p.transactionId} · {p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatMoney(p.amount, p.currency)}</p>
              </div>
            ))}
            {recentPayments.length === 0 && <p className="p-4 text-sm text-stone-500">No payments yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Expenses</h2>
          <form action={addExpense} className="card mb-3 grid grid-cols-2 gap-3 p-4">
            <input name="title" required placeholder="What was it? *" className="input col-span-2" />
            <input name="amount" required placeholder="Amount ($) *" className="input" inputMode="decimal" />
            <select name="category" className="input">
              {["FABRIC", "LABOUR", "SHIPPING", "MARKETING", "TOOLS", "OTHER"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="date" name="incurredAt" className="input" />
            <button className="btn-primary btn-sm">Add expense</button>
          </form>
          <div className="card divide-y divide-line">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-[11px] text-stone-500">
                    {e.category} · {e.incurredAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{formatMoney(e.amount, e.currency)}</p>
                  <form action={deleteExpense}>
                    <input type="hidden" name="expenseId" value={e.id} />
                    <button className="text-[10px] uppercase tracking-wider text-stone-400 underline hover:text-rose">Del</button>
                  </form>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="p-4 text-sm text-stone-500">No expenses recorded.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
