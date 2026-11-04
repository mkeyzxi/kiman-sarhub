import type { MetadataRoute } from "next";

/**
 * Web App Manifest — membuat dashboard dapat "Install" sebagai aplikasi
 * (PWA) di Android/Chrome dan mengatur warna tema jendela browser.
 *
 * File konvensi khusus Next.js: di-render sebagai /manifest.webmanifest
 * dan dirujuk otomatis lewat `metadata.manifest` di root layout.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dashboard SIAP SAR",
    short_name: "SIAP SAR",
    description:
      "Sistem Informasi Aset Terpadu — Kantor Pencarian dan Pertolongan Kelas B Mamuju",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "id",
    background_color: "#f8fafc",
    theme_color: "#ef6905",
    categories: ["government", "productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
