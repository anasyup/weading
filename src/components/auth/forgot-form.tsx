"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestResetAction, type AuthState } from "@/app/(auth)/actions";

const initial: AuthState = {};

export default function ForgotForm() {
  const [state, action, pending] = useActionState(requestResetAction, initial);

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Forgot password</h1>

        {state.ok ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-stone-600">{state.message}</p>
            {state.devLink && (
              <div className="border border-gold/40 bg-sand px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Dev preview link
                </p>
                <Link href={state.devLink} className="mt-1 block break-all text-xs text-gold-deep underline">
                  {state.devLink}
                </Link>
              </div>
            )}
            <Link href="/login" className="btn-primary w-full">Back to sign in</Link>
          </div>
        ) : (
          <form action={action} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" />
            </div>
            <button disabled={pending} className="btn-primary w-full">
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
