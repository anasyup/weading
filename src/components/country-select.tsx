"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";

const LABELS: Record<string, string> = { US: "USD $", PK: "PKR ₨" };

export default function CountrySelect({
  current,
  minimal = false,
}: {
  current: string;
  minimal?: boolean;
}) {
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
      aria-label="Currency"
      value={value}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      className={
        minimal
          ? "cursor-pointer border-transparent bg-transparent px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] outline-none"
          : "cursor-pointer border border-cream/30 bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream outline-none"
      }
    >
      {Object.entries(LABELS).map(([code, label]) => (
        <option key={code} value={code} className="text-ink">
          {label}
        </option>
      ))}
    </select>
  );
}
