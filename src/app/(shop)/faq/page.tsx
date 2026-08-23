import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "FAQs",
  description: "How made-to-order works: production time, measurements, shipping to USA, Canada and Pakistan.",
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="eyebrow">Good to know</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">Frequently asked questions</h1>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.id} className="group py-5">
            <summary className="cursor-pointer list-none font-medium marker:hidden group-open:text-gold-deep">
              {f.question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">{f.answer}</p>
          </details>
        ))}
        {faqs.length === 0 && <p className="py-8 text-sm text-stone-500">No FAQs yet.</p>}
      </div>

      <p className="mt-10 text-sm text-stone-600">
        Still unsure about something?{" "}
        <Link href="/support" className="text-gold-deep underline">Talk to the atelier</Link>.
      </p>
    </div>
  );
}
