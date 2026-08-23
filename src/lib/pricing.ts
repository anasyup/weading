// Pure, client-safe pricing & country helpers (no server-only imports).

export const SUPPORTED = ["US", "CA", "PK"] as const;
export type CountryCode = (typeof SUPPORTED)[number];

export type CountryContext = {
  id: string;
  code: CountryCode;
  name: string;
  currency: string;
};

export type PriceInput = {
  basePrice: number;
  salePrice?: number | null;
  variantPrice?: number | null;
  variantSalePrice?: number | null;
  countryPrice?: number | null; // explicit per-country override (e.g. PKR)
  countrySalePrice?: number | null;
  currency: string;
  pkrPerUsd?: number; // settings rate used to convert USD markups for PK display
};

export function resolveUnitPrice(input: PriceInput): { list: number; effective: number; isSale: boolean } {
  let list: number;
  let sale: number | null = null;

  if (input.countryPrice != null) {
    list = input.countryPrice;
    sale = input.countrySalePrice ?? null;
  } else if (input.variantPrice != null) {
    list = input.variantPrice;
    sale = input.variantSalePrice ?? null;
  } else {
    list = input.basePrice;
    sale = input.salePrice ?? null;
  }

  const effective = sale ?? list;
  return { list, effective, isSale: sale != null && sale < list };
}

/** Convert a USD minor-unit markup for display in the active currency. */
export function convertMarkup(usdMinor: number, currency: string, pkrPerUsd = 280): number {
  if (currency !== "PKR") return usdMinor;
  return Math.round((usdMinor * pkrPerUsd) / 100) * 100; // whole rupees
}

export type CustomizationSelection = {
  option: string;
  value: string;
  additionalPrice: number; // USD minor units
};

export function customizationMarkupUsd(selections: CustomizationSelection[]): number {
  return selections.reduce((sum, s) => sum + (s.additionalPrice || 0), 0);
}
