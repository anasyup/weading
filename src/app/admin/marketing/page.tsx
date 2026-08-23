import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { createCoupon, toggleCoupon, setSubscriberStatus } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  const [coupons, subscribers] = await Promise.all([
    prisma.coupon.findMany({ include: { rules: true, _count: { select: { redemptions: true } } }, orderBy: { startsAt: "desc" } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <div>
        <p className="eyebrow">Growth</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Marketing</h1>
        <p className="mt-2 text-sm text-stone-600">Coupons and newsletter — the tools one person can actually use.</p>
      </div>

      {/* Coupons */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Coupons ({coupons.length})</h2>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-line bg-sand/60"><tr>
              <th className="th">Code</th><th className="th">Discount</th><th className="th">Window</th>
              <th className="th">Rules</th><th className="th">Used</th><th className="th">Status</th><th className="th"></th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="td font-mono text-xs font-semibold">{c.code}</td>
                  <td className="td">
                    {c.discountType === "PERCENT" ? `${c.discountValue / 100}%` : formatMoney(c.discountValue, c.fixedCurrency ?? "USD")}
                  </td>
                  <td className="td text-xs text-stone-500">
                    {c.startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} →{" "}
                    {c.endsAt ? c.endsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "∞"}
                  </td>
                  <td className="td text-xs text-stone-500">
                    {c.rules.map((r) => r.ruleType === "MIN_ORDER" ? `Min ${formatMoney(parseInt(r.ruleValue), "USD")}` : r.ruleType).join(", ") || "—"}
                    {c.perCustomerLimit ? ` · ${c.perCustomerLimit}/customer` : ""}
                  </td>
                  <td className="td">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""} <span className="text-[10px] text-stone-400">({c._count.redemptions} orders)</span></td>
                  <td className="td">
                    <span className={`badge ${c.status === "ACTIVE" ? "border-moss/40 bg-moss/10 text-moss" : "border-line bg-white text-stone-500"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="td">
                    <form action={toggleCoupon}>
                      <input type="hidden" name="couponId" value={c.id} />
                      <button className="text-[10px] uppercase tracking-wider text-stone-500 underline hover:text-gold-deep">
                        {c.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={7} className="td py-8 text-center text-stone-500">No coupons yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* New coupon */}
        <details className="mt-4 border border-line bg-white">
          <summary className="cursor-pointer px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
            + New coupon
          </summary>
          <form action={createCoupon} className="grid gap-4 border-t border-line p-5 sm:grid-cols-3">
            <div>
              <label className="label">Code *</label>
              <input name="code" required placeholder="MEHNDI15" className="input" />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="discountType" className="input">
                <option value="PERCENT">Percentage</option>
                <option value="FIXED">Fixed amount (USD)</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <div className="grid grid-cols-2 gap-2">
                <input name="percentValue" placeholder="15 (%)" className="input" inputMode="decimal" />
                <input name="fixedValue" placeholder="25 ($)" className="input" inputMode="decimal" />
              </div>
            </div>
            <div>
              <label className="label">Starts</label>
              <input type="date" name="startsAt" className="input" />
            </div>
            <div>
              <label className="label">Ends (optional)</label>
              <input type="date" name="endsAt" className="input" />
            </div>
            <div>
              <label className="label">Min order ($) (optional)</label>
              <input name="minOrder" placeholder="500" className="input" inputMode="decimal" />
            </div>
            <div>
              <label className="label">Total usage limit</label>
              <input name="usageLimit" className="input" inputMode="numeric" placeholder="unlimited" />
            </div>
            <div>
              <label className="label">Per-customer limit</label>
              <input name="perCustomerLimit" className="input" inputMode="numeric" placeholder="unlimited" />
            </div>
            <div className="flex items-end">
              <button className="btn-primary btn-sm w-full">Create coupon</button>
            </div>
          </form>
        </details>
      </section>

      {/* Newsletter */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Newsletter subscribers ({subscribers.filter((s) => s.status === "SUBSCRIBED").length})
        </h2>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[520px]">
            <thead className="border-b border-line bg-sand/60"><tr>
              <th className="th">Email</th><th className="th">Status</th><th className="th">Joined</th><th className="th"></th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="td">{s.email}</td>
                  <td className="td">
                    <span className={`badge ${s.status === "SUBSCRIBED" ? "border-moss/40 bg-moss/10 text-moss" : "border-line bg-white text-stone-400"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="td text-xs text-stone-500">
                    {s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="td">
                    <form action={setSubscriberStatus}>
                      <input type="hidden" name="subscriberId" value={s.id} />
                      <input type="hidden" name="status" value={s.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED"} />
                      <button className="text-[10px] uppercase tracking-wider text-stone-500 underline hover:text-gold-deep">
                        {s.status === "SUBSCRIBED" ? "Unsubscribe" : "Resubscribe"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr><td colSpan={4} className="td py-8 text-center text-stone-500">No subscribers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
