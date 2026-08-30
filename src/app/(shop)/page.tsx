import Link from "next/link";
import { prisma } from "@/lib/db";
import Reveal from "@/components/reveal";
import ParallaxImage from "@/components/parallax-image";
import GoldDust, { CursorGlow } from "@/components/gold-dust";
import OccasionWall from "@/components/occasion-wall";
import CollectionsCanvas from "@/components/collections-canvas";
import { getLiveConfig, getDraftConfig, type HomeSection } from "@/lib/homepage-config";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Choose your piece",
    copy: "Pick a silhouette from the collection and make it yours — fabric, colour and finishing touches.",
  },
  {
    n: "02",
    title: "Handmade to your measurements",
    copy: "Hand embroidery begins on your order. Crafting a couture piece takes 30–45 days — and it is worth every one.",
  },
  {
    n: "03",
    title: "Shipped across the USA",
    copy: "Finished, checked and sent with tracked delivery — across the United States, Canada and Pakistan.",
  },
] as const;

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  customer: { firstName: string; lastName: string };
  product: { name: string; slug: string } | null;
};

/* ---------------- style helpers ---------------- */
const alignBlock = (a: string) =>
  a === "center" ? "items-center text-center" : a === "right" ? "items-end text-right" : "items-start text-left";
const weightCls = (w: string) =>
  w === "medium" ? "font-medium" : w === "normal" ? "font-normal" : "font-light";
const scaleVar = (s: number) => ({ "--h": String(s) } as React.CSSProperties);
const colorStyle = (c: string) => (c ? ({ color: c } as React.CSSProperties) : undefined);
const padStyle = (s: HomeSection) =>
  ({
    paddingTop: `${s.style.padY}rem`,
    paddingBottom: `${s.style.padY}rem`,
  }) as React.CSSProperties;

function HeadingLines({ text, className, style }: { text: string; className: string; style?: React.CSSProperties }) {
  return (
    <h2 className={className} style={style}>
      {text.split("\n").map((l, i) => (
        <span key={i} className={i > 0 ? "block" : undefined}>
          {l}
        </span>
      ))}
    </h2>
  );
}

/* ---------------- per-section renderers ---------------- */

function HeroSection({ sec }: { sec: HomeSection }) {
  const c = sec.content;
  const a = sec.style;
  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[600px]">
      <ParallaxImage src={c.image} alt="Pakistani bridal couture hero" strength={0.22} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/20 to-ink/25" />
      {a.overlay > 0 && <div className="absolute inset-0 bg-ink" style={{ opacity: a.overlay * 0.6 }} />}
      <GoldDust density={1.1} />
      <CursorGlow />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <div className={`hero-entrance flex max-w-3xl flex-col ${alignBlock(a.align)} text-cream`}>
          {c.eyebrow && (
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-cream/80">{c.eyebrow}</p>
          )}
          <HeadingLines
            text={c.heading}
            className={`mt-6 font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(3rem*var(--h,1))] leading-[1.06] tracking-wide sm:text-[calc(4.5rem*var(--h,1))]`}
            style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
          />
          {c.body && (
            <p className="mt-6 max-w-xl text-sm font-light leading-relaxed tracking-wide text-cream/85">
              {c.body}
            </p>
          )}
          {c.ctaLabel && (
            <div className="mt-10">
              <Link
                href={c.ctaHref || "/shop"}
                className="nav-link inline-block border-b border-cream/80 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-cream transition-colors hover:border-gold"
                data-active="true"
              >
                {c.ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* scroll cue — right edge, vertical */}
      <div className="absolute bottom-10 right-8 z-10 hidden flex-col items-center gap-3 sm:flex">
        <span className="h-16 w-px overflow-hidden bg-cream/25">
          <span className="block h-1/2 w-full animate-bounce bg-cream/80" />
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cream/70">
          <path d="M12 4v16m0 0 6-6m-6 6-6-6" />
        </svg>
      </div>
    </section>
  );
}

function CtaBannerSection({ sec }: { sec: HomeSection }) {
  const c = sec.content;
  const a = sec.style;
  const height =
    a.height === "full"
      ? "h-screen min-h-[480px] [@supports(height:100svh)]:h-[100svh]"
      : "h-[62vh] min-h-[420px]";
  return (
    <section className="relative">
      <div className={`relative w-full overflow-hidden ${height}`}>
        <ParallaxImage src={c.image} alt={c.heading || "Bridal couture"} strength={0.18} />
        <div className="absolute inset-0 bg-ink" style={{ opacity: a.overlay }} />
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
          <Reveal className={`flex max-w-2xl flex-col ${alignBlock(a.align)} text-cream`}>
            <HeadingLines
              text={c.heading}
              className={`font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(2.5rem*var(--h,1))] tracking-wide sm:text-[calc(3.75rem*var(--h,1))]`}
              style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
            />
            {c.body && (
              <p className="mt-5 max-w-lg text-sm font-light leading-relaxed tracking-wide text-cream/85">
                {c.body}
              </p>
            )}
            {c.ctaLabel && (
              <Link
                href={c.ctaHref || "/shop"}
                className="nav-link mt-9 inline-block border-b border-cream/80 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-cream transition-colors hover:border-gold"
              >
                {c.ctaLabel}
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function OccasionsSection() {
  return (
    <section className="relative h-screen min-h-[560px] w-full overflow-hidden [@supports(height:100svh)]:h-[100svh] [@supports(height:100svh)]:min-h-[560px]">
      <OccasionWall />
    </section>
  );
}

function CollectionsSection({ sec }: { sec: HomeSection }) {
  const c = sec.content;
  const a = sec.style;
  return (
    <section className="mx-auto max-w-7xl overflow-x-clip px-6" style={padStyle(sec)}>
      {c.heading && (
        <Reveal className={`mb-12 flex flex-col sm:mb-14 ${alignBlock(a.align)}`}>
          <HeadingLines
            text={c.heading}
            className={`font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(3rem*var(--h,1))] tracking-wide sm:text-[calc(3.75rem*var(--h,1))]`}
            style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
          />
        </Reveal>
      )}
      <Reveal>
        <CollectionsCanvas items={c.items} arrowStyle={a.arrowStyle} />
      </Reveal>
    </section>
  );
}

function CraftSection({ sec }: { sec: HomeSection }) {
  const c = sec.content;
  const a = sec.style;
  return (
    <section id="craft" className="relative overflow-hidden border-y border-line bg-sand/60">
      <div className="glow-orb left-[-6rem] top-16 h-72 w-72 bg-gold/25" aria-hidden="true" />
      <div className="glow-orb bottom-10 right-[-8rem] h-96 w-96 bg-gold/15" style={{ animationDelay: "2s" }} aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2" style={padStyle(sec)}>
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[560px]">
            {c.video ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={c.video}
                poster={c.image || undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label="Hand embroidery worked on an aari frame"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image}
                alt="Hand embroidery detail"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
          {/* Floating pearl/threadwork detail frame */}
          <div className="absolute -bottom-6 right-4 hidden w-40 overflow-hidden border-4 border-cream shadow-[0_18px_44px_rgba(28,26,23,0.18)] sm:block lg:right-8 lg:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/pk-detail-pearl.jpg"
              alt="Pearl, bead and resham embroidery detail"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>
        </Reveal>

        <div className="flex flex-col justify-center">
          <Reveal className={`flex flex-col ${alignBlock(a.align)}`}>
            {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
            <HeadingLines
              text={c.heading}
              className={`mt-3 font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(2.25rem*var(--h,1))] leading-tight tracking-wide sm:text-[calc(3rem*var(--h,1))]`}
              style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
            />
          </Reveal>
          <Reveal delay={120}>
            {c.body && (
              <p className="mt-7 max-w-lg text-[15px] font-light leading-loose text-stone-700" style={a.align !== "left" ? { alignSelf: alignBlock(a.align).includes("center") ? "center" : undefined } : undefined}>
                {c.body}
              </p>
            )}
            {c.body2 && (
              <p className="mt-4 max-w-lg text-[15px] font-light leading-loose text-stone-700">
                {c.body2}
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CelebrationSection({ sec }: { sec: HomeSection }) {
  const c = sec.content;
  const a = sec.style;
  return (
    <section className="mx-auto max-w-7xl px-6" style={padStyle(sec)}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className={`flex flex-col ${alignBlock(a.align)}`}>
          {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
          <HeadingLines
            text={c.heading}
            className={`mt-3 font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(2.25rem*var(--h,1))] leading-tight tracking-wide sm:text-[calc(3rem*var(--h,1))]`}
            style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
          />
          {c.body && (
            <p className="mt-6 max-w-md text-[15px] font-light leading-loose text-stone-700">{c.body}</p>
          )}
          {c.ctaLabel && (
            <Link
              href={c.ctaHref || "/occasions"}
              className="nav-link mt-8 inline-block border-b border-ink/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
            >
              {c.ctaLabel}
            </Link>
          )}
        </Reveal>

        <Reveal delay={140}>
          <div className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-[5/4]">
            <ParallaxImage src={c.image} alt={c.heading || "Pakistani wedding celebration"} strength={0.12} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProcessSection({ sec }: { sec: HomeSection }) {
  const c = sec.content;
  const a = sec.style;
  return (
    <section className="relative overflow-hidden border-t border-line bg-ink text-cream">
      <GoldDust density={0.5} />
      <div className="glow-orb left-1/3 top-0 h-80 w-80 bg-gold/20" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-6" style={padStyle(sec)}>
        <Reveal className={`mb-16 flex flex-col ${alignBlock(a.align)}`}>
          {c.eyebrow && (
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-gold">{c.eyebrow}</p>
          )}
          <HeadingLines
            text={c.heading}
            className={`mt-4 max-w-2xl font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(2.25rem*var(--h,1))] tracking-wide sm:text-[calc(3rem*var(--h,1))]`}
            style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
          />
        </Reveal>

        <div className="grid gap-10 md:grid-cols-3">
          {PROCESS_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 130}>
              <div className="border-t border-cream/20 pt-7">
                <p className="font-[family-name:var(--font-display)] text-4xl font-light text-gold">{s.n}</p>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-light tracking-wide">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-xs text-sm font-light leading-loose text-cream/70">{s.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {c.ctaLabel && (
          <Reveal delay={160} className="mt-16 text-center">
            <Link
              href={c.ctaHref || "/shop"}
              className="nav-link inline-block border-b border-cream/70 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-cream transition-colors hover:border-gold"
            >
              {c.ctaLabel}
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function ReviewsSection({ sec, reviews }: { sec: HomeSection; reviews: ReviewRow[] }) {
  const c = sec.content;
  const a = sec.style;
  if (reviews.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-6" style={padStyle(sec)}>
      <Reveal className={`mb-12 flex flex-col ${alignBlock(a.align)}`}>
        {c.eyebrow && <p className="eyebrow justify-center">{c.eyebrow}</p>}
        <HeadingLines
          text={c.heading}
          className={`mt-3 font-[family-name:var(--font-display)] ${weightCls(a.fontWeight)} text-[calc(2.25rem*var(--h,1))] tracking-wide sm:text-[calc(3rem*var(--h,1))]`}
          style={{ ...scaleVar(a.fontScale), ...colorStyle(a.textColor) }}
        />
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={i * 110}>
            <figure className="flex h-full flex-col border border-line bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(28,26,23,0.08)]">
              <p className="text-gold">
                {"★".repeat(r.rating)}
                <span className="text-line">{"★".repeat(5 - r.rating)}</span>
              </p>
              {r.title && (
                <figcaption className="mt-3 font-[family-name:var(--font-display)] text-xl font-light">
                  {r.title}
                </figcaption>
              )}
              {r.body && (
                <blockquote className="mt-2 flex-1 text-sm font-light leading-relaxed text-stone-700">
                  {r.body}
                </blockquote>
              )}
              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-stone-400">
                {r.customer.firstName} {r.customer.lastName.charAt(0)}. · Verified purchase
                {r.product ? <> · {r.product.name}</> : null}
              </p>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function renderSection(sec: HomeSection, reviews: ReviewRow[]) {
  switch (sec.id) {
    case "hero":
      return <HeroSection key={sec.id} sec={sec} />;
    case "cta_banner":
      return <CtaBannerSection key={sec.id} sec={sec} />;
    case "occasions":
      return <OccasionsSection key={sec.id} />;
    case "collections":
      return <CollectionsSection key={sec.id} sec={sec} />;
    case "craftsmanship":
      return <CraftSection key={sec.id} sec={sec} />;
    case "celebration":
      return <CelebrationSection key={sec.id} sec={sec} />;
    case "process":
      return <ProcessSection key={sec.id} sec={sec} />;
    case "reviews":
      return <ReviewsSection key={sec.id} sec={sec} reviews={reviews} />;
    default:
      return null;
  }
}

/* ------------------------------ page ------------------------------ */

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const wantsPreview = sp.preview === "1" || sp.preview === "draft";

  let config = await getLiveConfig();
  let preview = false;
  if (wantsPreview) {
    const user = await getSessionUser();
    if (user?.isAdmin) {
      config = await getDraftConfig();
      preview = true;
    }
  }

  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED" },
    include: { customer: true, product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="bg-cream">
      {preview && (
        <div className="fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 rounded-full border border-gold/50 bg-ink/95 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream shadow-xl">
          Previewing draft — not live ·{" "}
          <Link href="/admin/homepage" className="text-gold underline underline-offset-2">
            Open Homepage Editor
          </Link>
        </div>
      )}
      {config.sections.filter((s) => s.isActive).map((sec) => renderSection(sec, reviews))}
    </div>
  );
}
