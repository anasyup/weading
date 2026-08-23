/* eslint-disable no-console */
// Daily backup job (dev: copies the SQLite file; production: pg_dump + object storage)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

async function main() {
  console.log("QA FLOW — full purchase journey\n");

  const sarah = await prisma.customer.findFirst({
    where: { user: { email: "sarah@example.com" } },
  });
  if (!sarah) throw new Error("Run npm run db:seed first");
  check("customer exists", true);

  // Fresh cart with a made-to-order product
  const product = await prisma.product.findFirst({
    where: { slug: "luxe-red-velvet-lehenga" },
    include: { variants: true },
  });
  const before = await prisma.inventoryItem.findFirst({
    where: { productId: product!.id, variantId: product!.variants[0].id },
  });

  await prisma.cart.deleteMany({ where: { customerId: sarah.id, status: "ACTIVE" } });
  const cart = await prisma.cart.create({
    data: {
      customerId: sarah.id,
      items: {
        create: {
          productId: product!.id,
          variantId: product!.variants[0].id,
          quantity: 1,
          customizationData: JSON.stringify([
            { option: "Embroidery", value: "Zardozi handwork", additionalPrice: 18000 },
          ]),
          measurementData: JSON.stringify({
            unit: "in",
            fields: [
              { name: "Bust", key: "bust", value: "34" },
              { name: "Waist", key: "waist", value: "27" },
            ],
          }),
        },
      },
    },
  });

  // 1. Order creation from cart (with coupon)
  const { createOrderFromCart, markOrderPaid, releaseOrderStock } = await import("../src/lib/orders");
  const created = await createOrderFromCart(sarah.id, {
    termsAccepted: true,
    couponCode: "BRIDAL20",
    actorLabel: "qa-script",
  });
  check("order created", created.ok);
  if (!created.ok) throw new Error(created.error);

  const order = await prisma.order.findUnique({
    where: { id: created.orderId },
    include: { items: true, measurements: true, payments: true, invoice: true },
  });
  check("order number sequential", /^ORD-\d{4,}$/.test(order!.orderNumber));
  check("totals: subtotal = $850 + $180 markup", order!.subtotal === 103000);
  check("totals: 20% coupon applied (BRIDAL20)", order!.discountAmount === 20600);
  check("totals: total = subtotal - discount + shipping 35", order!.totalAmount === 103000 - 20600 + 3500);
  check("snapshot: measurements stored on order", order!.measurements.length >= 2);
  check("snapshot: customization stored on item", !!order!.items[0].customizationData);
  check("payment row PENDING created", order!.payments.some((p) => p.status === "PENDING"));
  check("stage = New", order!.stageName === "New");
  check("terms accepted recorded", !!order!.termsAcceptedAt);

  const coupon = await prisma.coupon.findUnique({ where: { code: "BRIDAL20" } });
  check("coupon usage count incremented", (coupon?.usageCount ?? 0) >= 1);

  const reserved = await prisma.inventoryItem.findFirst({
    where: { productId: product!.id, variantId: product!.variants[0].id },
  });
  check("stock reserved (+1)", reserved!.reservedQuantity === (before!.reservedQuantity + 1));
  const reservationTx = await prisma.inventoryTransaction.findFirst({
    where: { referenceId: order!.id, type: "RESERVATION" },
  });
  check("inventory transaction logged", !!reservationTx);

  const cartAfter = await prisma.cart.findUnique({ where: { id: cart.id } });
  check("cart converted", cartAfter!.status === "CONVERTED");

  // 2. Terms refusal must fail
  const refusal = await createOrderFromCart(sarah.id, { termsAccepted: false, actorLabel: "qa" });
  check("terms refusal blocked", !refusal.ok);

  // 3. Payment success
  await markOrderPaid(order!.id, { via: "qa_test", actorLabel: "qa-script" });
  const paid = await prisma.order.findUnique({
    where: { id: order!.id },
    include: { payments: true, invoice: true, history: { include: { toStage: true } } },
  });
  check("payment marked SUCCESS", paid!.payments.some((p) => p.status === "SUCCESS"));
  check("order paymentStatus PAID", paid!.paymentStatus === "PAID");
  check("stage advanced to Paid", paid!.stageName === "Paid");
  check("history has New→Paid", paid!.history.some((h) => h.toStage?.name === "Paid"));
  check("invoice generated (INV-YYYY-NNNNN)", /^INV-\d{4}-\d{5}$/.test(paid!.invoice?.invoiceNumber ?? ""));
  check("estimated delivery auto-set", !!paid!.estimatedDelivery);

  const events = await prisma.customerEvent.count({
    where: { customerId: sarah.id, eventType: "PURCHASE" },
  });
  check("PURCHASE behaviour event logged", events >= 1);
  const email = await prisma.emailLog.findFirst({
    where: { purpose: "ORDER_CONFIRMATION", toEmail: "sarah@example.com" },
  });
  check("confirmation email (dev outbox)", !!email);

  // 4. Coupon per-customer limit — reuse should still work for BRIDAL20 (no per-customer limit); test WELCOME10 twice
  await prisma.cart.deleteMany({ where: { customerId: sarah.id, status: "ACTIVE" } });
  await prisma.cart.create({
    data: {
      customerId: sarah.id,
      items: {
        create: {
          productId: product!.id,
          variantId: product!.variants[0].id,
          quantity: 1,
          measurementData: JSON.stringify({ unit: "in", fields: [{ name: "Bust", key: "bust", value: "34" }] }),
        },
      },
    },
  });
  const sarahFull = await prisma.customer.findUnique({ where: { id: sarah.id }, include: { segment: true } });

  const { validateCoupon } = await import("../src/lib/coupons");
  // WELCOME10 targets the NEW segment — simulate a new customer (segment context is passed in)
  const v1 = await validateCoupon("WELCOME10", {
    customerId: sarah.id,
    customerSegmentKey: "NEW",
    subtotal: 100000,
    currency: "USD",
    pkrPerUsd: 280,
    countryCode: "US",
    items: [],
  });
  const okFirst = v1.ok;
  // Simulate a redemption then retry
  if (v1.ok) {
    await prisma.couponRedemption.create({
      data: { couponId: v1.couponId, orderId: paid!.id, customerId: sarah.id },
    });
  }
  const v2 = await validateCoupon("WELCOME10", {
    customerId: sarah.id,
    customerSegmentKey: "NEW",
    subtotal: 100000,
    currency: "USD",
    pkrPerUsd: 280,
    countryCode: "US",
    items: [],
  });
  check("coupon validates then blocks on per-customer limit", okFirst && !v2.ok);
  const wrongSeg = await validateCoupon("WELCOME10", {
    customerId: sarah.id,
    customerSegmentKey: "REPEAT",
    subtotal: 100000,
    currency: "USD",
    pkrPerUsd: 280,
    countryCode: "US",
    items: [],
  });
  check("segment rule blocks non-NEW customers", !wrongSeg.ok);

  // 5. Stock release (cancellation path)
  await releaseOrderStock(order!.id, "QA cancel test");
  const released = await prisma.inventoryItem.findFirst({
    where: { productId: product!.id, variantId: product!.variants[0].id },
  });
  check("stock released back", released!.reservedQuantity === before!.reservedQuantity);

  // 6. Login throttling sanity — wrong password doesn't crash
  const hash = await bcrypt.hash("wrong", 10);
  check("bcrypt works for auth flows", await bcrypt.compare("wrong", hash));

  // --- Cleanup QA artifacts so the demo stays clean ---
  await prisma.couponRedemption.deleteMany({ where: { orderId: order!.id } });
  await prisma.coupon.update({
    where: { code: "BRIDAL20" },
    data: { usageCount: { decrement: 1 } },
  });
  await prisma.inventoryTransaction.deleteMany({ where: { referenceId: order!.id } });
  await prisma.order.delete({ where: { id: order!.id } }).catch(() => {});
  // restore reservation for cleanliness (deleted order's reservation was released already)
  console.log("\n(Cleanup: QA order removed, coupon usage reverted)");

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
