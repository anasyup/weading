"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { createOrderFromCart } from "@/lib/orders";
import { getCheckoutUrl } from "@/lib/payments";

const COUPON_COOKIE = "nb_coupon";

async function requireCustomer() {
  const user = await getSessionUser();
  if (!user?.customerId) redirect("/login?next=/checkout");
  return user;
}

export async function applyCoupon(formData: FormData) {
  await requireCustomer();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const jar = await cookies();
  if (code) jar.set(COUPON_COOKIE, code, { path: "/", maxAge: 60 * 60 });
  else jar.delete(COUPON_COOKIE);
  revalidatePath("/checkout");
}

export async function removeCoupon() {
  await requireCustomer();
  const jar = await cookies();
  jar.delete(COUPON_COOKIE);
  revalidatePath("/checkout");
}

export async function updateCheckoutAddress(formData: FormData) {
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
  await prisma.customerAddress.updateMany({ where: { customerId: user.customerId! }, data });
  await audit({ actor: user, action: "customer.address_updated", entityType: "customer", entityId: user.customerId! });
  revalidatePath("/checkout");
}

export async function placeOrder(formData: FormData) {
  const user = await requireCustomer();
  const termsAccepted = formData.get("terms") === "on";
  const customerNote = String(formData.get("note") ?? "").trim() || null;
  const jar = await cookies();
  const couponCode = jar.get(COUPON_COOKIE)?.value ?? null;

  const result = await createOrderFromCart(user.customerId!, {
    termsAccepted,
    couponCode,
    customerNote,
    actorLabel: user.email,
  });

  if (!result.ok) {
    // Send the reason back via query param (kept simple for the dev preview)
    redirect(`/checkout?error=${encodeURIComponent(result.error)}`);
  }

  jar.delete(COUPON_COOKIE);
  revalidatePath("/cart");
  const session = await getCheckoutUrl(result.orderId);
  redirect(session.url);
}
