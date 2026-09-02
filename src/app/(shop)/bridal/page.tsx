import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import ProductCard from "@/components/product-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bridal — New Season",
  description:
    "New season bridal couture — sculpted, restrained, bold, unscripted. Handcrafted in Pakistan, made to order and shipped across the USA.",
};

export default async function BridalPage() {
  const country = await getCountry();

  // Latest arrivals — newest first
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      countries: { some: { countryId: country.id } },
    },
    include: { prices: true, media: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-cream">
      {/* ============================================================ */}
      {/* HERO — KYHA style: full-bleed portrait, dark overlay,        */}
      {/* NEW SEASON serif heading, dual CTAs                          */}
      {/* ============================================================ */}
      <section className="relative flex min-h-[72vh] items-center justify-center overflow-hidden lg:h-[92vh] lg:min-h-[560px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/p-red-lehenga.jpg"
          alt="New season crimson bridal lehenga with hand embroidery"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Dark overlays for high contrast */}
        <div className="absolute inset-0 bg-ink/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-ink/30" />

        <div className="relative z-10 max-w-3xl px-6 text-center text-cream">
          <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/80">
            The new bridal edit
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-medium uppercase leading-[1.05] tracking-[0.16em] sm:text-7xl">
            New Season
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed tracking-wide text-cream/85">
            Sculpted, restrained, bold, unscripted. Discover the latest arrivals.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Primary — filled */}
            <Link
              href="#latest-arrivals"
              className="inline-block bg-cream px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-ink transition-colors hover:bg-gold hover:text-cream"
            >
              Explore Now
            </Link>
            {/* Secondary — outlined */}
            <Link
              href="/support"
              className="inline-block border border-cream/80 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-cream transition-colors hover:bg-cream hover:text-ink"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SUB-HEADING — centered uppercase LATEST ARRIVALS             */}
      {/* ============================================================ */}
      <section id="latest-arrivals" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 text-center lg:pt-24">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-light uppercase tracking-[0.18em] text-ink sm:text-5xl">
            Latest Arrivals
          </h2>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.3em] text-stone-500">
            {products.length} {products.length === 1 ? "piece" : "pieces"} · made to order in 30–45 days
          </p>

          {/* Product grid */}
          <div className="mt-14 pb-4 text-left">
            {products.length === 0 ? (
              <div className="border border-line bg-white px-6 py-16 text-center">
                <p className="font-[family-name:var(--font-display)] text-xl">New pieces arriving soon</p>
                <p className="mt-2 text-sm text-stone-600">
                  The next edit is being hand-finished — check back shortly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} country={country} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
