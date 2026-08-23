"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseMoneyToMinor } from "@/lib/money";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

export async function createCoupon(formData: FormData) {
  const admin = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return;

  const discountType = String(formData.get("discountType") ?? "PERCENT");
  let discountValue: number;
  if (discountType === "PERCENT") {
    const pct = parseFloat(String(formData.get("percentValue") ?? "10")) || 10;
    discountValue = Math.min(Math.max(Math.round(pct * 100), 100), 10000); // 1%–100% in bps
  } else {
    const amount = parseMoneyToMinor(String(formData.get("fixedValue") ?? "0")) ?? 0;
    discountValue = amount;
  }

  const startsAt = formData.get("startsAt") ? new Date(String(formData.get("startsAt"))) : new Date();
  const endsAt = formData.get("endsAt") ? new Date(String(formData.get("endsAt"))) : null;
  const usageLimit = parseInt(String(formData.get("usageLimit")), 10) || null;
  const perCustomerLimit = parseInt(String(formData.get("perCustomerLimit")), 10) || null;
  const minOrderUsd = parseMoneyToMinor(String(formData.get("minOrder") ?? ""));

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) return;

  await prisma.coupon.create({
    data: {
      code,
      description: String(formData.get("description") ?? "").trim() || null,
      discountType,
      discountValue,
      fixedCurrency: discountType === "FIXED" ? "USD" : null,
      startsAt,
      endsAt,
      usageLimit,
      perCustomerLimit,
      rules: minOrderUsd ? { create: { ruleType: "MIN_ORDER", ruleValue: String(minOrderUsd) } } : undefined,
    },
  });
  await audit({ actor: admin, action: "coupon.created", entityType: "coupon", newValue: { code, discountType, discountValue } });
  revalidatePath("/admin/marketing");
}

export async function toggleCoupon(formData: FormData) {
  const admin = await requireAdmin();
  const couponId = String(formData.get("couponId"));
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return;
  const status = coupon.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  await prisma.coupon.update({ where: { id: couponId }, data: { status } });
  await audit({ actor: admin, action: "coupon.status_changed", entityType: "coupon", entityId: couponId, newValue: { status } });
  revalidatePath("/admin/marketing");
}

export async function setSubscriberStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("subscriberId"));
  const status = String(formData.get("status"));
  if (!["SUBSCRIBED", "UNSUBSCRIBED"].includes(status)) return;
  await prisma.newsletterSubscriber.updateMany({ where: { id }, data: { status } });
  await audit({ actor: admin, action: "newsletter.subscriber_status", entityType: "newsletter_subscriber", entityId: id, newValue: { status } });
  revalidatePath("/admin/marketing");
}
