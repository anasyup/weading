"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function createTicket(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.customerId) redirect("/login?next=/support");

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim() || null;
  const priority = ["LOW", "NORMAL", "HIGH"].includes(String(formData.get("priority")))
    ? String(formData.get("priority"))
    : "NORMAL";

  if (!subject || !message) return;

  const ticket = await prisma.supportTicket.create({
    data: {
      customerId: user.customerId!,
      orderId,
      subject,
      priority,
      messages: { create: { senderType: "CUSTOMER", message } },
    },
  });
  await audit({
    actor: user,
    action: "support.ticket_created",
    entityType: "support_ticket",
    entityId: ticket.id,
    newValue: { subject },
  });
  revalidatePath("/support");
  revalidatePath("/account");
}
