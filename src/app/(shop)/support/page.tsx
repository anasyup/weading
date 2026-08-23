import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createTicket } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Support",
  description: "WhatsApp, email or open a support ticket — we reply within a day.",
};

export default async function SupportPage() {
  const user = await getSessionUser();
  const [whatsapp, supportEmail] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "support.whatsapp" } }),
    prisma.systemSetting.findUnique({ where: { key: "support.email" } }),
  ]);
  const waNumber = (whatsapp?.value ?? "+92 300 1234567").replace(/[^0-9]/g, "");
  const email = supportEmail?.value ?? "care@noorbridal.test";

  const tickets = user?.customerId
    ? await prisma.supportTicket.findMany({
        where: { customerId: user.customerId },
        include: { messages: true, order: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      })
    : [];
  const recentOrders = user?.customerId
    ? await prisma.order.findMany({
        where: { customerId: user.customerId },
        orderBy: { placedAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="eyebrow">We&apos;re here</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">Support</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
        Questions about sizing, fabrics, your order or a return? Reach us the way you prefer —
        every channel lands in the same place, so nothing gets lost.
      </p>

      {/* Channels */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hi! I have a question about ")}`}
          target="_blank"
          rel="noreferrer"
          className="card group p-6 transition hover:border-gold"
        >
          <p className="eyebrow">Fastest</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">WhatsApp</p>
          <p className="mt-1 text-sm text-stone-600">{whatsapp?.value ?? "+92 300 1234567"}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-gold-deep">Open chat →</p>
        </a>
        <a href={`mailto:${email}`} className="card group p-6 transition hover:border-gold">
          <p className="eyebrow">Email</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">Write to us</p>
          <p className="mt-1 text-sm text-stone-600">{email}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-gold-deep">Send email →</p>
        </a>
      </div>

      {/* Ticket form */}
      <section className="mt-12">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Open a support ticket</h2>
        {user ? (
          <form action={createTicket} className="mt-4 card space-y-4 p-6">
            <div>
              <label className="label" htmlFor="subject">Subject *</label>
              <input id="subject" name="subject" required className="input" placeholder="e.g. Adding a jacket to my order" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="orderId">Related order (optional)</label>
                <select id="orderId" name="orderId" className="input">
                  <option value="">— None —</option>
                  {recentOrders.map((o) => (
                    <option key={o.id} value={o.id}>{o.orderNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="priority">Priority</label>
                <select id="priority" name="priority" className="input" defaultValue="NORMAL">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High — wedding soon</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="message">Message *</label>
              <textarea id="message" name="message" required rows={4} className="input" placeholder="Tell us everything…" />
            </div>
            <button className="btn-gold">Submit ticket</button>
          </form>
        ) : (
          <div className="mt-4 card p-6 text-sm text-stone-600">
            Please <Link href="/login?next=/support" className="text-gold-deep underline">sign in</Link> to open a ticket —
            this keeps your order history attached and lets you track replies in your account.
          </div>
        )}
      </section>

      {/* My tickets */}
      {user && tickets.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">My tickets</h2>
          <div className="space-y-3">
            {tickets.map((t) => (
              <details key={t.id} className="card">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4">
                  <span className="text-sm font-medium">{t.subject}</span>
                  <span className={`badge ${t.status === "RESOLVED" || t.status === "CLOSED" ? "border-moss/40 bg-moss/10 text-moss" : "border-gold/40 bg-gold/10 text-gold-deep"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </summary>
                <div className="space-y-3 border-t border-line p-5">
                  {t.messages.map((m) => (
                    <div key={m.id} className={`border p-3 text-sm ${m.senderType === "ADMIN" ? "border-gold/40 bg-sand" : "border-line bg-white"}`}>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {m.senderType === "ADMIN" ? "Atelier" : "You"}
                      </p>
                      <p className="whitespace-pre-line">{m.message}</p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
