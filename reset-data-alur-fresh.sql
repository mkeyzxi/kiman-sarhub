-- ============================================================
-- RESET & SEGARKAN DATA ALUR — dashboard-siap-sar
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempoten (blok utama) — aman dijalankan ulang.
--
-- TUJUAN:
--   Dimulai dari data master yang berjalan SEKARANG (tidak mengubah
--   akun/aset), seluruh jejak alur lama dibersihkan, status seluruh
--   aset kembali "Standby · Baik", supaya alur berita acara oke &
--   tiket maintenance bisa didemonstrasikan dari nol dengan jejak baru.
--
-- DIPERTAHANKAN (tidak disentuh):
--   ✳ public.users                  — akun & NIP login (JANGAN dihapus!)
--   ✳ public.asets                  — baris aset dipertahankan; hanya
--                                     STATUS & KONDISI yang direset
--   ✳ checklist_templates + items   — master butir perawatan
--   ✳ logbook_perjalanan            — catatan dinas operator riil
--
-- DIKOSONGKAN (jejak alur lama — akan diisi ulang dari aplikasi):
--   berita_acara, ews_tickets, riwayat_aset, antrean_verifikasi,
--   approvals, activity_log, riwayat_operasi, notifications,
--   checklist_harian
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1) KOSONGKAN JEJAK ALUR LAMA
--    Urutan aman FK: anak → induk.
-- ────────────────────────────────────────────────────────────
DELETE FROM public.berita_acara;        -- rujuk ews_tickets/asets/users
DELETE FROM public.ews_tickets;         -- rujuk asets/users
DELETE FROM public.antrean_verifikasi;
DELETE FROM public.approvals;
DELETE FROM public.riwayat_aset;        -- jejak perubahan aset lama
DELETE FROM public.activity_log;        -- log kegiatan lama
DELETE FROM public.riwayat_operasi;
DELETE FROM public.notifications;
DELETE FROM public.checklist_harian;    -- hasil pemeriksaan harian lama

-- (Opsional) Kosongkan juga logbook dinas — hapus tanda "--" dua baris di
-- bawah bila memang ingin jejak logbook ikut segar:
-- DELETE FROM public.logbook_perjalanan;

-- ────────────────────────────────────────────────────────────
-- 2) SEMUA ASET KEMBALI "Standby · Baik"
-- ────────────────────────────────────────────────────────────
UPDATE public.asets
   SET status  = 'Standby',
       kondisi = 'Baik'
 WHERE status <> 'Standby'
    OR kondisi <> 'Baik';

COMMIT;

-- ============================================================
-- OPSIONAL — CONTOH JEJAK ALUR BARU (biarkan terkomentar bila
-- alur mau didemonstrasikan LANGSUNG dari aplikasi).
-- ============================================================
-- Jika diaktifkan: siapkan SATU jejak lengkap & konsisten yang baru
-- (tanggal = hari ini) memakai data master yang ADA sekarang:
--   • Aset      : ast-012  (Rescue Car Type II · ISUZU, DC 8978)
--   • PJ+Pengaju: 200001052025211020 (Haerul Vikra, Operator)
--   • BMN       : 199810212022032001
--   • KAKANSAR  : 198208042009121003
-- Catatan: blok ini DIRANCANG dijalankan SEKALI (tanpa pengaman ganda).
--
-- BEGIN;
--
-- -- 2a) Checklist harian operator (lengkap, tanpa temuan rusak)
-- INSERT INTO public.checklist_harian
--   (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id,
--    aset_id, status, item_checked, item_total, items, catatan)
-- VALUES
--   ('chk-fresh-1', CURRENT_DATE,
--    'Rescue Car Type II ISUZU Dmax Double Cabin (DC 8978)',
--    'Darat', NULL, 'Haerul Vikra', '200001052025211020',
--    'ast-012', 'Lengkap', 0, 0, '[]'::jsonb,
--    'Pemeriksaan rutin pagi — kendaraan siap operasional.');
--
-- -- 2b) Berita acara: draf → serahkan → DIPROSES BMN (nomor) → DISETUJUI KAKANSAR
-- INSERT INTO public.berita_acara
--   (id, tanggal, nama_aset, kode_aset, nomor, aset_id, checklist_id,
--    tiket_id, pengaju_id, pelapor, pelapor_jabatan, pengaju_nama,
--    pengaju_jabatan, tanggal_buat, tanggal_update, status, kendala,
--    foto_bukti, uraian, alasan_penolakan, keterangan)
-- VALUES
--   ('ba-fresh-1', CURRENT_DATE, 'Rescue Car Type II',
--    '3020105129-000005', '001/BA/KNL.01/2026', 'ast-012', 'chk-fresh-1',
--    'ews-fresh-1', '200001052025211020', 'Haerul Vikra',
--    'Operator Lapangan', 'Haerul Vikra', 'Operator Lapangan',
--    CURRENT_DATE, CURRENT_DATE, 'Disetujui',
--    '[{"label":"Winch","merk":"Standar","jumlah":"1 set",
--       "keterangan":"Dudukan winch longgar — perlu dikerjakan unit service.",
--       "sifat":"Ringan"}]'::jsonb,
--    '[]'::jsonb,
--    'Unit dikirim ke unit service untuk pengetatan dudukan winch.',
--    '',
--    'Diajukan berdasarkan checklist harian dan disetujui KAKANSAR.');
--
-- -- 2c) Tiket maintenance hasil BA (sudah selesai perbaikan)
-- INSERT INTO public.ews_tickets
--   (id, aset_id, judul, deskripsi, tingkat_keparahan, status,
--    tanggal_buat, tanggal_update, assigned_to)
-- VALUES
--   ('ews-fresh-1', 'ast-012',
--    'Perbaikan dudukan winch Rescue Car Type II',
--    'Diterbitkan dari berita acara ba-fresh-1 — dikerjakan PJ aset.',
--    'Sedang', 'Selesai', CURRENT_DATE, CURRENT_DATE,
--    '200001052025211020');
--
-- -- 2d) Jejak riwayat aset yang segar (3 tahap alur)
-- INSERT INTO public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
-- VALUES
--   ('ast-012', CURRENT_DATE, 'Serahkan ke BMN',
--    'Item rusak: Winch — diberitahukan lewat berita acara.',
--    '200001052025211020'),
--   ('ast-012', CURRENT_DATE, 'Berita Acara Disetujui',
--    'Berita acara disetujui KAKANSAR — aset dikirim ke unit service.',
--    '198208042009121003'),
--   ('ast-012', CURRENT_DATE, 'Maintenance Selesai',
--    'Perbaikan selesai — aset kembali standby dan siap operasional.',
--    '200001052025211020');
--
-- -- 2e) Satu log kegiatan + notifikasi segar
-- INSERT INTO public.activity_log
--   (id, user_id, aksi, target, tanggal, detail)
-- VALUES
--   ('act-fresh-1', '199810212022032001', 'Merilis berita acara',
--    'ba-fresh-1', CURRENT_DATE,
--    'Nomor 001/BA/KNL.01/2026 diproses Pengelola BMN lalu disetujui.');
--
-- INSERT INTO public.notifications
--   (id, judul, pesan, tipe, dibaca, tanggal)
-- VALUES
--   ('ntf-fresh-1', 'Berita Acara Disetujui',
--    'BA 001/BA/KNL.01/2026 disetujui — tiket maintenance ews-fresh-1 selesai; aset kembali Standby.',
--    'info', false, CURRENT_DATE);
--
-- COMMIT;

-- ============================================================
-- VERIFIKASI (tampil di panel "Results" SQL Editor)
-- ============================================================
-- Berita acara/tiket/riwayat/checklist/notifikasi/log/aset_bukan_standby
-- harus 0. users & asets DIPERTAHANKAN (tetap > 0):
SELECT
  (SELECT count(*) FROM public.berita_acara)      AS berita_acara,
  (SELECT count(*) FROM public.ews_tickets)       AS ews_tickets,
  (SELECT count(*) FROM public.riwayat_aset)      AS riwayat_aset,
  (SELECT count(*) FROM public.checklist_harian)  AS checklist_harian,
  (SELECT count(*) FROM public.notifications)     AS notifications,
  (SELECT count(*) FROM public.activity_log)      AS activity_log,
  (SELECT count(*) FROM public.users)             AS users_dipertahankan,
  (SELECT count(*) FROM public.asets)             AS asets_dipertahankan,
  (SELECT count(*) FROM public.asets
    WHERE status <> 'Standby' OR kondisi <> 'Baik') AS aset_bukan_standby;
