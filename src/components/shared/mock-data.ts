// =============================================================================
// Mock Data - Dashboard Siap SAR
// Kantor Pencarian dan Pertolongan Kelas B Mamuju
// =============================================================================

// -----------------------------------------------------------------------------
// 1. USERS
// -----------------------------------------------------------------------------

export type UserRole =
  | "ADMIN_IT"
  | "PENGELOLA_BMN"
  | "KAKANSAR"
  | "OPERATOR_LAPANGAN";

export interface User {
  id: string;
  nama: string;
  nip: string;
  role: UserRole;
  email: string;
  noTelepon: string;
  avatar: string;
  aktif: boolean;
}

export const users: User[] = [
  {
    id: "usr-001",
    nama: "Medlyn R. Pagali",
    nip: "198503122010012001",
    role: "PENGELOLA_BMN",
    email: "medlyn.pagali@basarnas.go.id",
    noTelepon: "0812-3456-7890",
    avatar: "/avatars/medlyn.png",
    aktif: true,
  },
  {
    id: "usr-002",
    nama: "Kauluddin",
    nip: "197801152005011002",
    role: "PENGELOLA_BMN",
    email: "kauluddin@basarnas.go.id",
    noTelepon: "0813-2345-6789",
    avatar: "/avatars/kaul.png",
    aktif: true,
  },
  {
    id: "usr-003",
    nama: "Ansaruddin",
    nip: "196905201994031003",
    role: "KAKANSAR",
    email: "ansaruddin@basarnas.go.id",
    noTelepon: "0811-9876-5432",
    avatar: "/avatars/kansar.png",
    aktif: true,
  },
  {
    id: "usr-004",
    nama: "Rizky Pratama",
    nip: "199201102015011004",
    role: "ADMIN_IT",
    email: "rizky.pratama@basarnas.go.id",
    noTelepon: "0821-1122-3344",
    avatar: "/avatars/rizky.png",
    aktif: true,
  },
  {
    id: "usr-005",
    nama: "Siti Nurhaliza",
    nip: "199012252018012005",
    role: "OPERATOR_LAPANGAN",
    email: "siti.nurhaliza@basarnas.go.id",
    noTelepon: "0852-4433-2211",
    avatar: "/avatars/siti.png",
    aktif: true,
  },
  {
    id: "usr-006",
    nama: "Ahmad Fauzi",
    nip: "198807142019011006",
    role: "OPERATOR_LAPANGAN",
    email: "ahmad.fauzi@basarnas.go.id",
    noTelepon: "0813-5566-7788",
    avatar: "/avatars/fauzi.png",
    aktif: true,
  },
  {
    id: "usr-007",
    nama: "Dewi Lestari",
    nip: "199306182020012007",
    role: "OPERATOR_LAPANGAN",
    email: "dewi.lestari@basarnas.go.id",
    noTelepon: "0822-8899-0011",
    avatar: "/avatars/dewi.png",
    aktif: true,
  },
  {
    id: "usr-008",
    nama: "Budi Santoso",
    nip: "198605302017011008",
    role: "OPERATOR_LAPANGAN",
    email: "budi.santoso@basarnas.go.id",
    noTelepon: "0819-3344-5566",
    avatar: "/avatars/budi.png",
    aktif: true,
  },
];

// -----------------------------------------------------------------------------
// 2. ASET BMN
// -----------------------------------------------------------------------------

export type KategoriAset =
  | "Mobil"
  | "Motor"
  | "Kapal"
  | "Peralatan SAR"
  | "Komunikasi"
  | "Medis"
  | "Dokumentasi";

/** Status operasional aset — 5 nilai kanonik. */
export type StatusAset =
  | "Standby"
  | "Rusak Berat"
  | "Rusak Ringan"
  | "Dipindahkan"
  | "Sedang digunakan";

/** Daftar status aset, diurutkan dari kondisi terbaik ke terburuk. */
export const STATUS_ASET = [
  "Standby",
  "Sedang digunakan",
  "Dipindahkan",
  "Rusak Ringan",
  "Rusak Berat",
] as const satisfies readonly StatusAset[];

/** Variant badge untuk setiap status aset. */
export type StatusAsetBadgeVariant = "success" | "default" | "warning" | "danger" | "outline";

/**
 * Pemetaan status aset ke warna badge. Satu-satunya sumber kebenaran —
 * jangan declare ulang di halaman, import dari sini.
 */
export const STATUS_ASET_VARIANT: Record<StatusAset, StatusAsetBadgeVariant> = {
  Standby: "success",
  "Sedang digunakan": "default",
  Dipindahkan: "outline",
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
};

/** Status aset yang dianggap benar-benar siap operasional (tersedia & layak pakai). */
export const STATUS_ASET_SIAGA: readonly StatusAset[] = ["Standby"];

export type KondisiAset = "Baik" | "Rusak Ringan" | "Rusak Berat";
export type KondisiItem = "Baik" | "Rusak Ringan" | "Rusak Berat";

/** Jenis armada sesuai form fisik kantor (dokumentasi_utuh.md Bagian 4). */
export type JenisArmada = "Kapal" | "RIB" | "RBB" | "Mobil" | "Motor" | "Lainnya";

// ─── BERITA ACARA ────────────────────────────────────────────────────────────

/**
 * Status berita acara kerusakan dari penyerahan Penanggung Jawab (PJ) aset
 * sampai keputusan final Pengelola BMN.
 */
export type StatusBeritaAcara =
  | "Draf"
  | "Diserahkan"
  | "Diproses"
  | "Disetujui"
  | "Ditolak";

/**
 * Nilai bawaan keterangan aset saat berita acara DISETUJUI: unit dikirim ke
 * tempat service (aset berstatus "Dipindahkan").
 */
export const KETERANGAN_SERVICE_DEFAULT =
  "Dikirim ke tempat service untuk perbaikan";

/** Sifat kerusakan pada item — menentukan prioritas tiket EWS. */
export type SifatKerusakan = "Ringan" | "Berat";

/**
 * Baris tabel "Informasi Kendala" pada berita acara — sama persis dengan
 * kolom tabel di template `berita-acara-basarnas-lengkap.html`:
 * NO | Nama Barang | Merk/Type | Jumlah | Keterangan.
 */
export interface BarisKendala {
  /** Nama Barang — label item yang rusak. */
  label: string;
  /** Merk/Type — diisi manual oleh PJ (default "Standar"). */
  merk: string;
  /** Jumlah — diisi manual oleh PJ (default "1 set"). */
  jumlah: string;
  /** Keterangan — deskripsi kerusakan / kondisi. */
  keterangan: string;
  /** Sifat kerusakan (Ringan/Berat) — menentukan prioritas tiket otomatis. */
  sifat: SifatKerusakan;
}

/**
 * Berita acara kerusakan yang dibuat Penanggung Jawab (PJ) aset berdasarkan
 * hasil checklist harian.
 *
 * Bagian yang terisi otomatis:
 * - nama aset & kode (dari master aset yang diperiksa),
 * - hari + tanggal + bulan + tahun dalam kata (dari tanggal checklist),
 * - nama pelapor (nama PJ dari data aset),
 * - baris "Informasi Kendala" (item yang dinilai rusak oleh PJ).
 *
 * Nomor berita acara sengaja dikosongkan — nomor resmi diberikan oleh unit
 * administrasi.
 *
 * TODO: migrasi ke tabel `berita_acara` di Supabase.
 */
export interface BeritaAcara {
  id: string;
  tanggal: string;
  /** Inti subjek dokumen: nama aset (tanpa kode, kode ditulis terpisah). */
  namaAset: string;
  /** Kode aset, mis. "BMN-KND-001". */
  kodeAset: string;
  /** Kosongkan dulu — nomor resmi diberikan unit administrasi. */
  nomor: string;
  asetId: string;
  /** Checklist asal, bila ada. */
  checklistId?: string;
  /** Tiket EWS yang dibuat bersamaan saat penyerahan. */
  tiketId?: string;
  /** ID user penyerah (tersimpan saat penyerahan). */
  pengajuId?: string;
  pelapor: string;
  pelaporJabatan: string;
  pengajuNama?: string;
  pengajuJabatan?: string;
  tanggalBuat: string;
  tanggalUpdate: string;
  status: StatusBeritaAcara;
  /**
   * Daftar item rusak beserta sifatnya (Ringan/Berat). Dipakai untuk mengisi
   * tabel "Informasi Kendala" dan menentukan prioritas tiket otomatis.
   */
  kendala: BarisKendala[];
  /** Foto bukti — buffer base64 untuk sekarang (backend Supabase Storage nanti). */
  fotoBukti: string[];
  /** Uraian hasil pemeriksaan / analisa yang ditambahkan PJ. */
  uraian: string;
  /** Terisi bila keputusan BMN adalah "Ditolak". */
  alasanPenolakan?: string;
  /**
   * Keterangan aset terkait: nilai bawaan "Dikirim ke Tempat Service".
   * Ketika berita acara disetujui, status aset menjadi "Dipindahkan".
   */
  keterangan: string;
}

export interface RiwayatAset {
  tanggal: string;
  aksi: string;
  keterangan: string;
  userId: string;
}

// ─── HELPER TANGGAL DALAM KATA ───────────────────────────────────────────────

const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const ANGKA_HURUF: Record<number, string> = {
  0: "Nol",
  1: "Satu",
  2: "Dua",
  3: "Tiga",
  4: "Empat",
  5: "Lima",
  6: "Enam",
  7: "Tujuh",
  8: "Delapan",
  9: "Sembilan",
  10: "Sepuluh",
  11: "Sebelas",
  12: "Dua Belas",
  13: "Tiga Belas",
  14: "Empat Belas",
  15: "Lima Belas",
  16: "Enam Belas",
  17: "Tujuh Belas",
  18: "Delapan Belas",
  19: "Sembilan Belas",
  20: "Dua Puluh",
};

/**
 * Ubah angka tahun (mis. 2026) menjadi kata: "Dua Ribu Dua Puluh Enam".
 * Dipakai untuk paragraf pembuka dokumen berita acara.
 */
export function tahunTeks(tahun: number): string {
  const ribuan = Math.floor(tahun / 1000);
  const sisa = tahun % 1000;
  const ratusan = Math.floor(sisa / 100);
  const puluhan = Math.floor((sisa % 100) / 10);
  const satuan = sisa % 10;
  const parts: string[] = [`${ANGKA_HURUF[ribuan]} Ribu`];
  if (ratusan > 0) parts.push(`${ANGKA_HURUF[ratusan]} Ratus`);
  if (puluhan > 0) parts.push(`${ANGKA_HURUF[puluhan]} Puluh`);
  if (satuan > 0) parts.push(ANGKA_HURUF[satuan]);
  return parts.join(" ");
}

/**
 * Ubah angka menjadi kata bahasa Indonesia (1–99).
 * Contoh: 5 → "Lima", 25 → "Dua Puluh Lima".
 * Dipakai untuk tanggal hari pada paragraf pembuka berita acara
 * (mis. "Tanggal Lima" — mengikuti template acuan berita acara BASARNAS).
 */
export function angkaTeks(n: number): string {
  const satuan = [
    "Nol",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
  ];
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 10) return satuan[n];
  if (n === 10) return "Sepuluh";
  if (n < 20) return `Sepuluh ${satuan[n - 10]}`;
  const puluh = Math.floor(n / 10);
  const sisa = n % 10;
  return `${satuan[puluh]} Puluh${sisa ? ` ${satuan[sisa]}` : ""}`;
}

/**
 * Ubah tanggal ISO (YYYY-MM-DD) menjadi teks dokumen:
 * "Hari: Kamis · Tanggal: 5 · Bulan: Februari · Tahun: Dua Ribu Dua Puluh Enam".
 */
export function tanggalTeks(
  tanggalISO: string
): {
  hari: string;
  tanggal: string;
  bulan: string;
  tahun: string;
  tahunKata: string;
} | null {
  const [th, bl, hr] = tanggalISO.split("-").map(Number);
  if (!th || !bl || !hr) return null;
  const d = new Date(th, bl - 1, hr);
  return {
    hari: NAMA_HARI[d.getDay()] ?? "-",
    tanggal: String(hr),
    bulan: NAMA_BULAN[bl - 1] ?? "-",
    tahun: String(th),
    tahunKata: tahunTeks(th),
  };
}


export interface Aset {
  id: string;
  nama: string;
  kode: string;
  /** Nomor Urut Pendaftaran — angka urut 6 digit, leading nol dipertahankan. */
  nup: string;
  kategori: KategoriAset;
  status: StatusAset;
  lokasi: string;
  /** Tanggal penetapan BMN atas aset. */
  tanggalPenetapan: string;
  gambar: string;
  kondisi: KondisiAset;
  penanggungJawab: string;
  keterangan?: string;
  riwayat: RiwayatAset[];
}

/** Jumlah digit maksimal NUP. */
export const NUP_MAX_DIGIT = 6;

/**
 * Normalisasi input NUP: buang karakter non-angka lalu potong maksimal
 * {@link NUP_MAX_DIGIT} digit. Dipakai bersama oleh form Tambah & Edit.
 */
export function normalizeNup(value: string): string {
  return value.replace(/\D/g, "").slice(0, NUP_MAX_DIGIT);
}

export const asetList: Aset[] = [
  {
    id: "ast-001",
    nama: "Perahu Karet Zodiac MK III",
    kode: "BMN-SAR-001",
    nup: "000001",
    kategori: "Peralatan SAR",
    status: "Standby",
    lokasi: "Gudang SAR Lt. 1",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/perahu-karet.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-001",
    riwayat: [
      {
        tanggal: "2026-09-20",
        aksi: "Pengecekan Berkala",
        keterangan: "Hull tidak ada bocor, pompa berfungsi normal",
        userId: "usr-001",
      },
      {
        tanggal: "2026-09-15",
        aksi: "Pengembalian",
        keterangan: "Selesai operasi evakuasi korban tenggelam di Perairan Mamuju",
        userId: "usr-005",
      },
      {
        tanggal: "2026-09-15",
        aksi: "Penerimaan",
        keterangan: "Diterima kondisi baik, dilanjutkan cleaning rutin",
        userId: "usr-001",
      },
    ],
  },
  {
    id: "ast-002",
    nama: "Mesin Outboard Yamaha 40 PK",
    kode: "BMN-SAR-002",
    nup: "000002",
    kategori: "Peralatan SAR",
    status: "Standby",
    lokasi: "Gudang SAR Lt. 1",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/mesin-outboard.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-001",
    riwayat: [
      {
        tanggal: "2026-09-18",
        aksi: "Servis Berkala",
        keterangan: "Ganti oli dan busi, RPM stabil",
        userId: "usr-006",
      },
    ],
  },
  {
    id: "ast-003",
    nama: "Radio HT Motorola GP328",
    kode: "BMN-KOM-001",
    nup: "000003",
    kategori: "Komunikasi",
    status: "Dipindahkan",
    lokasi: "Basecamp Operasi Lapangan",
    tanggalPenetapan: "2026-09-30",
    gambar: "/asets/radio-ht.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-002",
    riwayat: [
      {
        tanggal: "2026-09-22",
        aksi: "Peminjaman",
        keterangan: "Dipinjam untuk operasi evakuasi pasca banjir di Desa Binanga",
        userId: "usr-006",
      },
      {
        tanggal: "2026-09-22",
        aksi: "Penyerahan",
        keterangan: "Diserahkan kepada Tim Operasi Lapangan",
        userId: "usr-001",
      },
    ],
  },
  {
    id: "ast-004",
    nama: "GPS Garmin GPSMAP 64sx",
    kode: "BMN-KOM-002",
    nup: "000004",
    kategori: "Komunikasi",
    status: "Standby",
    lokasi: "Ruang Operasi",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/gps-garmin.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-002",
    riwayat: [
      {
        tanggal: "2026-09-10",
        aksi: "Update Firmware",
        keterangan: "Update ke versi terakhir, peta Indonesia sudah terpasang",
        userId: "usr-004",
      },
    ],
  },
  {
    id: "ast-005",
    nama: "Tenda Medis Emergency 6x4",
    kode: "BMN-MED-001",
    nup: "000005",
    kategori: "Medis",
    status: "Rusak Ringan",
    lokasi: "Gudang Medis",
    tanggalPenetapan: "2026-10-05",
    gambar: "/asets/tenda-medis.jpg",
    kondisi: "Rusak Ringan",
    penanggungJawab: "usr-002",
    riwayat: [
      {
        tanggal: "2026-09-25",
        aksi: "Pelaporan Kerusakan",
        keterangan: "Pin tiang patah sebelah, atap robek 30cm, perlu jahit ulang",
        userId: "usr-007",
      },
      {
        tanggal: "2026-09-26",
        aksi: "Verifikasi Kerusakan",
        keterangan: "Kerusakan terverifikasi, rujuk ke bengkel untuk perbaikan",
        userId: "usr-002",
      },
    ],
  },
  {
    id: "ast-006",
    nama: "Defibrillator Zoll AED Plus",
    kode: "BMN-MED-002",
    nup: "000006",
    kategori: "Medis",
    status: "Standby",
    lokasi: "Ruang Operasi",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/defibrillator.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-002",
    riwayat: [
      {
        tanggal: "2026-09-12",
        aksi: "Cek Battery",
        keterangan: "Baterai 100%, electrode siap pakai",
        userId: "usr-007",
      },
    ],
  },
  {
    id: "ast-007",
    nama: "Kendaraan Ransel Toyota Hilux",
    kode: "BMN-KND-001",
    nup: "000007",
    kategori: "Mobil",
    status: "Rusak Berat",
    lokasi: "Bengkel Resmi Toyota Mamuju",
    tanggalPenetapan: "2026-10-02",
    gambar: "/asets/toyota-hilux.jpg",
    kondisi: "Rusak Ringan",
    penanggungJawab: "usr-001",
    riwayat: [
      {
        tanggal: "2026-09-27",
        aksi: "Penyerahan ke Bengkel",
        keterangan: "Keluaran bunyi kasar pada mesin, rujuk untuk tune-up menyeluruh",
        userId: "usr-001",
      },
      {
        tanggal: "2026-09-27",
        aksi: "Penerimaan Laporan",
        keterangan: "Laporan diterima, menunggu sparepart dari Makassar",
        userId: "usr-002",
      },
    ],
  },
  {
    id: "ast-008",
    nama: "Sepeda Motor Honda CRF150L",
    kode: "BMN-KND-002",
    nup: "000008",
    kategori: "Motor",
    status: "Sedang digunakan",
    lokasi: "Parkiran Utama",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/honda-crf.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-001",
    riwayat: [
      {
        tanggal: "2026-09-05",
        aksi: "Servis Berkala",
        keterangan: "Ganti oli, cek rantai dan rem",
        userId: "usr-008",
      },
    ],
  },
  {
    id: "ast-009",
    nama: "Kamera DSLR Canon EOS 90D",
    kode: "BMN-DOK-001",
    nup: "000009",
    kategori: "Dokumentasi",
    status: "Dipindahkan",
    lokasi: "Tim Dokumentasi",
    tanggalPenetapan: "2026-09-29",
    gambar: "/asets/kamera-canon.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-003",
    riwayat: [
      {
        tanggal: "2026-09-24",
        aksi: "Peminjaman",
        keterangan: "Untuk dokumentasi kegiatan sosialisasi SAR di Pantai Karampuang",
        userId: "usr-007",
      },
    ],
  },
  {
    id: "ast-010",
    nama: "Drone DJI Mavic 3 Classic",
    kode: "BMN-DOK-002",
    nup: "000010",
    kategori: "Dokumentasi",
    status: "Standby",
    lokasi: "Ruang Operasi",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/drone-dji.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-003",
    riwayat: [
      {
        tanggal: "2026-09-08",
        aksi: "Update Firmware",
        keterangan: "Firmware diperbarui, kalibrasi kompas dan gimbal",
        userId: "usr-004",
      },
    ],
  },
  {
    id: "ast-011",
    nama: "Peralatan Selam Regulator Scubapro",
    kode: "BMN-SAR-003",
    nup: "000011",
    kategori: "Peralatan SAR",
    status: "Standby",
    lokasi: "Gudang SAR Lt. 2",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/scubapro.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-001",
    riwayat: [
      {
        tanggal: "2026-09-14",
        aksi: "Inspeksi Tekanan",
        keterangan: "Tekanan tabung 200 bar, regulator tidak ada kebocoran",
        userId: "usr-005",
      },
    ],
  },
  {
    id: "ast-012",
    nama: "Winch Recovery 12000 lbs",
    kode: "BMN-SAR-004",
    nup: "000012",
    kategori: "Peralatan SAR",
    status: "Standby",
    lokasi: "Gudang SAR Lt. 1",
    tanggalPenetapan: "2026-09-28",
    gambar: "/asets/winch-recovery.jpg",
    kondisi: "Baik",
    penanggungJawab: "usr-001",
    riwayat: [
      {
        tanggal: "2026-09-16",
        aksi: "Uji Fungsi",
        keterangan: "Motor dan kabel seling berfungsi normal",
        userId: "usr-006",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 3. EWS TICKETS (Early Warning System)
// -----------------------------------------------------------------------------

export type TingkatKeparahan = "Rendah" | "Sedang" | "Tinggi";
export type StatusTicket = "Menunggu" | "Diproses" | "Selesai";

export interface EWSTicket {
  id: string;
  asetId: string;
  judul: string;
  deskripsi: string;
  tingkatKeparahan: TingkatKeparahan;
  status: StatusTicket;
  tanggalBuat: string;
  tanggalUpdate: string;
  assignedTo: string;
}

export const ewsTickets: EWSTicket[] = [
  {
    id: "ews-001",
    asetId: "ast-005",
    judul: "Pin Tiang Tenda Medis Patah",
    deskripsi:
      "Tenda medis emergency mengalami kerusakan pada pin tiang sebelah kiri dan robekan pada atap. Perlu segera diperbaiki menjelang musim hujan.",
    tingkatKeparahan: "Sedang",
    status: "Diproses",
    tanggalBuat: "2026-09-25",
    tanggalUpdate: "2026-09-26",
    assignedTo: "usr-002",
  },
  {
    id: "ews-002",
    asetId: "ast-007",
    judul: "Mesin Hilux Bunyi Kasar",
    deskripsi:
      "Kendaraan Toyota Hilux mengeluarkan bunyu kasar saat idle dan akselerasi. Khawatir mengganggu mobilisasi cepat saat operasi.",
    tingkatKeparahan: "Tinggi",
    status: "Diproses",
    tanggalBuat: "2026-09-27",
    tanggalUpdate: "2026-09-27",
    assignedTo: "usr-001",
  },
  {
    id: "ews-003",
    asetId: "ast-003",
    judul: "Radio HT Baterai Cepat Habis",
    deskripsi:
      "Radio HT Motorola pada regu lapangan mengalami penurunan daya tahan baterai. Dari biasanya 12 jam menjadi hanya 4-5 jam.",
    tingkatKeparahan: "Rendah",
    status: "Menunggu",
    tanggalBuat: "2026-09-23",
    tanggalUpdate: "2026-09-23",
    assignedTo: "usr-002",
  },
  {
    id: "ews-004",
    asetId: "ast-001",
    judul: "Perahu Karet Bocor Kecil",
    deskripsi:
      "Ditemukan bocor kecil pada sambungan jahitan perahu karet Zodiac. Sempat tertambat air saat operasi terakhir.",
    tingkatKeparahan: "Sedang",
    status: "Selesai",
    tanggalBuat: "2026-09-19",
    tanggalUpdate: "2026-09-20",
    assignedTo: "usr-001",
  },
  {
    id: "ews-005",
    asetId: "ast-010",
    judul: "Drone Kompas Tidak Akurat",
    deskripsi:
      "Drone DJI Mavic 3 menunjukkan deviasi kompas hingga 15 derajat, berpotensi mengganggu navigasi saat misi pencarian area luas.",
    tingkatKeparahan: "Rendah",
    status: "Selesai",
    tanggalBuat: "2026-09-07",
    tanggalUpdate: "2026-09-08",
    assignedTo: "usr-004",
  },
  {
    id: "ews-006",
    asetId: "ast-011",
    judul: "Regulator Scubapro Tidak Stabil",
    deskripsi:
      "Regulator SCUBAPRO mengalami free-flow saat digunakan pada kedalaman 15 meter. Berbahaya bagi penyelam jika tidak segera ditangani.",
    tingkatKeparahan: "Tinggi",
    status: "Menunggu",
    tanggalBuat: "2026-09-26",
    tanggalUpdate: "2026-09-26",
    assignedTo: "usr-002",
  },
];

// -----------------------------------------------------------------------------
// 4. VERIFICATION QUEUE (Antrean Verifikasi)
// -----------------------------------------------------------------------------

export type TipeVerifikasi = "Draf Aset" | "Laporan Kerusakan";
export type StatusVerifikasi = "Menunggu" | "Disetujui" | "Ditolak";

export interface AntreanVerifikasi {
  id: string;
  tipe: TipeVerifikasi;
  judul: string;
  deskripsi: string;
  status: StatusVerifikasi;
  tanggalBuat: string;
  createdBy: string;
  catatanRevisi?: string;
}

export const antreanVerifikasi: AntreanVerifikasi[] = [
  {
    id: "ver-001",
    tipe: "Draf Aset",
    judul: "Penambahan Aset: Chain Stihl MS 261",
    deskripsi:
      "Pengajuan penambahan mesin chainset Stihl MS 261 untuk keperluan operasi SAR di daerah hutan dan pegunungan. Harga perkiraan Rp 18.500.000.",
    status: "Menunggu",
    tanggalBuat: "2026-09-26",
    createdBy: "usr-001",
  },
  {
    id: "ver-002",
    tipe: "Laporan Kerusakan",
    judul: "Kerusakan Tenda Medis - Rusak Ringan",
    deskripsi:
      "Tenda medis emergency mengalami kerusakan pin tiang dan robekan atap. Perlu perbaikan jahit ulang dan penggantian 2 pin tiang.",
    status: "Disetujui",
    tanggalBuat: "2026-09-25",
    createdBy: "usr-007",
    catatanRevisi:
      "Disetujui. Gunakan anggaran pemeliharaan Q3. Mohon sertakan foto kerusakan lebih detail pada laporan berikutnya.",
  },
  {
    id: "ver-003",
    tipe: "Laporan Kerusakan",
    judul: "Kerusakan Perahu Karet - Bocor Kecil",
    deskripsi:
      "Perahu karet Zodiac ditemukanocor pada sambungan jahitan. Sudah dilakukan patch sementara, perlu jahit ulang permanen.",
    status: "Disetujui",
    tanggalBuat: "2026-09-19",
    createdBy: "usr-005",
  },
  {
    id: "ver-004",
    tipe: "Draf Aset",
    judul: "Penambahan Aset: Thermal Imaging Camera",
    deskripsi:
      "Pengajuan pembelian kamera termal FLIR untuk operasi pencarian korban dalam kondisi malam hari atau area berasap. Harga perkiraan Rp 85.000.000.",
    status: "Ditolak",
    tanggalBuat: "2026-09-21",
    createdBy: "usr-001",
    catatanRevisi:
      "Ditolak sementara karena melebihi pagu anggaran BMN tahun berjalan. Mohon ajukan kembali pada penganggaran tahun depan dengan kajian kebutuhan yang lebih komprehensif.",
  },
  {
    id: "ver-005",
    tipe: "Laporan Kerusakan",
    judul: "Kerusakan Radio HT - Baterai Lemah",
    deskripsi:
      "Radio HT Motorola GP328 baterai cepat habis, daya turun dari 12 jam menjadi 4 jam. Perlu penggantian baterai baru.",
    status: "Menunggu",
    tanggalBuat: "2026-09-23",
    createdBy: "usr-006",
  },
];

// -----------------------------------------------------------------------------
// 5. CHECKLIST ITEMS (Template Kesiapan Aset)
// -----------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  wajib: boolean;
  kondisi: KondisiItem;
  keterangan: string;
  /** Item kritis: kondisi "Rusak Berat" otomatis mengunci armada (EWS). */
  isKritis?: boolean;
}

/** Kelompok item di dalam satu template, mis. "Kamar Mesin" atau "Dalam Kabin". */
export interface ChecklistKategori {
  nama: string;
  items: ChecklistItem[];
}

export interface ChecklistTemplate {
  id: string;
  nama: string;
  kategori: KategoriAset;
  periode: "Harian" | "Mingguan" | "Bulanan";
  items: ChecklistItem[];
  /** Kategori armada agar template bisa difilter per kendaraan di form. */
  jenisArmada: JenisArmada;
  /** Keterangan singkat asal form fisik, mis. "Jurnal RIB 01 & 02". */
  sumber?: string;
}

export const checklistTemplates: ChecklistTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE ARMADA
  // Seluruh template di bawah berasal dari form fisik kantor (lihat `sumber`).
  // Peralatan Medis/Komunikasi/Dokumentasi TIDAK memakai template — pemeriksa
  // mengetik sendiri itemnya pada mode "Input Manual" di halaman Buat Checklist.
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── MOTOR TRAIL — MINGGUAN (19 item) ───────────────────────────────────────
  {
    id: "arm-motor-mingguan",
    nama: "Ceklist Perawatan Motor Trail (Mingguan)",
    kategori: "Motor",
    periode: "Mingguan",
    jenisArmada: "Motor",
    sumber: "Ceklist Perawatan Motor Trail B 3184 PKQ",
    items: [
      // Bagian 1 — Pemeriksaan Utama
      { id: "arm-motor-mingguan-01", label: "Level Oli Mesin", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-02", label: "Kondisi Ban", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-03", label: "Tekanan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-04", label: "Keausan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-05", label: "Rantai Penggerak", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-06", label: "Baut Mur dan Pengencangan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-07", label: "Stang (Bergerak Lancar)", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-08", label: "Level Minyak Rem", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-09", label: "Kampas Rem", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-10", label: "Kerja Gas", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-11", label: "Tuas Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-12", label: "Klakson", wajib: true, kondisi: "Baik", keterangan: "" },
      // Bagian 2 — Kelistrikan & Perlengkapan
      { id: "arm-motor-mingguan-13", label: "Lampu Depan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-14", label: "Lampu Belakang / Rem", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-15", label: "Lampu Sein", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-16", label: "Engine Stop Switch", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-mingguan-17", label: "Standar Samping", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-18", label: "Indikator Spedometer", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-mingguan-19", label: "Kaca Spion", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },

  // ─── MOBIL — HARIAN (35 item) ──────────────────────────────────────────────
  {
    id: "arm-mobil-harian",
    nama: "Ceklist Perawatan Kendaraan (Harian)",
    kategori: "Mobil",
    periode: "Harian",
    jenisArmada: "Mobil",
    sumber: "Ceklist Perawatan Kendaraan",
    items: [
      // A. Menjungkitkan Kabin
      { id: "arm-mobil-harian-01", label: "Oli Mesin", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-02", label: "Oli Power Steering", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-03", label: "Fan Belt", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-04", label: "Tutup Radiator", wajib: true, kondisi: "Baik", keterangan: "" },
      // B. Dalam Kabin
      { id: "arm-mobil-harian-05", label: "Level Minyak Rem / Kopling", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-06", label: "Radio Komunikasi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-07", label: "Seat Belt (Sabuk Pengaman)", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-08", label: "Sirine & Lightbar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-09", label: "Gerak Bebas Pedal Rem", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-10", label: "Gerak Bebas Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-11", label: "Gerak Bebas Pedal Gas", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-12", label: "Instrumen Indikator", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-13", label: "Kemudahan Start Engine", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-14", label: "Langkah Tuas Rem Parkir", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-15", label: "Sapuan Wiper", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-16", label: "Kaca Spion Dalam", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-17", label: "Level Cairan Washer", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-18", label: "Gerak Bebas Kemudi", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-19", label: "Klakson", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-20", label: "Power Window / Door Lock", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-21", label: "Kunci Roda & Toolkit", wajib: true, kondisi: "Baik", keterangan: "" },
      // C. Keliling Kendaraan
      { id: "arm-mobil-harian-22", label: "Lampu-Lampu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-23", label: "Pegas Suspensi / Kaki-Kaki / Per Daun", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-24", label: "Kebocoran / Tetesan Fluid", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-25", label: "Kondisi Kaca-Kaca", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-26", label: "Wiper", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-27", label: "Saringan Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-28", label: "Rolling Door Compartment", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-29", label: "Engsel Pintu-Pintu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-30", label: "Kunci Pintu-Pintu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-31", label: "Towing", wajib: true, kondisi: "Baik", keterangan: "" },
      // D. Roda dan Ban
      { id: "arm-mobil-harian-32", label: "Tekanan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-33", label: "Tapak dan Dinding Ban", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-34", label: "Keausan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-35", label: "Pemasangan Velg", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
    ],
  },

  // ─── MOBIL — MINGGUAN (17 item) ────────────────────────────────────────────
  {
    id: "arm-mobil-mingguan",
    nama: "Ceklist Perawatan Kendaraan (Mingguan)",
    kategori: "Mobil",
    periode: "Mingguan",
    jenisArmada: "Mobil",
    sumber: "Ceklist Perawatan Kendaraan",
    items: [
      // Performa / Fungsi Sistem
      { id: "arm-mobil-mingguan-01", label: "Kerja AC", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-02", label: "Kerja Rem", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-mingguan-03", label: "Kerja Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-04", label: "Kerja Pedal Gas", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-05", label: "Kerja Kaki-Kaki", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-06", label: "Kerja Sistem 4WD", wajib: true, kondisi: "Baik", keterangan: "" },
      // Keliling Kendaraan (Mingguan)
      { id: "arm-mobil-mingguan-07", label: "Kaca Depan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-08", label: "Spion Luar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-09", label: "Floodlight System", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-10", label: "Lampu-Lampu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-11", label: "Level Cairan Pendingin", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-12", label: "APAR", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-13", label: "Plat Nopol", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-14", label: "Ban Cadangan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-15", label: "Kebersihan Kendaraan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-16", label: "Jok / Tempat Duduk", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-mingguan-17", label: "Kaca Film", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },

  // ─── MOBIL — BULANAN (1 item) ──────────────────────────────────────────────
  {
    id: "arm-mobil-bulanan",
    nama: "Ceklist Perawatan Kendaraan (Bulanan)",
    kategori: "Mobil",
    periode: "Bulanan",
    jenisArmada: "Mobil",
    sumber: "Ceklist Perawatan Kendaraan",
    items: [
      { id: "arm-mobil-bulanan-01", label: "Winch", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
    ],
  },

  // ─── RIB — PEMELIHARAAN (24 item) ───────────────────────────────────────────
  // Bagian A–C mengikuti `dokumentasi_rib_data.md`:
  //   A. Pemanasan Mesin  → pra-jalan, standar 15 menit / 100%
  //   B. Pengoperasian    → jam berangkat & jam kembali (WITA)
  //   C. Checklist BBM    → sisa kemarin, penambahan, saldo akhir
  // Bagian D adalah checklist pemeliharaan alut dari Jurnal RIB 01 & 02.
  {
    id: "arm-rib-pemeliharaan",
    nama: "Ceklist Pemeliharaan RIB",
    kategori: "Kapal",
    periode: "Harian",
    jenisArmada: "RIB",
    sumber: "Jurnal RIB 01 & 02 + Dokumentasi Data RIB",
    items: [
      // A. Pemanasan Mesin (Pra-Operasi) - standar 15 menit / 100%
      { id: "arm-rib-01", label: "Pemanasan Mesin Rutin / Pra-Jalan", wajib: true, kondisi: "Baik", keterangan: "Standar: 15 menit, 100%", isKritis: true },
      { id: "arm-rib-02", label: "Indikator Mesin Aman Setelah Pemanasan", wajib: true, kondisi: "Baik", keterangan: "Mesin beroperasi normal, indikator aman" },
      // B. Pengoperasian Alut
      { id: "arm-rib-03", label: "Jam Berangkat (WITA)", wajib: true, kondisi: "Baik", keterangan: "Contoh: 08:00 WITA" },
      { id: "arm-rib-04", label: "Jam Kembali (WITA)", wajib: true, kondisi: "Baik", keterangan: "Contoh: 12:00 WITA - Patroli Alut / Misi SAR" },
      // C. Checklist & Pemantauan Pengisian BBM
      { id: "arm-rib-05", label: "Sisa BBM Kemarin (Liter / % / Status)", wajib: true, kondisi: "Baik", keterangan: "Contoh: 50 L / 40% - Cukup atau Kurang", isKritis: true },
      { id: "arm-rib-06", label: "Penambahan BBM (Liter / % / No. Struk)", wajib: true, kondisi: "Baik", keterangan: "Contoh: 60 L / 50% - No. Struk / Sumber BBM" },
      { id: "arm-rib-07", label: "Saldo Akhir BBM (Total Liter / % / Kondisi Tanki)", wajib: true, kondisi: "Baik", keterangan: "Contoh: 110 L / 90% - Penuh, Cukup, atau Perlu Re-fill", isKritis: true },
      // D. Pemeliharaan alut RIB
      { id: "arm-rib-08", label: "Tali Tros", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-09", label: "Lunas", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-10", label: "Ban Pelampung", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-11", label: "Deck", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-12", label: "Transom (Stand Mesin)", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-13", label: "Starting Engine", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-14", label: "Kap Mesin Kanan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-15", label: "Kap Mesin Kiri", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-16", label: "Karbulator", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-17", label: "Selang BBM", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-18", label: "Busi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-19", label: "Dinamo Stater", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-20", label: "Dinamo Strom", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-21", label: "Hydraulic Mesin", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-22", label: "Aki / Baterai", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-23", label: "GPS Furuno", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-24", label: "GPS Stracking", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },

  // ─── KN SAR — HARIAN ───────────────────────────────────────────────────────
  {
    id: "arm-kapalar-harian",
    nama: "Ceklist Kapal Khusus SAR (Harian)",
    kategori: "Kapal",
    periode: "Harian",
    jenisArmada: "Kapal",
    sumber: "Logbook Kapal SAR KN SAR MAMUJU 01",
    items: [
      // Alat Navigasi & Komunikasi
      { id: "arm-kapalar-01", label: "Alat Navigasi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-kapalar-02", label: "Alat Komunikasi", wajib: true, kondisi: "Baik", keterangan: "" },
      // Persentase BBM & Endurance
      { id: "arm-kapalar-03", label: "Persentase BBM", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-kapalar-04", label: "Endurance", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-kapalar-05", label: "Kecepatan Rata", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },

  // ─── RBB — HARIAN (item sama dengan kapal khusus SAR) ───────────────────────
  {
    id: "arm-rbb-harian",
    nama: "Ceklist RBB (Harian)",
    kategori: "Kapal",
    periode: "Harian",
    jenisArmada: "RBB",
    sumber: "Logbook RBB 309 MAMUJU",
    items: [
      // Alat Navigasi & Komunikasi
      { id: "arm-rbb-01", label: "Alat Navigasi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rbb-02", label: "Alat Komunikasi", wajib: true, kondisi: "Baik", keterangan: "" },
      // Persentase BBM & Endurance
      { id: "arm-rbb-03", label: "Persentase BBM", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rbb-04", label: "Endurance", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rbb-05", label: "Kecepatan Rata", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },
];

/**
 * Kelompokkan item template berdasarkan kategori/bagian yang relevan.
 * Pemetaan mengikuti urutan item pada form fisik (dokumentasi_utuh.md Bagian 5).
 * `upto` adalah indeks item terakhir (1-based) pada bagian tersebut.
 */
const BAGIAN_TEMPLATE: Record<string, ReadonlyArray<{ nama: string; upto: number }>> = {
  "arm-motor-mingguan": [
    { nama: "Bagian 1: Pemeriksaan Utama", upto: 12 },
    { nama: "Bagian 2: Kelistrikan & Perlengkapan", upto: 19 },
  ],
  "arm-mobil-harian": [
    { nama: "A. Menjungkitkan Kabin", upto: 4 },
    { nama: "B. Dalam Kabin", upto: 21 },
    { nama: "C. Keliling Kendaraan", upto: 31 },
    { nama: "D. Roda dan Ban", upto: 35 },
  ],
  "arm-mobil-mingguan": [
    { nama: "Performa / Fungsi Sistem", upto: 6 },
    { nama: "Keliling Kendaraan (Mingguan)", upto: 17 },
  ],
  "arm-rib-pemeliharaan": [
    { nama: "A. Pemanasan Mesin (Pra-Operasi)", upto: 2 },
    { nama: "B. Pengoperasian Alut", upto: 4 },
    { nama: "C. Checklist & Pemantauan Pengisian BBM", upto: 7 },
    { nama: "D. Pemeliharaan RIB", upto: 24 },
  ],
  "arm-rbb-harian": [
    { nama: "Alat Navigasi & Komunikasi", upto: 2 },
    { nama: "Persentase BBM & Endurance", upto: 4 },
    { nama: "Kecepatan Rata", upto: 5 },
  ],
  "arm-kapalar-harian": [
    { nama: "Alat Navigasi & Komunikasi", upto: 2 },
    { nama: "Persentase BBM & Endurance", upto: 4 },
    { nama: "Kecepatan Rata", upto: 5 },
  ],
};

/** Kembalikan item template sebagai daftar kategori/bagian sesuai form fisik. */
export function getKategoriTemplate(templateId: string): ChecklistKategori[] {
  const template = checklistTemplates.find((t) => t.id === templateId);
  if (!template) return [];

  const bagian = BAGIAN_TEMPLATE[templateId];
  if (!bagian) {
    return [{ nama: template.nama, items: template.items }];
  }

  let dari = 0;
  return bagian.map((b) => {
    const items = template.items.slice(dari, b.upto);
    dari = b.upto;
    return { nama: b.nama, items };
  });
}

/** Total item kritis pada sebuah template (dasar aturan EWS). */
export function countItemKritis(templateId: string): number {
  const template = checklistTemplates.find((t) => t.id === templateId);
  return template?.items.filter((i) => i.isKritis).length ?? 0;
}

/** Daftar template untuk armada tertentu, dipakai filter di halaman form. */
export function getTemplateByArmada(jenisArmada: JenisArmada): ChecklistTemplate[] {
  return checklistTemplates.filter((t) => t.jenisArmada === jenisArmada);
}

// -----------------------------------------------------------------------------
// 5b. DATA TAMBAHAN (BBM RIB 02, Catatan Perbaikan, dll)
// -----------------------------------------------------------------------------

// Pengisian BBM RIB 02 (format asli: Sisa Kemarin, Penambahan, Saldo Akhir)
export const pengisianBBM_RIB02 = {
  sisaKemarin: "45%",
  penambahan: "30 Liter",
  saldoAkhir: "75%",
};

// Catatan Penggantian/Perbaikan Sarana Darat
export interface CatatanPerbaikan {
  tanggal: string;
  detailPekerjaan: string;
  pelaksana: string;
}

export const catatanPerbaikanDarat: CatatanPerbaikan[] = [
  {
    tanggal: "2026-09-20",
    detailPekerjaan: "Ganti oli mesin dan filter",
    pelaksana: "Bengkel Resmi Toyota Mamuju",
  },
  {
    tanggal: "2026-09-15",
    detailPekerjaan: "Perbaikan sistem rem",
    pelaksana: "Bengkel Resmi Toyota Mamuju",
  },
  {
    tanggal: "2026-09-10",
    detailPekerjaan: "Ganti ban depan kiri",
    pelaksana: "Bengkel Resmi Toyota Mamuju",
  },
];

// -----------------------------------------------------------------------------
// 6. NOTIFICATIONS
// -----------------------------------------------------------------------------

export type TipeNotifikasi = "info" | "warning" | "danger" | "success";

export interface Notifikasi {
  id: string;
  judul: string;
  pesan: string;
  tipe: TipeNotifikasi;
  dibaca: boolean;
  tanggal: string;
}

export const notifikasiList: Notifikasi[] = [
  {
    id: "ntf-001",
    judul: "Laporan Kerusakan Baru",
    pesan: "Tenda medis emergency mengalami kerusakan. Status: Menunggu Verifikasi.",
    tipe: "warning",
    dibaca: false,
    tanggal: "2026-09-25T08:30:00",
  },
  {
    id: "ntf-002",
    judul: "Peminjaman Aset",
    pesan: "Radio HT Motorola GP328 dipinjam oleh Ahmad Fauzi untuk operasi Binanga.",
    tipe: "info",
    dibaca: false,
    tanggal: "2026-09-22T10:15:00",
  },
  {
    id: "ntf-003",
    judul: "Maintenance Kendaraan",
    pesan: "Toyota Hilux sedang dalam maintenance di bengkel. Estimasi selesai 2 Oktober 2026.",
    tipe: "warning",
    dibaca: true,
    tanggal: "2026-09-27T09:00:00",
  },
  {
    id: "ntf-004",
    judul: "Verifikasi Disetujui",
    pesan: "Laporan kerusakan Perahu Karet telah disetujui oleh Verifikator.",
    tipe: "success",
    dibaca: true,
    tanggal: "2026-09-20T14:45:00",
  },
  {
    id: "ntf-005",
    judul: "EWS Ticket Tinggi",
    pesan: "Regulator Scubapro mengalami free-flow pada kedalaman 15 meter. Segera tindak lanjuti!",
    tipe: "danger",
    dibaca: false,
    tanggal: "2026-09-26T16:20:00",
  },
  {
    id: "ntf-006",
    judul: "Aset Kembali Siaga",
    pesan: "Drone DJI Mavic 3 Classic telah selesai dikalibrasi dan kembali siaga.",
    tipe: "success",
    dibaca: true,
    tanggal: "2026-09-08T11:30:00",
  },
];

// -----------------------------------------------------------------------------
// 7. ACTIVITY LOG / AUDIT TRAIL
// -----------------------------------------------------------------------------

export interface LogAktivitas {
  id: string;
  userId: string;
  aksi: string;
  target: string;
  tanggal: string;
  detail: string;
}

export const logAktivitas: LogAktivitas[] = [
  {
    id: "log-001",
    userId: "usr-005",
    aksi: "UPDATE_JURNAL_SIAGA",
    target: "Jurnal Siaga Rutin",
    tanggal: "2026-10-08T17:00:00",
    detail: "Jurnal Siaga Rutin 8 Oktober 2026 diperbarui (Shift Pagi)",
  },
  {
    id: "log-002",
    userId: "usr-006",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist RIB 12M",
    tanggal: "2026-10-08T08:30:00",
    detail: "Checklist RIB 12 M jam 08.00 disetor, semua item OK",
  },
  {
    id: "log-003",
    userId: "usr-008",
    aksi: "UPDATE_LOGBOOK",
    target: "Logbook Motor",
    tanggal: "2026-10-08T09:00:00",
    detail: "Logbook RESCUE MOTORCYCLE (Honda CRF150L) diperiksa harian",
  },
  {
    id: "log-004",
    userId: "usr-007",
    aksi: "UPDATE_CHECKLIST",
    target: "Checklist Medis",
    tanggal: "2026-10-07T16:00:00",
    detail: "Checklist harian peralatan medis disetor. P3K lengkap, AED baterai 100%",
  },
  {
    id: "log-005",
    userId: "usr-005",
    aksi: "ABSENSI_SIAGA",
    target: "Absensi Shift",
    tanggal: "2026-10-07T07:00:00",
    detail: "Absensi shift pagi, 6 personel hadir, 0 tidak hadir",
  },
  {
    id: "log-006",
    userId: "usr-006",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist Perahu Karet",
    tanggal: "2026-10-07T08:15:00",
    detail: "Checklist harian Perahu Karet Zodiac MK III. Hull OK, pompa OK",
  },
  {
    id: "log-007",
    userId: "usr-001",
    aksi: "UPDATE_LOGBOOK",
    target: "Logbook Mobil",
    tanggal: "2026-10-06T10:00:00",
    detail: "Logbook Toyota Hilux, kembali dari bengkel, status Siaga",
  },
  {
    id: "log-008",
    userId: "usr-005",
    aksi: "UPDATE_JURNAL_SIAGA",
    target: "Jurnal Siaga Rutin",
    tanggal: "2026-10-06T17:00:00",
    detail: "Jurnal Siaga Rutin 6 Oktober 2026. Shift Sore, kondisi normal",
  },
  {
    id: "log-009",
    userId: "usr-007",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist Komunikasi",
    tanggal: "2026-10-05T09:00:00",
    detail: "Checklist komunikasi. Radio HT OK, GPS Garmin terkoneksi satelit",
  },
  {
    id: "log-010",
    userId: "usr-006",
    aksi: "PEMANASAN_RIB",
    target: "RIB 9M",
    tanggal: "2026-10-05T07:30:00",
    detail: "Pemanasan mesin RIB 9M. RPM stabil, oli cukup, BBM 80%",
  },
  {
    id: "log-011",
    userId: "usr-008",
    aksi: "ABSENSI_SIAGA",
    target: "Absensi Shift",
    tanggal: "2026-10-04T07:00:00",
    detail: "Absensi shift pagi, 5 personel hadir, 1 cuti",
  },
  {
    id: "log-012",
    userId: "usr-005",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist Selam",
    tanggal: "2026-10-04T08:00:00",
    detail: "Inspeksi peralatan selam. Tabung 200 bar, regulator OK",
  },
];

// -----------------------------------------------------------------------------
// 7b. RIWAYAT OPERASI (Event Log — bukan statistik)
// -----------------------------------------------------------------------------

export type HasilOperasi = "Berhasil" | "Sebagian Berhasil" | "Tidak Berhasil";

export interface RiwayatOperasi {
  id: string;
  tanggal: string;
  jenis: string;
  lokasi: string;
  durasi: string;
  personel: number;
  hasil: HasilOperasi;
  keterangan?: string;
}

export const riwayatOperasi: RiwayatOperasi[] = [
  {
    id: "op-001",
    tanggal: "2026-10-02",
    jenis: "Evakuasi Korban Tenggelam",
    lokasi: "Desa Binanga, Mamuju",
    durasi: "4 jam",
    personel: 6,
    hasil: "Berhasil",
    keterangan: "1 korban dievakuasi selamat. Tim menggunakan RIB 12M dan peralatan selam.",
  },
  {
    id: "op-002",
    tanggal: "2026-09-15",
    jenis: "Pencarian Korban Hilang",
    lokasi: "Pantai Karampuang, Mamuju",
    durasi: "2 jam",
    personel: 3,
    hasil: "Berhasil",
    keterangan: "Korban ditemukan di area pantai selatan. Koordinasi dengan nelayan lokal.",
  },
];


// -----------------------------------------------------------------------------
// 8. READINESS STATS (Dashboard Eksekutif)
// -----------------------------------------------------------------------------

export interface ReadinessStats {
  totalAset: number;
  standby: number;
  sedangDigunakan: number;
  dipindahkan: number;
  rusakRingan: number;
  rusakBerat: number;
  readinessIndex: number;
  kesiapanPerKategori: {
    kategori: KategoriAset;
    total: number;
    standby: number;
    persentase: number;
  }[];
}

export const readinessStats: ReadinessStats = {
  totalAset: 12,
  standby: 7,
  sedangDigunakan: 1,
  dipindahkan: 2,
  rusakRingan: 1,
  rusakBerat: 1,
  readinessIndex: 58.3,
  kesiapanPerKategori: [
    { kategori: "Mobil", total: 1, standby: 0, persentase: 0.0 },
    { kategori: "Motor", total: 1, standby: 0, persentase: 0.0 },
    { kategori: "Peralatan SAR", total: 4, standby: 4, persentase: 100.0 },
    { kategori: "Komunikasi", total: 2, standby: 1, persentase: 50.0 },
    { kategori: "Medis", total: 2, standby: 1, persentase: 50.0 },
    { kategori: "Dokumentasi", total: 2, standby: 1, persentase: 50.0 },
  ],
};

// -----------------------------------------------------------------------------
// 9. COMPLIANCE RANKING (Halaman Audit)
// -----------------------------------------------------------------------------

export interface ComplianceRanking {
  personelId: string;
  nama: string;
  telatKembali: number;
  abaikanChecklist: number;
  skorKepatuhan: number;
}

export const complianceRanking: ComplianceRanking[] = [
  {
    personelId: "usr-005",
    nama: "Siti Nurhaliza",
    telatKembali: 0,
    abaikanChecklist: 0,
    skorKepatuhan: 100,
  },
  {
    personelId: "usr-006",
    nama: "Ahmad Fauzi",
    telatKembali: 1,
    abaikanChecklist: 0,
    skorKepatuhan: 95,
  },
  {
    personelId: "usr-007",
    nama: "Dewi Lestari",
    telatKembali: 1,
    abaikanChecklist: 1,
    skorKepatuhan: 88,
  },
  {
    personelId: "usr-008",
    nama: "Budi Santoso",
    telatKembali: 2,
    abaikanChecklist: 1,
    skorKepatuhan: 80,
  },
  {
    personelId: "usr-004",
    nama: "Rizky Pratama",
    telatKembali: 3,
    abaikanChecklist: 2,
    skorKepatuhan: 70,
  },
];

// -----------------------------------------------------------------------------
// 10. PENGAJUAN PERSETUJUAN
// -----------------------------------------------------------------------------

export type StatusApproval = "Menunggu" | "Disetujui" | "Ditolak";

export interface Approval {
  id: string;
  kode: string;
  namaAset: string;
  kategori: KategoriAset;
  pengajuanOleh: string;
  tanggal: string;
  status: StatusApproval;
  alasan: string;
  rincian: { label: string; value: string }[];
}

export const approvalList: Approval[] = [
  {
    id: "apr-001",
    kode: "BMN-SAR-005",
    namaAset: "Chain Stihl MS 261",
    kategori: "Peralatan SAR",
    pengajuanOleh: "usr-001",
    tanggal: "2026-09-26",
    status: "Menunggu",
    alasan:
      "Menggantikan chainsaw lama yang sudah tidak berfungsi optimal karena mata rantai aus.",
    rincian: [
      { label: "Kondisi Aset Lama", value: "Rusak Berat" },
      { label: "Usia Pakai", value: "6 tahun" },
      { label: "Estimasi Biaya", value: "Rp 4.500.000" },
      { label: "Sumber Dana", value: "DIPA 2026" },
    ],
  },
  {
    id: "apr-002",
    kode: "BMN-KOM-003",
    namaAset: "Thermal Imaging Camera FLIR",
    kategori: "Komunikasi",
    pengajuanOleh: "usr-001",
    tanggal: "2026-09-21",
    status: "Ditolak",
    alasan:
      "Usulan tidak sesuai prioritas kebutuhan. Anggaran tahun ini sudah terpakai untuk kebutuhan komunikasi VHF.",
    rincian: [
      { label: "Kondisi Aset Lama", value: "Baik" },
      { label: "Usia Pakai", value: "1 tahun" },
      { label: "Estimasi Biaya", value: "Rp 38.000.000" },
      { label: "Sumber Dana", value: "DIPA 2026" },
    ],
  },
  {
    id: "apr-003",
    kode: "BMN-MED-003",
    namaAset: "Tabung Oksigen 10L",
    kategori: "Medis",
    pengajuanOleh: "usr-002",
    tanggal: "2026-09-24",
    status: "Disetujui",
    alasan:
      "Menambah stok oksigen untuk tim medis lapangan agar siap pada setiap operasi evakuasi.",
    rincian: [
      { label: "Kondisi Aset Lama", value: "Habis Terpakai" },
      { label: "Usia Pakai", value: "3 tahun" },
      { label: "Estimasi Biaya", value: "Rp 1.750.000" },
      { label: "Sumber Dana", value: "DIPA 2026" },
    ],
  },
  {
    id: "apr-004",
    kode: "BMN-DOK-003",
    namaAset: "Laptop Field Rugged Panasonic",
    kategori: "Dokumentasi",
    pengajuanOleh: "usr-003",
    tanggal: "2026-09-18",
    status: "Menunggu",
    alasan:
      "Laptop lama sering gagal menyala di lapangan karena kompresinya sudah tidak stabil.",
    rincian: [
      { label: "Kondisi Aset Lama", value: "Rusak Ringan" },
      { label: "Usia Pakai", value: "5 tahun" },
      { label: "Estimasi Biaya", value: "Rp 12.000.000" },
      { label: "Sumber Dana", value: "DIPA 2026" },
    ],
  },
  {
    id: "apr-005",
    kode: "BMN-KND-003",
    namaAset: "Motor Honda CRF250R",
    kategori: "Motor",
    pengajuanOleh: "usr-001",
    tanggal: "2026-09-20",
    status: "Menunggu",
    alasan:
      "Menambah armada motor trail untuk memperbesar daya jangkau di wilayah pedalaman yang sulit dijangkau kendaraan roda empat.",
    rincian: [
      { label: "Kondisi Aset Lama", value: "Tidak Ada (Usulan Baru)" },
      { label: "Usia Pakai", value: "-" },
      { label: "Estimasi Biaya", value: "Rp 58.000.000" },
      { label: "Sumber Dana", value: "DIPA 2026" },
    ],
  },
];

// -----------------------------------------------------------------------------
// 11. LOGBOOK PERJALANAN
// -----------------------------------------------------------------------------

/**
 * Status penggunaan armada pada satu catatan perjalanan.
 *
 * Sengaja dipisahkan dari status kesiapsiagaan armada (`StatusAset`) dan status
 * pemeliharaan (`StatusTicket`) supaya "sedang dipinjam" tidak tertukar dengan
 * "rusak sedang diperbaiki".
 */
export type StatusPenggunaan =
  | "Menunggu Penggunaan"
  | "Sedang Digunakan"
  | "Selesai";

/** Tahap pencatatan logbook perjalanan. */
export type TahapLogbook = "Awal" | "Pelengkapan";

export interface LogbookPerjalanan {
  id: string;
  tanggal: string;
  jamBerangkat: string;
  jamKembali: string;
  rute: string;
  tujuan: string;
  /** Kategori induk: Kapal, RBB, RIB, Mobil, Motor */
  kategoriUnit?: "Kapal" | "RBB" | "RIB" | "Mobil" | "Motor";
  jenisUnit: string;
  /** Nahkoda (laut) atau Pengemudi (darat) */
  nahkoda: string;
  jumlahPersonel: number;
  bbmSebelum: string;
  bbmSesudah: string;
  /**
   * Endurance Awal/Dakhir dalam format HH:MM (jam:menit).
   * Contoh: "80:00" berarti 80 jam, "80:30" berarti 80 jam 30 menit.
   * Khusus armada laut: Kapal, RIB, RBB. Darat (Mobil/Motor) tidak pakai field ini.
   */
  enduranceAwal?: string;
  enduranceAkhir?: string;
  /** Kilometer — khusus kendaraan darat */
  kmSebelum?: string;
  kmSesudah?: string;
  /**
   * Status penggunaan (bukan status kesiapsiagaan armada).
   * Diturunkan otomatis oleh tahap pencatatan, tidak dipilih manual.
   */
  status: StatusPenggunaan;
  catatan: string;
  /** ISO timestamp saat tahap awal disimpan — dipakai untuk urut riwayat. */
  tanggalSimpan?: string;
  /** ISO timestamp saat tahap pelengkapan disimpan. */
  tanggalLengkap?: string;
}

export const logbookPerjalananList: LogbookPerjalanan[] = [
  {
    id: "lp-01",
    tanggal: "2026-10-08",
    jamBerangkat: "08:00",
    jamKembali: "10:30",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 9 M",
    nahkoda: "Siti Nurhaliza",
    jumlahPersonel: 4,
    bbmSebelum: "90%",
    bbmSesudah: "75%",
    status: "Selesai",
    enduranceAwal: "76:30",
    enduranceAkhir: "63:45",
    tanggalSimpan: "2026-10-08T08:00:00",
    tanggalLengkap: "2026-10-08T10:30:00",
    catatan: "Kondisi laut normal, tidak ada insiden",
  },
  {
    id: "lp-02",
    tanggal: "2026-10-08",
    jamBerangkat: "11:00",
    jamKembali: "13:00",
    rute: "Perairan Mamuju - Pantai Karampuang",
    tujuan: "Sosialisasi SAR",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 12 M",
    nahkoda: "Ahmad Fauzi",
    jumlahPersonel: 5,
    bbmSebelum: "85%",
    bbmSesudah: "65%",
    status: "Selesai",
    enduranceAwal: "63:45",
    enduranceAkhir: "55:15",
    tanggalSimpan: "2026-10-08T11:00:00",
    tanggalLengkap: "2026-10-08T13:00:00",
    catatan: "Sosialisasi keselamatan pantai kepada nelayan",
  },
  {
    id: "lp-03",
    tanggal: "2026-10-07",
    jamBerangkat: "09:00",
    jamKembali: "12:00",
    rute: "Dermaga Mamuju - Perairan Binanga",
    tujuan: "Operasi evakuasi",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 9 M",
    nahkoda: "Dewi Lestari",
    jumlahPersonel: 6,
    bbmSebelum: "95%",
    bbmSesudah: "60%",
    status: "Selesai",
    enduranceAwal: "82:00",
    enduranceAkhir: "58:30",
    tanggalSimpan: "2026-10-07T09:00:00",
    tanggalLengkap: "2026-10-07T12:00:00",
    catatan: "Evakuasi korban tenggelam, 2 orang selamat",
  },
  {
    id: "lp-04",
    tanggal: "2026-10-07",
    jamBerangkat: "14:00",
    jamKembali: "16:00",
    rute: "Perairan Mamuju - Pos Pantai",
    tujuan: "Patroli pantai",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 12 M",
    nahkoda: "Budi Santoso",
    jumlahPersonel: 3,
    bbmSebelum: "80%",
    bbmSesudah: "70%",
    status: "Selesai",
    enduranceAwal: "70:15",
    enduranceAkhir: "66:45",
    tanggalSimpan: "2026-10-07T14:00:00",
    tanggalLengkap: "2026-10-07T16:00:00",
    catatan: "Pantai ramai pengunjung, kondisi aman",
  },
  {
    id: "lp-05",
    tanggal: "2026-10-06",
    jamBerangkat: "08:30",
    jamKembali: "11:30",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Latihan SAR",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 9 M",
    nahkoda: "Medlyn R. Pagali",
    jumlahPersonel: 8,
    bbmSebelum: "100%",
    bbmSesudah: "70%",
    status: "Selesai",
    enduranceAwal: "90:00",
    enduranceAkhir: "72:30",
    tanggalSimpan: "2026-10-06T08:30:00",
    tanggalLengkap: "2026-10-06T11:30:00",
    catatan: "Latihan teknik penyelamatan korban di air",
  },
  {
    id: "lp-06",
    tanggal: "2026-10-09",
    jamBerangkat: "08:00",
    jamKembali: "",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 12 M",
    nahkoda: "Kauluddin",
    jumlahPersonel: 4,
    bbmSebelum: "88%",
    bbmSesudah: "",
    status: "Sedang Digunakan",
    enduranceAwal: "78:15",
    enduranceAkhir: "",
    tanggalSimpan: "2026-10-09T08:00:00",
    catatan: "Sedang dalam perjalanan",
  },
  {
    id: "lp-07",
    tanggal: "2026-10-09",
    jamBerangkat: "14:00",
    jamKembali: "",
    rute: "Perairan Mamuju - Pos Pantai",
    tujuan: "Patroli sore",
    kategoriUnit: "RIB",
    jenisUnit: "RIB 9 M",
    nahkoda: "Rizky Pratama",
    jumlahPersonel: 3,
    bbmSebelum: "85%",
    bbmSesudah: "",
    status: "Sedang Digunakan",
    enduranceAwal: "80:00",
    enduranceAkhir: "",
    tanggalSimpan: "2026-10-09T14:00:00",
    catatan: "Dijadwalkan untuk shift sore",
  },
  // ─── LOGBOOK ARMADA BESAR: KAPAL (KN SAR) & RBB ─────────────────────────────
  // Endurance diisi untuk semua armada laut. Status "Selesai" berarti endurance
  // akhir tercatat; selama "Berlangsung"/"Dijadwalkan" endurance akhir kosong.

  // KN SAR MAMUJU 01 — kapal khusus SAR
  {
    id: "lp-11",
    tanggal: "2026-10-10",
    jamBerangkat: "08:00",
    jamKembali: "10:30",
    rute: "Dermaga Mamuju - Perairan Mamuju - Pantai Karampuang",
    tujuan: "Patroli laut dan pengamatan korban",
    kategoriUnit: "Kapal",
    jenisUnit: "KN SAR MAMUJU 01",
    nahkoda: "Ansaruddin",
    jumlahPersonel: 6,
    bbmSebelum: "88%",
    bbmSesudah: "74%",
    enduranceAwal: "80:00",
    enduranceAkhir: "70:15",
    status: "Selesai",
    tanggalSimpan: "2026-10-10T08:00:00",
    tanggalLengkap: "2026-10-10T10:30:00",
    catatan: "Pantai Karampuang, tinggi gelombang 1,5 meter. Kapal beroperasi normal.",
  },
  {
    id: "lp-12",
    tanggal: "2026-10-09",
    jamBerangkat: "14:00",
    jamKembali: "16:45",
    rute: "Dermaga Mamuju - Perairan Teluk Mamuju",
    tujuan: "Sosialisasi kesiapsiagaan SAR",
    kategoriUnit: "Kapal",
    jenisUnit: "KN SAR MAMUJU 01",
    nahkoda: "Kauluddin",
    jumlahPersonel: 5,
    bbmSebelum: "82%",
    bbmSesudah: "71%",
    enduranceAwal: "74:30",
    enduranceAkhir: "66:00",
    status: "Selesai",
    tanggalSimpan: "2026-10-09T14:00:00",
    tanggalLengkap: "2026-10-09T16:45:00",
    catatan: "Sosialisasi kepada manager desa dan BM bersudara.",
  },
  {
    id: "lp-13",
    tanggal: "2026-10-11",
    jamBerangkat: "",
    jamKembali: "",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    kategoriUnit: "Kapal",
    jenisUnit: "KN SAR MAMUJU 01",
    nahkoda: "Siti Nurhaliza",
    jumlahPersonel: 6,
    bbmSebelum: "90%",
    bbmSesudah: "",
    enduranceAwal: "86:15",
    enduranceAkhir: "",
    status: "Menunggu Penggunaan",
    tanggalSimpan: "2026-10-11T07:00:00",
    catatan: "Shift pagi, menunggu konfirmasi cuaca.",
  },

  // RBB 309 MAMUJU — rubber boat
  {
    id: "lp-14",
    tanggal: "2026-10-10",
    jamBerangkat: "09:00",
    jamKembali: "11:15",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Evakuasi korban tenggelam",
    kategoriUnit: "RIB",
    jenisUnit: "RBB 309 MAMUJU",
    nahkoda: "Dewi Lestari",
    jumlahPersonel: 4,
    bbmSebelum: "95%",
    bbmSesudah: "68%",
    enduranceAwal: "84:00",
    enduranceAkhir: "61:45",
    status: "Selesai",
    tanggalSimpan: "2026-10-10T09:00:00",
    tanggalLengkap: "2026-10-10T11:15:00",
    catatan: "Satu korban tenggelam berhasil dievakuasi ke klinik terdekat.",
  },
  {
    id: "lp-15",
    tanggal: "2026-10-09",
    jamBerangkat: "15:30",
    jamKembali: "17:00",
    rute: "Perairan Mamuju - Pulau Kecil",
    tujuan: "Patroli pulau",
    kategoriUnit: "RIB",
    jenisUnit: "RBB 309 MAMUJU",
    nahkoda: "Budi Santoso",
    jumlahPersonel: 3,
    bbmSebelum: "78%",
    bbmSesudah: "72%",
    enduranceAwal: "70:00",
    enduranceAkhir: "65:30",
    status: "Selesai",
    tanggalSimpan: "2026-10-09T15:30:00",
    tanggalLengkap: "2026-10-09T17:00:00",
    catatan: "Patroli normal, tidak ada kelainan.",
  },
  {
    id: "lp-16",
    tanggal: "2026-10-11",
    jamBerangkat: "08:30",
    jamKembali: "",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Pemeriksaan RBB",
    kategoriUnit: "RIB",
    jenisUnit: "RBB 309 MAMUJU",
    nahkoda: "Agustang",
    jumlahPersonel: 3,
    bbmSebelum: "88%",
    bbmSesudah: "",
    enduranceAwal: "78:30",
    enduranceAkhir: "",
    status: "Sedang Digunakan",
    tanggalSimpan: "2026-10-11T08:30:00",
    catatan: "Pemeriksaan RBB sebelum operasi hari ini",
  },

  // ─── LOGBOOK DARAT (Mobil & Motor) ──────────────────────────────────────────
  {
    id: "lp-08",
    tanggal: "2026-10-08",
    jamBerangkat: "07:30",
    jamKembali: "11:00",
    rute: "Kantor SAR Mamuju - Desa Binanga",
    tujuan: "Distribusi logistik bantuan",
    kategoriUnit: "Mobil",
    jenisUnit: "Toyota Hilux (DA 1234 SAR)",
    nahkoda: "Ahmad Fauzi",
    jumlahPersonel: 3,
    bbmSebelum: "90%",
    bbmSesudah: "55%",
    kmSebelum: "45230",
    kmSesudah: "45312",
    status: "Selesai",
    tanggalSimpan: "2026-10-08T07:30:00",
    tanggalLengkap: "2026-10-08T11:00:00",
    catatan: "Jalan menuju Desa Binanga berlubang, perlu hati-hati pada KM 67-69",
  },
  {
    id: "lp-09",
    tanggal: "2026-10-07",
    jamBerangkat: "09:00",
    jamKembali: "12:30",
    rute: "Kantor SAR Mamuju - Pantai Karampuang",
    tujuan: "Survey lokasi sosialisasi",
    kategoriUnit: "Motor",
    jenisUnit: "Honda CRF150L (B 3184 PKQ)",
    nahkoda: "Budi Santoso",
    jumlahPersonel: 1,
    bbmSebelum: "80%",
    bbmSesudah: "50%",
    kmSebelum: "12450",
    kmSesudah: "12520",
    status: "Selesai",
    tanggalSimpan: "2026-10-07T09:00:00",
    tanggalLengkap: "2026-10-07T12:30:00",
    catatan: "Akses jalan ke pantai cukup baik, kondisi motor normal",
  },
  {
    id: "lp-10",
    tanggal: "2026-10-09",
    jamBerangkat: "13:00",
    jamKembali: "",
    rute: "Kantor SAR Mamuju - Kecamatan Kalukku",
    tujuan: "Evakuasi korban banjir",
    kategoriUnit: "Mobil",
    jenisUnit: "Toyota Hilux (DA 1234 SAR)",
    nahkoda: "Medlyn R. Pagali",
    jumlahPersonel: 5,
    bbmSebelum: "100%",
    bbmSesudah: "",
    kmSebelum: "45312",
    kmSesudah: "",
    status: "Sedang Digunakan",
    tanggalSimpan: "2026-10-09T13:00:00",
    catatan: "Operasi evakuasi pasca banjir di Kalukku",
  },
];

// -----------------------------------------------------------------------------
// 12. CHECKLIST HARIAN (HASIL PENGECEKAN)
// -----------------------------------------------------------------------------

export type KondisiHasil = "Baik" | "Rusak Ringan" | "Rusak Berat" | "Belum Diperiksa";

/** Hasil pemeriksaan satu item pada sebuah checklist harian. */
export interface ItemHasilPengecekan {
  label: string;
  wajib: boolean;
  kondisi: KondisiHasil;
  keterangan: string;
}

export interface ChecklistHarian {
  id: string;
  tanggal: string;
  unit: string;
  jenisUnit: "Kapal" | "Mobil" | "Motor" | "Perahu";
  /** Template asal checklist ini, dipakai untuk melihat daftar item standar. */
  templateId?: string;
  /** Nama pemeriksa (PJ) — terisi otomatis dari akun yang login. */
  pemeriksa: string;
  /** ID user pemeriksa (untuk riwayat & auto-fill berita acara). */
  pemeriksaId?: string;
  /** Aset BMN terkait (untuk mengisi otomatis berita acara). */
  asetId?: string;
  status: "Lengkap" | "Belum Lengkap";
  /** Item yang benar-benar sudah diperiksa (dihitung dari `items`). */
  itemChecked: number;
  /** Total item pada template asal checklist ini. */
  itemTotal: number;
  /** Rincian hasil per item. */
  items: ItemHasilPengecekan[];
  catatan: string;
}

export const checklistHarianList: ChecklistHarian[] = [
  // ─── CHECKLIST PERALATAN TANPA TEMPLATE (INPUT MANUAL) ─────────────────────
  // Medis & Komunikasi tidak punya form fisik dari kantor, jadi itemnya ditulis
  // sendiri oleh pemeriksa. `templateId` dikosongkan sebagai penanda mode manual.

  {
    id: "manual-001",
    tanggal: "2026-10-09",
    unit: "Defibrillator Zoll AED Plus",
    jenisUnit: "Perahu",
    pemeriksa: "Dewi Lestari",
    status: "Lengkap",
    itemChecked: 3,
    itemTotal: 3,
    items: [
      { label: "Baterai AED terisi penuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Elektroda dan kabel tidak rusak", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Indikator daya menyala normal", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Peralatan medis siap dipakai",
  },
  {
    id: "manual-002",
    tanggal: "2026-10-08",
    unit: "Radio HT Motorola MD76",
    jenisUnit: "Perahu",
    pemeriksa: "Budi Santoso",
    status: "Belum Lengkap",
    itemChecked: 2,
    itemTotal: 3,
    items: [
      { label: "Baterai HT terisi penuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Baterai cadangan tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Frekuensi regu sesuai channel terbaru", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
    ],
    catatan: "Channel frekuensi perlu dikonfirmasi ke coordinator regu",
  },

  // ─── CHECKLIST ARMADA DARI FORM FISIK ───────────────────────────────────────

  {
    id: "arm-001",
    tanggal: "2026-10-10",
    unit: "Rescue Motorcycle Honda CRF150L (B 3184 PKQ)",
    jenisUnit: "Motor",
    templateId: "arm-motor-mingguan",
    pemeriksa: "Medlyn R. Pagali",
    status: "Belum Lengkap",
    itemChecked: 17,
    itemTotal: 19,
    items: [
      { label: "Level Oli Mesin", wajib: true, kondisi: "Rusak Ringan", keterangan: "Oli sudah encer, perlu diganti" },
      { label: "Kondisi Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tekanan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Keausan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Rantai Penggerak", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Baut Mur dan Pengencangan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Stang (Bergerak Lancar)", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Level Minyak Rem", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kampas Rem", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kerja Gas", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tuas Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Klakson", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lampu Depan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lampu Belakang / Rem", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lampu Sein", wajib: true, kondisi: "Rusak Ringan", keterangan: "Lampu sein kanan mati" },
      { label: "Engine Stop Switch", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Standar Samping", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Indikator Spedometer", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
      { label: "Kaca Spion", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
    ],
    catatan: "Level oli mesin perlu diganti, lampu sein kanan mati",
  },
  {
    id: "arm-002",
    tanggal: "2026-10-10",
    unit: "Kendaraan Toyota Hilux Double Cabin 4x4 (DA 1234 SAR)",
    jenisUnit: "Mobil",
    templateId: "arm-mobil-harian",
    pemeriksa: "Ahmad Fauzi",
    status: "Belum Lengkap",
    itemChecked: 32,
    itemTotal: 35,
    items: [
      { label: "Oli Mesin", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Oli Power Steering", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Fan Belt", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tutup Radiator", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Level Minyak Rem / Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Radio Komunikasi", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Seat Belt (Sabuk Pengaman)", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Sirine & Lightbar", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Gerak Bebas Pedal Rem", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Gerak Bebas Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Gerak Bebas Pedal Gas", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Instrumen Indikator", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kemudahan Start Engine", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Langkah Tuas Rem Parkir", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Sapuan Wiper", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kaca Spion Dalam", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Level Cairan Washer", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Gerak Bebas Kemudi", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Klakson", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Power Window / Door Lock", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kunci Roda & Toolkit", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lampu-Lampu", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Pegas Suspensi / Kaki-Kaki / Per Daun", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kebocoran / Tetesan Fluid", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
      { label: "Kondisi Kaca-Kaca", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Wiper", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Saringan Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Rolling Door Compartment", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Engsel Pintu-Pintu", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kunci Pintu-Pintu", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Towing", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tekanan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tapak dan Dinding Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Keausan Ban", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
      { label: "Pemasangan Velg", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
    ],
    catatan: "Dua item belum diperiksa: Kebocoran/Tetesan Fluid dan Keausan Ban",
  },
  {
    id: "arm-003",
    tanggal: "2026-10-09",
    unit: "KN SAR MAMUJU 01",
    jenisUnit: "Kapal",
    templateId: "arm-kapalar-harian",
    pemeriksa: "Budi Santoso",
    status: "Lengkap",
    itemChecked: 5,
    itemTotal: 5,
    items: [
      // Alat Navigasi & Komunikasi
      { label: "Alat Navigasi", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Alat Komunikasi", wajib: true, kondisi: "Baik", keterangan: "" },
      // Persentase BBM & Endurance
      { label: "Persentase BBM", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Endurance", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kecepatan Rata", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Semua 5 item utama dalam kondisi baik, kapal siap beroperasi",
  },
  {
    id: "arm-004",
    tanggal: "2026-10-09",
    unit: "RIB 01 (Perahu Karet Zodiac RIB 9 M)",
    jenisUnit: "Perahu",
    templateId: "arm-rib-pemeliharaan",
    pemeriksa: "Agustang",
    status: "Belum Lengkap",
    itemChecked: 23,
    itemTotal: 24,
    items: [
      // A. Pemanasan Mesin (Pra-Operasi)
      { label: "Pemanasan Mesin Rutin / Pra-Jalan", wajib: true, kondisi: "Baik", keterangan: "15 menit, 100% - mesin hangat optimal" },
      { label: "Indikator Mesin Aman Setelah Pemanasan", wajib: true, kondisi: "Baik", keterangan: "Mesin beroperasi normal, indikator aman" },
      // B. Pengoperasian Alut
      { label: "Jam Berangkat (WITA)", wajib: true, kondisi: "Baik", keterangan: "07:00 WITA" },
      { label: "Jam Kembali (WITA)", wajib: true, kondisi: "Baik", keterangan: "10:15 WITA - Patroli Alut / Misi SAR" },
      // C. Checklist & Pemantauan Pengisian BBM
      { label: "Sisa BBM Kemarin (Liter / % / Status)", wajib: true, kondisi: "Baik", keterangan: "50 L / 40% - Cukup" },
      { label: "Penambahan BBM (Liter / % / No. Struk)", wajib: true, kondisi: "Baik", keterangan: "60 L / 50% - No. Struk 0451/PU/2026" },
      { label: "Saldo Akhir BBM (Total Liter / % / Kondisi Tanki)", wajib: true, kondisi: "Baik", keterangan: "96 L / 80% - Cukup" },
      // D. Pemeliharaan alut RIB
      { label: "Tali Tros", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lunas", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Ban Pelampung", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Deck", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Transom (Stand Mesin)", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Starting Engine", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kap Mesin Kanan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kap Mesin Kiri", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Karbulator", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Selang BBM", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Busi", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Dinamo Stater", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Dinamo Strom", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Hydraulic Mesin", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Aki / Baterai", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "GPS Furuno", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "GPS Stracking", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
    ],
    catatan: "Pemanasan mesin, pengoperasian, dan checklist BBM terisi lengkap. GPS Stracking belum diperiksa, perlu cek kelengkapan perangkat.",
  },
];

// Helper Functions
// -----------------------------------------------------------------------------

export function getApprovalById(id: string): Approval | undefined {
  return approvalList.find((a) => a.id === id);
}

export function getChecklistHarianById(id: string): ChecklistHarian | undefined {
  return checklistHarianList.find((c) => c.id === id);
}

export function getChecklistTemplateById(id: string): ChecklistTemplate | undefined {
  return checklistTemplates.find((t) => t.id === id);
}

export function getLogbookPerjalananById(id: string): LogbookPerjalanan | undefined {
  return logbookPerjalananList.find((l) => l.id === id);
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getAsetById(id: string): Aset | undefined {
  return asetList.find((a) => a.id === id);
}

export function formatTanggal(tanggal: string): string {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTanggalWaktu(tanggal: string): string {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper Endurance
// -----------------------------------------------------------------------------

/** Pecah endurance "HH:MM" menjadi jumlah jam dan menit. */
export function parseEndurance(
  nilai?: string
): { jam: number; menit: number } | null {
  const bersih = (nilai ?? "").trim();
  if (!bersih) return null;

  const cocok = /^(\d{1,3}):([0-5]\d)$/.exec(bersih);
  if (!cocok) return null;

  return { jam: Number(cocok[1]), menit: Number(cocok[2]) };
}

/** Ubah endurance "HH:MM" menjadi total menit; null bila kosong/tidak valid. */
export function enduranceKeMenit(nilai?: string): number | null {
  const parsed = parseEndurance(nilai);
  return parsed === null ? null : parsed.jam * 60 + parsed.menit;
}

/**
 * Format menit menjadi bacaan manusia, mis. 4620 → "77 jam".
 * Menit ikut ditulis bila ada, mis. 4625 → "77 jam 5 menit".
 */
export function formatMenit(totalMenit: number): string {
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (menit === 0) return `${jam} jam`;
  return jam === 0 ? `${menit} menit` : `${jam} jam ${menit} menit`;
}

/**
 * Format nilai endurance untuk ditampilkan, mis. "80:30" → "80 jam 30 menit".
 * Mengembalikan `-` bila kosong atau formatnya tidak valid.
 */
export function formatEndurance(nilai?: string): string {
  const total = enduranceKeMenit(nilai);
  return total === null ? "-" : formatMenit(total);
}

/** Selisih endurance awal − akhir dalam menit; null bila salah satu belum terisi. */
export function selisihEndurance(awal?: string, akhir?: string): number | null {
  const a = enduranceKeMenit(awal);
  const b = enduranceKeMenit(akhir);
  if (a === null || b === null) return null;
  return Math.max(a - b, 0);
}

// Helper Tahap Pencatatan Logbook
// -----------------------------------------------------------------------------

/** Kategori armada yang memakai endurance (bukan kilometer). */
export const KATEGORI_ARMAPADA_LAUT = ["Kapal", "RBB", "RIB"] as const;

export type KategoriLogbook =
  | "Kapal"
  | "RBB"
  | "RIB"
  | "Mobil"
  | "Motor";

/** Apakah kategori ini armada laut (endurance) atau darat (kilometer). */
export function isArmadaLaut(
  kategori: string | undefined
): kategori is (typeof KATEGORI_ARMAPADA_LAUT)[number] {
  return KATEGORI_ARMAPADA_LAUT.includes(
    kategori as (typeof KATEGORI_ARMAPADA_LAUT)[number]
  );
}

/** Isi form logbook — nilai semua field masih berupa string mentah. */
export interface FormLogbook {
  tanggal: string;
  jamBerangkat: string;
  jamKembali: string;
  rute: string;
  tujuan: string;
  kategoriUnit: KategoriLogbook | "";
  jenisUnit: string;
  nahkoda: string;
  jumlahPersonel: string;
  bbmSebelum: string;
  bbmSesudah: string;
  enduranceAwal: string;
  enduranceAkhir: string;
  kmSebelum: string;
  kmSesudah: string;
  catatan: string;
}

export type LogbookErrors = Partial<Record<keyof FormLogbook, string>>;

const POLA_ENDURANCE = /^(\d{1,3}):([0-5]\d)$/;

function cekAngka(nilai: string): boolean {
  return /^\d+(\.\d+)?$/.test(nilai);
}

function cekPersen(nilai: string, nama: string): string | undefined {
  if (!cekAngka(nilai)) return `${nama} harus berupa angka.`;
  const angka = Number(nilai);
  if (angka < 0 || angka > 100) return `${nama} harus antara 0 dan 100.`;
  return undefined;
}

function cekJam(nilai: string, nama: string): string | undefined {
  if (!/^\d{2}:\d{2}$/.test(nilai)) return `${nama} wajib diisi.`;
  const [jam, menit] = nilai.split(":").map(Number);
  if (jam > 23 || menit > 59) return `${nama} tidak valid.`;
  return undefined;
}

/**
 * Validasi tahap awal — data yang wajib dicatat sebelum armada berangkat.
 *
 * Endurance awal WAJIB untuk armada laut; endurance akhir memang belum ada
 * pada tahap ini karena unit masih dalam perjalanan.
 */
export function validasiTahapAwal(form: FormLogbook): LogbookErrors {
  const e: LogbookErrors = {};

  if (!form.tanggal) e.tanggal = "Tanggal wajib diisi.";
  else if (!isValidISODate(form.tanggal)) e.tanggal = "Tanggal tidak valid.";

  // Jam keberangkatan boleh kosong: artinya armadanya masih "Menunggu Penggunaan".
  if (form.jamBerangkat) {
    const err = cekJam(form.jamBerangkat, "Jam keberangkatan");
    if (err) e.jamBerangkat = err;
  }

  if (!form.rute.trim()) e.rute = "Rute wajib diisi.";
  if (!form.tujuan.trim()) e.tujuan = "Tujuan kegiatan wajib diisi.";
  if (!form.kategoriUnit) e.kategoriUnit = "Kategori unit wajib dipilih.";
  if (!form.jenisUnit) e.jenisUnit = "Jenis unit wajib dipilih.";
  if (!form.nahkoda.trim()) e.nahkoda = "Operator wajib diisi.";

  if (!cekAngka(form.jumlahPersonel) || Number(form.jumlahPersonel) < 1) {
    e.jumlahPersonel = "Jumlah personel minimal 1.";
  }

  if (!form.bbmSebelum.trim()) e.bbmSebelum = "BBM sebelum wajib diisi.";
  else {
    const err = cekPersen(form.bbmSebelum, "BBM sebelum");
    if (err) e.bbmSebelum = err;
  }

  if (isArmadaLaut(form.kategoriUnit)) {
    if (!form.enduranceAwal.trim()) {
      e.enduranceAwal = "Endurance awal wajib diisi untuk armada laut.";
    } else if (!POLA_ENDURANCE.test(form.enduranceAwal)) {
      e.enduranceAwal = "Format harus HH:MM, contoh 80:30.";
    }
  } else if (form.kmSebelum && !cekAngka(form.kmSebelum)) {
    e.kmSebelum = "Kilometer awal harus berupa angka.";
  }

  return e;
}

/**
 * Validasi tahap pelengkapan — data yang baru bisa diisi setelah unit kembali.
 *
 * Inilah yang menentukan apakah tombol "Selesaikan" boleh ditekan: status baru
 * menjadi `Selesai` bila fungsi ini mengembalikan objek kosong.
 */
export function validasiTahapAkhir(form: FormLogbook): LogbookErrors {
  const e: LogbookErrors = {};
  const laut = isArmadaLaut(form.kategoriUnit);

  const jamKembali = cekJam(form.jamKembali, "Jam kepulangan");
  if (jamKembali) {
    e.jamKembali = jamKembali;
  } else if (form.jamBerangkat) {
    const [jh, jm] = form.jamBerangkat.split(":").map(Number);
    const [kh, km] = form.jamKembali.split(":").map(Number);
    if (kh * 60 + km <= jh * 60 + jm) {
      e.jamKembali = "Jam kembali harus setelah jam berangkat.";
    }
  }

  if (!form.bbmSesudah.trim()) {
    e.bbmSesudah = "BBM sesudah wajib diisi untuk menandai perjalanan selesai.";
  } else {
    const err = cekPersen(form.bbmSesudah, "BBM sesudah");
    if (err) {
      e.bbmSesudah = err;
    } else if (cekAngka(form.bbmSebelum)) {
      const sebelum = Number(form.bbmSebelum);
      const sesudah = Number(form.bbmSesudah);
      if (sesudah > sebelum) {
        e.bbmSesudah = "BBM sesudah tidak boleh lebih besar dari BBM sebelum.";
      }
    }
  }

  if (laut) {
    if (!form.enduranceAkhir.trim()) {
      e.enduranceAkhir = "Endurance akhir wajib diisi untuk menandai selesai.";
    } else if (!POLA_ENDURANCE.test(form.enduranceAkhir)) {
      e.enduranceAkhir = "Format harus HH:MM, contoh 73:00.";
    } else if (POLA_ENDURANCE.test(form.enduranceAwal)) {
      const awal = enduranceKeMenit(form.enduranceAwal)!;
      const akhir = enduranceKeMenit(form.enduranceAkhir)!;
      if (akhir > awal) {
        e.enduranceAkhir =
          "Endurance akhir tidak boleh lebih besar dari endurance awal.";
      }
    }
  } else {
    if (!form.kmSesudah.trim()) {
      e.kmSesudah = "Kilometer sesudah wajib diisi untuk menandai selesai.";
    } else if (!cekAngka(form.kmSesudah)) {
      e.kmSesudah = "Kilometer sesudah harus berupa angka.";
    } else if (cekAngka(form.kmSebelum) && Number(form.kmSesudah) < Number(form.kmSebelum)) {
      e.kmSesudah = "Kilometer sesudah tidak boleh lebih kecil dari kilometer awal.";
    }
  }

  return e;
}

/** Gabungan kedua tahap — dipakai untuk menentukan badge "belum lengkap". */
export function validasiLogbook(form: FormLogbook): LogbookErrors {
  return { ...validasiTahapAwal(form), ...validasiTahapAkhir(form) };
}

/**
 * Status penggunaan diturunkan dari data, bukan dipilih operator.
 *
 * - sudah kembali → `Selesai`
 * - sudah berangkat → `Sedang Digunakan`
 * - belum berangkat → `Menunggu Penggunaan`
 */
export function statusPenggunaanOtomatis(form: FormLogbook): StatusPenggunaan {
  if (!form.jamKembali.trim()) {
    return form.jamBerangkat.trim() ? "Sedang Digunakan" : "Menunggu Penggunaan";
  }
  return "Selesai";
}

/**
 * Tahap yang masih perlu dikerjakan pada sebuah catatan.
 * `null` berarti catatan sudah lengkap dan tidak perlu dibuka lagi.
 */
export function tahapYangTertunda(
  status: StatusPenggunaan
): TahapLogbook | null {
  if (status === "Selesai") return null;
  return status === "Menunggu Penggunaan" ? "Awal" : "Pelengkapan";
}

/**
 * Jarak tempuh untuk armada darat: selisih odometer dalam km.
 * Untuk armada laut dipakai {@link selisihEndurance} (satuan jam operasi).
 */
export function selisihKm(awal?: string, akhir?: string): number | null {
  if (!awal || !akhir || !cekAngka(awal) || !cekAngka(akhir)) return null;
  return Math.max(Number(akhir) - Number(awal), 0);
}

/** Nama field yang belum terisi pada tahap pelengkapan. */
export function fieldBelumLengkap(form: FormLogbook): string[] {
  const errors = validasiTahapAkhir(form);
  const label: Partial<Record<keyof FormLogbook, string>> = {
    jamKembali: "jam kembali",
    bbmSesudah: "BBM sesudah",
    enduranceAkhir: "endurance akhir",
    kmSesudah: "kilometer sesudah",
  };
  return Object.keys(errors)
    .map((k) => label[k as keyof FormLogbook])
    .filter((v): v is string => Boolean(v));
}

/** Buang tanda `%` supaya bisa divalidasi sebagai angka biasa. */
export function persenKeAngka(nilai: string): string {
  return nilai.replace("%", "").trim();
}

/** Tambahkan kembali `%` untuk disimpan, mis. "75" → "75%". */
export function angkaKePersen(nilai: string): string {
  const bersih = nilai.trim();
  return bersih === "" ? "" : `${bersih}%`;
}

/**
 * Ubah `LogbookPerjalanan` menjadi bentuk form (semua nilai jadi string).
 *
 * Dipakai tahap pelengkapan supaya operator membuka catatan yang sudah tersimpan
 * tanpa perlu mengetik ulang data keberangkatan. Persentase BBM dilepas tanda
 * `%`-nya agar bisa divalidasi sebagai angka biasa.
 */
export function logbookKeForm(logbook: LogbookPerjalanan): FormLogbook {
  return {
    tanggal: logbook.tanggal,
    jamBerangkat: logbook.jamBerangkat,
    jamKembali: logbook.jamKembali,
    rute: logbook.rute,
    tujuan: logbook.tujuan,
    kategoriUnit: logbook.kategoriUnit ?? "",
    jenisUnit: logbook.jenisUnit,
    nahkoda: logbook.nahkoda,
    jumlahPersonel: String(logbook.jumlahPersonel),
    bbmSebelum: persenKeAngka(logbook.bbmSebelum),
    bbmSesudah: persenKeAngka(logbook.bbmSesudah),
    enduranceAwal: logbook.enduranceAwal ?? "",
    enduranceAkhir: logbook.enduranceAkhir ?? "",
    kmSebelum: logbook.kmSebelum ?? "",
    kmSesudah: logbook.kmSesudah ?? "",
    catatan: logbook.catatan,
  };
}

// Helper Tanggal
// -----------------------------------------------------------------------------

/**
 * Ubah `Date` menjadi string "YYYY-MM-DD" berdasarkan waktu lokal.
 * Sengaja tidak memakai `toISOString()` karena hasilnya berbasis UTC sehingga
 * tanggal bisa bergeser satu hari untuk zona waktu di belakang UTC (mis. WIB).
 */
export function toISODate(date: Date): string {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${hari}`;
}

/** Tanggal hari ini dalam format "YYYY-MM-DD" (waktu lokal). */
export function todayISODate(now: Date = new Date()): string {
  return toISODate(now);
}

/** Apakah string berformat "YYYY-MM-DD" dan benar-benar tanggal yang ada di kalender. */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [tahun, bulan, hari] = value.split("-").map(Number);
  const date = new Date(tahun, bulan - 1, hari);
  return (
    date.getFullYear() === tahun &&
    date.getMonth() === bulan - 1 &&
    date.getDate() === hari
  );
}

// Mutasi Aset (mock — akan diganti API / Supabase)
// -----------------------------------------------------------------------------

/** Field aset yang dapat diisi dari form Tambah & Edit. */
export type InputAset = Pick<
  Aset,
  | "nama"
  | "kode"
  | "nup"
  | "kategori"
  | "status"
  | "lokasi"
  | "tanggalPenetapan"
  | "kondisi"
  | "penanggungJawab"
  | "keterangan"
>;

/** Kode aset sudah dipakai aset lain? `exceptId` dipakai saat edit. */
export function isKodeAsetTerpakai(kode: string, exceptId?: string): boolean {
  const needle = kode.trim().toLowerCase();
  return asetList.some(
    (a) => a.id !== exceptId && a.kode.trim().toLowerCase() === needle
  );
}

/** NUP sudah dipakai aset lain? `exceptId` dipakai saat edit. */
export function isNupAsetTerpakai(nup: string, exceptId?: string): boolean {
  return asetList.some((a) => a.id !== exceptId && a.nup === nup);
}

/** ID berikutnya untuk aset baru, mis. "ast-013". */
function nextAsetId(): string {
  const maks = asetList.reduce((acc, a) => {
    const nomor = Number(a.id.replace(/\D/g, ""));
    return Number.isFinite(nomor) ? Math.max(acc, nomor) : acc;
  }, 0);
  return `ast-${String(maks + 1).padStart(3, "0")}`;
}

/**
 * Tambah aset baru ke data mock. Otomatis membuat entri riwayat "Penetapan"
 * bertanggal sama dengan tanggal penetapan aset.
 *
 * TODO: ganti dengan INSERT ke tabel `aset`.
 */
export function tambahAset(input: InputAset): Aset {
  const aset: Aset = {
    ...input,
    id: nextAsetId(),
    gambar: "",
    riwayat: [
      {
        tanggal: input.tanggalPenetapan,
        aksi: "Penetapan",
        keterangan: `Aset ditetapkan sebagai BMN dengan kode ${input.kode}`,
        userId: input.penanggungJawab,
      },
    ],
  };
  asetList.unshift(aset);
  return aset;
}

/**
 * Perbarui data aset. `riwayatBaru` disisipkan di depan (riwayat tersusun dari
 * yang terbaru), dipakai form Edit bila tanggal penetapan atau status berubah.
 *
 * TODO: ganti dengan UPDATE ke tabel `aset`.
 */
export function updateAset(
  id: string,
  changes: Partial<InputAset>,
  riwayatBaru: RiwayatAset[] = []
): Aset | undefined {
  const aset = getAsetById(id);
  if (!aset) return undefined;
  Object.assign(aset, changes);
  if (riwayatBaru.length > 0) {
    aset.riwayat = [...riwayatBaru, ...aset.riwayat];
  }
  return aset;
}

/**
 * Ubah status aset sekaligus catat riwayatnya — dipakai aksi "Selesai
 * Digunakan" pada halaman detail. Aksi yang tercatat bisa disesuaikan.
 *
 * TODO: ganti dengan UPDATE ke tabel `aset` + INSERT ke `riwayat_aset`.
 */
export function ubahStatusAset(
  id: string,
  status: StatusAset,
  userId: string,
  keterangan: string,
  aksi: string = "Selesai Digunakan"
): Aset | undefined {
  const aset = getAsetById(id);
  if (!aset || aset.status === status) return aset;
  return updateAset(id, { status }, [
    { tanggal: todayISODate(), aksi, keterangan, userId },
  ]);
}

export const beritaAcaraList: BeritaAcara[] = [
  {
    id: "ba-001",
    tanggal: "2026-09-25",
    namaAset: "Tenda Medis Emergency 6x4",
    kodeAset: "BMN-MED-001",
    nomor: "",
    asetId: "ast-005",
    tiketId: "ews-001",
    pengajuId: "usr-002",
    pengajuNama: "Kauluddin",
    pengajuJabatan: "Pengelola BMN",
    pelapor: "Kauluddin",
    pelaporJabatan: "Pengelola BMN",
    tanggalBuat: "2026-09-25",
    tanggalUpdate: "2026-09-26",
    status: "Diserahkan",
    kendala: [
      {
        label: "Pin Tiang Tenda",
        merk: "Standar",
        jumlah: "1 pcs",
        keterangan: "Patah, perlu diganti",
        sifat: "Ringan",
      },
      {
        label: "Atap Tenda",
        merk: "Standar",
        jumlah: "1 set",
        keterangan: "Robek ± 30 cm, perlu jahit ulang",
        sifat: "Ringan",
      },
    ],
    uraian:
      "Pin tiang patah sebelah kiri, atap robek ± 30 cm sehingga tenda tidak layak didirikan di lapangan. Diusulkan ke tempat service untuk penggantian pin dan jahit ulang.",
    fotoBukti: [],
    keterangan: KETERANGAN_SERVICE_DEFAULT,
  },
  {
    id: "ba-002",
    tanggal: "2026-09-26",
    namaAset: "Peralatan Selam Regulator Scubapro",
    kodeAset: "BMN-SAR-003",
    nomor: "",
    asetId: "ast-011",
    tiketId: "ews-006",
    pengajuId: "usr-001",
    pengajuNama: "Medlyn R. Pagali",
    pengajuJabatan: "Pengelola BMN",
    pelapor: "Medlyn R. Pagali",
    pelaporJabatan: "Pengelola BMN",
    tanggalBuat: "2026-09-26",
    tanggalUpdate: "2026-09-26",
    status: "Diserahkan",
    kendala: [
      {
        label: "Regulator Scuba",
        merk: "Scubapro",
        jumlah: "1 set",
        keterangan: "Free-flow pada kedalaman 15 m, perlu ganti seal",
        sifat: "Berat",
      },
    ],
    uraian:
      "Regulator mengalami free-flow saat uji fungsi di kedalaman 15 meter. Regulator tidak boleh digunakan untuk penyelaman sebelum seal diganti dan diuji ulang.",
    fotoBukti: [],
    keterangan: KETERANGAN_SERVICE_DEFAULT,
  },
];

/** ID berita acara berikutnya, mis. "ba-003". */
function nextBeritaAcaraId(): string {
  const maks = beritaAcaraList.reduce((acc, ba) => {
    const nomor = Number(ba.id.replace(/\D/g, ""));
    return Number.isFinite(nomor) ? Math.max(acc, nomor) : acc;
  }, 0);
  return `ba-${String(maks + 1).padStart(3, "0")}`;
}

/**
 * Tambah berita acara baru (status "Draf").
 *
 * TODO: ganti dengan INSERT ke tabel `berita_acara`.
 */
export function tambahBeritaAcara(
  input: Omit<
    BeritaAcara,
    "id" | "status" | "tanggalBuat" | "tanggalUpdate"
  > & {
    pengajuId?: string;
    pengajuNama?: string;
    pengajuJabatan?: string;
    tiketId?: string;
    checklistId?: string;
  }
): BeritaAcara {
  const hariIni = todayISODate();
  const ba: BeritaAcara = {
    ...input,
    id: nextBeritaAcaraId(),
    status: "Draf",
    tanggalBuat: hariIni,
    tanggalUpdate: hariIni,
  };
  beritaAcaraList.unshift(ba);
  return ba;
}

/** Ambil satu berita acara berdasarkan ID. */
export function getBeritaAcaraById(id: string): BeritaAcara | undefined {
  return beritaAcaraList.find((b) => b.id === id);
}

/** Ambil berita acara berdasarkan tiket terkait (bila ada). */
export function getBeritaAcaraByTiketId(tiketId: string): BeritaAcara | undefined {
  return beritaAcaraList.find((b) => b.tiketId === tiketId);
}

/** Ambil daftar berita acara per aset. */
export function getBeritaAcaraByAsetId(asetId: string): BeritaAcara[] {
  return beritaAcaraList.filter((b) => b.asetId === asetId);
}

/**
 * Ubah status berita acara sekaligus catat keputusan. Dipakai alur
 * penyerahan PJ dan persetujuan/penolakan BMN.
 *
 * TODO: ganti dengan UPDATE ke tabel `berita_acara`.
 */
export function ubahStatusBeritaAcara(
  id: string,
  status: StatusBeritaAcara,
  extra: Partial<
    Pick<
      BeritaAcara,
      | "alasanPenolakan"
      | "keterangan"
      | "pengajuId"
      | "pengajuNama"
      | "pengajuJabatan"
      | "tiketId"
    >
  > = {}
): BeritaAcara | undefined {
  const ba = getBeritaAcaraById(id);
  if (!ba) return undefined;
  ba.status = status;
  ba.tanggalUpdate = todayISODate();
  if (extra.alasanPenolakan !== undefined)
    ba.alasanPenolakan = extra.alasanPenolakan;
  if (extra.keterangan !== undefined) ba.keterangan = extra.keterangan;
  if (extra.pengajuId !== undefined) ba.pengajuId = extra.pengajuId;
  if (extra.pengajuNama !== undefined) ba.pengajuNama = extra.pengajuNama;
  if (extra.pengajuJabatan !== undefined)
    ba.pengajuJabatan = extra.pengajuJabatan;
  if (extra.tiketId !== undefined) ba.tiketId = extra.tiketId;
  return ba;
}

/**
 * Perbarui isi berita acara (bagian yang diisi PJ): nomor, uraian, tabel
 * kendala, dan foto bukti. Dipakai saat form BA disimpan.
 *
 * TODO: ganti dengan UPDATE ke tabel `berita_acara`.
 */
export function ubahIsiBeritaAcara(
  id: string,
  isi: Partial<
    Pick<BeritaAcara, "nomor" | "uraian" | "kendala" | "fotoBukti" | "namaAset" | "kodeAset">
  >
): BeritaAcara | undefined {
  const ba = getBeritaAcaraById(id);
  if (!ba) return undefined;
  if (isi.nomor !== undefined) ba.nomor = isi.nomor;
  if (isi.uraian !== undefined) ba.uraian = isi.uraian;
  if (isi.kendala !== undefined) ba.kendala = isi.kendala;
  if (isi.fotoBukti !== undefined) ba.fotoBukti = isi.fotoBukti;
  if (isi.namaAset !== undefined) ba.namaAset = isi.namaAset;
  if (isi.kodeAset !== undefined) ba.kodeAset = isi.kodeAset;
  ba.tanggalUpdate = todayISODate();
  return ba;
}

/**
 * Hitung status aset yang disarankan dari hasil checklist:
 * ada item rusak berat → "Rusak Berat"; hanya rusak ringan → "Rusak Ringan".
 */
export function hitungStatusAsetDariChecklist(
  items: ItemHasilPengecekan[]
): "Rusak Berat" | "Rusak Ringan" | null {
  if (items.some((i) => i.kondisi === "Rusak Berat")) return "Rusak Berat";
  if (items.some((i) => i.kondisi === "Rusak Ringan")) return "Rusak Ringan";
  return null;
}

/** Cari aset berdasarkan nama unit yang ditulis pada form checklist. */
export function cariAsetDmUnit(unit: string): Aset | undefined {
  const needle = unit.trim().toLowerCase();
  if (!needle) return undefined;
  return asetList.find((a) => {
    const nama = a.nama.toLowerCase();
    const kode = a.kode.toLowerCase();
    // Cocokkan nama atau kode aset, atau nama yang mengandung frasa unit
    return (
      nama === needle ||
      kode === needle ||
      nama.includes(needle) ||
      needle.includes(nama)
    );
  });
}

/** Item-item yang berstatus rusak pada sebuah checklist — siap jadi baris "Informasi Kendala". */
export function ekstrakItemRusak(
  items: ItemHasilPengecekan[]
): BarisKendala[] {
  return items
    .filter((i) => i.kondisi === "Rusak Ringan" || i.kondisi === "Rusak Berat")
    .map((i) => ({
      label: i.label,
      merk: "Standar",
      jumlah: "1 set",
      keterangan: i.keterangan,
      sifat: i.kondisi === "Rusak Berat" ? ("Berat" as const) : ("Ringan" as const),
    }));
}

/** Tingkat keparahan tiket otomatis: ada rusak berat → Tinggi, jika tidak → Sedang. */
export function hitungTingkatKeparahan(
  items: ItemHasilPengecekan[]
): TingkatKeparahan {
  return items.some((i) => i.kondisi === "Rusak Berat")
    ? "Tinggi"
    : "Sedang";
}
