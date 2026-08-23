import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Noor Bridal | Made-to-Order Bridal Couture",
    template: "%s | Noor Bridal",
  },
  description:
    "Handcrafted made-to-order bridal dresses, gowns and lehengas. Delivered to the USA, Canada and Pakistan in 30–45 days.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
