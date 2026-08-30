import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { updateAddress, removeWishlistItem } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  if (!user.customerId) redirect("/");

  const customer = await prisma.customer.findUnique({
    where: { id: user.customerId },
    include: {
      addresses: { include: { country: true } },
      orders: { orderBy: { placedAt: "desc" }, take: 10 },
      wishlist: { include: { items: { include: { product: true } } } },
    },
  });
  if (!customer) redirect("/login");

  const countries = await prisma.country.findMany({ where: { status: "ACTIVE" } });
  const address = customer.addresses[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="eyebrow">Welcome back</p>
      <h1 className="section-title mt-2">Hello, {customer.firstName}</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          {/* Orders */}
          <section id="orders">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">My orders</h2>
            {customer.orders.length === 0 ? (
              <div className="border border-line bg-white px-6 py-10 text-center">
                <p className="text-sm text-stone-600">No orders yet.</p>
                <Link href="/shop" className="btn-ghost btn-sm mt-5">Start shopping</Link>
              </div>
            ) : (
              <div className="overflow-x-auto border border-line bg-white">
                <table className="w-full min-w-[560px]">
                  <thead className="border-b border-line bg-sand/60"><tr>
                    <th className="th">Order</th><th className="th">Date</th><th className="th">Status</th>
                    <th className="th">Payment</th><th className="th">Est. delivery</th><th className="th text-right">Total</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {customer.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-sand/30">
                        <td className="td font-medium">
                          <Link href={`/account/orders/${o.id}`} className="hover:text-gold-deep">{o.orderNumber}</Link>
                        </td>
                        <td className="td text-stone-600">{o.placedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="td"><span className="badge border-line bg-sand">{o.stageName}</span></td>
                        <td className="td text-stone-600">{o.paymentStatus}</td>
                        <td className="td text-stone-600">
                          {o.estimatedDelivery?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "—"}
                        </td>
                        <td className="td text-right font-semibold">{formatMoney(o.totalAmount, o.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-[11px] text-stone-500">
              Click an order number for full tracking, timeline and measurements.
            </p>
          </section>

          {/* Wishlist */}
          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Wishlist</h2>
            {!customer.wishlist || customer.wishlist.items.length === 0 ? (
              <div className="border border-line bg-white px-6 py-10 text-center">
                <p className="text-sm text-stone-600">
                  Your wishlist is empty — tap the heart on any piece you love.
                </p>
                <p className="mt-1 text-[11px] text-stone-400">Wishlist actions arrive in Stage 2 (next session).</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {customer.wishlist.items.map((w) => (
                  <li key={w.id} className="card p-4">
                    <Link href={`/products/${w.product.slug}`} className="block hover:text-gold-deep">
                      {w.product.name}
                    </Link>
                    <form action={removeWishlistItem}>
                      <input type="hidden" name="itemId" value={w.id} />
                      <button className="mt-2 text-[10px] uppercase tracking-wider text-stone-400 underline hover:text-rose">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Profile + address */}
        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Profile</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Name</dt><dd>{customer.firstName} {customer.lastName}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Email</dt><dd>{user.email}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">WhatsApp</dt><dd>{customer.whatsappNumber}</dd></div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Email</dt>
                <dd>{user.emailVerifiedAt ? "✓ Verified" : "Pending"}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-stone-500">
              Measurements are collected per order only — we don&apos;t keep them on your profile.
            </p>
          </div>

          <form action={updateAddress} className="card space-y-4 p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Delivery address</h2>
            <div>
              <label className="label" htmlFor="countryId">Country</label>
              <select id="countryId" name="countryId" defaultValue={address?.countryId ?? "US"} className="input">
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="addressLine1">Address line 1</label>
              <input id="addressLine1" name="addressLine1" required defaultValue={address?.addressLine1 ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="addressLine2">Address line 2</label>
              <input id="addressLine2" name="addressLine2" defaultValue={address?.addressLine2 ?? ""} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="city">City</label>
                <input id="city" name="city" required defaultValue={address?.city ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="state">State / Province</label>
                <input id="state" name="state" defaultValue={address?.state ?? ""} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="postalCode">Postal code</label>
                <input id="postalCode" name="postalCode" defaultValue={address?.postalCode ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" defaultValue={address?.phone ?? customer.whatsappNumber} className="input" />
              </div>
            </div>
            <button className="btn-primary w-full">Save address</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
