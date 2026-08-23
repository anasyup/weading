import { prisma } from "./db";

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(
  key: string,
  value: string,
  category: string,
  updatedById?: string
) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedById, updatedAt: new Date() },
    create: { key, value, category, updatedById },
  });
}

export async function getStoreName(): Promise<string> {
  return (await getSetting("store.name")) ?? "Noor Bridal";
}
