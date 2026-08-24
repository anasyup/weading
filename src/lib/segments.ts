// Segment auto-assignment (Enterprise §19 · Solo §28)
// Rules (system segments; custom segments are never overwritten):
//   NEW        — no paid orders yet
//   REPEAT     — 2+ paid orders
//   HIGH_VALUE — LTV ≥ $1,000 (USD-equivalent)
//   VIP        — LTV ≥ $2,500
//   INACTIVE   — has paid orders, but none in the last 180 days
// Highest qualifying tier wins.

import { prisma } from "./db";

const TIERS = ["NEW", "REPEAT", "HIGH_VALUE", "VIP"] as const;

export async function recomputeCustomerSegment(customerId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      segment: true,
      orders: {
        where: { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
        select: { totalAmount: true, currency: true, placedAt: true },
      },
    },
  });
  if (!customer) return "NEW";

  // Custom (non-system) segments are admin-owned — leave them alone
  if (customer.segment && !customer.segment.isSystem) return customer.segment.key;

  const setting = await prisma.systemSetting.findUnique({ where: { key: "currency.pkr_per_usd" } });
  const pkrPerUsd = setting ? parseInt(setting.value, 10) || 280 : 280;

  const now = Date.now();
  const ltv = customer.orders.reduce(
    (s, o) => s + (o.currency === "PKR" ? Math.round(o.totalAmount / pkrPerUsd) : o.totalAmount),
    0
  );
  const orderCount = customer.orders.length;
  const lastOrderAt = customer.orders.reduce((m, o) => Math.max(m, o.placedAt.getTime()), 0);

  let target: string;
  if (orderCount === 0) {
    target = "NEW";
  } else if (now - lastOrderAt > 180 * 24 * 60 * 60 * 1000) {
    target = "INACTIVE";
  } else if (ltv >= 250000) {
    target = "VIP";
  } else if (ltv >= 100000) {
    target = "HIGH_VALUE";
  } else if (orderCount >= 2) {
    target = "REPEAT";
  } else {
    target = TIERS[0];
  }

  if (customer.segment?.key !== target) {
    const segment = await prisma.customerSegment.findUnique({ where: { key: target } });
    if (segment) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { segmentId: segment.id },
      });
    }
  }
  return target;
}

export async function recomputeAllSegments(): Promise<number> {
  const customers = await prisma.customer.findMany({ select: { id: true } });
  let changed = 0;
  for (const c of customers) {
    const before = await prisma.customer.findUnique({
      where: { id: c.id },
      select: { segment: { select: { key: true } } },
    });
    const after = await recomputeCustomerSegment(c.id);
    if (before?.segment?.key !== after) changed++;
  }
  return changed;
}
