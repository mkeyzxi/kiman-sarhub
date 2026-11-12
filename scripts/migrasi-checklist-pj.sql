-- ============================================================================
-- MIGRASI: Operasional checklist lintas-user (PJ + operator tanpa PJ)
--
-- Kebutuhan:
--   1. Operator lapangan penanggung jawab (PJ) kendaraan bisa MELIHAT &
--      MEMVALIDASI (edit) checklist harian milik akun akuntor untuk
--      kendaraan yang ia tanggung jawabkan (pemeriksa_id ≠ NIP PJ).
--   2. Operator lapangan TANPA tanggung jawab kendaraan bisa MELIHAT semua
--      checklist (termasuk yang belum lengkap) untuk kebutuhan operasional.
--   3. Bila validasi PJ mengoreksi semua item rusak menjadi "Baik", aset
--      kembali berstatus "Baik" / "Standby" TANPA membuat Berita Acara.
--
-- Jalankan di: Supabase Dashboard → SQL Editor.
-- Idempoten: aman dijalankan berulang.
--
-- CATATAN: script ini MENGHAPUS policy `checklist_update_owner` yang dibuat
-- oleh migrasi `migrasi-tambah-created-by-logbook.sql` bila sudah ada, lalu
-- menggantikannya dengan policy yang lebih luas (menambah klausul PJ).
-- ============================================================================

-- ─── 0a. Helper: aset terkait checklist adalah milik user (PJ) ────────────
-- SECURITY DEFINER agar operator (RLS terbatas di tabel `asets`) tetap bisa
-- membaca relasi aset. `stable` supaya planner bisa meng-cache.
create or replace function public.aset_pj_saya(p_checklist_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.checklist_harian c
      join public.asets a on a.id = c.aset_id
     where c.id = p_checklist_id
       and coalesce(a.penanggung_jawab, '') = public.nip_jwt()
       and public.role_jwt() in ('OPERATOR_LAPANGAN', 'AKUNTOR')
  );
$$;

grant execute on function public.aset_pj_saya(text) to authenticated;

-- ─── 0b. Helper: aset BA terkait adalah aset milik user (PJ) ──────────────
create or replace function public.ba_aset_pj_saya(p_aset_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(p_aset_id, '') <> ''
    and exists (
      select 1 from public.asets a
       where a.id = p_aset_id
         and coalesce(a.penanggung_jawab, '') = public.nip_jwt()
         and public.role_jwt() in ('OPERATOR_LAPANGAN', 'AKUNTOR')
    );
$$;

grant execute on function public.ba_aset_pj_saya(text) to authenticated;

-- ─── 0c. Helper: user tidak punya PJ aset apa pun ─────────────────────────
create or replace function public.tanpa_pj_aset()
returns boolean
language sql stable security definer set search_path = public
as $$
  select not exists (
    select 1 from public.asets a
    where coalesce(a.penanggung_jawab, '') = public.nip_jwt()
  );
$$;

grant execute on function public.tanpa_pj_aset() to authenticated;

-- ─── 1. RLS SELECT checklist: perluas visibilitas ─────────────────────────
-- ADMIN_IT / PENGELOLA_BMN / KAKANSAR lihat semua (status quo).
-- OPERATOR_LAPANGAN / AKUNTOR:
--   • checklist miliknya sendiri (pemeriksa_id = NIP) — status quo;
--   • ATAU checklist di aset yang ia tanggung jawabkan (PJ) — baru;
--   • ATAU SEMUA checklist bila ia tidak punya PJ aset apa pun — baru.
drop policy if exists checklist_select on public.checklist_harian;
create policy checklist_select on public.checklist_harian
  for select to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'KAKANSAR')
    or pemeriksa_id = public.nip_jwt()
    or public.aset_pj_saya(id)
    or (
      public.role_jwt() = 'OPERATOR_LAPANGAN'
      and public.tanpa_pj_aset()
    )
  );

-- ─── 2. RLS UPDATE checklist: PJ boleh memvalidasi ────────────────────────
-- Ganti `checklist_update_owner` (dari migrasi sebelumnya, ketat) dengan
-- policy yang lebih luas: admin/pengelola (boleh_tulis_aset), pemeriksa,
-- ATAU PJ aset.
drop policy if exists checklist_update_owner on public.checklist_harian;
drop policy if exists checklist_update_self on public.checklist_harian;
create policy checklist_update_self on public.checklist_harian
  for update to authenticated
  using (
    public.boleh_tulis_aset()
    or pemeriksa_id = public.nip_jwt()
    or public.aset_pj_saya(id)
  )
  with check (
    public.boleh_tulis_aset()
    or pemeriksa_id = public.nip_jwt()
    or public.aset_pj_saya(id)
  );

-- ─── 3. RPC: kembalikan aset ke "Baik" setelah validasi PJ ───────────────
-- Keamanan: hanya PJ aset atau admin/pengelola yang bisa memulihkan.
-- Menulis status + kondisi aset menjadi "Standby"/"Baik" dan mencatat
-- riwayat. Idempoten: aman dipanggil ulang bila aset sudah "Baik".
create or replace function public.kembalikan_aset_baik(
  p_aset_id text,
  p_keterangan text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.role_jwt();
  v_nip  text := public.nip_jwt();
  v_pj   text;
begin
  if v_role not in ('OPERATOR_LAPANGAN','AKUNTOR','ADMIN_IT','PENGELOLA_BMN') then
    raise exception 'Hanya operator lapangan, akun kantor, atau Admin IT yang memulihkan aset.';
  end if;

  select coalesce(penanggung_jawab, '') into v_pj
    from public.asets
   where id = p_aset_id;
  if not found then
    raise exception 'Aset dengan ID "%" tidak ditemukan.', p_aset_id;
  end if;

  -- Operator lapangan / akuntor hanya boleh memulihkan aset MILIKNYA.
  if v_role in ('OPERATOR_LAPANGAN','AKUNTOR')
     and coalesce(v_pj, '') <> v_nip then
    raise exception 'Anda bukan penanggung jawab aset ini.';
  end if;

  update public.asets
     set status  = 'Standby',
         kondisi = 'Baik'
   where id = p_aset_id;

  insert into public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
  values (p_aset_id, current_date, 'Validasi kembali Baik',
          coalesce(nullif(p_keterangan, ''), 'PJ memvalidasi: kondisi baik, tanpa kerusakan.'),
          v_nip);
end;
$$;

grant execute on function public.kembalikan_aset_baik(text, text) to authenticated;

-- ─── 4. RLS Berita Acara: PJ boleh INSERT & UPDATE BA (sebagai pengaju) ──
-- Perluas: operator PJ aset bisa membuat/mengisi BA untuk aset miliknya
-- (alur: akuntor membuat checklist rusak → PJ memvalidasi → PJ membuat BA
-- dan menyerahkan, dengan PJ sebagai pengaju/penandatangan).
drop policy if exists ba_insert on public.berita_acara;
create policy ba_insert on public.berita_acara
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
    or public.ba_aset_pj_saya(aset_id)
  );

drop policy if exists ba_update on public.berita_acara;
create policy ba_update on public.berita_acara
  for update to authenticated
  using (
    public.boleh_tulis_aset()
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
    or public.ba_aset_pj_saya(aset_id)
  )
  with check (
    public.boleh_tulis_aset()
    or coalesce(pengaju_id, '') in ('', public.nip_jwt())
    or public.ba_aset_pj_saya(aset_id)
  );

-- ============================================================================
-- VERIFIKASI (opsional, jalankan setelah migrasi):
--
--   select policyname, qual from pg_policies
--    where schemaname='public' and tablename='checklist_harian'
--    and command='SELECT';
--
--   -- Uji: sebagai operator PJ, bisa lihat checklist milik akuntor untuk aset
--   --   yang ia tanggung jawabkan.
--   -- Uji: sebagai operator tanpa PJ, bisa lihat semua checklist.
-- ============================================================================
