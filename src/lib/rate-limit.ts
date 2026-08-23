// Simple in-memory rate limiter for API routes (per-IP).
// Production note: swap for Redis-backed limiting when scaling (MASTER_SPEC §8).

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export function clientKeyFrom(req: Request, scope: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${scope}:${ip}`;
}
