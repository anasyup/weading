import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import PrintButton from "@/components/print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice" };

type ParsedCustomization = { option: string; value: string; additionalPrice: number };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/account/orders/${id}/invoice`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      country: true,
      items: true,
      payments: { include: { gateway: true } },
      invoice: true,
    },
  });
  if (!order || (order.customerId !== user.customerId && !user.isAdmin)) notFound();
  if (!order.invoice) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl">Invoice pending</p>
        <p className="mt-2 text-sm text-stone-600">The invoice is issued once payment is confirmed.</p>
        <Link href={`/account/orders/${id}`} className="btn-ghost btn-sm mt-6">Back to order</Link>
      </div>
    );
  }

  const address = JSON.parse(order.shippingAddress) as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Screen toolbar */}
      <div className="mb-6 flex items-center justify-between no-print">
        <Link href={`/account/orders/${id}`} className="text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      {/* Invoice document (print-optimized) */}
      <div className="border border-line bg-white p-10 print:border-0 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-ink pb-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.08em]">NOOR BRIDAL</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-gold-deep">Made-to-order bridal couture</p>
            <p className="mt-3 text-xs text-stone-500">care@noorbridal.test · +92 300 1234567</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Invoice</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">{order.invoice.invoiceNumber}</p>
            <p className="mt-1 text-xs text-stone-500">Order {order.orderNumber}</p>
            <p className="text-xs text-stone-500">
              {order.placedAt.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="mt-6 grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="mb-2 font-semibold uppercase tracking-[0.14em] text-stone-500">Billed to</p>
            <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="mt-1 leading-relaxed text-stone-600">
              {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />
              {address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode ?? ""}<br />
              {order.country.name}
            </p>
            <p className="mt-1 text-stone-500">WhatsApp: {order.customer.whatsappNumber}</p>
          </div>
          <div className="text-right">
            <p className="mb-2 font-semibold uppercase tracking-[0.14em] text-stone-500">Payment</p>
            <p className="font-medium">{order.paymentStatus}</p>
            {order.payments.find((p) => p.status === "SUCCESS") && (
              <p className="mt-1 text-stone-600">
                {order.payments.find((p) => p.status === "SUCCESS")!.gateway?.name ?? "Gateway"}<br />
                Ref: {order.payments.find((p) => p.status === "SUCCESS")!.transactionId}
              </p>
            )}
            <p className="mt-2 text-stone-500">Made to order · 30–45 days</p>
          </div>
        </div>

        {/* Items */}
        <table className="mt-8 w-full border-collapse text-xs">
          <thead>
            <tr className="border-y border-line bg-sand/60 text-left">
              <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Item</th>
              <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">SKU</th>
              <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider">Qty</th>
              <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider">Unit</th>
              <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const customizations: ParsedCustomization[] = item.customizationData
                ? JSON.parse(item.customizationData)
                : [];
              return (
                <tr key={item.id} className="border-b border-line align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium">{item.productName}</p>
                    {customizations.length > 0 && (
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {customizations.map((c) => `${c.option}: ${c.value}`).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] text-stone-500">{item.sku}</td>
                  <td className="px-3 py-3 text-center">{item.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(item.unitPrice, order.currency)}</td>
                  <td className="px-3 py-3 text-right font-medium">{formatMoney(item.lineTotal, order.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 ml-auto w-72 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between"><span className="text-stone-500">Discount {order.couponCode ? `(${order.couponCode})` : ""}</span><span>−{formatMoney(order.discountAmount, order.currency)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-stone-500">Shipping</span><span>{formatMoney(order.shippingAmount, order.currency)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Tax</span><span>{formatMoney(order.taxAmount, order.currency)}</span></div>
          <div className="flex justify-between border-t-2 border-ink pt-2 text-sm font-semibold">
            <span>Total ({order.currency})</span><span>{formatMoney(order.totalAmount, order.currency)}</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-10 border-t border-line pt-4 text-center text-[10px] leading-relaxed text-stone-400">
          Thank you for choosing Noor Bridal. Custom-measurement garments are handcrafted to your provided
          measurements — see our Returns policy. This invoice was generated electronically.
        </p>
      </div>
    </div>
  );
}
