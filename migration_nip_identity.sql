-- ============================================================
-- MIGRATION: NIP sebagai identitas login (unique + NOT NULL)
-- ============================================================
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Latar belakang:
--   Login sekarang pakai NIP, bukan email. Auth Supabase tetap
--   memakai `auth.users.email` sebagai identitas kredensial, tapi
--   isinya adalah email sintetis: {nip}@basarnas.ac.id.
--   Karena email bisa diisi admin sebagai "email kontak" (opsional),
--   maka keunikan NIP harus dijaga oleh DB, bukan diturunkan dari
--   keunikan email.
--
-- Pratinjau DULU (hanya baca, tanpa mengubah data):
--   SELECT nip, count(*) FROM public.users
--   GROUP BY nip HAVING count(*) > 1;
--   -- harus kosong (0 baris). Kalau ada duplikat, selesaikan dulu.
--
--   SELECT count(*) FROM public.users
--   WHERE nip IS NULL OR btrim(nip) = '';
--   -- harus 0. Jika >0, selesaikan dulu (isi atau hapus user tsb).
-- ============================================================

-- 1. NIP jadi wajib (identitas login)
ALTER TABLE public.users
  ALTER COLUMN nip SET NOT NULL;

-- 2. NIP unik — 2 user tidak boleh punya NIP sama
--    (index unik; NULL tidak dihitung, tapi karena NOT NULL semua
--    nilai harus unik)
CREATE UNIQUE INDEX IF NOT EXISTS users_nip_key
  ON public.users (nip);

-- 3. Index lookup cepat untuk validasi (index unik sudah cover)
--    Tidak perlu index tambahan.

-- ============================================================
-- VERIFIKASI (jalankan setelah migration)
-- ============================================================
-- Cek constraint
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.users'::regclass;
--
-- Cek index
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'users';
--
-- Tes: coba update NIP jadi duplikat → harus ditolak
-- UPDATE public.users SET nip = '<NIP user lain>' WHERE nip = '<NIP ini>';
-- -- Error: duplicate key value violates unique constraint "users_nip_key"
--
-- Tes: coba set NIP jadi NULL → harus ditolak
-- UPDATE public.users SET nip = NULL WHERE nip = '<NIP ini>';
-- -- Error: null value in column "nip" violates not-null constraint