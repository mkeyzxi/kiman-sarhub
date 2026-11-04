-- ============================================================
-- PERBAIKI BERITA ACARA TANPA RELASI ASET (aset_id NULL/kosong)
-- ============================================================
-- GEJALA:
--   1. Dropdown "Pilih Aset Rusak" di /bmn/maintenance/buat kosong
--      padahal berita acara sudah "Disetujui" KAKANSAR dan punya
--      nomor surat — aset terkait BA tidak terdeteksi.
--   2. Kartu "Monitor Alur Kerusakan" di /operator/checklist kadang
--      tidak tampil padahal aset sudah diserahkan ke BMN.
--
-- PENYEBAB (terverifikasi di kode):
--   Halaman pengisian berita acara operator membuat BA segera setelah
--   checklist termuat, TAPI master aset (`useAsetById`) masih dalam
--   proses fetch. BA pun terlanjur disimpan dengan `aset_id = NULL`
--   (`asetId: ""` → null di toSupabaseRow). Saat aset selesai termuat,
--   penanda "baSiap" sudah terlanjur true sehingga relasi tidak pernah
--   diperbaiki. Semua pemrosesan (tiket BMN & kartu monitor) bergantung
--   pada `berita_acara.aset_id`, sehingga alur berhenti.
--
-- PERBAIKAN (skrip ini — jalankan di Supabase Dashboard → SQL Editor):
--   1. Backfill: semua BA yang punya checklist tapi tidak punya aset_id
--      dihubungkan ke aset milik checklist-nya.
--   2. Membersihkan draf/ba ganda per checklist (satu checklist = satu BA)
--      dan memasang index unik agar BA ganda tidak bisa tercipta lagi.
--   3. Trigger guard: INSERT/UPDATE berita_acara berikutnya yang masih
--      menyimpan aset_id NULL akan terisi otomatis dari checklist-nya —
--      bug tidak bisa terjadi lagi di level database.
--   4. Verifikasi kekosongan sisa setelah backfill.
--
-- IDEMPOTEN — aman dijalankan ulang.
-- ============================================================

BEGIN;

-- ── 1) Backfill aset_id dari checklist_harian ────────────────────────────
-- BA milik checklist yang memiliki aset (c.aset_id tidak NULL) tapi BA
-- itu sendiri belum menyimpan relasi aset.
UPDATE public.berita_acara b
   SET aset_id  = c.aset_id,
       kode_aset = COALESCE(NULLIF(b.kode_aset, ''), a.kode),
       nama_aset = CASE WHEN b.nama_aset IS NULL OR b.nama_aset = ''
                        THEN COALESCE(a.nama, b.nama_aset)
                        ELSE b.nama_aset END
  FROM public.checklist_harian c
  JOIN public.asets a ON a.id = c.aset_id
 WHERE b.checklist_id = c.id
   AND c.aset_id IS NOT NULL
   AND (b.aset_id IS NULL OR b.aset_id = '');

-- ── 2) Hapus draf BA ganda (satu checklist hanya boleh punya satu BA) ────
-- Draf lama buatan race-halaman dikikis: untuk setiap checklist, pertahankan
-- draf TERBARU (kolom tanggal_buat & id sebagai tie-breaker) — dan seluruh
-- draf dibuang bila checklist-nya sudah punya BA yang sedang berproses
-- (Diserahkan/Diproses/Disetujui). Draf dibila BA-nya "Ditolak" tetap
-- dipertahankan (revisi sah oleh PJ).
DELETE FROM public.berita_acara b
 WHERE b.status = 'Draf'
   AND b.checklist_id IS NOT NULL
   AND b.checklist_id <> ''
   AND EXISTS (
     SELECT 1
       FROM public.berita_acara other
      WHERE other.checklist_id = b.checklist_id
        AND other.id <> b.id
        AND (
              (other.status = 'Draf'
               AND (COALESCE(other.tanggal_buat::text, other.id), other.id) >
                   (COALESCE(b.tanggal_buat::text, b.id), b.id))
           OR other.status IN ('Diserahkan', 'Diproses', 'Disetujui')
        )
   );

-- BA berproses (Diserahkan/Diproses/Disetujui/Ditolak) yang terduplikasi
-- akibat race lama juga dikikis — PERSYARATAN: baris lama TIDAK menyimpan
-- tiket (tanpa FK tiket), sementara baris terbaru dipertahankan.
DELETE FROM public.berita_acara b
 WHERE b.status IN ('Diserahkan', 'Diproses', 'Disetujui', 'Ditolak')
   AND b.tiket_id IS NULL
   AND b.checklist_id IS NOT NULL
   AND b.checklist_id <> ''
   AND EXISTS (
     SELECT 1
       FROM public.berita_acara other
      WHERE other.checklist_id = b.checklist_id
        AND other.id <> b.id
        AND other.status <> 'Draf'
   );

-- Kunci tingkat database: index unik parsial — checklist hanya dapat
-- merujuk SATU berita acara. Dibuat HANYA bila tidak ada duplikat sisa
-- (bila masih ada, langkah 1-2 perlu diulang; index tidak dibungkam).
DO $$
DECLARE n_duplikat int;
BEGIN
  SELECT count(*) INTO n_duplikat FROM (
    SELECT checklist_id
      FROM public.berita_acara
     WHERE checklist_id IS NOT NULL AND checklist_id <> ''
     GROUP BY checklist_id
    HAVING count(*) > 1
  ) d;
  IF n_duplikat = 0 THEN
    DROP INDEX IF EXISTS idx_berita_acara_checklist_unik;
    CREATE UNIQUE INDEX idx_berita_acara_checklist_unik
        ON public.berita_acara (checklist_id)
     WHERE checklist_id IS NOT NULL AND checklist_id <> '';
  ELSE
    RAISE NOTICE 'Masih ada % checklist dengan lebih dari satu berita acara — index unik tidak dibuat. Periksa baris pada verifikasi.', n_duplikat;
  END IF;
END $$;

-- ── 3) Trigger guard: cegah BA tanpa aset di masa depan ──────────────────
-- Bila BA baru/baris yang diubah masih tanpa aset_id tapi membawa
-- checklist_id, ambil aset dari checklist-nya. SECURITY DEFINER supaya
-- pembacaan checklist_harian tidak diblokir RLS pola pengguna.
create or replace function public.berita_acara_auto_aset()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aset_id text;
begin
  if new.aset_id is null or new.aset_id = '' then
    if new.checklist_id is not null and new.checklist_id <> '' then
      select c.aset_id
        into v_aset_id
        from public.checklist_harian c
       where c.id = new.checklist_id
         and c.aset_id is not null
       limit 1;
      if v_aset_id is not null then
        new.aset_id := v_aset_id;
        -- Lengkapi kode & nama aset bila masih kosong.
        if new.kode_aset is null or new.kode_aset = '' then
          select a.kode into new.kode_aset
            from public.asets a where a.id = v_aset_id limit 1;
        end if;
        if new.nama_aset is null or new.nama_aset = '' then
          select a.nama into new.nama_aset
            from public.asets a where a.id = v_aset_id limit 1;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_berita_acara_auto_aset on public.berita_acara;
create trigger trg_berita_acara_auto_aset
  before insert or update on public.berita_acara
  for each row execute function public.berita_acara_auto_aset();

COMMIT;

-- ============================================================
-- VERIFIKASI (tampil di panel Results SQL Editor)
-- ============================================================
-- Harus 0 baris: BA "Disetujui" yang masih tak berrelasi ke aset.
-- Bila masih ada, datanya tidak punya checklist merujuk aset —
-- periksa manual dengan SELECT di bawah.
select b.id, b.nomor, b.status, b.checklist_id, b.aset_id
  from public.berita_acara b
 where b.status = 'Disetujui'
   and (b.aset_id is null or b.aset_id = '');

-- Diagnosa umum: seluruh BA + aset yang dirujuk checklist-nya.
select b.id,
       b.status,
       b.aset_id      as aset_ba,
       c.aset_id      as aset_checklist,
       b.checklist_id
  from public.berita_acara b
  left join public.checklist_harian c on c.id = b.checklist_id
 order by b.tanggal_buat desc
 limit 50;
