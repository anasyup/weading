"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { markOrderPaid } from "@/lib/orders";

export async function mockPay(formData: FormData) {
  const user = await getSessionUser();
  const orderId = String(formData.get("orderId"));

  const order = await markOrderPaid(orderId, {
    via: "mock_gateway",
    actorId: user?.id,
    actorLabel: user?.email ?? "customer",
  });
  if (!order) redirect("/cart");

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  redirect(`/account/orders/${order.id}?success=1`);
}
