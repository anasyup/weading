import { prisma } from "@/lib/db";

/* ------------------------------------------------------------------ */
/* Homepage Theme CMS — config types, defaults & storage                */
/* Stored as JSON in the existing SystemSetting table (no migration):   */
/*   key "homepage.live"  → what the storefront renders                 */
/*   key "homepage.draft" → what the admin editor edits & previews      */
/* ------------------------------------------------------------------ */

export type SectionId =
  | "hero"
  | "cta_banner"
  | "occasions"
  | "collections"
  | "craftsmanship"
  | "celebration"
  | "process"
  | "reviews";

export type HeightMode = "full" | "auto";
export type Align = "left" | "center" | "right";
export type FontWeight = "light" | "normal" | "medium";
export type ArrowStyle = "filigree" | "line";

export interface CollectionItem {
  title: string;
  line: string;
  img: string;
  href: string;
}

export interface SectionStyle {
  height: HeightMode; // "full" = 100vh slide, "auto" = content height
  padY: number; // vertical padding in rem (auto height sections)
  overlay: number; // 0–0.9 dark tint over image sections
  align: Align; // heading alignment
  fontScale: number; // 0.8–1.3 heading size multiplier
  fontWeight: FontWeight; // heading weight
  textColor: string; // heading colour (hex/rgb) — "" = theme default
  arrowStyle: ArrowStyle; // collections carousel arrows
}

export interface SectionContent {
  eyebrow: string;
  heading: string; // \n allowed for manual line breaks
  body: string;
  body2: string;
  ctaLabel: string;
  ctaHref: string;
  image: string; // primary image (upload path / URL / data URI)
  video: string; // craft video source ("" = none)
  items: CollectionItem[]; // collections cards (CRUD)
}

export interface HomeSection {
  id: SectionId;
  label: string;
  isActive: boolean; // show / hide toggle
  style: SectionStyle;
  content: SectionContent;
}

export interface HomepageConfig {
  sections: HomeSection[]; // array position = order_index
}

/* Images/videos admins can pick from (public/uploads library). */
export const MEDIA_LIBRARY = [
  "/uploads/pk-hero.jpg",
  "/uploads/pk-baraat.jpg",
  "/uploads/pk-ceremony.jpg",
  "/uploads/pk-mehndi.jpg",
  "/uploads/pk-nikkah.jpg",
  "/uploads/pk-walima.jpg",
  "/uploads/pk-craft-zardozi.jpg",
  "/uploads/pk-detail-pearl.jpg",
  "/uploads/p-red-lehenga.jpg",
  "/uploads/p-emerald-zardozi.jpg",
  "/uploads/p-maroon-jamawar.jpg",
  "/uploads/p-ivory-gown.jpg",
  "/uploads/p-blush-organza.jpg",
] as const;

const DEFAULT_STYLE: SectionStyle = {
  height: "auto",
  padY: 5,
  overlay: 0.4,
  align: "left",
  fontScale: 1,
  fontWeight: "light",
  textColor: "",
  arrowStyle: "filigree",
};

const EMPTY_CONTENT: SectionContent = {
  eyebrow: "",
  heading: "",
  body: "",
  body2: "",
  ctaLabel: "",
  ctaHref: "",
  image: "",
  video: "",
  items: [],
};

export const DEFAULT_SECTIONS: HomeSection[] = [
  {
    id: "hero",
    label: "Hero",
    isActive: true,
    style: { ...DEFAULT_STYLE, align: "center", overlay: 0.25 },
    content: {
      ...EMPTY_CONTENT,
      eyebrow: "Handcrafted in Pakistan · Worn across America",
      heading: "Handcrafted Pakistani\nBridal Couture",
      body: "Zardozi, dabka and resham — hand-embroidered bridal wear, made to order in 30–45 days and shipped to your door across the USA.",
      ctaLabel: "Discover",
      ctaHref: "/shop",
      image: "/uploads/pk-hero.jpg",
    },
  },
  {
    id: "cta_banner",
    label: "Bridal Story Banner",
    isActive: true,
    style: { ...DEFAULT_STYLE, height: "full", align: "center", overlay: 0.4 },
    content: {
      ...EMPTY_CONTENT,
      heading: "Begin your bridal story",
      body: "Every celebration deserves a dress that was made for it — and only for it.",
      ctaLabel: "Shop bridal",
      ctaHref: "/shop",
      image: "/uploads/pk-baraat.jpg",
    },
  },
  {
    id: "occasions",
    label: "Shop by Occasion",
    isActive: true,
    style: { ...DEFAULT_STYLE, height: "full" },
    content: { ...EMPTY_CONTENT },
  },
  {
    id: "collections",
    label: "Collections (Carousel)",
    isActive: true,
    style: { ...DEFAULT_STYLE, align: "center" },
    content: {
      ...EMPTY_CONTENT,
      heading: "Collections",
      items: [
        { title: "The Mehndi Green", line: "Colour, mirror-work & joy", img: "/uploads/pk-mehndi.jpg", href: "/occasions/mehndi" },
        { title: "The Nikkah Ivory", line: "Ivory whites & pearl details", img: "/uploads/pk-nikkah.jpg", href: "/occasions/nikkah" },
        { title: "The Baraat Red", line: "The classic red lehenga", img: "/uploads/pk-hero.jpg", href: "/occasions/baraat" },
        { title: "The Walima Pastel", line: "Soft pastels & reception gowns", img: "/uploads/pk-walima.jpg", href: "/occasions/walima" },
        { title: "The Festive Organza", line: "Festive formal wear", img: "/uploads/p-blush-organza.jpg", href: "/occasions/party" },
        { title: "The Ceremony Blush", line: "Dholki, engagement & more", img: "/uploads/pk-ceremony.jpg", href: "/occasions/others" },
      ],
    },
  },
  {
    id: "craftsmanship",
    label: "Handmade Craftsmanship",
    isActive: true,
    style: { ...DEFAULT_STYLE },
    content: {
      ...EMPTY_CONTENT,
      eyebrow: "Handmade Craftsmanship",
      heading: "Zardozi, dabka, resham —\nby hand, only.",
      body: "Every piece is hand-embroidered in Pakistan using the techniques our craft is known for — gold zardozi and dabka, silk resham threadwork, and pearls, beads and sequins set one at a time.",
      body2: "Nothing here is mass-made. Your dress is cut and embellished after you order it, to your measurements — the way bridal wear is meant to be.",
      video: "/uploads/craft-aari.mp4",
      image: "/uploads/pk-craft-zardozi.jpg",
    },
  },
  {
    id: "celebration",
    label: "For Every Celebration",
    isActive: true,
    style: { ...DEFAULT_STYLE },
    content: {
      ...EMPTY_CONTENT,
      eyebrow: "From dholki to walima",
      heading: "One wedding, many celebrations.",
      body: "From the dholki night to the walima reception — every moment of a South Asian wedding asks for its own dress. Discover pieces for each celebration, handcrafted with the same devotion.",
      ctaLabel: "Discover occasions",
      ctaHref: "/occasions",
      image: "/uploads/pk-ceremony.jpg",
    },
  },
  {
    id: "process",
    label: "Made to Order Steps",
    isActive: true,
    style: { ...DEFAULT_STYLE, align: "center" },
    content: {
      ...EMPTY_CONTENT,
      eyebrow: "Made to Order",
      heading: "Your dress is made after — and for — you",
      ctaLabel: "Start with the collection",
      ctaHref: "/shop",
    },
  },
  {
    id: "reviews",
    label: "Brides' Reviews",
    isActive: true,
    style: { ...DEFAULT_STYLE, align: "center" },
    content: {
      ...EMPTY_CONTENT,
      eyebrow: "Brides across America",
      heading: "What our brides say",
    },
  },
];

export const DEFAULT_CONFIG: HomepageConfig = { sections: DEFAULT_SECTIONS };

/* ---------------------------- sanitize ---------------------------- */
const isHexOrRgb = (v: string) =>
  /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^rgba?\(/.test(v.trim());
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const num = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
const str = (v: unknown, d: string, max = 600) =>
  typeof v === "string" ? v.slice(0, max) : d;
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : d;

function sanitizeStyle(raw: unknown, d: SectionStyle): SectionStyle {
  const r = (raw ?? {}) as Record<string, unknown>;
  const color = str(r.textColor, "", 60).trim();
  return {
    height: oneOf(r.height, ["full", "auto"] as const, d.height),
    padY: clamp(num(r.padY, d.padY), 0, 12),
    overlay: clamp(num(r.overlay, d.overlay), 0, 0.9),
    align: oneOf(r.align, ["left", "center", "right"] as const, d.align),
    fontScale: clamp(num(r.fontScale, d.fontScale), 0.7, 1.4),
    fontWeight: oneOf(r.fontWeight, ["light", "normal", "medium"] as const, d.fontWeight),
    textColor: isHexOrRgb(color) || color === "" ? color : d.textColor,
    arrowStyle: oneOf(r.arrowStyle, ["filigree", "line"] as const, d.arrowStyle),
  };
}

function sanitizeItem(raw: unknown): CollectionItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const title = str(r.title, "", 120).trim();
  if (!title) return null;
  return {
    title,
    line: str(r.line, "", 140),
    img: str(r.img, "", 400000),
    href: str(r.href, "/occasions", 200) || "/occasions",
  };
}

function sanitizeContent(raw: unknown, d: SectionContent): SectionContent {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    eyebrow: str(r.eyebrow, d.eyebrow, 200),
    heading: str(r.heading, d.heading, 300),
    body: str(r.body, d.body, 1200),
    body2: str(r.body2, d.body2, 1200),
    ctaLabel: str(r.ctaLabel, d.ctaLabel, 80),
    ctaHref: str(r.ctaHref, d.ctaHref, 200),
    image: str(r.image, d.image, 400000),
    video: str(r.video, d.video, 400000),
    items: Array.isArray(r.items)
      ? r.items.map(sanitizeItem).filter((x): x is CollectionItem => !!x).slice(0, 24)
      : d.items,
  };
}

export function sanitizeConfig(raw: unknown): HomepageConfig {
  const byId = new Map(DEFAULT_SECTIONS.map((s) => [s.id, s]));
  const out: HomeSection[] = [];
  const seen = new Set<SectionId>();
  const arr = (raw as HomepageConfig | null)?.sections;
  if (Array.isArray(arr)) {
    for (const entry of arr) {
      const id = (entry as HomeSection)?.id as SectionId;
      const def = byId.get(id);
      if (!def || seen.has(id)) continue;
      seen.add(id);
      const e = entry as HomeSection;
      out.push({
        id,
        label: def.label,
        isActive: typeof e.isActive === "boolean" ? e.isActive : true,
        style: sanitizeStyle(e.style, def.style),
        content: sanitizeContent(e.content, def.content),
      });
    }
  }
  // any sections missing from stored config keep defaults, appended at the end
  for (const def of DEFAULT_SECTIONS) if (!seen.has(def.id)) out.push(def);
  return { sections: out };
}

/* ---------------------------- storage ---------------------------- */
const LIVE_KEY = "homepage.live";
const DRAFT_KEY = "homepage.draft";

async function readConfig(key: string): Promise<HomepageConfig | null> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (!row?.value) return null;
    return sanitizeConfig(JSON.parse(row.value));
  } catch {
    return null;
  }
}

export async function getLiveConfig(): Promise<HomepageConfig> {
  return (await readConfig(LIVE_KEY)) ?? DEFAULT_CONFIG;
}

export async function getDraftConfig(): Promise<HomepageConfig> {
  return (await readConfig(DRAFT_KEY)) ?? (await getLiveConfig());
}

export async function saveDraftConfig(config: HomepageConfig, updatedById?: string) {
  await prisma.systemSetting.upsert({
    where: { key: DRAFT_KEY },
    update: { value: JSON.stringify(config), updatedById, updatedAt: new Date() },
    create: { key: DRAFT_KEY, value: JSON.stringify(config), category: "homepage", updatedById },
  });
}

export async function publishConfig(config: HomepageConfig, updatedById?: string) {
  const value = JSON.stringify(config);
  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: LIVE_KEY },
      update: { value, updatedById, updatedAt: new Date() },
      create: { key: LIVE_KEY, value, category: "homepage", updatedById },
    }),
    prisma.systemSetting.upsert({
      where: { key: DRAFT_KEY },
      update: { value, updatedById, updatedAt: new Date() },
      create: { key: DRAFT_KEY, value, category: "homepage", updatedById },
    }),
  ]);
}

export async function getLiveMeta(): Promise<{ updatedAt: string | null; published: boolean }> {
  const row = await prisma.systemSetting.findUnique({ where: { key: LIVE_KEY } });
  return { updatedAt: row?.updatedAt?.toISOString() ?? null, published: !!row };
}
