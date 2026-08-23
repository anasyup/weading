"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { convertMarkup } from "@/lib/pricing";

export type VariantOption = {
  id: string;
  sku: string;
  label: string;
  priceUsd: number | null; // null → inherit product price
  salePriceUsd: number | null;
};

export type CustomizationGroup = {
  optionId: string;
  optionName: string;
  values: { id: string; name: string; additionalPrice: number }[];
};

export type MeasurementFieldDef = {
  id: string;
  fieldKey: string;
  fieldName: string;
  required: boolean;
};

export default function AddToCartForm({
  productId,
  slug,
  productType,
  leadMin,
  leadMax,
  variants,
  customizations,
  measurementFields,
  baseEffectiveUsd,
  countryPriceMinor,
  currency,
  pkrPerUsd,
  isLoggedIn,
}: {
  productId: string;
  slug: string;
  productType: string;
  leadMin: number;
  leadMax: number;
  variants: VariantOption[];
  customizations: CustomizationGroup[];
  measurementFields: MeasurementFieldDef[];
  baseEffectiveUsd: number;
  countryPriceMinor: number | null;
  currency: string;
  pkrPerUsd: number;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(customizations.map((g) => [g.optionId, g.values[0]?.id ?? ""]))
  );
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(productType === "MADE_TO_ORDER");

  const isMTO = productType === "MADE_TO_ORDER";

  const { unitPrice, markup } = useMemo(() => {
    const variant = variants.find((v) => v.id === variantId);
    const baseUnit =
      countryPriceMinor != null
        ? countryPriceMinor
        : variant?.salePriceUsd ?? variant?.priceUsd ?? baseEffectiveUsd;

    let markupUsd = 0;
    for (const group of customizations) {
      const selected = group.values.find((v) => v.id === selections[group.optionId]);
      if (selected) markupUsd += selected.additionalPrice;
    }
    return {
      unitPrice: baseUnit + convertMarkup(markupUsd, currency, pkrPerUsd),
      markup: markupUsd,
    };
  }, [variantId, selections, variants, customizations, countryPriceMinor, baseEffectiveUsd, currency, pkrPerUsd]);

  async function addToCart() {
    setError(null);

    if (isMTO) {
      const missing = measurementFields.filter(
        (f) => f.required && !(measurements[f.fieldKey]?.trim())
      );
      if (missing.length) {
        setShowMeasurements(true);
        setError(`Please complete: ${missing.map((f) => f.fieldName).join(", ")}`);
        return;
      }
    }

    if (!isLoggedIn) {
      router.push(`/login?next=/products/${slug}`);
      return;
    }

    setStatus("loading");
    const customizationData = customizations.map((g) => {
      const value = g.values.find((v) => v.id === selections[g.optionId]);
      return { option: g.optionName, value: value?.name ?? "", additionalPrice: value?.additionalPrice ?? 0 };
    });

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          quantity: qty,
          customizationData: customizationData.length ? customizationData : undefined,
          measurementData: isMTO
            ? { unit, fields: measurementFields.map((f) => ({ name: f.fieldName, key: f.fieldKey, value: measurements[f.fieldKey] ?? "" })) }
            : undefined,
        }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/products/${slug}`);
        return;
      }
      if (!res.ok) throw new Error("failed");
      setStatus("added");
      router.refresh();
    } catch {
      setStatus("error");
      setError("Could not add to cart. Please try again.");
    }
  }

  return (
    <div className="space-y-7">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-display)] text-3xl">
          {formatMoney(unitPrice * qty, currency)}
        </span>
        {qty > 1 && <span className="text-xs text-stone-500">{formatMoney(unitPrice, currency)} each</span>}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div>
          <p className="label">Select option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={`border px-4 py-2.5 text-xs transition ${
                  variantId === v.id
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-white hover:border-gold"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-stone-400">
            SKU: {variants.find((v) => v.id === variantId)?.sku ?? "—"}
          </p>
        </div>
      )}

      {/* Customizations */}
      {customizations.map((group) => (
        <div key={group.optionId}>
          <p className="label">{group.optionName}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const active = selections[group.optionId] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => setSelections((s) => ({ ...s, [group.optionId]: value.id }))}
                  className={`border px-4 py-2.5 text-xs transition ${
                    active ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-gold"
                  }`}
                >
                  {value.name}
                  {value.additionalPrice > 0 && (
                    <span className={active ? " ml-1.5 text-gold" : "ml-1.5 text-gold-deep"}>
                      +{formatMoney(convertMarkup(value.additionalPrice, currency, pkrPerUsd), currency)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Measurements */}
      {isMTO && (
        <div className="border border-gold/50 bg-white">
          <button
            type="button"
            onClick={() => setShowMeasurements((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <span>
              <span className="label mb-0">Your measurements</span>
              <span className="mt-1 block text-[11px] text-stone-500">
                Required · used only for this order
              </span>
            </span>
            <span className="text-xs text-gold-deep">{showMeasurements ? "Hide −" : "Show +"}</span>
          </button>
          {showMeasurements && (
            <div className="border-t border-line px-4 py-4">
              <div className="mb-4 flex items-center gap-3 text-[11px]">
                <span className="text-stone-500">Units:</span>
                {(["in", "cm"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`border px-3 py-1 uppercase tracking-widest ${
                      unit === u ? "border-ink bg-ink text-cream" : "border-line bg-white"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {measurementFields.map((field) => (
                  <div key={field.id}>
                    <label className="label">
                      {field.fieldName}
                      {field.required && <span className="text-rose"> *</span>}
                    </label>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={measurements[field.fieldKey] ?? ""}
                      onChange={(e) =>
                        setMeasurements((m) => ({ ...m, [field.fieldKey]: e.target.value }))
                      }
                      placeholder={`${unit === "in" ? "e.g. 34" : "e.g. 86"}`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                How to measure: measure over close-fitting clothes with a soft tape. Bust at the fullest
                point, waist at the narrowest, hips at the fullest. Provide the measurements your tailor
                would use — we will follow them exactly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Qty + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-line bg-white">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3.5 py-3 text-sm hover:text-gold-deep">−</button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(9, q + 1))} className="px-3.5 py-3 text-sm hover:text-gold-deep">+</button>
        </div>
        <button type="button" onClick={addToCart} disabled={status === "loading"} className="btn-gold flex-1 sm:flex-none">
          {status === "loading" ? "Adding…" : "Add to Cart"}
        </button>
        {status === "added" && (
          <Link href="/cart" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep underline">
            View cart →
          </Link>
        )}
      </div>

      {error && <p className="border border-rose/40 bg-rose/5 px-3 py-2 text-xs text-rose">{error}</p>}

      {/* Lead time */}
      {isMTO && (
        <div className="flex items-start gap-3 border border-line bg-sand px-4 py-3.5">
          <span className="mt-0.5">✦</span>
          <p className="text-xs leading-relaxed text-stone-700">
            <strong className="font-semibold">Made to order just for you.</strong> This piece is handcrafted
            to your measurements in approximately <strong>{leadMin}–{leadMax} days</strong>, then shipped to
            your country. You&apos;ll see an estimated delivery date on your order once it&apos;s confirmed.
          </p>
        </div>
      )}
    </div>
  );
}
