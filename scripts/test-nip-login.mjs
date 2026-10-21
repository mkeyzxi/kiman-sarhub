/**
 * Script: Tes login NIP end-to-end + ukur performa
 *
 * Jalankan: node scripts/test-nip-login.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yzswezcgttegsrqisrfq.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_jePkTZY_0kzZenRCN3Dzyg_U0VlZ8s-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Tes akun aktif (Mahmud Afandi — KAKANSAR)
const NIP = "198208042009121003";
const PASSWORD = "password123";
const EMAIL = `${NIP}@basarnas.ac.id`;

const t0 = performance.now();
const { data, error } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
const t1 = performance.now();

if (error) {
  console.error("Login gagal:", error.message);
  process.exit(1);
}

console.log(`Login berhasil dalam ${Math.round(t1 - t0)} ms\n`);

// Dekode JWT access token untuk lihat app_metadata
function decodeJwt(token) {
  const parts = token.split(".");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

const jwt = decodeJwt(data.session.access_token);
console.log("app_metadata di JWT:");
console.log(JSON.stringify(jwt.app_metadata, null, 2));
console.log("\nuser_metadata di JWT:");
console.log(JSON.stringify(jwt.user_metadata, null, 2));

// Cek field yang dibutuhkan (0 RTT check)
const checks = [
  { key: "role", found: jwt.app_metadata?.role, expected: "KAKANSAR" },
  { key: "aktif", found: jwt.app_metadata?.aktif, expected: true },
  { key: "nip", found: jwt.app_metadata?.nip, expected: NIP },
  { key: "nama", found: jwt.app_metadata?.nama, expected: "Mahmud Afandi" },
];

let allPassed = true;
console.log("\nVerifikasi field app_metadata:");
for (const c of checks) {
  const ok = c.found === c.expected;
  if (!ok) allPassed = false;
  console.log(
    `  ${ok ? "✅" : "❌"} ${c.key}: ${JSON.stringify(c.found)} (expect ${JSON.stringify(c.expected)})`
  );
}

// Sign out untuk bersih
await supabase.auth.signOut();
console.log("\nSelesai. (Sesi di-logout untuk bersih.)");
process.exit(allPassed ? 0 : 1);
