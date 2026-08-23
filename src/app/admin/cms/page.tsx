import { prisma } from "@/lib/db";
import { savePage, saveBanner, deleteBanner, saveFaq, deleteFaq, saveBlogPost } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content" };

export default async function AdminCmsPage() {
  const [pages, banners, faqs, posts] = await Promise.all([
    prisma.cmsPage.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.cmsBanner.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.faq.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <div>
        <p className="eyebrow">Website</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Content management</h1>
        <p className="mt-2 text-sm text-stone-600">
          Change the website without a developer — banners, pages, FAQs and blog.
        </p>
      </div>

      {/* Banners */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Homepage banners</h2>
        <div className="space-y-3">
          {banners.map((b) => (
            <details key={b.id} className="border border-line bg-white">
              <summary className="flex cursor-pointer items-center gap-4 px-5 py-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt="" className="h-10 w-16 border border-line object-cover" />
                <span className="flex-1 text-sm font-medium">{b.title}</span>
                <span className={`badge ${b.status === "ACTIVE" ? "border-moss/40 bg-moss/10 text-moss" : "border-line text-stone-400"}`}>{b.status}</span>
              </summary>
              <form action={saveBanner} className="grid gap-3 border-t border-line p-5 sm:grid-cols-2">
                <input type="hidden" name="id" value={b.id} />
                <div><label className="label">Title</label><input name="title" defaultValue={b.title} className="input" /></div>
                <div><label className="label">Subtitle (eyebrow)</label><input name="subtitle" defaultValue={b.subtitle ?? ""} className="input" /></div>
                <div className="sm:col-span-2"><label className="label">Image URL</label><input name="imageUrl" defaultValue={b.imageUrl} className="input" /></div>
                <div><label className="label">Link</label><input name="linkUrl" defaultValue={b.linkUrl ?? ""} className="input" /></div>
                <div><label className="label">CTA label</label><input name="ctaLabel" defaultValue={b.ctaLabel ?? ""} className="input" /></div>
                <div><label className="label">Sort</label><input name="sortOrder" defaultValue={b.sortOrder} className="input" inputMode="numeric" /></div>
                <div><label className="label">Status</label>
                  <select name="status" defaultValue={b.status} className="input">
                    <option value="ACTIVE">Active</option><option value="HIDDEN">Hidden</option>
                  </select>
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  <button className="btn-primary btn-sm">Save banner</button>
                </div>
              </form>
            </details>
          ))}
          <details className="border border-gold/40 bg-sand/40">
            <summary className="cursor-pointer px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              + New banner
            </summary>
            <form action={saveBanner} className="grid gap-3 border-t border-line bg-white p-5 sm:grid-cols-2">
              <div><label className="label">Title *</label><input name="title" required className="input" /></div>
              <div><label className="label">Subtitle</label><input name="subtitle" className="input" /></div>
              <div className="sm:col-span-2"><label className="label">Image URL *</label><input name="imageUrl" required placeholder="/uploads/hero.jpg" className="input" /></div>
              <div><label className="label">Link</label><input name="linkUrl" placeholder="/shop" className="input" /></div>
              <div><label className="label">CTA label</label><input name="ctaLabel" placeholder="Shop now" className="input" /></div>
              <div><label className="label">Sort</label><input name="sortOrder" defaultValue={2} className="input" inputMode="numeric" /></div>
              <div className="flex items-end"><button className="btn-gold btn-sm w-full">Create banner</button></div>
            </form>
          </details>
        </div>
      </section>

      {/* Pages */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Pages ({pages.length})</h2>
        <div className="space-y-3">
          {pages.map((p) => (
            <details key={p.id} className="border border-line bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium">{p.title} <span className="text-xs text-stone-400">/{p.slug}</span></span>
                <span className={`badge ${p.status === "PUBLISHED" ? "border-moss/40 bg-moss/10 text-moss" : "border-line text-stone-400"}`}>{p.status}</span>
              </summary>
              <form action={savePage} className="space-y-3 border-t border-line p-5">
                <input type="hidden" name="id" value={p.id} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className="label">Title</label><input name="title" defaultValue={p.title} className="input" /></div>
                  <div><label className="label">Slug</label><input name="slug" defaultValue={p.slug} className="input" /></div>
                  <div><label className="label">Status</label>
                    <select name="status" defaultValue={p.status} className="input">
                      <option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>
                <div><label className="label">Content</label><textarea name="content" rows={5} defaultValue={p.content} className="input" /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">SEO title</label><input name="seoTitle" defaultValue={p.seoTitle ?? ""} className="input" /></div>
                  <div><label className="label">SEO description</label><input name="seoDescription" defaultValue={p.seoDescription ?? ""} className="input" /></div>
                </div>
                <button className="btn-primary btn-sm">Save page</button>
              </form>
            </details>
          ))}
          <details className="border border-gold/40 bg-sand/40">
            <summary className="cursor-pointer px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">+ New page</summary>
            <form action={savePage} className="space-y-3 border-t border-line bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">Title *</label><input name="title" required className="input" /></div>
                <div><label className="label">Slug</label><input name="slug" placeholder="auto" className="input" /></div>
              </div>
              <div><label className="label">Content</label><textarea name="content" rows={4} className="input" /></div>
              <button className="btn-gold btn-sm">Create page</button>
            </form>
          </details>
        </div>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">FAQs ({faqs.length})</h2>
        <div className="space-y-2">
          {faqs.map((f) => (
            <details key={f.id} className="border border-line bg-white">
              <summary className="cursor-pointer px-5 py-3 text-sm font-medium">{f.question}</summary>
              <form action={saveFaq} className="space-y-3 border-t border-line p-5">
                <input type="hidden" name="id" value={f.id} />
                <div><label className="label">Question</label><input name="question" defaultValue={f.question} className="input" /></div>
                <div><label className="label">Answer</label><textarea name="answer" rows={3} defaultValue={f.answer} className="input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Sort</label><input name="sortOrder" defaultValue={f.sortOrder} className="input" inputMode="numeric" /></div>
                  <div><label className="label">Status</label>
                    <select name="status" defaultValue={f.status} className="input">
                      <option value="ACTIVE">Active</option><option value="HIDDEN">Hidden</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn-primary btn-sm">Save</button>
                </div>
              </form>
              <form action={deleteFaq} className="border-t border-line px-5 py-2.5">
                <input type="hidden" name="id" value={f.id} />
                <button className="text-[10px] uppercase tracking-wider text-stone-400 underline hover:text-rose">Delete FAQ</button>
              </form>
            </details>
          ))}
          <details className="border border-gold/40 bg-sand/40">
            <summary className="cursor-pointer px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">+ New FAQ</summary>
            <form action={saveFaq} className="space-y-3 border-t border-line bg-white p-5">
              <div><label className="label">Question *</label><input name="question" required className="input" /></div>
              <div><label className="label">Answer *</label><textarea name="answer" required rows={3} className="input" /></div>
              <button className="btn-gold btn-sm">Add FAQ</button>
            </form>
          </details>
        </div>
      </section>

      {/* Blog */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Blog ({posts.length})</h2>
        <div className="space-y-3">
          {posts.map((p) => (
            <details key={p.id} className="border border-line bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium">{p.title}</span>
                <span className={`badge ${p.status === "PUBLISHED" ? "border-moss/40 bg-moss/10 text-moss" : "border-line text-stone-400"}`}>{p.status}</span>
              </summary>
              <form action={saveBlogPost} className="space-y-3 border-t border-line p-5">
                <input type="hidden" name="id" value={p.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Title</label><input name="title" defaultValue={p.title} className="input" /></div>
                  <div><label className="label">Slug</label><input name="slug" defaultValue={p.slug} className="input" /></div>
                </div>
                <div><label className="label">Excerpt</label><input name="excerpt" defaultValue={p.excerpt ?? ""} className="input" /></div>
                <div><label className="label">Content</label><textarea name="content" rows={5} defaultValue={p.content} className="input" /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Featured image URL</label><input name="featuredImage" defaultValue={p.featuredImage ?? ""} className="input" /></div>
                  <div><label className="label">Status</label>
                    <select name="status" defaultValue={p.status} className="input">
                      <option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary btn-sm">Save post</button>
              </form>
            </details>
          ))}
          <details className="border border-gold/40 bg-sand/40">
            <summary className="cursor-pointer px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">+ New post</summary>
            <form action={saveBlogPost} className="space-y-3 border-t border-line bg-white p-5">
              <div><label className="label">Title *</label><input name="title" required className="input" /></div>
              <div><label className="label">Excerpt</label><input name="excerpt" className="input" /></div>
              <div><label className="label">Content</label><textarea name="content" rows={4} className="input" /></div>
              <button className="btn-gold btn-sm">Publish</button>
            </form>
          </details>
        </div>
      </section>
    </div>
  );
}
