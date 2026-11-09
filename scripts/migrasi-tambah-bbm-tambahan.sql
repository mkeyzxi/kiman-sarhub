-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRASI: Kolom BBM Tambahan pada logbook_perjalanan
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Idempoten — aman dijalankan ulang.
--
-- Menambah kolom `bbm_tambahan` (persen, opsional) untuk mencatat pengisian
-- BBM di tengah perjalanan. Diisi pada tahap 2 (Lengkapi Pencatatan).
-- Sambil menyelamatkan: kolom `kecepatan_rata` ikut dijamin ada bila belum.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.logbook_perjalanan
  ADD COLUMN IF NOT EXISTS bbm_tambahan text;

ALTER TABLE public.logbook_perjalanan
  ADD COLUMN IF NOT EXISTS kecepatan_rata text;

-- ─── Verifikasi ──────────────────────────────────────────────────────────────
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'logbook_perjalanan'
order by ordinal_position;
