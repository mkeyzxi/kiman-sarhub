-- ============================================================
-- FIX: RLS policy tabel berita_acara hilang
-- ============================================================
-- Gejala:
--   - Daftar berita acara selalu 0
--   - INSERT draf gagal: "new row violates row-level security policy
--     for table \"berita_acara\"" (42501)
--
-- Penyebab (terverifikasi via probe live):
--   - Tabel berita_acara RLS-nya AKTIF, tetapi tidak punya policy
--     (ba_select / ba_insert / ba_update tidak ada di DB).
--   - Sesi login valid, app_metadata (role/nip) lengkap — bukan
--     masalah auth, murni policy yang hilang.
--
-- Cara pakai:
--   Supabase Dashboard → SQL Editor → paste seluruh isi file ini → Run.
--
-- IDEMPOTEN — aman dijalankan ulang (drop policy if exists dulu).
-- Helper (role_jwt/nip_jwt/signed_in/boleh_tulis_aset) ikut dibuat
-- ulang karena policy bergantung pada fungsi-fungsi ini.
-- ============================================================

-- 0. Helper dulu (dipakai oleh policy di bawah)
create or replace function public.role_jwt() returns text
language sql stable security definer set search_path = public as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$;

create or replace function public.nip_jwt() returns text
language sql stable security definer set search_path = public as $$
  select auth.jwt() -> 'app_metadata' ->> 'nip';
$$;

create or replace function public.signed_in() returns boolean
language sql stable as $$ select auth.role() = 'authenticated'; $$;

create or replace function public.boleh_tulis_aset() returns boolean
language sql stable as $$
  select public.signed_in()
    and (public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN'));
$$;

-- 1. Pastikan RLS aktif di tabel
alter table public.berita_acara enable row level security;

-- 2. Policy SELECT — role istimewa lihat semua; operator hanya miliknya
drop policy if exists ba_select on public.berita_acara;
create policy ba_select on public.berita_acara
  for select to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'KAKANSAR')
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
  );

-- 3. Policy INSERT — draf operator (pengaju_id masih kosong) boleh dibuat;
--    role istimewa (ADMIN_IT / PENGELOLA_BMN) boleh mengisi apa pun.
drop policy if exists ba_insert on public.berita_acara;
create policy ba_insert on public.berita_acara
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
  );

-- 4. Policy UPDATE — pengisian isi draf oleh operator + penyerahan;
--    dipakai juga BMN saat mengisi nomor surat (boleh_tulis_aset).
drop policy if exists ba_update on public.berita_acara;
create policy ba_update on public.berita_acara
  for update to authenticated
  using (
    public.boleh_tulis_aset()
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
  )
  with check (
    public.boleh_tulis_aset()
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
  );

-- ============================================================
-- VERIFIKASI (tampil di panel Results SQL Editor)
-- ============================================================
-- Harus muncul 3 baris: ba_select / ba_insert / ba_update
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'berita_acara'
order by policyname;
