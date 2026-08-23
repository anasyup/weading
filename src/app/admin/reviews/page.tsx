import Link from "next/link";
import { prisma } from "@/lib/db";
import { setReviewStatus, deleteReview } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const reviews = await prisma.review.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const counts = await prisma.review.groupBy({ by: ["status"], _count: true });

  const badgeClass = (s: string) =>
    s === "APPROVED" ? "border-moss/40 bg-moss/10 text-moss"
    : s === "PENDING" ? "border-gold/40 bg-gold/10 text-gold-deep"
    : "border-line bg-white text-stone-500";

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Moderation</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Reviews</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/admin/reviews" className={`badge ${!status ? "border-ink bg-ink text-cream" : "border-line bg-white text-stone-600"}`}>
          All
        </Link>
        {["PENDING", "APPROVED", "REJECTED", "HIDDEN"].map((s) => {
          const count = counts.find((c) => c.status === s)?._count ?? 0;
          return (
            <Link
              key={s}
              href={`/admin/reviews?status=${s}`}
              className={`badge ${status === s ? "border-ink bg-ink text-cream" : "border-line bg-white text-stone-600"}`}
            >
              {s} · {count}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-gold">{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></p>
                <p className="mt-1 font-medium">
                  {r.title ?? "(no title)"}{" "}
                  <span className="text-xs font-normal text-stone-400">
                    — {r.customer.firstName} {r.customer.lastName} on {r.product.name}
                  </span>
                </p>
                {r.body && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-700">{r.body}</p>}
                <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-400">
                  {r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${badgeClass(r.status)}`}>{r.status}</span>
                {r.status !== "APPROVED" && (
                  <form action={setReviewStatus}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="badge border-moss/40 bg-white text-moss hover:bg-moss/10">Approve</button>
                  </form>
                )}
                {r.status !== "REJECTED" && (
                  <form action={setReviewStatus}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button className="badge border-rose/40 bg-white text-rose hover:bg-rose/5">Reject</button>
                  </form>
                )}
                {r.status === "APPROVED" && (
                  <form action={setReviewStatus}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="status" value="HIDDEN" />
                    <button className="badge border-line bg-white text-stone-500">Hide</button>
                  </form>
                )}
                <form action={deleteReview}>
                  <input type="hidden" name="reviewId" value={r.id} />
                  <button className="badge border-line bg-white text-stone-400 hover:border-rose/40 hover:text-rose">Delete</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="card px-6 py-10 text-center text-sm text-stone-500">No reviews here.</div>
        )}
      </div>
    </div>
  );
}
