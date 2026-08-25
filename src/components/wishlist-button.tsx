"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WishlistButton({
  productId,
  initialInWishlist,
  loggedIn,
}: {
  productId: string;
  initialInWishlist: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [inWishlist, setIn] = useState(initialInWishlist);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      router.push("/login?next=/shop");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) setIn(data.inWishlist);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
      className={`inline-flex items-center gap-2 border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
        inWishlist ? "border-rose/50 bg-rose/10 text-rose" : "border-line bg-white text-stone-500 hover:border-rose/40 hover:text-rose"
      }`}
    >
      <span className={inWishlist ? "heart-pulse inline-block" : "inline-block"} aria-hidden="true">
        {inWishlist ? "♥" : "♡"}
      </span>
      {inWishlist ? "Saved" : "Wishlist"}
    </button>
  );
}
