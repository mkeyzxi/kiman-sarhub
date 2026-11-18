-- ==========================================================
-- Migrasi: Hubungkan logbook_perjalanan ke riwayat_operasi
-- ==========================================================
--
-- Tujuan: Tandai logbook sebagai "operasi SAR" agar otomatis
-- tercatat di bagian Riwayat Operasi (halaman /pimpinan/laporan).
--
-- Alur:
--   1. Operator centang "Ini operasi" + pilih jenis di form
--      logbook lengkap (tahap 2).
--   2. RPC generate_riwayat_dari_logbook dipanggil → insert
--      ke tabel riwayat_operasi.
--   3. Kolom adalah_operasi + jenis_operasi + riwayat_operasi_id
--      disimpan di logbook untuk traceability.
--
-- Perubahan:
--   A. Tambah 3 kolom di logbook_perjalanan
--   B. Tambah 1 kolom di riwayat_operasi (logbook_id)
--   C. Buat RPC SECURITY DEFINER generate_riwayat_dari_logbook
--   D. Update RLS riwayat_operasi (izinkan operator insert via RPC)
--
-- Catatan: Jalankan SESETAHU `seed-supabase-data.sql` sudah dieksekusi.

-- ─── A. Tambah kolom di logbook_perjalanan ───────────────────────────────
alter table public.logbook_perjalanan
  add column if not exists adalah_operasi boolean not null default false,
  add column if not exists jenis_operasi   text,
  add column if not exists riwayat_operasi_id text;

comment on column public.logbook_perjalanan.adalah_operasi is
  'true = logbook ini tercatat sebagai operasi SAR/evakuasi; false = patroli/operasi rutin';
comment on column public.logbook_perjalanan.jenis_operasi is
  'Kategori operasi: SAR, Evakuasi, Latihan, Patroli, Lainnya';
comment on column public.logbook_perjalanan.riwayat_operasi_id is
  'FK → public.riwayat_operasi(id); diisi otomatis saat generate_riwayat_dari_logbook dipanggil';

-- ─── B. Tambah kolom di riwayat_operasi (FK balik) ────────────────────────
alter table public.riwayat_operasi
  add column if not exists logbook_id text;

comment on column public.riwayat_operasi.logbook_id is
  'FK → public.logbook_perjalanan(id); sumber operasi (bila di-generate dari logbook)';

-- ─── C. RPC: generate_riwayat_dari_logbook ───────────────────────────────
-- Dipanggil dari klien saat operator centang "Ini operasi" + submit
-- logbook tahap 2. SECURITY DEFINER karena operator tidak punya izin
-- INSERT langsung ke riwayat_operasi (RLS hanya untuk ADMIN_IT/PENGELOLA_BMN).
--
-- Parameter:
--   p_logbook_id   ID logbook yang mau di-generate
--   p_jenis       Kategori operasi (SAR/Evakuasi/Latihan/Patroli/Lainnya)
--   p_hasil       Hasil operasi (Berhasil/Sebagian Berhasil/Gagal)
--   p_keterangan  Catatan bebas (opsional)
--
-- Return: ID riwayat_operasi yang baru dibuat.
create or replace function public.generate_riwayat_dari_logbook(
  p_logbook_id   text,
  p_jenis        text,
  p_hasil        text,
  p_keterangan   text default ''
) returns public.riwayat_operasi
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  text := public.role_jwt();
  v_nip   text := public.nip_jwt();
  v_log   public.logbook_perjalanan%rowtype;
  v_riw   public.riwayat_operasi%rowtype;
  v_id    text;
  v_durasi text;
begin
  if v_role not in ('OPERATOR_LAPANGAN', 'AKUNTOR', 'ADMIN_IT', 'PENGELOLA_BMN') then
    raise exception 'Hanya operator, akun kantor, atau admin yang bisa catat operasi dari logbook.';
  end if;

  -- Ambil data logbook (harus ada & status "Selesai" agar durasi bisa dihitung)
  select * into v_log from public.logbook_perjalanan where id = p_logbook_id;
  if not found then
    raise exception 'Logbook dengan ID "%" tidak ditemukan.', p_logbook_id;
  end if;

  -- Hitung durasi (jam:menit) dari jam berangkat/kembali
  if v_log.jam_berangkat is not null and v_log.jam_kembali is not null then
    v_durasi := public.hitung_durasi_logbook(v_log.jam_berangkat, v_log.jam_kembali);
  else
    v_durasi := 'Belum kembali';
  end if;

  -- Cek apakah sudah ada riwayat untuk logbook ini (anti-duplikat)
  if v_log.riwayat_operasi_id is not null then
    select * into v_riw from public.riwayat_operasi where id = v_log.riwayat_operasi_id;
    if found then
      -- Update field yang bisa berubah (jenis/hasil/keterangan)
      update public.riwayat_operasi
         set jenis      = p_jenis,
             hasil      = p_hasil,
             keterangan = p_keterangan,
             tanggal    = v_log.tanggal
       where id = v_log.riwayat_operasi_id;
      return (select * from public.riwayat_operasi where id = v_log.riwayat_operasi_id);
    end if;
  end if;

  -- Buat ID baru (prefiks "op-" selaras dengan seed)
  v_id := 'op-lp-' || replace(p_logbook_id, '-', '') || '-' || to_char(now(), 'YYYYMMDDHH24MISS');

  insert into public.riwayat_operasi (
    id, tanggal, jenis, lokasi, durasi, personel, hasil, keterangan, logbook_id
  ) values (
    v_id,
    v_log.tanggal,
    p_jenis,
    coalesce(v_log.tujuan, v_log.rute),
    v_durasi,
    coalesce(v_log.jumlah_personel, 0),
    p_hasil,
    p_keterangan,
    p_logbook_id
  )
  returning * into v_riw;

  -- Simpan FK balik di logbook
  update public.logbook_perjalanan
     set adalah_operasi     = true,
         jenis_operasi      = p_jenis,
         riwayat_operasi_id = v_id
   where id = p_logbook_id;

  return v_riw;
end;
$$;

grant execute on function public.generate_riwayat_dari_logbook(text, text, text, text)
  to authenticated;

-- ─── Helper: hitung durasi logbook (jam:menit) ──────────────────────────
-- Dipakai generate_riwayat_dari_logbook. Hasil: "HH:MM" (selisih jam
-- berangkat → kembali). Negatif/0 → "0:00".
create or replace function public.hitung_durasi_logbook(
  p_jam_berangkat text,
  p_jam_kembali   text
) returns text
language plpgsql
immutable
as $$
declare
  v_jh integer; v_jm integer;
  v_kh integer; v_km integer;
  v_selisih integer;
begin
  if p_jam_berangkat is null or p_jam_kembali is null then
    return '0:00';
  end if;

  -- Parse "HH:MM"
  v_jh := split_part(p_jam_berangkat, ':', 1)::integer;
  v_jm := split_part(p_jam_berangkat, ':', 2)::integer;
  v_kh := split_part(p_jam_kembali,   ':', 1)::integer;
  v_km := split_part(p_jam_kembali,   ':', 2)::integer;

  v_selisih := (v_kh * 60 + v_km) - (v_jh * 60 + v_jm);
  if v_selisih < 0 then
    -- Jam kembali lewat tengah malam (mis. berangkat 23:00, kembali 01:00)
    v_selisih := v_selisih + (24 * 60);
  end if;

  return lpad(floor(v_selisih / 60)::text, 2, '0') || ':' || lpad(v_selisih % 60, 2, '0');
end;
$$;

-- ─── D. Update RLS: operator boleh UPDATE logbook sendiri (sudah ada),
-- ─── tapi tidak perlu ubah RLS riwayat_operasi karena insert lewat RPC
-- ─── SECURITY DEFINER. RLS riwayat_operasi tetap: SELECT for all,
-- ─── INSERT/UPDATE/DELETE for ADMIN_IT/PENGELOLA_BMN (sudah ada).
-- ─── Tidak ada perubahan RLS yang dibutuhkan.

-- ─── Verifikasi ──────────────────────────────────────────────────────────
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'logbook_perjalanan'
--    AND column_name in ('adalah_operasi','jenis_operasi','riwayat_operasi_id')
--  ORDER BY ordinal_position;

-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_name = 'riwayat_operasi'
--    AND column_name = 'logbook_id';

-- \df+ public.generate_riwayat_dari_logbook
