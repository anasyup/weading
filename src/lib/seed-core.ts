// Production-safe seed: infrastructure + demo catalog, but NO demo
// customers/orders. Used by the one-time /api/setup endpoint on Vercel.
// (prisma/seed.ts remains the richer dev-preview seed with sample orders.)

import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

const SIZE_CHART = `<thead><tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hips (in)</th></tr></thead>
<tbody>
<tr><td>XS</td><td>31–32</td><td>24–25</td><td>34–35</td></tr>
<tr><td>S</td><td>33–34</td><td>26–27</td><td>36–37</td></tr>
<tr><td>M</td><td>35–36</td><td>28–29</td><td>38–39</td></tr>
<tr><td>L</td><td>37–38</td><td>30–31</td><td>40–41</td></tr>
<tr><td>XL</td><td>39–41</td><td>32–34</td><td>42–44</td></tr>
</tbody>`;

const CARE = `Professional dry clean only. Store in the garment bag provided, away from direct sunlight. Steam lightly before wearing — never iron directly over embroidery.`;

export async function runProductionSeed(prisma: PrismaClient, adminEmail: string, adminPassword: string) {
  const summary: string[] = [];

  // Countries
  const us = await prisma.country.upsert({ where: { code: "US" }, update: {}, create: { code: "US", name: "United States", currency: "USD", sortOrder: 1 } });
  const ca = await prisma.country.upsert({ where: { code: "CA" }, update: {}, create: { code: "CA", name: "Canada", currency: "USD", sortOrder: 2 } });
  const pk = await prisma.country.upsert({ where: { code: "PK" }, update: {}, create: { code: "PK", name: "Pakistan", currency: "PKR", sortOrder: 3 } });
  const countries = [us, ca, pk];

  // Roles & permissions
  const superAdminRole = await prisma.role.upsert({ where: { key: "SUPER_ADMIN" }, update: {}, create: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full platform access" } });
  await prisma.role.upsert({ where: { key: "CUSTOMER" }, update: {}, create: { key: "CUSTOMER", name: "Customer", description: "Storefront account" } });
  for (const key of ["products.manage", "orders.manage", "inventory.manage", "customers.manage", "settings.manage", "cms.manage", "finance.manage"]) {
    const p = await prisma.permission.upsert({ where: { key }, update: {}, create: { key, name: key.replace(".", " ") } });
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } }, update: {}, create: { roleId: superAdminRole.id, permissionId: p.id } });
  }

  // Segments + location + settings
  for (const [key, name] of [["NEW", "New customers"], ["REPEAT", "Repeat customers"], ["VIP", "VIP"], ["HIGH_VALUE", "High value"], ["INACTIVE", "Inactive"]] as const) {
    await prisma.customerSegment.upsert({ where: { key }, update: {}, create: { key, name, isSystem: true } });
  }
  const locationCount = await prisma.location.count();
  if (locationCount === 0) await prisma.location.create({ data: { name: "Central Atelier", type: "CENTRAL" } });
  const location = await prisma.location.findFirst();

  for (const [key, value, category] of [
    ["store.name", "Noor Bridal", "GENERAL"],
    ["support.email", "care@noorbridal.test", "GENERAL"],
    ["support.whatsapp", "+92 300 1234567", "GENERAL"],
    ["currency.pkr_per_usd", "280", "COUNTRY"],
    ["production.default_min_days", "30", "GENERAL"],
    ["production.default_max_days", "45", "GENERAL"],
    ["measurements.retention_days", "90", "SECURITY"],
  ] as const) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value, category } });
  }

  // Shipping / tax / gateway
  await prisma.shippingRule.upsert({ where: { countryId: us.id }, update: {}, create: { countryId: us.id, name: "USA flat rate", price: 3500, estDaysMin: 5, estDaysMax: 10 } });
  await prisma.shippingRule.upsert({ where: { countryId: ca.id }, update: {}, create: { countryId: ca.id, name: "Canada flat rate", price: 4500, estDaysMin: 7, estDaysMax: 12 } });
  await prisma.shippingRule.upsert({ where: { countryId: pk.id }, update: {}, create: { countryId: pk.id, name: "Pakistan flat rate", price: 50000, estDaysMin: 2, estDaysMax: 5 } });

  if ((await prisma.taxRule.count()) === 0) {
    await prisma.taxRule.create({ data: { countryId: us.id, name: "US sales tax (placeholder)", rateBps: 0 } });
    await prisma.taxRule.create({ data: { countryId: ca.id, name: "Canadian GST (placeholder)", rateBps: 0 } });
    await prisma.taxRule.create({ data: { countryId: pk.id, name: "Pakistan sales tax (placeholder)", rateBps: 500 } });
  }

  const gatewayCount = await prisma.paymentGateway.count();
  if (gatewayCount === 0) {
    await prisma.paymentGateway.create({
      data: { name: "Test Gateway (Sandbox)", provider: "MOCK", supportedCountries: "US,CA,PK", isDefault: true, configuration: JSON.stringify({ mode: "always_success" }) },
    });
  }

  // Workflow
  if ((await prisma.workflowDefinition.count()) === 0) {
    const wf = await prisma.workflowDefinition.create({ data: { name: "Order Fulfilment", entityType: "ORDER" } });
    const stageDefs: { name: string; order: number; system?: boolean; terminal?: boolean }[] = [
      { name: "New", order: 10 }, { name: "Paid", order: 20 }, { name: "In Production", order: 30 },
      { name: "Ready", order: 40 }, { name: "Shipped", order: 50 }, { name: "Delivered", order: 60 },
      { name: "Completed", order: 70, terminal: true }, { name: "Cancelled", order: 80, system: true, terminal: true },
      { name: "Refunded", order: 90, system: true, terminal: true },
    ];
    for (const s of stageDefs) {
      await prisma.workflowStage.create({
        data: { workflowId: wf.id, name: s.name, sortOrder: s.order, isSystem: s.system ?? false, isTerminal: s.terminal ?? false },
      });
    }
  }

  // Attributes & customization
  let colorAttr = await prisma.attribute.findFirst({ where: { name: "Color" }, include: { values: true } });
  if (!colorAttr) {
    colorAttr = await prisma.attribute.create({
      data: {
        name: "Color",
        values: { create: [
          { value: "Red", swatch: "#8e1f2f", sortOrder: 1 }, { value: "Ivory", swatch: "#f2ead9", sortOrder: 2 },
          { value: "Blush", swatch: "#e3b7b0", sortOrder: 3 }, { value: "Emerald", swatch: "#175243", sortOrder: 4 },
          { value: "Maroon", swatch: "#5c1a24", sortOrder: 5 }, { value: "Gold", swatch: "#c4a35a", sortOrder: 6 },
        ] },
      },
      include: { values: true },
    });
  }
  let fabricAttr = await prisma.attribute.findFirst({ where: { name: "Fabric" }, include: { values: true } });
  if (!fabricAttr) {
    fabricAttr = await prisma.attribute.create({
      data: { name: "Fabric", values: { create: [
        { value: "Velvet", sortOrder: 1 }, { value: "Raw Silk", sortOrder: 2 }, { value: "Organza", sortOrder: 3 },
        { value: "Jamawar", sortOrder: 4 }, { value: "Net", sortOrder: 5 },
      ] } },
      include: { values: true },
    });
  }
  let sizeAttr = await prisma.attribute.findFirst({ where: { name: "Size" }, include: { values: true } });
  if (!sizeAttr) {
    sizeAttr = await prisma.attribute.create({
      data: { name: "Size", values: { create: [{ value: "S", sortOrder: 1 }, { value: "M", sortOrder: 2 }, { value: "L", sortOrder: 3 }] } },
      include: { values: true },
    });
  }
  const attrByName = (name: string, value: string) => {
    if (name === "Color") return colorAttr!.values.find((v) => v.value === value)!;
    if (name === "Fabric") return fabricAttr!.values.find((v) => v.value === value)!;
    return sizeAttr!.values.find((v) => v.value === value)!;
  };

  const options: { name: string; values: { name: string; additionalPrice: number }[] }[] = [
    { name: "Embroidery", values: [{ name: "Light embellishment", additionalPrice: 0 }, { name: "Heavy embellishment", additionalPrice: 10000 }, { name: "Zardozi handwork", additionalPrice: 18000 }] },
    { name: "Neckline", values: [{ name: "Boat neck", additionalPrice: 0 }, { name: "Sweetheart", additionalPrice: 1500 }, { name: "V-neck", additionalPrice: 2500 }] },
    { name: "Sleeves", values: [{ name: "Sleeveless", additionalPrice: 0 }, { name: "Short sleeves", additionalPrice: 2000 }, { name: "Full sleeves", additionalPrice: 3500 }] },
    { name: "Train / Trail", values: [{ name: "No trail", additionalPrice: 0 }, { name: "Chapel trail", additionalPrice: 4000 }, { name: "Cathedral trail", additionalPrice: 6000 }] },
  ];
  const optionIds: string[] = [];
  for (const opt of options) {
    let existing = await prisma.customizationOption.findFirst({ where: { name: opt.name } });
    if (!existing) {
      existing = await prisma.customizationOption.create({ data: { name: opt.name, values: { create: opt.values } } });
    }
    optionIds.push(existing.id);
  }

  // Measurement template
  if ((await prisma.measurementTemplate.count()) === 0) {
    await prisma.measurementTemplate.create({
      data: {
        name: "Standard Bridal", isDefault: true,
        fields: { create: [
          { fieldName: "Bust", fieldKey: "bust", sortOrder: 1 }, { fieldName: "Waist", fieldKey: "waist", sortOrder: 2 },
          { fieldName: "Hips", fieldKey: "hips", sortOrder: 3 }, { fieldName: "Shoulder", fieldKey: "shoulder", sortOrder: 4 },
          { fieldName: "Sleeve length", fieldKey: "sleeve_length", required: false, sortOrder: 5 },
          { fieldName: "Blouse / top length", fieldKey: "blouse_length", sortOrder: 6 },
          { fieldName: "Height", fieldKey: "height", sortOrder: 7 },
          { fieldName: "Notes", fieldKey: "notes", unit: "text", inputType: "TEXT", required: false, sortOrder: 8 },
        ] },
      },
    });
  }

  // Categories + products
  const catDefs = [["Bridal Dresses", "bridal-dresses"], ["Bridal Gowns", "bridal-gowns"], ["Lehengas", "lehengas"], ["Wedding Wear", "wedding-wear"], ["Party Wear", "party-wear"]] as const;
  const cats: Record<string, string> = {};
  for (let i = 0; i < catDefs.length; i++) {
    const c = await prisma.category.upsert({ where: { slug: catDefs[i][1] }, update: {}, create: { name: catDefs[i][0], slug: catDefs[i][1], sortOrder: i + 1 } });
    cats[catDefs[i][1]] = c.id;
  }

  const productDefs = [
    { name: "Luxe Red Velvet Lehenga", slug: "luxe-red-velvet-lehenga", category: "lehengas", desc: "A show-stopping bridal lehenga in deep red velvet with hand-worked gold zardozi on the blouse and dupatta. Full flare skirt with a comfortable structured waistband and concealed zip.", usd: 85000, pkr: 23800000, image: "/uploads/p-red-lehenga.jpg", color: "Red", fabric: "Velvet", featured: true, stock: 8 },
    { name: "Ivory Silk Bridal Gown", slug: "ivory-silk-bridal-gown", category: "bridal-gowns", desc: "Timeless ivory raw-silk gown with a fitted bodice, delicate pearl buttons and a softly flowing train. Lined in silk habotai for a weightless drape.", usd: 92000, usdSale: 82800, pkr: 25760000, pkrSale: 23184000, image: "/uploads/p-ivory-gown.jpg", color: "Ivory", fabric: "Raw Silk", featured: true, stock: 10 },
    { name: "Blush Organza Party Gown", slug: "blush-organza-party-gown", category: "party-wear", desc: "A romantic blush organza gown with scattered floral embroidery and a gently flared skirt — perfect for mehndi nights, receptions and formal parties.", usd: 48000, pkr: 13440000, image: "/uploads/p-blush-organza.jpg", color: "Blush", fabric: "Organza", featured: true, stock: 12 },
    { name: "Emerald Zardozi Wedding Gown", slug: "emerald-zardozi-wedding-gown", category: "wedding-wear", desc: "Rich emerald gown laden with gold zardozi and dabka handwork on a structured bodice, flowing into an embellished hem — a statement Nikkah look.", usd: 115000, pkr: 32200000, image: "/uploads/p-emerald-zardozi.jpg", color: "Emerald", fabric: "Net", featured: true, stock: 6 },
    { name: "Maroon Jamawar Bridal Dress", slug: "maroon-jamawar-bridal-dress", category: "bridal-dresses", desc: "Classic maroon jamawar bridal dress with intricate gold dabka embroidery and a fully embroidered dupatta.", usd: 76000, pkr: 21280000, image: "/uploads/p-maroon-jamawar.jpg", color: "Maroon", fabric: "Jamawar", stock: 9 },
  ];

  let productsCreated = 0;
  for (const def of productDefs) {
    const exists = await prisma.product.findUnique({ where: { slug: def.slug } });
    if (exists) continue;
    const product = await prisma.product.create({
      data: {
        name: def.name, slug: def.slug, description: def.desc, categoryId: cats[def.category],
        productType: "MADE_TO_ORDER", productionDaysMin: 30, productionDaysMax: 45,
        basePrice: def.usd, salePrice: (def as { usdSale?: number }).usdSale ?? null,
        sizeChart: SIZE_CHART, careInstructions: CARE,
        isFeatured: def.featured ?? false, status: "ACTIVE",
        countries: { create: countries.map((c) => ({ countryId: c.id })) },
        prices: { create: [{ countryId: pk.id, price: def.pkr, salePrice: (def as { pkrSale?: number }).pkrSale ?? null }] },
        media: { create: [{ url: def.image, altText: def.name, sortOrder: 1 }] },
        attributes: { create: [{ attributeId: colorAttr!.id }, { attributeId: fabricAttr!.id }, { attributeId: sizeAttr!.id }] },
        customizations: { create: optionIds.map((id) => ({ customizationOptionId: id })) },
      },
    });
    let n = 1;
    for (const size of sizeAttr!.values) {
      const variant = await prisma.productVariant.create({
        data: { productId: product.id, sku: `NB-${def.slug.slice(0, 10).replace(/-/g, "").toUpperCase()}-${size.value}-${n}`, status: "ACTIVE" },
      });
      await prisma.variantValue.createMany({
        data: [
          { variantId: variant.id, attributeId: colorAttr!.id, attributeValueId: attrByName("Color", def.color).id },
          { variantId: variant.id, attributeId: fabricAttr!.id, attributeValueId: attrByName("Fabric", def.fabric).id },
          { variantId: variant.id, attributeId: sizeAttr!.id, attributeValueId: size.id },
        ],
      });
      await prisma.inventoryItem.create({
        data: { productId: product.id, variantId: variant.id, locationId: location?.id, stockQuantity: def.stock, reservedQuantity: 0, lowStockThreshold: 3 },
      });
      n++;
    }
    productsCreated++;
  }

  // Coupons
  const welcome = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } });
  if (!welcome) {
    await prisma.coupon.create({ data: { code: "WELCOME10", description: "10% off your first order", discountType: "PERCENT", discountValue: 1000, usageLimit: 500, perCustomerLimit: 1, rules: { create: [{ ruleType: "SEGMENT", ruleValue: "NEW" }] } } });
  }
  const bridal = await prisma.coupon.findUnique({ where: { code: "BRIDAL20" } });
  if (!bridal) {
    await prisma.coupon.create({ data: { code: "BRIDAL20", description: "20% off orders over $500", discountType: "PERCENT", discountValue: 2000, usageLimit: 100, rules: { create: [{ ruleType: "MIN_ORDER", ruleValue: "50000" }] } } });
  }

  // CMS
  if ((await prisma.cmsBanner.count()) === 0) {
    await prisma.cmsBanner.create({ data: { title: "Your dress, made for you.", subtitle: "Made-to-order bridal couture", imageUrl: "/uploads/hero.jpg", linkUrl: "/shop", ctaLabel: "Shop the Collection", sortOrder: 1 } });
  }
  const pages: [string, string, string][] = [
    ["About", "about", "Noor Bridal is a made-to-order bridal atelier. Every piece is cut, stitched and finished by hand to your measurements — one order at a time.\n\nWe ship to the United States, Canada and Pakistan."],
    ["Terms of Service", "terms", "Draft placeholder — review with your legal advisor before launch."],
    ["Privacy Policy", "privacy", "Draft placeholder. Measurements are collected per order and purged 90 days after delivery; we never sell personal data."],
    ["Shipping Policy", "shipping", "Made-to-order pieces are handcrafted in 30–45 days, then shipped tracked to your country (US 5–10 days · CA 7–12 days · PK 2–5 days)."],
    ["Returns & Exchanges", "returns", "Draft placeholder — custom-measurement garments are typically final sale; edit this policy in Admin → Content before launch."],
  ];
  for (const [title, slug, content] of pages) {
    await prisma.cmsPage.upsert({ where: { slug }, update: {}, create: { title, slug, content, status: "PUBLISHED" } });
  }
  if ((await prisma.blogPost.count()) === 0) {
    await prisma.blogPost.create({ data: { title: "How we craft a lehenga in 45 days", slug: "how-we-craft-a-lehenga", excerpt: "From fabric selection to the final quality check — inside the atelier.", content: "Every Noor Bridal piece begins with fabric… (full post editable in Admin → Content → Blog).", featuredImage: "/uploads/p-red-lehenga.jpg", status: "PUBLISHED" } });
  }
  if ((await prisma.faq.count()) === 0) {
    const faqs: [string, string][] = [
      ["How long does a made-to-order piece take?", "Approximately 30–45 days to handcraft, plus shipping time to your country."],
      ["How do measurements work?", "You enter your measurements for the specific piece you're ordering — used for that order only, never saved to your profile."],
      ["Which countries do you ship to?", "Currently the United States, Canada and Pakistan, with country-specific pricing, shipping and tax at checkout."],
      ["Can I customize a design?", "Yes — every product page lists available customizations with their price impact."],
    ];
    for (let i = 0; i < faqs.length; i++) {
      await prisma.faq.create({ data: { question: faqs[i][0], answer: faqs[i][1], sortOrder: i + 1 } });
    }
  }

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: superAdminRole.id } },
    },
  });

  summary.push(`${productsCreated} products`, `admin: ${adminEmail}`);
  return summary;
}
