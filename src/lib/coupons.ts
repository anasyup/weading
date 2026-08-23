// Coupon validation engine (Enterprise §21 · Solo §31)
// Pure service — no request context. Server-recomputed at order creation; never trusted from the client.

import { prisma } from "./db";

export type CouponCheckContext = {
  customerId: string;
  customerSegmentKey?: string | null;
  subtotal: number; // minor units, order currency
  currency: string; // USD | PKR
  pkrPerUsd: number;
  countryCode: string; // US | CA | PK
  items: { productId: string; categoryId: string | null }[];
};

export type CouponResult =
  | { ok: true; couponId: string; code: string; discountType: string; discountMinor: number; message: string }
  | { ok: false; message: string };

function toUsd(minor: number, currency: string, pkrPerUsd: number) {
  return currency === "PKR" ? Math.round(minor / pkrPerUsd) : minor;
}

export async function validateCoupon(rawCode: string, ctx: CouponCheckContext): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { rules: true, redemptions: true },
  });

  if (!coupon || coupon.status !== "ACTIVE") {
    return { ok: false, message: "Invalid coupon code." };
  }
  const now = new Date();
  if (coupon.startsAt > now) return { ok: false, message: "This coupon is not active yet." };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, message: "This coupon has expired." };
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }
  if (coupon.perCustomerLimit != null) {
    const mine = coupon.redemptions.filter((r) => r.customerId === ctx.customerId).length;
    if (mine >= coupon.perCustomerLimit) {
      return { ok: false, message: "You have already used this coupon." };
    }
  }

  for (const rule of coupon.rules) {
    switch (rule.ruleType) {
      case "MIN_ORDER": {
        const minUsd = parseInt(rule.ruleValue, 10) || 0;
        if (toUsd(ctx.subtotal, ctx.currency, ctx.pkrPerUsd) < minUsd) {
          return { ok: false, message: `This coupon requires a minimum order of $${(minUsd / 100).toFixed(0)}.` };
        }
        break;
      }
      case "COUNTRY":
        if (rule.ruleValue !== ctx.countryCode) {
          return { ok: false, message: "This coupon is not valid in your country." };
        }
        break;
      case "PRODUCT":
        if (!ctx.items.some((i) => i.productId === rule.ruleValue)) {
          return { ok: false, message: "This coupon doesn't apply to the items in your cart." };
        }
        break;
      case "CATEGORY":
        if (!ctx.items.some((i) => i.categoryId === rule.ruleValue)) {
          return { ok: false, message: "This coupon doesn't apply to the items in your cart." };
        }
        break;
      case "SEGMENT":
        if ((ctx.customerSegmentKey ?? "NEW") !== rule.ruleValue) {
          return { ok: false, message: "This coupon isn't available for your account right now." };
        }
        break;
    }
  }

  // Compute discount in the order currency
  let discountMinor: number;
  if (coupon.discountType === "PERCENT") {
    discountMinor = Math.round((ctx.subtotal * coupon.discountValue) / 10000);
  } else {
    // FIXED: value stored in its fixedCurrency; convert to order currency
    const fixedCurrency = coupon.fixedCurrency ?? "USD";
    if (fixedCurrency === ctx.currency) {
      discountMinor = coupon.discountValue;
    } else if (fixedCurrency === "USD" && ctx.currency === "PKR") {
      discountMinor = coupon.discountValue * ctx.pkrPerUsd;
    } else {
      discountMinor = Math.round(coupon.discountValue / ctx.pkrPerUsd);
    }
  }
  discountMinor = Math.min(discountMinor, ctx.subtotal); // never discount below zero

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountMinor,
    message: `Coupon ${coupon.code} applied.`,
  };
}
