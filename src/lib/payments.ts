// Payment service — gateway adapter pattern (Enterprise §30 · Solo §21, 61).
//
//   Checkout → PaymentService → Adapter
//                                 ├── MOCK (dev preview, always succeeds)
//                                 ├── STRIPE (real: hosted Checkout via REST, no SDK)
//                                 └── PAYFAST / SAFEPAY / JAZZCASH (PK — same interface)
//
// The active provider comes from the default PaymentGateway row + env credentials.
// Swapping providers = configuration, never a checkout rewrite.

import crypto from "crypto";
import { prisma } from "./db";

export type CheckoutSession = { url: string; provider: string };

/**
 * Returns the URL the customer should be sent to, to pay for a pending order.
 * Mock → internal sandbox page. Stripe → hosted Checkout session.
 */
export async function getCheckoutUrl(orderId: string): Promise<CheckoutSession> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: { include: { gateway: true } }, country: true },
  });
  if (!order) throw new Error("Order not found");

  const gateway =
    order.payments[0]?.gateway ??
    (await prisma.paymentGateway.findFirst({ where: { isDefault: true } }));
  const provider = (gateway?.provider ?? "MOCK").toUpperCase();

  if (provider === "STRIPE" && process.env.STRIPE_SECRET_KEY) {
    return createStripeSession(order.id, order.orderNumber, order.totalAmount, order.currency);
  }

  // Mock (dev preview) — internal sandbox page
  return { url: `/checkout/payment/${order.id}`, provider: "MOCK" };
}

// ---------------------------------------------------------------------------
// Stripe adapter — plain REST calls (works on edge/serverless, no SDK weight)
// ---------------------------------------------------------------------------

async function createStripeSession(
  orderId: string,
  orderNumber: string,
  amountMinor: number,
  currency: string
): Promise<CheckoutSession> {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/account/orders/${orderId}?success=1&stripe=1`);
  body.set("cancel_url", `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/payment/${orderId}`);
  body.set("client_reference_id", orderId);
  body.set("metadata[orderId]", orderId);
  body.set("metadata[orderNumber]", orderNumber);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", currency.toLowerCase());
  body.set("line_items[0][price_data][unit_amount]", String(amountMinor));
  body.set("line_items[0][price_data][product_data][name]", `Noor Bridal — Order ${orderNumber}`);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Stripe session failed:", err);
    // Fail safe: fall back to mock page so the order stays payable
    return { url: `/checkout/payment/${orderId}`, provider: "STRIPE_FALLBACK" };
  }
  const session = (await res.json()) as { url: string };
  return { url: session.url, provider: "STRIPE" };
}

// ---------------------------------------------------------------------------
// Stripe webhook — HMAC signature verification without the SDK
// ---------------------------------------------------------------------------

export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string])
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
