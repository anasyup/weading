import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import ShopContent from "@/components/shop-content";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteHeader />
      <ShopContent>{children}</ShopContent>
      <SiteFooter />
    </div>
  );
}
