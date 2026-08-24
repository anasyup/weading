import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { requestReturn, submitReview } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order tracking" };

const STEP_LABELS = ["New", "Paid", "In Production", "Ready", "Shipped", "Delivered", "Completed"];

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/account/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      payments: { include: { gateway: true } },
      history: { include: { toStage: true }, orderBy: { createdAt: "asc" } },
      invoice: true,
      country: true,
      customer: true,
    },
  });
  if (!order || (order.customerId !== user.customerId && !user.isAdmin)) notFound();

  const hasReviewed = user.customerId
    ? !!(await prisma.review.findFirst({ where: { customerId: user.customerId, orderId: order.id } }))
    : false;
  const address = JSON.parse(order.shippingAddress) as Record<string, string>;
  const currentStep = STEP_LABELS.indexOf(order.stageName);
  const cancelled = ["Cancelled", "Refunded"].includes(order.stageName);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {success && (
        <div className="mb-8 border border-moss/40 bg-moss/10 p-6 text-center">
          <p className="text-3xl">✦</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">Thank you, {order.customer.firstName}!</h1>
          <p className="mt-2 text-sm text-stone-700">
            Order <strong>{order.orderNumber}</strong> is confirmed and payment was received. Handcrafting begins now —
            we&apos;ll have your piece ready in about 30–45 days.
            {order.estimatedDelivery && (
              <> Estimated delivery: <strong>{order.estimatedDelivery.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.</>
            )}
          </p>
          <p className="mt-2 text-xs text-stone-500">A confirmation email has been sent to {user.email}.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Order {order.orderNumber}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Track your order</h1>
          <p className="mt-1 text-xs text-stone-500">
            Placed {order.placedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {order.country.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge border-line bg-sand">{order.stageName}</span>
          <span className={`badge ${order.paymentStatus === "PAID" ? "border-moss/40 bg-moss/10 text-moss" : "border-gold/40 bg-gold/10 text-gold-deep"}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!cancelled && (
        <div className="mt-8 border border-line bg-white p-6">
          <div className="flex items-center">
            {STEP_LABELS.map((label, i) => {
              const done = i <= currentStep;
              return (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${
                      done ? "border-gold bg-gold text-white" : "border-line bg-white text-stone-400"
                    }`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`mt-1.5 hidden text-[9px] font-semibold uppercase tracking-wider sm:block ${done ? "text-ink" : "text-stone-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`mx-1 h-px flex-1 ${i < currentStep ? "bg-gold" : "bg-line"}`} />
                  )}
                </div>
              );
            })}
          </div>
          {order.estimatedDelivery && (
            <p className="mt-5 border-t border-line pt-4 text-center text-sm">
              Estimated delivery:{" "}
              <strong>{order.estimatedDelivery.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong>
            </p>
          )}
        </div>
      )}
      {cancelled && (
        <p className="mt-8 border border-rose/40 bg-rose/5 p-4 text-sm text-rose">
          This order was {order.stageName.toLowerCase()}. {order.paymentStatus === "REFUNDED" ? "The payment has been refunded." : ""}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Items */}
        <section className="border border-line bg-white">
          <h2 className="border-b border-line bg-sand/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Your pieces
          </h2>
          <div className="divide-y divide-line">
            {order.items.map((item) => {
              const customizations = item.customizationData ? JSON.parse(item.customizationData) : [];
              const measurements = item.measurementSnapshot ? JSON.parse(item.measurementSnapshot) : null;
              return (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/products/${item.product.slug}`} className="font-[family-name:var(--font-display)] text-lg hover:text-gold-deep">
                        {item.productName}
                      </Link>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">
                        {item.sku} · Qty {item.quantity}
                      </p>
                      {customizations.length > 0 && (
                        <p className="mt-1 text-xs text-stone-600">
                          {customizations.map((c: { option: string; value: string }) => `${c.option}: ${c.value}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">{formatMoney(item.lineTotal, order.currency)}</p>
                  </div>
                  {measurements && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-gold-deep">
                        Measurements used ({measurements.unit})
                      </summary>
                      <p className="mt-1 text-xs text-stone-600">
                        {measurements.fields.filter((f: { value: string }) => f.value).map((f: { name: string; value: string }) => `${f.name}: ${f.value}`).join(" · ")}
                      </p>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
          <dl className="space-y-1.5 border-t border-line p-5 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-moss"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{formatMoney(order.discountAmount, order.currency)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-stone-500">Shipping</dt><dd>{formatMoney(order.shippingAmount, order.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Tax</dt><dd>{formatMoney(order.taxAmount, order.currency)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.totalAmount, order.currency)}</dd></div>
          </dl>
        </section>

        {/* Side info */}
        <aside className="space-y-6">
          <section className="border border-line bg-white p-5">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Delivery address</h2>
            <p className="text-xs leading-relaxed text-stone-600">
              {order.customer.firstName} {order.customer.lastName}<br />
              {address.addressLine1}{address.addressLine2 ? <><br />{address.addressLine2}</> : null}<br />
              {address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode ?? ""}<br />
              {order.country.name}
            </p>
          </section>
          <section className="border border-line bg-white p-5">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Payment</h2>
            <ul className="space-y-1 text-xs text-stone-600">
              {order.payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.gateway?.name ?? "Gateway"}</span>
                  <span>{p.status} · {formatMoney(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
            {order.invoice && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-stone-500">
                Invoice <strong>{order.invoice.invoiceNumber}</strong> · available from the atelier
              </p>
            )}
          </section>
          <section className="border border-line bg-white p-5">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">History</h2>
            <ol className="space-y-3">
              {order.history.map((h) => (
                <li key={h.id} className="text-xs">
                  <span className="font-semibold">{h.toStage?.name ?? "—"}</span>
                  <span className="block text-stone-400">
                    {h.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} {h.note ? `· ${h.note}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      {/* Review — verified purchase, delivered orders only */}
      {["Delivered", "Completed"].includes(order.stageName) && !hasReviewed && (
        <details className="mt-8 border border-gold/50 bg-white">
          <summary className="cursor-pointer px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
            ★ Write a review
          </summary>
          <form action={submitReview} className="grid gap-3 border-t border-line p-5 sm:grid-cols-2">
            <input type="hidden" name="orderId" value={order.id} />
            <div>
              <label className="label">Rating</label>
              <select name="rating" defaultValue="5" className="input">
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{"★".repeat(r)}{"☆".repeat(5 - r)} ({r})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Title</label>
              <input name="title" placeholder="Loved every detail" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Your review</label>
              <textarea name="body" rows={3} placeholder="Tell other brides about your experience…" className="input" />
            </div>
            <button className="btn-gold btn-sm sm:col-span-2">Submit review</button>
            <p className="text-[11px] text-stone-500 sm:col-span-2">Reviews are published after the atelier approves them.</p>
          </form>
        </details>
      )}

      {/* Return / exchange request — only for delivered or completed orders */}
      {["Delivered", "Completed"].includes(order.stageName) && (
        <details className="mt-8 border border-line bg-white">
          <summary className="cursor-pointer px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Request a return, refund or exchange
          </summary>
          <form action={requestReturn} className="grid gap-3 border-t border-line p-5 sm:grid-cols-2">
            <input type="hidden" name="orderId" value={order.id} />
            <div>
              <label className="label">Type</label>
              <select name="type" className="input">
                <option value="RETURN">Return</option>
                <option value="REFUND">Refund</option>
                <option value="EXCHANGE">Exchange</option>
              </select>
            </div>
            <div>
              <label className="label">Reason</label>
              <input name="reason" required placeholder="Tell us what happened" className="input" />
            </div>
            <button className="btn-ghost btn-sm sm:col-span-2">Submit request</button>
            <p className="text-[11px] text-stone-500 sm:col-span-2">
              Custom-measurement pieces are typically final sale — see our Returns policy. The atelier reviews every request personally.
            </p>
          </form>
        </details>
      )}

      <Link href="/account" className="mt-8 inline-block text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
        ← Back to my account
      </Link>
    </div>
  );
}
