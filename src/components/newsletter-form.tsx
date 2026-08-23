"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="border border-gold/40 bg-white px-3 py-2.5 text-xs text-gold-deep">
        Thank you — you&apos;re on the list. ✦
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="w-full border border-line bg-white px-3 py-2.5 text-xs outline-none focus:border-gold"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="shrink-0 bg-ink px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-stone-700"
      >
        {state === "loading" ? "…" : "Join"}
      </button>
    </form>
  );
}
