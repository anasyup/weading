import { NextResponse } from "next/server";
import { rateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST — toggle a product in the customer's wishlist
export async function POST(req: Request) {
  if (!rateLimit(clientKeyFrom(req, "wishlist"))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const user = await getSessionUser();
  if (!user?.customerId) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const productId = String(body?.productId ?? "");
  if (!productId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const wishlist = await prisma.wishlist.upsert({
    where: { customerId: user.customerId },
    update: {},
    create: { customerId: user.customerId },
  });

  const existing = await prisma.wishlistItem.findFirst({
    where: { wishlistId: wishlist.id, productId },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, inWishlist: false });
  }

  await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  await prisma.customerEvent
    .create({ data: { customerId: user.customerId, eventType: "WISHLIST_ADD", productId } })
    .catch(() => {});
  return NextResponse.json({ ok: true, inWishlist: true });
}
