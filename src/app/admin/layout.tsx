import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import AdminNav from "@/components/admin/nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) redirect("/account");

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink text-cream lg:flex">
        <div className="border-b border-cream/10 px-6 py-6">
          <p className="font-[family-name:var(--font-display)] text-lg tracking-[0.08em]">BRIDAL DRESSES</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-gold">Admin Panel</p>
        </div>
        <AdminNav />
        <div className="mt-auto space-y-1 border-t border-cream/10 p-4 text-[11px]">
          <p className="px-2 pb-2 text-cream/50">{user.email}</p>
          <Link href="/" className="block px-2 py-1.5 text-cream/70 hover:text-cream">View store ↗</Link>
          <form action={logoutAction}>
            <button className="px-2 py-1.5 text-left text-cream/70 hover:text-cream">Sign out</button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3 lg:hidden">
          <p className="font-[family-name:var(--font-display)] text-lg">Noor Bridal — Admin</p>
          <form action={logoutAction}>
            <button className="text-[11px] uppercase tracking-[0.14em] text-stone-500">Sign out</button>
          </form>
        </header>
        <div className="lg:px-2">
          <AdminNav mobile />
        </div>
        <main className="px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
