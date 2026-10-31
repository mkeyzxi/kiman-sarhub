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
 *   6. Data: 4 user non-operator + 17 operator PIC kendaraan + 2 operator
 *      existing yang tidak ada di daftar PIC (total 23 user)
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
    nip: "19850331200812100",
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

// Operator lapangan yang menjadi penanggung jawab kendaraan.
// Urutan mengikuti daftar PIC kendaraan. Hasril muncul dua kali di daftar
// sumber, tetapi digabung menjadi satu user dengan dua kendaraan.
const operatorLapangan = [
  {
    nip: "198908082010121001",
    nama: "Agustang",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198802052007121001",
    nama: "Abd. Malik",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199709262022031001",
    nama: "Fajar Farial",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "198102142005021001",
    nama: "Ardiansyah",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199806052022031001",
    nama: "Muhammad Adiaksa",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199811182022031001",
    nama: "Agan Kalana",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
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
    nip: "200206132025061001",
    nama: "Muh. Abduh Yanis",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200004152022031002",
    nama: "Ibnu Anjaya",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200305132025061001",
    nama: "Calvin Datundelang",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199807192025211027",
    nama: "Wahyudi",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199610042025211053",
    nama: "Muhammad Fajrin S.Y.",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "200409052025061001",
    nama: "Sulaeman Mustamin",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "198212022007121002",
    nama: "Hasril",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198807022022031001",
    nama: "Ahmad Aidid",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199612212022031001",
    nama: "Akmal Suryadil",
    role: "OPERATOR_LAPANGAN",
    
    password: DEFAULT_PASSWORD,
    aktif: true,
    password_changed: false,
  },
  {
    nip: "199705052022031001",
    nama: "Muhammad Akbar",
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
];

// Total 23 user: 4 non-operator + 19 operator lapangan
// (17 PIC kendaraan + 2 operator existing tanpa data PIC).
const users = [...nonOperatorUsers, ...operatorLapangan, ...operatorLapanganLain];

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
          `  [DRY-RUN] akan membuat: ${user.nama} (${cleanNip}) email=${internalEmail} role=${user.role} kendaraan=${kendaraan}`
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
        },
      });

      if (authError) {
        console.error(`  Gagal membuat auth user ${internalEmail}: ${authError.message}`);
        continue;
      }

      console.log(`  Auth user dibuat: ${internalEmail}`);
      console.log(`    ID: ${authData.user.id}`);
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
    console.log(`  - [${role}] ${u.email} (aktif=${am.aktif ?? "?"}, kendaraan=${kendaraan})`);
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