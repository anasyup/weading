"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

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
