import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** URL publik situs — dipakai untuk membangun URL absolut Open Graph. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const JUDUL_SITUS = "Dashboard SIAP SAR";
const DESKRIPSI_SITUS =
  "Sistem Informasi Aset Terpadu — Kantor Pencarian dan Pertolongan Kelas B Mamuju. Kelola logbook perjalanan, checklist harian, berita acara, dan maintenance aset BMN dalam satu dashboard.";

// Metadata lengkap situs. Tag icon/og:image/twitter:image otomatis dari
// file konvensi: favicon.ico, icon.png, apple-icon.png, opengraph-image.tsx
// dan twitter-image.tsx di direktori app ini.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${JUDUL_SITUS} · Basarnas Mamuju`,
    template: `%s · SIAP SAR`,
  },
  description: DESKRIPSI_SITUS,
  applicationName: "SIAP SAR",
  authors: [{ name: "Kantor SAR Kelas B Mamuju", url: siteUrl }],
  creator: "Kantor SAR Kelas B Mamuju",
  publisher: "Badan Nasional Pencarian dan Pertolongan",
  keywords: [
    "SAR",
    "Basarnas",
    "Mamuju",
    "dashboard",
    "aset BMN",
    "logbook",
    "checklist harian",
    "berita acara",
    "SIAP SAR",
  ],
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "SIAP SAR — Basarnas Mamuju",
    title: `${JUDUL_SITUS} — Sistem Informasi Aset Terpadu`,
    description: DESKRIPSI_SITUS,
    // og:image otomatis dari src/app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: `${JUDUL_SITUS} — Sistem Informasi Aset Terpadu`,
    description: DESKRIPSI_SITUS,
    // twitter:image otomatis dari src/app/twitter-image.tsx
  },
};

// themeColor & pengaturan viewport pindah ke export `viewport` sejak
// Next.js 14/15+ (tidak lagi di dalam metadata).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ef6905",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
