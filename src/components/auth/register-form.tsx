"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "@/app/(auth)/actions";

const initial: AuthState = {};

export default function RegisterForm({ countries }: { countries: { id: string; name: string; currency: string }[] }) {
  const [state, action, pending] = useActionState(registerAction, initial);

  if (state.ok) {
    return (
      <div className="w-full max-w-lg card p-10 text-center">
        <p className="text-3xl">✦</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl">Check your inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{state.message}</p>
        {state.devLink && (
          <div className="mt-6 border border-gold/40 bg-sand px-4 py-3 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Dev preview (emails are written to the in-app outbox)
            </p>
            <Link href={state.devLink} className="mt-1 block break-all text-xs text-gold-deep underline">
              {state.devLink}
            </Link>
          </div>
        )}
        <Link href="/login" className="btn-primary mt-8">Continue to sign in</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="card p-8">
        <p className="eyebrow">Join the atelier</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Create your account</h1>
        <p className="mt-2 text-xs text-stone-500">
          An account is required to order — every piece is made to your measurements.
        </p>

        <form action={action} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="firstName">First name *</label>
            <input id="firstName" name="firstName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="lastName">Last name *</label>
            <input id="lastName" name="lastName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="whatsapp">WhatsApp number *</label>
            <input id="whatsapp" name="whatsapp" required placeholder="+1 555 000 1234" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="password">Password * <span className="normal-case text-stone-400">(min. 8 characters)</span></label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>

          <div className="sm:col-span-2 mt-2 border-t border-line pt-5">
            <p className="label">Delivery address</p>
          </div>
          <div>
            <label className="label" htmlFor="countryId">Country *</label>
            <select id="countryId" name="countryId" required className="input">
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="city">City *</label>
            <input id="city" name="city" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="addressLine1">Address line 1 *</label>
            <input id="addressLine1" name="addressLine1" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="addressLine2">Address line 2</label>
            <input id="addressLine2" name="addressLine2" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="state">State / Province</label>
            <input id="state" name="state" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="postalCode">Postal code</label>
            <input id="postalCode" name="postalCode" className="input" />
          </div>

          {state.error && (
            <p className="sm:col-span-2 border border-rose/40 bg-rose/5 px-3 py-2 text-xs text-rose">{state.error}</p>
          )}

          <button disabled={pending} className="btn-primary sm:col-span-2">
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.14em] text-stone-500">
          Already have an account? <Link href="/login" className="text-gold-deep hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
