import Link from "next/link";
import { prisma } from "@/lib/db";
import ManualOrderForm from "@/components/admin/manual-order-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manual order" };

export default async function NewManualOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [customers, products, countries, shippingRules, taxRules, template] = await Promise.all([
    prisma.customer.findMany({
      include: { user: { select: { email: true } }, addresses: { include: { country: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        prices: true,
        variants: { where: { status: "ACTIVE" }, include: { values: { include: { attributeValue: true } } } },
        customizations: { include: { option: { include: { values: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.country.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.shippingRule.findMany(),
    prisma.taxRule.findMany({ where: { status: "ACTIVE" } }),
    prisma.measurementTemplate.findFirst({ where: { isDefault: true }, include: { fields: true } }),
  ]);

  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      label: v.values.map((x) => x.attributeValue.value).join(" · ") + ` (${v.sku})`,
      priceUsd: v.price,
    }))
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
        ← All orders
      </Link>
      <div className="mt-3 mb-8">
        <p className="eyebrow">Direct sales</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Manual order</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          For customers who contact you on Instagram or WhatsApp — keeps web store and direct sales in one system.
        </p>
      </div>
      {error && <p className="mb-6 border border-rose/40 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}

      <ManualOrderForm
        customers={customers.map((c) => ({
          id: c.id,
          label: `${c.firstName} ${c.lastName} — ${c.user.email} (${c.addresses[0]?.country.code ?? "—"})`,
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          basePrice: p.basePrice,
          salePrice: p.salePrice,
          prices: p.prices.map((x) => ({ countryId: x.countryId, price: x.price, salePrice: x.salePrice })),
          customizations: p.customizations
            .filter((pc) => pc.option.status === "ACTIVE")
            .map((pc) => ({
              optionId: pc.option.id,
              optionName: pc.option.name,
              values: pc.option.values.filter((v) => v.status === "ACTIVE").map((v) => ({ id: v.id, name: v.name, additionalPrice: v.additionalPrice })),
            })),
        }))}
        variants={variants}
        countries={countries.map((c) => ({ id: c.id, code: c.code, name: c.name, currency: c.currency }))}
        measurementFields={(template?.fields ?? []).map((f) => ({ id: f.id, fieldKey: f.fieldKey, fieldName: f.fieldName }))}
        shippingByCountry={Object.fromEntries(shippingRules.map((r) => [countries.find((c) => c.id === r.countryId)?.code ?? "", r.price]))}
        taxBpsByCountry={Object.fromEntries(taxRules.map((r) => [countries.find((c) => c.id === r.countryId)?.code ?? "", r.rateBps]))}
      />
    </div>
  );
}
