"use client";

import { useEffect } from "react";

// Mounts the `snap-home` class on <html> while the homepage is open, so the
// CSS scroll-snap rules only ever apply here (all other pages unaffected).
export default function SnapRoot() {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("snap-home");
    return () => el.classList.remove("snap-home");
  }, []);
  return null;
}
