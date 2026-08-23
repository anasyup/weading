"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const LABELS: Record<string, string> = { US: "🇺🇸 US · USD", CA: "🇨🇦 CA · USD", PK: "🇵🇰 PK · PKR" };

export default function CountrySelect({ current }: { current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(current);

  async function change(code: string) {
    setValue(code);
    await fetch("/api/country", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    start(() => router.refresh());
  }

  return (
    <select
      aria-label="Shipping destination"
      value={value}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      className="cursor-pointer border border-cream/30 bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream outline-none"
    >
      {Object.entries(LABELS).map(([code, label]) => (
        <option key={code} value={code} className="text-ink">
          {label}
        </option>
      ))}
    </select>
  );
}
