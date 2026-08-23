import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { replyTicket, setTicketStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      order: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/support" className="text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
        ← All tickets
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-stone-500">
            {ticket.customer.firstName} {ticket.customer.lastName} · {ticket.customer.user.email} · WhatsApp {ticket.customer.whatsappNumber}
            {ticket.order ? ` · Order ${ticket.order.orderNumber}` : ""}
          </p>
        </div>
        <form action={setTicketStatus} className="flex items-center gap-2">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <select name="status" defaultValue={ticket.status} className="input !w-40">
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button className="btn-primary btn-sm">Set</button>
        </form>
      </div>

      {/* Thread */}
      <div className="mt-6 space-y-4">
        {ticket.messages.map((m) => (
          <div key={m.id} className={m.senderType === "ADMIN" ? "flex justify-end" : ""}>
            <div className={`max-w-[80%] border p-4 ${
              m.senderType === "ADMIN" ? "border-gold/40 bg-sand" : "border-line bg-white"
            }`}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                {m.senderType === "ADMIN" ? "You (atelier)" : ticket.customer.firstName}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
              <p className="mt-2 text-[10px] text-stone-400">
                {m.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
      <form action={replyTicket} className="mt-6 border border-line bg-white p-5">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <label className="label" htmlFor="message">Reply (also emailed to the customer)</label>
        <textarea id="message" name="message" rows={4} required className="input" placeholder="Write your reply…" />
        <button className="btn-gold btn-sm mt-3">Send reply</button>
      </form>
    </div>
  );
}
