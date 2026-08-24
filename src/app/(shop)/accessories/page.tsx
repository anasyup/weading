import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCountry } from "@/lib/country";
import ProductCard from "@/components/product-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accessories — Bridal Finishing Pieces",
  description: "Veils, sleeves, capes and finishing pieces for your bridal look.",
};

const ACCESSORY_SECTIONS = [
  { title: "Veils", match: /veil|tulle|cathedral|blusher/i },
  { title: "Sleeves", match: /sleeve|cuff/i },
  { title: "Bows", match: /bow|ribbon/i },
  { title: "Capes & Cover-Ups", match: /cape|bolero|cover|jacket/i },
  { title: "Gloves", match: /glove/i },
  { title: "Bridal Finishing Pieces", match: /head|hair|jewel|belt|bag|garter/i },
] as const;

function sectionFor(name: string, description: string) {
  const text = `${name} ${description}`;
  return ACCESSORY_SECTIONS.find((section) => section.match.test(text))?.title ?? "Bridal Finishing Pieces";
}

// A complete editorial collection is visible from day one. Live accessory
// inventory from Admin replaces this edit automatically once it is added.
const CURATED_ACCESSORIES = [
  { section: "Veils", name: "Celeste Cathedral Veil", detail: "Fine Italian tulle", price: "From $260", image: "/uploads/lux-cat-accessories.jpg", position: "28% 20%" },
  { section: "Veils", name: "Pearl-Edge Veil", detail: "Hand-sewn pearl trim", price: "From $180", image: "/uploads/lux-cat-accessories.jpg", position: "52% 48%" },
  { section: "Veils", name: "Étoile Blusher Veil", detail: "Soft double-layer tulle", price: "From $150", image: "/uploads/lux-p-aline.jpg", position: "50% 20%" },
  { section: "Veils", name: "Luna Drop Veil", detail: "Lightweight silk tulle", price: "From $210", image: "/uploads/lux-p-slip.jpg", position: "50% 18%" },
  { section: "Sleeves & Gloves", name: "Ivory Silk Gloves", detail: "Opera length stretch silk", price: "From $75", image: "/uploads/lux-d-corset.jpg", position: "48% 35%" },
  { section: "Sleeves & Gloves", name: "Pearl Cuff Sleeves", detail: "Detachable pearl detailing", price: "From $110", image: "/uploads/p-ivory-gown.jpg", position: "50% 30%" },
  { section: "Sleeves & Gloves", name: "Chantilly Lace Gloves", detail: "Fine floral lace", price: "From $90", image: "/uploads/lux-d-mermaid.jpg", position: "50% 26%" },
  { section: "Sleeves & Gloves", name: "Satin Bridal Sleeves", detail: "Made to your measurement", price: "From $85", image: "/uploads/lux-d-slip.jpg", position: "52% 32%" },
  { section: "Capes & Cover-Ups", name: "Aurora Tulle Cape", detail: "Sheer, flowing and weightless", price: "From $240", image: "/uploads/lux-hero.jpg", position: "52% 28%" },
  { section: "Capes & Cover-Ups", name: "Pearl Shoulder Cape", detail: "Hand-embellished tulle", price: "From $280", image: "/uploads/lux-craft.jpg", position: "46% 35%" },
  { section: "Capes & Cover-Ups", name: "Silk Organza Bolero", detail: "Soft structured finish", price: "From $195", image: "/uploads/p-blush-organza.jpg", position: "50% 25%" },
  { section: "Capes & Cover-Ups", name: "Eloise Bridal Cape", detail: "Draped cathedral length", price: "From $310", image: "/uploads/p-emerald-zardozi.jpg", position: "50% 25%" },
  { section: "Hair & Jewellery", name: "Pearl Drop Earrings", detail: "Freshwater pearl & gold vermeil", price: "From $95", image: "/uploads/lux-cat-accessories.jpg", position: "50% 67%" },
  { section: "Hair & Jewellery", name: "Celestial Hair Pins", detail: "Set of six, hand-finished", price: "From $65", image: "/uploads/lux-cat-accessories.jpg", position: "43% 55%" },
  { section: "Hair & Jewellery", name: "Bridal Pearl Comb", detail: "Sculpted freshwater pearls", price: "From $120", image: "/uploads/lux-cat-accessories.jpg", position: "60% 62%" },
  { section: "Hair & Jewellery", name: "Lustre Headband", detail: "Crystal and pearl detail", price: "From $140", image: "/uploads/lux-cat-accessories.jpg", position: "35% 42%" },
  { section: "Bridal Details", name: "Silk Statement Bow", detail: "Long-tail ivory silk", price: "From $85", image: "/uploads/lux-p-corset.jpg", position: "50% 25%" },
  { section: "Bridal Details", name: "Pearl Bridal Belt", detail: "Hand-beaded finishing piece", price: "From $130", image: "/uploads/p-maroon-jamawar.jpg", position: "50% 30%" },
  { section: "Bridal Details", name: "Lace Bridal Garters", detail: "A delicate pair in ivory", price: "From $55", image: "/uploads/lux-p-mermaid.jpg", position: "50% 28%" },
  { section: "Bridal Details", name: "Satin Bridal Pouch", detail: "Pearl clasp and silk lining", price: "From $105", image: "/uploads/lux-p-slip.jpg", position: "48% 68%" },
] as const;

const CURATED_SECTIONS = ["Veils", "Sleeves & Gloves", "Capes & Cover-Ups", "Hair & Jewellery", "Bridal Details"] as const;

export default async function AccessoriesPage() {
  const country = await getCountry();
  const accessories = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      category: { is: { slug: "accessories" } },
      countries: { some: { countryId: country.id } },
    },
    include: { prices: true, media: true },
    orderBy: { createdAt: "desc" },
  });

  const grouped = ACCESSORY_SECTIONS.map((section) => ({
    title: section.title,
    products: accessories.filter((product) => sectionFor(product.name, product.description) === section.title),
  })).filter((section) => section.products.length > 0);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
      <div className="border-b border-line pb-6 text-center">
        <p className="eyebrow">Complete the look</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl">Accessories</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">
          The finishing pieces that make a bridal look entirely your own.
        </p>
      </div>

      {grouped.length > 0 ? (
        <div className="divide-y divide-line">
          {grouped.map((section) => (
            <section key={section.title} className="py-10 sm:py-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{section.title}</h2>
                <Link href={`/shop?category=accessories`} className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 transition hover:text-gold-deep">
                  View all <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {section.products.slice(0, 5).map((product) => (
                  <ProductCard key={product.id} product={product} country={country} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-line">
          {CURATED_SECTIONS.map((section) => (
            <section key={section} className="py-10 sm:py-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{section}</h2>
                <Link href="/support" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 transition hover:text-gold-deep">
                  View collection <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4">
                {CURATED_ACCESSORIES.filter((item) => item.section === section).map((item) => (
                  <Link key={item.name} href="/support" className="group block">
                    <div className="aspect-[3/4] overflow-hidden bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                        style={{ objectPosition: item.position }}
                      />
                    </div>
                    <div className="pt-3">
                      <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug transition group-hover:text-gold-deep">{item.name}</h3>
                      <p className="mt-1 text-xs text-stone-500">{item.detail}</p>
                      <p className="mt-2 text-sm text-ink">{item.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="border-t border-line py-12 text-center sm:py-16">
        <p className="eyebrow">Made for your dress</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Need help choosing the final details?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-stone-600">
          Book a styling appointment and our bridal team will help you choose pieces that complement your silhouette, fabric and ceremony.
        </p>
        <Link href="/support" className="btn-primary mt-7">Book an appointment</Link>
      </section>
    </div>
  );
}
