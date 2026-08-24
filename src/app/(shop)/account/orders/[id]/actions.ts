"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function submitReview(formData: FormData) {
  const user = await getSessionUser();
  const orderId = String(formData.get("orderId"));
  const rating = Math.min(5, Math.max(1, parseInt(String(formData.get("rating")), 10) || 5));
  const title = String(formData.get("title") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim() || null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { productId: true } } },
  });
  if (!order || order.customerId !== user?.customerId) return;
  if (!["Delivered", "Completed"].includes(order.stageName)) return;

  // One review per product per customer, verified purchase
  for (const item of order.items) {
    const existing = await prisma.review.findFirst({
      where: { customerId: user.customerId!, productId: item.productId, orderId },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          customerId: user.customerId!,
          productId: item.productId,
          orderId,
          rating,
          title,
          body,
          status: "PENDING",
        },
      });
    }
  }
  await audit({ actor: user, action: "review.submitted", entityType: "order", entityId: orderId, newValue: { rating } });
  revalidatePath(`/account/orders/${orderId}`);
}

export async function requestReturn(formData: FormData) {
  const user = await getSessionUser();
  const orderId = String(formData.get("orderId"));
  const type = String(formData.get("type"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!["RETURN", "REFUND", "EXCHANGE"].includes(type) || !reason) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== user?.customerId) return;

  await prisma.returnRequest.create({
    data: { orderId, customerId: user.customerId!, type, reason },
  });
  await audit({
    actor: user,
    action: "return.requested",
    entityType: "order",
    entityId: orderId,
    newValue: { type, reason },
  });
  revalidatePath(`/account/orders/${orderId}`);
}
