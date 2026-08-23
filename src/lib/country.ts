import { cookies } from "next/headers";
import { prisma } from "./db";
import { SUPPORTED, type CountryCode, type CountryContext } from "./pricing";

export * from "./pricing";

export const COUNTRY_COOKIE = "nb_country";

export async function getCountry(): Promise<CountryContext> {
  const jar = await cookies();
  const code = (jar.get(COUNTRY_COOKIE)?.value ?? "US") as CountryCode;
  const safe = SUPPORTED.includes(code) ? code : "US";
  const country =
    (await prisma.country.findUnique({ where: { code: safe } })) ??
    (await prisma.country.findUnique({ where: { code: "US" } }));
  if (!country) throw new Error("No countries seeded — run npm run db:seed");
  return {
    id: country.id,
    code: country.code as CountryCode,
    name: country.name,
    currency: country.currency,
  };
}
