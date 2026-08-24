"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

export async function replyTicket(formData: FormData) {
  const admin = await requireAdmin();
  const ticketId = String(formData.get("ticketId"));
  const message = String(formData.get("message") ?? "").trim();
  if (!ticketId || !message) return;
  await prisma.supportMessage.create({
    data: { ticketId, senderType: "ADMIN", message },
  });
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "IN_PROGRESS", updatedAt: new Date() },
  });
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, include: { customer: { include: { user: true } } } });
  if (ticket) {
    await sendEmail({
      to: ticket.customer.user.email,
      subject: `Re: ${ticket.subject} — Bridal Dresses`,
      body: message,
      purpose: "SUPPORT_REPLY",
    }).catch(() => {});
  }
  await audit({ actor: admin, action: "support.replied", entityType: "support_ticket", entityId: ticketId });
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function setTicketStatus(formData: FormData) {
  const admin = await requireAdmin();
  const ticketId = String(formData.get("ticketId"));
  const status = String(formData.get("status"));
  if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) return;
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status, updatedAt: new Date() } });
  await audit({ actor: admin, action: "support.status_changed", entityType: "support_ticket", entityId: ticketId, newValue: { status } });
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
}
