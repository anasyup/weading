import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bridal Dresses | Handcrafted Pakistani Bridal Couture — USA",
    template: "%s | Bridal Dresses",
  },
  description:
    "Handcrafted Pakistani bridal couture for the USA — zardozi, dabka and resham hand embroidery, made to order in 30–45 days. Nikkah, Mehndi, Baraat, Walima and occasion wear shipped across America.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
