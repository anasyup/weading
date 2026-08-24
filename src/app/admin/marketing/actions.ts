"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseMoneyToMinor } from "@/lib/money";
import { sendEmail } from "@/lib/email";

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

export async function createCampaign(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.marketingCampaign.create({
    data: {
      name,
      channel: String(formData.get("channel") ?? "EMAIL"),
      startDate: formData.get("startDate") ? new Date(String(formData.get("startDate"))) : new Date(),
      endDate: formData.get("endDate") ? new Date(String(formData.get("endDate"))) : null,
      status: "ACTIVE",
    },
  });
  await audit({ actor: admin, action: "campaign.created", entityType: "marketing_campaign", newValue: { name } });
  revalidatePath("/admin/marketing");
}

export async function toggleCampaign(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("campaignId"));
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!campaign) return;
  const status = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  await prisma.marketingCampaign.update({ where: { id }, data: { status } });
  await audit({ actor: admin, action: "campaign.status_changed", entityType: "marketing_campaign", entityId: id, newValue: { status } });
  revalidatePath("/admin/marketing");
}

// One-click abandoned-cart recovery email (opt-out aware; dedupe via customer events)
export async function sendRecoveryEmail(formData: FormData) {
  const admin = await requireAdmin();
  const cartId = String(formData.get("cartId"));
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      customer: { include: { user: { select: { email: true } }, addresses: { take: 1 } } },
    },
  });
  if (!cart || !cart.customer) return;

  const already = await prisma.customerEvent.findFirst({
    where: { customerId: cart.customerId, eventType: "ABANDONED_CART_EMAIL", metadata: { contains: cart.id } },
  });
  if (already) return;

  const unsubscribed = await prisma.newsletterSubscriber.findFirst({
    where: { email: cart.customer.user.email, status: "UNSUBSCRIBED" },
  });
  if (unsubscribed) return;

  const items = cart.items.filter((i) => !i.savedForLater);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await sendEmail({
    to: cart.customer.user.email,
    subject: "Your Noor Bridal picks are waiting ✦",
    body: `Hi ${cart.customer.firstName}! ${items.length > 0 ? `Your ${items.map((i) => i.product.name).join(", ")} ${items.length === 1 ? "is" : "are"} still in your cart. Made to order in 30–45 days — complete your order here: ${base}/cart` : "Complete your order here: " + base + "/cart"}`,
    purpose: "ABANDONED_CART",
  });
  await prisma.customerEvent.create({
    data: { customerId: cart.customerId, eventType: "ABANDONED_CART_EMAIL", metadata: JSON.stringify({ cartId: cart.id }) },
  });
  await audit({ actor: admin, action: "marketing.recovery_email_sent", entityType: "cart", entityId: cart.id });
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
