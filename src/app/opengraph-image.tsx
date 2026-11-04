import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Open Graph image halaman root — dikirim ke WhatsApp / Facebook / LinkedIn
 * saat tautan dashboard dibagikan. Di-render saat build (statis) dengan
 * Satori via `ImageResponse`, memakai maskot SIAP SAR & warna Basarnas.
 */

// Ukuran standar og:image (1.91:1).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Dashboard SIAP SAR — Sistem Informasi Aset Terpadu, Kantor SAR Kelas B Mamuju";

// Logo maskot SIAP SAR (kotak sayap oranye) dibaca saat build dan
// disisipkan sebagai data URI agar tidak bergantung pada akses jaringan
// saat Satori merender gambar.
async function logoDataUri(): Promise<string> {
  const buffer = await readFile(
    join(process.cwd(), "public", "logo-transparant.png")
  );
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const logo = await logoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          backgroundImage:
            "linear-gradient(135deg, #f97316 0%, #ef6905 45%, #b34a03 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Baris identitas atas */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 118,
              height: 118,
              borderRadius: 24,
              backgroundColor: "#ffffff",
              padding: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              width={94}
              height={94}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                letterSpacing: 2,
                opacity: 0.92,
                textTransform: "uppercase",
              }}
            >
              Badan SAR Nasional
            </div>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.8 }}>
              Kantor Kelas B Mamuju
            </div>
          </div>
        </div>

        {/* Judul utama */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.1,
              textShadow: "0 4px 24px rgba(0,0,0,0.2)",
            }}
          >
            Dashboard SIAP SAR
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              opacity: 0.92,
            }}
          >
            Sistem Informasi Aset Terpadu — Kendali Logbook, Checklist &amp; BMN
          </div>
        </div>

        {/* Badge bawah */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 30px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.4)",
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Operasional · Terintegrasi · Real-time
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
