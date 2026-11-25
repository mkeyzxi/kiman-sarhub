/**
 * Utilitas export laporan ke PDF (.pdf) dengan styling lengkap:
 * warna header oranye khas SAR, border abu-abu gelap pada seluruh sel,
 * zebra striping, judul per sheet, auto-fit kolom, print-ready layout.
 *
 * Menggunakan `jspdf` + `jspdf-autotable` — ringan, tidak butuh browser,
 * dan menghasilkan PDF vektorial yang tajam untuk dicetak.
 *
 * Halaman yang dihasilkan:
 *  1. Ringkasan            — indikator kesiapan, distribusi status aset,
 *                             kesiapan per kategori
 *  2. Logbook Perjalanan  — rincian logbook armada (terfilter tahun terpilih)
 *  3. Performa Unit        — rekap perjalanan per kategori armada
 *  4. Daftar Aset          — master data aset lengkap
 *  5. Personel Aktif       — daftar user aktif
 *
 * Styling konsisten dengan format Excel:
 *  - Header tabel: fill oranye E9641C, teks putih bold, perataan tengah.
 *  - Border: garis tipis abu-abu gelap 455A64 pada seluruh sel.
 *  - Zebra striping: baris genap F5F6F8, baris ganjil FFFFFF.
 *  - Tanggal DD/MM/YYYY, jam HH:MM.
 *  - 1-2 baris kosong antar blok agar mudah dibaca & siap cetak.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  AsetMapped,
  LogbookMapped,
} from "@/components/shared/supabase-mock-mapper";
import type { UserInfo } from "@/components/shared/use-supabase-data";
import type { ReadinessStats } from "@/components/shared/mock-data";

/** Tipe untuk lastAutoTable yang tidak ada di type defs jspdf. */
type JSPDFWithLastAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Format tanggal ISO ("2026-07-01") → "01/07/2026"; aman terhadap null. */
function formatTanggalId(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/** Format tanggal ISO untuk sub-judul (lebih deskriptif). */
function formatTanggalDeskrif(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${String(d).padStart(2, "0")} ${namaBulan[m - 1] ?? m} ${y}`;
}

/** Apakah tanggal ISO termasuk tahun tertentu. */
function dalamTahun(tanggal: string, tahun: string): boolean {
  return tanggal.startsWith(tahun);
}

/** Hitung total jam personel dari daftar logbook. */
function hitungJamPersonel(logbooks: LogbookMapped[]): number {
  return Math.round(
    logbooks.reduce((total, l) => {
      if (!l.jamKembali) return total;
      const [j1, m1] = l.jamBerangkat.split(":").map(Number);
      const [j2, m2] = l.jamKembali.split(":").map(Number);
      const durasi = (j2 * 60 + m2 - (j1 * 60 + m1)) / 60;
      return total + (durasi > 0 ? durasi : 0) * l.jumlahPersonel;
    }, 0)
  );
}

// ─── Palet Warna (konsisten dengan Excel) ──────────────────────────────────
// RGB tuple untuk jspdf (0-255). Hex di komentar agar mudah disesuaikan.

const WARNA = {
  // Oranye khas SAR — header fill
  primer: [233, 100, 28] as [number, number, number],       // #E9641C
  // Aksen garis oranye
  primerGaris: [180, 68, 10] as [number, number, number],    // #B4440A
  // Latar terang sub-judul
  primerTerang: [253, 241, 229] as [number, number, number], // #FDF1E5
  // Abu
  abu: [84, 110, 122] as [number, number, number],           // #546E7A
  abuTerang: [245, 246, 248] as [number, number, number],    // #F5F6F8
  putih: [255, 255, 255] as [number, number, number],        // #FFFFFF
  // Garis tabel (abu-abu gelap — kontras tinggi)
  abuGaris: [69, 90, 100] as [number, number, number],       // #455A64
  // Teks
  teksTabel: [38, 50, 56] as [number, number, number],       // #263238
} as const;

// ─── Opsi styling autotable (digunakan di semua tabel) ────────────────────

/** Ukuran font konsisten seluruh PDF: 9pt untuk teks standar. */
const FONT_SIZE = 9;

/** Opsi header autotable: oranye, putih bold, tengah. */
const HEADER_STYLE = {
  fillColor: WARNA.primer as [number, number, number],
  textColor: WARNA.putih as [number, number, number],
  fontStyle: "bold" as const,
  halign: "center" as const,
  fontSize: FONT_SIZE,
  cellPadding: 4,
};

/** Opsi baris data autotable: zebra, border gelap, teks gelap. */
const BODY_STYLE = {
  textColor: WARNA.teksTabel as [number, number, number],
  fontSize: FONT_SIZE,
  cellPadding: 4,
};

/** Opsi border autotable: garis tipis abu-abu gelap di semua sisi. */
const BORDER_STYLE = {
  color: WARNA.abuGaris as [number, number, number],
  style: "solid" as const,
  lineWidth: 0.5,
};

/** Opsi zebra autotable: baris genap abu terang, ganjil putih. */
const ZEBRA_STYLE = {
  fillColor: WARNA.abuTerang as [number, number, number],
};

// ─── Tipe input ─────────────────────────────────────────────────────────────

export interface DataLaporan {
  tahun: string;
  readinessStats: ReadinessStats;
  asets: AsetMapped[];
  logbookPerjalanan: LogbookMapped[];
  daftarUsers: UserInfo[];
  personelAktif: number;
}

// ─── Helper: judul halaman ─────────────────────────────────────────────────

/**
 * Tambah judul besar + sub-judul di puncak halaman PDF, plus garis
 * bawah oranye sebagai pemisah visual. Mengembalikan posisi Y setelah
 * judul, agar konten tabel bisa dimulai dari bawahnya.
 */
function gambarJudulHalaman(
  doc: jsPDF,
  judul: string,
  subJudul: string,
  x: number,
  yAwal: number
): number {
  // Judul besar oranye — ukuran konsisten dengan body
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(...WARNA.primer);
  doc.text(judul, x, yAwal + 6);

  // Garis bawah oranye medium
  const yGaris = yAwal + 9;
  doc.setDrawColor(...WARNA.primerGaris);
  doc.setLineWidth(1);
  doc.line(x, yGaris, doc.internal.pageSize.getWidth() - x, yGaris);

  // Sub-judul abu — sama ukuran dengan body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(...WARNA.abu);
  doc.text(subJudul, x, yGaris + 6);

  // Posisi Y setelah sub-judul + spasi
  return yGaris + 12;
}

/** Tambah baris spasi antar tabel. */
function spasi(doc: jsPDF, tinggi: number): number {
  // lastAutoTable ada di runtime tapi tidak di type defs jspdf;
  // cast ke any agar lolos TS tanpa runtime impact.
  const last = (doc as JSPDFWithLastAutoTable).lastAutoTable;
  const y = last?.finalY ?? 0;
  return y + tinggi;
}

// ─── API Utama: PDF ────────────────────────────────────────────────────────

/**
 * Ekspor seluruh data laporan ke file PDF multi-halaman dengan styling
 * lengkap (header oranye, border gelap, zebra striping, auto-fit kolom,
 * print-ready) dan unduh di sisi klien.
 *
 * Data logbook perjalanan terfilter tahun terpilih.
 */
export function eksporLaporanPDF(data: DataLaporan): void {
  const { tahun, readinessStats, asets, logbookPerjalanan, daftarUsers } = data;

  const logbookTahun = logbookPerjalanan.filter((l) =>
    dalamTahun(l.tanggal, tahun)
  );
  const jamPersonel = hitungJamPersonel(logbookTahun);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12; // mm
  const x = margin;
  const lebarKonten = pageW - margin * 2;

  // ── Halaman 1: RINGKASAN ───────────────────────────────────────────────
  {
    let y = margin;
    y = gambarJudulHalaman(
      doc,
      `LAPORAN KESIAPAN SAR — TAHUN ${tahun}`,
      `Diunduh: ${formatTanggalDeskrif(new Date().toISOString().slice(0, 10))}`,
      x,
      y
    );

    // Blok A: INDIKATOR
    autoTable(doc, {
      head: [["INDIKATOR", "NILAI"]],
      body: [
        ["Readiness Index (%)", String(readinessStats.readinessIndex)],
        [
          "Aset Standby",
          `${readinessStats.standby} / ${readinessStats.totalAset}`,
        ],
        ["Personel Aktif", String(data.personelAktif)],
        ["Total Logbook Perjalanan", String(logbookTahun.length)],
        ["Jam Personel (Kumulatif)", String(jamPersonel)],
      ],
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: BODY_STYLE,
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
      },
      tableWidth: lebarKonten * 0.5,
      columnStyles: {
        0: { cellWidth: lebarKonten * 0.3 },
        1: { cellWidth: lebarKonten * 0.2 },
      },
      margin: { left: x },
    });

    // Spasi antar blok
    y = spasi(doc, 6);

    // Blok B: DISTRIBUSI STATUS ASET
    autoTable(doc, {
      head: [["DISTRIBUSI STATUS ASET", "JML", "%"]],
      body: [
        ["Standby", String(readinessStats.standby), hitungPersen(readinessStats.standby, readinessStats.totalAset)],
        [
          "Sedang digunakan",
          String(readinessStats.sedangDigunakan),
          hitungPersen(readinessStats.sedangDigunakan, readinessStats.totalAset),
        ],
        ["Maintenance", String(readinessStats.maintenance), hitungPersen(readinessStats.maintenance, readinessStats.totalAset)],
        [
          "Rusak Ringan",
          String(readinessStats.rusakRingan),
          hitungPersen(readinessStats.rusakRingan, readinessStats.totalAset),
        ],
        [
          "Rusak Berat",
          String(readinessStats.rusakBerat),
          hitungPersen(readinessStats.rusakBerat, readinessStats.totalAset),
        ],
      ],
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: BODY_STYLE,
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
      },
      tableWidth: lebarKonten * 0.5,
      columnStyles: {
        0: { cellWidth: lebarKonten * 0.25 },
        1: { cellWidth: lebarKonten * 0.1 },
        2: { cellWidth: lebarKonten * 0.1 },
      },
      margin: { left: x },
    });

    // Spasi
    y = spasi(doc, 6);

    // Blok C: KESIAPAN PER KATEGORI
    autoTable(doc, {
      head: [["KATEGORI", "TOTAL ASET", "STANDBY", "PERSENTASE"]],
      body: readinessStats.kesiapanPerKategori.map((k) => [
        k.kategori,
        String(k.total),
        String(k.standby),
        `${k.persentase}%`,
      ]),
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: BODY_STYLE,
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
      },
      tableWidth: lebarKonten,
      margin: { left: x },
    });
  }

  // ── Halaman 2: LOGBOOK PERJALANAN ────────────────────────────────────
  doc.addPage();
  {
    let y = margin;
    y = gambarJudulHalaman(
      doc,
      `LOGBOOK PERJALANAN — TAHUN ${tahun}`,
      `Total: ${logbookTahun.length} perjalanan`,
      x,
      y
    );

    autoTable(doc, {
      head: [
        [
          "Tanggal",
          "Jam Berangkat",
          "Jam Kembali",
          "Rute",
          "Tujuan",
          "Jenis Unit",
          "Kategori",
          "Pengguna",
          "Personel",
          "BBM Seblm",
          "BBM Sesd",
          "Status",
          "Catatan",
        ],
      ],
      body: logbookTahun.map((l) => [
        formatTanggalId(l.tanggal),
        l.jamBerangkat,
        l.jamKembali || "—",
        l.rute,
        l.tujuan,
        l.jenisUnit,
        l.kategoriUnit ?? "—",
        l.nahkoda,
        String(l.jumlahPersonel),
        l.bbmSebelum,
        l.bbmSesudah,
        l.status,
        l.catatan || "—",
      ]),
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: {
        ...BODY_STYLE,
        fontSize: FONT_SIZE,
        cellPadding: 2,
      },
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
        fontSize: FONT_SIZE,
        cellPadding: 2,
      },
      tableWidth: lebarKonten,
      margin: { left: x },
      pageBreak: "avoid",
    });
  }

  // ── Halaman 3: PERFORMA UNIT ─────────────────────────────────────────
  doc.addPage();
  {
    let y = margin;
    y = gambarJudulHalaman(
      doc,
      `PERFORMA UNIT — TAHUN ${tahun}`,
      "Rekap perjalanan per kategori armada",
      x,
      y
    );

    const air = logbookTahun.filter((l) =>
      ["Kapal", "RIB", "RBB"].includes(l.kategoriUnit ?? "")
    );
    const darat = logbookTahun.filter((l) =>
      ["Mobil", "Motor"].includes(l.kategoriUnit ?? "")
    );

    autoTable(doc, {
      head: [["Kategori", "Jumlah Perjalanan"]],
      body: [
        ["Kapal & Perahu Karet (Kapal/RIB/RBB)", String(air.length)],
        ["Kendaraan Darat (Mobil/Motor)", String(darat.length)],
        ["Jam Personel (Kumulatif)", String(jamPersonel)],
      ],
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: BODY_STYLE,
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
      },
      tableWidth: lebarKonten * 0.6,
      columnStyles: {
        0: { cellWidth: lebarKonten * 0.4 },
        1: { cellWidth: lebarKonten * 0.2 },
      },
      margin: { left: x },
    });
  }

  // ── Halaman 4: DAFTAR ASET ───────────────────────────────────────────
  doc.addPage();
  {
    let y = margin;
    y = gambarJudulHalaman(
      doc,
      `DAFTAR ASET — TAHUN ${tahun}`,
      `Total: ${asets.length} aset`,
      x,
      y
    );

    autoTable(doc, {
      head: [
        [
          "Kode",
          "Nama Aset",
          "Kategori",
          "Status",
          "Kondisi",
          "Lokasi",
          "PJ",
          "Tgl. Penet.",
          "NUP",
          "Keterangan",
        ],
      ],
      body: asets.map((a) => [
        a.kode,
        a.nama,
        a.kategori,
        a.status,
        a.kondisi,
        a.lokasi,
        a.penanggungJawab,
        formatTanggalId(a.tanggalPenetapan),
        a.nup,
        a.keterangan || "—",
      ]),
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: {
        ...BODY_STYLE,
        fontSize: FONT_SIZE,
        cellPadding: 2,
      },
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
        fontSize: FONT_SIZE,
        cellPadding: 2,
      },
      tableWidth: lebarKonten,
      margin: { left: x },
      pageBreak: "avoid",
    });
  }

  // ── Halaman 5: PERSONEL AKTIF ────────────────────────────────────────
  doc.addPage();
  {
    let y = margin;
    const usersAktif = daftarUsers.filter((u) => u.aktif);
    y = gambarJudulHalaman(
      doc,
      `PERSONEL AKTIF — TAHUN ${tahun}`,
      `Total: ${data.personelAktif} personel aktif`,
      x,
      y
    );

    autoTable(doc, {
      head: [["NIP", "Nama", "Email", "Role", "Status"]],
      body: usersAktif.map((u) => [
        u.nip,
        u.nama,
        u.email,
        u.role,
        u.aktif ? "Aktif" : "Nonaktif",
      ]),
      startY: y,
      theme: "grid",
      headStyles: HEADER_STYLE,
      bodyStyles: BODY_STYLE,
      alternateRowStyles: ZEBRA_STYLE,
      styles: {
        ...BORDER_STYLE,
        lineColor: WARNA.abuGaris as [number, number, number],
      },
      tableWidth: lebarKonten,
      margin: { left: x },
    });
  }

  // ── Footer semua halaman ─────────────────────────────────────────────
  const totalHalaman = doc.getNumberOfPages();
  for (let i = 1; i <= totalHalaman; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZE);
    doc.setTextColor(...WARNA.abu);
    doc.text(
      `Dashboard Siap SAR • Halaman ${i} dari ${totalHalaman}`,
      pageW / 2,
      pageH - 5,
      { align: "center" }
    );
  }

  // ── Unduh ─────────────────────────────────────────────────────────────
  doc.save(`laporan-kesiapan-sar-${tahun}.pdf`);
}

/** Hitung persen dari jumlah terhadap total aset. */
function hitungPersen(jumlah: number, total: number): string {
  if (total === 0) return "—";
  return `${((jumlah / total) * 100).toFixed(1)}%`;
}
