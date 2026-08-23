// Transactional email adapter (D-10).
// Production: RESEND_API_KEY + EMAIL_FROM → Resend HTTP API (no SDK needed).
// Dev preview: writes to the in-app outbox (email_logs) and surfaces links in the UI.

import { prisma } from "./db";

export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
  purpose: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; provider: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Noor Bridal <care@noorbridal.test>";

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          text: payload.body,
        }),
      });
      const ok = res.ok;
      await prisma.emailLog.create({
        data: { toEmail: payload.to, subject: payload.subject, body: payload.body, purpose: payload.purpose, status: ok ? "SENT" : "FAILED" },
      }).catch(() => {});
      return { sent: ok, provider: "resend" };
    } catch {
      // fall through to outbox
    }
  }

  await prisma.emailLog
    .create({
      data: { toEmail: payload.to, subject: payload.subject, body: payload.body, purpose: payload.purpose, status: "SENT" },
    })
    .catch(() => {});
  return { sent: true, provider: "dev_outbox" };
}
