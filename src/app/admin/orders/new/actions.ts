"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { nextOrderNumber, nextInvoiceNumber } from "@/lib/orders";
import { parseMoneyToMinor } from "@/lib/money";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

/**
 * Manual order (Solo §55): for customers who contact the owner directly
 * (Instagram/WhatsApp). Full control over customer, product, customization,
 * measurements, pricing, discount, shipping, tax and payment status.
 */
export async function createManualOrder(formData: FormData) {
  const admin = await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  // --- Customer: existing or quick-create ---
  let customerId = get("customerId");
  if (!customerId || customerId === "NEW") {
    const email = get("newEmail").toLowerCase();
    const firstName = get("newFirstName");
    if (!email || !firstName) redirect("/admin/orders/new?error=" + encodeURIComponent("New customer needs a name and email"));
    const existingUser = await prisma.user.findUnique({ where: { email }, include: { customer: true } });
    if (existingUser?.customer) {
      customerId = existingUser.customer.id;
    } else {
      const country = await prisma.country.findFirst({ where: { code: get("newCountry") || "US" } });
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(Math.random().toString(36).slice(2) + "Aa1!", 10),
          emailVerifiedAt: new Date(),
          customer: {
            create: {
              firstName,
              lastName: get("newLastName") || "—",
              whatsappNumber: get("newWhatsapp") || "—",
              addresses: get("newAddress1")
                ? {
                    create: {
                      countryId: country!.id,
                      addressLine1: get("newAddress1"),
                      city: get("newCity") || "—",
                    },
                  }
                : undefined,
            },
          },
        },
        include: { customer: true },
      });
      customerId = user.customer!.id;
    }
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { addresses: { include: { country: true }, orderBy: { isDefault: "desc" }, take: 1 } },
  });
  if (!customer) redirect("/admin/orders/new?error=" + encodeURIComponent("Customer not found"));

  // --- Country / currency from the chosen country code (address fallback) ---
  const countryCode = get("countryCode") || customer.addresses[0]?.country.code || "US";
  const country = await prisma.country.findUnique({ where: { code: countryCode } });

  // --- Product / variant ---
  const product = await prisma.product.findUnique({
    where: { id: get("productId") },
    include: { prices: true },
  });
  if (!product) redirect("/admin/orders/new?error=" + encodeURIComponent("Choose a product"));

  const setting = await prisma.systemSetting.findUnique({ where: { key: "currency.pkr_per_usd" } });
  const pkrPerUsd = setting ? parseInt(setting.value, 10) || 280 : 280;
  const cp = product.prices.find((p) => p.countryId === country!.id);

  const customizations = JSON.parse(get("customizationData") || "[]") as {
    option: string; value: string; additionalPrice: number;
  }[];
  const markupUsd = customizations.reduce((s, c) => s + (c.additionalPrice || 0), 0);
  const baseUnit =
    (cp ? (cp.salePrice ?? cp.price) : (product.salePrice ?? product.basePrice)) +
    (country!.currency === "PKR" ? Math.round((markupUsd * pkrPerUsd) / 100) * 100 : markupUsd);

  // Price override (default = computed)
  const unitPrice = parseMoneyToMinor(get("unitPrice")) ?? baseUnit;
  const quantity = Math.max(1, parseInt(get("quantity"), 10) || 1);
  const subtotal = unitPrice * quantity;

  const shippingRule = await prisma.shippingRule.findFirst({ where: { countryId: country!.id, status: "ACTIVE" } });
  const taxRule = await prisma.taxRule.findFirst({ where: { countryId: country!.id, status: "ACTIVE" } });
  const shipping = parseMoneyToMinor(get("shipping")) ?? shippingRule?.price ?? 0;
  const discount = parseMoneyToMinor(get("discount")) ?? 0;
  const tax = Math.round(((subtotal - discount) * (taxRule?.rateBps ?? 0)) / 10000);
  const total = subtotal - discount + shipping + tax;

  const paymentStatus = get("paymentStatus") === "PAID" ? "PAID" : "PENDING";
  const measurements = JSON.parse(get("measurementData") || "null");

  // --- Create order ---
  const orderNumber = await nextOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      countryId: country!.id,
      currency: country!.currency,
      subtotal,
      discountAmount: discount,
      shippingAmount: shipping,
      taxAmount: tax,
      totalAmount: total,
      paymentStatus,
      stageName: paymentStatus === "PAID" ? "Paid" : "New",
      isManual: true,
      estimatedDelivery: get("estimatedDelivery") ? new Date(get("estimatedDelivery")) : null,
      shippingAddress: JSON.stringify({
        addressLine1: customer.addresses[0]?.addressLine1 ?? "—",
        addressLine2: customer.addresses[0]?.addressLine2,
        city: customer.addresses[0]?.city ?? "—",
        state: customer.addresses[0]?.state,
        postalCode: customer.addresses[0]?.postalCode,
      }),
      termsAcceptedAt: new Date(),
      customerNote: get("note") || null,
      adminNotes: "Manual order",
      items: {
        create: {
          productId: product.id,
          variantId: get("variantId") || null,
          productName: product.name,
          sku: get("sku") || "MANUAL",
          quantity,
          unitPrice,
          lineTotal: subtotal,
          customizationData: customizations.length ? JSON.stringify(customizations) : null,
          measurementSnapshot: measurements ? JSON.stringify(measurements) : null,
        },
      },
    },
  });

  // Measurements rows
  if (measurements?.fields) {
    for (const f of measurements.fields as { name: string; value: string }[]) {
      if (f.value) {
        await prisma.orderMeasurement.create({
          data: { orderId: order.id, fieldName: f.name, fieldValue: f.value, unit: measurements.unit ?? "in" },
        });
      }
    }
  }

  // Workflow + history
  const stageName = paymentStatus === "PAID" ? "Paid" : "New";
  const stage = await prisma.workflowStage.findFirst({ where: { name: stageName } });
  if (stage) {
    await prisma.order.update({ where: { id: order.id }, data: { stageId: stage.id } });
    await prisma.orderWorkflowHistory.create({
      data: { orderId: order.id, toStageId: stage.id, changedById: admin.id, note: "Manual order created" },
    });
  }

  // Payment + invoice when paid
  if (paymentStatus === "PAID") {
    const gateway = await prisma.paymentGateway.findFirst({ where: { isDefault: true } });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gatewayId: gateway?.id,
        transactionId: get("transactionId") || `MANUAL-${Date.now().toString(36).toUpperCase()}`,
        amount: total,
        currency: country!.currency,
        status: "SUCCESS",
        responseReference: "manual_order",
      },
    });
    await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: await nextInvoiceNumber(),
        amount: total,
        currency: country!.currency,
      },
    });
  }

  // Stock reservation
  const inv = await prisma.inventoryItem.findFirst({
    where: { productId: product.id, variantId: get("variantId") || null },
  });
  if (inv) {
    await prisma.inventoryItem.update({
      where: { id: inv.id },
      data: { reservedQuantity: { increment: quantity } },
    });
    await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: inv.id,
        type: "RESERVATION",
        quantity,
        reason: `Reserved for ${orderNumber} (manual)`,
        referenceType: "ORDER",
        referenceId: order.id,
        createdById: admin.id,
      },
    });
  }

  await audit({
    actor: admin,
    action: "order.manual_created",
    entityType: "order",
    entityId: order.id,
    newValue: { orderNumber, total, currency: country!.currency, paymentStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders/${order.id}`);
}
