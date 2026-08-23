import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SESSION_COOKIE = "nb_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Sessions — opaque token in an httpOnly cookie, SHA-256 hash stored server-side
// ---------------------------------------------------------------------------

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const token = randomToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip,
      userAgent,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export type SessionUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  isAdmin: boolean;
  customerId: string | null;
  name: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") return null;

  const roles = session.user.roles.map((r) => r.role.key);
  return {
    id: session.user.id,
    email: session.user.email,
    emailVerifiedAt: session.user.emailVerifiedAt,
    isAdmin: roles.includes("SUPER_ADMIN"),
    customerId: session.user.customer?.id ?? null,
    name: session.user.customer
      ? `${session.user.customer.firstName} ${session.user.customer.lastName}`
      : null,
  };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Throttling — failed login attempts per email (window: 15 min)
// ---------------------------------------------------------------------------

export async function isLockedOut(email: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const failures = await prisma.loginAttempt.count({
    where: { email: email.toLowerCase(), success: false, createdAt: { gte: since } },
  });
  return failures >= 8;
}

export async function recordLoginAttempt(email: string, success: boolean, ip?: string) {
  await prisma.loginAttempt.create({ data: { email: email.toLowerCase(), success, ip } });
}

// ---------------------------------------------------------------------------
// Action tokens — email verification & password reset (single-use, expiring)
// ---------------------------------------------------------------------------

export async function createActionToken(userId: string, purpose: "EMAIL_VERIFY" | "PASSWORD_RESET") {
  const token = randomToken();
  const ttl = purpose === "EMAIL_VERIFY" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
  await prisma.verificationToken.create({
    data: {
      userId,
      purpose,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + ttl),
    },
  });
  return token;
}

export async function consumeActionToken(token: string, purpose: "EMAIL_VERIFY" | "PASSWORD_RESET") {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!record || record.purpose !== purpose) return null;
  if (record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

// Dev-mode email: written to the in-app outbox (production swaps in a provider adapter)
export async function sendDevEmail(toEmail: string, subject: string, body: string, purpose: string) {
  await prisma.emailLog.create({ data: { toEmail, subject, body, purpose } });
}
