"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  sanitizeConfig,
  saveDraftConfig,
  publishConfig,
} from "@/lib/homepage-config";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

function parseConfig(json: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid homepage config payload");
  }
  return sanitizeConfig(parsed);
}

export async function saveHomepageDraft(json: string) {
  const admin = await requireAdmin();
  const config = parseConfig(json);
  await saveDraftConfig(config, admin.id);
  await audit({ actor: admin, action: "homepage.draft_saved", entityType: "settings" });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true as const };
}

export async function publishHomepage(json: string) {
  const admin = await requireAdmin();
  const config = parseConfig(json);
  await publishConfig(config, admin.id);
  await audit({ actor: admin, action: "homepage.published", entityType: "settings" });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true as const };
}

/** Discard the draft and copy the LIVE config back into the draft slot. */
export async function resetHomepageDraft() {
  const admin = await requireAdmin();
  const live = await prisma.systemSetting.findUnique({ where: { key: "homepage.live" } });
  const value = live?.value;
  if (value) {
    await prisma.systemSetting.upsert({
      where: { key: "homepage.draft" },
      update: { value, updatedById: admin.id, updatedAt: new Date() },
      create: { key: "homepage.draft", value, category: "homepage", updatedById: admin.id },
    });
  }
  await audit({ actor: admin, action: "homepage.draft_reset", entityType: "settings" });
  revalidatePath("/admin/homepage");
  return { ok: true as const };
}
