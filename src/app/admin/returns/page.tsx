import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { setReturnStatus } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Returns" };

export default async function AdminReturnsPage() {
  const requests = await prisma.returnRequest.findMany({
    include: { customer: true, order: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const badge = (s: string) =>
    s === "REQUESTED" ? "border-gold/40 bg-gold/10 text-gold-deep"
    : s === "APPROVED" ? "border-line bg-sand"
    : s === "COMPLETED" ? "border-moss/40 bg-moss/10 text-moss"
    : "border-rose/40 bg-rose/10 text-rose";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">After-sales</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Returns, refunds &amp; exchanges</h1>
      <p className="mt-2 text-sm text-stone-600">
        Policy is editable in Content → Pages → Returns. {requests.filter((r) => r.status === "REQUESTED").length} awaiting decision.
      </p>

      <div className="mt-6 space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  <span className={`badge mr-2 ${badge(r.status)}`}>{r.type}</span>
                  {r.reason}
                </p>
                <p className="mt-1.5 text-xs text-stone-500">
                  {r.customer.firstName} {r.customer.lastName} · Order{" "}
                  <Link href={`/admin/orders/${r.orderId}`} className="text-gold-deep hover:underline">
                    {r.order.orderNumber}
                  </Link>{" "}
                  ({formatMoney(r.order.totalAmount, r.order.currency)}) ·{" "}
                  {r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                {r.adminNote && <p className="mt-1 text-xs text-stone-500">Note: {r.adminNote}</p>}
              </div>
              <span className={`badge ${badge(r.status)}`}>{r.status}</span>
            </div>

            {["APPROVED", "COMPLETED"].includes(r.status) ? (
              <form action={setReturnStatus} className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <input type="hidden" name="returnId" value={r.id} />
                <input type="hidden" name="status" value="COMPLETED" />
                <input name="adminNote" placeholder="Resolution note (optional)" className="input !w-64" />
                <button className="btn-primary btn-sm">Mark completed</button>
              </form>
            ) : r.status === "REQUESTED" ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <form action={setReturnStatus} className="flex flex-wrap gap-2">
                  <input type="hidden" name="returnId" value={r.id} />
                  <input type="hidden" name="status" value="APPROVED" />
                  <button className="btn-primary btn-sm">Approve {r.type.toLowerCase()}</button>
                </form>
                <form action={setReturnStatus} className="flex flex-wrap gap-2">
                  <input type="hidden" name="returnId" value={r.id} />
                  <input type="hidden" name="status" value="REJECTED" />
                  <input name="adminNote" placeholder="Reason (optional)" className="input !w-48" />
                  <button className="btn-ghost btn-sm">Reject</button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="card px-6 py-10 text-center text-sm text-stone-500">
            No return requests yet. Customers see the request form on delivered orders.
          </div>
        )}
      </div>
    </div>
  );
}
