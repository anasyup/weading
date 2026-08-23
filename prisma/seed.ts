/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SIZE_CHART = `<thead><tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hips (in)</th></tr></thead>
<tbody>
<tr><td>XS</td><td>31–32</td><td>24–25</td><td>34–35</td></tr>
<tr><td>S</td><td>33–34</td><td>26–27</td><td>36–37</td></tr>
<tr><td>M</td><td>35–36</td><td>28–29</td><td>38–39</td></tr>
<tr><td>L</td><td>37–38</td><td>30–31</td><td>40–41</td></tr>
<tr><td>XL</td><td>39–41</td><td>32–34</td><td>42–44</td></tr>
</tbody>`;

const CARE = `Professional dry clean only. Store in the garment bag provided, away from direct sunlight. Steam lightly before wearing — never iron directly over embroidery.`;

const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const daysAhead = (n: number) => daysAgo(-n);

async function main() {
  console.log("Seeding Noor Bridal platform…");

  // ------------------------------------------------------------------
  // Countries
  // ------------------------------------------------------------------
  const us = await prisma.country.upsert({
    where: { code: "US" },
    update: {},
    create: { code: "US", name: "United States", currency: "USD", sortOrder: 1 },
  });
  const ca = await prisma.country.upsert({
    where: { code: "CA" },
    update: {},
    create: { code: "CA", name: "Canada", currency: "USD", sortOrder: 2 },
  });
  const pk = await prisma.country.upsert({
    where: { code: "PK" },
    update: {},
    create: { code: "PK", name: "Pakistan", currency: "PKR", sortOrder: 3 },
  });
  const countries = [us, ca, pk];

  // ------------------------------------------------------------------
  // Roles & permissions (data-driven; launch uses SUPER_ADMIN only)
  // ------------------------------------------------------------------
  const superAdminRole = await prisma.role.upsert({
    where: { key: "SUPER_ADMIN" },
    update: {},
    create: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full platform access" },
  });
  const customerRole = await prisma.role.upsert({
    where: { key: "CUSTOMER" },
    update: {},
    create: { key: "CUSTOMER", name: "Customer", description: "Storefront account" },
  });
  const perms = ["products.manage", "orders.manage", "inventory.manage", "customers.manage", "settings.manage", "cms.manage", "finance.manage"];
  for (const key of perms) {
    const p = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, name: key.replace(".", " ") },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: p.id },
    });
  }

  // ------------------------------------------------------------------
  // Segments, location, settings
  // ------------------------------------------------------------------
  const segments = {} as Record<string, { id: string }>;
  for (const [key, name] of [
    ["NEW", "New customers"],
    ["REPEAT", "Repeat customers"],
    ["VIP", "VIP"],
    ["HIGH_VALUE", "High value"],
    ["INACTIVE", "Inactive"],
  ] as const) {
    const s = await prisma.customerSegment.upsert({
      where: { key },
      update: {},
      create: { key, name, isSystem: true },
    });
    segments[key] = s;
  }

  const location = await prisma.location.create({ data: { name: "Central Atelier", type: "CENTRAL" } });

  const settings: [string, string, string][] = [
    ["store.name", "Noor Bridal", "GENERAL"],
    ["support.email", "care@noorbridal.test", "GENERAL"],
    ["support.whatsapp", "+92 300 1234567", "GENERAL"],
    ["currency.pkr_per_usd", "280", "COUNTRY"],
    ["production.default_min_days", "30", "GENERAL"],
    ["production.default_max_days", "45", "GENERAL"],
    ["measurements.retention_days", "90", "SECURITY"],
  ];
  for (const [key, value, category] of settings) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value, category } });
  }

  // ------------------------------------------------------------------
  // Shipping & tax & payment gateway
  // ------------------------------------------------------------------
  await prisma.shippingRule.upsert({
    where: { countryId: us.id },
    update: {},
    create: { countryId: us.id, name: "USA flat rate", price: 3500, estDaysMin: 5, estDaysMax: 10 },
  });
  await prisma.shippingRule.upsert({
    where: { countryId: ca.id },
    update: {},
    create: { countryId: ca.id, name: "Canada flat rate", price: 4500, estDaysMin: 7, estDaysMax: 12 },
  });
  await prisma.shippingRule.upsert({
    where: { countryId: pk.id },
    update: {},
    create: { countryId: pk.id, name: "Pakistan flat rate", price: 50000, estDaysMin: 2, estDaysMax: 5 },
  });

  await prisma.taxRule.create({ data: { countryId: us.id, name: "US sales tax (placeholder)", rateBps: 0 } });
  await prisma.taxRule.create({ data: { countryId: ca.id, name: "Canadian GST (placeholder)", rateBps: 0 } });
  await prisma.taxRule.create({ data: { countryId: pk.id, name: "Pakistan sales tax (placeholder)", rateBps: 500 } });

  await prisma.paymentGateway.create({
    data: {
      name: "Test Gateway (Sandbox)",
      provider: "MOCK",
      supportedCountries: "US,CA,PK",
      isDefault: true,
      configuration: JSON.stringify({ mode: "always_success" }),
    },
  });

  // ------------------------------------------------------------------
  // Workflow (data-driven stages — D-02)
  // ------------------------------------------------------------------
  const workflow = await prisma.workflowDefinition.create({
    data: { name: "Order Fulfilment", entityType: "ORDER" },
  });
  const stageDefs: { name: string; order: number; system?: boolean; terminal?: boolean }[] = [
    { name: "New", order: 10 },
    { name: "Paid", order: 20 },
    { name: "In Production", order: 30 },
    { name: "Ready", order: 40 },
    { name: "Shipped", order: 50 },
    { name: "Delivered", order: 60 },
    { name: "Completed", order: 70, terminal: true },
    { name: "Cancelled", order: 80, system: true, terminal: true },
    { name: "Refunded", order: 90, system: true, terminal: true },
  ];
  const stages: Record<string, { id: string; name: string }> = {};
  for (const s of stageDefs) {
    const stage = await prisma.workflowStage.create({
      data: {
        workflowId: workflow.id,
        name: s.name,
        sortOrder: s.order,
        isSystem: s.system ?? false,
        isTerminal: s.terminal ?? false,
      },
    });
    stages[s.name] = stage;
  }

  // ------------------------------------------------------------------
  // Attributes & customization options
  // ------------------------------------------------------------------
  const colorAttr = await prisma.attribute.create({
    data: {
      name: "Color",
      values: {
        create: [
          { value: "Red", swatch: "#8e1f2f", sortOrder: 1 },
          { value: "Ivory", swatch: "#f2ead9", sortOrder: 2 },
          { value: "Blush", swatch: "#e3b7b0", sortOrder: 3 },
          { value: "Emerald", swatch: "#175243", sortOrder: 4 },
          { value: "Maroon", swatch: "#5c1a24", sortOrder: 5 },
          { value: "Gold", swatch: "#c4a35a", sortOrder: 6 },
        ],
      },
    },
    include: { values: true },
  });
  const fabricAttr = await prisma.attribute.create({
    data: {
      name: "Fabric",
      values: {
        create: [
          { value: "Velvet", sortOrder: 1 },
          { value: "Raw Silk", sortOrder: 2 },
          { value: "Organza", sortOrder: 3 },
          { value: "Jamawar", sortOrder: 4 },
          { value: "Net", sortOrder: 5 },
        ],
      },
    },
    include: { values: true },
  });
  const sizeAttr = await prisma.attribute.create({
    data: {
      name: "Size",
      values: { create: [{ value: "S", sortOrder: 1 }, { value: "M", sortOrder: 2 }, { value: "L", sortOrder: 3 }] },
    },
    include: { values: true },
  });
  const attrByName = (name: string, value: string) => {
    if (name === "Color") return colorAttr.values.find((v) => v.value === value)!;
    if (name === "Fabric") return fabricAttr.values.find((v) => v.value === value)!;
    return sizeAttr.values.find((v) => v.value === value)!;
  };

  const embroidery = await prisma.customizationOption.create({
    data: {
      name: "Embroidery",
      values: {
        create: [
          { name: "Light embellishment", additionalPrice: 0 },
          { name: "Heavy embellishment", additionalPrice: 10000 },
          { name: "Zardozi handwork", additionalPrice: 18000 },
        ],
      },
    },
    include: { values: true },
  });
  const neckline = await prisma.customizationOption.create({
    data: {
      name: "Neckline",
      values: {
        create: [
          { name: "Boat neck", additionalPrice: 0 },
          { name: "Sweetheart", additionalPrice: 1500 },
          { name: "V-neck", additionalPrice: 2500 },
        ],
      },
    },
    include: { values: true },
  });
  const sleeves = await prisma.customizationOption.create({
    data: {
      name: "Sleeves",
      values: {
        create: [
          { name: "Sleeveless", additionalPrice: 0 },
          { name: "Short sleeves", additionalPrice: 2000 },
          { name: "Full sleeves", additionalPrice: 3500 },
        ],
      },
    },
    include: { values: true },
  });
  const trail = await prisma.customizationOption.create({
    data: {
      name: "Train / Trail",
      values: {
        create: [
          { name: "No trail", additionalPrice: 0 },
          { name: "Chapel trail", additionalPrice: 4000 },
          { name: "Cathedral trail", additionalPrice: 6000 },
        ],
      },
    },
    include: { values: true },
  });
  const allOptions = [embroidery, neckline, sleeves, trail];

  // ------------------------------------------------------------------
  // Measurement template
  // ------------------------------------------------------------------
  const template = await prisma.measurementTemplate.create({
    data: {
      name: "Standard Bridal",
      isDefault: true,
      fields: {
        create: [
          { fieldName: "Bust", fieldKey: "bust", sortOrder: 1 },
          { fieldName: "Waist", fieldKey: "waist", sortOrder: 2 },
          { fieldName: "Hips", fieldKey: "hips", sortOrder: 3 },
          { fieldName: "Shoulder", fieldKey: "shoulder", sortOrder: 4 },
          { fieldName: "Sleeve length", fieldKey: "sleeve_length", required: false, sortOrder: 5 },
          { fieldName: "Blouse / top length", fieldKey: "blouse_length", sortOrder: 6 },
          { fieldName: "Height", fieldKey: "height", sortOrder: 7 },
          { fieldName: "Notes", fieldKey: "notes", unit: "text", inputType: "TEXT", required: false, sortOrder: 8 },
        ],
      },
    },
    include: { fields: true },
  });

  // ------------------------------------------------------------------
  // Categories & products
  // ------------------------------------------------------------------
  const catDefs = [
    ["Bridal Dresses", "bridal-dresses"],
    ["Bridal Gowns", "bridal-gowns"],
    ["Lehengas", "lehengas"],
    ["Wedding Wear", "wedding-wear"],
    ["Party Wear", "party-wear"],
  ] as const;
  const cats: Record<string, string> = {};
  for (let i = 0; i < catDefs.length; i++) {
    const c = await prisma.category.upsert({
      where: { slug: catDefs[i][1] },
      update: {},
      create: { name: catDefs[i][0], slug: catDefs[i][1], sortOrder: i + 1 },
    });
    cats[catDefs[i][1]] = c.id;
  }

  type ProductDef = {
    name: string; slug: string; category: string; desc: string;
    usd: number; usdSale?: number; pkr: number; pkrSale?: number;
    image: string; color: string; fabric: string; featured?: boolean; stock: number;
  };
  const productDefs: ProductDef[] = [
    {
      name: "Luxe Red Velvet Lehenga", slug: "luxe-red-velvet-lehenga", category: "lehengas",
      desc: "A show-stopping bridal lehenga in deep red velvet with hand-worked gold zardozi on the blouse and dupatta. Full flare skirt with a comfortable structured waistband and concealed zip.",
      usd: 85000, pkr: 23800000, image: "/uploads/p-red-lehenga.jpg", color: "Red", fabric: "Velvet", featured: true, stock: 8,
    },
    {
      name: "Ivory Silk Bridal Gown", slug: "ivory-silk-bridal-gown", category: "bridal-gowns",
      desc: "Timeless ivory raw-silk gown with a fitted bodice, delicate pearl buttons and a softly flowing train. Lined in silk habotai for a weightless drape.",
      usd: 92000, usdSale: 82800, pkr: 25760000, pkrSale: 23184000,
      image: "/uploads/p-ivory-gown.jpg", color: "Ivory", fabric: "Raw Silk", featured: true, stock: 10,
    },
    {
      name: "Blush Organza Party Gown", slug: "blush-organza-party-gown", category: "party-wear",
      desc: "A romantic blush organza gown with scattered floral embroidery and a gently flared skirt — perfect for mehndi nights, receptions and formal parties.",
      usd: 48000, pkr: 13440000, image: "/uploads/p-blush-organza.jpg", color: "Blush", fabric: "Organza", featured: true, stock: 12,
    },
    {
      name: "Emerald Zardozi Wedding Gown", slug: "emerald-zardozi-wedding-gown", category: "wedding-wear",
      desc: "Rich emerald gown laden with gold zardozi and dabka handwork on a structured bodice, flowing into an embellished hem — a statement Nikkah look.",
      usd: 115000, pkr: 32200000, image: "/uploads/p-emerald-zardozi.jpg", color: "Emerald", fabric: "Net", featured: true, stock: 6,
    },
    {
      name: "Maroon Jamawar Bridal Dress", slug: "maroon-jamawar-bridal-dress", category: "bridal-dresses",
      desc: "Classic maroon jamawar bridal dress with intricate gold dabka embroidery and a fully embroidered dupatta. Includes matching chiffon side pocket (a modern touch on tradition).",
      usd: 76000, pkr: 21280000, image: "/uploads/p-maroon-jamawar.jpg", color: "Maroon", fabric: "Jamawar", stock: 9,
    },
  ];

  const sizeValues = sizeAttr.values;
  for (const def of productDefs) {
    const product = await prisma.product.create({
      data: {
        name: def.name,
        slug: def.slug,
        description: def.desc,
        categoryId: cats[def.category],
        productType: "MADE_TO_ORDER",
        productionDaysMin: 30,
        productionDaysMax: 45,
        basePrice: def.usd,
        salePrice: def.usdSale ?? null,
        sizeChart: SIZE_CHART,
        careInstructions: CARE,
        isFeatured: def.featured ?? false,
        status: "ACTIVE",
        countries: { create: countries.map((c) => ({ countryId: c.id })) },
        prices: {
          create: [{ countryId: pk.id, price: def.pkr, salePrice: def.pkrSale ?? null }],
        },
        media: { create: [{ url: def.image, altText: def.name, sortOrder: 1 }] },
        attributes: {
          create: [
            { attributeId: colorAttr.id },
            { attributeId: fabricAttr.id },
            { attributeId: sizeAttr.id },
          ],
        },
        customizations: { create: allOptions.map((o) => ({ customizationOptionId: o.id })) },
      },
    });

    let n = 1;
    for (const size of sizeValues) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `NB-${def.slug.slice(0, 10).replace(/-/g, "").toUpperCase()}-${size.value}-${n}`,
          status: "ACTIVE",
        },
      });
      await prisma.variantValue.createMany({
        data: [
          { variantId: variant.id, attributeId: colorAttr.id, attributeValueId: attrByName("Color", def.color).id },
          { variantId: variant.id, attributeId: fabricAttr.id, attributeValueId: attrByName("Fabric", def.fabric).id },
          { variantId: variant.id, attributeId: sizeAttr.id, attributeValueId: size.id },
        ],
      });
      await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          locationId: location.id,
          stockQuantity: def.stock,
          reservedQuantity: 0,
          lowStockThreshold: 3,
        },
      });
      n++;
    }
    console.log(`  product: ${def.name}`);
  }

  // ------------------------------------------------------------------
  // Users: Super Admin + 3 customers
  // ------------------------------------------------------------------
  const adminHash = await bcrypt.hash("Admin#2026", 10);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@noorbridal.test",
      passwordHash: adminHash,
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: superAdminRole.id }] },
    },
  });

  async function createCustomer(opts: {
    email: string; password: string; firstName: string; lastName: string; whatsapp: string;
    countryId: string; line1: string; line2?: string; city: string; state?: string; postal?: string;
    segmentKey?: string; verified?: boolean; createdAt?: Date;
  }) {
    const user = await prisma.user.create({
      data: {
        email: opts.email,
        passwordHash: await bcrypt.hash(opts.password, 10),
        emailVerifiedAt: opts.verified === false ? null : new Date(),
        createdAt: opts.createdAt,
        roles: { create: [{ roleId: customerRole.id }] },
        customer: {
          create: {
            firstName: opts.firstName,
            lastName: opts.lastName,
            whatsappNumber: opts.whatsapp,
            segmentId: opts.segmentKey ? segments[opts.segmentKey].id : null,
            createdAt: opts.createdAt,
            addresses: {
              create: {
                countryId: opts.countryId,
                addressLine1: opts.line1,
                addressLine2: opts.line2,
                city: opts.city,
                state: opts.state,
                postalCode: opts.postal,
              },
            },
          },
        },
      },
      include: { customer: { include: { addresses: true } } },
    });
    return user.customer!;
  }

  const sarah = await createCustomer({
    email: "sarah@example.com", password: "Test#1234", firstName: "Sarah", lastName: "Mitchell",
    whatsapp: "+1 415 555 0134", countryId: us.id, line1: "2847 Fillmore Street", city: "San Francisco",
    state: "CA", postal: "94123", segmentKey: "REPEAT",
  });
  const ayesha = await createCustomer({
    email: "ayesha@example.com", password: "Test#1234", firstName: "Ayesha", lastName: "Khan",
    whatsapp: "+92 321 555 0198", countryId: pk.id, line1: "House 12, Street 8, DHA Phase 6", city: "Karachi",
    postal: "75500", segmentKey: "VIP",
  });
  const emma = await createCustomer({
    email: "emma@example.com", password: "Test#1234", firstName: "Emma", lastName: "Tremblay",
    whatsapp: "+1 647 555 0170", countryId: ca.id, line1: "88 Harbour Street, Apt 2104", city: "Toronto",
    state: "ON", postal: "M5J 0A6", createdAt: daysAgo(2),
  });

  // ------------------------------------------------------------------
  // Orders (various stages)
  // ------------------------------------------------------------------
  const products = await prisma.product.findMany({
    include: { variants: { include: { values: { include: { attributeValue: true } } } }, prices: true },
  });
  const productBySlug = (slug: string) => products.find((p) => p.slug === slug)!;

  async function seedOrder(opts: {
    customer: typeof sarah; country: typeof us; currency: string;
    productSlug: string; qty?: number;
    customizations: { option: string; value: string; additionalPrice: number }[];
    measurements: Record<string, string>;
    unitPrice: number; // already in display currency incl. markups
    shipping: number; taxRateBps: number; couponCode?: string; discountBps?: number;
    stageName: string; paymentStatus: string; placedDaysAgo: number; estDeliveryInDays?: number;
    orderNumber: string;
  }) {
    const qty = opts.qty ?? 1;
    const product = productBySlug(opts.productSlug);
    const variant = product.variants[0];
    const subtotal = opts.unitPrice * qty;
    const discount = opts.discountBps ? Math.round((subtotal * opts.discountBps) / 10000) : 0;
    const tax = Math.round(((subtotal - discount) * opts.taxRateBps) / 10000);
    const total = subtotal - discount + opts.shipping + tax;
    const address = opts.customer.addresses.find((a) => a.countryId === opts.country.id) ?? opts.customer.addresses[0];

    const stage = stages[opts.stageName];
    const placedAt = daysAgo(opts.placedDaysAgo);

    const order = await prisma.order.create({
      data: {
        orderNumber: opts.orderNumber,
        customerId: opts.customer.id,
        countryId: opts.country.id,
        currency: opts.currency,
        subtotal,
        discountAmount: discount,
        couponCode: opts.couponCode,
        shippingAmount: opts.shipping,
        taxAmount: tax,
        totalAmount: total,
        paymentStatus: opts.paymentStatus,
        stageId: stage.id,
        stageName: stage.name,
        estimatedDelivery: opts.estDeliveryInDays ? daysAhead(opts.estDeliveryInDays) : null,
        shippingAddress: JSON.stringify({
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
        }),
        termsAcceptedAt: placedAt,
        placedAt,
        createdAt: placedAt,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        sku: variant.sku,
        quantity: qty,
        unitPrice: opts.unitPrice,
        lineTotal: opts.unitPrice * qty,
        customizationData: JSON.stringify(opts.customizations),
        measurementSnapshot: JSON.stringify({
          unit: "in",
          fields: template.fields
            .filter((f) => f.unit !== "text")
            .map((f) => ({ name: f.fieldName, key: f.fieldKey, value: opts.measurements[f.fieldKey] ?? "" })),
        }),
      },
    });

    for (const f of template.fields) {
      if (opts.measurements[f.fieldKey]) {
        await prisma.orderMeasurement.create({
          data: { orderId: order.id, fieldName: f.fieldName, fieldValue: opts.measurements[f.fieldKey], unit: "in" },
        });
      }
    }

    // Timeline up to stage
    const chain = ["New", "Paid", "In Production", "Ready", "Shipped", "Delivered", "Completed"];
    const idx = chain.indexOf(opts.stageName);
    const stepDays = Math.max(1, Math.floor(opts.placedDaysAgo / Math.max(idx + 1, 1)));
    let prev: string | null = null;
    for (let i = 0; i <= idx; i++) {
      const name = chain[i];
      if (name === "Paid" && opts.paymentStatus !== "PAID" && opts.paymentStatus !== "REFUNDED") continue;
      await prisma.orderWorkflowHistory.create({
        data: {
          orderId: order.id,
          fromStageId: prev ? stages[prev].id : null,
          toStageId: stages[name].id,
          changedById: name === "New" ? null : adminUser.id,
          createdAt: daysAgo(opts.placedDaysAgo - i * stepDays, 12),
        },
      });
      prev = name;
    }

    if (opts.paymentStatus === "PAID" || opts.paymentStatus === "REFUNDED") {
      const gateway = await prisma.paymentGateway.findFirst();
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          gatewayId: gateway!.id,
          transactionId: `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          amount: total,
          currency: opts.currency,
          status: "SUCCESS",
          responseReference: "seed",
          createdAt: placedAt,
        },
      });
      const count = await prisma.invoice.count();
      await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber: `INV-2026-${String(count + 1).padStart(5, "0")}`,
          amount: total,
          currency: opts.currency,
          issuedAt: placedAt,
        },
      });
      if (opts.paymentStatus === "REFUNDED") {
        await prisma.refund.create({
          data: { orderId: order.id, paymentId: payment.id, amount: total, currency: opts.currency, reason: "Customer returned unworn item", status: "PROCESSED", processedById: adminUser.id, processedAt: daysAgo(1) },
        });
      }
    }

    return order;
  }

  const sarahMeasurements = { bust: "34", waist: "27", hips: "38", shoulder: "14.5", sleeve_length: "22", blouse_length: "15", height: "65", notes: "Slightly looser at the waist please" };

  // ORD-1001 — Sarah, USA, in production
  await seedOrder({
    orderNumber: "ORD-1001", customer: sarah, country: us, currency: "USD",
    productSlug: "luxe-red-velvet-lehenga",
    customizations: [
      { option: "Embroidery", value: "Zardozi handwork", additionalPrice: 18000 },
      { option: "Neckline", value: "Sweetheart", additionalPrice: 1500 },
      { option: "Sleeves", value: "Full sleeves", additionalPrice: 3500 },
      { option: "Train / Trail", value: "No trail", additionalPrice: 0 },
    ],
    measurements: sarahMeasurements,
    unitPrice: 85000 + 18000 + 1500 + 3500, shipping: 3500, taxRateBps: 0,
    couponCode: "WELCOME10", discountBps: 1000,
    stageName: "In Production", paymentStatus: "PAID", placedDaysAgo: 10, estDeliveryInDays: 22,
  });

  // ORD-1002 — Ayesha, PK, ready
  await seedOrder({
    orderNumber: "ORD-1002", customer: ayesha, country: pk, currency: "PKR",
    productSlug: "emerald-zardozi-wedding-gown",
    customizations: [
      { option: "Embroidery", value: "Heavy embellishment", additionalPrice: 10000 },
      { option: "Neckline", value: "Boat neck", additionalPrice: 0 },
      { option: "Sleeves", value: "Sleeveless", additionalPrice: 0 },
      { option: "Train / Trail", value: "Cathedral trail", additionalPrice: 6000 },
    ],
    measurements: { bust: "36", waist: "30", hips: "40", shoulder: "15", blouse_length: "16", height: "63" },
    unitPrice: 32200000 + Math.round(((10000 + 6000) * 280 / 100)) * 100, shipping: 50000, taxRateBps: 500,
    stageName: "Ready", paymentStatus: "PAID", placedDaysAgo: 18, estDeliveryInDays: 5,
  });

  // ORD-1003 — Emma, CA, new/unpaid (awaiting payment)
  await seedOrder({
    orderNumber: "ORD-1003", customer: emma, country: ca, currency: "USD",
    productSlug: "blush-organza-party-gown",
    customizations: [
      { option: "Embroidery", value: "Light embellishment", additionalPrice: 0 },
      { option: "Neckline", value: "V-neck", additionalPrice: 2500 },
      { option: "Sleeves", value: "Short sleeves", additionalPrice: 2000 },
      { option: "Train / Trail", value: "No trail", additionalPrice: 0 },
    ],
    measurements: { bust: "33", waist: "26", hips: "36", shoulder: "14", blouse_length: "14.5", height: "67" },
    unitPrice: 48000 + 2500 + 2000, shipping: 4500, taxRateBps: 0,
    stageName: "New", paymentStatus: "PENDING", placedDaysAgo: 1,
  });

  // ORD-1004 — Sarah, delivered + reviewed
  await seedOrder({
    orderNumber: "ORD-1004", customer: sarah, country: us, currency: "USD",
    productSlug: "ivory-silk-bridal-gown",
    customizations: [
      { option: "Embroidery", value: "Heavy embellishment", additionalPrice: 10000 },
      { option: "Neckline", value: "Boat neck", additionalPrice: 0 },
      { option: "Sleeves", value: "Sleeveless", additionalPrice: 0 },
      { option: "Train / Trail", value: "Chapel trail", additionalPrice: 4000 },
    ],
    measurements: sarahMeasurements,
    unitPrice: 82800 + 10000 + 4000, shipping: 3500, taxRateBps: 0,
    stageName: "Delivered", paymentStatus: "PAID", placedDaysAgo: 55, estDeliveryInDays: -3,
  });

  // ORD-1005 — Ayesha, completed earlier
  await seedOrder({
    orderNumber: "ORD-1005", customer: ayesha, country: pk, currency: "PKR",
    productSlug: "maroon-jamawar-bridal-dress",
    customizations: [
      { option: "Embroidery", value: "Zardozi handwork", additionalPrice: 18000 },
      { option: "Neckline", value: "Sweetheart", additionalPrice: 1500 },
      { option: "Sleeves", value: "Full sleeves", additionalPrice: 3500 },
      { option: "Train / Trail", value: "No trail", additionalPrice: 0 },
    ],
    measurements: { bust: "36", waist: "30", hips: "40", shoulder: "15", blouse_length: "16", height: "63" },
    unitPrice: 21280000 + Math.round(((18000 + 1500 + 3500) * 280 / 100)) * 100, shipping: 50000, taxRateBps: 500,
    stageName: "Completed", paymentStatus: "PAID", placedDaysAgo: 80,
  });

  // ------------------------------------------------------------------
  // Coupons
  // ------------------------------------------------------------------
  await prisma.coupon.create({
    data: {
      code: "WELCOME10", description: "10% off your first order", discountType: "PERCENT", discountValue: 1000,
      usageLimit: 500, perCustomerLimit: 1,
      rules: { create: [{ ruleType: "SEGMENT", ruleValue: "NEW" }] },
    },
  });
  await prisma.coupon.create({
    data: {
      code: "BRIDAL20", description: "20% off orders over $500", discountType: "PERCENT", discountValue: 2000,
      usageLimit: 100,
      rules: { create: [{ ruleType: "MIN_ORDER", ruleValue: "50000" }] },
    },
  });

  // ------------------------------------------------------------------
  // Reviews
  // ------------------------------------------------------------------
  const ivory = productBySlug("ivory-silk-bridal-gown");
  const maroon = productBySlug("maroon-jamawar-bridal-dress");
  const lehenga = productBySlug("luxe-red-velvet-lehenga");
  const ord1004 = await prisma.order.findUnique({ where: { orderNumber: "ORD-1004" } });
  const ord1005 = await prisma.order.findUnique({ where: { orderNumber: "ORD-1005" } });
  await prisma.review.create({
    data: {
      customerId: sarah.id, productId: ivory.id, orderId: ord1004!.id, rating: 5,
      title: "Beyond my dreams",
      body: "The fit was perfect from the measurements alone. The pearls, the train — everything photographed beautifully. Worth every penny.",
      status: "APPROVED", createdAt: daysAgo(2),
    },
  });
  await prisma.review.create({
    data: {
      customerId: ayesha.id, productId: maroon.id, orderId: ord1005!.id, rating: 5,
      title: "Exquisite craftsmanship",
      body: "The dabka work is stunning in person. Arrived in Karachi even earlier than promised.",
      status: "APPROVED", createdAt: daysAgo(6),
    },
  });
  await prisma.review.create({
    data: {
      customerId: sarah.id, productId: lehenga.id, rating: 4,
      title: "Beautiful, sizing runs slightly generous",
      body: "Gorgeous velvet and colour. Ordered a size up and it was roomy — the measurement form is the way to go.",
      status: "PENDING", createdAt: daysAgo(1),
    },
  });

  // ------------------------------------------------------------------
  // Support ticket
  // ------------------------------------------------------------------
  const ord1002 = await prisma.order.findUnique({ where: { orderNumber: "ORD-1002" } });
  const ticket = await prisma.supportTicket.create({
    data: {
      customerId: ayesha.id, orderId: ord1002!.id, subject: "Can I add a jacket to ORD-1002?",
      priority: "NORMAL", status: "OPEN", createdAt: daysAgo(1),
      messages: {
        create: [
          { senderType: "CUSTOMER", message: "Hi! My gown is in Ready stage — is it too late to add a matching jacket?", createdAt: daysAgo(1) },
        ],
      },
    },
  });

  // ------------------------------------------------------------------
  // Abandoned cart (Emma) + behaviour events
  // ------------------------------------------------------------------
  const blush = productBySlug("blush-organza-party-gown");
  const emmaCart = await prisma.cart.create({
    data: {
      customerId: emma.id, status: "ACTIVE", createdAt: daysAgo(4), updatedAt: daysAgo(3),
      items: {
        create: {
          productId: blush.id, variantId: blush.variants[1].id, quantity: 1,
          customizationData: JSON.stringify([
            { option: "Embroidery", value: "Light embellishment", additionalPrice: 0 },
            { option: "Neckline", value: "Sweetheart", additionalPrice: 1500 },
          ]),
        },
      },
    },
  });
  await prisma.cart.update({ where: { id: emmaCart.id }, data: { updatedAt: daysAgo(3) } });

  const eventMatrix: [string, string, string, number][] = [
    [sarah.id, "PRODUCT_VIEW", ivory.id, 60],
    [sarah.id, "ADD_TO_CART", ivory.id, 58],
    [sarah.id, "PURCHASE", ivory.id, 55],
    [ayesha.id, "PRODUCT_VIEW", maroon.id, 90],
    [ayesha.id, "PURCHASE", maroon.id, 80],
    [ayesha.id, "PRODUCT_VIEW", lehenga.id, 5],
    [emma.id, "PRODUCT_VIEW", blush.id, 4],
    [emma.id, "ADD_TO_CART", blush.id, 3],
    [emma.id, "CHECKOUT_START", blush.id, 3],
    [emma.id, "PRODUCT_VIEW", ivory.id, 1],
  ];
  for (const [customerId, eventType, productId, ago] of eventMatrix) {
    await prisma.customerEvent.create({ data: { customerId, eventType, productId, createdAt: daysAgo(ago, 14) } });
  }

  // ------------------------------------------------------------------
  // Expenses (finance-lite)
  // ------------------------------------------------------------------
  await prisma.expense.createMany({
    data: [
      { title: "Velvet & silk fabric — market order", category: "FABRIC", amount: 125000, currency: "USD", incurredAt: daysAgo(20), note: "3 bolts", createdById: adminUser.id },
      { title: "Embroiderer advance (zardozi)", category: "LABOUR", amount: 65000, currency: "USD", incurredAt: daysAgo(15), createdById: adminUser.id },
      { title: "Instagram promotion", category: "MARKETING", amount: 18000, currency: "USD", incurredAt: daysAgo(7), createdById: adminUser.id },
    ],
  });

  // ------------------------------------------------------------------
  // CMS
  // ------------------------------------------------------------------
  await prisma.cmsBanner.create({
    data: {
      title: "Your dress, made for you.",
      subtitle: "Made-to-order bridal couture",
      imageUrl: "/uploads/hero.jpg",
      linkUrl: "/shop",
      ctaLabel: "Shop the Collection",
      sortOrder: 1,
    },
  });

  const pages: [string, string, string][] = [
    ["About", "about", "Noor Bridal is a made-to-order bridal atelier. Every piece is cut, stitched and finished by hand to your measurements — one order at a time.\n\nWe ship to the United States, Canada and Pakistan, with each garment individually packed in a keepsake garment box."],
    ["Terms of Service", "terms", "Draft placeholder — review with your legal advisor before launch (see MASTER_SPEC D-14)."],
    ["Privacy Policy", "privacy", "Draft placeholder. Measurements are collected per order and purged 90 days after delivery; we never sell personal data."],
    ["Shipping Policy", "shipping", "Made-to-order pieces are handcrafted in 30–45 days, then shipped tracked to your country (US 5–10 days · CA 7–12 days · PK 2–5 days)."],
    ["Returns & Exchanges", "returns", "Draft placeholder — custom-measurement garments are typically final sale; edit this policy in Admin → Content before launch."],
  ];
  for (const [title, slug, content] of pages) {
    await prisma.cmsPage.upsert({ where: { slug }, update: { content }, create: { title, slug, content, status: "PUBLISHED" } });
  }

  await prisma.blogPost.create({
    data: {
      title: "How we craft a lehenga in 45 days",
      slug: "how-we-craft-a-lehenga",
      excerpt: "From fabric selection to the final quality check — inside the atelier.",
      content: "Every Noor Bridal piece begins with fabric… (full post editable in Admin → Content → Blog).",
      featuredImage: "/uploads/p-red-lehenga.jpg",
      status: "PUBLISHED",
    },
  });

  const faqs: [string, string][] = [
    ["How long does a made-to-order piece take?", "Approximately 30–45 days to handcraft, plus shipping time to your country (5–12 days US/CA, 2–5 days PK)."],
    ["How do measurements work?", "You enter your measurements at checkout for the specific piece you're ordering. We use them for that order only — they're never saved to your profile, and they're purged 90 days after delivery."],
    ["Which countries do you ship to?", "Currently the United States, Canada and Pakistan, with country-specific pricing, shipping and tax shown at checkout."],
    ["Can I customize a design?", "Yes — every product page lists available customizations (embroidery, neckline, sleeves and more) with their price impact, updated live."],
  ];
  for (let i = 0; i < faqs.length; i++) {
    await prisma.faq.create({ data: { question: faqs[i][0], answer: faqs[i][1], sortOrder: i + 1 } });
  }

  // ------------------------------------------------------------------
  // Seed audit entries
  // ------------------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      { actorUserId: adminUser.id, actorLabel: "admin@noorbridal.test", action: "platform.seeded", entityType: "system", newValue: JSON.stringify({ products: productDefs.length }), createdAt: new Date() },
      { actorUserId: adminUser.id, actorLabel: "admin@noorbridal.test", action: "order.stage_changed", entityType: "order", oldValue: JSON.stringify({ stage: "Paid" }), newValue: JSON.stringify({ stage: "In Production" }), createdAt: daysAgo(8) },
      { actorUserId: adminUser.id, actorLabel: "admin@noorbridal.test", action: "settings.shipping_updated", entityType: "settings", newValue: JSON.stringify({ US: 35, CA: 45, PK: 500 }), createdAt: daysAgo(10) },
    ],
  });

  console.log("Seed complete.");
  console.log("  Admin:    admin@noorbridal.test / Admin#2026");
  console.log("  Customer: sarah@example.com / Test#1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
