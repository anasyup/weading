"use client";

import { usePathname } from "next/navigation";
import NewsletterForm from "./newsletter-form";

/* Footer manifesto block ("The dress of your celebration" + newsletter).
   Shared by all pages — hidden on /bridal only, where the product marquee
   flows directly into the dark footer. */
export default function FooterManifesto() {
  const pathname = usePathname();
  if (pathname === "/bridal") return null;

  return (
    <div className="footer-manifesto border-t border-line bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.34em] text-ink">
          The dress of your celebration
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-sm font-light leading-relaxed text-stone-600">
          Some dresses are worn once and remembered forever. Ours are hand-embroidered in
          Pakistan — zardozi, dabka, resham — cut to your measurements and made only after you
          order, then shipped across the USA.
        </p>
        <div className="mx-auto mt-9 max-w-md">
          <NewsletterForm />
        </div>
      </div>
    </div>
  );
}
