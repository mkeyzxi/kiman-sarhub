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
  | "Peralatan SAR"
  | "Komunikasi"
  | "Medis"
  | "Dokumentasi";

export type StatusAset = "Siaga" | "Operasi" | "Dipinjam" | "Rusak" | "Maintenance" | "Tidak Siap";
export type KondisiAset = "Baik" | "Rusak Ringan" | "Rusak Berat";
export type KondisiItem = "Baik" | "Rusak Ringan" | "Rusak Berat";

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
  kategori: KategoriAset;
  status: StatusAset;
  lokasi: string;
  tanggalPerkiraan: string;
  gambar: string;
  kondisi: KondisiAset;
  penanggungJawab: string;
  riwayat: RiwayatAset[];
}

export const asetList: Aset[] = [
  {
    id: "ast-001",
    nama: "Perahu Karet Zodiac MK III",
    kode: "BMN-SAR-001",
    kategori: "Peralatan SAR",
    status: "Siaga",
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
    kategori: "Peralatan SAR",
    status: "Siaga",
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
    kategori: "Komunikasi",
    status: "Dipinjam",
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
    kategori: "Komunikasi",
    status: "Siaga",
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
    kategori: "Medis",
    status: "Rusak",
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
    kategori: "Medis",
    status: "Siaga",
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
    kategori: "Mobil",
    status: "Maintenance",
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
    kategori: "Motor",
    status: "Siaga",
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
    kategori: "Dokumentasi",
    status: "Dipinjam",
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
    kategori: "Dokumentasi",
    status: "Siaga",
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
    kategori: "Peralatan SAR",
    status: "Siaga",
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
    kategori: "Peralatan SAR",
    status: "Siaga",
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
}

export interface ChecklistTemplate {
  id: string;
  nama: string;
  kategori: KategoriAset;
  periode: "Harian" | "Mingguan" | "Bulanan";
  items: ChecklistItem[];
}

export const checklistTemplates: ChecklistTemplate[] = [
  // ─── CHECKLIST HARIAN ───────────────────────────────────────────────────────
  {
    id: "chk-001",
    nama: "Checklist Harian - Perahu Karet",
    kategori: "Peralatan SAR",
    periode: "Harian",
    items: [
      { id: "chk-001-01", label: "Hull tidak ada bocor atau kerusakan", wajib: true, kondisi: "Baik", keterangan: "" },
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
    items: [
      { id: "chk-006-01", label: "Winch berfungsi normal", wajib: true, kondisi: "Baik", keterangan: "" },
    ],
  },
];

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
  siaga: number;
  dipinjam: number;
  rusak: number;
  maintenance: number;
  readinessIndex: number;
  kesiapanPerKategori: {
    kategori: KategoriAset;
    total: number;
    siaga: number;
    persentase: number;
  }[];
}

export const readinessStats: ReadinessStats = {
  totalAset: 12,
  siaga: 7,
  dipinjam: 2,
  rusak: 2,
  maintenance: 1,
  readinessIndex: 58.3,
  kesiapanPerKategori: [
    { kategori: "Mobil", total: 1, siaga: 1, persentase: 100.0 },
    { kategori: "Motor", total: 1, siaga: 0, persentase: 0.0 },
    { kategori: "Peralatan SAR", total: 4, siaga: 4, persentase: 100.0 },
    { kategori: "Komunikasi", total: 2, siaga: 1, persentase: 50.0 },
    { kategori: "Medis", total: 2, siaga: 1, persentase: 50.0 },
    { kategori: "Dokumentasi", total: 2, siaga: 1, persentase: 50.0 },
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
// Helper Functions
// -----------------------------------------------------------------------------

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
