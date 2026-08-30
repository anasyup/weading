"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/homepage", label: "Homepage Theme", icon: "▦" },
  { href: "/admin/orders", label: "Orders", icon: "❒" },
  { href: "/admin/products", label: "Products", icon: "✂" },
  { href: "/admin/inventory", label: "Inventory", icon: "▤" },
  { href: "/admin/customers", label: "Customers", icon: "☺" },
  { href: "/admin/returns", label: "Returns", icon: "↺" },
  { href: "/admin/finance", label: "Finance", icon: "₨" },
  { href: "/admin/reports", label: "Reports", icon: "▲" },
  { href: "/admin/marketing", label: "Marketing", icon: "✦" },
  { href: "/admin/cms", label: "Content", icon: "✎" },
  { href: "/admin/support", label: "Support", icon: "✉" },
  { href: "/admin/reviews", label: "Reviews", icon: "★" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
  { href: "/admin/audit", label: "Audit Log", icon: "☰" },
];

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (mobile) {
    return (
      <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              isActive(l.href) ? "bg-ink text-cream" : "text-stone-500"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
            isActive(l.href)
              ? "bg-cream/10 text-cream"
              : "text-cream/60 hover:bg-cream/5 hover:text-cream"
          }`}
        >
          <span className="text-gold">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
