/**
 * Script v3.1: Membuat user Supabase via Admin API + cleanup
 *
 * Jalankan dengan:
 *   node scripts/create-supabase-users-v3.mjs               (dry-run: tampilkan saja)
 *   node scripts/create-supabase-users-v3.mjs --apply       (hapus data lama + buat baru)
 *   node scripts/create-supabase-users-v3.mjs --apply --skip-cleanup
 *      (buat user baru TANPA hapus data lama — upsert pakai NIP sebagai kunci)
 *
 * Perubahan:
 *   1. Login sekarang berbasis NIP → email identitas di auth.users = {nip}@basarnas.ac.id
 *   2. Validasi format NIP 16-18 digit
 *   3. `app_metadata` di-fill saat create (untuk performa login 0 RTT)
 *   4. `user_metadata` sinkron dengan public.users (source of truth)
 *   5. Flag --dry-run (default), --apply, --skip-cleanup
 *   6. Data selaras dengan kondisi live di database (9 user, termasuk
 *      Muhammad Makbul N = nonaktif, Mahmud Afandi = KAKANSAR)
 */

import { createClient } from "@supabase/supabase-js";

// Konfigurasi Supabase
const SUPABASE_URL = "https://yzswezcgttegsrqisrfq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_MaYZXFo-08LcmBAY9W9H7g_MbVPz5Q2";

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
// DATA USER (selaras dengan kondisi live, 9 user)
//
// Catatan:
//  - email TIDAK perlu di-fill: akan di-generate otomatis dari NIP.
//    Tapi Anda boleh menambah `email` per-user kalau mau set kontak.
//  - `aktif: false` = soft delete; `password_changed: false` = password
//    masih default (admin IT harus minta user ganti).
// ============================================================
const users = [
  {
    nip: "198208042009121003",
    nama: "Mahmud Afandi",
    role: "KAKANSAR",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199810212022032001",
    nama: "Medline",
    role: "PENGELOLA_BMN",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "200006042025061006",
    nama: "Oky Juneva Marsel",
    role: "ADMIN_IT",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198607222007121001",
    nama: "Andi Juli Adenam Syariyanto",
    role: "OPERATOR_LAPANGAN",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198212022007121002",
    nama: "Hasril",
    role: "OPERATOR_LAPANGAN",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "198908082010121001",
    nama: "Agustang",
    role: "OPERATOR_LAPANGAN",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199806052022031001",
    nama: "Muhammad Adiaksa",
    role: "OPERATOR_LAPANGAN",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    nip: "199811292022031001",
    nama: "Andrie Nurseta",
    role: "OPERATOR_LAPANGAN",
    password: "password123",
    aktif: true,
    password_changed: true,
  },
  {
    // Test account (nonaktif) — dipertahankan dari kondisi live
    nip: "1111111111111111",
    nama: "Muhammad Makbul N",
    role: "PENGELOLA_BMN",
    password: "password123",
    aktif: false,
    password_changed: false,
  },
];

// ============================================================
// VALIDASI: pastikan semua NIP valid 16-18 digit
// ============================================================
function validateNip(nip) {
  const clean = String(nip).replace(/[\s.\-_]/g, "").trim();
  if (!/^\d{16,18}$/.test(clean)) {
    return { ok: false, message: `NIP ${nip} tidak valid (harus 16-18 digit)` };
  }
  return { ok: true };
}

function validateAll() {
  let ok = true;
  for (const u of users) {
    const r = validateNip(u.nip);
    if (!r.ok) {
      console.error(`  ❌ ${r.message}`);
      ok = false;
    }
    if (typeof u.password !== "string" || u.password.length < 8) {
      console.error(`  ❌ ${u.nama}: password minimal 8 karakter`);
      ok = false;
    }
    if (!u.nama) {
      console.error(`  ❌ ${u.nip}: nama wajib diisi`);
      ok = false;
    }
  }
  if (!ok) process.exit(1);
}

// Helper: generate email internal dari NIP
function generateInternalEmail(nip) {
  return `${String(nip).toLowerCase().replace(/[\s.\-_]/g, "")}@basarnas.ac.id`;
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
    console.error("\nPastikan service_role key benar di file script.");
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
      const normalizeNip = String(user.nip).replace(/[\s.\-_]/g, "").trim();
      const internalEmail = user.email || generateInternalEmail(normalizeNip);

      // Validasi email @basarnas.ac.id prefix == NIP (jika diberikan)
      if (user.email && user.email.toLowerCase().endsWith("@basarnas.ac.id")) {
        const prefix = user.email.toLowerCase().split("@")[0];
        if (prefix !== normalizeNip.toLowerCase()) {
          console.error(
            `  ❌ ${user.nama}: email @basarnas.ac.id harus sesuai NIP (${normalizeNip})`
          );
          continue;
        }
      }

      if (DRY_RUN) {
        console.log(`  [DRY-RUN] akan membuat: ${user.nama} (${normalizeNip}) email=${internalEmail} role=${user.role}`);
        continue;
      }

      // 2. Buat auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: internalEmail,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          nip: normalizeNip,
          nama: user.nama,
        },
      });

      if (authError) {
        console.error(`  Gagal membuat auth user ${internalEmail}: ${authError.message}`);
        continue;
      }

      console.log(`  Auth user dibuat: ${internalEmail}`);
      console.log(`    ID: ${authData.user.id}`);

      // 3. Insert ke public.users
      const { error: insertError } = await supabase
        .from("users")
        .upsert(
          {
            id: authData.user.id,
            email: internalEmail,
            nip: normalizeNip,
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
          nip: normalizeNip,
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
    console.log(`  - [${role}] ${u.email} (aktif=${am.aktif ?? "?"})`);
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
  console.log("=== SUPABASE USER CREATION SCRIPT v3.1 ===\n");

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