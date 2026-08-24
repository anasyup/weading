import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { recomputeAllSegments } from "@/lib/segments";

// Daily cron (vercel.json · Vercel sends: Authorization: Bearer $CRON_SECRET):
//   1. Abandoned-cart recovery emails (48h+ idle, deduped, opt-out aware)  — Enterprise §9 · D-09
//   2. Measurement retention purge (order-specific privacy rule)           — Enterprise §8  · D-04
//   3. Segment recalculation (New/Repeat/High Value/VIP/Inactive)          — Enterprise §19
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // 1. Abandoned carts
  const idleSince = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const carts = await prisma.cart.findMany({
    where: { status: "ACTIVE", updatedAt: { lt: idleSince }, items: { some: { savedForLater: false } } },
    include: {
      customer: { include: { user: { select: { email: true } } } },
      items: { where: { savedForLater: false }, include: { product: { select: { name: true } } } },
    },
    take: 50,
  });
  let recoverySent = 0;
  for (const cart of carts) {
    if (new Date(cart.updatedAt).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000) continue; // very old → skip
    const already = await prisma.customerEvent.findFirst({
      where: { customerId: cart.customerId, eventType: "ABANDONED_CART_EMAIL", metadata: { contains: cart.id } },
    });
    if (already) continue;
    const unsubscribed = await prisma.newsletterSubscriber.findFirst({
      where: { email: cart.customer.user.email, status: "UNSUBSCRIBED" },
    });
    if (unsubscribed) continue;

    const names = cart.items.map((i) => i.product.name);
    await sendEmail({
      to: cart.customer.user.email,
      subject: "Your Noor Bridal picks are waiting ✦",
      body: `Hi ${cart.customer.firstName}! ${names.length > 0 ? `Your ${names.join(", ")} ${names.length === 1 ? "is" : "are"} still in your cart. Complete your order: ${base}/cart` : `Complete your order: ${base}/cart`}`,
      purpose: "ABANDONED_CART",
    });
    await prisma.customerEvent.create({
      data: { customerId: cart.customerId, eventType: "ABANDONED_CART_EMAIL", metadata: JSON.stringify({ cartId: cart.id }) },
    });
    recoverySent++;
  }

  // 2. Measurement retention purge
  const retentionSetting = await prisma.systemSetting.findUnique({ where: { key: "measurements.retention_days" } });
  const retentionDays = retentionSetting ? parseInt(retentionSetting.value, 10) || 90 : 90;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const oldOrders = await prisma.order.findMany({
    where: {
      stageName: { in: ["Delivered", "Completed"] },
      estimatedDelivery: { lt: cutoff },
      measurements: { some: {} },
    },
    select: { id: true },
  });
  let purgedOrders = 0;
  for (const o of oldOrders) {
    await prisma.orderMeasurement.deleteMany({ where: { orderId: o.id } });
    await prisma.orderItem.updateMany({ where: { orderId: o.id }, data: { measurementSnapshot: null } });
    purgedOrders++;
  }

  // 3. Segments
  const segmentsChanged = await recomputeAllSegments().catch(() => 0);

  return NextResponse.json({
    ok: true,
    recoverySent,
    measurementPurges: purgedOrders,
    segmentsChanged,
  });
}

export async function GET() {
  return NextResponse.json({ error: "POST only (Vercel cron)" }, { status: 405 });
}
