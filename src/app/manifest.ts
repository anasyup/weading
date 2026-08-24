import type { MetadataRoute } from "next";

// PWA manifest — makes the storefront installable on phones ("Add to Home Screen")
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bridal Dresses — Luxury Wedding Dresses",
    short_name: "Bridal Dresses",
    description:
      "Handcrafted bridal dresses, gowns and lehengas, made to your measurements. USA · Canada · Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#211d1a",
    icons: [
      {
        src: "/uploads/hero.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
