import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getCartWithItems, getStorefrontContext } from "@/lib/cart";
import { resolveUnitPrice, convertMarkup } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import { updateCartItem, removeCartItem, toggleSaveForLater } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart" };

type ParsedCustomization = { option: string; value: string; additionalPrice: number };
type ParsedMeasurements = { unit: string; fields: { name: string; value: string }[] };

export default async function CartPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/cart");
  if (!user.customerId) redirect("/account");

  const [cart, ctx] = await Promise.all([getCartWithItems(user.customerId), getStorefrontContext()]);
  const savedItems = await prisma.cartItem.findMany({
    where: { cart: { customerId: user.customerId, status: "ACTIVE" }, savedForLater: true },
    include: { product: { include: { media: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const lines =
    cart?.items.map((item) => {
      const variantLabel = item.variant?.values
        .map((v) => v.attributeValue.value)
        .join(" · ");
      const cp = item.product.prices.find((p) => p.countryId === ctx.country.id);
      const { effective } = resolveUnitPrice({
        basePrice: item.product.basePrice,
        salePrice: item.product.salePrice,
        variantPrice: item.variant?.price ?? null,
        variantSalePrice: item.variant?.salePrice ?? null,
        countryPrice: cp?.price ?? null,
        countrySalePrice: cp?.salePrice ?? null,
        currency: ctx.country.currency,
      });
      const customizations: ParsedCustomization[] = item.customizationData
        ? JSON.parse(item.customizationData)
        : [];
      const markup = customizations.reduce((s, c) => s + (c.additionalPrice || 0), 0);
      const unit = effective + convertMarkup(markup, ctx.country.currency, ctx.pkrPerUsd);
      return {
        item,
        variantLabel,
        customizations,
        measurements: (item.measurementData ? JSON.parse(item.measurementData) : null) as ParsedMeasurements | null,
        unitPrice: unit,
        lineTotal: unit * item.quantity,
      };
    }) ?? [];

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = ctx.shipping?.price ?? 0;
  const taxRate = ctx.tax?.rateBps ?? 0;
  const tax = Math.round((subtotal * taxRate) / 10000);
  const total = subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="eyebrow">Almost yours</p>
      <h1 className="section-title mt-2">Shopping Cart</h1>

      {lines.length === 0 ? (
        <div className="mt-8 border border-line bg-white px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl">Your cart is empty</p>
          <p className="mt-2 text-sm text-stone-600">Every piece is made just for you — find the one.</p>
          <Link href="/shop" className="btn-gold mt-8">Shop the collection</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Lines */}
          <div className="divide-y divide-line border border-line bg-white">
            {lines.map(({ item, variantLabel, customizations, measurements, unitPrice, lineTotal }) => {
              const img = item.product.media.find((m) => m.type === "IMAGE");
              return (
                <div key={item.id} className="flex gap-5 p-5">
                  <Link href={`/products/${item.product.slug}`} className="relative block h-32 w-24 shrink-0 overflow-hidden border border-line bg-sand">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={item.product.name} className="h-full w-full object-cover" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/products/${item.product.slug}`} className="font-[family-name:var(--font-display)] text-lg hover:text-gold-deep">
                          {item.product.name}
                        </Link>
                        {variantLabel && (
                          <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-500">{variantLabel}</p>
                        )}
                        {customizations.length > 0 && (
                          <p className="mt-1 text-xs text-stone-600">
                            {customizations.map((c) => `${c.option}: ${c.value}`).join(" · ")}
                          </p>
                        )}
                        {measurements && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-gold-deep">
                              Measurements ({measurements.unit})
                            </summary>
                            <p className="mt-1 text-xs text-stone-600">
                              {measurements.fields.filter((f) => f.value).map((f) => `${f.name}: ${f.value}`).join(" · ") || "—"}
                            </p>
                          </details>
                        )}
                        <p className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-stone-400">
                          Made to order · 30–45 days
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatMoney(lineTotal, ctx.country.currency)}</p>
                        <p className="text-[11px] text-stone-500">{formatMoney(unitPrice, ctx.country.currency)} each</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <form action={updateCartItem} className="flex items-center border border-line">
                        <button name="quantity" value={item.quantity - 1} className="px-3 py-1.5 text-sm hover:text-gold-deep">−</button>
                        <span className="w-9 text-center text-sm">{item.quantity}</span>
                        <button name="quantity" value={item.quantity + 1} className="px-3 py-1.5 text-sm hover:text-gold-deep">+</button>
                        <input type="hidden" name="itemId" value={item.id} />
                      </form>
                      <form action={removeCartItem} className="inline">
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="quantity" value="0" />
                        <button className="text-[11px] uppercase tracking-[0.14em] text-stone-400 underline hover:text-rose">Remove</button>
                      </form>
                      <form action={toggleSaveForLater} className="inline">
                        <input type="hidden" name="itemId" value={item.id} />
                        <button className="text-[11px] uppercase tracking-[0.14em] text-stone-400 underline hover:text-gold-deep">Save for later</button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <aside className="h-fit space-y-4 border border-line bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Order summary</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-stone-600">Subtotal</dt><dd>{formatMoney(subtotal, ctx.country.currency)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-stone-600">Shipping ({ctx.country.code})</dt>
                <dd>{shipping ? formatMoney(shipping, ctx.country.currency) : "Calculated at checkout"}</dd>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone-600">Est. tax ({(taxRate / 100).toFixed(1)}%)</dt>
                  <dd>{formatMoney(tax, ctx.country.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Estimated total</dt><dd>{formatMoney(total, ctx.country.currency)}</dd>
              </div>
            </dl>

            <Link href="/checkout" className="btn-gold w-full">
              Proceed to Checkout
            </Link>
            <p className="text-center text-[10px] uppercase tracking-[0.14em] text-stone-400">
              Secure online payment · no COD
            </p>

            <div className="border-t border-line pt-4 text-[11px] leading-relaxed text-stone-500">
              Coupons are applied at checkout. Handcrafted pieces ship in 30–45 days — your estimated
              delivery date is confirmed by the atelier after payment.
            </div>
          </aside>
        </div>
      )}

      {/* Saved for later */}
      {savedItems.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Saved for later ({savedItems.length})
          </h2>
          <div className="divide-y divide-line border border-line bg-white">
            {savedItems.map((item) => {
              const img = item.product.media.find((m) => m.type === "IMAGE");
              return (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <Link href={`/products/${item.product.slug}`} className="h-16 w-12 shrink-0 overflow-hidden border border-line bg-sand">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={item.product.name} className="h-full w-full object-cover" />
                    )}
                  </Link>
                  <Link href={`/products/${item.product.slug}`} className="flex-1 font-[family-name:var(--font-display)] text-lg hover:text-gold-deep">
                    {item.product.name}
                  </Link>
                  <form action={toggleSaveForLater}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button className="btn-ghost btn-sm">Move to cart</button>
                  </form>
                  <form action={removeCartItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="quantity" value="0" />
                    <button className="text-[11px] uppercase tracking-[0.14em] text-stone-400 underline hover:text-rose">Remove</button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
