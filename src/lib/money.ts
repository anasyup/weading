// All money is stored as integer minor units (cents / paisa).
// USD renders with 2 decimals; PKR renders without decimals (D-16).

export function formatMoney(minor: number, currency: string): string {
  if (currency === "PKR") {
    const v = Math.round(minor / 100);
    return "₨" + v.toLocaleString("en-US");
  }
  return (
    "$" +
    (minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function parseMoneyToMinor(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}
