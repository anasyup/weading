import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Journal",
  description: "Atelier stories — fabric, craft and the making of made-to-order bridal wear.",
};

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <p className="eyebrow">From the atelier</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">Journal</h1>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
            {p.featuredImage && (
              <div className="aspect-[16/10] overflow-hidden border border-line bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.featuredImage}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              </div>
            )}
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              {p.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl group-hover:text-gold-deep">
              {p.title}
            </h2>
            {p.excerpt && <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.excerpt}</p>}
          </Link>
        ))}
        {posts.length === 0 && <p className="text-sm text-stone-500">No posts yet.</p>}
      </div>
    </div>
  );
}
