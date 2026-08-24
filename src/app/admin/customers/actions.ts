"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { recomputeAllSegments } from "@/lib/segments";

export async function recalcSegments() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  const changed = await recomputeAllSegments();
  await audit({
    actor: user,
    action: "segments.recalculated",
    entityType: "customer_segment",
    newValue: { changed },
  });
  revalidatePath("/admin/customers");
}
