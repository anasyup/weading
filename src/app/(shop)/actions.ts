"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

async function requireCustomer() {
  const user = await getSessionUser();
  if (!user?.customerId) redirect("/login?next=/account");
  return user;
}

export async function updateCartItem(formData: FormData) {
  const user = await requireCustomer();
  const itemId = String(formData.get("itemId"));
  const quantity = Math.max(0, parseInt(String(formData.get("quantity")), 10) || 1);

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item || item.cart.customerId !== user.customerId) return;

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    await prisma.customerEvent.create({
      data: { customerId: user.customerId, eventType: "REMOVE_FROM_CART", productId: item.productId },
    }).catch(() => {});
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData) {
  await updateCartItem(formData);
}

export async function removeWishlistItem(formData: FormData) {
  const user = await requireCustomer();
  const itemId = String(formData.get("itemId"));
  await prisma.wishlistItem.deleteMany({ where: { id: itemId, wishlist: { customerId: user.customerId! } } });
  revalidatePath("/account");
}

export async function updateAddress(formData: FormData) {
  const user = await requireCustomer();
  const data = {
    countryId: String(formData.get("countryId")),
    addressLine1: String(formData.get("addressLine1")).trim(),
    addressLine2: String(formData.get("addressLine2")).trim() || null,
    city: String(formData.get("city")).trim(),
    state: String(formData.get("state")).trim() || null,
    postalCode: String(formData.get("postalCode")).trim() || null,
    phone: String(formData.get("phone")).trim() || null,
  };
  if (!data.addressLine1 || !data.city || !data.countryId) return;

  await prisma.customerAddress.updateMany({
    where: { customerId: user.customerId! },
    data,
  });
  await audit({
    actor: user,
    action: "customer.address_updated",
    entityType: "customer",
    entityId: user.customerId,
  });
  revalidatePath("/account");
}
