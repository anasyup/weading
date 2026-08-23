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

export async function addExpense(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const amount = parseMoneyToMinor(String(formData.get("amount") ?? ""));
  if (!title || !amount) return;
  await prisma.expense.create({
    data: {
      title,
      amount,
      currency: String(formData.get("currency") ?? "USD"),
      category: String(formData.get("category") ?? "OTHER"),
      note: String(formData.get("note") ?? "").trim() || null,
      incurredAt: formData.get("incurredAt") ? new Date(String(formData.get("incurredAt"))) : new Date(),
      createdById: admin.id,
    },
  });
  await audit({ actor: admin, action: "expense.added", entityType: "expense", newValue: { title, amount } });
  revalidatePath("/admin/finance");
}

export async function deleteExpense(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("expenseId"));
  await prisma.expense.deleteMany({ where: { id } });
  await audit({ actor: admin, action: "expense.deleted", entityType: "expense", entityId: id });
  revalidatePath("/admin/finance");
}

export async function processRefund(formData: FormData) {
  const admin = await requireAdmin();
  const refundId = String(formData.get("refundId"));
  const refund = await prisma.refund.findUnique({ where: { id: refundId } });
  if (!refund || refund.status === "PROCESSED") return;

  await prisma.refund.update({
    where: { id: refundId },
    data: { status: "PROCESSED", processedById: admin.id, processedAt: new Date() },
  });
  await prisma.order.update({
    where: { id: refund.orderId },
    data: { paymentStatus: "REFUNDED" },
  });
  await audit({
    actor: admin,
    action: "refund.processed",
    entityType: "refund",
    entityId: refundId,
    newValue: { amount: refund.amount, currency: refund.currency },
  });
  revalidatePath("/admin/finance");
  revalidatePath(`/admin/orders/${refund.orderId}`);
}
