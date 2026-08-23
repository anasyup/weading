"use client";

import { useRef, useState } from "react";

// Uploads to /api/admin/upload (admin-only). Dev: local /public/uploads.
// Production: same endpoint, storage backend switched via env (DEPLOYMENT.md).
export default function ImageUpload({
  onUploaded,
  compact = false,
}: {
  onUploaded: (url: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={compact ? "text-[10px] uppercase tracking-wider text-gold-deep underline" : "btn-ghost btn-sm"}
      >
        {busy ? "Uploading…" : compact ? "Upload image" : "⬆ Upload image"}
      </button>
      {error && <p className="mt-1 text-[11px] text-rose">{error}</p>}
    </div>
  );
}
