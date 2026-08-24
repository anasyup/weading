import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Database URL resolution:
// 1. DATABASE_URL (standard — Neon direct, Supabase, Railway, RDS…)
// 2. POSTGRES_PRISMA_URL / POSTGRES_URL / NEON_DATABASE_URL (set automatically
//    by the Vercel × Neon marketplace integration)
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.NEON_DATABASE_URL ??
    process.env.DATABASE_URL_UNPOOLED
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolveDatabaseUrl()
      ? { db: { url: resolveDatabaseUrl() } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
