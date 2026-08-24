"use client";

import { usePathname } from "next/navigation";

// Fixed luxury header overlaps content — inner pages need top padding
// (the homepage hero starts full-bleed beneath the transparent header).
export default function ShopContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return <main className={isHome ? "flex-1" : "flex-1 pt-24"}>{children}</main>;
}
