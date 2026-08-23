import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COUNTRY_COOKIE, SUPPORTED } from "@/lib/country";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "");
  if (!SUPPORTED.includes(code as (typeof SUPPORTED)[number])) {
    return NextResponse.json({ error: "Unsupported country" }, { status: 400 });
  }
  const jar = await cookies();
  jar.set(COUNTRY_COOKIE, code, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return NextResponse.json({ ok: true, code });
}
