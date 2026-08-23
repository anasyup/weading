import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/payments";
import { markOrderPaid } from "@/lib/orders";

// Stripe webhook: verifies the signature manually (no SDK) and marks orders paid
// when checkout.session.completed arrives. Configure the webhook endpoint as
// {APP_URL}/api/payments/webhook with event "checkout.session.completed".
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!secret || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: { metadata?: { orderId?: string }; payment_status?: string } } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const orderId = event.data.object.metadata?.orderId;
    if (orderId) {
      await markOrderPaid(orderId, { via: "stripe_webhook", actorLabel: "stripe" });
    }
  }

  return NextResponse.json({ received: true });
}

// Health probe
export async function GET() {
  const gateway = await prisma.paymentGateway.findFirst({ where: { isDefault: true } });
  return NextResponse.json({
    provider: gateway?.provider ?? "MOCK",
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}
