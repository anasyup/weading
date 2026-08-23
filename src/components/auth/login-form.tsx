"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, resendVerificationAction, type AuthState } from "@/app/(auth)/actions";

const initial: AuthState = {};

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [resetState, resendAction, resendPending] = useActionState(resendVerificationAction, initial);
  const needsVerification = (state as AuthState & { needsVerification?: boolean }).needsVerification;

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Sign in</h1>

        <form action={action} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
          </div>

          {state.error && (
            <p className="border border-rose/40 bg-rose/5 px-3 py-2 text-xs text-rose">{state.error}</p>
          )}

          <button disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {needsVerification && (
          <form action={resendAction} className="mt-4 border border-gold/40 bg-sand px-3 py-3">
            <input type="hidden" name="email" value={(state as AuthState & { email?: string }).email ?? ""} />
            <button disabled={resendPending} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep underline">
              {resendPending ? "Sending…" : "Resend verification email"}
            </button>
            {resetState.devLink && (
              <p className="mt-2 break-all text-[11px] text-stone-500">
                Dev preview link: <Link href={resetState.devLink} className="text-gold-deep underline">{resetState.devLink}</Link>
              </p>
            )}
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-[0.14em]">
          <Link href="/forgot-password" className="text-stone-500 hover:text-ink">Forgot password?</Link>
          <Link href="/register" className="text-gold-deep hover:underline">Create account</Link>
        </div>
      </div>

      <div className="mt-4 border border-line bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-stone-500">
        <p className="font-semibold uppercase tracking-[0.14em] text-stone-600">Dev preview accounts</p>
        <p className="mt-1">Admin · admin@noorbridal.test / Admin#2026</p>
        <p>Customer · sarah@example.com / Test#1234</p>
      </div>
    </div>
  );
}
