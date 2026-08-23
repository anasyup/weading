"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseMoneyToMinor } from "@/lib/money";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export async function saveProduct(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const data = {
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    description: String(formData.get("description") ?? "").trim(),
    categoryId: String(formData.get("categoryId") ?? "") || null,
    productType: String(formData.get("productType") ?? "MADE_TO_ORDER"),
    productionDaysMin: parseInt(String(formData.get("productionDaysMin")), 10) || 30,
    productionDaysMax: parseInt(String(formData.get("productionDaysMax")), 10) || 45,
    basePrice: parseMoneyToMinor(String(formData.get("basePrice"))) ?? 0,
    salePrice: parseMoneyToMinor(String(formData.get("salePrice"))),
    sizeChart: String(formData.get("sizeChart") ?? "").trim() || null,
    careInstructions: String(formData.get("careInstructions") ?? "").trim() || null,
    isFeatured: formData.get("isFeatured") === "on",
    status: String(formData.get("status") ?? "DRAFT"),
  };

  // Country availability
  const countryIds = formData.getAll("countries").map(String).filter(Boolean);
  const countries = await prisma.country.findMany({ where: { id: { in: countryIds } } });

  // PK price override
  const pkPrice = parseMoneyToMinor(String(formData.get("pkPrice")));
  const pkSale = parseMoneyToMinor(String(formData.get("pkSalePrice")));
  const pk = await prisma.country.findUnique({ where: { code: "PK" } });

  let productId = id;

  if (id) {
    const before = await prisma.product.findUnique({ where: { id } });
    await prisma.product.update({ where: { id }, data });
    await prisma.productCountry.deleteMany({ where: { productId: id } });
    if (countries.length) {
      await prisma.productCountry.createMany({
        data: countries.map((c) => ({ productId: id, countryId: c.id })),
      });
    }
    if (pk && pkPrice != null) {
      await prisma.productPrice.upsert({
        where: { productId_countryId: { productId: id, countryId: pk.id } },
        update: { price: pkPrice, salePrice: pkSale },
        create: { productId: id, countryId: pk.id, price: pkPrice, salePrice: pkSale },
      });
    }
    await audit({
      actor: admin,
      action: "product.updated",
      entityType: "product",
      entityId: id,
      oldValue: { basePrice: before?.basePrice, status: before?.status, name: before?.name },
      newValue: { basePrice: data.basePrice, status: data.status, name: data.name },
    });
  } else {
    const product = await prisma.product.create({
      data: {
        ...data,
        countries: countries.length
          ? { create: countries.map((c) => ({ countryId: c.id })) }
          : undefined,
      },
    });
    productId = product.id;

    // Auto-generate variants from the Size attribute (full matrix builder arrives in Stage 4)
    const sizeAttr = await prisma.attribute.findFirst({
      where: { name: "Size" },
      include: { values: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } } },
    });
    if (sizeAttr && formData.get("generateVariants") === "on") {
      await prisma.productAttribute.create({
        data: { productId, attributeId: sizeAttr.id },
      }).catch(() => {});
      let n = 1;
      for (const size of sizeAttr.values) {
        const variant = await prisma.productVariant.create({
          data: {
            productId,
            sku: `NB-${slugify(name).slice(0, 12).toUpperCase()}-${size.value.toUpperCase()}-${n}`,
            status: "ACTIVE",
          },
        });
        await prisma.variantValue.create({
          data: {
            variantId: variant.id,
            attributeId: sizeAttr.id,
            attributeValueId: size.id,
          },
        });
        await prisma.inventoryItem.create({
          data: {
            productId,
            variantId: variant.id,
            stockQuantity: parseInt(String(formData.get("initialStock")), 10) || 0,
            lowStockThreshold: 3,
          },
        });
        n++;
      }
    }

    // First image by URL (media manager expands in Stage 4)
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    if (imageUrl) {
      await prisma.productMedia.create({
        data: { productId, url: imageUrl, altText: name, type: "IMAGE" },
      });
    }

    if (pk && pkPrice != null) {
      await prisma.productPrice.create({
        data: { productId, countryId: pk.id, price: pkPrice, salePrice: pkSale },
      }).catch(() => {});
    }

    await audit({
      actor: admin,
      action: "product.created",
      entityType: "product",
      entityId: productId,
      newValue: { name, status: data.status },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function addMedia(formData: FormData) {
  const admin = await requireAdmin();
  const productId = String(formData.get("productId"));
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return;
  await prisma.productMedia.create({
    data: { productId, url, type: url.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE" },
  });
  await audit({ actor: admin, action: "product.media_added", entityType: "product", entityId: productId, newValue: { url } });
  revalidatePath(`/admin/products/${productId}`);
}

export async function removeMedia(formData: FormData) {
  await requireAdmin();
  const mediaId = String(formData.get("mediaId"));
  const productId = String(formData.get("productId"));
  await prisma.productMedia.deleteMany({ where: { id: mediaId, productId } });
  revalidatePath(`/admin/products/${productId}`);
}

export async function setProductStatus(formData: FormData) {
  const admin = await requireAdmin();
  const productId = String(formData.get("productId"));
  const status = String(formData.get("status"));
  await prisma.product.update({ where: { id: productId }, data: { status } });
  await audit({
    actor: admin,
    action: "product.status_changed",
    entityType: "product",
    entityId: productId,
    newValue: { status },
  });
  revalidatePath("/admin/products");
}
