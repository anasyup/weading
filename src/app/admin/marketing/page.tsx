import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { createCoupon, toggleCoupon, setSubscriberStatus, createCampaign, toggleCampaign, sendRecoveryEmail } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  const abandonedSince = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [coupons, subscribers, campaigns, abandonedCarts] = await Promise.all([
    prisma.coupon.findMany({ include: { rules: true, _count: { select: { redemptions: true } } }, orderBy: { startsAt: "desc" } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.marketingCampaign.findMany({ orderBy: { startDate: "desc" } }),
    prisma.cart.findMany({
      where: { status: "ACTIVE", updatedAt: { lt: abandonedSince }, items: { some: { savedForLater: false } } },
      include: {
        customer: { include: { user: { select: { email: true } } } },
        items: { where: { savedForLater: false }, include: { product: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),
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

      {/* Abandoned carts (48h+) */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Abandoned carts ({abandonedCarts.length}) — idle &gt; 48h
        </h2>
        <div className="card divide-y divide-line">
          {abandonedCarts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {c.customer.firstName} {c.customer.lastName}
                  <span className="ml-2 text-xs font-normal text-stone-400">{c.customer.user.email}</span>
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {c.items.map((i) => i.product.name).join(", ")} · idle since{" "}
                  {c.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <form action={sendRecoveryEmail}>
                <input type="hidden" name="cartId" value={c.id} />
                <button className="btn-primary btn-sm">Send recovery email</button>
              </form>
            </div>
          ))}
          {abandonedCarts.length === 0 && (
            <p className="p-4 text-sm text-stone-500">No abandoned carts — nice. A daily cron also sends these automatically.</p>
          )}
        </div>
      </section>

      {/* Campaigns */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Campaigns ({campaigns.length})</h2>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line bg-sand/60"><tr>
              <th className="th">Name</th><th className="th">Channel</th><th className="th">Window</th>
              <th className="th">Status</th><th className="th"></th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="td font-medium">{c.name}</td>
                  <td className="td text-stone-600">{c.channel}</td>
                  <td className="td text-xs text-stone-500">
                    {c.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} →{" "}
                    {c.endDate ? c.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "∞"}
                  </td>
                  <td className="td">
                    <span className={`badge ${c.status === "ACTIVE" ? "border-moss/40 bg-moss/10 text-moss" : "border-line text-stone-500"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="td">
                    <form action={toggleCampaign}>
                      <input type="hidden" name="campaignId" value={c.id} />
                      <button className="text-[10px] uppercase tracking-wider text-stone-500 underline hover:text-gold-deep">
                        {c.status === "ACTIVE" ? "Pause" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={5} className="td py-6 text-center text-stone-500">No campaigns yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <details className="mt-4 border border-line bg-white">
          <summary className="cursor-pointer px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]">+ New campaign</summary>
          <form action={createCampaign} className="grid gap-3 border-t border-line p-5 sm:grid-cols-4">
            <div><label className="label">Name *</label><input name="name" required placeholder="Eid Collection 2026" className="input" /></div>
            <div><label className="label">Channel</label>
              <select name="channel" className="input">
                {["EMAIL", "INSTAGRAM", "FACEBOOK", "WHATSAPP", "OTHER"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Starts</label><input type="date" name="startDate" className="input" /></div>
            <div><label className="label">Ends</label><input type="date" name="endDate" className="input" /></div>
            <div className="sm:col-span-4"><button className="btn-gold btn-sm">Create campaign</button></div>
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
