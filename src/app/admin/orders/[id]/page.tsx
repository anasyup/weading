import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { setOrderStage, setEstimatedDelivery, recordPayment, saveOrderNotes } from "../actions";

export const dynamic = "force-dynamic";

type ParsedCustomization = { option: string; value: string; additionalPrice: number };
type ParsedMeasurements = { unit: string; fields: { name: string; key: string; value: string }[] };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true, addresses: { include: { country: true } } } },
      country: true,
      items: { include: { product: true } },
      measurements: { orderBy: { id: "asc" } },
      payments: { include: { gateway: true } },
      history: {
        include: { fromStage: true, toStage: true },
        orderBy: { createdAt: "asc" },
      },
      invoice: true,
      coupon: true,
    },
  });
  if (!order) notFound();

  const stages = await prisma.workflowStage.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });

  const address = JSON.parse(order.shippingAddress) as Record<string, string>;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-stone-500">
            Placed {order.placedAt.toLocaleString("en-US")} · {order.isManual ? "Manual order" : "Website order"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge border-line bg-sand">{order.stageName}</span>
          <span className={`badge ${order.paymentStatus === "PAID" ? "border-moss/40 bg-moss/10 text-moss" : "border-gold/40 bg-gold/10 text-gold-deep"}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Items */}
          <section className="border border-line bg-white">
            <h2 className="border-b border-line bg-sand/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Items
            </h2>
            <div className="divide-y divide-line">
              {order.items.map((item) => {
                const customizations: ParsedCustomization[] = item.customizationData
                  ? JSON.parse(item.customizationData)
                  : [];
                const measurements = item.measurementSnapshot
                  ? (JSON.parse(item.measurementSnapshot) as ParsedMeasurements)
                  : null;
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-gold-deep">
                          {item.product.productType === "MADE_TO_ORDER" ? "✦ " : ""}{item.productName}
                        </Link>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                          SKU {item.sku} · Qty {item.quantity}
                        </p>
                        {customizations.length > 0 && (
                          <ul className="mt-2 space-y-0.5 text-xs text-stone-600">
                            {customizations.map((c) => (
                              <li key={c.option}>
                                {c.option}: <strong className="font-medium">{c.value}</strong>
                                {c.additionalPrice > 0 && (
                                  <span className="text-stone-400"> (+{formatMoney(c.additionalPrice, "USD")})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">{formatMoney(item.lineTotal, order.currency)}</p>
                        <p className="text-[11px] text-stone-500">{formatMoney(item.unitPrice, order.currency)} each</p>
                      </div>
                    </div>
                    {measurements && (
                      <div className="mt-3 border border-gold/40 bg-sand/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
                          Measurements ({measurements.unit}) — order-specific
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {measurements.fields.filter((f) => f.value).map((f) => (
                            <div key={f.key}>
                              <p className="text-[10px] uppercase tracking-wider text-stone-400">{f.name}</p>
                              <p className="text-sm font-medium">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <dl className="space-y-1.5 border-t border-line p-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-stone-500">Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{formatMoney(order.discountAmount, order.currency)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-stone-500">Shipping</dt><dd>{formatMoney(order.shippingAmount, order.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Tax</dt><dd>{formatMoney(order.taxAmount, order.currency)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.totalAmount, order.currency)}</dd></div>
            </dl>
          </section>

          {/* Timeline */}
          <section className="border border-line bg-white">
            <h2 className="border-b border-line bg-sand/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Production timeline
            </h2>
            <ol className="space-y-0 p-4">
              {order.history.map((h, i) => (
                <li key={h.id} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${i === order.history.length - 1 ? "bg-gold" : "bg-stone-300"}`} />
                    {i < order.history.length - 1 && <span className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium">
                      {h.fromStage?.name ?? "Order received"} → <strong>{h.toStage?.name ?? "—"}</strong>
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {h.createdAt.toLocaleString("en-US")}{h.note ? ` · ${h.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
              {order.history.length === 0 && <p className="text-sm text-stone-500">No history yet.</p>}
            </ol>
          </section>

          {/* Notes */}
          <section className="border border-line bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Internal notes</h2>
            <form action={saveOrderNotes} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea name="adminNotes" rows={3} defaultValue={order.adminNotes ?? ""} className="input" placeholder="Fabric ordered, tailor notes, customer requests…" />
              <button className="btn-primary btn-sm">Save notes</button>
            </form>
          </section>
        </div>

        {/* Sidebar actions */}
        <aside className="space-y-6">
          {/* Customer */}
          <section className="border border-line bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Customer</h2>
            <p className="text-sm font-medium">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="mt-1 text-xs text-stone-500">{order.customer.user.email}</p>
            <p className="text-xs text-stone-500">WhatsApp: {order.customer.whatsappNumber}</p>
            <div className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-stone-600">
              <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
              <p>{address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode ?? ""}</p>
              <p>{order.country.name}</p>
            </div>
          </section>

          {/* Stage */}
          <section className="border border-line bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Update stage</h2>
            <form action={setOrderStage} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="stageId" defaultValue={order.stageId ?? stages[0]?.id} className="input">
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.isSystem ? " (system)" : ""}</option>
                ))}
              </select>
              <input name="note" placeholder="Note (optional)" className="input" />
              <button className="btn-primary btn-sm w-full">Apply stage</button>
            </form>
          </section>

          {/* Estimated delivery */}
          <section className="border border-line bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Estimated delivery</h2>
            <form action={setEstimatedDelivery} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input
                type="date"
                name="date"
                defaultValue={order.estimatedDelivery ? order.estimatedDelivery.toISOString().slice(0, 10) : ""}
                className="input"
              />
              <button className="btn-primary btn-sm w-full">Set date</button>
            </form>
          </section>

          {/* Payment */}
          <section className="border border-line bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Payment</h2>
            {order.payments.length > 0 && (
              <ul className="mb-3 space-y-1.5 text-xs text-stone-600">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.gateway?.name ?? p.transactionId ?? "Payment"}</span>
                    <span>{p.status} · {formatMoney(p.amount, p.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
            {order.invoice && (
              <p className="mb-3 text-xs text-stone-500">
                Invoice: <strong>{order.invoice.invoiceNumber}</strong>{" "}
                <Link href={`/account/orders/${order.id}/invoice`} className="text-gold-deep underline">View / Print ↗</Link>
              </p>
            )}
            <form action={recordPayment} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="status" defaultValue={order.paymentStatus} className="input">
                {["PENDING", "PAID", "FAILED", "REFUNDED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input name="transactionId" placeholder="Transaction / reference ID" className="input" />
              <button className="btn-primary btn-sm w-full">Record payment</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
