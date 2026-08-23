import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, countries] = await Promise.all([
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.country.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Catalog</p>
      <h1 className="mt-2 mb-8 font-[family-name:var(--font-display)] text-3xl">New product</h1>
      <ProductForm
        isNew
        categories={categories}
        countries={countries}
      />
    </div>
  );
}
