/**
 * Script: Backfill `auth.users.app_metadata` dari `public.users`
 *
 * Jalankan dengan:
 *   node scripts/repair-auth-metadata.mjs --dry-run
 *   node scripts/repair-auth-metadata.mjs --apply
 *
 * Fungsi:
 *   Untuk setiap user di public.users, sinkronkan auth.users:
 *     - user_metadata: { nama, nip, role }      ← dari public.users (source of truth)
 *     - app_metadata: { provider, providers, role, aktif, nip, nama, password_changed }
 *       → `provider`/`providers` dipertahankan (GoTrue bawaan)
 *
 * Latar belakang:
 *   Supabase JWT (access token) sudah men-declare field-field di
 *   app_metadata. Untuk performa login 0 RTT, data otorisasi
 *   (role, aktif) TIDAK boleh di-query dari DB setiap login; cukup
 *   dari JWT. Maka data ini WAJIB ada di auth.users.app_metadata.
 *
 *   Inkonsistensi yang ditemukan di live:
 *     - Mahmud Afandi: public.users.role=KAKANSAR tapi auth user_metadata.role=ADMIN_IT
 *     - user_metadata belum selalu sync dengan public.users
 *
 *   Script ini membandingkan dan memperbaiki.
 */

import { createClient } from "@supabase/supabase-js";

// Konfigurasi Supabase (sama seperti create-supabase-users-v3.mjs)
const SUPABASE_URL = "https://yzswezcgttegsrqisrfq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_MaYZXFo-08LcmBAY9W9H7g_MbVPz5Q2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const APPLY = process.argv.includes("--apply");
if (!APPLY) {
  console.log("MODE: --dry-run (hanya baca & tampilkan perubahan, TIDAK menulis)\n");
}

async function repair() {
  const { data: publicUsers, error } = await supabase
    .from("users")
    .select("id, email, nip, nama, role, aktif, password_changed")
    .order("created_at");

  if (error) {
    console.error("Gagal baca public.users:", error.message);
    process.exit(1);
  }

  console.log(`Menemukan ${publicUsers.length} user di public.users.\n`);

  let changesMade = 0;

  for (const u of publicUsers) {
    // Baca auth user saat ini
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(u.id);
    if (authErr) {
      console.error(`  [GAGAL] ${u.nama}: ${authErr.message}`);
      continue;
    }

    const currentUM = authUser?.user?.user_metadata ?? {};
    const currentAM = authUser?.user?.app_metadata ?? {};

    // Target: user_metadata dari public.users (source of truth)
    const targetUM = {
      ...currentUM, // pertahankan field lain (mis. email_verified)
      nama: u.nama,
      nip: u.nip,
      role: u.role,
    };

    // Target: app_metadata = current (pertahankan provider) + otorisasi
    const targetAM = {
      ...currentAM, // pertahankan provider/providers GoTrue
      role: u.role,
      aktif: u.aktif,
      nip: u.nip,
      nama: u.nama,
      password_changed: u.password_changed,
    };

    const umChanged = JSON.stringify(currentUM) !== JSON.stringify(targetUM);
    const amChanged = JSON.stringify(currentAM) !== JSON.stringify(targetAM);

    if (!umChanged && !amChanged) {
      console.log(`  [OK]  ${u.nama} (${u.nip})`);
      continue;
    }

    console.log(`  [DIFF] ${u.nama} (${u.nip})`);
    if (umChanged) console.log(`         user_metadata: ${JSON.stringify(currentUM)} → ${JSON.stringify(targetUM)}`);
    if (amChanged) console.log(`         app_metadata:  ${JSON.stringify(currentAM)} → ${JSON.stringify(targetAM)}`);

    if (APPLY) {
      const { error: updateErr } = await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: targetUM,
        app_metadata: targetAM,
      });
      if (updateErr) {
        console.error(`         GAGAL update: ${updateErr.message}`);
      } else {
        changesMade++;
        console.log(`         diperbarui.`);
      }
    }
  }

  if (APPLY) {
    console.log(`\nSelesai: ${changesMade} user diperbarui.`);
  } else {
    console.log(
      `\nSelesai (dry-run): ${changesMade} user akan di-backfill. Jalankan dengan --apply untuk eksekusi.`
    );
  }

  console.log(
    `\nPENTING: user yang sedang punya sesi perlu logout & login ulang` +
    `\nagar JWT-nya men-declare app_metadata yang baru.`
  );
}

repair().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});