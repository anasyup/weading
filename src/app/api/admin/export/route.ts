import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const v = cell === null || cell === undefined ? "" : String(cell);
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(",")
    )
    .join("\r\n");
}

// Admin CSV export (future scope promoted per owner request): ?type=orders|customers|products
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = new URL(req.url).searchParams.get("type") ?? "orders";
  let csv = "";
  let filename = "export.csv";

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      include: { customer: { include: { user: { select: { email: true } } } }, country: true },
      orderBy: { placedAt: "desc" },
    });
    csv = toCsv([
      ["Order #", "Date", "Customer", "Email", "Country", "Currency", "Subtotal", "Discount", "Shipping", "Tax", "Total", "Payment", "Stage", "Est. Delivery"],
      ...orders.map((o) => [
        o.orderNumber,
        o.placedAt.toISOString().slice(0, 10),
        `${o.customer.firstName} ${o.customer.lastName}`,
        o.customer.user.email ?? "",
        o.country.code,
        o.currency,
        (o.subtotal / 100).toFixed(2),
        (o.discountAmount / 100).toFixed(2),
        (o.shippingAmount / 100).toFixed(2),
        (o.taxAmount / 100).toFixed(2),
        (o.totalAmount / 100).toFixed(2),
        o.paymentStatus,
        o.stageName,
        o.estimatedDelivery ? o.estimatedDelivery.toISOString().slice(0, 10) : "",
      ]),
    ]);
    filename = "orders.csv";
  } else if (type === "customers") {
    const customers = await prisma.customer.findMany({
      include: {
        user: { select: { email: true } },
        segment: true,
        addresses: { take: 1, include: { country: true } },
        orders: { where: { paymentStatus: "PAID" }, select: { totalAmount: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv([
      ["Name", "Email", "WhatsApp", "Country", "Segment", "Paid Orders", "LTV (USD)", "Joined"],
      ...customers.map((c) => [
        `${c.firstName} ${c.lastName}`,
        c.user.email,
        c.whatsappNumber,
        c.addresses[0]?.country.code ?? "",
        c.segment?.name ?? "New",
        c.orders.length,
        (c.orders.reduce((s, o) => s + (o.currency === "PKR" ? Math.round(o.totalAmount / 280) : o.totalAmount), 0) / 100).toFixed(2),
        c.createdAt.toISOString().slice(0, 10),
      ]),
    ]);
    filename = "customers.csv";
  } else {
    const products = await prisma.product.findMany({
      include: { category: true, prices: { include: { country: true } }, inventoryItems: true },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv([
      ["Name", "Slug", "Category", "Type", "USD Price", "PKR Price", "Stock (available)", "Status", "Featured"],
      ...products.map((p) => [
        p.name,
        p.slug,
        p.category?.name ?? "",
        p.productType,
        ((p.salePrice ?? p.basePrice) / 100).toFixed(2),
        (() => {
          const pk = p.prices.find((x) => x.country.code === "PK");
          return pk ? ((pk.salePrice ?? pk.price) / 100).toFixed(0) : "";
        })(),
        p.inventoryItems.reduce((s, i) => s + (i.stockQuantity - i.reservedQuantity), 0),
        p.status,
        p.isFeatured ? "yes" : "no",
      ]),
    ]);
    filename = "products.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
