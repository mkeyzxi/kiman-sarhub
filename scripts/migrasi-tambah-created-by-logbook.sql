-- ============================================================
-- MIGRATION: RLS + kolom created_by untuk logbook_perjalanan
--
-- Tambah kolom `created_by` untuk menyimpan NIP creator/penyangga
-- logbook, dan update RLS policy agar OPERATOR_LAPANGAN dan AKUNTOR
-- boleh UPDATE logbook yang mereka buat sendiri.
--
-- Jalankan di: Supabase Dashboard → SQL Editor
-- Idempoten: aman dijalankan berulang
-- ============================================================

-- Tambah kolom created_by (NIP creator)
ALTER TABLE public.logbook_perjalanan ADD COLUMN IF NOT EXISTS created_by text;

COMMENT ON COLUMN public.logbook_perjalanan.created_by IS
  'NIP user (creator) yang membuat logbook ini — untuk identifikasi owner saat edit';

-- ─── RLS: Permit update logbook owner (operator/akuntor) ─────────────────────
-- Operator lapangan / akun kantor hanya boleh UPDATE logbook yang created_by
-- mereka sendiri. Role lain (ADMIN_IT, PENGELOGA_BMN, KAKANSAR) tetap bebas.

DROP POLICY IF EXISTS logbook_update_owner ON public.logbook_perjalanan;
CREATE POLICY logbook_update_owner ON public.logbook_perjalanan
  FOR UPDATE TO authenticated
  USING (
    public.role_jwt() IN ('OPERATOR_LAPANGAN', 'AKUNTOR')
    AND created_by = public.nip_jwt()
  )
  WITH CHECK (
    public.role_jwt() IN ('OPERATOR_LAPANGAN', 'AKUNTOR')
    AND created_by = public.nip_jwt()
  );

-- ─── Backfill: Set created_by dari data logbook yang sudah ada ───────────────
-- Logbook lama tidak punya created_by. Isi dengan NIP user yang paling mungkin
-- menjadi pemiliknya: cocokkan nama `nahkoda` ke `users.nama` → ambil NIP-nya.
-- Bila tidak cocok, biarkan NULL (admin tetap bisa edit semua).
UPDATE public.logbook_perjalanan lp
SET created_by = u.nip
FROM public.users u
WHERE lp.created_by IS NULL
  AND lower(u.nama) = lower(trim(lp.nahkoda));

-- ─── RLS: Permit update checklist owner (operator/akuntor) ───────────────────
-- Operator lapangan / akun kantor hanya boleh UPDATE checklist yang
-- pemeriksa_id mereka sendiri. Untuk edit item + catatan.

DROP POLICY IF EXISTS checklist_update_owner ON public.checklist_harian;
CREATE POLICY checklist_update_owner ON public.checklist_harian
  FOR UPDATE TO authenticated
  USING (
    public.role_jwt() IN ('OPERATOR_LAPANGAN', 'AKUNTOR')
    AND pemeriksa_id = public.nip_jwt()
  )
  WITH CHECK (
    public.role_jwt() IN ('OPERATOR_LAPANGAN', 'AKUNTOR')
    AND pemeriksa_id = public.nip_jwt()
  );
