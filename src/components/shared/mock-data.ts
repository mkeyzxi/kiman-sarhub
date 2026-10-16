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

export interface RiwayatAset {
  tanggal: string;
  aksi: string;
  keterangan: string;
  userId: string;
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
  tanggalPerkiraan: string;
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-09-30",
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-10-05",
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-10-02",
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-09-29",
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-09-28",
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
    tanggalPerkiraan: "2026-09-28",
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
  // ─── CHECKLIST HARIAN ───────────────────────────────────────────────────────
  {
    id: "chk-001",
    nama: "Checklist Harian - Perahu Karet",
    kategori: "Peralatan SAR",
    periode: "Harian",
    jenisArmada: "RIB",
    sumber: "Ceklist Perawatan RIB",
    items: [
      { id: "chk-001-01", label: "Hull tidak ada bocor atau kerusakan", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "chk-001-02", label: "Pompa angin berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-001-03", label: "Semua oar/paddles lengkap dan utuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-001-04", label: "Tali tambat (rope) tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-001-05", label: "Jacket pelampung cadangan sesuai kapasitas", wajib: false, kondisi: "Baik", keterangan: "" },
      { id: "chk-001-06", label: "Kap alat (tool kit) di dalam perahu", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
  },
  {
    id: "chk-002",
    nama: "Checklist Harian - Kendaraan Ransel",
    kategori: "Mobil",
    periode: "Harian",
    jenisArmada: "Mobil",
    sumber: "Logbook Sarana Darat",
    items: [
      { id: "chk-002-01", label: "Mesin menyala dengan normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-002-02", label: "Bahan bakar penuh minimal 5 liter", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-002-03", label: "Rem depan dan belakang berfungsi baik", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-002-04", label: "Lampu utama dan sein menyala", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-002-05", label: "Ban dalam kondisi baik dan tekanan cukup", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-002-06", label: "Surat kendaraan dan SIM pengemudi siap", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-002-07", label: "Peralatan darurat (P3K, segitiga, dongkrak)", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
  },
  {
    id: "chk-003",
    nama: "Checklist Harian - Peralatan Medis",
    kategori: "Medis",
    periode: "Harian",
    jenisArmada: "Lainnya",
    items: [
      { id: "chk-003-01", label: "Defibrillator baterai penuh dan electrode siap", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-003-02", label: "P3K lengkap sesuai daftar standar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-003-03", label: "Tenda medis dalam kondisi baik", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-003-04", label: "Oksigen tabung penuh dan regulator normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-003-05", label: "Obat-obatan tidak kadaluwarsa", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-003-06", label: "Stretcher dan backboard siap pakai", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },
  {
    id: "chk-004",
    nama: "Checklist Harian - Peralatan Komunikasi",
    kategori: "Komunikasi",
    periode: "Harian",
    jenisArmada: "Lainnya",
    items: [
      { id: "chk-004-01", label: "Radio HT baterai penuh dan berfungsi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-004-02", label: "Baterai cadangan tersedia minimal 2 buah", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-004-03", label: "GPS terkoneksi satelit dan akurat", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-004-04", label: "Telepon satelit (jika ada) teraktivasi", wajib: false, kondisi: "Baik", keterangan: "" },
      { id: "chk-004-05", label: "Daftar kontak darurat ter-update", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },
  // ─── CHECKLIST MINGGUAN ─────────────────────────────────────────────────────
  {
    id: "chk-005",
    nama: "Checklist Mingguan - Kendaraan",
    kategori: "Mobil",
    periode: "Mingguan",
    jenisArmada: "Mobil",
    sumber: "Ceklist Perawatan Kendaraan",
    items: [
      { id: "chk-005-01", label: "Kerja AC optimal", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-02", label: "Kerja rem (rem parkir & rem kaki)", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-03", label: "Kerja kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-04", label: "Kerja pedal gas", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-05", label: "Kerja kaki-kaki (suspensi)", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-06", label: "Kerja sistem 4WD", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-07", label: "Kaca depan tidak retak/pecah", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-08", label: "Spion luar lengkap dan berfungsi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-09", label: "Floodlight system berfungsi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-10", label: "Lampu-lampu semua menyala", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-11", label: "Level cairan pendingin radiator", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-12", label: "APAR masih berlaku", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-13", label: "Plat nopol jelas terbaca", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-14", label: "Ban cadangan tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-15", label: "Kebersihan kendaraan", wajib: false, kondisi: "Baik", keterangan: "" },
      { id: "chk-005-16", label: "Jok/tempat duduk dalam kondisi baik", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
  },
  // ─── CHECKLIST BULANAN ──────────────────────────────────────────────────────
  {
    id: "chk-006",
    nama: "Checklist Bulanan - Kendaraan",
    kategori: "Mobil",
    periode: "Bulanan",
    jenisArmada: "Mobil",
    sumber: "Ceklist Perawatan Kendaraan",
    items: [
      { id: "chk-006-01", label: "Winch berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE ARMADA LENGKAP
  // Katalog item diambil dari form fisik kantor sesuai dokumentasi_utuh.md
  // Bagian 5. Semua item wajib diisi sebelum submit (Validasi V1).
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── MOTOR TRAIL — HARIAN (20 item) ─────────────────────────────────────────
  {
    id: "arm-motor-harian",
    nama: "Ceklist Perawatan Motor Trail (Harian)",
    kategori: "Motor",
    periode: "Harian",
    jenisArmada: "Motor",
    sumber: "Ceklist Motor Trail B 3184 PKQ",
    items: [
      // Bagian 1 — Pemeriksaan Utama
      { id: "arm-motor-harian-01", label: "Level Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-02", label: "Level Oli Mesin", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-03", label: "Kondisi Ban", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-04", label: "Tekanan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-05", label: "Keausan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-06", label: "Rantai Penggerak", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-07", label: "Baut Mur dan Pengencangan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-08", label: "Stang (Bergerak Lancar)", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-09", label: "Level Minyak Rem", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-10", label: "Kampas Rem", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-11", label: "Kerja Gas", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-12", label: "Tuas Kopling", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-13", label: "Klakson", wajib: true, kondisi: "Baik", keterangan: "" },
      // Bagian 2 — Kelistrikan & Perlengkapan
      { id: "arm-motor-harian-14", label: "Lampu Depan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-15", label: "Lampu Belakang / Rem", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-16", label: "Lampu Sein", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-17", label: "Engine Stop Switch", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-motor-harian-18", label: "Standar Samping", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-19", label: "Indikator Spedometer", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-motor-harian-20", label: "Kaca Spion", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },

  // ─── MOBIL — HARIAN (36 item) ──────────────────────────────────────────────
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
      { id: "arm-mobil-harian-20", label: "Level Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-21", label: "Power Window / Door Lock", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-22", label: "Kunci Roda & Toolkit", wajib: true, kondisi: "Baik", keterangan: "" },
      // C. Keliling Kendaraan
      { id: "arm-mobil-harian-23", label: "Lampu-Lampu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-24", label: "Pegas Suspensi / Kaki-Kaki / Per Daun", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-25", label: "Kebocoran / Tetesan Fluid", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-26", label: "Kondisi Kaca-Kaca", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-27", label: "Wiper", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-28", label: "Saringan Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-29", label: "Rolling Door Compartment", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-30", label: "Engsel Pintu-Pintu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-31", label: "Kunci Pintu-Pintu", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-32", label: "Towing", wajib: true, kondisi: "Baik", keterangan: "" },
      // D. Roda dan Ban
      { id: "arm-mobil-harian-33", label: "Tekanan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-34", label: "Tapak dan Dinding Ban", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-mobil-harian-35", label: "Keausan Ban", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-mobil-harian-36", label: "Pemasangan Velg", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
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
      { id: "arm-mobil-mingguan-09", label: "Flooding Light System", wajib: true, kondisi: "Baik", keterangan: "" },
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

  // ─── RIB — PEMELIHARAAN (17 item, RIB 01 & RIB 02 identik) ────────────────
  {
    id: "arm-rib-pemeliharaan",
    nama: "Ceklist Pemeliharaan RIB",
    kategori: "Kapal",
    periode: "Harian",
    jenisArmada: "RIB",
    sumber: "Jurnal RIB 01 & 02",
    items: [
      { id: "arm-rib-01", label: "Tali Tros", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-02", label: "Lunas", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-03", label: "Ban Pelampung", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-04", label: "Deck", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-05", label: "Transom (Stand Mesin)", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-06", label: "Starting Engine", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-07", label: "Kap Mesin Kanan", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-08", label: "Kap Mesin Kiri", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-09", label: "Karburator", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-10", label: "Selang BBM", wajib: true, kondisi: "Baik", keterangan: "", isKritis: true },
      { id: "arm-rib-11", label: "Busi", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-12", label: "Dinamo Stater", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-13", label: "Dinamo Strom", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-14", label: "Hydraulic Mesin", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-15", label: "Aki / Baterai", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-16", label: "GPS Furuno", wajib: true, kondisi: "Baik", keterangan: "" },
      { id: "arm-rib-17", label: "GPS Stracking", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },

  // ─── KN SAR — HARIAN (disisip 4 item utama) ─────────────────────────────────
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
];

/**
 * Kelompokkan item template berdasarkan kategori/bagian yang relevan.
 * Pemetaan mengikuti urutan item pada form fisik (dokumentasi_utuh.md Bagian 5).
 * `upto` adalah indeks item terakhir (1-based) pada bagian tersebut.
 */
const BAGIAN_TEMPLATE: Record<string, ReadonlyArray<{ nama: string; upto: number }>> = {
  "arm-motor-harian": [
    { nama: "Bagian 1 — Pemeriksaan Utama", upto: 13 },
    { nama: "Bagian 2 — Kelistrikan & Perlengkapan", upto: 20 },
  ],
  "arm-mobil-harian": [
    { nama: "A. Menjungkitkan Kabin", upto: 4 },
    { nama: "B. Dalam Kabin", upto: 22 },
    { nama: "C. Keliling Kendaraan", upto: 32 },
    { nama: "D. Roda dan Ban", upto: 36 },
  ],
  "arm-mobil-mingguan": [
    { nama: "Performa / Fungsi Sistem", upto: 6 },
    { nama: "Keliling Kendaraan (Mingguan)", upto: 17 },
  ],
  "arm-rib-pemeliharaan": [{ nama: "Pemeliharaan RIB", upto: 17 }],
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
    detail: "Jurnal Siaga Rutin 8 Oktober 2026 diperbarui — Shift Pagi",
  },
  {
    id: "log-002",
    userId: "usr-006",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist RIB 12M",
    tanggal: "2026-10-08T08:30:00",
    detail: "Checklist RIB 12 M jam 08.00 disetor — semua item OK",
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
    detail: "Checklist harian peralatan medis disetor — P3K lengkap, AED baterai 100%",
  },
  {
    id: "log-005",
    userId: "usr-005",
    aksi: "ABSENSI_SIAGA",
    target: "Absensi Shift",
    tanggal: "2026-10-07T07:00:00",
    detail: "Absensi shift pagi — 6 personel hadir, 0 tidak hadir",
  },
  {
    id: "log-006",
    userId: "usr-006",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist Perahu Karet",
    tanggal: "2026-10-07T08:15:00",
    detail: "Checklist harian Perahu Karet Zodiac MK III — hull OK, pompa OK",
  },
  {
    id: "log-007",
    userId: "usr-001",
    aksi: "UPDATE_LOGBOOK",
    target: "Logbook Mobil",
    tanggal: "2026-10-06T10:00:00",
    detail: "Logbook Toyota Hilux — kembali dari bengkel, status Siaga",
  },
  {
    id: "log-008",
    userId: "usr-005",
    aksi: "UPDATE_JURNAL_SIAGA",
    target: "Jurnal Siaga Rutin",
    tanggal: "2026-10-06T17:00:00",
    detail: "Jurnal Siaga Rutin 6 Oktober 2026 — Shift Sore, kondisi normal",
  },
  {
    id: "log-009",
    userId: "usr-007",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist Komunikasi",
    tanggal: "2026-10-05T09:00:00",
    detail: "Checklist komunikasi — Radio HT OK, GPS Garmin terkoneksi satelit",
  },
  {
    id: "log-010",
    userId: "usr-006",
    aksi: "PEMANASAN_RIB",
    target: "RIB 9M",
    tanggal: "2026-10-05T07:30:00",
    detail: "Pemanasan mesin RIB 9M — RPM stabil, oli cukup, BBM 80%",
  },
  {
    id: "log-011",
    userId: "usr-008",
    aksi: "ABSENSI_SIAGA",
    target: "Absensi Shift",
    tanggal: "2026-10-04T07:00:00",
    detail: "Absensi shift pagi — 5 personel hadir, 1 cuti",
  },
  {
    id: "log-012",
    userId: "usr-005",
    aksi: "SETOR_CHECKLIST",
    target: "Checklist Selam",
    tanggal: "2026-10-04T08:00:00",
    detail: "Inspeksi peralatan selam — tabung 200 bar, regulator OK",
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

export interface LogbookPerjalanan {
  id: string;
  tanggal: string;
  jamBerangkat: string;
  jamKembali: string;
  rute: string;
  tujuan: string;
  /** Kategori induk: Kapal, RIB, Mobil, Motor */
  kategoriUnit?: "Kapal" | "RIB" | "Mobil" | "Motor";
  jenisUnit: string;
  /** Nahkoda (laut) atau Pengemudi (darat) */
  nahkoda: string;
  jumlahPersonel: number;
  bbmSebelum: string;
  bbmSesudah: string;
  /** Kilometer — khusus kendaraan darat */
  kmSebelum?: string;
  kmSesudah?: string;
  status: "Selesai" | "Berlangsung" | "Dijadwalkan";
  catatan: string;
}

export const logbookPerjalananList: LogbookPerjalanan[] = [
  {
    id: "lp-01",
    tanggal: "2026-10-08",
    jamBerangkat: "08:00",
    jamKembali: "10:30",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    jenisUnit: "RIB 9 M",
    nahkoda: "Siti Nurhaliza",
    jumlahPersonel: 4,
    bbmSebelum: "90%",
    bbmSesudah: "75%",
    status: "Selesai",
    catatan: "Kondisi laut normal, tidak ada insiden",
  },
  {
    id: "lp-02",
    tanggal: "2026-10-08",
    jamBerangkat: "11:00",
    jamKembali: "13:00",
    rute: "Perairan Mamuju - Pantai Karampuang",
    tujuan: "Sosialisasi SAR",
    jenisUnit: "RIB 12 M",
    nahkoda: "Ahmad Fauzi",
    jumlahPersonel: 5,
    bbmSebelum: "85%",
    bbmSesudah: "65%",
    status: "Selesai",
    catatan: "Sosialisasi keselamatan pantai kepada nelayan",
  },
  {
    id: "lp-03",
    tanggal: "2026-10-07",
    jamBerangkat: "09:00",
    jamKembali: "12:00",
    rute: "Dermaga Mamuju - Perairan Binanga",
    tujuan: "Operasi evakuasi",
    jenisUnit: "RIB 9 M",
    nahkoda: "Dewi Lestari",
    jumlahPersonel: 6,
    bbmSebelum: "95%",
    bbmSesudah: "60%",
    status: "Selesai",
    catatan: "Evakuasi korban tenggelam, 2 orang selamat",
  },
  {
    id: "lp-04",
    tanggal: "2026-10-07",
    jamBerangkat: "14:00",
    jamKembali: "16:00",
    rute: "Perairan Mamuju - Pos Pantai",
    tujuan: "Patroli pantai",
    jenisUnit: "RIB 12 M",
    nahkoda: "Budi Santoso",
    jumlahPersonel: 3,
    bbmSebelum: "80%",
    bbmSesudah: "70%",
    status: "Selesai",
    catatan: "Pantai ramai pengunjung, kondisi aman",
  },
  {
    id: "lp-05",
    tanggal: "2026-10-06",
    jamBerangkat: "08:30",
    jamKembali: "11:30",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Latihan SAR",
    jenisUnit: "RIB 9 M",
    nahkoda: "Medlyn R. Pagali",
    jumlahPersonel: 8,
    bbmSebelum: "100%",
    bbmSesudah: "70%",
    status: "Selesai",
    catatan: "Latihan teknik penyelamatan korban di air",
  },
  {
    id: "lp-06",
    tanggal: "2026-10-09",
    jamBerangkat: "08:00",
    jamKembali: "",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    jenisUnit: "RIB 12 M",
    nahkoda: "Kauluddin",
    jumlahPersonel: 4,
    bbmSebelum: "88%",
    bbmSesudah: "",
    status: "Berlangsung",
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
    status: "Dijadwalkan",
    catatan: "Dijadwalkan untuk shift sore",
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
    status: "Berlangsung",
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
  pemeriksa: string;
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
  {
    id: "chk-001",
    tanggal: "2026-10-08",
    unit: "Perahu Karet Zodiac (RIB 9 M)",
    jenisUnit: "Kapal",
    templateId: "chk-001",
    pemeriksa: "Siti Nurhaliza",
    status: "Lengkap",
    itemChecked: 6,
    itemTotal: 6,
    items: [
      { label: "Hull tidak ada bocor atau kerusakan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Pompa angin berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Semua oar/paddles lengkap dan utuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tali tambat (rope) tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Jacket pelampung cadangan sesuai kapasitas", wajib: false, kondisi: "Baik", keterangan: "" },
      { label: "Kap alat (tool kit) di dalam perahu", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Semua item kondisi baik, siap operasional",
  },
  {
    id: "chk-002",
    tanggal: "2026-10-08",
    unit: "Kendaraan Ransel Toyota Hilux (DA 1234 SAR)",
    jenisUnit: "Mobil",
    templateId: "chk-002",
    pemeriksa: "Ahmad Fauzi",
    status: "Lengkap",
    itemChecked: 7,
    itemTotal: 7,
    items: [
      { label: "Mesin menyala dengan normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Bahan bakar penuh minimal 5 liter", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Rem depan dan belakang berfungsi baik", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lampu utama dan sein menyala", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Ban dalam kondisi baik dan tekanan cukup", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Surat kendaraan dan SIM pengemudi siap", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Peralatan darurat (P3K, segitiga, dongkrak)", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Kendaraan siap operasional, semua sistem normal",
  },
  {
    id: "chk-003",
    tanggal: "2026-10-08",
    unit: "Perahu Karet Zodiac (RIB 9 M)",
    jenisUnit: "Perahu",
    templateId: "chk-001",
    pemeriksa: "Dewi Lestari",
    status: "Lengkap",
    itemChecked: 6,
    itemTotal: 6,
    items: [
      { label: "Hull tidak ada bocor atau kerusakan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Pompa angin berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Semua oar/paddles lengkap dan utuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tali tambat (rope) tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Jacket pelampung cadangan sesuai kapasitas", wajib: false, kondisi: "Baik", keterangan: "" },
      { label: "Kap alat (tool kit) di dalam perahu", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Semua item tercentang, siap digunakan",
  },
  {
    id: "chk-004",
    tanggal: "2026-10-08",
    unit: "Perahu Karet Zodiac (RIB 12 M)",
    jenisUnit: "Perahu",
    templateId: "chk-001",
    pemeriksa: "Budi Santoso",
    status: "Lengkap",
    itemChecked: 6,
    itemTotal: 6,
    items: [
      { label: "Hull tidak ada bocor atau kerusakan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Pompa angin berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Semua oar/paddles lengkap dan utuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tali tambat (rope) tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Jacket pelampung cadangan sesuai kapasitas", wajib: false, kondisi: "Baik", keterangan: "" },
      { label: "Kap alat (tool kit) di dalam perahu", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Pemeriksaan rutin, semua baik",
  },
  {
    id: "chk-005",
    tanggal: "2026-10-07",
    unit: "Sepeda Motor Honda CRF150L",
    jenisUnit: "Motor",
    templateId: "chk-002",
    pemeriksa: "Medlyn R. Pagali",
    status: "Belum Lengkap",
    itemChecked: 4,
    itemTotal: 7,
    items: [
      { label: "Mesin menyala dengan normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Bahan bakar penuh minimal 5 liter", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Rem depan dan belakang berfungsi baik", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lampu utama dan sein menyala", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Ban dalam kondisi baik dan tekanan cukup", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
      { label: "Surat kendaraan dan SIM pengemudi siap", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
      { label: "Peralatan darurat (P3K, segitiga, dongkrak)", wajib: false, kondisi: "Belum Diperiksa", keterangan: "" },
    ],
    catatan: "Tekanan ban depan perlu pengecekan ulang",
  },
  {
    id: "chk-006",
    tanggal: "2026-10-07",
    unit: "Perahu Karet Zodiac (RIB 12 M)",
    jenisUnit: "Perahu",
    templateId: "chk-001",
    pemeriksa: "Kauluddin",
    status: "Lengkap",
    itemChecked: 6,
    itemTotal: 6,
    items: [
      { label: "Hull tidak ada bocor atau kerusakan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Pompa angin berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Semua oar/paddles lengkap dan utuh", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Tali tambat (rope) tersedia", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Jacket pelampung cadangan sesuai kapasitas", wajib: false, kondisi: "Baik", keterangan: "" },
      { label: "Kap alat (tool kit) di dalam perahu", wajib: false, kondisi: "Baik", keterangan: "" },
    ],
    catatan: "Unit siap untuk operasi besok",
  },

  // ─── CHECKLIST ARMADA DARI FORM FISIK ───────────────────────────────────────

  {
    id: "arm-001",
    tanggal: "2026-10-10",
    unit: "Rescue Motorcycle Honda CRF150L (B 3184 PKQ)",
    jenisUnit: "Motor",
    templateId: "arm-motor-harian",
    pemeriksa: "Medlyn R. Pagali",
    status: "Belum Lengkap",
    itemChecked: 18,
    itemTotal: 20,
    items: [
      { label: "Level Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
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
    itemChecked: 33,
    itemTotal: 36,
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
      { label: "Level Bahan Bakar", wajib: true, kondisi: "Baik", keterangan: "" },
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
    itemChecked: 16,
    itemTotal: 17,
    items: [
      { label: "Tali Tros", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Lunas", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Ban Pelampung", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Deck", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Transom (Stand Mesin)", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Starting Engine", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kap Mesin Kanan", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Kap Mesin Kiri", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Karburator", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Selang BBM", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Busi", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Dinamo Stater", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Dinamo Strom", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Hydraulic Mesin", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "Aki / Baterai", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "GPS Furuno", wajib: true, kondisi: "Baik", keterangan: "" },
      { label: "GPS Stracking", wajib: true, kondisi: "Belum Diperiksa", keterangan: "" },
    ],
    catatan: "GPS Stracking belum diperiksa, perlu cek kelengkapan perangkat",
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
