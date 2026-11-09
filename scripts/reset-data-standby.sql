-- ═══════════════════════════════════════════════════════════════════════════
-- RESET DATA → SEMUA ASET STANDBY & BAIK
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempoten — aman dijalankan ulang (hasilnya selalu sama: kosong).
--
-- TUJUAN:
--   Data operasional tampil bersih — tidak ada rusak/rusak berat,
--   tidak ada perjalanan, semua aset berstatus "Standby" berkondisi "Baik".
--
-- DIKOSONGKAN (isi data dihapus permanen, strukturnya tetap):
--   berita_acara        — laporan kerusakan via BA
--   checklist_harian    — hasil checklist perawatan
--   ews_tickets         — tiket maintenance
--   logbook_perjalanan  — perjalanan dinas (di-supergelapkan → kosong)
--   riwayat_aset        — riwayat aksi aset
--   antrean_verifikasi  — antrean verifikasi BMN
--   notifications       — notifikasi in-app
--   activity_log        — log aktivitas pengguna
--   riwayat_operasi     — riwayat operasi sistem
--   approvals           — PENGSEDIAAN (dihapus hanya bila tabelnya ada)
--
-- DIPERTAHANKAN (master data):
--   asets               — barisnya tetap, hanya status/kondisi di-reset
--   checklist_templates + checklist_items — template checklist harian
--     (penting: dipakai form checklist maintenance)
--   users + auth.users  — akun pengguna tidak disentuh
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Kosongkan data transaksional ────────────────────────────────────────
-- Urutan bebas — tidak ada FK antar tabel transaksional ini; semua FK-nya
-- mengarah ke master data (asets/users/templates) yang dipertahankan.

DELETE FROM public.berita_acara;
DELETE FROM public.checklist_harian;
DELETE FROM public.ews_tickets;
DELETE FROM public.logbook_perjalanan;
DELETE FROM public.riwayat_aset;
DELETE FROM public.antrean_verifikasi;
DELETE FROM public.notifications;
DELETE FROM public.activity_log;
DELETE FROM public.riwayat_operasi;

-- approvals: tabel pengsedialan (belum pasti ada di semua environment).
DO $$
BEGIN
  IF to_regclass('public.approvals') IS NOT NULL THEN
    DELETE FROM public.approvals;
    RAISE NOTICE 'Tabel approvals dibersihkan.';
  ELSE
    RAISE NOTICE 'Tabel approvals tidak ada — dilewati.';
  END IF;
END $$;

-- ─── 2. Reset status semua aset → Standby & Baik ────────────────────────────
-- Mencakup semua status lama: Rusak Ringan, Rusak Berat, Maintenance,
-- dan "Sedang digunakan" (perjalanan/tugas) → kembali Standby.
UPDATE public.asets
   SET status      = 'Standby',
       kondisi     = 'Baik',
       updated_at  = now();

-- ─── 3. Verifikasi ───────────────────────────────────────────────────────────
-- 3a. Semua aset harus Standby + Baik:
select status, kondisi, count(*) as jumlah
from public.asets
group by status, kondisi
order by status, kondisi;

-- 3b. Tabel transaksional harus 0 baris:
select 'berita_acara' as tabel, count(*) from public.berita_acara
union all select 'checklist_harian', count(*) from public.checklist_harian
union all select 'ews_tickets', count(*) from public.ews_tickets
union all select 'logbook_perjalanan', count(*) from public.logbook_perjalanan
union all select 'riwayat_aset', count(*) from public.riwayat_aset
union all select 'antrean_verifikasi', count(*) from public.antrean_verifikasi
union all select 'notifications', count(*) from public.notifications
union all select 'activity_log', count(*) from public.activity_log
union all select 'riwayat_operasi', count(*) from public.riwayat_operasi;

-- 3c. Template checklist harus tetap ada (tidak terhapus):
select count(*) as jumlah_template from public.checklist_templates;
select periode, count(*) as jumlah from public.checklist_templates
group by periode order by periode;
