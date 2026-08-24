import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sand">
      <header className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-[0.08em]">
            BRIDAL DRESSES
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
      <footer className="border-t border-line py-4 text-center text-[10px] uppercase tracking-[0.16em] text-stone-400">
        Made to order · 30–45 days · USA · Canada · Pakistan
      </footer>
    </div>
  );
}
