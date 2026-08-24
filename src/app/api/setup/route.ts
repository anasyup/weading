import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runProductionSeed } from "@/lib/seed-core";
import { SCHEMA_SQL } from "@/lib/schema-sql";

// One-time remote setup endpoint:
//   POST /api/setup  with header  x-setup-key: <SETUP_KEY env value>
// 1. Creates all tables (idempotent — skips existing)
// 2. Seeds production data (catalog + settings, no demo customers)
// 3. Creates the Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD env
// After setup succeeds, remove the SETUP_KEY env var (documented in DEPLOYMENT.md).

export async function POST(req: Request) {
  const key = req.headers.get("x-setup-key");
  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Schema DDL — each statement tolerated if it already exists
    let created = 0;
    let skipped = 0;
    const statements = SCHEMA_SQL.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
        created++;
      } catch {
        skipped++; // already exists / index duplicate
      }
    }

    // 2. + 3. Seed + admin (skips anything already present)
    const summary = await runProductionSeed(
      prisma,
      (process.env.ADMIN_EMAIL ?? "admin@noorbridal.test").toLowerCase(),
      process.env.ADMIN_PASSWORD ?? "Admin#2026"
    );

    await prisma.auditLog.create({
      data: { actorLabel: "setup", action: "platform.setup", entityType: "system", newValue: JSON.stringify({ tablesCreated: created, skipped }) },
    }).catch(() => {});

    return NextResponse.json({ ok: true, statementsCreated: created, statementsSkipped: skipped, summary });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "setup failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "POST with x-setup-key header" }, { status: 405 });
}
