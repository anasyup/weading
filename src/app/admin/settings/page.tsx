import { prisma } from "@/lib/db";
import { getSettingsMap } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { saveShipping, saveTax, saveGeneral } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [countries, settings] = await Promise.all([
    prisma.country.findMany({
      include: {
        shippingRules: true,
        taxRules: { where: { status: "ACTIVE" }, orderBy: { effectiveFrom: "desc" }, take: 1 },
      },
      orderBy: { sortOrder: "asc" },
    }),
    getSettingsMap(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <p className="eyebrow">Platform</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-stone-600">
          Everything here is data — no code changes needed to run the business day to day.
        </p>
      </div>

      {/* General */}
      <section className="border border-line bg-white p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">General</h2>
        <form action={saveGeneral} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="storeName">Store name</label>
            <input id="storeName" name="storeName" defaultValue={settings["store.name"] ?? "Noor Bridal"} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="supportEmail">Support email</label>
            <input id="supportEmail" name="supportEmail" defaultValue={settings["support.email"] ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="supportWhatsapp">Support WhatsApp</label>
            <input id="supportWhatsapp" name="supportWhatsapp" defaultValue={settings["support.whatsapp"] ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="pkrRate">PKR per 1 USD (markup conversion)</label>
            <input id="pkrRate" name="pkrRate" defaultValue={settings["currency.pkr_per_usd"] ?? "280"} className="input" inputMode="numeric" />
          </div>
          <div>
            <label className="label" htmlFor="prodMin">Default production days (min)</label>
            <input id="prodMin" name="prodMin" defaultValue={settings["production.default_min_days"] ?? "30"} className="input" inputMode="numeric" />
          </div>
          <div>
            <label className="label" htmlFor="prodMax">Default production days (max)</label>
            <input id="prodMax" name="prodMax" defaultValue={settings["production.default_max_days"] ?? "45"} className="input" inputMode="numeric" />
          </div>
          <div>
            <label className="label" htmlFor="retention">Measurement retention (days after delivery)</label>
            <input id="retention" name="retention" defaultValue={settings["measurements.retention_days"] ?? "90"} className="input" inputMode="numeric" />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary btn-sm">Save general settings</button>
          </div>
        </form>
      </section>

      {/* Shipping */}
      <section className="border border-line bg-white p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Shipping rates (flat, per country)</h2>
        <form action={saveShipping} className="mt-5 space-y-4">
          {countries.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_120px_200px] items-end gap-3">
              <div>
                <label className="label">{c.name} ({c.currency})</label>
                <input
                  name={`shipping_${c.code}`}
                  defaultValue={c.shippingRules[0] ? (c.shippingRules[0].price / 100).toString() : ""}
                  className="input"
                  inputMode="decimal"
                  placeholder="35"
                />
              </div>
              <div>
                <label className="label">Days min</label>
                <input name={`daysMin_${c.code}`} defaultValue={c.shippingRules[0]?.estDaysMin ?? 5} className="input" inputMode="numeric" />
              </div>
              <div>
                <label className="label">Days max</label>
                <input name={`daysMax_${c.code}`} defaultValue={c.shippingRules[0]?.estDaysMax ?? 10} className="input" inputMode="numeric" />
              </div>
            </div>
          ))}
          <button className="btn-primary btn-sm">Save shipping rates</button>
        </form>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          Current: {countries.map((c) => `${c.code} ${c.shippingRules[0] ? formatMoney(c.shippingRules[0].price, c.currency) : "—"}`).join(" · ")}.
          Carrier APIs arrive in Phase 2 — the schema is already provider-ready.
        </p>
      </section>

      {/* Tax */}
      <section className="border border-line bg-white p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Tax rates</h2>
        <form action={saveTax} className="mt-5 grid gap-4 sm:grid-cols-3">
          {countries.map((c) => (
            <div key={c.id}>
              <label className="label">{c.name} (%)</label>
              <input
                name={`tax_${c.code}`}
                defaultValue={c.taxRules[0] ? (c.taxRules[0].rateBps / 100).toString() : "0"}
                className="input"
                inputMode="decimal"
                placeholder="0"
              />
            </div>
          ))}
          <div className="sm:col-span-3">
            <button className="btn-primary btn-sm">Save tax rates</button>
          </div>
        </form>
        <p className="mt-3 border border-gold/40 bg-sand/50 px-3 py-2 text-[11px] leading-relaxed text-gold-deep">
          Placeholder rates — validate with your accountant/tax advisor before selling (see MASTER_SPEC §9).
          US state-level rates are supported later via the region field.
        </p>
      </section>

      {/* Payment */}
      <section className="border border-line bg-white p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Payment gateway</h2>
        <div className="mt-4 flex items-center justify-between border border-line bg-sand/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Test Gateway (Sandbox)</p>
            <p className="text-[11px] text-stone-500">Provider: MOCK · Default · US, CA, PK</p>
          </div>
          <span className="badge border-gold/50 bg-white text-gold-deep">Active</span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          Checkout runs through the gateway adapter. When you choose a real provider (Stripe for US/CA,
          PayFast/Safepay for PK, etc.) it&apos;s a new row + credentials — no checkout rewrite.
        </p>
      </section>

      {/* Backup */}
      <section className="border border-line bg-white p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Backup status</h2>
        <p className="mt-3 text-sm text-stone-600">
          Daily automated database backup · retention 14 days · restore tested.
        </p>
        <p className="mt-1 text-[11px] text-stone-500">
          Dev preview: SQLite file snapshot. Production: managed PostgreSQL PITR + off-site object storage.
        </p>
      </section>
    </div>
  );
}
