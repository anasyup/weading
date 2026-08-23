"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { setSetting } from "@/lib/settings";
import { parseMoneyToMinor } from "@/lib/money";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

export async function saveShipping(formData: FormData) {
  const admin = await requireAdmin();
  const countries = await prisma.country.findMany();
  for (const country of countries) {
    const field = `shipping_${country.code}`;
    const raw = String(formData.get(field) ?? "").trim();
    if (!raw) continue;
    const price = parseMoneyToMinor(raw);
    if (price == null) continue;
    const daysMin = parseInt(String(formData.get(`daysMin_${country.code}`)), 10) || 5;
    const daysMax = parseInt(String(formData.get(`daysMax_${country.code}`)), 10) || 10;
    await prisma.shippingRule.upsert({
      where: { countryId: country.id },
      update: { price, estDaysMin: daysMin, estDaysMax: daysMax },
      create: { countryId: country.id, name: `${country.name} flat rate`, price, estDaysMin: daysMin, estDaysMax: daysMax },
    });
  }
  await audit({ actor: admin, action: "settings.shipping_updated", entityType: "settings" });
  revalidatePath("/admin/settings");
}

export async function saveTax(formData: FormData) {
  const admin = await requireAdmin();
  const countries = await prisma.country.findMany();
  for (const country of countries) {
    const field = `tax_${country.code}`;
    const raw = String(formData.get(field) ?? "").trim();
    if (raw === "") continue;
    const percent = parseFloat(raw);
    if (isNaN(percent) || percent < 0 || percent > 100) continue;
    await prisma.taxRule.updateMany({
      where: { countryId: country.id, status: "ACTIVE" },
      data: { rateBps: Math.round(percent * 100) },
    });
  }
  await audit({ actor: admin, action: "settings.tax_updated", entityType: "settings" });
  revalidatePath("/admin/settings");
}

export async function saveGeneral(formData: FormData) {
  const admin = await requireAdmin();
  const entries: [string, string, string][] = [
    ["store.name", String(formData.get("storeName") ?? "").trim(), "GENERAL"],
    ["support.email", String(formData.get("supportEmail") ?? "").trim(), "GENERAL"],
    ["support.whatsapp", String(formData.get("supportWhatsapp") ?? "").trim(), "GENERAL"],
    ["currency.pkr_per_usd", String(parseInt(String(formData.get("pkrRate")), 10) || 280), "COUNTRY"],
    ["production.default_min_days", String(parseInt(String(formData.get("prodMin")), 10) || 30), "GENERAL"],
    ["production.default_max_days", String(parseInt(String(formData.get("prodMax")), 10) || 45), "GENERAL"],
    ["measurements.retention_days", String(parseInt(String(formData.get("retention")), 10) || 90), "SECURITY"],
  ];
  for (const [key, value, category] of entries) {
    if (value) await setSetting(key, value, category, admin.id);
  }
  await audit({ actor: admin, action: "settings.general_updated", entityType: "settings" });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
