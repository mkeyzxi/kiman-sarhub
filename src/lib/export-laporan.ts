/**
 * Utilitas export laporan: merangkai data laporan & analisis menjadi
 * workbook Excel multi-sheet (.xlsx) dengan styling lengkap (border,
 * warna, merge cell, fill, auto-fit kolom) atau file CSV, lalu mengunduh
 * di sisi klien.
 *
 * Sheet yang dihasilkan (format Excel):
 *  1. Ringkasan            — indikator kesiapan, distribusi status aset,
 *                             kesiapan per kategori
 *  2. Logbook Perjalanan  — rincian logbook armada (terfilter tahun terpilih)
 *  3. Performa Unit        — rekap perjalanan per kategori armada
 *  4. Daftar Aset          — master data aset lengkap
 *  5. Personel Aktif       — daftar user aktif
 *
 * Styling:
 *  - Header: fill oranye khas SAR (E9641C), teks putih bold, perataan
 *    TENGAH (center alignment).
 *  - Border: garis tipis abu-abu gelap (455A64) pada SELURUH sel —
 *    header & data — sehingga garis selalu terlihat, termasuk saat
 *    dicetak grayscale.
 *  - Auto-fit kolom: lebar dihitung dari teks terpanjang + padding
 *    ekstra, sehingga tidak ada teks yang terpotong atau tanggal yang
 *    berubah menjadi "####".
 *  - Format data: tanggal DD/MM/YYYY, jam HH:MM, BBM tetap terbaca.
 *  - Tata letak: 1-2 baris kosong antar blok tabel agar print-ready.
 *  - Print setup: A4 landscape, fit-to-page aktif, horizontal centered.
 */

import * as ExcelJS from "exceljs";
import type {
  AsetMapped,
  LogbookMapped,
} from "@/components/shared/supabase-mock-mapper";
import type { UserInfo } from "@/components/shared/use-supabase-data";
import type { ReadinessStats } from "@/components/shared/mock-data";

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

// ─── Warna & Gaya ────────────────────────────────────────────────────────────
// Palet selaras dengan tema aplikasi. Header memakai oranye khas SAR.
// Border memakai abu-abu gelap (455A64) agar selalu kontras dengan fill.

const WARNA = {
  primer: "FFE9641C",       // oranye khas SAR (header fill)
  primerGaris: "FFB4440A",  // aksen garis oranye
  primerTerang: "FFFDF1E5", // latar terang untuk sub-judul
  abu: "FF546E7A",
  abuTerang: "FFF5F6F8",
  putih: "FFFFFFFF",
  abuGaris: "FF455A64",     // garis tabel (abu-abu gelap — kontras tinggi)
  teksTabel: "FF263238",
} as const;

const clr = (argb: string) => ({ argb });

/**
 * Border tipis abu-abu gelap — diterapkan ke SELURUH sel (header & data)
 * agar garis selalu terlihat jelas, termasuk saat dicetak grayscale.
 */
const BORDIR_SEMUA: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: clr(WARNA.abuGaris) },
  bottom: { style: "thin", color: clr(WARNA.abuGaris) },
  left: { style: "thin", color: clr(WARNA.abuGaris) },
  right: { style: "thin", color: clr(WARNA.abuGaris) },
};

const FONT_JUDUL: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  color: clr(WARNA.primer),
  name: "Calibri",
};

const FONT_SUB: Partial<ExcelJS.Font> = {
  size: 10,
  color: clr(WARNA.abu),
  name: "Calibri",
};

/** Header tabel: putih bold di atas fill oranye, perataan TENGAH. */
const FONT_HEADER: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  color: clr(WARNA.putih),
  name: "Calibri",
};

const FONT_NORMAL: Partial<ExcelJS.Font> = {
  size: 11,
  color: clr(WARNA.teksTabel),
  name: "Calibri",
};

const FILL_HEADER: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: clr(WARNA.primer),
};

const FILL_SUBJUDUL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: clr(WARNA.primerTerang),
};

const FILL_BARIS_GENAP: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: clr(WARNA.abuTerang),
};

const FILL_BARIS_GANJIL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: clr(WARNA.putih),
};

/**
 * Auto-fit lebar kolom: hitung panjang karakter terpanjang di setiap
 * kolom (header + semua baris data), tambahkan padding 4 karakter,
 * dan batasi minimum 10 / maksimum 60 agar tidak terlalu sempit atau
 * terlalu lebar. Mengembalikan array lebar (sama panjangnya dengan
 * `headers`).
 */
function hitungLebarKolom(
  headers: string[],
  rows: (string | number)[][]
): number[] {
  return headers.map((h, col) => {
    let max = h.length;
    for (const r of rows) {
      const cell = r[col];
      if (cell !== undefined && cell !== null) {
        const s = String(cell);
        if (s.length > max) max = s.length;
      }
    }
    // padding 4 (2 kiri + 2 kanan) agar teks tidak menempel dinding
    const width = Math.min(60, Math.max(10, max + 4));
    return width;
  });
}

// ─── Tipe input ─────────────────────────────────────────────────────────────

export interface DataLaporan {
  tahun: string;
  readinessStats: ReadinessStats;
  asets: AsetMapped[];
  logbookPerjalanan: LogbookMapped[];
  daftarUsers: UserInfo[];
  personelAktif: number;
}

// ─── Gaya helper per sheet ─────────────────────────────────────────────────

/**
 * Styling baris header tabel: fill oranye, teks putih bold, perataan
 * TENGAH, border abu-abu gelap, tinggi baris yang cukup.
 */
function terapkanGayaHeaderBaris(
  ws: ExcelJS.Worksheet,
  nomorBaris: number,
  jumlahKolom: number
): void {
  const row = ws.getRow(nomorBaris);
  for (let col = 1; col <= jumlahKolom; col++) {
    const cell = row.getCell(col);
    cell.font = FONT_HEADER;
    cell.fill = FILL_HEADER;
    cell.border = BORDIR_SEMUA;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
      textRotation: 0,
      shrinkToFit: false,
      indent: 0,
      readingOrder: "ltr",
    };
  }
  row.height = 24;
}

/**
 * Styling baris data: zebra striping, border abu-abu gelap, teks rata
 * kiri (angka rata kanan), high-wrap, tinggi baris yang cukup.
 */
function terapkanGayaBarisData(
  ws: ExcelJS.Worksheet,
  nomorBaris: number,
  jumlahKolom: number,
  genap: boolean
): void {
  const row = ws.getRow(nomorBaris);
  const fill = genap ? FILL_BARIS_GENAP : FILL_BARIS_GANJIL;
  for (let col = 1; col <= jumlahKolom; col++) {
    const cell = row.getCell(col);
    const isNumber = typeof cell.value === "number";
    cell.font = FONT_NORMAL;
    cell.fill = fill;
    cell.border = BORDIR_SEMUA;
    cell.alignment = {
      vertical: "middle",
      horizontal: isNumber ? "right" : "left",
      wrapText: true,
      textRotation: 0,
      shrinkToFit: false,
      indent: 0,
      readingOrder: "ltr",
    };
  }
  row.height = 20;
}

/**
 * Styling judul (baris 1) + sub-judul (baris 2).
 *
 * - Judul: merged, font bold oranye, garis bawah medium oranye sebagai
 *   "kaki" judul — sel kosong di merge tetap diberi gaya agar tidak
 *   muncul kotak grid saat dicetak.
 * - Sub-judul: merged, fill oranye terang, teks kecil abu.
 */
function terapkanGayaJudul(
  ws: ExcelJS.Worksheet,
  teks: string,
  subTeks?: string,
  jumlahKolomMerge = 4
): void {
  const r1 = ws.getRow(1);
  r1.getCell(1).value = teks;
  r1.font = FONT_JUDUL;
  r1.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: false,
    textRotation: 0,
    shrinkToFit: false,
    indent: 0,
    readingOrder: "ltr",
  };
  r1.height = 30;
  // Beri gaya ke semua sel di baris merge (termasuk yang kosong)
  for (let col = 1; col <= jumlahKolomMerge; col++) {
    const c = r1.getCell(col);
    c.font = FONT_JUDUL;
    c.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: false,
      textRotation: 0,
      shrinkToFit: false,
      indent: 0,
      readingOrder: "ltr",
    };
    // Garis bawah medium oranye — terlihat sebagai "kaki" judul.
    c.border = {
      bottom: { style: "medium", color: clr(WARNA.primerGaris) },
    };
  }
  ws.mergeCells(1, 1, 1, jumlahKolomMerge);

  if (subTeks) {
    const r2 = ws.getRow(2);
    r2.getCell(1).value = subTeks;
    r2.font = FONT_SUB;
    r2.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: false,
      textRotation: 0,
      shrinkToFit: false,
      indent: 0,
      readingOrder: "ltr",
    };
    for (let col = 1; col <= jumlahKolomMerge; col++) {
      const c = r2.getCell(col);
      c.font = FONT_SUB;
      c.fill = FILL_SUBJUDUL;
      c.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: false,
        textRotation: 0,
        shrinkToFit: false,
        indent: 0,
        readingOrder: "ltr",
      };
    }
    ws.mergeCells(2, 1, 2, jumlahKolomMerge);
    r2.height = 18;
  }
}

/**
 * Set auto-fit lebar kolom pada worksheet berdasarkan header + data.
 *
 * PENTING — cara ini AMAN terhadap style yang sudah ada.
 * Setter ws.columns = [] akan MEMBANGUN SEMULA column models dari
 * snapshot baris 1, sehingga semua style sel di baris 1 (judul/sub-judul
 * yang sudah diberi font, fill, border) akan TERHAPUS. Itulah penyebab
 * file hasil download menjadi polos.
 *
 * Karena itu kita set lebar per kolom dengan ws.getColumn(i).width = w,
 * yang HANYA mengubah properti width tanpa menyentuh style sel apa pun.
 *
 * Panggil SETELAH semua baris data + styling selesai ditambahkan.
 */
function setLebarKolom(
  ws: ExcelJS.Worksheet,
  headers: string[],
  rows: (string | number)[][]
): void {
  const widths = hitungLebarKolom(headers, rows);
  for (let i = 0; i < widths.length; i++) {
    ws.getColumn(i + 1).width = widths[i];
  }
}

// ─── API Utama: Excel ───────────────────────────────────────────────────────

/**
 * Ekspor seluruh data laporan ke file Excel (.xlsx) multi-sheet dengan
 * styling lengkap (border, warna, merge cell, fill, auto-fit) dan unduh
 * di sisi klien. Data logbook perjalanan terfilter tahun terpilih.
 */
export async function eksporLaporanExcel(data: DataLaporan): Promise<void> {
  const { tahun, readinessStats, logbookPerjalanan } = data;

  const logbookTahun = logbookPerjalanan.filter((l) =>
    dalamTahun(l.tanggal, tahun)
  );
  const jamPersonel = hitungJamPersonel(logbookTahun);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Siap SAR";
  workbook.created = new Date();

  // ── Sheet 1: Ringkasan ──────────────────────────────────────────────────
  const wsRingkasan = workbook.addWorksheet("Ringkasan", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 3 }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      verticalCentered: false,
    },
    headerFooter: {
      oddHeader: `Laporan Kesiapan SAR — Tahun ${tahun}`,
      oddFooter: "Dashboard Siap SAR • Halaman &P dari &N",
    },
    properties: { tabColor: { argb: WARNA.primer } },
  });

  // Judul
  terapkanGayaJudul(
    wsRingkasan,
    `LAPORAN KESIAPAN SAR — TAHUN ${tahun}`,
    `Diunduh: ${formatTanggalDeskrif(new Date().toISOString().slice(0, 10))}`,
    4
  );

  // Baris 3: kosong (spasi antar judul & tabel)
  wsRingkasan.getRow(3).height = 10;

  // ── Blok A: INDIKATOR ──────────────────────────────────────────────────
  const rIndikatorAwal = 4;
  const barisIndikator: [string, string | number][] = [
    ["INDIKATOR", "NILAI"],
    ["Readiness Index (%)", readinessStats.readinessIndex],
    [
      "Aset Standby",
      `${readinessStats.standby} / ${readinessStats.totalAset}`,
    ],
    ["Personel Aktif", data.personelAktif],
    ["Total Logbook Perjalanan", logbookTahun.length],
    ["Jam Personel (Kumulatif)", jamPersonel],
  ];

  barisIndikator.forEach(([label, nilai], i) => {
    const nomorBaris = rIndikatorAwal + i;
    const row = wsRingkasan.getRow(nomorBaris);
    row.getCell(1).value = label;
    row.getCell(2).value = nilai;
    if (i === 0) {
      terapkanGayaHeaderBaris(wsRingkasan, nomorBaris, 2);
    } else {
      terapkanGayaBarisData(wsRingkasan, nomorBaris, 2, i % 2 === 0);
    }
  });

  // Spasi antar blok (1-2 baris kosong)
  const rSpasi1 = rIndikatorAwal + barisIndikator.length;
  wsRingkasan.getRow(rSpasi1).height = 10;
  wsRingkasan.getRow(rSpasi1 + 1).height = 6;

  // ── Blok B: DISTRIBUSI STATUS ASET ────────────────────────────────────
  const rDistribusiAwal = rSpasi1 + 2;
  const distribusi: [string, number][] = [
    ["DISTRIBUSI STATUS ASET", 0],
    ["Standby", readinessStats.standby],
    ["Sedang digunakan", readinessStats.sedangDigunakan],
    ["Maintenance", readinessStats.maintenance],
    ["Rusak Ringan", readinessStats.rusakRingan],
    ["Rusak Berat", readinessStats.rusakBerat],
  ];
  distribusi.forEach(([label, jml], i) => {
    const nomorBaris = rDistribusiAwal + i;
    const row = wsRingkasan.getRow(nomorBaris);
    row.getCell(1).value = label;
    const totalAset = readinessStats.totalAset;
    const persen =
      totalAset === 0 ? "—" : `${((jml / totalAset) * 100).toFixed(1)}%`;
    row.getCell(2).value = jml;
    row.getCell(3).value = i === 0 ? "JML" : persen;

    if (i === 0) {
      terapkanGayaHeaderBaris(wsRingkasan, nomorBaris, 3);
    } else {
      terapkanGayaBarisData(wsRingkasan, nomorBaris, 3, i % 2 === 0);
    }
  });

  // Spasi antar blok
  const rSpasi2 = rDistribusiAwal + distribusi.length;
  wsRingkasan.getRow(rSpasi2).height = 10;
  wsRingkasan.getRow(rSpasi2 + 1).height = 6;

  // ── Blok C: KESIAPAN PER KATEGORI ────────────────────────────────────
  const rKategoriAwal = rSpasi2 + 2;
  const headerKategori = [
    "KATEGORI",
    "TOTAL ASET",
    "STANDBY",
    "PERSENTASE",
  ];
  const rowHeader = wsRingkasan.getRow(rKategoriAwal);
  headerKategori.forEach((h, i) => {
    rowHeader.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsRingkasan, rKategoriAwal, 4);

  readinessStats.kesiapanPerKategori.forEach((k, i) => {
    const nomorBaris = rKategoriAwal + 1 + i;
    const row = wsRingkasan.getRow(nomorBaris);
    row.getCell(1).value = k.kategori;
    row.getCell(2).value = k.total;
    row.getCell(3).value = k.standby;
    row.getCell(4).value = `${k.persentase}%`;
    terapkanGayaBarisData(wsRingkasan, nomorBaris, 4, i % 2 === 0);
  });

  // Auto-fit kolom untuk seluruh sheet Ringkasan
  const ringkasanRows: (string | number)[][] = [
    ...barisIndikator.map(([a, b]) => [a, b]),
    ...distribusi.map(([a, b]) => [a, b, ""]),
    ...headerKategori.map((h, i) => [
      i === 0 ? h : "",
      i === 1 ? h : "",
      i === 2 ? h : "",
      i === 3 ? h : "",
    ]),
    ...readinessStats.kesiapanPerKategori.map((k) => [
      k.kategori,
      k.total,
      k.standby,
      `${k.persentase}%`,
    ]),
  ];
  setLebarKolom(
    wsRingkasan,
    ["KATEGORI", "TOTAL ASET", "STANDBY", "PERSENTASE"],
    ringkasanRows
  );

  // ── Sheet 2: Logbook Perjalanan ────────────────────────────────────────
  const wsLogbook = workbook.addWorksheet("Logbook Perjalanan", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 3 }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      verticalCentered: false,
    },
    headerFooter: {
      oddHeader: `Logbook Perjalanan — Tahun ${tahun}`,
      oddFooter: "Dashboard Siap SAR • Halaman &P dari &N",
    },
    properties: { tabColor: { argb: WARNA.primer } },
  });

  const headerLogbook = [
    "Tanggal",
    "Jam Berangkat",
    "Jam Kembali",
    "Rute",
    "Tujuan",
    "Jenis Unit",
    "Kategori",
    "Pengguna",
    "Personel",
    "BBM Sebelum",
    "BBM Sesudah",
    "Status",
    "Catatan",
  ];

  terapkanGayaJudul(
    wsLogbook,
    `LOGBOOK PERJALANAN — TAHUN ${tahun}`,
    `Total: ${logbookTahun.length} perjalanan`,
    headerLogbook.length
  );

  wsLogbook.getRow(3).height = 10;

  const rHeaderLogbook = 4;
  const rowHeaderLogbook = wsLogbook.getRow(rHeaderLogbook);
  headerLogbook.forEach((h, i) => {
    rowHeaderLogbook.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsLogbook, rHeaderLogbook, headerLogbook.length);

  const barisLogbook: (string | number)[][] = [];
  logbookTahun.forEach((l, i) => {
    const nomorBaris = rHeaderLogbook + 1 + i;
    const row = wsLogbook.getRow(nomorBaris);
    row.getCell(1).value = formatTanggalId(l.tanggal);
    row.getCell(2).value = l.jamBerangkat;
    row.getCell(3).value = l.jamKembali || "—";
    row.getCell(4).value = l.rute;
    row.getCell(5).value = l.tujuan;
    row.getCell(6).value = l.jenisUnit;
    row.getCell(7).value = l.kategoriUnit ?? "—";
    row.getCell(8).value = l.nahkoda;
    row.getCell(9).value = l.jumlahPersonel;
    row.getCell(10).value = l.bbmSebelum;
    row.getCell(11).value = l.bbmSesudah;
    row.getCell(12).value = l.status;
    row.getCell(13).value = l.catatan || "—";
    terapkanGayaBarisData(
      wsLogbook,
      nomorBaris,
      headerLogbook.length,
      i % 2 === 0
    );
    barisLogbook.push([
      formatTanggalId(l.tanggal),
      l.jamBerangkat,
      l.jamKembali || "—",
      l.rute,
      l.tujuan,
      l.jenisUnit,
      l.kategoriUnit ?? "—",
      l.nahkoda,
      l.jumlahPersonel,
      l.bbmSebelum,
      l.bbmSesudah,
      l.status,
      l.catatan || "—",
    ]);
  });

  setLebarKolom(wsLogbook, headerLogbook, barisLogbook);

  // ── Sheet 3: Performa Unit ──────────────────────────────────────────────
  const wsPerforma = workbook.addWorksheet("Performa Unit", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 3 }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      verticalCentered: false,
    },
    headerFooter: {
      oddHeader: `Performa Unit — Tahun ${tahun}`,
      oddFooter: "Dashboard Siap SAR • Halaman &P dari &N",
    },
    properties: { tabColor: { argb: WARNA.primer } },
  });

  const headerPerforma = ["Kategori", "Jumlah Perjalanan"];

  terapkanGayaJudul(
    wsPerforma,
    `PERFORMA UNIT — TAHUN ${tahun}`,
    "Rekap perjalanan per kategori armada",
    2
  );

  wsPerforma.getRow(3).height = 10;

  const air = logbookTahun.filter((l) =>
    ["Kapal", "RIB", "RBB"].includes(l.kategoriUnit ?? "")
  );
  const darat = logbookTahun.filter((l) =>
    ["Mobil", "Motor"].includes(l.kategoriUnit ?? "")
  );

  const rHeaderPerforma = 4;
  const rowHeaderPerforma = wsPerforma.getRow(rHeaderPerforma);
  headerPerforma.forEach((h, i) => {
    rowHeaderPerforma.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsPerforma, rHeaderPerforma, headerPerforma.length);

  const barisPerforma: [string, number][] = [
    ["Kapal & Perahu Karet (Kapal/RIB/RBB)", air.length],
    ["Kendaraan Darat (Mobil/Motor)", darat.length],
    ["Jam Personel (Kumulatif)", jamPersonel],
  ];
  barisPerforma.forEach(([label, nilai], i) => {
    const nomorBaris = rHeaderPerforma + 1 + i;
    const row = wsPerforma.getRow(nomorBaris);
    row.getCell(1).value = label;
    row.getCell(2).value = nilai;
    terapkanGayaBarisData(wsPerforma, nomorBaris, 2, i % 2 === 0);
  });

  setLebarKolom(
    wsPerforma,
    headerPerforma,
    barisPerforma.map(([l, n]) => [l, n])
  );

  // ── Sheet 4: Daftar Aset ────────────────────────────────────────────────
  const wsAset = workbook.addWorksheet("Daftar Aset", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 3 }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      verticalCentered: false,
    },
    headerFooter: {
      oddHeader: `Daftar Aset — Tahun ${tahun}`,
      oddFooter: "Dashboard Siap SAR • Halaman &P dari &N",
    },
    properties: { tabColor: { argb: WARNA.primer } },
  });

  const headerAset = [
    "Kode",
    "Nama Aset",
    "Kategori",
    "Status",
    "Kondisi",
    "Lokasi",
    "Penanggung Jawab",
    "Tgl. Penetapan",
    "NUP",
    "Keterangan",
  ];
  terapkanGayaJudul(
    wsAset,
    `DAFTAR ASET — TAHUN ${tahun}`,
    `Total: ${data.asets.length} aset`,
    headerAset.length
  );

  wsAset.getRow(3).height = 10;

  const rHeaderAset = 4;
  const rowHeaderAset = wsAset.getRow(rHeaderAset);
  headerAset.forEach((h, i) => {
    rowHeaderAset.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsAset, rHeaderAset, headerAset.length);

  const barisAset: (string | number)[][] = [];
  data.asets.forEach((a, i) => {
    const nomorBaris = rHeaderAset + 1 + i;
    const row = wsAset.getRow(nomorBaris);
    row.getCell(1).value = a.kode;
    row.getCell(2).value = a.nama;
    row.getCell(3).value = a.kategori;
    row.getCell(4).value = a.status;
    row.getCell(5).value = a.kondisi;
    row.getCell(6).value = a.lokasi;
    row.getCell(7).value = a.penanggungJawab;
    row.getCell(8).value = formatTanggalId(a.tanggalPenetapan);
    row.getCell(9).value = a.nup;
    row.getCell(10).value = a.keterangan || "—";
    terapkanGayaBarisData(wsAset, nomorBaris, headerAset.length, i % 2 === 0);
    barisAset.push([
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
    ]);
  });

  setLebarKolom(wsAset, headerAset, barisAset);

  // ── Sheet 5: Personel Aktif ─────────────────────────────────────────────
  const wsPersonel = workbook.addWorksheet("Personel Aktif", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 3 }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      verticalCentered: false,
    },
    headerFooter: {
      oddHeader: `Personel Aktif — Tahun ${tahun}`,
      oddFooter: "Dashboard Siap SAR • Halaman &P dari &N",
    },
    properties: { tabColor: { argb: WARNA.primer } },
  });

  const headerPersonel = ["NIP", "Nama", "Email", "Role", "Status"];
  terapkanGayaJudul(
    wsPersonel,
    `PERSONEL AKTIF — TAHUN ${tahun}`,
    `Total: ${data.personelAktif} personel aktif`,
    headerPersonel.length
  );

  wsPersonel.getRow(3).height = 10;

  const rHeaderPersonel = 4;
  const rowHeaderPersonel = wsPersonel.getRow(rHeaderPersonel);
  headerPersonel.forEach((h, i) => {
    rowHeaderPersonel.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(
    wsPersonel,
    rHeaderPersonel,
    headerPersonel.length
  );

  const usersAktif = data.daftarUsers.filter((u) => u.aktif);
  const barisPersonel: (string | number)[][] = [];
  usersAktif.forEach((u, i) => {
    const nomorBaris = rHeaderPersonel + 1 + i;
    const row = wsPersonel.getRow(nomorBaris);
    row.getCell(1).value = u.nip;
    row.getCell(2).value = u.nama;
    row.getCell(3).value = u.email;
    row.getCell(4).value = u.role;
    row.getCell(5).value = u.aktif ? "Aktif" : "Nonaktif";
    terapkanGayaBarisData(
      wsPersonel,
      nomorBaris,
      headerPersonel.length,
      i % 2 === 0
    );
    barisPersonel.push([
      u.nip,
      u.nama,
      u.email,
      u.role,
      u.aktif ? "Aktif" : "Nonaktif",
    ]);
  });

  setLebarKolom(wsPersonel, headerPersonel, barisPersonel);

  // ── Unduh ───────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-kesiapan-sar-${tahun}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── API Kedua: CSV (satu file, gabung semua data) ────────────────────────

/**
 * Ekspor data laporan ke file CSV (satu file gabungan) dan unduh di sisi
 * klien. Dipakai bila pengguna memilih format CSV — kompatibel dengan
 * Google Sheets, Excel, dan aplikasi statistik.
 *
 * - Pemisah: koma (,) secara konsisten.
 * - Tanggal diformat DD/MM/YYYY, jam HH:MM, angka tetap angka — sehingga
 *   tidak terpotong atau berubah format saat dibuka di Excel.
 * - BOM UTF-8 agar karakter Indonesia terbaca benar.
 */
export function eksporLaporanCSV(data: DataLaporan): void {
  const { tahun, readinessStats, logbookPerjalanan } = data;

  const logbookTahun = logbookPerjalanan.filter((l) =>
    dalamTahun(l.tanggal, tahun)
  );
  const jamPersonel = hitungJamPersonel(logbookTahun);

  const baris: string[][] = [];

  // Bagian 1: Ringkasan
  baris.push([`LAPORAN KESIAPAN SAR — TAHUN ${tahun}`]);
  baris.push([
    `Diunduh: ${formatTanggalDeskrif(
      new Date().toISOString().slice(0, 10)
    )}`,
  ]);
  baris.push([]);
  baris.push(["INDIKATOR", "NILAI"]);
  baris.push([
    "Readiness Index (%)",
    String(readinessStats.readinessIndex),
  ]);
  baris.push([
    "Aset Standby",
    `${readinessStats.standby} / ${readinessStats.totalAset}`,
  ]);
  baris.push(["Personel Aktif", String(data.personelAktif)]);
  baris.push([
    "Total Logbook Perjalanan",
    String(logbookTahun.length),
  ]);
  baris.push(["Jam Personel (Kumulatif)", String(jamPersonel)]);
  baris.push([]);
  baris.push(["DISTRIBUSI STATUS ASET", "JML"]);
  baris.push(["Standby", String(readinessStats.standby)]);
  baris.push([
    "Sedang digunakan",
    String(readinessStats.sedangDigunakan),
  ]);
  baris.push(["Maintenance", String(readinessStats.maintenance)]);
  baris.push(["Rusak Ringan", String(readinessStats.rusakRingan)]);
  baris.push(["Rusak Berat", String(readinessStats.rusakBerat)]);

  // Bagian 2: Logbook Perjalanan
  baris.push([]);
  baris.push([
    "TANGGAL",
    "JAM BERANGKAT",
    "JAM KEMBALI",
    "RUTE",
    "TUJUAN",
    "JENIS UNIT",
    "KATEGORI",
    "PENGGUNA",
    "PERSONEL",
    "BBM SEBELUM",
    "BBM SESUDAH",
    "STATUS",
    "CATATAN",
  ]);
  for (const l of logbookTahun) {
    baris.push([
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
    ]);
  }

  // Bagian 3: Daftar Aset
  baris.push([]);
  baris.push(["DAFTAR ASET"]);
  baris.push([
    "KODE",
    "NAMA ASET",
    "KATEGORI",
    "STATUS",
    "KONDISI",
    "LOKASI",
    "PENANGGUNG JAWAB",
    "TGL PENETAPAN",
    "NUP",
    "KETERANGAN",
  ]);
  for (const a of data.asets) {
    baris.push([
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
    ]);
  }

  // Bagian 4: Personel Aktif
  baris.push([]);
  baris.push(["PERSONEL AKTIF"]);
  baris.push(["NIP", "NAMA", "EMAIL", "ROLE", "STATUS"]);
  for (const u of data.daftarUsers.filter((x) => x.aktif)) {
    baris.push([
      u.nip,
      u.nama,
      u.email,
      u.role,
      u.aktif ? "Aktif" : "Nonaktif",
    ]);
  }

  // Escape: kutip sel yang mengandung koma / kutip / baris baru.
  const csv = baris
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    )
    .join("\r\n");

  // BOM UTF-8 agar Excel membaca karakter Indonesia dengan benar.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-kesiapan-sar-${tahun}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
