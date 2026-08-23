import { prisma } from "./db";
import { getCountry } from "./country";

/** Get (or lazily create) the customer's ACTIVE cart. */
export async function getOrCreateCart(customerId: string) {
  const existing = await prisma.cart.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: { items: true },
  });
  if (existing) return existing;
  return prisma.cart.create({ data: { customerId }, include: { items: true } });
}

export async function getCartWithItems(customerId: string) {
  return prisma.cart.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: {
      items: {
        where: { savedForLater: false },
        orderBy: { createdAt: "asc" },
        include: {
          product: { include: { media: true, prices: true } },
          variant: { include: { values: { include: { attributeValue: true } } } },
        },
      },
    },
  });
}

export async function getCartCount(customerId: string | null): Promise<number> {
  if (!customerId) return 0;
  const cart = await prisma.cart.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: { items: { where: { savedForLater: false }, select: { quantity: true } } },
  });
  if (!cart) return 0;
  return cart.items.reduce((n, i) => n + i.quantity, 0);
}

/** Shipping + tax estimates for a country (flat rule model). */
export async function getShippingAndTax(countryId: string) {
  const now = new Date();
  const [shipping, tax] = await Promise.all([
    prisma.shippingRule.findFirst({ where: { countryId, status: "ACTIVE" } }),
    prisma.taxRule.findFirst({
      where: { countryId, status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);
  return { shipping, tax };
}

export async function getStorefrontContext() {
  const country = await getCountry();
  const { shipping, tax } = await getShippingAndTax(country.id);
  const setting = await prisma.systemSetting.findUnique({ where: { key: "currency.pkr_per_usd" } });
  return {
    country,
    shipping,
    tax,
    pkrPerUsd: setting ? parseInt(setting.value, 10) || 280 : 280,
  };
}
