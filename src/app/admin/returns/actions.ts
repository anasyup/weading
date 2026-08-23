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

export async function setReturnStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("returnId"));
  const status = String(formData.get("status"));
  const adminNote = String(formData.get("adminNote") ?? "").trim() || null;
  if (!["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"].includes(status)) return;

  const request = await prisma.returnRequest.findUnique({ where: { id } });
  if (!request) return;

  await prisma.returnRequest.update({
    where: { id },
    data: { status, adminNote, resolvedAt: status === "COMPLETED" || status === "REJECTED" ? new Date() : null },
  });

  // Approving a REFUND request → record the refund + mark order refunded
  if (status === "APPROVED" && request.type === "REFUND") {
    const order = await prisma.order.findUnique({ where: { id: request.orderId }, include: { payments: true } });
    if (order && order.paymentStatus !== "REFUNDED") {
      const payment = order.payments.find((p) => p.status === "SUCCESS");
      await prisma.refund.create({
        data: {
          orderId: order.id,
          paymentId: payment?.id,
          amount: order.totalAmount,
          currency: order.currency,
          reason: request.reason,
          status: "PENDING",
          processedById: admin.id,
        },
      });
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PARTIALLY_REFUNDED" } });
    }
  }

  await audit({
    actor: admin,
    action: "return.status_changed",
    entityType: "return_request",
    entityId: id,
    oldValue: { status: request.status },
    newValue: { status, adminNote },
  });
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/orders/${request.orderId}`);
}
