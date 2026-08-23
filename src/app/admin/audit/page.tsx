import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log" };

function pretty(value: string | null) {
  if (!value) return "—";
  try {
    const parsed = JSON.parse(value);
    return Object.entries(parsed).map(([k, v]) => `${k}: ${String(v)}`).join(" · ") || "—";
  } catch {
    return value;
  }
}

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Security</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Audit Log</h1>
      <p className="mt-2 text-sm text-stone-600">
        Append-only record — who did what, when, and to which record.
      </p>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-line bg-sand/60"><tr>
            <th className="th">When</th><th className="th">Actor</th><th className="th">Action</th>
            <th className="th">Entity</th><th className="th">Before</th><th className="th">After</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="td whitespace-nowrap text-[11px] text-stone-500">
                  {log.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="td text-xs">{log.actorLabel ?? "system"}</td>
                <td className="td"><span className="badge border-line bg-sand">{log.action}</span></td>
                <td className="td text-xs text-stone-500">{log.entityType}</td>
                <td className="td max-w-52 truncate text-xs text-stone-500" title={pretty(log.oldValue)}>{pretty(log.oldValue)}</td>
                <td className="td max-w-52 truncate text-xs text-stone-700" title={pretty(log.newValue)}>{pretty(log.newValue)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="td py-10 text-center text-stone-500">No audit events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
