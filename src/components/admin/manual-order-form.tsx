"use client";

import { useMemo, useState } from "react";
import { createManualOrder } from "@/app/admin/orders/new/actions";
import { formatMoney } from "@/lib/money";

type CustomerOpt = { id: string; label: string };
type VariantOpt = { id: string; productId: string; label: string; priceUsd: number | null };
type ProductOpt = {
  id: string;
  name: string;
  basePrice: number;
  salePrice: number | null;
  prices: { countryId: string; price: number; salePrice: number | null }[];
  customizations: { optionId: string; optionName: string; values: { id: string; name: string; additionalPrice: number }[] }[];
};
type CountryOpt = { id: string; code: string; name: string; currency: string };
type FieldDef = { id: string; fieldKey: string; fieldName: string };

export default function ManualOrderForm({
  customers,
  products,
  variants,
  countries,
  measurementFields,
  shippingByCountry,
  taxBpsByCountry,
}: {
  customers: CustomerOpt[];
  products: ProductOpt[];
  variants: VariantOpt[];
  countries: CountryOpt[];
  measurementFields: FieldDef[];
  shippingByCountry: Record<string, number>;
  taxBpsByCountry: Record<string, number>;
}) {
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id ?? "NEW");
  const [countryCode, setCountryCode] = useState(countries[0]?.code ?? "US");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [variantId, setVariantId] = useState<string>("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [unitPriceMajor, setUnitPriceMajor] = useState<string>("");
  const [shippingMajor, setShippingMajor] = useState<string>("");
  const [discountMajor, setDiscountMajor] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const country = countries.find((c) => c.code === countryCode) ?? countries[0];
  const product = products.find((p) => p.id === productId);
  const productVariants = variants.filter((v) => v.productId === productId);
  const variant = productVariants.find((v) => v.id === variantId);

  const computed = useMemo(() => {
    if (!product || !country) return { unit: 0, shipping: 0, tax: 0, total: 0 };
    const cp = product.prices.find((p) => p.countryId === country.id);
    const list = cp ? (cp.salePrice ?? cp.price) : (variant?.priceUsd ?? product.salePrice ?? product.basePrice);
    let markup = 0;
    for (const group of product.customizations) {
      const sel = group.values.find((v) => v.id === selections[group.optionId]);
      if (sel) markup += sel.additionalPrice;
    }
    if (country.currency === "PKR") markup = Math.round((markup * 280) / 100) * 100;
    const unit = list + markup;
    const shipping = shippingByCountry[country.code] ?? 0;
    const subtotal = unit * qty;
    const discount = Math.round((parseFloat(discountMajor || "0") || 0) * 100);
    const tax = Math.round(((subtotal - discount) * (taxBpsByCountry[country.code] ?? 0)) / 10000);
    return { unit, shipping, tax, total: subtotal - discount + shipping + tax };
  }, [product, country, variant, selections, qty, discountMajor, shippingByCountry, taxBpsByCountry]);

  const customizationData = useMemo(
    () =>
      (product?.customizations ?? [])
        .filter((g) => selections[g.optionId])
        .map((g) => {
          const value = g.values.find((v) => v.id === selections[g.optionId])!;
          return { option: g.optionName, value: value.name, additionalPrice: value.additionalPrice };
        }),
    [product, selections]
  );

  const measurementData = useMemo(
    () => ({ unit: "in", fields: measurementFields.map((f) => ({ name: f.fieldName, key: f.fieldKey, value: measurements[f.fieldKey] ?? "" })) }),
    [measurements, measurementFields]
  );

  return (
    <form action={createManualOrder} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Hidden serialized state */}
      <input type="hidden" name="customizationData" value={JSON.stringify(customizationData)} />
      <input type="hidden" name="measurementData" value={JSON.stringify(measurementData)} />
      <input type="hidden" name="countryCode" value={countryCode} />
      <input type="hidden" name="customerId" value={customerId} />

      <div className="space-y-6">
        {/* Customer */}
        <section className="border border-line bg-white p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Customer</h2>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
            <option value="NEW">+ New customer (Instagram / WhatsApp)</option>
          </select>

          {customerId === "NEW" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="newFirstName" placeholder="First name *" className="input" required />
              <input name="newLastName" placeholder="Last name" className="input" />
              <input name="newEmail" type="email" placeholder="Email *" className="input" required />
              <input name="newWhatsapp" placeholder="WhatsApp" className="input" />
              <select name="newCountry" className="input" defaultValue={countryCode}>
                {countries.map((c) => (
                  <option key={c.id} value={c.code}>{c.name}</option>
                ))}
              </select>
              <input name="newCity" placeholder="City" className="input" />
              <input name="newAddress1" placeholder="Address line" className="input sm:col-span-2" />
              <p className="text-[10px] text-stone-400 sm:col-span-2">
                A temporary password is set automatically; the customer can reset it via &ldquo;Forgot password&rdquo;.
              </p>
            </div>
          )}
        </section>

        {/* Product */}
        <section className="border border-line bg-white p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Product</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="input"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setVariantId("");
                setSelections({});
                setUnitPriceMajor("");
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select className="input" value={variantId} onChange={(e) => { setVariantId(e.target.value); setUnitPriceMajor(""); }}>
              <option value="">Base product (no variant)</option>
              {productVariants.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          {product?.customizations.map((group) => (
            <div key={group.optionId} className="mt-4">
              <p className="label">{group.optionName}</p>
              <div className="flex flex-wrap gap-2">
                {group.values.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelections((s) => ({ ...s, [group.optionId]: v.id }))}
                    className={`border px-3 py-2 text-xs ${selections[group.optionId] === v.id ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Measurements */}
        <section className="border border-line bg-white p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Measurements (inches)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {measurementFields.map((f) => (
              <div key={f.id}>
                <label className="label">{f.fieldName}</label>
                <input
                  className="input"
                  inputMode="decimal"
                  value={measurements[f.fieldKey] ?? ""}
                  onChange={(e) => setMeasurements((m) => ({ ...m, [f.fieldKey]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="border border-line bg-white p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Pricing</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Country</label>
              <select
                className="input"
                value={countryCode}
                onChange={(e) => { setCountryCode(e.target.value); setUnitPriceMajor(""); setShippingMajor(""); }}
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.code}>{c.name} ({c.currency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantity</label>
              <input
                type="number" min={1} max={9} className="input"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div>
              <label className="label">Unit price (computed default)</label>
              <input
                className="input"
                inputMode="decimal"
                placeholder={(computed.unit / 100).toFixed(2)}
                value={unitPriceMajor}
                onChange={(e) => setUnitPriceMajor(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Shipping (default from rules)</label>
              <input
                className="input"
                inputMode="decimal"
                placeholder={(computed.shipping / 100).toFixed(2)}
                value={shippingMajor}
                onChange={(e) => setShippingMajor(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Discount amount</label>
              <input className="input" inputMode="decimal" value={discountMajor} onChange={(e) => setDiscountMajor(e.target.value)} />
            </div>
            <div>
              <label className="label">Payment status</label>
              <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="PAID">Paid (creates payment + invoice)</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Sidebar summary */}
      <aside className="h-fit space-y-4 border border-line bg-white p-5 lg:sticky lg:top-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Summary</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">Unit</dt><dd>{formatMoney(unitPriceMajor ? Math.round(parseFloat(unitPriceMajor) * 100) : computed.unit, country?.currency ?? "USD")}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">Subtotal (×{qty})</dt><dd>{formatMoney((unitPriceMajor ? Math.round(parseFloat(unitPriceMajor) * 100) : computed.unit) * qty, country?.currency ?? "USD")}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">Shipping</dt><dd>{formatMoney(shippingMajor ? Math.round(parseFloat(shippingMajor) * 100) : computed.shipping, country?.currency ?? "USD")}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">Tax</dt><dd>{formatMoney(computed.tax, country?.currency ?? "USD")}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(computed.total, country?.currency ?? "USD")}</dd>
          </div>
        </dl>
        <div className="border-t border-line pt-4">
          <label className="label">Estimated delivery (optional)</label>
          <input type="date" name="estimatedDelivery" className="input" />
        </div>
        <div>
          <label className="label">Note</label>
          <textarea name="note" rows={2} className="input" placeholder="Customer requests…" />
        </div>
        <div>
          <label className="label">Transaction ID (if already paid)</label>
          <input name="transactionId" className="input" placeholder="e.g. bank transfer ref" />
        </div>
        <button className="btn-gold w-full">Create manual order</button>
      </aside>
    </form>
  );
}
