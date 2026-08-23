import { prisma } from "./db";
import type { SessionUser } from "./auth";

export type AuditEntry = {
  actor?: SessionUser | null;
  action: string; // e.g. "order.stage_changed"
  entityType: string; // e.g. "order"
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
};

/** Append-only audit trail for every privileged mutation (Enterprise §34). */
export async function audit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: entry.actor?.id ?? null,
        actorLabel: entry.actor?.email ?? "system",
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        oldValue: entry.oldValue === undefined ? null : JSON.stringify(entry.oldValue ?? null),
        newValue: entry.newValue === undefined ? null : JSON.stringify(entry.newValue ?? null),
        ip: entry.ip ?? null,
      },
    });
  } catch (e) {
    console.error("audit write failed", e);
  }
}
