import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

// Admin-only image upload.
// Dev: stores under /public/uploads (served by Next).
// Production: set S3_* env and swap the storage call (see DEPLOYMENT.md) —
// the response contract (url) stays the same.
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(clientKeyFrom(req, "upload"), 20)) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Max file size is 5 MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const name = `${crypto.randomBytes(8).toString("hex")}-${Date.now()}.${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${name}`;
  await audit({ actor: user, action: "media.uploaded", entityType: "media", newValue: { url, size: file.size } });

  return NextResponse.json({ ok: true, url });
}
