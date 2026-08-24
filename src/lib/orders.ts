// Order service — the heart of the commerce flow (Enterprise §14–16 · Solo §22–25, 55)
// Pure service functions: no cookies/request context. Server actions and admin actions call these.
// All money math happens here, server-side; client-side numbers are display-only.

import { prisma } from "./db";
import { resolveUnitPrice, convertMarkup, type CustomizationSelection } from "./pricing";
import { validateCoupon } from "./coupons";
import { sendEmail } from "./email";
import { recomputeCustomerSegment } from "./segments";

export type CartTotals = {
  lines: {
    itemId: string;
    productId: string;
    variantId: string | null;
    name: string;
    sku: string | null;
    image: string | null;
    quantity: number;
    customizations: CustomizationSelection[];
    measurements: { unit: string; fields: { name: string; key: string; value: string }[] } | null;
    unitPrice: number;
    lineTotal: number;
  }[];
  currency: string;
  countryId: string;
  countryCode: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxRateBps: number;
  total: number;
  coupon?: { code: string; message: string } | null;
  missingMeasurements: boolean;
};

/** Compute authoritative cart totals for a customer, based on their delivery address country. */
export async function computeCartTotals(
  customerId: string,
  opts: { couponCode?: string | null } = {}
): Promise<CartTotals | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      segment: true,
      addresses: { include: { country: true }, orderBy: { isDefault: "desc" } },
      carts: {
        where: { status: "ACTIVE" },
        include: {
          items: {
            where: { savedForLater: false },
            orderBy: { createdAt: "asc" },
            include: {
              product: { include: { prices: true, media: true, category: true } },
              variant: { include: { values: { include: { attributeValue: true } } } },
            },
          },
        },
      },
    },
  });
  if (!customer) return null;

  const address = customer.addresses[0];
  if (!address) return null;

  const country = address.country;
  const cart = customer.carts[0];
  if (!cart || cart.items.length === 0) return null;

  const setting = await prisma.systemSetting.findUnique({ where: { key: "currency.pkr_per_usd" } });
  const pkrPerUsd = setting ? parseInt(setting.value, 10) || 280 : 280;

  const shippingRule = await prisma.shippingRule.findFirst({ where: { countryId: country.id, status: "ACTIVE" } });
  const now = new Date();
  const taxRule = await prisma.taxRule.findFirst({
    where: {
      countryId: country.id,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  let missingMeasurements = false;
  const lines: CartTotals["lines"] = cart.items.map((item) => {
    const cp = item.product.prices.find((p) => p.countryId === country.id);
    const { effective } = resolveUnitPrice({
      basePrice: item.product.basePrice,
      salePrice: item.product.salePrice,
      variantPrice: item.variant?.price ?? null,
      variantSalePrice: item.variant?.salePrice ?? null,
      countryPrice: cp?.price ?? null,
      countrySalePrice: cp?.salePrice ?? null,
      currency: country.currency,
    });
    const customizations: CustomizationSelection[] = item.customizationData
      ? JSON.parse(item.customizationData)
      : [];
    const markupUsd = customizations.reduce((s, c) => s + (c.additionalPrice || 0), 0);

    const measurements = item.measurementData ? JSON.parse(item.measurementData) : null;
    if (item.product.productType === "MADE_TO_ORDER") {
      const hasMeasurements =
        measurements?.fields?.some((f: { value: string }) => f.value && f.value.trim() !== "") ?? false;
      if (!hasMeasurements) missingMeasurements = true;
    }

    const image = item.product.media.find((m) => m.type === "IMAGE");
    const unitPrice = effective + convertMarkup(markupUsd, country.currency, pkrPerUsd);

    return {
      itemId: item.id,
      productId: item.product.id,
      variantId: item.variantId,
      name: item.product.name,
      sku: item.variant?.sku ?? null,
      image: image?.url ?? null,
      quantity: item.quantity,
      customizations,
      measurements,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  // Coupon (validated server-side, re-computed here)
  let discount = 0;
  let couponInfo: CartTotals["coupon"] = null;
  if (opts.couponCode) {
    const result = await validateCoupon(opts.couponCode, {
      customerId,
      customerSegmentKey: customer.segment?.key ?? null,
      subtotal,
      currency: country.currency,
      pkrPerUsd,
      countryCode: country.code,
      items: lines.map((l) => ({ productId: l.productId, categoryId: null })),
    });
    if (result.ok) {
      discount = result.discountMinor;
      couponInfo = { code: result.code, message: result.message };
    } else {
      couponInfo = { code: opts.couponCode, message: result.message };
    }
  }

  const shipping = shippingRule?.price ?? 0;
  const taxRateBps = taxRule?.rateBps ?? 0;
  const tax = Math.round(((subtotal - discount) * taxRateBps) / 10000);
  const total = subtotal - discount + shipping + tax;

  return {
    lines,
    currency: country.currency,
    countryId: country.id,
    countryCode: country.code,
    subtotal,
    discount,
    shipping,
    tax,
    taxRateBps,
    total,
    coupon: couponInfo,
    missingMeasurements,
  };
}

/** Next sequential order number: ORD-1001, ORD-1002, … */
export async function nextOrderNumber() {
  const orders = await prisma.order.findMany({ select: { orderNumber: true } });
  const max = orders.reduce((m, o) => {
    const n = parseInt(o.orderNumber.replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 1000);
  return `ORD-${max + 1}`;
}

/** Next sequential invoice number: INV-YYYY-NNNNN (decision D-12). */
export async function nextInvoiceNumber() {
  const count = await prisma.invoice.count();
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Convert the customer's active cart into an order:
 * snapshots, measurements, stock reservations, coupon redemption, PENDING payment.
 */
export async function createOrderFromCart(
  customerId: string,
  opts: {
    termsAccepted: boolean;
    couponCode?: string | null;
    customerNote?: string | null;
    actorLabel?: string;
  }
): Promise<{ ok: true; orderId: string; orderNumber: string } | { ok: false; error: string }> {
  if (!opts.termsAccepted) return { ok: false, error: "Please accept the terms to continue." };

  const totals = await computeCartTotals(customerId, { couponCode: opts.couponCode });
  if (!totals) return { ok: false, error: "Your cart is empty." };
  if (totals.coupon && totals.discount === 0 && opts.couponCode && totals.coupon.code === opts.couponCode) {
    return { ok: false, error: totals.coupon.message };
  }
  if (totals.missingMeasurements) {
    return { ok: false, error: "Measurements are required for made-to-order items." };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { addresses: { orderBy: { isDefault: "desc" }, take: 1 } },
  });
  const address = customer?.addresses[0];
  if (!address) return { ok: false, error: "Please add a delivery address first." };

  const orderNumber = await nextOrderNumber();
  const gateway = await prisma.paymentGateway.findFirst({ where: { isDefault: true } });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      countryId: totals.countryId,
      currency: totals.currency,
      subtotal: totals.subtotal,
      discountAmount: totals.discount,
      couponCode: totals.discount > 0 && totals.coupon ? totals.coupon.code : null,
      shippingAmount: totals.shipping,
      taxAmount: totals.tax,
      totalAmount: totals.total,
      paymentStatus: "PENDING",
      stageName: "New",
      shippingAddress: JSON.stringify({
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      }),
      termsAcceptedAt: new Date(),
      customerNote: opts.customerNote ?? null,
      items: {
        create: totals.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          productName: line.name,
          sku: line.sku ?? "—",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          customizationData: line.customizations.length ? JSON.stringify(line.customizations) : null,
          measurementSnapshot: line.measurements ? JSON.stringify(line.measurements) : null,
        })),
      },
      measurements: {
        create: (totals.lines.flatMap((line) =>
          (line.measurements?.fields ?? [])
            .filter((f) => f.value && f.value.trim() !== "")
            .map((f) => ({ fieldName: f.name, fieldValue: f.value, unit: line.measurements!.unit }))
        )),
      },
      payments: {
        create: {
          gatewayId: gateway?.id,
          amount: totals.total,
          currency: totals.currency,
          status: "PENDING",
        },
      },
    },
  });

  // Set workflow stage New + history
  const newStage = await prisma.workflowStage.findFirst({
    where: { name: "New", status: "ACTIVE" },
  });
  if (newStage) {
    await prisma.order.update({ where: { id: order.id }, data: { stageId: newStage.id } });
    await prisma.orderWorkflowHistory.create({
      data: { orderId: order.id, toStageId: newStage.id, note: "Order received" },
    });
  }

  // Stock reservations (Available = On-hand − Reserved)
  for (const line of totals.lines) {
    const inv = await prisma.inventoryItem.findFirst({
      where: { productId: line.productId, variantId: line.variantId },
    });
    if (inv) {
      await prisma.inventoryItem.update({
        where: { id: inv.id },
        data: { reservedQuantity: { increment: line.quantity } },
      });
      await prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: inv.id,
          type: "RESERVATION",
          quantity: line.quantity,
          reason: `Reserved for ${orderNumber}`,
          referenceType: "ORDER",
          referenceId: order.id,
        },
      });
    }
  }

  // Coupon redemption bookkeeping
  if (totals.discount > 0 && totals.coupon) {
    const coupon = await prisma.coupon.findUnique({ where: { code: totals.coupon.code } });
    if (coupon) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
      await prisma.couponRedemption.create({
        data: { couponId: coupon.id, orderId: order.id, customerId },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { couponId: coupon.id, couponCode: coupon.code },
      });
    }
  }

  // Convert the cart
  await prisma.cart.update({
    where: { id: (await prisma.cart.findFirst({ where: { customerId, status: "ACTIVE" } }))!.id },
    data: { status: "CONVERTED" },
  });

  await prisma.auditLog.create({
    data: {
      actorLabel: opts.actorLabel ?? "customer",
      action: "order.created",
      entityType: "order",
      entityId: order.id,
      newValue: JSON.stringify({ orderNumber, total: totals.total, currency: totals.currency }),
    },
  });

  return { ok: true, orderId: order.id, orderNumber };
}

/** Mark an order paid: payment SUCCESS, stage → Paid, invoice, default estimated delivery, email. */
export async function markOrderPaid(
  orderId: string,
  opts: { transactionId?: string; via?: string; actorId?: string; actorLabel?: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, customer: { include: { user: true } }, payments: true },
  });
  if (!order || order.paymentStatus === "PAID") return order;

  const gateway = await prisma.paymentGateway.findFirst({ where: { isDefault: true } });
  const pending = order.payments.find((p) => p.status === "PENDING");
  const transactionId =
    opts.transactionId ?? `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  if (pending) {
    await prisma.payment.update({
      where: { id: pending.id },
      data: { status: "SUCCESS", transactionId, gatewayId: pending.gatewayId ?? gateway?.id, responseReference: opts.via ?? "mock_gateway" },
    });
  } else {
    await prisma.payment.create({
      data: {
        orderId,
        gatewayId: gateway?.id,
        transactionId,
        amount: order.totalAmount,
        currency: order.currency,
        status: "SUCCESS",
        responseReference: opts.via ?? "mock_gateway",
      },
    });
  }

  // Stage → Paid
  const paidStage = await prisma.workflowStage.findFirst({ where: { name: "Paid", status: "ACTIVE" } });
  const fromStageId = order.stageId;
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      ...(paidStage ? { stageId: paidStage.id, stageName: paidStage.name } : {}),
    },
  });
  if (paidStage) {
    await prisma.orderWorkflowHistory.create({
      data: {
        orderId,
        fromStageId,
        toStageId: paidStage.id,
        changedById: opts.actorId ?? null,
        note: `Payment received (${transactionId})`,
      },
    });
  }

  // Invoice (sequential)
  const invoiceNumber = await nextInvoiceNumber();
  await prisma.invoice.upsert({
    where: { orderId },
    update: {},
    create: { orderId, invoiceNumber, amount: order.totalAmount, currency: order.currency },
  });

  // Default estimated delivery = today + max production days + shipping window
  const maxProdDays = order.items.reduce(
    (m, i) => Math.max(m, i.product.productionDaysMax),
    30
  );
  const shippingRule = await prisma.shippingRule.findFirst({ where: { countryId: order.countryId } });
  const est = new Date();
  est.setDate(est.getDate() + maxProdDays + (shippingRule?.estDaysMax ?? 7));
  await prisma.order.update({
    where: { id: orderId },
    data: { estimatedDelivery: order.estimatedDelivery ?? est },
  });

  // Behaviour + email (dev outbox)
  for (const item of order.items) {
    await prisma.customerEvent
      .create({ data: { customerId: order.customerId, eventType: "PURCHASE", productId: item.productId } })
      .catch(() => {});
  }
  // Segment auto-assignment (New → Repeat/High Value/VIP)
  await recomputeCustomerSegment(order.customerId).catch(() => {});

  await sendEmail({
    to: order.customer.user.email,
    subject: `Order ${order.orderNumber} confirmed — Bridal Dresses`,
    body: `Thank you! Your order ${order.orderNumber} is confirmed. Handcrafting begins now; estimated delivery ${est.toDateString()}. Track it in your account.`,
    purpose: "ORDER_CONFIRMATION",
  }).catch(() => {});

  await prisma.auditLog.create({
    data: {
      actorUserId: opts.actorId ?? null,
      actorLabel: opts.actorLabel ?? "payment_gateway",
      action: "order.payment_success",
      entityType: "order",
      entityId: orderId,
      newValue: JSON.stringify({ transactionId, invoiceNumber }),
    },
  });

  return prisma.order.findUnique({ where: { id: orderId } });
}

/** Release stock reservations (cancellations / failed payments). */
export async function releaseOrderStock(orderId: string, reason = "Order cancelled") {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    const inv = await prisma.inventoryItem.findFirst({
      where: { productId: item.productId, variantId: item.variantId },
    });
    if (inv) {
      await prisma.inventoryItem.update({
        where: { id: inv.id },
        data: { reservedQuantity: { decrement: Math.min(inv.reservedQuantity, item.quantity) } },
      });
      await prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: inv.id,
          type: "RELEASE",
          quantity: -item.quantity,
          reason,
          referenceType: "ORDER",
          referenceId: orderId,
        },
      });
    }
  }
}
