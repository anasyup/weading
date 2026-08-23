import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { mockPay } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment" };

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/checkout/payment/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true, payments: { include: { gateway: true } }, country: true },
  });
  if (!order || order.customerId !== user.customerId) notFound();
  if (order.paymentStatus === "PAID") redirect(`/account/orders/${order.id}`);

  const gateway = order.payments[0]?.gateway;
  const address = JSON.parse(order.shippingAddress) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Mock gateway chrome */}
      <div className="border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line bg-ink px-6 py-4 text-cream">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg tracking-[0.08em]">
              {gateway?.name ?? "Test Gateway"}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-gold">Secure checkout · sandbox</p>
          </div>
          <span className="badge border-gold/50 bg-transparent text-gold">TEST MODE</span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Amount due</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-4xl">
                {formatMoney(order.totalAmount, order.currency)}
              </p>
              <p className="mt-1 text-xs text-stone-500">Order {order.orderNumber} · {order.country.name}</p>
            </div>
            <p className="text-right text-[11px] leading-relaxed text-stone-500">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}<br />
              Ships to {address.city}
            </p>
          </div>

          {/* Fake card form — nothing is stored (PCI: no card data touches our DB) */}
          <form action={mockPay} className="mt-8 space-y-4">
            <input type="hidden" name="orderId" value={order.id} />
            <div>
              <label className="label" htmlFor="card">Card number</label>
              <input
                id="card"
                className="input font-mono"
                placeholder="4242 4242 4242 4242"
                defaultValue="4242 4242 4242 4242"
                inputMode="numeric"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label" htmlFor="exp">Expiry</label>
                <input id="exp" className="input" placeholder="12/28" defaultValue="12/28" />
              </div>
              <div>
                <label className="label" htmlFor="cvc">CVC</label>
                <input id="cvc" className="input" placeholder="123" defaultValue="123" />
              </div>
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" defaultValue={`${order.customer.firstName} ${order.customer.lastName}`} />
              </div>
            </div>

            <div className="border border-line bg-sand/60 px-4 py-3 text-[11px] leading-relaxed text-stone-600">
              Sandbox gateway: any values succeed. In production this page is replaced by your chosen
              PCI-compliant provider (Stripe / PayFast / Safepay…) behind the same adapter — the checkout
              code doesn&apos;t change.
            </div>

            <button className="btn-gold w-full">
              Pay {formatMoney(order.totalAmount, order.currency)}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-stone-500">
            <Link href="/cart" className="underline">Cancel and return</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
