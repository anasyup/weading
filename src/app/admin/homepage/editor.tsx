"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Align,
  ArrowStyle,
  CollectionItem,
  FontWeight,
  HeightMode,
  HomeSection,
  SectionId,
} from "@/lib/homepage-config";
import { publishHomepage, resetHomepageDraft, saveHomepageDraft } from "./actions";

/* ------------------------------ helpers ------------------------------ */

const HAS_OVERLAY: SectionId[] = ["hero", "cta_banner"];
const HAS_HEIGHT: SectionId[] = ["cta_banner"];
const HAS_PAD_Y: SectionId[] = ["collections", "craftsmanship", "celebration", "process", "reviews"];
const HAS_TYPO: SectionId[] = ["hero", "cta_banner", "collections", "craftsmanship", "celebration", "process", "reviews"];
const TEXT_FIELDS: Partial<Record<SectionId, (keyof HomeSection["content"])[]>> = {
  hero: ["eyebrow", "heading", "body", "ctaLabel", "ctaHref"],
  cta_banner: ["heading", "body", "ctaLabel", "ctaHref"],
  collections: ["heading"],
  craftsmanship: ["eyebrow", "heading", "body", "body2"],
  celebration: ["eyebrow", "heading", "body", "ctaLabel", "ctaHref"],
  process: ["eyebrow", "heading", "ctaLabel", "ctaHref"],
  reviews: ["eyebrow", "heading"],
};
const FIELD_LABELS: Record<string, string> = {
  eyebrow: "Eyebrow / subheading",
  heading: "Main heading (new line = line break)",
  body: "Paragraph",
  body2: "Second paragraph",
  ctaLabel: "Button label",
  ctaHref: "Button link (e.g. /shop)",
  image: "Image",
  video: "Video (mp4 path/URL — empty = use image)",
};

async function fileToDataUri(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const maxW = 1400;
  const scale = Math.min(1, maxW / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

const selectCls =
  "cursor-pointer border border-line bg-white px-2 py-1.5 text-[11px] outline-none focus:border-gold";
const smallInput = "input !py-1.5 text-[12px]";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-gold-deep" : "bg-stone-300"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`}
      />
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="label">{label}</label>
        <span className="text-[10px] font-medium text-stone-500">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-gold-deep"
      />
    </div>
  );
}

// Media picker: library select + direct upload + manual URL
function MediaPicker({
  label,
  value,
  library,
  onChange,
}: {
  label: string;
  value: string;
  library: string[];
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isLibrary = library.includes(value);
  return (
    <div className="sm:col-span-2">
      <label className="label">{label}</label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <select
          value={isLibrary ? value : "__custom"}
          onChange={(e) => e.target.value !== "__custom" && onChange(e.target.value)}
          className={selectCls}
        >
          {library.map((m) => (
            <option key={m} value={m}>
              {m.replace("/uploads/", "")}
            </option>
          ))}
          <option value="__custom">Custom / uploaded…</option>
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 transition hover:border-gold hover:text-gold-deep disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload image"}
        </button>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-9 w-9 border border-line object-cover" />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              onChange(await fileToDataUri(f));
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {!isLibrary && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or data:image/… (upload fills this automatically)"
          className={`${smallInput} mt-2 w-full`}
        />
      )}
    </div>
  );
}

/* ------------------------------ main editor ------------------------------ */

export default function HomepageEditor({
  initial,
  initialDirty,
  publishedAt,
  mediaLibrary,
}: {
  initial: HomeSection[];
  initialDirty: boolean;
  publishedAt: string | null;
  mediaLibrary: string[];
}) {
  const [sections, setSections] = useState<HomeSection[]>(initial);
  const [open, setOpen] = useState<SectionId | null>(null);
  const [dirty, setDirty] = useState(initialDirty);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dragIdx = useRef<number | null>(null);
  const router = useRouter();

  const mutate = (fn: (s: HomeSection[]) => HomeSection[]) => {
    setSections((prev) => fn(prev));
    setDirty(true);
    setMsg(null);
  };

  const move = (from: number, to: number) =>
    mutate((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const patchContent = (id: SectionId, field: string, value: string | number | CollectionItem[]) =>
    mutate((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content: { ...s.content, [field]: value } } : s))
    );

  const patchStyle = (id: SectionId, field: string, value: string | number) =>
    mutate((prev) =>
      prev.map((s) => (s.id === id ? { ...s, style: { ...s.style, [field]: value } } : s))
    );

  const toggleActive = (id: SectionId, v: boolean) =>
    mutate((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: v } : s)));

  const doSave = () =>
    start(async () => {
      await saveHomepageDraft(JSON.stringify({ sections }));
      setMsg("Draft saved — open Preview to see it on the homepage.");
      router.refresh();
    });

  const doPublish = () =>
    start(async () => {
      await publishHomepage(JSON.stringify({ sections }));
      setDirty(false);
      setMsg("Published ✓ — changes are now LIVE on the store.");
      router.refresh();
    });

  const doReset = () =>
    start(async () => {
      await resetHomepageDraft();
      setMsg("Draft reset to the live version.");
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      {/* header */}
      <div>
        <p className="eyebrow">Homepage Theme</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Visual Section Manager</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Drag sections to reorder, toggle them on/off, edit their text, media and styling — then
          preview as a draft and publish to the live store with one click.
          {publishedAt && (
            <span className="block mt-1 text-xs text-stone-500">
              Last published: {new Date(publishedAt).toLocaleString("en-US")}
            </span>
          )}
        </p>
      </div>

      {msg && (
        <div className="border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm text-gold-deep">{msg}</div>
      )}

      {/* section list */}
      <div className="space-y-3">
        {sections.map((sec, idx) => {
          const fields = TEXT_FIELDS[sec.id] ?? [];
          const expanded = open === sec.id;
          return (
            <div
              key={sec.id}
              draggable
              onDragStart={() => {
                dragIdx.current = idx;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx.current !== null) move(dragIdx.current, idx);
                dragIdx.current = null;
              }}
              className={`border bg-white transition ${sec.isActive ? "border-line" : "border-line/60 opacity-70"}`}
            >
              {/* row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span
                  className="cursor-grab select-none text-lg leading-none text-stone-400 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  ⠿
                </span>
                <span className="w-6 text-center text-[10px] font-semibold text-stone-400">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{sec.label}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">{sec.id}</p>
                </div>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => move(idx, idx - 1)}
                  className="border border-line px-2 py-1 text-xs text-stone-500 transition hover:border-gold disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={idx === sections.length - 1}
                  onClick={() => move(idx, idx + 1)}
                  className="border border-line px-2 py-1 text-xs text-stone-500 transition hover:border-gold disabled:opacity-30"
                >
                  ↓
                </button>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400 sm:block">
                    {sec.isActive ? "Shown" : "Hidden"}
                  </span>
                  <Toggle on={sec.isActive} onChange={(v) => toggleActive(sec.id, v)} />
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : sec.id)}
                  className="border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 transition hover:border-gold hover:text-gold-deep"
                >
                  {expanded ? "Close" : "Edit"}
                </button>
              </div>

              {/* editor panel */}
              {expanded && (
                <div className="border-t border-line bg-sand/40 px-4 py-5 sm:px-6">
                  {/* content fields */}
                  {fields.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Content
                      </p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {fields.map((f) => (
                          <div key={f} className={f === "heading" || f === "body" || f === "body2" ? "sm:col-span-2" : ""}>
                            <label className="label">{FIELD_LABELS[f] ?? f}</label>
                            {f === "body" || f === "body2" || f === "heading" ? (
                              <textarea
                                rows={f === "heading" ? 2 : 3}
                                value={String(sec.content[f])}
                                onChange={(e) => patchContent(sec.id, f, e.target.value)}
                                className={`${smallInput} w-full`}
                              />
                            ) : (
                              <input
                                value={String(sec.content[f])}
                                onChange={(e) => patchContent(sec.id, f, e.target.value)}
                                className={`${smallInput} w-full`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* media */}
                  {(sec.id === "hero" || sec.id === "cta_banner" || sec.id === "celebration" || sec.id === "craftsmanship") && (
                    <div className="mt-5 grid gap-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Media
                      </p>
                      <MediaPicker
                        label={sec.id === "craftsmanship" ? "Poster / fallback image" : "Image"}
                        value={sec.content.image}
                        library={mediaLibrary}
                        onChange={(v) => patchContent(sec.id, "image", v)}
                      />
                      {sec.id === "craftsmanship" && (
                        <div>
                          <label className="label">{FIELD_LABELS.video}</label>
                          <input
                            value={sec.content.video}
                            onChange={(e) => patchContent(sec.id, "video", e.target.value)}
                            placeholder="/uploads/craft-aari.mp4"
                            className={`${smallInput} w-full`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* collections items CRUD */}
                  {sec.id === "collections" && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Carousel cards ({sec.content.items.length}) — min 3
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            patchContent(sec.id, "items", [
                              ...sec.content.items,
                              { title: "New Silhouette", line: "", img: "/uploads/pk-nikkah.jpg", href: "/occasions" },
                            ])
                          }
                          className="border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 transition hover:border-gold hover:text-gold-deep"
                        >
                          + Add card
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {sec.content.items.map((it, i) => (
                          <div key={i} className="grid gap-2 border border-line bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                            <input
                              value={it.title}
                              onChange={(e) =>
                                patchContent(sec.id, "items", sec.content.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                              }
                              placeholder="Title"
                              className={smallInput}
                            />
                            <input
                              value={it.line}
                              onChange={(e) =>
                                patchContent(sec.id, "items", sec.content.items.map((x, j) => (j === i ? { ...x, line: e.target.value } : x)))
                              }
                              placeholder="Small line"
                              className={smallInput}
                            />
                            <div className="flex gap-2">
                              <select
                                value={mediaLibrary.includes(it.img) ? it.img : "__custom"}
                                onChange={(e) =>
                                  e.target.value !== "__custom" &&
                                  patchContent(sec.id, "items", sec.content.items.map((x, j) => (j === i ? { ...x, img: e.target.value } : x)))
                                }
                                className={`${selectCls} flex-1`}
                              >
                                {mediaLibrary.map((m) => (
                                  <option key={m} value={m}>
                                    {m.replace("/uploads/", "")}
                                  </option>
                                ))}
                                <option value="__custom">Custom…</option>
                              </select>
                              <input
                                value={it.href}
                                onChange={(e) =>
                                  patchContent(sec.id, "items", sec.content.items.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))
                                }
                                placeholder="/occasions/x"
                                className={`${smallInput} w-28`}
                              />
                            </div>
                            <button
                              type="button"
                              disabled={sec.content.items.length <= 3}
                              onClick={() =>
                                patchContent(sec.id, "items", sec.content.items.filter((_, j) => j !== i))
                              }
                              className="border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:border-rose hover:text-rose disabled:opacity-30"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* styling */}
                  <div className="mt-5 grid gap-5 border-t border-line/70 pt-5 sm:grid-cols-3">
                    {HAS_PAD_Y.includes(sec.id) && (
                      <Slider
                        label="Vertical padding"
                        value={sec.style.padY}
                        min={1}
                        max={10}
                        step={0.5}
                        display={`${sec.style.padY}rem`}
                        onChange={(v) => patchStyle(sec.id, "padY", v)}
                      />
                    )}
                    {HAS_OVERLAY.includes(sec.id) && (
                      <Slider
                        label="Dark overlay"
                        value={sec.style.overlay}
                        min={0}
                        max={0.9}
                        step={0.05}
                        display={`${Math.round(sec.style.overlay * 100)}%`}
                        onChange={(v) => patchStyle(sec.id, "overlay", v)}
                      />
                    )}
                    {HAS_HEIGHT.includes(sec.id) && (
                      <div>
                        <label className="label">Section height</label>
                        <select
                          value={sec.style.height}
                          onChange={(e) => patchStyle(sec.id, "height", e.target.value as HeightMode)}
                          className={`${selectCls} mt-1 w-full`}
                        >
                          <option value="full">Full screen (100vh)</option>
                          <option value="auto">Compact</option>
                        </select>
                      </div>
                    )}
                    {HAS_TYPO.includes(sec.id) && (
                      <>
                        <div>
                          <label className="label">Heading alignment</label>
                          <select
                            value={sec.style.align}
                            onChange={(e) => patchStyle(sec.id, "align", e.target.value as Align)}
                            className={`${selectCls} mt-1 w-full`}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Heading weight</label>
                          <select
                            value={sec.style.fontWeight}
                            onChange={(e) => patchStyle(sec.id, "fontWeight", e.target.value as FontWeight)}
                            className={`${selectCls} mt-1 w-full`}
                          >
                            <option value="light">Light</option>
                            <option value="normal">Regular</option>
                            <option value="medium">Medium</option>
                          </select>
                        </div>
                        <Slider
                          label="Heading size"
                          value={sec.style.fontScale}
                          min={0.7}
                          max={1.3}
                          step={0.05}
                          display={`${Math.round(sec.style.fontScale * 100)}%`}
                          onChange={(v) => patchStyle(sec.id, "fontScale", v)}
                        />
                        <div>
                          <label className="label">Heading colour (hex / rgb — empty = theme)</label>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              type="color"
                              value={/^#([0-9a-f]{6})$/i.test(sec.style.textColor) ? sec.style.textColor : "#1c1a17"}
                              onChange={(e) => patchStyle(sec.id, "textColor", e.target.value)}
                              className="h-9 w-10 cursor-pointer border border-line bg-white p-1"
                            />
                            <input
                              value={sec.style.textColor}
                              onChange={(e) => patchStyle(sec.id, "textColor", e.target.value)}
                              placeholder="#1c1a17 or rgb(28,26,23)"
                              className={`${smallInput} flex-1`}
                            />
                            {sec.style.textColor && (
                              <button
                                type="button"
                                onClick={() => patchStyle(sec.id, "textColor", "")}
                                className="border border-line px-2 py-1.5 text-[10px] text-stone-500"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {sec.id === "collections" && (
                      <div>
                        <label className="label">Carousel arrows</label>
                        <select
                          value={sec.style.arrowStyle}
                          onChange={(e) => patchStyle(sec.id, "arrowStyle", e.target.value as ArrowStyle)}
                          className={`${selectCls} mt-1 w-full`}
                        >
                          <option value="filigree">Copper filigree arch</option>
                          <option value="line">Minimalist line</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${dirty ? "text-gold-deep" : "text-stone-400"}`}>
            {dirty ? "● Unpublished changes" : "✓ Live is up to date"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Link
              href="/?preview=1"
              target="_blank"
              className="border border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 transition hover:border-gold hover:text-gold-deep"
            >
              Preview draft ↗
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={doReset}
              className="border border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 transition hover:border-gold disabled:opacity-50"
            >
              Reset to live
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={doSave}
              className="btn-ghost btn-sm"
            >
              Save draft
            </button>
            <button type="button" disabled={pending} onClick={doPublish} className="btn-primary btn-sm">
              Publish to live store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
