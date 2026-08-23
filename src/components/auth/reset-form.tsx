"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "@/app/(auth)/actions";

const initial: AuthState = {};

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Set a new password</h1>

        {state.ok ? (
          <div className="mt-6 space-y-5">
            <p className="text-sm leading-relaxed text-stone-600">{state.message}</p>
            <Link href="/login" className="btn-primary w-full">Sign in</Link>
          </div>
        ) : (
          <form action={action} className="mt-8 space-y-5">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label" htmlFor="password">New password</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
            </div>
            {state.error && (
              <p className="border border-rose/40 bg-rose/5 px-3 py-2 text-xs text-rose">{state.error}</p>
            )}
            <button disabled={pending} className="btn-primary w-full">
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
