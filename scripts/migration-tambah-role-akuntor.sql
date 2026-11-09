-- ============================================================
-- MIGRASI: Aktifkan role AKUNTOR (RLS + RPC)
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempoten — aman dijalankan ulang.
--
-- CATATAN PENTING:
--   Kolom public.users.role adalah TEXT biasa (bukan enum Postgres),
--   sehingga TIDAK PERLU ALTER TYPE. Nilai 'AKUNTOR' langsung bisa
--   dipakai begitu ada user dengan role tersebut.
--
-- AKUNTOR = "Akun Kantor" (Kantor SAR, Pos SAR, USS)
-- Role khusus untuk checklist perawatan kendaraan harian
-- (tanpa mingguan/bulanan), melihat semua kendaraan.
--
-- Hanya 4 objek yang perlu diubah:
--   1. Policy INSERT checklist_harian  (tambah AKUNTOR)
--   2. Fungsi serahkan_kerusakan_aset  (tambah AKUNTOR + ADMIN_IT)
--   3. Fungsi putuskan_berita_acara    (tambah ADMIN_IT — role tertinggi)
--   4. Fungsi cek_checklist_sudah_ada + index unik
--      (anti-duplikasi: satu kendaraan satu checklist per tanggal)
-- Policy SELECT & UPDATE sudah berbasis kepemilikan
-- (pemeriksa_id = nip_jwt()), jadi otomatis mencakup AKUNTOR.
-- ============================================================

-- ─── 1. Policy INSERT checklist_harian — tambah AKUNTOR ─────────────────────
drop policy if exists checklist_insert_self on public.checklist_harian;
create policy checklist_insert_self on public.checklist_harian
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or (public.role_jwt() in ('OPERATOR_LAPANGAN', 'AKUNTOR')
        and pemeriksa_id = public.nip_jwt())
  );

-- ─── 2. RPC: serahkan_kerusakan_aset — izinkan AKUNTOR & ADMIN_IT ───────────
-- Fungsi lama hanya mengecek 'OPERATOR_LAPANGAN'. Versi baru mengizinkan
-- AKUNTOR (akun kantor menyerahkan kerusakan aset hasil checklist) dan
-- ADMIN_IT (role tertinggi — boleh melakukan semuanya).
create or replace function public.serahkan_kerusakan_aset(
  p_aset_id text,
  p_kondisi text,
  p_keterangan text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.role_jwt();
  v_nip  text := public.nip_jwt();
begin
  if v_role is distinct from 'OPERATOR_LAPANGAN'
     and v_role is distinct from 'AKUNTOR'
     and v_role is distinct from 'ADMIN_IT' then
    raise exception 'Hanya operator lapangan, akun kantor, atau Admin IT yang menyerahkan kerusakan.';
  end if;
  if p_kondisi not in ('Rusak Ringan', 'Rusak Berat') then
    raise exception 'Kondisi kerusakan tidak valid.';
  end if;

  update public.asets
     set status  = p_kondisi,  -- status aset mengikuti kondisi kerusakan
         kondisi = p_kondisi
   where id = p_aset_id;
  if not found then
    raise exception 'Aset dengan ID "%" tidak ditemukan.', p_aset_id;
  end if;

  insert into public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
  values (p_aset_id, current_date, 'Serahkan ke BMN', p_keterangan, v_nip);
end;
$$;

grant execute on function public.serahkan_kerusakan_aset(text, text, text)
  to authenticated;

-- ─── 2b. RPC: putuskan_berita_acara — izinkan ADMIN_IT ──────────────────────
-- Keputusan BA awalnya hanya KAKANSAR. ADMIN_IT sebagai role tertinggi
-- kini juga boleh memutus (acc/tolak) berita acara. Badan fungsi identik
-- dengan rls-policies.sql — hanya pengecekan role yang diperluas.
create or replace function public.putuskan_berita_acara(
  p_ba_id   text,
  p_setujui boolean,
  p_alasan  text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role    text := public.role_jwt();
  v_nip     text := public.nip_jwt();
  v_aset_id text;
begin
  -- ADMIN_IT = role tertinggi: boleh melakukan segalanya, termasuk
  -- memutus berita acara layaknya Kepala Kantor SAR.
  if v_role is distinct from 'KAKANSAR'
     and v_role is distinct from 'ADMIN_IT' then
    raise exception 'Hanya Kepala Kantor SAR (atau Admin IT) yang memutus berita acara.';
  end if;

  select aset_id into v_aset_id
    from public.berita_acara
   where id = p_ba_id;
  if not found then
    raise exception 'Berita acara "%" tidak ditemukan.', p_ba_id;
  end if;

  -- Hanya BA yang sudah diproses BMN (nomor surat terisi) yang boleh diputus.
  if not exists (
    select 1 from public.berita_acara
     where id = p_ba_id and status = 'Diproses'
  ) then
    raise exception 'Berita acara hanya diputus saat status "Diproses" (nomor surat sudah diisi BMN).';
  end if;

  if not p_setujui and coalesce(p_alasan, '') = '' then
    raise exception 'Alasan penolakan wajib diisi.';
  end if;

  update public.berita_acara
     set status = case when p_setujui then 'Disetujui' else 'Ditolak' end,
         alasan_penolakan = case when p_setujui then '' else coalesce(p_alasan, '') end,
         tanggal_update = current_date
   where id = p_ba_id;

  -- Aset terkait hanya berlaku bila BA tersambung ke aset.
  if v_aset_id is not null and v_aset_id <> '' then
    if p_setujui then
      update public.asets set status = 'Maintenance' where id = v_aset_id;
      insert into public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
        values (
          v_aset_id, current_date, 'Berita Acara Disetujui',
          case when coalesce(p_alasan, '') = ''
               then 'Berita acara disetujui KAKANSAR — aset dikirim ke unit service.'
               else p_alasan end,
          v_nip
        );
    else
      insert into public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
        values (v_aset_id, current_date, 'Berita Acara Ditolak', p_alasan, v_nip);
    end if;
  end if;
end;
$$;

grant execute on function public.putuskan_berita_acara(text, boolean, text)
  to authenticated;

-- ─── 3. RPC: cek duplikasi checklist (satu kendaraan satu checklist/hari) ───
-- Dipakai form "Buat Checklist" sebelum menyimpan. SECURITY DEFINER karena
-- RLS membatasi AKUNTOR hanya melihat checklist miliknya sendiri, sementara
-- duplikasi harus terdeteksi lintas pemeriksa (operator PJ vs akun kantor).
create or replace function public.cek_checklist_sudah_ada(
  p_aset_id text,
  p_tanggal date,
  p_exclude_id text default null
) returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.checklist_harian
    where aset_id = p_aset_id
      and tanggal = p_tanggal
      and id is distinct from p_exclude_id
  );
$$;

grant execute on function public.cek_checklist_sudah_ada(text, date, text)
  to authenticated;

-- ─── 4. Pengaman duplikasi di level database ────────────────────────────────
-- 4a. Bersihkan duplikat lama (jika ada): simpan baris terbaru per
--     (aset_id, tanggal). berita_acara.checklist_id tidak berkunci asing,
--     jadi penghapusan aman.
DO $$
DECLARE
  v_terhapus integer;
BEGIN
  WITH dup AS (
    SELECT id
    FROM (
      SELECT id,
             row_number() OVER (
               PARTITION BY aset_id, tanggal
               ORDER BY created_at DESC, id DESC
             ) AS urut,
             count(*) OVER (PARTITION BY aset_id, tanggal) AS jumlah
      FROM public.checklist_harian
      WHERE aset_id IS NOT NULL AND tanggal IS NOT NULL
    ) x
    WHERE jumlah > 1 AND urut > 1
  )
  DELETE FROM public.checklist_harian c
  USING dup
  WHERE c.id = dup.id;
  GET DIAGNOSTICS v_terhapus = ROW_COUNT;
  RAISE NOTICE 'Dedup checklist_harian: % baris duplikat lama dibuang.', v_terhapus;
END $$;

-- 4b. Index unik parsial: satu checklist per kendaraan per tanggal.
--     Baris dengan aset_id NULL (peralatan manual) tidak dibatasi.
CREATE UNIQUE INDEX IF NOT EXISTS checklist_harian_aset_tanggal_uniq
  ON public.checklist_harian (aset_id, tanggal)
  WHERE aset_id IS NOT NULL AND tanggal IS NOT NULL;

-- ─── 5. Verifikasi ───────────────────────────────────────────────────────────
-- Cek role yang ada di public.users (harus sudah termasuk AKUNTOR setelah
-- script create-supabase-users-v3.mjs dijalankan):
select role, count(*) as total
from public.users
group by role
order by role;

-- Cek RLS policies aktif di checklist_harian:
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'checklist_harian'
order by policyname;

-- Cek index unik sudah terpasang:
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'checklist_harian';
