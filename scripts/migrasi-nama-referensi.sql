-- ============================================================
-- MIGRASI: menambah kolom nama_referensi pada tabel public.asets
--
-- Nama referensi adalah label singkat untuk memudahkan pengguna
-- mengidentifikasi aset (mis. "mobil dinas kakansar", "motor tempel").
--
-- Idempoten — aman dijalankan berulang kali.
-- ============================================================

-- 1. Tambahkan kolom jika belum ada
alter table public.asets
  add column if not exists nama_referensi text;

comment on column public.asets.nama_referensi is
  'Nama referensi singkat untuk identifikasi aset oleh pengguna (mis. mobil dinas kakansar, motor tempel). Kolom opsional.';

-- 2. Isian awal berdasarkan aturan mapping (meniru fungsi namaReferensiAset di frontend)
update public.asets
   set nama_referensi = case
       when upper(kode_barang) = '3020105058'
            and upper(coalesce(merk, '')) = 'TOYOTA'
            and upper(coalesce(tipe, '')) = 'TF36'
            then 'mobil dinas kakansar'
       when lower(coalesce(nama, '')) like '%out boat motor%'
            or lower(coalesce(nama, '')) like '%outboard motor%'
            or lower(coalesce(nama, '')) like '%speed boat%'
            then 'motor tempel'
       when upper(coalesce(kategori, '')) = 'MOBIL'
            and (upper(coalesce(tipe, '')) like '%TF36%'
                 or lower(coalesce(nama, '')) like '%dinas%')
            then 'mobil dinas'
       when coalesce(tipe, '') is not null and tipe <> ''
            then tipe
       when coalesce(merk, '') is not null and merk <> ''
            then merk
       else coalesce(nama, '')
     end
 where coalesce(nama_referensi, '') = '';

-- 3. Verifikasi: cek beberapa baris untuk memastikan isian terisi
select id, nama, kode_barang, merk, tipe, nama_referensi
  from public.asets
 order by id;
