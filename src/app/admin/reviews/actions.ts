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

export async function setReviewStatus(formData: FormData) {
  const admin = await requireAdmin();
  const reviewId = String(formData.get("reviewId"));
  const status = String(formData.get("status"));
  if (!["PENDING", "APPROVED", "REJECTED", "HIDDEN"].includes(status)) return;

  await prisma.review.update({ where: { id: reviewId }, data: { status } });
  await audit({
    actor: admin,
    action: "review.moderated",
    entityType: "review",
    entityId: reviewId,
    newValue: { status },
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  const admin = await requireAdmin();
  const reviewId = String(formData.get("reviewId"));
  await prisma.review.delete({ where: { id: reviewId } });
  await audit({ actor: admin, action: "review.deleted", entityType: "review", entityId: reviewId });
  revalidatePath("/admin/reviews");
}
