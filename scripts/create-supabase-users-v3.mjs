/**
 * Script v3.2: Membuat user Supabase via Admin API + cleanup
 *
 * Jalankan dengan:
 *   node scripts/create-supabase-users-v3.mjs               (dry-run: tampilkan saja)
 *   node scripts/create-supabase-users-v3.mjs --apply       (hapus data lama + buat baru)
 *   node scripts/create-supabase-users-v3.mjs --apply --skip-cleanup
 *      (buat user baru TANPA hapus data lama; user existing dengan NIP sama dilewati)
 *
 * Script memuat kredensial dari `.env` (Node >= 20.12):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Perubahan:
 *   1. Login sekarang berbasis NIP → email identitas di auth.users = {nip}@basarnas.ac.id
 *   2. Validasi format NIP 16-18 digit + cek NIP duplikat
 *   3. `app_metadata` di-fill saat create (untuk performa login 0 RTT)
 *   4. `user_metadata` menyimpan profil tambahan, termasuk `kendaraan`
 *   5. Flag --dry-run (default), --apply, --skip-cleanup
 *   6. Data: 5 non-operator + 19 operator lapangan + 82 operator tambahan
 *      + 2 operator existing tanpa PIC + 5 akun kantor (total 113 user)
 *   7. `kendaraan` adalah referensi penugasan di script; public.users belum
 *      memiliki kolom kendaraan
 */

import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";

// Muat .env jika ada; kalau tidak ada, pakai environment variable yang sudah diset.
try {
  loadEnvFile();
} catch {
  // Abaikan — nanti dicek apakah SUPABASE_SERVICE_ROLE_KEY tersedia.
}

// Konfigurasi Supabase
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://yzswezcgttegsrqisrfq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY belum diset. Isi .env atau jalankan dengan --env-file=.env"
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const SKIP_CLEANUP = process.argv.includes("--skip-cleanup");
const DRY_RUN = !APPLY;

if (DRY_RUN) {
  console.log("MODE: DRY-RUN (hanya tampilkan yang akan dilakukan, TIDAK menulis)\n");
  console.log("Jalankan dengan --apply untuk eksekusi nyata.\n");
}

// Buat client dengan service_role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// DATA USER
//
// Catatan:
//  - email TIDAK perlu di-fill: akan di-generate otomatis dari NIP.
//    Tapi Anda boleh menambah `email` per-user kalau mau set kontak.
//  - `aktif: false` = soft delete; `password_changed: false` = password
//    masih default (admin IT harus minta user ganti).
//  - `kendaraan` = label operasional penanggung jawab kendaraan.
//    Satu orang bisa bertanggung jawab atas lebih dari satu kendaraan.
//    Data ini masih berupa referensi di script; public.users belum
//    memiliki kolom kendaraan.
// ============================================================

const DEFAULT_PASSWORD = "password123";

const nonOperatorUsers = [
  {
    nip: "198208042009121003",
    nama: "Mahmud Afandi",
    role: "KAKANSAR",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199810212022032001",
    nama: "Medline",
    role: "PENGELOLA_BMN",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "200006042025061006",
    nama: "Oky Juneva Marsel",
    role: "ADMIN_IT",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198503312008121000",
    nama: "ZULKIFLI S.I.P.",
    role: "PENGELOLA_BMN",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    // Test account (nonaktif) — dipertahankan dari kondisi live
    nip: "1111111111111111",
    nama: "Muhammad Makbul N",
    role: "PENGELOLA_BMN",
    password: DEFAULT_PASSWORD,
    aktif: false,
    password_changed: false,
  },
];

// Akun kantor: role AKUNTOR — hanya checklist perawatan harian kendaraan,
// tidak untuk bulanan dan tidak untuk mingguan. Semua kendaraan yang punya
// template harian. NIP sementara, bisa diganti lewat halaman admin.
const akunKantorUsers = [
  {
    // NIP sementara — ganti lewat halaman admin atau update script ini
    nip: "1000000000000001",
    nama: "Kantor SAR Mamuju",
    role: "AKUNTOR",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "1000000000000002",
    nama: "Pos SAR Majene",
    role: "AKUNTOR",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "1000000000000003",
    nama: "USS Polewali Mandar",
    role: "AKUNTOR",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "1000000000000004",
    nama: "USS Pasangkayu",
    role: "AKUNTOR",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "1000000000000005",
    nama: "USS Mamasa",
    role: "AKUNTOR",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
];

// Operator lapangan yang menjadi penanggung jawab kendaraan.
// Urutan mengikuti daftar PIC kendaraan. Hasril muncul dua kali di daftar
// sumber, tetapi digabung menjadi satu user dengan dua kendaraan.
//
// `kendaraan` = label referensi operasional yang ditampilkan di UI.
// `penempatan`= lokasi/penempatan saat ini (Kantor / Kapal / Majene / Polman / Pasangkayu / Mamasa).
// Data ini disimpan di auth user_metadata + public.users (kalau kolom tersedia).
const operatorLapangan = [
  // ── Kantor ────────────────────────────────────────────────────────────────────
  {
    nip: "198802052007121001",
    nama: "Abd. Malik",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Kendaraan Umum"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199806052022031001",
    nama: "Muhammad Adiaksa",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Rescue Truck 01 — DC 8982"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199811182022031001",
    nama: "Agan Kalana",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Peralatan Gudang"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200004152022031002",
    nama: "Ibnu Anjaya",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["D-Max Double Cabin 02 — DC 8978"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200206132025061001",
    nama: "Muh. Abduh Yanis",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Truck Compartment — DC 8981"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200305132025061001",
    nama: "Calvin Datundelang",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Trail 04 — B 3184 PKQ"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199807192025211027",
    nama: "Wahyudi",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Rescue Truck 02 — DC 8977"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199610042025211053",
    nama: "Muhammad Fajrin S.Y.",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Rescue Carrier — DC 1802"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200409052025061001",
    nama: "Sulaeman Mustamin",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["Trail 02 — DC 3481"],
    penempatan: "Kantor",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  // ── Kapal ─────────────────────────────────────────────────────────────────────
  {
    nip: "199709262022031001",
    nama: "Fajar Farial, A.Md.Tra",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["KN SAR Parikesit"],
    penempatan: "Kapal",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "198102142005021001",
    nama: "Ardiansyah",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["RBB"],
    penempatan: "Kapal",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  // ── Majene ────────────────────────────────────────────────────────────────────
  {
    nip: "198212022007121002",
    nama: "Hasril",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["RIB 02 — 12 M", "D-Max Compartment 01 — B 9881 PSC"],
    penempatan: "Majene",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  // ── Polman ───────────────────────────────────────────────────────────────────
  {
    nip: "198908082010121001",
    nama: "Agustang",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["D-Max Compartment 02 — DC 8979"],
    penempatan: "Polman",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198807022022031001",
    nama: "Ahmad Aidid",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["RIB 01 — 9 M"],
    penempatan: "Polman",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  // ── Pasangkayu ───────────────────────────────────────────────────────────────
  {
    nip: "199612212022031001",
    nama: "Akmal Suryadil",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["D-Max Double Cabin 03 — DC 8980", "Trail 01 — DC 3480"],
    penempatan: "Pasangkayu",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  // ── Mamasa ───────────────────────────────────────────────────────────────────
  {
    nip: "199705052022031001",
    nama: "Muhammad Akbar",
    role: "OPERATOR_LAPANGAN",
    kendaraan: ["D-Max Double Cabin 01 — DC 8145", "Trail 03 — B 3183 PKQ"],
    penempatan: "Mamasa",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  // ── Operator lain tanpa kendaraan PIC ───────────────────────────────────────
  {
    // Di daftar penugasan disebut "Muh. Haerul"; nama resmi mengikuti NIP.
    nip: "200001052025211020",
    nama: "Haerul Vikra",
    role: "OPERATOR_LAPANGAN",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200108062022031001",
    nama: "Muh. Haerul",
    role: "OPERATOR_LAPANGAN",
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
];

// Operator lapangan existing yang tidak tercantum dalam daftar PIC kendaraan.
// Tetap dipertahankan agar akun live tidak terhapus saat cleanup.
const operatorLapanganLain = [
  {
    nip: "198607222007121001",
    nama: "Andi Juli Adenam Syariyanto",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199811292022031001",
    nama: "Andrie Nurseta",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  // ── Kantor Mamuju — Tambah 2026 ──────────────────────────────────────────────
  { nip: "199006192009121002", nama: "Aswandi",            role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198503312008121002", nama: "Zulkifli",            role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198709272009121001", nama: "Yusuf Admarapami",    role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "197909052007122002", nama: "Vanina Easty Putri AB", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199208112022032001", nama: "Arleny Lisu Lembang", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198704022022032001", nama: "Mila Afrianti",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199104242022032001", nama: "Marinda Ayu Wulandari", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199808162022032001", nama: "Nurfadhillah Syam",   role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200004122022032001", nama: "Nur Fajrin Jafar",    role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199809052022031001", nama: "Fauzi Ahmad Nur",     role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200001092022031002", nama: "Muh. Al-Qadri",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199912062022031001", nama: "Ahmad Farih",         role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200004242022031001", nama: "Nico A. S. Parinding", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200007262022031001", nama: "Muh. Fikry Haikal",   role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199801082022031001", nama: "M. Ilham Maulana",    role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200002132022031002", nama: "Andi Ilham",          role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199808292022031001", nama: "Wahyu Adi Pratama",   role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199908102022031001", nama: "Muh. Rezky Ramadhan", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200002242022031001", nama: "Gusti Ahmad Fathur Rahman", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199709282022031001", nama: "Akbar Mulia",         role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199808062022031001", nama: "Syaiful Hadi",         role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199806142022032001", nama: "Chindy Pratiwi",      role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  // ── Kantor Basarnas pusat / lainnya ──────────────────────────────────────────
  { nip: "198403172008121001", nama: "Hengky Kurniadi",     role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198703132009121002", nama: "Supriadi",             role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198606272009121001", nama: "Rizal Syam",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198711112009121003", nama: "Irwan",                role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199105152014031001", nama: "Saharuddin",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198609042009121001", nama: "Muh. Faried",          role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199106092014031001", nama: "Bachtiar",             role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199401292014031001", nama: "Sugianto",             role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199009082014031002", nama: "Muh. Risal",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198808172014031002", nama: "Agus Salim",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199201102014031001", nama: "Rustam",               role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199307222014031001", nama: "Muhammad Faddly S.",   role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199208152014031001", nama: "Baharuddin",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199401142014031001", nama: "M. Fajar Sidiq",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199401142014031002", nama: "Taufiq",               role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199312152014031001", nama: "Muh. Rijal",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199505242014031001", nama: "Ansar",                role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199506262014031001", nama: "Musliadi",             role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199303102014031003", nama: "Syaifuddin",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199202022014031001", nama: "Arfian Syah",          role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199504102014031001", nama: "Alfi Syahrin",         role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199503252014031001", nama: "Tamsil",               role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199306072014031001", nama: "Muhammad Al-Amin",     role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199205162014031001", nama: "Muhammad Syarif",      role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199408072014031001", nama: "Muh. Yusuf Asri",      role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199306082014031001", nama: "Hamzah",               role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199310122014031001", nama: "Ahmad Syafriadi",      role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199309252014031001", nama: "Rahmatullah",          role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199406052014031001", nama: "Guntur",               role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199308062014031001", nama: "Muh. Ilham",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199406212014031001", nama: "Muh. Alim",            role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199406182014031001", nama: "Aditya Pratama Putra", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199501102014031001", nama: "Sahrul",               role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199308152014031001", nama: "Andi Mappatola",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199411122014031001", nama: "Fandi Ahmad",          role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199310252014031001", nama: "Muh. Akbar",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199402052014031001", nama: "Muh. Rifqi",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199307042014031001", nama: "Amri",                 role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199212032014031001", nama: "Hasbi",                role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  // ── Batch 2025 ────────────────────────────────────────────────────────────────
  { nip: "200204102025061001", nama: "Andika Pratama",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200005122025061001", nama: "Fadli",                role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200301152025061001", nama: "Moh. Rizky Ramadhan",  role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "2001082025061001",  nama: "Muh. Asrul",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200402102025061001", nama: "Muh. Nabil Akbar",    role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200207122025061001", nama: "Muh. Syahrul",        role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200604162025062001", nama: "Nadhila Syaqi",        role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200110212025061001", nama: "Rizky Prayoga",        role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200309162025061001", nama: "Shiddieq Amanah Asdar", role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200109262025062002", nama: "Siti Irmayanti",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200212032025061001", nama: "Veri Rizal",           role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  // ── Batch 2025 (lanjutan) ────────────────────────────────────────────────────
  { nip: "199401052025212023", nama: "Hijrana",              role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198505232025211013", nama: "Mustapa",              role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200012042025211002", nama: "Muhammad Fiqri",       role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199712312025211005", nama: "Haerunnas",            role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199902172025211024", nama: "Mujo Syahrany",        role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "198705172025211068", nama: "Irwan Sukri",          role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199908222025211023", nama: "Syahrir",              role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "200109062025211012", nama: "Yasrinaldi Muhajir",   role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199905122025211023", nama: "M. Adryan Nur",        role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
  { nip: "199612252025211046", nama: "Riswan Kadir",         role: "OPERATOR_LAPANGAN", password: DEFAULT_PASSWORD, aktif: true, password_changed: false },
];

// Total user: 5 non-operator + 19 operator lapangan + 82 operator tambahan
// + 2 operator existing tanpa PIC + 5 akun kantor.
const users = [
  ...nonOperatorUsers,
  ...operatorLapangan,
  ...operatorLapanganLain,
  ...akunKantorUsers,
];

// ============================================================
// VALIDASI: pastikan semua NIP valid 16-18 digit
// ============================================================
function normalizeNip(nip) {
  return String(nip).replace(/[\s.\-_]/g, "").trim();
}

function validateNip(nip) {
  const clean = normalizeNip(nip);
  if (!/^\d{16,18}$/.test(clean)) {
    return { ok: false, message: `NIP ${nip} tidak valid (harus 16-18 digit)` };
  }
  return { ok: true };
}

function validateAll() {
  let ok = true;
  const seenNip = new Map();

  for (const u of users) {
    const cleanNip = normalizeNip(u.nip);
    const r = validateNip(u.nip);
    if (!r.ok) {
      console.error(`  ❌ ${r.message}`);
      ok = false;
    } else if (seenNip.has(cleanNip)) {
      console.error(`  ❌ NIP duplikat: ${cleanNip} (${seenNip.get(cleanNip)} & ${u.nama})`);
      ok = false;
    } else {
      seenNip.set(cleanNip, u.nama);
    }
    if (typeof u.password !== "string" || u.password.length < 8) {
      console.error(`  ❌ ${u.nama}: password minimal 8 karakter`);
      ok = false;
    }
    if (!u.nama) {
      console.error(`  ❌ ${u.nip}: nama wajib diisi`);
      ok = false;
    }
    if (u.kendaraan !== undefined && !Array.isArray(u.kendaraan)) {
      console.error(`  ❌ ${u.nama}: kendaraan harus berupa array`);
      ok = false;
    }
  }
  if (!ok) process.exit(1);
}

// Helper: generate email internal dari NIP
function generateInternalEmail(nip) {
  return `${normalizeNip(nip).toLowerCase()}@basarnas.ac.id`;
}

// ============================================================
// STEP 1: BERSIHKAN DATA LAMA (hanya jika tidak --skip-cleanup)
// ============================================================
async function cleanup() {
  if (SKIP_CLEANUP) {
    console.log("=== STEP 1: SKIPPED (--skip-cleanup) ===\n");
    return;
  }

  console.log("=== STEP 1: Bersihkan Data Lama ===\n");

  // Cek apakah service_role key valid
  const { data: authTest, error: authTestError } = await supabase.auth.admin.listUsers();
  if (authTestError) {
    console.error("SERVICE ROLE KEY TIDAK VALID!");
    console.error("Error:", authTestError.message);
    console.error("\nPastikan SUPABASE_SERVICE_ROLE_KEY di .env benar.");
    process.exit(1);
  }
  console.log(`Service role key valid. ${authTest.users.length} auth users ditemukan.`);

  if (DRY_RUN) {
    for (const user of authTest.users) {
      console.log(`  [DRY-RUN] akan dihapus: ${user.email}`);
    }
    console.log("\n  [DRY-RUN] akan dihapus: semua baris public.users\n");
    return;
  }

  // Hapus semua auth users
  for (const user of authTest.users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  Gagal menghapus auth user ${user.email}: ${error.message}`);
    } else {
      console.log(`  Dihapus: ${user.email}`);
    }
  }

  // Hapus public.users via SDK (fallback, karena rpc exec_sql tidak ada)
  const { error: sdkDeleteError } = await supabase
    .from("users")
    .delete()
    .gte("created_at", "1900-01-01"); // Hapus semua

  if (sdkDeleteError) {
    console.error("  Gagal membersihkan public.users:", sdkDeleteError.message);
  } else {
    console.log("  public.users berhasil dikosongkan (via SDK)\n");
  }
}

// ============================================================
// STEP 2: BUAT USER BARU
// ============================================================
async function createUsers() {
  console.log("=== STEP 2: Membuat User Baru ===\n");

  for (const user of users) {
    try {
      // 1. Siapkan data
      const cleanNip = normalizeNip(user.nip);
      const kendaraan = (user.kendaraan ?? []).join(", ") || "-";
      const penempatan = user.penempatan ?? "-";
      const internalEmail = user.email || generateInternalEmail(cleanNip);

      // Validasi email @basarnas.ac.id prefix == NIP (jika diberikan)
      if (user.email && user.email.toLowerCase().endsWith("@basarnas.ac.id")) {
        const prefix = user.email.toLowerCase().split("@")[0];
        if (prefix !== cleanNip.toLowerCase()) {
          console.error(
            `  ❌ ${user.nama}: email @basarnas.ac.id harus sesuai NIP (${cleanNip})`
          );
          continue;
        }
      }

      if (DRY_RUN) {
        console.log(
          `  [DRY-RUN] akan membuat: ${user.nama} (${cleanNip}) email=${internalEmail} role=${user.role} penempatan=${penempatan} kendaraan=${kendaraan}`
        );
        continue;
      }

      // 2. Buat auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: internalEmail,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          nip: cleanNip,
          nama: user.nama,
          kendaraan: user.kendaraan ?? [],
          penempatan: user.penempatan ?? null,
        },
      });

      if (authError) {
        console.error(`  Gagal membuat auth user ${internalEmail}: ${authError.message}`);
        continue;
      }

      console.log(`  Auth user dibuat: ${internalEmail}`);
      console.log(`    ID: ${authData.user.id}`);
      console.log(`    Penempatan: ${penempatan}`);
      console.log(`    Kendaraan: ${kendaraan}`);

      // 3. Insert ke public.users
      const { error: insertError } = await supabase
        .from("users")
        .upsert(
          {
            id: authData.user.id,
            email: internalEmail,
            nip: cleanNip,
            nama: user.nama,
            role: user.role,
            aktif: user.aktif,
            password_changed: user.password_changed,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (insertError) {
        console.error(`    Gagal insert ke public.users: ${insertError.message}`);
        await supabase.auth.admin.deleteUser(authData.user.id);
        continue;
      }
      console.log(`    Profile dibuat di public.users\n`);

      // 4. Set app_metadata (untuk performa login 0 RTT)
      //    app_metadata dibaca dari JWT → source of truth data otorisasi
      await supabase.auth.admin.updateUserById(authData.user.id, {
        app_metadata: {
          provider: "email",
          providers: ["email"],
          role: user.role,
          nip: cleanNip,
          nama: user.nama,
          aktif: user.aktif,
          password_changed: user.password_changed,
        },
      });
    } catch (err) {
      console.error(`  Error: ${err.message}\n`);
    }
  }
}

// ============================================================
// STEP 3: VERIFIKASI
// ============================================================
async function verify() {
  console.log("=== STEP 3: Verifikasi ===\n");

  // Cek auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Gagal memverifikasi auth users:", authError.message);
    return;
  }

  console.log(`Auth users: ${authUsers.users.length} user(s) ditemukan`);
  for (const u of authUsers.users) {
    const am = u.app_metadata ?? {};
    const role = am.role ?? u.user_metadata?.role ?? "?";
    const kendaraan = (u.user_metadata?.kendaraan ?? []).join(", ") || "-";
    const penempatan = u.user_metadata?.penempatan ?? "?";
    console.log(`  - [${role}] ${u.email} (aktif=${am.aktif ?? "?"}, penempatan=${penempatan}, kendaraan=${kendaraan})`);
  }

  // Cek public.users
  const { data: publicUsers, error: publicError } = await supabase
    .from("users")
    .select("id, email, nip, nama, role, aktif, password_changed")
    .order("role");

  if (publicError) {
    console.error("Gagal memverifikasi public.users:", publicError.message);
    return;
  }

  console.log(`\nPublic users: ${publicUsers.length} user(s) ditemukan`);
  for (const u of publicUsers) {
    console.log(`  - [${u.role}] ${u.nama} (NIP ${u.nip}, aktif=${u.aktif}, pw_changed=${u.password_changed})`);
  }

  // Cek keunikan NIP di public.users (harus semua unik)
  const nipCounts = {};
  for (const u of publicUsers) {
    nipCounts[u.nip] = (nipCounts[u.nip] ?? 0) + 1;
  }
  const duplicates = Object.entries(nipCounts).filter(([, c]) => c > 1);
  if (duplicates.length > 0) {
    console.error(`\n❌ NIP duplikat ditemukan!:`);
    for (const [nip, count] of duplicates) console.error(`   ${nip} x${count}`);
  } else {
    console.log(`\n✅ Semua NIP unik (${publicUsers.length} user)`);
  }

  console.log("\n=== SELESAI ===");
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("=== SUPABASE USER CREATION SCRIPT v3.2 ===\n");

  validateAll();
  await cleanup();
  await createUsers();
  await verify();

  if (DRY_RUN) {
    console.log(
      "\nDry-run selesai. Jalankan dengan --apply untuk eksekusi, atau --apply --skip-cleanup"
    );
  }
}

main();