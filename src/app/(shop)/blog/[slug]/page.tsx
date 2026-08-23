import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Journal" };
  return { title: post.seoTitle ?? post.title, description: post.seoDescription ?? post.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <Link href="/blog" className="text-[11px] uppercase tracking-[0.14em] text-stone-500 hover:text-gold-deep">
        ← Journal
      </Link>
      <p className="eyebrow mt-6">
        {post.publishedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-stone-600">{post.excerpt}</p>}
      {post.featuredImage && (
        <div className="mt-8 aspect-[16/9] overflow-hidden border border-line bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="mt-8 whitespace-pre-line text-[15px] leading-relaxed text-stone-700">{post.content}</div>

      <div className="mt-12 border-t border-line pt-8">
        <p className="text-sm text-stone-600">
          Ready to find your piece?{" "}
          <Link href="/shop" className="text-gold-deep underline">Shop the collection</Link>.
        </p>
      </div>
    </article>
  );
}
