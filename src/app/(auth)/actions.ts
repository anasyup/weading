"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  isLockedOut,
  recordLoginAttempt,
  createActionToken,
  consumeActionToken,
} from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export type AuthState = {
  error?: string;
  ok?: boolean;
  message?: string;
  devLink?: string;
  needsVerification?: boolean;
  email?: string;
};

const DEV_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
}

// ---------------------------------------------------------------------------

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const email = get("email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = get("firstName");
  const lastName = get("lastName");
  const whatsappNumber = get("whatsapp");
  const countryId = get("countryId");
  const addressLine1 = get("addressLine1");
  const city = get("city");

  if (!firstName || !lastName || !email || !whatsappNumber || !addressLine1 || !city || !countryId) {
    return { error: "Please complete all required fields." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Try signing in." };

  const country = await prisma.country.findUnique({ where: { id: countryId } });
  if (!country) return { error: "Please choose a valid country." };

  const customerRole = await prisma.role.findUnique({ where: { key: "CUSTOMER" } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      customer: {
        create: {
          firstName,
          lastName,
          whatsappNumber,
          addresses: {
            create: {
              countryId: country.id,
              addressLine1,
              addressLine2: get("addressLine2") || null,
              city,
              state: get("state") || null,
              postalCode: get("postalCode") || null,
            },
          },
        },
      },
      roles: customerRole ? { create: { roleId: customerRole.id } } : undefined,
    },
    include: { customer: true },
  });

  const token = await createActionToken(user.id, "EMAIL_VERIFY");
  const link = `/verify-email/${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your email — Bridal Dresses",
    body: `Welcome ${firstName}! Verify your email: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}${link}`,
    purpose: "VERIFY_EMAIL",
  });
  await audit({ action: "customer.registered", entityType: "customer", entityId: user.customer!.id });

  return {
    ok: true,
    message: `Welcome, ${firstName}! One last step — verify your email to sign in.`,
    devLink: link,
  };
}

// ---------------------------------------------------------------------------

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) return { error: "Email and password are required." };
  if (await isLockedOut(email)) {
    return { error: "Too many failed attempts. Please wait 15 minutes and try again." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } }, customer: true },
  });

  const valid = user && (await verifyPassword(password, user.passwordHash));
  await recordLoginAttempt(email, !!valid, await clientIp());

  if (!user || !valid) return { error: "Incorrect email or password." };
  if (user.status !== "ACTIVE") return { error: "This account has been disabled." };
  if (!user.emailVerifiedAt) {
    return { error: "Please verify your email before signing in. Check your inbox.", needsVerification: true, email } as AuthState;
  }

  await createSession(user.id, await clientIp(), (await headers()).get("user-agent") ?? undefined);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  redirect(next || "/account");
}

// ---------------------------------------------------------------------------

export async function resendVerificationAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) {
    return { ok: true, message: "If this email needs verification, a new link has been sent." };
  }
  const token = await createActionToken(user.id, "EMAIL_VERIFY");
  const link = `/verify-email/${token}`;
  await sendEmail({ to: email, subject: "Verify your email — Bridal Dresses", body: `Verify your email: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}${link}`, purpose: "VERIFY_EMAIL" });
  return { ok: true, message: "Verification link (dev preview):", devLink: link };
}

// ---------------------------------------------------------------------------

export async function requestResetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Never reveal whether the account exists
  if (!user) {
    return { ok: true, message: "If an account exists for this email, a reset link has been sent." };
  }

  const token = await createActionToken(user.id, "PASSWORD_RESET");
  const link = `/reset-password/${token}`;
  await sendEmail({ to: email, subject: "Reset your password — Bridal Dresses", body: `Reset your password: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}${link}`, purpose: "RESET_PASSWORD" });
  return { ok: true, message: "If an account exists for this email, a reset link has been sent.", devLink: link };
}

// ---------------------------------------------------------------------------

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const record = await consumeActionToken(token, "PASSWORD_RESET");
  if (!record) return { error: "This reset link is invalid or has expired. Please request a new one." };

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(password) },
  });
  await prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  // Invalidate all sessions
  await prisma.session.deleteMany({ where: { userId: record.userId } });
  await audit({ action: "auth.password_reset", entityType: "user", entityId: record.userId });

  return { ok: true, message: "Password updated. You can now sign in with your new password." };
}

// ---------------------------------------------------------------------------

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
