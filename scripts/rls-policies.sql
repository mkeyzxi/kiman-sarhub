-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — dashboard-siap-sar
-- ═══════════════════════════════════════════════════════════════════════════
-- Kebijakan per-role. Role dibaca dari JWT:
--   auth.jwt() -> 'app_metadata' ->> 'role'
-- Identitas user = NIP (kolom FK "user_id"/"pemeriksa_id"/"pengaju_id"
-- → text REFERENCES public.users(nip)), bukan UUID.
--
-- Role:
--   ADMIN_IT           → akses penuh
--   PENGELOLA_BMN      → kelola aset, berita acara, tiket, antrean
--   KAKANSAR           → kelola approvals (keputusan), baca semua
--   OPERATOR_LAPANGAN  → baca master aset & template, tulis checklist,
--                        logbook, tiket, dan berita acara miliknya sendiri
--
-- File ini IDEMPOTEN — aman dipaste ulang. Jalankan SETELAH
-- `seed-supabase-data.sql`.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Helper ─────────────────────────────────────────────────────────────--

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

-- ─── 1. Aktifkan RLS ───────────────────────────────────────────────────────--

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'asets', 'riwayat_aset', 'ews_tickets', 'antrean_verifikasi',
    'checklist_templates', 'checklist_items', 'notifications', 'activity_log',
    'riwayat_operasi', 'approvals', 'logbook_perjalanan', 'checklist_harian',
    'berita_acara'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ─── 2. users ──────────────────────────────────────────────────────────────--
drop policy if exists users_select_authenticated on public.users;
create policy users_select_authenticated on public.users
  for select to authenticated
  using (true); -- profil dibutuhkan untuk tampilan nama/NIP & embed FK

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (nip = public.nip_jwt())
  with check (nip = public.nip_jwt());
-- Pembuatan/ubah role user dilewatkan API Admin (service_role, bypass RLS).

-- ─── 3. asets ──────────────────────────────────────────────────────────────--
drop policy if exists asets_select on public.asets;
create policy asets_select on public.asets
  for select to authenticated using (true);

drop policy if exists asets_manage_bmn on public.asets;
create policy asets_manage_bmn on public.asets
  for all to authenticated
  using (public.boleh_tulis_aset())
  with check (public.boleh_tulis_aset());

-- ─── 4. riwayat_aset ───────────────────────────────────────────────────────--
drop policy if exists riwayat_aset_select on public.riwayat_aset;
create policy riwayat_aset_select on public.riwayat_aset
  for select to authenticated using (true);

drop policy if exists riwayat_aset_insert on public.riwayat_aset;
create policy riwayat_aset_insert on public.riwayat_aset
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or user_id = public.nip_jwt()
    or user_id is null
  );

-- ─── 5. checklist_templates & items ────────────────────────────────────────--
drop policy if exists tmpl_select on public.checklist_templates;
create policy tmpl_select on public.checklist_templates
  for select to authenticated using (true);

drop policy if exists tmpl_manage_admin on public.checklist_templates;
create policy tmpl_manage_admin on public.checklist_templates
  for all to authenticated
  using (public.role_jwt() = 'ADMIN_IT')
  with check (public.role_jwt() = 'ADMIN_IT');

drop policy if exists items_select on public.checklist_items;
create policy items_select on public.checklist_items
  for select to authenticated using (true);

drop policy if exists items_manage_admin on public.checklist_items;
create policy items_manage_admin on public.checklist_items
  for all to authenticated
  using (public.role_jwt() = 'ADMIN_IT')
  with check (public.role_jwt() = 'ADMIN_IT');

-- ─── 6. checklist_harian ───────────────────────────────────────────────────--
-- Operator hanya melihat checklist miliknya sendiri; role lain lihat semua.
drop policy if exists checklist_select on public.checklist_harian;
create policy checklist_select on public.checklist_harian
  for select to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'KAKANSAR')
    or pemeriksa_id = public.nip_jwt()
  );

drop policy if exists checklist_insert_self on public.checklist_harian;
create policy checklist_insert_self on public.checklist_harian
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or (public.role_jwt() = 'OPERATOR_LAPANGAN'
        and pemeriksa_id = public.nip_jwt())
  );

drop policy if exists checklist_update_self on public.checklist_harian;
create policy checklist_update_self on public.checklist_harian
  for update to authenticated
  using (
    public.boleh_tulis_aset()
    or pemeriksa_id = public.nip_jwt()
  )
  with check (
    public.boleh_tulis_aset()
    or pemeriksa_id = public.nip_jwt()
  );

drop policy if exists checklist_delete_self on public.checklist_harian;
create policy checklist_delete_self on public.checklist_harian
  for delete to authenticated
  using (public.boleh_tulis_aset());

-- ─── 7. logbook_perjalanan ─────────────────────────────────────────────────--
drop policy if exists logbook_select on public.logbook_perjalanan;
create policy logbook_select on public.logbook_perjalanan
  for select to authenticated using (true);

drop policy if exists logbook_write_operator on public.logbook_perjalanan;
create policy logbook_write_operator on public.logbook_perjalanan
  for all to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'OPERATOR_LAPANGAN')
  )
  with check (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'OPERATOR_LAPANGAN')
  );

-- ─── 8. ews_tickets ────────────────────────────────────────────────────────--
drop policy if exists tickets_select on public.ews_tickets;
create policy tickets_select on public.ews_tickets
  for select to authenticated using (true);

drop policy if exists tickets_insert on public.ews_tickets;
create policy tickets_insert on public.ews_tickets
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or (public.role_jwt() = 'OPERATOR_LAPANGAN'
        and assigned_to = public.nip_jwt())
    or assigned_to is null
  );

drop policy if exists tickets_update_bmn on public.ews_tickets;
create policy tickets_update_bmn on public.ews_tickets
  for update to authenticated
  using (public.boleh_tulis_aset() or assigned_to = public.nip_jwt())
  with check (public.boleh_tulis_aset() or assigned_to = public.nip_jwt());

-- ─── 9. berita_acara ───────────────────────────────────────────────────────--
drop policy if exists ba_select on public.berita_acara;
create policy ba_select on public.berita_acara
  for select to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'KAKANSAR')
    or pengaju_id = public.nip_jwt()
    or pengaju_id is null
  );

drop policy if exists ba_insert on public.berita_acara;
create policy ba_insert on public.berita_acara
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or pengaju_id = public.nip_jwt()
    or pengaju_id is null
  );

drop policy if exists ba_update on public.berita_acara;
create policy ba_update on public.berita_acara
  for update to authenticated
  using (
    public.boleh_tulis_aset()
    or pengaju_id = public.nip_jwt()
  )
  with check (
    public.boleh_tulis_aset()
    or pengaju_id = public.nip_jwt()
  );

-- ─── 10. approvals ─────────────────────────────────────────────────────────--
drop policy if exists approvals_select on public.approvals;
create policy approvals_select on public.approvals
  for select to authenticated using (true);

drop policy if exists approvals_insert on public.approvals;
create policy approvals_insert on public.approvals
  for insert to authenticated
  with check (
    public.boleh_tulis_aset()
    or pengajuan_oleh = public.nip_jwt()
    or pengajuan_oleh is null
  );

drop policy if exists approvals_keputusan on public.approvals;
create policy approvals_keputusan on public.approvals
  for update to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'KAKANSAR', 'PENGELOLA_BMN')
  )
  with check (
    public.role_jwt() in ('ADMIN_IT', 'KAKANSAR', 'PENGELOLA_BMN')
  );

-- ─── 11. notifications ─────────────────────────────────────────────────────--
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications
  for select to authenticated using (true);

drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications
  for update to authenticated
  using (true)          -- menandai dibaca; kolom sensitif tak ada
  with check (true);

-- ─── 12. activity_log ──────────────────────────────────────────────────────--
drop policy if exists log_select on public.activity_log;
create policy log_select on public.activity_log
  for select to authenticated
  using (
    public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN', 'KAKANSAR')
    or user_id = public.nip_jwt()
    or user_id is null
  );

drop policy if exists log_insert on public.activity_log;
create policy log_insert on public.activity_log
  for insert to authenticated with check (true);

-- ─── 13. riwayat_operasi ───────────────────────────────────────────────────--
drop policy if exists riwop_select on public.riwayat_operasi;
create policy riwop_select on public.riwayat_operasi
  for select to authenticated using (true);

drop policy if exists riwop_manage_admin on public.riwayat_operasi;
create policy riwop_manage_admin on public.riwayat_operasi
  for all to authenticated
  using (public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN'))
  with check (public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN'));

-- ─── 14. antrean_verifikasi ────────────────────────────────────────────────--
drop policy if exists antrean_select on public.antrean_verifikasi;
create policy antrean_select on public.antrean_verifikasi
  for select to authenticated using (true);

drop policy if exists antrean_manage on public.antrean_verifikasi;
create policy antrean_manage on public.antrean_verifikasi
  for all to authenticated
  using (public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN'))
  with check (public.role_jwt() in ('ADMIN_IT', 'PENGELOLA_BMN'));

-- ─── 15. anon tidak boleh apa pun ─────────────────────────────────────────--
-- RLS aktif di semua tabel, dan tidak ada policy `to anon` — akses publik
-- otomatis kosong (kolom/pengaturan tambahan tidak diperlukan).

-- ─── 16. RPC penyerahan kerusakan (operator) ──────────────────────────────--
-- Operator menyerahkan hasil checklist yang berisi kerusakan: hanya kolom
-- status + kondisi aset yang diubah, lewat fungsi SECURITY DEFINER agar
-- izin UPDATE aset penuh tidak perlu dibukakan ke role operator.
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
  v_nip   text := public.nip_jwt();
begin
  if v_role is distinct from 'OPERATOR_LAPANGAN' then
    raise exception 'Hanya operator lapangan yang menyerahkan kerusakan.';
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

-- ─── 17. VERIFIKASI (tampil di panel "Results" SQL Editor) ─────────────────
-- Setelah dijalankan, akan menampilkan jumlah policy per tabel.
-- Semua tabel master harus punya >= 1 policy `VIEW` (SELECT).
select tablename, count(*) as jumlah_policy
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;
