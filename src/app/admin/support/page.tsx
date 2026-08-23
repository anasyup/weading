import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support" };

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    include: { customer: true, messages: true },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const badge = (s: string) =>
    s === "OPEN" ? "border-gold/40 bg-gold/10 text-gold-deep"
    : s === "IN_PROGRESS" ? "border-line bg-sand"
    : "border-moss/40 bg-moss/10 text-moss";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Customer care</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Support tickets</h1>
      <p className="mt-2 text-sm text-stone-600">
        {tickets.filter((t) => t.status === "OPEN").length} open · WhatsApp &amp; email enquiries land here too.
      </p>

      <div className="mt-6 space-y-3">
        {tickets.map((t) => (
          <Link key={t.id} href={`/admin/support/${t.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:border-gold">
            <div className="min-w-0">
              <p className="font-medium">{t.subject}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {t.customer.firstName} {t.customer.lastName} · {t.messages.length} messages ·{" "}
                {t.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {t.priority === "HIGH" && <span className="badge border-rose/40 bg-rose/10 text-rose">High</span>}
              <span className={`badge ${badge(t.status)}`}>{t.status.replace("_", " ")}</span>
            </div>
          </Link>
        ))}
        {tickets.length === 0 && (
          <div className="card px-6 py-10 text-center text-sm text-stone-500">No tickets.</div>
        )}
      </div>
    </div>
  );
}
