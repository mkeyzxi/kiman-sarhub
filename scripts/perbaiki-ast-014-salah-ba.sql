-- ============================================================
-- PERBAIKI AST-014 — BA SALAH MENGARAH KE AST-012
-- ============================================================
-- MASALAH:
--   Checklist chk-1793521405062 untuk ast-014, tapi BA-nya
--   salah dibuat untuk ast-012 (unit kembar bernama sama).
--   Tiket ews-007 juga mengarah ast-012 (salah).
--
-- PERBAIKAN:
--   1. BA ba-1793521407605 diubah aset_id → ast-014 (yang benar).
--   2. Tiket ews-007 diubah aset_id → ast-014.
--   3. Riwayat aset yang tertukar diperbaiki (ast-012 dikembalikan
--      Standby, ast-014 dapat jejak perbaikan lengkap).
--   4. ast-012 kembali Standby·Baik (tidak pernah rusak).
--   5. ast-014 → Standby·Baik (perbaikan selesai).
-- ============================================================

BEGIN;

-- 1) Perbaiki BA — aset_id dari ast-012 → ast-014
UPDATE public.berita_acara
   SET aset_id  = 'ast-014',
       kode_aset = '3020105129-000008'
 WHERE id = 'ba-1793521407605';

-- 2) Perbaiki tiket — aset_id dari ast-012 → ast-014
UPDATE public.ews_tickets
   SET aset_id = 'ast-014'
 WHERE id = 'ews-007';

-- 3) Hapus riwayat salah ast-012 (tidak pernah rusak)
DELETE FROM public.riwayat_aset
 WHERE aset_id = 'ast-012'
   AND tanggal = '2026-11-01';

-- 4) ast-012 kembali Standby·Baik (tidak pernah rusak)
UPDATE public.asets
   SET status  = 'Standby',
       kondisi = 'Baik'
 WHERE id = 'ast-012';

-- 5) ast-014 → Standby·Baik (perbaikan selesai — tiket Selesai)
UPDATE public.asets
   SET status  = 'Standby',
       kondisi = 'Baik'
 WHERE id = 'ast-014';

-- 6) Tambah riwayat yang hilang untuk ast-014 (lengkap 3 tahap)
INSERT INTO public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
VALUES
  ('ast-014', '2026-11-01', 'Berita Acara Disetujui',
   'Berita acara disetujui KAKANSAR — aset dikirim ke unit service.',
   '198208042009121003'),
  ('ast-014', '2026-11-01', 'Maintenance Selesai',
   'Perbaikan selesai — aset kembali standby dan siap operasional.',
   '198908082010121001');

COMMIT;

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT
  (SELECT status || ' · ' || kondisi FROM public.asets WHERE id = 'ast-012') AS ast012_seharusnya_standby_baik,
  (SELECT status || ' · ' || kondisi FROM public.asets WHERE id = 'ast-014') AS ast014_seharusnya_standby_baik,
  (SELECT aset_id FROM public.berita_acara WHERE id = 'ba-1793521407605') AS ba_seharusnya_ast014,
  (SELECT aset_id FROM public.ews_tickets WHERE id = 'ews-007') AS tiket_seharusnya_ast014,
  (SELECT count(*) FROM public.asets WHERE status <> 'Standby' OR kondisi <> 'Baik') AS aset_tidak_standby_seharusnya_0;
