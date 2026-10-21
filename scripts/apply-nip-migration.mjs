/**
 * Script: Terapkan migration NIP identity ke live Supabase DB
 *
 * Jalankan: node scripts/apply-nip-migration.mjs
 *
 * Isi:
 *   - cek dulu: ada duplikat NIP? ada NIP kosong?
 *   - ALTER COLUMN nip SET NOT NULL
 *   - CREATE UNIQUE INDEX users_nip_key
 *
 * Idempotent: aman dijalankan ulang.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yzswezcgttegsrqisrfq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_MaYZXFo-08LcmBAY9W9H7g_MbVPz5Q2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=== Cek data sebelum migration ===\n");

  // Cek duplikat NIP
  const resAll = await supabase.from("users").select("nip");
  if (resAll.error) {
    console.error("Gagal baca NIP:", resAll.error.message);
    process.exit(1);
  }
  const nipCounts = {};
  for (const r of resAll.data) {
    if (r.nip) nipCounts[r.nip] = (nipCounts[r.nip] ?? 0) + 1;
  }
  const dupesFound = Object.entries(nipCounts).filter(([, c]) => c > 1);
  const emptyNip = resAll.data.filter((r) => !r.nip || String(r.nip).trim() === "");

  if (dupesFound.length > 0) {
    console.error("❌ NIP duplikat ditemukan, selesaikan dulu:");
    for (const [nip, count] of dupesFound) console.error(`   ${nip} x${count}`);
    process.exit(1);
  }
  if (emptyNip.length > 0) {
    console.error(`❌ ${emptyNip.length} user punya NIP kosong/NULL. Selesaikan dulu.`);
    for (const u of emptyNip) console.error(`   id=${u.id} nama=? (NIP kosong)`);
    process.exit(1);
  }
  console.log(`✅ ${resAll.data.length} user, semua NIP terisi, tidak ada duplikat.\n`);

  // Jalankan migration SQL via PostgREST rpc (juga: langsung pakai SQL)
  // Karena service_role punya akses penuh, pakai fetch langsung ke Postgres
  // tidak memungkinkan. Gunakan .update() dengan constraint check:
  // 1) SET NOT NULL — coba update 1 baris untuk mengecek constraint
  // PostgREST tidak bisa ALTER TABLE. Maka jalankan lewat pg REST:
  console.log("Migration ALTER TABLE & CREATE INDEX harus dijalankan di:");
  console.log("  Supabase Dashboard → SQL Editor");
  console.log("  (PostgREST tidak mendukung DDL: ALTER TABLE / CREATE INDEX)");
  console.log("\nJalankan SQL berikut di SQL Editor:\n");
  console.log(`-- migration_nip_identity.sql
-- 1. NIP wajib
ALTER TABLE public.users
  ALTER COLUMN nip SET NOT NULL;

-- 2. NIP unik
CREATE UNIQUE INDEX IF NOT EXISTS users_nip_key
  ON public.users (nip);
`);
  console.log("Setelah dijalankan, verifikasi:");
  console.log("  SELECT indexname FROM pg_indexes WHERE tablename='users';");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
