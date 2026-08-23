import { NextResponse } from "next/server";
import { rateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  if (!rateLimit(clientKeyFrom(req, "newsletter"))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await getSessionUser();
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { status: "SUBSCRIBED" },
    create: { email, customerId: user?.customerId ?? null },
  });

  return NextResponse.json({ ok: true });
}
