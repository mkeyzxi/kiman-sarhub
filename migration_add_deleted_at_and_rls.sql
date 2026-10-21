-- ============================================================
-- MIGRATION: Soft delete + RLS policies untuk tabel users
-- ============================================================
-- Jalankan di Supabase Dashboard → SQL Editor (opsional tapi disarankan)
-- ============================================================

-- 1. Tambah kolom `deleted_at` (nullable, default null)
--    Jika kolom sudah ada, skip baris ini.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Pastikan index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users (deleted_at);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================
-- Hapus policy lama bila ada (idempotent)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_read_active" ON public.users;

-- 3a. User bisa membaca profilnya sendiri
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3b. User bisa mengubah profilnya sendiri, TAPI tidak boleh
--     mengubah `role` atau `aktif` (privilege escalation protection)
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND aktif = (SELECT aktif FROM public.users WHERE id = auth.uid())
  );

-- 3c. Admin IT (role = 'ADMIN_IT') punya akses penuh.
--     Catatan: service_role key (dipakai di API route) selalu bypass RLS,
--     sehingga policy ini terutama untuk akses langsung via anon key.
CREATE POLICY "users_admin_all"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'ADMIN_IT'
        AND u.aktif = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'ADMIN_IT'
        AND u.aktif = true
    )
  );

-- ============================================================
-- 4. VIEW HELPER: daftar user aktif
-- ============================================================
CREATE OR REPLACE VIEW public.users_aktif AS
SELECT id, email, nip, nama, role, created_at, updated_at
FROM public.users
WHERE aktif = true AND deleted_at IS NULL;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Cek policy yang aktif
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Cek data user
SELECT id, email, nip, nama, role, aktif, deleted_at, created_at, updated_at
FROM public.users
ORDER BY created_at DESC;
