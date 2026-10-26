-- ============================================================
-- DIAGNOSTIC: cek tipe kolom & isi tabel public.users
-- Jalankan di Supabase Dashboard → SQL Editor.
-- ============================================================

-- ─── A. Skema kolom public.users ───────────────────────────
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ─── B. Contoh data user (limit 25) ─────────────────────────
SELECT id, email, nip, nama, role, aktif, password_changed, created_at
FROM public.users
ORDER BY created_at
LIMIT 25;

-- ─── C. Count user per role ─────────────────────────────────
SELECT role, count(*) AS total
FROM public.users
GROUP BY role
ORDER BY role;

-- ─── D. Apakah tabel-tabel target sudah ada? ────────────────
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'asets','riwayat_aset','ews_tickets','antrean_verifikasi',
    'checklist_templates','checklist_items','notifications',
    'activity_log','riwayat_operasi','approvals',
    'logbook_perjalanan','checklist_harian','berita_acara'
  )
ORDER BY tablename;
