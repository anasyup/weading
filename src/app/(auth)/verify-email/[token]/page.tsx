import Link from "next/link";
import { prisma } from "@/lib/db";
import { consumeActionToken } from "@/lib/auth";

export const metadata = { title: "Verify email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await consumeActionToken(token, "EMAIL_VERIFY");

  let verified = false;
  if (record) {
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    verified = true;
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-10 text-center">
        <p className="text-3xl">{verified ? "✦" : "—"}</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl">
          {verified ? "Email verified" : "Link expired"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {verified
            ? "Your email is confirmed. Welcome to Noor Bridal — sign in to start your made-to-order journey."
            : "This verification link is invalid, already used, or expired. Register again or resend the link from the sign-in page."}
        </p>
        <Link href="/login" className="btn-primary mt-8">Continue to sign in</Link>
      </div>
    </div>
  );
}
