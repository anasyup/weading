import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      user: { select: { email: true, emailVerifiedAt: true } },
      segment: true,
      addresses: { include: { country: true }, take: 1 },
      orders: { select: { totalAmount: true, currency: true, paymentStatus: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Relationships</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Customers</h1>
      <p className="mt-2 text-sm text-stone-600">{customers.length} registered</p>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-line bg-sand/60"><tr>
            <th className="th">Customer</th><th className="th">WhatsApp</th><th className="th">Country</th>
            <th className="th">Segment</th><th className="th">Orders</th><th className="th">Lifetime value</th><th className="th">Joined</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => {
              const paid = c.orders.filter((o) => o.paymentStatus === "PAID");
              const ltv = paid.reduce((s, o) => s + o.totalAmount, 0);
              return (
                <tr key={c.id} className="hover:bg-sand/30">
                  <td className="td">
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    <span className="block text-[10px] text-stone-400">
                      {c.user.email} {c.user.emailVerifiedAt ? "✓" : "(unverified)"}
                    </span>
                  </td>
                  <td className="td text-stone-600">{c.whatsappNumber}</td>
                  <td className="td text-stone-600">{c.addresses[0]?.country.code ?? "—"}</td>
                  <td className="td">
                    <span className="badge border-line bg-sand">{c.segment?.name ?? "New"}</span>
                  </td>
                  <td className="td">{c.orders.length} <span className="text-[10px] text-stone-400">({paid.length} paid)</span></td>
                  <td className="td font-semibold">
                    {ltv > 0 ? formatMoney(ltv, paid[0]?.currency ?? "USD") : "—"}
                  </td>
                  <td className="td text-stone-600">
                    {c.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr><td colSpan={7} className="td py-10 text-center text-stone-500">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
