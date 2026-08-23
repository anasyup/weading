"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

export async function setOrderStage(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const stageId = String(formData.get("stageId"));
  const note = String(formData.get("note") ?? "").trim() || null;

  const [order, stage] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId }, include: { stage: true } }),
    prisma.workflowStage.findUnique({ where: { id: stageId } }),
  ]);
  if (!order || !stage) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { stageId: stage.id, stageName: stage.name },
  });
  await prisma.orderWorkflowHistory.create({
    data: { orderId, fromStageId: order.stageId, toStageId: stage.id, changedById: admin.id, note },
  });
  await audit({
    actor: admin,
    action: "order.stage_changed",
    entityType: "order",
    entityId: orderId,
    oldValue: { stage: order.stageName },
    newValue: { stage: stage.name, note },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function setEstimatedDelivery(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : null;
  if (!date || isNaN(date.getTime())) return;

  await prisma.order.update({ where: { id: orderId }, data: { estimatedDelivery: date } });
  await audit({
    actor: admin,
    action: "order.estimated_delivery_set",
    entityType: "order",
    entityId: orderId,
    newValue: { date: dateStr },
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function recordPayment(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status"));
  const transactionId = String(formData.get("transactionId") ?? "").trim() || null;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order || !["PENDING", "PAID", "FAILED", "REFUNDED"].includes(status)) return;

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: status } });

  if (status === "PAID" && !order.payments.some((p) => p.status === "SUCCESS")) {
    const gateway = await prisma.paymentGateway.findFirst({ where: { isDefault: true } });
    await prisma.payment.create({
      data: {
        orderId,
        gatewayId: gateway?.id,
        transactionId,
        amount: order.totalAmount,
        currency: order.currency,
        status: "SUCCESS",
        responseReference: "recorded_by_admin",
      },
    });
    // Sequential invoice on first payment success (D-12)
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    await prisma.invoice.upsert({
      where: { orderId },
      update: {},
      create: {
        orderId,
        invoiceNumber: `INV-${year}-${String(count + 1).padStart(5, "0")}`,
        amount: order.totalAmount,
        currency: order.currency,
      },
    });
  }

  await audit({
    actor: admin,
    action: "order.payment_status_changed",
    entityType: "order",
    entityId: orderId,
    oldValue: { paymentStatus: order.paymentStatus },
    newValue: { paymentStatus: status, transactionId },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function saveOrderNotes(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();

  await prisma.order.update({ where: { id: orderId }, data: { adminNotes } });
  await audit({ actor: admin, action: "order.notes_updated", entityType: "order", entityId: orderId });
  revalidatePath(`/admin/orders/${orderId}`);
}
