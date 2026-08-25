import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!page) return { title: "Page" };
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISHED") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="eyebrow">Bridal Dresses</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">{page.title}</h1>
      <div className="mt-8 whitespace-pre-line text-[15px] leading-relaxed text-stone-700">
        {page.content}
      </div>

      <div className="mt-12 border-t border-line pt-8 text-xs text-stone-500">
        Questions?{" "}
        <Link href="/support" className="text-gold-deep underline">Contact support</Link> — we reply within a day.
      </div>
    </div>
  );
}
