"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function adjustStock(formData: FormData) {
  const admin = await getSessionUser();
  if (!admin?.isAdmin) throw new Error("Unauthorized");

  const inventoryItemId = String(formData.get("inventoryItemId"));
  const delta = parseInt(String(formData.get("delta")), 10);
  const reason = String(formData.get("reason") ?? "").trim() || "Manual adjustment";
  if (!inventoryItemId || isNaN(delta) || delta === 0) return;

  const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
  if (!item) return;
  const newQty = Math.max(0, item.stockQuantity + delta);

  await prisma.$transaction([
    prisma.inventoryItem.update({ where: { id: inventoryItemId }, data: { stockQuantity: newQty } }),
    prisma.inventoryTransaction.create({
      data: {
        inventoryItemId,
        type: "ADJUSTMENT",
        quantity: delta,
        reason,
        referenceType: "MANUAL",
        createdById: admin.id,
      },
    }),
  ]);

  await audit({
    actor: admin,
    action: "inventory.adjusted",
    entityType: "inventory_item",
    entityId: inventoryItemId,
    oldValue: { stockQuantity: item.stockQuantity },
    newValue: { stockQuantity: newQty, reason },
  });
  revalidatePath("/admin/inventory");
}

export async function setThreshold(formData: FormData) {
  const admin = await getSessionUser();
  if (!admin?.isAdmin) throw new Error("Unauthorized");
  const inventoryItemId = String(formData.get("inventoryItemId"));
  const threshold = Math.max(0, parseInt(String(formData.get("threshold")), 10) || 0);
  await prisma.inventoryItem.update({ where: { id: inventoryItemId }, data: { lowStockThreshold: threshold } });
  await audit({
    actor: admin,
    action: "inventory.threshold_set",
    entityType: "inventory_item",
    entityId: inventoryItemId,
    newValue: { threshold },
  });
  revalidatePath("/admin/inventory");
}
