/**
 * Utilitas export laporan: merangkai data laporan & analisis menjadi
 * workbook Excel multi-sheet (.xlsx) dengan styling lengkap (border,
 * warna, merge cell) atau file CSV, lalu mengunduh di sisi klien.
 *
 * Sheet yang dihasilkan (format Excel):
 *  1. Ringkasan          — indikator kesiapan, distribusi status aset,
 *                          kesiapan per kategori
 *  2. Riwayat Operasi   — daftar operasi SAR (terfilter tahun terpilih)
 *  3. Logbook Perjalanan — rincian logbook armada (terfilter tahun terpilih)
 *  4. Performa Unit      — rekap perjalanan per kategori armada
 */

import * as ExcelJS from "exceljs";
import type {
  AsetMapped,
  LogbookMapped,
  RiwayatOperasiMapped,
} from "@/components/shared/supabase-mock-mapper";
import type { UserInfo } from "@/components/shared/use-supabase-data";
import type { ReadinessStats } from "@/components/shared/mock-data";

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Format tanggal ISO ("2026-07-01") → "01 Juli 2026"; aman terhadap null. */
function formatTanggalId(iso: string | null | undefined): string {
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

const WARNA = {
  primer: "FF1B4F72", // biru gelap BASARNAS
  primerTerang: "FFD6E4F0", // biru terang untuk section header
  abu: "FF546E7A",
  abuTerang: "FFF5F6F8",
  putih: "FFFFFFFF",
  abuGaris: "FFB0BEC5",
  teksTabel: "FF37474F",
} as const;

const clr = (argb: string) => ({ argb });

const THIN: Partial<ExcelJS.Border> = {
  style: "thin" as const,
  color: clr(WARNA.abuGaris),
};
const BORDIR_SEMUA: Partial<ExcelJS.Borders> = {
  top: THIN,
  bottom: THIN,
  left: THIN,
  right: THIN,
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

// ─── Tipe input ─────────────────────────────────────────────────────────────

export interface DataLaporan {
  tahun: string;
  readinessStats: ReadinessStats;
  asets: AsetMapped[];
  riwayatOperasi: RiwayatOperasiMapped[];
  logbookPerjalanan: LogbookMapped[];
  daftarUsers: UserInfo[];
  personelAktif: number;
}

// ─── Gaya helper per sheet ─────────────────────────────────────────────────

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
      horizontal: "left",
      wrapText: true,
      textRotation: 0,
      shrinkToFit: false,
      indent: 0,
      readingOrder: "ltr",
    };
  }
  row.height = 22;
}

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
  row.height = 18;
}

function terapkanGayaJudul(
  ws: ExcelJS.Worksheet,
  teks: string,
  subTeks?: string,
  jumlahKolomMerge = 4
): void {
  // Baris 1: judul
  const r1 = ws.getRow(1);
  r1.getCell(1).value = teks;
  r1.getCell(1).font = FONT_JUDUL;
  r1.height = 28;
  // Gabar baris pertama di seluruh kolom yang tersedia
  ws.mergeCells(1, 1, 1, jumlahKolomMerge);

  // Baris 2: sub judul
  if (subTeks) {
    const r2 = ws.getRow(2);
    r2.getCell(1).value = subTeks;
    r2.getCell(1).font = FONT_SUB;
    ws.mergeCells(2, 1, 2, jumlahKolomMerge);
    r2.height = 18;
  }
}

// ─── API Utama: Excel ───────────────────────────────────────────────────────

/**
 * Ekspor seluruh data laporan ke file Excel (.xlsx) multi-sheet dengan
 * styling lengkap (border, warna, merge cell) dan unduh di sisi klien.
 * Semua data operasional (riwayat, logbook) terfilter tahun terpilih.
 */
export async function eksporLaporanExcel(data: DataLaporan): Promise<void> {
  const { tahun, readinessStats, riwayatOperasi, logbookPerjalanan } = data;

  const logbookTahun = logbookPerjalanan.filter((l) =>
    dalamTahun(l.tanggal, tahun)
  );
  const riwayatTahun = riwayatOperasi.filter((op) =>
    dalamTahun(op.tanggal, tahun)
  );
  const jamPersonel = hitungJamPersonel(logbookTahun);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Siap SAR";
  workbook.created = new Date();

  // ── Sheet 1: Ringkasan ──────────────────────────────────────────────────
  const wsRingkasan = workbook.addWorksheet("Ringkasan", {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
    },
  });

  // Lebar kolom
  wsRingkasan.columns = [
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  // Judul
  terapkanGayaJudul(
    wsRingkasan,
    `LAPORAN KESIAPAN SAR — TAHUN ${tahun}`,
    `Diunduh: ${formatTanggalId(new Date().toISOString().slice(0, 10))}`,
    4
  );

  // Baris 3: kosong
  wsRingkasan.getRow(3).height = 8;

  // Blok A: INDIKATOR
  const rIndikatorAwal = 4;
  // Header baris INDIKATOR sudah di-set sebelumnya
  const barisIndikator: [string, string | number][] = [
    ["INDIKATOR", "NILAI"],
    ["Readiness Index (%)", readinessStats.readinessIndex],
    [
      "Aset Standby",
      `${readinessStats.standby} / ${readinessStats.totalAset}`,
    ],
    ["Personel Aktif", data.personelAktif],
    ["Total Riwayat Operasi", riwayatTahun.length],
    ["Total Logbook Perjalanan", logbookTahun.length],
    ["Jam Personel (Kumulatif)", jamPersonel],
  ];

  barisIndikator.forEach(([label, nilai], i) => {
    const nomorBaris = rIndikatorAwal + i;
    const row = wsRingkasan.getRow(nomorBaris);
    row.getCell(1).value = label;
    row.getCell(2).value = nilai;
    if (i === 0) {
      // Header baris
      terapkanGayaHeaderBaris(wsRingkasan, nomorBaris, 2);
    } else {
      terapkanGayaBarisData(wsRingkasan, nomorBaris, 2, i % 2 === 0);
    }
  });

  // Spasi antar blok
  const rSpasi1 = rIndikatorAwal + barisIndikator.length;
  wsRingkasan.getRow(rSpasi1).height = 10;

  // Blok B: DISTRIBUSI STATUS ASET
  const rDistribusiAwal = rSpasi1 + 1;
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

  // Spasi
  const rSpasi2 = rDistribusiAwal + distribusi.length;
  wsRingkasan.getRow(rSpasi2).height = 10;

  // Blok C: KESIAPAN PER KATEGORI
  const rKategoriAwal = rSpasi2 + 1;
  const headerKategori = [
    "KATEGORI",
    "TOTAL ASET",
    "STANDBY",
    "PERSENTASE",
  ];
  const rHeaderKategori = rKategoriAwal;
  const rowHeader = wsRingkasan.getRow(rHeaderKategori);
  headerKategori.forEach((h, i) => {
    rowHeader.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsRingkasan, rHeaderKategori, 4);

  readinessStats.kesiapanPerKategori.forEach((k, i) => {
    const nomorBaris = rKategoriAwal + 1 + i;
    const row = wsRingkasan.getRow(nomorBaris);
    row.getCell(1).value = k.kategori;
    row.getCell(2).value = k.total;
    row.getCell(3).value = k.standby;
    row.getCell(4).value = `${k.persentase}%`;
    terapkanGayaBarisData(wsRingkasan, nomorBaris, 4, i % 2 === 0);
  });

  // ── Sheet 2: Riwayat Operasi ────────────────────────────────────────────
  const wsRiwayat = workbook.addWorksheet("Riwayat Operasi", {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
    },
  });

  const headerRiwayat = [
    "Tanggal",
    "Jenis Operasi",
    "Lokasi",
    "Durasi",
    "Personel",
    "Hasil",
    "Keterangan",
  ];
  wsRiwayat.columns = [
    { width: 16 },
    { width: 28 },
    { width: 24 },
    { width: 10 },
    { width: 10 },
    { width: 14 },
    { width: 40 },
  ];

  terapkanGayaJudul(
    wsRiwayat,
    `RIWAYAT OPERASI SAR — TAHUN ${tahun}`,
    `Total: ${riwayatTahun.length} operasi`,
    7
  );

  // Baris 3: kosong
  wsRiwayat.getRow(3).height = 8;

  // Header tabel di baris 4
  const rHeader = 4;
  const rowHeaderRiwayat = wsRiwayat.getRow(rHeader);
  headerRiwayat.forEach((h, i) => {
    rowHeaderRiwayat.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsRiwayat, rHeader, headerRiwayat.length);

  // Isi baris data
  riwayatTahun.forEach((op, i) => {
    const nomorBaris = rHeader + 1 + i;
    const row = wsRiwayat.getRow(nomorBaris);
    row.getCell(1).value = formatTanggalId(op.tanggal);
    row.getCell(2).value = op.jenis;
    row.getCell(3).value = op.lokasi;
    row.getCell(4).value = op.durasi;
    row.getCell(5).value = op.personel;
    row.getCell(6).value = op.hasil;
    row.getCell(7).value = op.keterangan || "—";
    terapkanGayaBarisData(wsRiwayat, nomorBaris, headerRiwayat.length, i % 2 === 0);
  });

  // ── Sheet 3: Logbook Perjalanan ────────────────────────────────────────
  const wsLogbook = workbook.addWorksheet("Logbook Perjalanan", {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
    },
  });

  const headerLogbook = [
    "Tanggal",
    "Jam Berangkat",
    "Jam Kembali",
    "Rute",
    "Tujuan",
    "Jenis Unit",
    "Kategori",
    "Nahkoda",
    "Personel",
    "BBM Sebelum",
    "BBM Sesudah",
    "Status",
    "Catatan",
  ];
  wsLogbook.columns = [
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 22 },
    { width: 22 },
    { width: 12 },
    { width: 10 },
    { width: 18 },
    { width: 9 },
    { width: 11 },
    { width: 11 },
    { width: 12 },
    { width: 30 },
  ];

  terapkanGayaJudul(
    wsLogbook,
    `LOGBOOK PERJALANAN — TAHUN ${tahun}`,
    `Total: ${logbookTahun.length} perjalanan`,
    13
  );

  wsLogbook.getRow(3).height = 8;

  const rHeaderLogbook = 4;
  const rowHeaderLogbook = wsLogbook.getRow(rHeaderLogbook);
  headerLogbook.forEach((h, i) => {
    rowHeaderLogbook.getCell(i + 1).value = h;
  });
  terapkanGayaHeaderBaris(wsLogbook, rHeaderLogbook, headerLogbook.length);

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
    terapkanGayaBarisData(wsLogbook, nomorBaris, headerLogbook.length, i % 2 === 0);
  });

  // ── Sheet 4: Performa Unit ──────────────────────────────────────────────
  const wsPerforma = workbook.addWorksheet("Performa Unit", {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
    },
  });

  const headerPerforma = ["Kategori", "Jumlah Perjalanan"];
  wsPerforma.columns = [
    { width: 36 },
    { width: 18 },
  ];

  terapkanGayaJudul(
    wsPerforma,
    `PERFORMA UNIT — TAHUN ${tahun}`,
    "Rekap perjalanan per kategori armada",
    2
  );

  wsPerforma.getRow(3).height = 8;

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
 */
export function eksporLaporanCSV(data: DataLaporan): void {
  const { tahun, readinessStats, riwayatOperasi, logbookPerjalanan } = data;

  const logbookTahun = logbookPerjalanan.filter((l) =>
    dalamTahun(l.tanggal, tahun)
  );
  const riwayatTahun = riwayatOperasi.filter((op) =>
    dalamTahun(op.tanggal, tahun)
  );
  const jamPersonel = hitungJamPersonel(logbookTahun);

  const baris: string[][] = [];

  // Bagian 1: Ringkasan
  baris.push([`LAPORAN KESIAPAN SAR — TAHUN ${tahun}`]);
  baris.push([
    `Diunduh: ${formatTanggalId(new Date().toISOString().slice(0, 10))}`,
  ]);
  baris.push([]);
  baris.push(["INDIKATOR", "NILAI"]);
  baris.push(["Readiness Index (%)", String(readinessStats.readinessIndex)]);
  baris.push([
    "Aset Standby",
    `${readinessStats.standby} / ${readinessStats.totalAset}`,
  ]);
  baris.push(["Personel Aktif", String(data.personelAktif)]);
  baris.push([
    "Total Riwayat Operasi",
    String(riwayatTahun.length),
  ]);
  baris.push([
    "Total Logbook Perjalanan",
    String(logbookTahun.length),
  ]);
  baris.push(["Jam Personel (Kumulatif)", String(jamPersonel)]);
  baris.push([]);
  baris.push(["DISTRIBUSI STATUS ASET", "JML"]);
  baris.push(["Standby", String(readinessStats.standby)]);
  baris.push(["Sedang digunakan", String(readinessStats.sedangDigunakan)]);
  baris.push(["Maintenance", String(readinessStats.maintenance)]);
  baris.push(["Rusak Ringan", String(readinessStats.rusakRingan)]);
  baris.push(["Rusak Berat", String(readinessStats.rusakBerat)]);

  // Bagian 2: Riwayat Operasi
  baris.push([]);
  baris.push([
    "TANGGAL",
    "JENIS OPERASI",
    "LOKASI",
    "DURASI",
    "PERSONEL",
    "HASIL",
    "KETERANGAN",
  ]);
  for (const op of riwayatTahun) {
    baris.push([
      formatTanggalId(op.tanggal),
      op.jenis,
      op.lokasi,
      op.durasi,
      String(op.personel),
      op.hasil,
      op.keterangan || "—",
    ]);
  }

  // Bagian 3: Logbook Perjalanan
  baris.push([]);
  baris.push([
    "TANGGAL",
    "JAM BERANGKAT",
    "JAM KEMBALI",
    "RUTE",
    "TUJUAN",
    "JENIS UNIT",
    "KATEGORI",
    "NAHKODA",
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
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-kesiapan-sar-${tahun}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
