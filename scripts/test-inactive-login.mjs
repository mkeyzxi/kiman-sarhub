/**
 * Script: Tes bahwa akun nonaktif ditolak oleh sistem
 *
 * Jalankan: node scripts/test-inactive-login.mjs
 *
 * Logika (sama persis dengan src/lib/auth.ts → loginWithNip):
 *  1. attempt signInWithPassword di Supabase Auth
 *     - Jika GoTrue reject ("Invalid login credentials") → login ditolak ✅
 *     - Jika GoTrue accept → cek app_metadata.aktif di JWT
 *       - Jika aktif === false → signOut + tolak (INACTIVE_ACCOUNT_MESSAGE)
 *  2. Verifikasi app_metadata.aktif = false di server (source of truth)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yzswezcgttegsrqisrfq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jePkTZY_0kzZenRCN3Dzyg_U0VlZ8s-";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_MaYZXFo-08LcmBAY9W9H7g_MbVPz5Q2";

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NIP = "1111111111111111";
const EMAIL = `${NIP}@basarnas.ac.id`;

// Simulasi loginWithNip() — sama persis logikanya di src/lib/auth.ts
async function loginWithNipSim(nip, password) {
  const email = `${nip}@basarnas.ac.id`;
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) return { data: null, error: error.message };

  if (data.user) {
    const meta = data.user.app_metadata;
    if (meta?.aktif === false) {
      await anon.auth.signOut();
      return {
        data: null,
        error: "Akun Anda nonaktif. Silahkan menghubungi admin.",
      };
    }
    return {
      data: {
        user: data.user,
        role: meta?.role,
        nama: meta?.nama,
        nip: meta?.nip,
        aktif: meta?.aktif ?? true,
      },
      error: null,
    };
  }
  return { data: null, error: "User not found" };
}

// ── Tes 1: login akun nonaktif → harus ditolak ────────────────────────────
console.log("=== Tes 1: Login akun nonaktif (Muhammad Makbul N, NIP 1111...) ===\n");
const result = await loginWithNipSim(NIP, "password123");

const REJECTED =
  result.error === "Akun Anda nonaktif. Silahkan menghubungi admin." ||
  result.error === "Invalid login credentials";

if (REJECTED) {
  console.log(`✅ Login ditolak (${result.error})`);
} else {
  console.error("❌ Login seharusnya ditolak, tapi hasilnya:");
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

// ── Tes 2: verifikasi app_metadata.aktif = false di server ────────────────
const { data: authUser } = await admin.auth.admin.getUserById(
  "2a3a370f-2b97-48d7-bfe4-0a7c3948a1ee"
);
const am = authUser?.user?.app_metadata;

console.log("\n=== Tes 2: Verifikasi app_metadata di server ===\n");
console.log(`app_metadata = ${JSON.stringify(am, null, 2)}\n`);

if (am?.aktif === false) {
  console.log("✅ app_metadata.aktif = false, konsisten dengan public.users.");
} else {
  console.error(`❌ app_metadata.aktif = ${am?.aktif}, harusnya false.`);
  process.exit(1);
}

// ── Tes 3: pastikan akun aktif tetap bisa login ───────────────────────────
console.log("\n=== Tes 3: Login akun aktif (Mahmud Afandi, KAKANSAR) ===\n");
const activeNip = "198208042009121003";
const activeResult = await loginWithNipSim(activeNip, "password123");

if (!activeResult.error && activeResult.data?.role === "KAKANSAR") {
  console.log(`✅ Login KAKANSAR berhasil (role=${activeResult.data.role})`);
} else {
  console.error("❌ Login KAKANSAR seharusnya berhasil.");
  console.error(JSON.stringify(activeResult, null, 2));
  process.exit(1);
}

await anon.auth.signOut();
console.log("\nSemua tes lulus.");
