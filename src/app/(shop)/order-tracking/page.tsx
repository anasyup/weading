import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Order Tracking",
  description: "Track the status and estimated delivery of your made-to-order bridal pieces.",
};

// Order tracking entry point (footer link) — sends visitors straight to the
// right place: customers to their orders list, guests to sign in first.
export default async function OrderTrackingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  if (!user.customerId) redirect("/");
  redirect("/account#orders");
}
