import Link from "next/link";
import Reveal from "@/components/reveal";
import { OCCASIONS, PRIMARY_OCCASIONS } from "@/lib/occasions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Occasions — Nikkah, Mehndi, Baraat, Walima",
  description:
    "Shop handcrafted Pakistani bridal couture by occasion — Nikkah, Mehndi, Baraat, Walima, party and wedding-guest wear, made to order and shipped across the USA.",
};

const PRIMARY = PRIMARY_OCCASIONS.map((slug) => OCCASIONS.find((o) => o.slug === slug)!);
const SECONDARY = OCCASIONS.filter((o) => !(PRIMARY_OCCASIONS as readonly string[]).includes(o.slug));

export default function OccasionsPage() {
  return (
    <div className="pb-16">
      {/* Header */}
      <header className="mx-auto max-w-[1600px] border-b border-line px-4 pb-8 pt-7 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow">Shop by Occasion</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl">
            Every celebration, dressed
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">
            From the first dholki to the walima reception — handcrafted Pakistani couture for every
            moment of the wedding.
          </p>
        </Reveal>
      </header>

      {/* Primary occasions */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {PRIMARY.map((o, i) => (
            <Reveal key={o.slug} delay={i * 110}>
              <Link href={`/occasions/${o.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.img}
                  alt={`${o.name} — Pakistani bridal couture`}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="media-zoom h-full w-full object-cover"
                  style={o.position ? { objectPosition: o.position } : undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-cream sm:p-6">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-light tracking-wide sm:text-[1.7rem]">
                    {o.name}
                  </h2>
                  <p className="mt-1 text-[9px] font-light uppercase tracking-[0.22em] text-cream/75 sm:text-[10px]">
                    {o.line}
                  </p>
                  <span className="nav-link mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.24em] text-cream">
                    Explore →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Secondary occasions */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal className="mb-10">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-light tracking-wide sm:text-4xl">
            And everyone around her
          </h2>
        </Reveal>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY.map((o, i) => (
            <Reveal key={o.slug} delay={i * 80} className="h-full">
              <Link
                href={`/occasions/${o.slug}`}
                className="group relative flex h-44 items-end overflow-hidden bg-sand sm:h-56"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.img}
                  alt={o.name}
                  loading="lazy"
                  className="media-zoom absolute inset-0 h-full w-full object-cover"
                  style={o.position ? { objectPosition: o.position } : undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/15 to-transparent" />
                <div className="relative p-6 text-cream">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-light tracking-wide sm:text-2xl">
                    {o.name}
                  </h3>
                  <p className="mt-1 text-[9px] font-light uppercase tracking-[0.2em] text-cream/75">{o.line}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line py-12 text-center sm:py-16">
        <Reveal>
          <p className="eyebrow">The whole wardrobe</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
            Prefer to see everything together?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl px-6 text-sm leading-6 text-stone-600">
            Browse the full boutique — every piece handmade to order and shipped across the USA.
          </p>
          <Link href="/shop" className="btn-primary mt-7">
            Shop all bridal
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
