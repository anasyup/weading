import { NextResponse } from "next/server";
import { rateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";

async function requireCustomer() {
  const user = await getSessionUser();
  if (!user?.customerId) return null;
  return user;
}

// POST — add an item (variant + customizations + measurements) to the cart
export async function POST(req: Request) {
  if (!rateLimit(clientKeyFrom(req, "cart"))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.productId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: String(body.productId) },
    include: { variants: true },
  });
  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
  }
  const variant = body.variantId ? product.variants.find((v) => v.id === body.variantId) : null;

  const quantity = Math.min(Math.max(parseInt(body.quantity, 10) || 1, 1), 9);

  // Made-to-order requires measurements
  let measurementJson: string | null = null;
  if (product.productType === "MADE_TO_ORDER") {
    if (!body.measurementData?.fields?.length) {
      return NextResponse.json({ error: "Measurements are required for made-to-order pieces" }, { status: 400 });
    }
    measurementJson = JSON.stringify(body.measurementData);
  }

  const customizationJson = Array.isArray(body.customizationData)
    ? JSON.stringify(body.customizationData)
    : null;

  const cart = await getOrCreateCart(user.customerId!);
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity,
      customizationData: customizationJson,
      measurementData: measurementJson,
    },
  });

  await prisma.customerEvent.create({
    data: { customerId: user.customerId!, eventType: "ADD_TO_CART", productId: product.id },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

// PATCH — update quantity
export async function PATCH(req: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const itemId = String(body?.itemId ?? "");
  const quantity = Math.max(0, Math.min(parseInt(body?.quantity, 10) || 1, 9));

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.customerId !== user.customerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (quantity === 0) await prisma.cartItem.delete({ where: { id: itemId } });
  else await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  return NextResponse.json({ ok: true });
}

// DELETE — remove an item
export async function DELETE(req: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const itemId = String(body?.itemId ?? "");

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.customerId !== user.customerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  await prisma.customerEvent.create({
    data: { customerId: user.customerId!, eventType: "REMOVE_FROM_CART", productId: item.productId },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
