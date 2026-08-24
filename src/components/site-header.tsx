import { getSessionUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { getStoreName } from "@/lib/settings";
import CountrySelect from "./country-select";
import HeaderBar from "./header-bar";

// Server wrapper: gathers session/cart/brand, renders the luxury sticky bar.
export default async function SiteHeader() {
  const user = await getSessionUser();
  const brand = await getStoreName();
  const cartCount = await getCartCount(user?.customerId ?? null);

  return (
    <HeaderBar
      brand={brand}
      currencyComponent={<CountrySelect current="US" minimal />}
      cartCount={cartCount}
      isLoggedIn={!!user}
      isAdmin={!!user?.isAdmin}
    />
  );
}
