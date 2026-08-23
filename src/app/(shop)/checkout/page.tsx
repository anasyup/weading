import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { computeCartTotals } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { cookies } from "next/headers";
import { applyCoupon, removeCoupon, updateCheckoutAddress, placeOrder } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/checkout");
  if (!user.customerId) redirect("/account");

  const jar = await cookies();
  const couponCode = jar.get("nb_coupon")?.value ?? null;

  const [totals, customer, countries] = await Promise.all([
    computeCartTotals(user.customerId, { couponCode }),
    prisma.customer.findUnique({
      where: { id: user.customerId },
      include: { addresses: { include: { country: true }, orderBy: { isDefault: "desc" } } },
    }),
    prisma.country.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!totals) redirect("/cart");
  const address = customer!.addresses[0];

  // Behaviour tracking
  if (user.customerId) {
    prisma.customerEvent
      .create({ data: { customerId: user.customerId, eventType: "CHECKOUT_START" } })
      .catch(() => {});
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="eyebrow">Final step</p>
      <h1 className="section-title mt-2">Checkout</h1>
      <p className="mt-2 text-sm text-stone-600">
        Made to order · handcrafted in {Math.min(...totals.lines.map((l) => 30))}–45 days after payment
      </p>

      {error && (
        <p className="mt-4 border border-rose/40 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* Left: address, coupon, terms */}
        <div className="space-y-8">
          {/* Address */}
          <details className="border border-line bg-white" open={totals.countryCode !== address?.country.code}>
            <summary className="cursor-pointer px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Delivery address — {address ? `${address.city}, ${address.country.name}` : "missing"}
            </summary>
            <form action={updateCheckoutAddress} className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
              <div>
                <label className="label">Country (sets currency, shipping &amp; tax)</label>
                <select name="countryId" defaultValue={address?.countryId} className="input">
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input name="city" required defaultValue={address?.city ?? ""} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 1</label>
                <input name="addressLine1" required defaultValue={address?.addressLine1 ?? ""} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 2</label>
                <input name="addressLine2" defaultValue={address?.addressLine2 ?? ""} className="input" />
              </div>
              <div>
                <label className="label">State / Province</label>
                <input name="state" defaultValue={address?.state ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Postal code</label>
                <input name="postalCode" defaultValue={address?.postalCode ?? ""} className="input" />
              </div>
              <div className="sm:col-span-2">
                <button className="btn-ghost btn-sm">Save address</button>
              </div>
            </form>
          </details>

          {/* Coupon */}
          <section className="border border-line bg-white p-5">
            <p className="label">Coupon code</p>
            {totals.coupon && totals.discount > 0 ? (
              <div className="flex items-center justify-between border border-moss/40 bg-moss/10 px-4 py-3">
                <p className="text-sm text-moss">
                  ✦ {totals.coupon.code} — {formatMoney(totals.discount, totals.currency)} off
                </p>
                <form action={removeCoupon}>
                  <button className="text-[10px] uppercase tracking-wider text-stone-500 underline">Remove</button>
                </form>
              </div>
            ) : totals.coupon ? (
              <p className="border border-rose/40 bg-rose/5 px-4 py-2.5 text-xs text-rose">{totals.coupon.message}</p>
            ) : null}
            <form action={applyCoupon} className="mt-3 flex gap-2">
              <input name="code" placeholder="e.g. WELCOME10" className="input" defaultValue={couponCode ?? ""} />
              <button className="btn-ghost btn-sm shrink-0">Apply</button>
            </form>
          </section>

          {/* Items review */}
          <section className="border border-line bg-white">
            <h2 className="border-b border-line bg-sand/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Review your order ({totals.lines.length})
            </h2>
            <div className="divide-y divide-line">
              {totals.lines.map((line) => (
                <div key={line.itemId} className="flex gap-4 p-5">
                  <div className="h-24 w-18 shrink-0 overflow-hidden border border-line bg-sand">
                    {line.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-[family-name:var(--font-display)] text-lg">{line.name}</p>
                    {line.sku && <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">SKU {line.sku} · Qty {line.quantity}</p>}
                    {line.customizations.length > 0 && (
                      <p className="mt-1 text-xs text-stone-600">
                        {line.customizations.map((c) => `${c.option}: ${c.value}`).join(" · ")}
                      </p>
                    )}
                    {line.measurements && (
                      <p className="mt-1 text-[11px] text-gold-deep">
                        ✓ Measurements provided ({line.measurements.unit})
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{formatMoney(line.lineTotal, totals.currency)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: summary + pay */}
        <aside className="h-fit space-y-4 border border-line bg-white p-6 lg:sticky lg:top-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Order summary</p>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-stone-600">Subtotal</dt><dd>{formatMoney(totals.subtotal, totals.currency)}</dd></div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-moss"><dt>Discount ({totals.coupon?.code})</dt><dd>−{formatMoney(totals.discount, totals.currency)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-stone-600">Shipping ({totals.countryCode})</dt>
              <dd>{totals.shipping ? formatMoney(totals.shipping, totals.currency) : "Free"}</dd>
            </div>
            {totals.taxRateBps > 0 && (
              <div className="flex justify-between"><dt className="text-stone-600">Tax ({(totals.taxRateBps / 100).toFixed(1)}%)</dt><dd>{formatMoney(totals.tax, totals.currency)}</dd></div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt><dd>{formatMoney(totals.total, totals.currency)}</dd>
            </div>
          </dl>

          {/* Terms + pay */}
          <form action={placeOrder} className="space-y-4 border-t border-line pt-4">
            <div>
              <label className="label" htmlFor="note">Note for the atelier (optional)</label>
              <textarea id="note" name="note" rows={2} className="input" placeholder="e.g. slightly loose at the waist…" />
            </div>
            <label className="flex items-start gap-3 text-xs leading-relaxed text-stone-600">
              <input type="checkbox" name="terms" required className="mt-0.5 size-4 shrink-0 accent-black" />
              <span>
                I accept the <Link href="/pages/terms" className="underline">Terms</Link>, <Link href="/pages/privacy" className="underline">Privacy</Link> and{" "}
                <Link href="/pages/returns" className="underline">Returns</Link> policies, and I understand made-to-order
                pieces take 30–45 days to handcraft.
              </span>
            </label>
            <button className="btn-gold w-full">Place order &amp; pay</button>
            <p className="text-center text-[10px] uppercase tracking-[0.14em] text-stone-400">
              Secure test-mode payment · no card data stored
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}
