-- ============================================================
-- MIGRASI: kolom referensi user dari uuid -> text (NIP)
-- Kantor Pencarian & Pertolongan Kelas B Mamuju
-- Jalankan di Supabase Dashboard -> SQL Editor. Idempoten:
-- aman dijalankan berulang (kolom yang sudah text dilewati).
--
-- Latar belakang:
--   Database lama memakai FK uuid -> public.users(id), sedangkan
--   aplikasi ini memakai NIP (text) sebagai kunci user. Kolom-kolom
--   di bawah dikonversi ke text: nilai uuid lama DIPETAKAN ke NIP
--   via users.id -> users.nip (data lama tidak hilang), lalu dipasang
--   FK baru ke public.users(nip).
--
-- Cakupan (8 kolom):
--   asets.penanggung_jawab, riwayat_aset.user_id,
--   ews_tickets.assigned_to, antrean_verifikasi.created_by,
--   activity_log.user_id, approvals.pengajuan_oleh,
--   checklist_harian.pemeriksa_id, berita_acara.pengaju_id
--
-- Setelah skrip ini berhasil, jalankan berurutan:
--   1. seed-supabase-data.sql   (isi ulang data, referensi NIP)
--   2. rls-policies.sql         (RLS berbasis NIP, to authenticated)
-- ============================================================

BEGIN;

-- ─── 0. Prasyarat: users.nip harus UNIQUE ──────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_nip_unique'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_nip_unique UNIQUE (nip);
  END IF;
END $$;

-- ─── 1. Konversi kolom uuid -> text (petakan uuid -> NIP) ──────────
DO $$
DECLARE
  ent text;
  t   text;
  c   text;
  f   text[];
BEGIN
  FOREACH ent IN ARRAY ARRAY[
    'asets:penanggung_jawab',
    'riwayat_aset:user_id',
    'ews_tickets:assigned_to',
    'antrean_verifikasi:created_by',
    'activity_log:user_id',
    'approvals:pengajuan_oleh',
    'checklist_harian:pemeriksa_id',
    'berita_acara:pengaju_id'
  ] LOOP
    f := string_to_array(ent, ':');
    t := f[1];
    c := f[2];

    -- Lewati bila kolom tidak ada / sudah text (idempoten)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = t
        AND column_name  = c
        AND data_type    = 'uuid'
    ) THEN
      RAISE NOTICE 'LEWATI : %.% (sudah text atau tidak ada)', t, c;
      CONTINUE;
    END IF;

    -- 1a. kolom text bantu
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN %I_uuid_tmp text', t, c);

    -- 1b. petakan nilai uuid lama -> NIP (via users.id)
    EXECUTE format(
      'UPDATE public.%I s SET %I_uuid_tmp = u.nip
         FROM public.users u
        WHERE u.id::text = s.%I::text', t, c, c);

    -- 1c. lepas kolom uuid (sekaligus FK lama ke users(id))
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', t, c);

    -- 1d. ganti nama kolom bantu menjadi nama asli
    EXECUTE format(
      'ALTER TABLE public.%I RENAME COLUMN %I_uuid_tmp TO %I', t, c, c);

    RAISE NOTICE 'MIGRASI: %.% uuid -> text (dipetakan ke users.nip)', t, c;
  END LOOP;
END $$;

-- ─── 2. Pasang FK baru: kolom user -> public.users(nip) ────────────
DO $$
DECLARE
  ent text;
  t   text;
  c   text;
  f   text[];
  kons text;
BEGIN
  FOREACH ent IN ARRAY ARRAY[
    'asets:penanggung_jawab',
    'riwayat_aset:user_id',
    'ews_tickets:assigned_to',
    'antrean_verifikasi:created_by',
    'activity_log:user_id',
    'approvals:pengajuan_oleh',
    'checklist_harian:pemeriksa_id',
    'berita_acara:pengaju_id'
  ] LOOP
    f := string_to_array(ent, ':');
    t := f[1];
    c := f[2];
    kons := t || '_' || c || '_fkey';

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = t
        AND column_name  = c
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname  = kons
        AND conrelid = format('public.%I', t)::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I
           FOREIGN KEY (%I) REFERENCES public.users(nip) ON DELETE SET NULL',
        t, kons, c);
      RAISE NOTICE 'FK BARU : %.% -> public.users(nip)', t, c;
    END IF;
  END LOOP;
END $$;

-- ─── 3. VERIFIKASI (muncul di panel Results) ───────────────────────
-- Semua kolom berikut harus bertipe `text`:
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('asets',              'penanggung_jawab'),
    ('riwayat_aset',       'user_id'),
    ('ews_tickets',        'assigned_to'),
    ('antrean_verifikasi', 'created_by'),
    ('activity_log',       'user_id'),
    ('approvals',          'pengajuan_oleh'),
    ('checklist_harian',   'pemeriksa_id'),
    ('berita_acara',       'pengaju_id')
  )
ORDER BY table_name, column_name;

-- Contoh hasil migrasi data: 2 aset pertama (PJ kini berupa NIP)
SELECT id, nama, penanggung_jawab
FROM public.asets
ORDER BY id
LIMIT 2;

COMMIT;
