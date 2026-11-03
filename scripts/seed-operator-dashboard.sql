-- ============================================================
-- SEED: Data Dashboard Operasional (/operator) + status "Sedang digunakan"
--
-- Menambahkan data yang belum ada di database supaya seluruh bagian
-- halaman /operator menampilkan data nyata dari Supabase:
--
--   1. Tabel baru: pengisian_bbm, catatan_perbaikan
--   2. RLS untuk tabel baru (baca & tulis untuk authenticated)
--   3. Status aset "Sedang digunakan" untuk unit yang sedang dipakai
--      (sesuai logbook_perjalanan berstatus "Sedang Digunakan")
--   4. Kolom kecepatan_rata di logbook_perjalanan
--   5. Template checklist baru: motor harian & motor bulanan
--   6. Instance checklist_harian untuk RIB, Kapal, Mobil, Motor
--   7. Data pengisian BBM RIB 02
--   8. Catatan perbaikan sarana darat
--
-- Jalankan di: Supabase Dashboard → SQL Editor
-- Idempoten: aman dijalankan berulang (ON CONFLICT / guard WHERE)
-- ============================================================

-- ─── 1. TABEL BARU ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pengisian_bbm (
  id            text PRIMARY KEY,
  aset_id       text REFERENCES public.asets(id) ON DELETE CASCADE,
  tanggal       date NOT NULL,
  sisa_sebelum  text,
  penambahan    text,
  saldo_akhir   text,
  keterangan    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catatan_perbaikan (
  id                 text PRIMARY KEY,
  aset_id            text REFERENCES public.asets(id) ON DELETE CASCADE,
  tanggal            date NOT NULL,
  detail_pekerjaan   text NOT NULL,
  pelaksana          text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. RLS (pola sama dengan tabel lain di scripts/rls-policies.sql) ─────────

ALTER TABLE public.pengisian_bbm     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_perbaikan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pengisian_bbm_select   ON public.pengisian_bbm;
DROP POLICY IF EXISTS pengisian_bbm_manage   ON public.pengisian_bbm;
DROP POLICY IF EXISTS catatan_perbaikan_select ON public.catatan_perbaikan;
DROP POLICY IF EXISTS catatan_perbaikan_manage ON public.catatan_perbaikan;

CREATE POLICY pengisian_bbm_select ON public.pengisian_bbm
  FOR SELECT TO authenticated USING (true);
CREATE POLICY pengisian_bbm_manage ON public.pengisian_bbm
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY catatan_perbaikan_select ON public.catatan_perbaikan
  FOR SELECT TO authenticated USING (true);
CREATE POLICY catatan_perbaikan_manage ON public.catatan_perbaikan
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── 3. STATUS ASET: unit yang sedang dipakai jadi "Sedang digunakan" ────────
--
-- Berdasar logbook_perjalanan yang masih berstatus "Sedang Digunakan":
--   lp-06 → RIB Kelas I Sea First          (ast-033) — patroli, belum kembali
--   lp-07 → RIB Kelas I Vektor RIB 1100    (ast-032) — patroli sore
--   lp-10 → Rescue Truck ISUZU (DC 8982)   (ast-007) — evakuasi banjir Kalukku
--
-- Nilai status memakai ejaan kanonik aplikasi: "Sedang digunakan" (d kecil).

UPDATE public.asets
SET    status = 'Sedang digunakan', updated_at = now()
WHERE  id IN ('ast-032', 'ast-033', 'ast-007')
  AND  status = 'Standby';

-- Catat perubahan status ke riwayat aset (hindari duplikat dengan NOT EXISTS).
INSERT INTO public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id)
SELECT a.id, CURRENT_DATE, 'Perubahan Status',
       'Sedang digunakan — unit dipakai sesuai logbook perjalanan yang sedang berjalan',
       a.penanggung_jawab
FROM   public.asets a
WHERE  a.id IN ('ast-032', 'ast-033', 'ast-007')
  AND  a.status = 'Sedang digunakan'
  AND  NOT EXISTS (
         SELECT 1 FROM public.riwayat_aset r
         WHERE  r.aset_id = a.id
           AND  r.aksi = 'Perubahan Status'
           AND  r.keterangan LIKE 'Sedang digunakan%'
       );

-- ─── 4. KOLOM kecepatan_rata (tabel logbook_perjalanan masih tidak punya) ────
-- Supaya kolom "Kecepatan" di jurnal olah gerak / pemanasan menampilkan nilai.

ALTER TABLE public.logbook_perjalanan ADD COLUMN IF NOT EXISTS kecepatan_rata text;

UPDATE public.logbook_perjalanan SET kecepatan_rata = '10 Knot'
 WHERE kategori_unit = 'Kapal' AND status = 'Selesai' AND kecepatan_rata IS NULL;
UPDATE public.logbook_perjalanan SET kecepatan_rata = '22 Knot'
 WHERE kategori_unit = 'RIB'   AND status = 'Selesai' AND kecepatan_rata IS NULL;
UPDATE public.logbook_perjalanan SET kecepatan_rata = '20 Knot'
 WHERE kategori_unit = 'RBB'   AND status = 'Selesai' AND kecepatan_rata IS NULL;

-- ─── 5. TEMPLATE CHECKLIST BARU (motor harian & motor bulanan) ───────────────
-- Template arm-motor-mingguan sudah ada bentuknya di form fisik
-- "Ceklist Perawatan Motor Trail B 3184 PKQ" — harian & bulanan belum ada.

INSERT INTO public.checklist_templates (id, nama, kategori, periode, jenis_armada, sumber)
VALUES
  ('arm-motor-harian',
   'Ceklist Perawatan Motor Trail (Harian)',
   'Motor', 'Harian', 'Motor',
   'Ceklist Perawatan Motor Trail B 3184 PKQ'),
  ('arm-motor-bulanan',
   'Ceklist Perawatan Motor Trail (Bulanan)',
   'Motor', 'Bulanan', 'Motor',
   'Ceklist Perawatan Motor Trail B 3184 PKQ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.checklist_items (template_id, item_id, label, wajib, kondisi, keterangan, is_kritis)
VALUES
  -- Bagian 1 — Pemeriksaan Utama (12)
  ('arm-motor-harian','arm-motor-harian-01','Level Oli Mesin',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-02','Kondisi Ban',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-03','Tekanan Ban',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-04','Keausan',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-05','Rantai Penggerak',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-06','Baut Mur dan Pengencangan',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-07','Stang (Bergerak Lancar)',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-08','Level Minyak Rem',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-09','Kampas Rem',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-10','Kerja Gas',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-11','Tuas Kopling',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-12','Klakson',true,'Baik','',false),
  -- Bagian 2 — Kelistrikan & Perlengkapan (7)
  ('arm-motor-harian','arm-motor-harian-13','Lampu Depan',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-14','Lampu Belakang / Rem',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-15','Lampu Sein',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-16','Engine Stop Switch',true,'Baik','',true),
  ('arm-motor-harian','arm-motor-harian-17','Standar Samping',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-18','Indikator Spedometer',true,'Baik','',false),
  ('arm-motor-harian','arm-motor-harian-19','Kaca Spion',true,'Baik','',false),
  -- Bulanan (3)
  ('arm-motor-bulanan','arm-motor-bulanan-01','Baut Mur dan Pengencangan',true,'Baik','',false),
  ('arm-motor-bulanan','arm-motor-bulanan-02','Kondisi Rantai',true,'Baik','',false),
  ('arm-motor-bulanan','arm-motor-bulanan-03','Kampas Rem',true,'Baik','',false)
ON CONFLICT (template_id, item_id) DO NOTHING;

-- ─── 6. INSTANCE CHECKLIST (checklist_harian) ────────────────────────────────
-- Satu instance terisi per unit, tampilannya dipakai halaman /operator:
--   - Jurnal RIB   → arm-rib-pemeliharaan (24 item)
--   - Logbook Kapal → arm-kapalar-harian (5 item)
--   - Logbook Mobil → arm-mobil-harian/mingguan/bulanan
--   - Logbook Motor → arm-motor-harian/mingguan/bulanan
-- JSONB "items" memakai kunci { label, wajib, kondisi, keterangan, kategori }.
-- "kategori" memandu pengelompokan bagian di halaman (opsional).

-- 6a. RIB 02 — Vektor RIB 1100 (ast-032) · pemeriksa: Hasril
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-rib-02', '2026-10-08',
   'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', 'RIB',
   'arm-rib-pemeliharaan', 'Hasril', '198212022007121002', 'ast-032',
   'Lengkap', 24, 24,
   '[
     {"label":"Pemanasan Mesin Rutin / Pra-Jalan","wajib":true,"kondisi":"Baik","keterangan":"15 menit, mesin hangat optimal","kategori":"A. Pemanasan Mesin (Pra-Operasi)"},
     {"label":"Indikator Mesin Aman Setelah Pemanasan","wajib":true,"kondisi":"Baik","keterangan":"Indikator aman setelah pemanasan","kategori":"A. Pemanasan Mesin (Pra-Operasi)"},
     {"label":"Jam Berangkat (WITA)","wajib":true,"kondisi":"Baik","keterangan":"08:00 WITA","kategori":"B. Pengoperasian Alut"},
     {"label":"Jam Kembali (WITA)","wajib":true,"kondisi":"Baik","keterangan":"10:30 WITA — patroli rutin","kategori":"B. Pengoperasian Alut"},
     {"label":"Sisa BBM Kemarin (Liter / % / Status)","wajib":true,"kondisi":"Baik","keterangan":"45% — cukup (standar minimum 30%)","kategori":"C. Pengisian BBM"},
     {"label":"Penambahan BBM (Liter / % / No. Struk)","wajib":true,"kondisi":"Baik","keterangan":"30 Liter — struk 0233/PU/2026","kategori":"C. Pengisian BBM"},
     {"label":"Saldo Akhir BBM (Total Liter / % / Kondisi Tanki)","wajib":true,"kondisi":"Baik","keterangan":"75% — tanki dalam kondisi baik","kategori":"C. Pengisian BBM"},
     {"label":"Tali Tros","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Lunas","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Ban Pelampung","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Deck","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Transom (Stand Mesin)","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Starting Engine","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Kap Mesin Kanan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Kap Mesin Kiri","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Karbulator","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Selang BBM","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Busi","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Dinamo Stater","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Dinamo Strom","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Hydraulic Mesin","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Aki / Baterai","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"GPS Furuno","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"GPS Stracking","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"}
   ]'::jsonb,
   'Pemeliharaan pra-operasi selesai, semua item dalam kondisi baik. Persediaan BBM ditambah 30 Liter di dermaga.')
ON CONFLICT (id) DO NOTHING;

-- 6b. RIB — Sea First (ast-033) · pemeriksa: Ahmad Aidid
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-rib-01', '2026-10-08',
   'Rigid Inflatable Boat (RIB) Kelas I Sea First', 'RIB',
   'arm-rib-pemeliharaan', 'Ahmad Aidid', '198807022022031001', 'ast-033',
   'Lengkap', 24, 24,
   '[
     {"label":"Pemanasan Mesin Rutin / Pra-Jalan","wajib":true,"kondisi":"Baik","keterangan":"20 menit, mesin hangat optimal","kategori":"A. Pemanasan Mesin (Pra-Operasi)"},
     {"label":"Indikator Mesin Aman Setelah Pemanasan","wajib":true,"kondisi":"Baik","keterangan":"Indikator aman setelah pemanasan","kategori":"A. Pemanasan Mesin (Pra-Operasi)"},
     {"label":"Jam Berangkat (WITA)","wajib":true,"kondisi":"Baik","keterangan":"08:00 WITA","kategori":"B. Pengoperasian Alut"},
     {"label":"Jam Kembali (WITA)","wajib":true,"kondisi":"Baik","keterangan":"13:00 WITA — sosialisasi SAR","kategori":"B. Pengoperasian Alut"},
     {"label":"Sisa BBM Kemarin (Liter / % / Status)","wajib":true,"kondisi":"Baik","keterangan":"85% — cukup","kategori":"C. Pengisian BBM"},
     {"label":"Penambahan BBM (Liter / % / No. Struk)","wajib":true,"kondisi":"Baik","keterangan":"Tidak ada penambahan","kategori":"C. Pengisian BBM"},
     {"label":"Saldo Akhir BBM (Total Liter / % / Kondisi Tanki)","wajib":true,"kondisi":"Baik","keterangan":"65% — tanki baik","kategori":"C. Pengisian BBM"},
     {"label":"Tali Tros","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Lunas","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Ban Pelampung","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Deck","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Transom (Stand Mesin)","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Starting Engine","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Kap Mesin Kanan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Kap Mesin Kiri","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Karbulator","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Selang BBM","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Busi","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Dinamo Stater","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Dinamo Strom","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Hydraulic Mesin","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"Aki / Baterai","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"GPS Furuno","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"},
     {"label":"GPS Stracking","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Pemeliharaan alut RIB"}
   ]'::jsonb,
   'Pemeliharaan pra-operasi selesai, semua item dalam kondisi baik.')
ON CONFLICT (id) DO NOTHING;

-- 6c. Kapal SAR Kelas II (ast-031) · pemeriksa: Ahmad Aidid
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-kapal-kelas-ii', '2026-10-10',
   'Kapal SAR Kelas II Kapal Penyelamatan (Rescue Boat)', 'Kapal',
   'arm-kapalar-harian', 'Ahmad Aidid', '198807022022031001', 'ast-031',
   'Lengkap', 5, 5,
   '[
     {"label":"Alat Navigasi","wajib":true,"kondisi":"Baik","keterangan":"Radar, GPS, AIS, Kompas Magnet, Echo Sounder"},
     {"label":"Alat Komunikasi","wajib":true,"kondisi":"Baik","keterangan":"Radio VHF/HF dan seluruh perangkat komunikasi berfungsi normal"},
     {"label":"Persentase BBM","wajib":true,"kondisi":"Baik","keterangan":"Sisa bahan bakar 74% (standar minimum 30%)"},
     {"label":"Endurance","wajib":true,"kondisi":"Baik","keterangan":"Sisa endurance 70 jam (standar minimum 24 jam)"},
     {"label":"Kecepatan Rata","wajib":true,"kondisi":"Baik","keterangan":"Kecepatan rata-rata 10 knot"}
   ]'::jsonb,
   'Semua 5 item utama dalam kondisi baik, kapal siap beroperasi.')
ON CONFLICT (id) DO NOTHING;

-- 6d. Rescue Truck ISUZU (DC 8982) — ast-007 · pemeriksa: Muhammad Adiaksa
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-mobil-harian', '2026-10-08',
   'Rescue Truck ISUZU', 'Mobil',
   'arm-mobil-harian', 'Muhammad Adiaksa', '199806052022031001', 'ast-007',
   'Lengkap', 36, 36,
   '[
     {"label":"Oli Mesin","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"A. Menjungkitkan Kabin"},
     {"label":"Oli Power Steering","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"A. Menjungkitkan Kabin"},
     {"label":"Fan Belt","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"A. Menjungkitkan Kabin"},
     {"label":"Tutup Radiator","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"A. Menjungkitkan Kabin"},
     {"label":"Level Minyak Rem / Kopling","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Radio Komunikasi","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Seat Belt (Sabuk Pengaman)","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Sirine & Lightbar","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Gerak Bebas Pedal Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Gerak Bebas Kopling","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Gerak Bebas Pedal Gas","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Instrumen Indikator","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Kemudahan Start Engine","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Langkah Tuas Rem Parkir","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Sapuan Wiper","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Kaca Spion Dalam","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Level Cairan Washer","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Gerak Bebas Kemudi","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Klakson","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Power Window / Door Lock","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Kunci Roda & Toolkit","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"B. Dalam Kabin"},
     {"label":"Lampu-Lampu","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Pegas Suspensi / Kaki-Kaki / Per Daun","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Kebocoran / Tetesan Fluid","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Kondisi Kaca-Kaca","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Wiper","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Saringan Bahan Bakar","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Rolling Door Compartment","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Engsel Pintu-Pintu","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Kunci Pintu-Pintu","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Towing","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"C. Keliling Kendaraan"},
     {"label":"Tekanan Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Roda dan Ban"},
     {"label":"Tapak dan Dinding Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Roda dan Ban"},
     {"label":"Keausan Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Roda dan Ban"},
     {"label":"Pemasangan Velg","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"D. Roda dan Ban"},
     {"label":"Pengecekan WAP radio HT regu lapangan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Item Tambahan"}
   ]'::jsonb,
   'Ceklist harian lengkap, semua item baik. Item tambahan WAP radio HT regu lapangan juga OK.')
ON CONFLICT (id) DO NOTHING;

-- 6e. Rescue Truck ISUZU (DC 8982) — ceklist Mingguan
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-mobil-mingguan', '2026-10-05',
   'Rescue Truck ISUZU', 'Mobil',
   'arm-mobil-mingguan', 'Muhammad Adiaksa', '199806052022031001', 'ast-007',
   'Lengkap', 17, 17,
   '[
     {"label":"Kerja AC","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"1. Performa / Fungsi Sistem"},
     {"label":"Kerja Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"1. Performa / Fungsi Sistem"},
     {"label":"Kerja Kopling","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"1. Performa / Fungsi Sistem"},
     {"label":"Kerja Pedal Gas","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"1. Performa / Fungsi Sistem"},
     {"label":"Kerja Kaki-Kaki","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"1. Performa / Fungsi Sistem"},
     {"label":"Kerja Sistem 4WD","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"1. Performa / Fungsi Sistem"},
     {"label":"Kaca Depan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Spion Luar","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Floodlight System","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Lampu-Lampu","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Level Cairan Pendingin","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"APAR","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Plat Nopol","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Ban Cadangan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Kebersihan Kendaraan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Jok / Tempat Duduk","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"},
     {"label":"Kaca Film","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"2. Keliling Kendaraan (Mingguan)"}
   ]'::jsonb,
   'Pemeriksaan mingguan lengkap, seluruh fungsi sistem dan keliling kendaraan baik.')
ON CONFLICT (id) DO NOTHING;

-- 6f. Rescue Truck ISUZU (DC 8982) — ceklist Bulanan (Winch)
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-mobil-bulanan', '2026-10-05',
   'Rescue Truck ISUZU', 'Mobil',
   'arm-mobil-bulanan', 'Muhammad Adiaksa', '199806052022031001', 'ast-007',
   'Lengkap', 1, 1,
   '[
     {"label":"Winch","wajib":true,"kondisi":"Baik","keterangan":"Winch tarik normal, kabel tanpa keausan berlebih","kategori":"C. Pemeriksaan Bulanan"}
   ]'::jsonb,
   'Winch dalam kondisi baik.')
ON CONFLICT (id) DO NOTHING;

-- 6g. Rescue Motorcycle B 3184 PKQ (ast-004) — ceklist Harian
-- Dua item Rusak Ringan: Level Oli Mesin & Lampu Sein (akan muncul sebagai badge kuning).
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-motor-harian', '2026-10-07',
   'RESCUE MOTORCYCLE (B 3184 PKQ)', 'Motor',
   'arm-motor-harian', 'Muhammad Akbar', '199705052022031001', 'ast-004',
   'Lengkap', 19, 19,
   '[
     {"label":"Level Oli Mesin","wajib":true,"kondisi":"Rusak Ringan","keterangan":"Level minyak di bawah garis menit — sudah diisi ulang","kategori":"Bagian 1"},
     {"label":"Kondisi Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Tekanan Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Keausan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Rantai Penggerak","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Baut Mur dan Pengencangan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Stang (Bergerak Lancar)","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Level Minyak Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Kampas Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Kerja Gas","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Tuas Kopling","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Klakson","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1"},
     {"label":"Lampu Depan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2"},
     {"label":"Lampu Belakang / Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2"},
     {"label":"Lampu Sein","wajib":true,"kondisi":"Rusak Ringan","keterangan":"Sein kanan kadang tidak menyala — menunggu berita acara","kategori":"Bagian 2"},
     {"label":"Engine Stop Switch","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2"},
     {"label":"Standar Samping","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2"},
     {"label":"Indikator Spedometer","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2"},
     {"label":"Kaca Spion","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2"}
   ]'::jsonb,
   'Level oli mesin & lampu sein rusak ringan — ditindak lewat berita acara.')
ON CONFLICT (id) DO NOTHING;

-- 6h. Rescue Motorcycle B 3184 PKQ (ast-004) — ceklist Mingguan
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-motor-mingguan', '2026-10-05',
   'RESCUE MOTORCYCLE (B 3184 PKQ)', 'Motor',
   'arm-motor-mingguan', 'Muhammad Akbar', '199705052022031001', 'ast-004',
   'Lengkap', 19, 19,
   '[
     {"label":"Level Oli Mesin","wajib":true,"kondisi":"Baik","keterangan":"Sudah diisi ulang sampai level normal","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Kondisi Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Tekanan Ban","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Keausan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Rantai Penggerak","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Baut Mur dan Pengencangan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Stang (Bergerak Lancar)","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Level Minyak Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Kampas Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Kerja Gas","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Tuas Kopling","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Klakson","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 1: Pemeriksaan Utama"},
     {"label":"Lampu Depan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"},
     {"label":"Lampu Belakang / Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"},
     {"label":"Lampu Sein","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"},
     {"label":"Engine Stop Switch","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"},
     {"label":"Standar Samping","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"},
     {"label":"Indikator Spedometer","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"},
     {"label":"Kaca Spion","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Bagian 2: Kelistrikan & Perlengkapan"}
   ]'::jsonb,
   'Perawatan mingguan motor trail lengkap — sebelumnya oli mesin & lampu sein sudah diperbaiki.')
ON CONFLICT (id) DO NOTHING;

-- 6i. Rescue Motorcycle B 3184 PKQ (ast-004) — ceklist Bulanan
INSERT INTO public.checklist_harian
  (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id,
   status, item_checked, item_total, items, catatan)
VALUES
  ('chk-seed-motor-bulanan', '2026-10-04',
   'RESCUE MOTORCYCLE (B 3184 PKQ)', 'Motor',
   'arm-motor-bulanan', 'Muhammad Akbar', '199705052022031001', 'ast-004',
   'Lengkap', 3, 3,
   '[
     {"label":"Baut Mur dan Pengencangan","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Pemeriksaan Bulanan"},
     {"label":"Kondisi Rantai","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Pemeriksaan Bulanan"},
     {"label":"Kampas Rem","wajib":true,"kondisi":"Baik","keterangan":"","kategori":"Pemeriksaan Bulanan"}
   ]'::jsonb,
   'Pemeriksaan bulanan motor trail baik.')
ON CONFLICT (id) DO NOTHING;

-- ─── 7. PENGISIAN BBM RIB 02 ─────────────────────────────────────────────────
-- Section "C. Pengisian BBM" pada kartu RIB 02 + blok ringkas di bagian atas.

INSERT INTO public.pengisian_bbm (id, aset_id, tanggal, sisa_sebelum, penambahan, saldo_akhir, keterangan)
VALUES
  ('pbbm-001', 'ast-032', '2026-10-08', '45%', '30 Liter', '75%',
   'Pengisian rutin dermaga — struk 0233/PU/2026')
ON CONFLICT (id) DO NOTHING;

-- ─── 8. CATATAN PERBAIKAN SARANA DARAT ───────────────────────────────────────
-- Section "III. Catatan Penggantian, Perbaikan, dan Overhaul".

INSERT INTO public.catatan_perbaikan (id, aset_id, tanggal, detail_pekerjaan, pelaksana)
VALUES
  ('cp-001', 'ast-007', '2026-09-20', 'Ganti oli mesin dan filter',  'Bengkel Resmi Isuzu Mamuju'),
  ('cp-002', 'ast-007', '2026-09-15', 'Perbaikan sistem rem',        'Bengkel Resmi Isuzu Mamuju'),
  ('cp-003', 'ast-007', '2026-09-10', 'Ganti ban depan kiri',        'Bengkel Resmi Isuzu Mamuju'),
  ('cp-004', 'ast-004', '2026-09-18', 'Ganti rantai penggerak & pelumasan', 'Bengkel Resmi Kawasaki Mamuju'),
  ('cp-005', 'ast-004', '2026-09-08', 'Ganti kampas rem depan',      'Bengkel Resmi Kawasaki Mamuju')
ON CONFLICT (id) DO NOTHING;

-- ─── 9. VERIFIKASI ───────────────────────────────────────────────────────────

-- Status aset unit yang dipakai (harus "Sedang digunakan"):
SELECT id, nama, merk, tipe, no_polisi, status, kondisi
FROM   public.asets
WHERE  id IN ('ast-032', 'ast-033', 'ast-007');

-- Rekap tabel yang diisi:
SELECT
  (SELECT count(*) FROM public.checklist_harian)   AS checklist_harian,
  (SELECT count(*) FROM public.checklist_items)    AS checklist_items,
  (SELECT count(*) FROM public.checklist_templates) AS checklist_templates,
  (SELECT count(*) FROM public.pengisian_bbm)      AS pengisian_bbm,
  (SELECT count(*) FROM public.catatan_perbaikan)  AS catatan_perbaikan,
  (SELECT count(*) FROM public.logbook_perjalanan WHERE kecepatan_rata IS NOT NULL) AS logbook_dgn_kecepatan;
