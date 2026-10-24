-- ============================================================
-- SUPABASE SEED DATA (kecuali users)
-- Kantor Pencarian & Pertolongan Kelas B Mamuju
-- Dibuat otomatis dari src/components/shared/mock-data.ts
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Idempoten: tabel dibuat IF NOT EXISTS, data di-clear dulu.
--
-- Kolom referensi user memakai **NIP (text)** + FK public.users(nip).
-- Prasyarat: public.users.nip sudah UNIQUE NOT NULL.
-- ============================================================

BEGIN;

-- ==========================================================
-- PRASYARAT: constraint UNIQUE pada public.users.nip
-- (idempoten — hanya ditambahkan jika belum ada)
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_nip_unique'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_nip_unique UNIQUE (nip);
  END IF;
END $$;

-- ==========================================================
-- 1. TABEL ASET (asets)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.asets (
  id                    text PRIMARY KEY,
  nama                  text NOT NULL,
  kode                  text UNIQUE,
  nup                   text,
  kategori              text,
  status                text,
  lokasi                text,
  tanggal_penetapan     date,
  gambar                text,
  kondisi               text,
  penanggung_jawab      text REFERENCES public.users(nip) ON DELETE SET NULL,
  keterangan            text,
  kode_barang           text,
  merk                  text,
  tipe                  text,
  no_stnk               text,
  no_polisi             text,
  tanggal_perolehan     date,
  no_psp                text,
  tanggal_psp           date,
  nilai_perolehan       bigint DEFAULT 0,
  nilai_penyusutan      bigint DEFAULT 0,
  nilai_buku            bigint DEFAULT 0,
  umur_aset_tahun       integer DEFAULT 0,
  jumlah_foto           integer DEFAULT 0,
  status_penggunaan     text,
  kode_register         text,
  status_bmn            text DEFAULT 'Aktif',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ==========================================================
-- 2. RIWAYAT ASET (riwayat_aset)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.riwayat_aset (
  id              bigserial PRIMARY KEY,
  aset_id         text NOT NULL REFERENCES public.asets(id) ON DELETE CASCADE,
  tanggal         date NOT NULL,
  aksi            text NOT NULL,
  keterangan      text,
  user_id         text REFERENCES public.users(nip) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

-- ==========================================================
-- 3. EWS TICKETS (ews_tickets)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.ews_tickets (
  id                    text PRIMARY KEY,
  aset_id               text REFERENCES public.asets(id) ON DELETE SET NULL,
  judul                 text NOT NULL,
  deskripsi             text,
  tingkat_keparahan     text,
  status                text,
  tanggal_buat          date,
  tanggal_update        date,
  assigned_to           text REFERENCES public.users(nip) ON DELETE SET NULL,
  created_at            timestamptz DEFAULT now()
);

-- ==========================================================
-- 4. ANTREAN VERIFIKASI (antrean_verifikasi)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.antrean_verifikasi (
  id              text PRIMARY KEY,
  tipe            text,
  judul           text NOT NULL,
  deskripsi       text,
  status          text,
  tanggal_buat    date,
  created_by      text REFERENCES public.users(nip) ON DELETE SET NULL,
  catatan_revisi  text,
  created_at      timestamptz DEFAULT now()
);

-- ==========================================================
-- 5. CHECKLIST TEMPLATES (checklist_templates + checklist_items)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id            text PRIMARY KEY,
  nama          text NOT NULL,
  kategori      text,
  periode       text,
  jenis_armada  text,
  sumber        text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
  template_id   text NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  item_id       text NOT NULL,
  label         text NOT NULL,
  wajib         boolean DEFAULT true,
  kondisi       text,
  keterangan    text,
  is_kritis     boolean DEFAULT false,
  PRIMARY KEY (template_id, item_id)
);

-- ==========================================================
-- 6. NOTIFIKASI (notifications)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          text PRIMARY KEY,
  judul       text NOT NULL,
  pesan       text,
  tipe        text,
  dibaca      boolean DEFAULT false,
  tanggal     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- ==========================================================
-- 7. LOG AKTIVITAS (activity_log)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          text PRIMARY KEY,
  user_id     text REFERENCES public.users(nip) ON DELETE SET NULL,
  aksi        text NOT NULL,
  target      text,
  tanggal     timestamptz,
  detail      text,
  created_at  timestamptz DEFAULT now()
);

-- ==========================================================
-- 8. RIWAYAT OPERASI (riwayat_operasi)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.riwayat_operasi (
  id          text PRIMARY KEY,
  tanggal     date,
  jenis       text,
  lokasi      text,
  durasi      text,
  personel    integer,
  hasil       text,
  keterangan  text,
  created_at  timestamptz DEFAULT now()
);

-- ==========================================================
-- 9. APPROVAL (approvals)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.approvals (
  id              text PRIMARY KEY,
  kode            text,
  nama_aset       text,
  kategori        text,
  pengajuan_oleh  text REFERENCES public.users(nip) ON DELETE SET NULL,
  tanggal         date,
  status          text,
  alasan          text,
  rincian         jsonb,
  created_at      timestamptz DEFAULT now()
);

-- ==========================================================
-- 10. LOGBOOK PERJALANAN (logbook_perjalanan)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.logbook_perjalanan (
  id                text PRIMARY KEY,
  tanggal           date,
  jam_berangkat     text,
  jam_kembali       text,
  rute              text,
  tujuan            text,
  kategori_unit     text,
  jenis_unit        text,
  nahkoda           text,
  jumlah_personel   integer,
  bbm_sebelum       text,
  bbm_sesudah       text,
  endurance_awal    text,
  endurance_akhir   text,
  km_sebelum        text,
  km_sesudah        text,
  status            text,
  catatan           text,
  tanggal_simpan    timestamptz,
  tanggal_lengkap   timestamptz,
  created_at        timestamptz DEFAULT now()
);

-- ==========================================================
-- 11. CHECKLIST HARIAN (checklist_harian)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.checklist_harian (
  id              text PRIMARY KEY,
  tanggal         date,
  unit            text,
  jenis_unit      text,
  template_id     text REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  pemeriksa       text,
  pemeriksa_id    text REFERENCES public.users(nip) ON DELETE SET NULL,
  aset_id         text REFERENCES public.asets(id) ON DELETE SET NULL,
  status          text,
  item_checked    integer,
  item_total      integer,
  items           jsonb,
  catatan         text,
  created_at      timestamptz DEFAULT now()
);

-- ==========================================================
-- 12. BERITA ACARA (berita_acara)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.berita_acara (
  id                  text PRIMARY KEY,
  tanggal             date,
  nama_aset           text,
  kode_aset           text,
  nomor               text,
  aset_id             text REFERENCES public.asets(id) ON DELETE SET NULL,
  checklist_id        text,
  tiket_id            text REFERENCES public.ews_tickets(id) ON DELETE SET NULL,
  pengaju_id          text REFERENCES public.users(nip) ON DELETE SET NULL,
  pelapor             text,
  pelapor_jabatan     text,
  pengaju_nama        text,
  pengaju_jabatan     text,
  tanggal_buat        date,
  tanggal_update      date,
  status              text,
  kendala             jsonb,
  foto_bukti          jsonb,
  uraian              text,
  alasan_penolakan    text,
  keterangan          text,
  created_at          timestamptz DEFAULT now()
);

-- ==========================================================
-- CLEAR DATA LAMA (idempoten)
-- ==========================================================
DELETE FROM public.riwayat_aset;
DELETE FROM public.asets;
DELETE FROM public.ews_tickets;
DELETE FROM public.antrean_verifikasi;
DELETE FROM public.checklist_items;
DELETE FROM public.checklist_templates;
DELETE FROM public.notifications;
DELETE FROM public.activity_log;
DELETE FROM public.riwayat_operasi;
DELETE FROM public.approvals;
DELETE FROM public.logbook_perjalanan;
DELETE FROM public.checklist_harian;
DELETE FROM public.berita_acara;

-- ==========================================================
-- INSERT DATA
-- ==========================================================

-- 1. ASET (34 baris)
INSERT INTO public.asets (id, nama, kode, nup, kategori, status, lokasi, tanggal_penetapan, gambar, kondisi, penanggung_jawab, keterangan, kode_barang, merk, tipe, no_stnk, no_polisi, tanggal_perolehan, no_psp, tanggal_psp, nilai_perolehan, nilai_penyusutan, nilai_buku, umur_aset_tahun, jumlah_foto, status_penggunaan, kode_register, status_bmn) VALUES
  ('ast-001', 'Sedan Toyota Corolla Altis 1.8 GAT', '3020101001-000001', '000001', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020101001-000001.jpg', 'Baik', '198802052007121001', 'Digunakan sendiri untuk operasional · Merk: Toyota · Tipe: Corolla Altis 1.8 GAT · No. Polisi: DC 1801', '3020101001', 'Toyota', 'Corolla Altis 1.8 GAT', NULL, 'DC 1801', '2009-11-26', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 325600000, 325600000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF637C91F5E0531561F20AF978', 'Aktif'),
  ('ast-002', 'Sepeda Motor KAWASAKI LX 150L', '3020104001-000003', '000003', 'Motor', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020104001-000003.jpg', 'Baik', '199612212022031001', 'Digunakan sendiri untuk operasional · Merk: KAWASAKI LX 150L · No. Polisi: DC 3481', '3020104001', 'KAWASAKI LX 150L', NULL, '08086917', 'DC 3481', '2011-11-21', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 26235000, 26235000, 0, 0, 3, 'Digunakan sendiri untuk operasional', 'E13C04DF637D91F5E0531561F20AF978', 'Aktif'),
  ('ast-003', 'Sepeda Motor KAWASAKI KLX 230', '3020104001-000005', '000005', 'Motor', 'Standby', 'Gudang Kendaraan', '2025-07-30', '/asets/3020104001-000005.jpg', 'Baik', '200409052025061001', 'Digunakan sendiri untuk operasional · Merk: KAWASAKI KLX 230 · Tipe: KAWASAKI KLX 230 · No. Polisi: B 3183 PKQ', '3020104001', 'KAWASAKI KLX 230', 'KAWASAKI KLX 230', 'B 3183 PKQ', 'B 3183 PKQ', '2024-05-28', '85/MK/KNL.1501/2025', '2025-07-30', 51700000, 18464285, 33235715, 9, 2, 'Digunakan sendiri untuk operasional', '1B3963EF530D198BE063BBAAD80A4BDF', 'Aktif'),
  ('ast-004', 'Sepeda Motor KAWASAKI KLX 230', '3020104001-000006', '000006', 'Motor', 'Standby', 'Gudang Kendaraan', '2025-07-30', '/asets/3020104001-000006.jpg', 'Baik', '199705052022031001', 'Digunakan sendiri untuk operasional · Merk: KAWASAKI KLX 230 · Tipe: KAWASAKI KLX 230 · No. Polisi: B 3184 PKQ', '3020104001', 'KAWASAKI KLX 230', 'KAWASAKI KLX 230', 'B 3184 PKQ', 'B 3184 PKQ', '2024-05-28', '85/MK/KNL.1501/2025', '2025-07-30', 51700000, 18464285, 33235715, 9, 1, 'Digunakan sendiri untuk operasional', '1B3963EF530E198BE063BBAAD80A4BDF', 'Aktif'),
  ('ast-005', 'Sepeda Motor Kawasaki KLX 150 L', '3020104001-000007', '000007', 'Motor', 'Standby', 'Gudang Kendaraan', '2026-06-29', '/asets/3020104001-000007.jpg', 'Baik', '200305132025061001', 'Digunakan sendiri untuk operasional · Merk: Kawasaki KLX 150 L · Tipe: Kawasaki KLX 150 L · No. Polisi: DC 3480', '3020104001', 'Kawasaki KLX 150 L', 'Kawasaki KLX 150 L', '08086916', 'DC 3480', '2015-10-12', '85/MK/KNL.1501/2026', '2026-06-29', 31728400, 31728400, 0, 0, 3, 'Digunakan sendiri untuk operasional', '42ADDA9AB8F345C7E06365E7D80A24DF', 'Aktif'),
  ('ast-006', 'Mobil Operasional PJR TOYOTA TF36', '3020105058-000001', '000001', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105058-000001.jpg', 'Baik', '199610042025211053', 'Digunakan sendiri untuk dinas jabatan · Merk: TOYOTA · Tipe: TF36', '3020105058', 'TOYOTA', 'TF36', NULL, NULL, '2020-03-20', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 468830000, 435342143, 33487857, 1, 2, 'Digunakan sendiri untuk dinas jabatan', 'E13C04DF636891F5E0531561F20AF978', 'Aktif'),
  ('ast-007', 'Rescue Truck ISUZU', '3020105062-000004', '000004', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105062-000004.jpg', 'Baik', '199806052022031001', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: ISUZU · No. Polisi: DC 8982', '3020105062', 'ISUZU', NULL, '08086913', 'DC 8982', '2018-08-15', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 1675850000, 1675850000, 0, 0, 1, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF636A91F5E0531561F20AF978', 'Aktif'),
  ('ast-008', 'Rescue Truck ISUZU', '3020105062-000005', '000005', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105062-000005.jpg', 'Baik', '199807192025211027', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: ISUZU · Tipe: ISUZU · No. Polisi: DC 8977', '3020105062', 'ISUZU', 'ISUZU', '08086911', 'DC 8977', '2020-08-31', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 1847230000, 1583340000, 263890000, 2, 1, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF637E91F5E0531561F20AF978', 'Aktif'),
  ('ast-009', 'Rescue Truck ISUZU NPS 75', '3020105062-000006', '000006', 'Mobil', 'Standby', 'Gudang Kendaraan', '2025-07-30', '/asets/3020105062-000006.jpg', 'Baik', '200206132025061001', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: ISUZU NPS 75 · Tipe: ISUZU NPS 75 · No. Polisi: DC 8981', '3020105062', 'ISUZU NPS 75', 'ISUZU NPS 75', 'DC 8981', 'DC 8981', '2022-02-07', '85/MK/KNL.1501/2025', '2025-07-30', 2317610375, 1489892383, 827717992, 5, 3, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E49B7D64087CDB1FE0531661F20AD642', 'Aktif'),
  ('ast-010', 'Rescue Car Type I Dmax Compartemen (ISUZU)', '3020105128-000003', '000003', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105128-000003.jpg', 'Baik', '198212022007121002', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: Dmax Compartemen (ISUZU) · No. Polisi: B 9891 PSC', '3020105128', 'Dmax Compartemen (ISUZU)', NULL, NULL, 'B 9891 PSC', '2013-06-28', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 630080000, 630080000, 0, 0, 2, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF636591F5E0531561F20AF978', 'Aktif'),
  ('ast-011', 'Rescue Car Type I Dmax Double Cabin (ISUZU)', '3020105128-000006', '000006', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105128-000006.jpg', 'Baik', '200004152022031002', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: Dmax Double Cabin (ISUZU) · Tipe: ISUZU · No. Polisi: DC 8979', '3020105128', 'Dmax Double Cabin (ISUZU)', 'ISUZU', '08086912', 'DC 8979', '2020-07-30', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 881580000, 755640000, 125940000, 2, 1, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF636991F5E0531561F20AF978', 'Aktif'),
  ('ast-012', 'Rescue Car Type II Dmax Double Cabin (ISUZU)', '3020105129-000005', '000005', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105129-000005.jpg', 'Baik', '200001052025211020', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: Dmax Double Cabin (ISUZU) · Tipe: Dmax Double Cabin (ISUZU) · No. Polisi: DC 8978', '3020105129', 'Dmax Double Cabin (ISUZU)', 'Dmax Double Cabin (ISUZU)', '08086910', 'DC 8978', '2020-07-30', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 756250000, 648214285, 108035715, 2, 2, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF637891F5E0531561F20AF978', 'Aktif'),
  ('ast-013', 'Rescue Car Type II Dmax Double Cabin (ISUZU)', '3020105129-000006', '000006', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105129-000006.jpg', 'Baik', '199612212022031001', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: Dmax Double Cabin (ISUZU) · Tipe: Dmax Double Cabin (ISUZU) · No. Polisi: DC 8980', '3020105129', 'Dmax Double Cabin (ISUZU)', 'Dmax Double Cabin (ISUZU)', '08086909', 'DC 8980', '2020-07-30', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 756250000, 648214285, 108035715, 2, 3, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF636E91F5E0531561F20AF978', 'Aktif'),
  ('ast-014', 'Rescue Car Type II Dmax Compartemen (ISUZU)', '3020105129-000008', '000008', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105129-000008.jpg', 'Baik', '198908082010121001', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: Dmax Compartemen (ISUZU) · No. Polisi: DC 1802', '3020105129', 'Dmax Compartemen (ISUZU)', NULL, '08086914', 'DC 1802', '2014-10-16', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 648450000, 648450000, 0, 0, 2, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF637491F5E0531561F20AF978', 'Aktif'),
  ('ast-015', 'Rescue Car Type II Dmax Double Cabin (ISUZU)', '3020105129-000009', '000009', 'Mobil', 'Standby', 'Gudang Kendaraan', '2020-12-16', '/asets/3020105129-000009.jpg', 'Baik', '199705052022031001', 'Digunakan sendiri untuk kendaraan fungsional Lainnya · Merk: Dmax Double Cabin (ISUZU) · No. Polisi: DC 8145', '3020105129', 'Dmax Double Cabin (ISUZU)', NULL, '16069361', 'DC 8145', '2009-01-07', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 321290000, 321290000, 0, 0, 3, 'Digunakan sendiri untuk kendaraan fungsional Lainnya', 'E13C04DF636D91F5E0531561F20AF978', 'Aktif'),
  ('ast-016', 'Speed Boat / Motor Tempel GEMINI SEA RIDER', '3020302001-000001', '000001', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2020-12-16', '/asets/3020302001-000001.jpg', 'Baik', '199709262022031001', 'Digunakan sendiri untuk operasional · Merk: GEMINI · Tipe: SEA RIDER', '3020302001', 'GEMINI', 'SEA RIDER', NULL, NULL, '2009-04-01', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 1058750000, 1058750000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF637391F5E0531561F20AF978', 'Aktif'),
  ('ast-017', 'Speed Boat / Motor Tempel Yamaha E25BMH', '3020302001-000002', '000002', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2023-11-07', '/asets/3020302001-000002.jpg', 'Baik', '198102142005021001', 'Digunakan sendiri untuk operasional · Merk: Yamaha E25BMH · Tipe: Yamaha E25BMH', '3020302001', 'Yamaha E25BMH', 'Yamaha E25BMH', NULL, NULL, '2022-02-07', 'SK.SU-187/PL.01.05/XI/BSN-2023', '2023-11-07', 66000000, 29700000, 36300000, 11, 1, 'Digunakan sendiri untuk operasional', 'E49B7D640864DB1FE0531661F20AD642', 'Aktif'),
  ('ast-018', 'Out Boat Motor Yamaha E40 JMHL', '3020303004-000001', '000001', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2023-11-07', '/asets/3020303004-000001.jpg', 'Baik', '198212022007121002', 'Digunakan sendiri untuk operasional · Merk: Yamaha E40 JMHL', '3020303004', 'Yamaha E40 JMHL', NULL, NULL, NULL, '2013-12-16', 'SK.SU-187/PL.01.05/XI/BSN-2023', '2023-11-07', 40700000, 40700000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF637A91F5E0531561F20AF978', 'Aktif'),
  ('ast-019', 'Out Boat Motor YAMAHA 40 PK ENDURO', '3020303004-000002', '000002', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2023-11-07', '/asets/3020303004-000002.jpg', 'Baik', '198807022022031001', 'Digunakan sendiri untuk operasional · Merk: YAMAHA 40 PK · Tipe: ENDURO', '3020303004', 'YAMAHA 40 PK', 'ENDURO', NULL, NULL, '2002-04-30', 'SK.SU-187/PL.01.05/XI/BSN-2023', '2023-11-07', 25435000, 25435000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF638091F5E0531561F20AF978', 'Aktif'),
  ('ast-020', 'Out Boat Motor YAMAHA ENDURO', '3020303004-000003', '000003', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2020-12-16', '/asets/3020303004-000003.jpg', 'Baik', '199709262022031001', 'Digunakan sendiri untuk operasional · Merk: YAMAHA · Tipe: ENDURO', '3020303004', 'YAMAHA', 'ENDURO', NULL, NULL, '2009-04-01', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 144375000, 144375000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF637F91F5E0531561F20AF978', 'Aktif'),
  ('ast-021', 'Out Boat Motor YAMAHA ENDURO', '3020303004-000004', '000004', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2020-12-16', '/asets/3020303004-000004.jpg', 'Baik', '198102142005021001', 'Digunakan sendiri untuk operasional · Merk: YAMAHA · Tipe: ENDURO', '3020303004', 'YAMAHA', 'ENDURO', NULL, NULL, '2009-04-01', '134/KM.6/WKN.15/KNL.01/2020', '2020-12-16', 144375000, 144375000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF636C91F5E0531561F20AF978', 'Aktif'),
  ('ast-022', 'Out Boat Motor YAMAHA 25 PK', '3020303004-000005', '000005', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2023-11-07', '/asets/3020303004-000005.jpg', 'Baik', '198212022007121002', 'Digunakan sendiri untuk operasional · Merk: YAMAHA · Tipe: 25 PK', '3020303004', 'YAMAHA', '25 PK', NULL, NULL, '2009-01-07', 'SK.SU-187/PL.01.05/XI/BSN-2023', '2023-11-07', 32175000, 32175000, 0, 0, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF637B91F5E0531561F20AF978', 'Aktif'),
  ('ast-023', 'Out Boat Motor', '3020303004-000006', '000006', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-16', '/asets/3020303004-000006.jpg', 'Baik', '198807022022031001', 'Digunakan sendiri untuk operasional', '3020303004', NULL, NULL, NULL, NULL, '2021-06-04', '65/KM.6/KNL.1501/2024', '2024-07-16', 383350000, 210842500, 172507500, 9, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF636691F5E0531561F20AF978', 'Aktif'),
  ('ast-024', 'Out Boat Motor', '3020303004-000007', '000007', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-16', '/asets/3020303004-000007.jpg', 'Baik', '199709262022031001', 'Digunakan sendiri untuk operasional', '3020303004', NULL, NULL, NULL, NULL, '2021-06-04', '65/KM.6/KNL.1501/2024', '2024-07-16', 383350000, 210842500, 172507500, 9, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF636F91F5E0531561F20AF978', 'Aktif'),
  ('ast-025', 'Out Boat Motor', '3020303004-000008', '000008', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-16', '/asets/3020303004-000008.jpg', 'Baik', '198102142005021001', 'Digunakan sendiri untuk operasional', '3020303004', NULL, NULL, NULL, NULL, '2021-12-27', '65/KM.6/KNL.1501/2024', '2024-07-16', 134902900, 67451450, 67451450, 10, 1, 'Digunakan sendiri untuk operasional', 'E0C89D0C60AB1FCCE0531561F20A3CE6', 'Aktif'),
  ('ast-026', 'Out Boat Motor', '3020303004-000009', '000009', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-16', '/asets/3020303004-000009.jpg', 'Baik', '198212022007121002', 'Digunakan sendiri untuk operasional', '3020303004', NULL, NULL, NULL, NULL, '2021-12-27', '65/KM.6/KNL.1501/2024', '2024-07-16', 134902900, 67451450, 67451450, 10, 1, 'Digunakan sendiri untuk operasional', 'E0C89D0C60651FCCE0531561F20A3CE6', 'Aktif'),
  ('ast-027', 'Out Boat Motor Yamaha E30HMHL (Outboard Motor 30 HP)', '3020303004-000010', '000010', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-18', '/asets/3020303004-000010.jpg', 'Baik', '198807022022031001', 'Digunakan sendiri untuk operasional · Merk: Yamaha E30HMHL (Outboard Motor 30 HP) · Tipe: Yamaha E30HMHL (Outboard Motor 30 HP)', '3020303004', 'Yamaha E30HMHL (Outboard Motor 30 HP)', 'Yamaha E30HMHL (Outboard Motor 30 HP)', NULL, NULL, '2023-10-02', 'SK.SU-125/PL.01.05/VII/BSN-2024', '2024-07-18', 55000000, 16500000, 38500000, 14, 1, 'Digunakan sendiri untuk operasional', '0BD126B590064388E063BAAAD80AEB94', 'Aktif'),
  ('ast-028', 'Out Boat Motor Yamaha E30HMHL (Outboard Motor 30 HP)', '3020303004-000011', '000011', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-18', '/asets/3020303004-000011.jpg', 'Baik', '199709262022031001', 'Digunakan sendiri untuk operasional · Merk: Yamaha E30HMHL (Outboard Motor 30 HP) · Tipe: Yamaha E30HMHL (Outboard Motor 30 HP)', '3020303004', 'Yamaha E30HMHL (Outboard Motor 30 HP)', 'Yamaha E30HMHL (Outboard Motor 30 HP)', NULL, NULL, '2023-10-02', 'SK.SU-125/PL.01.05/VII/BSN-2024', '2024-07-18', 55000000, 16500000, 38500000, 14, 1, 'Digunakan sendiri untuk operasional', '0BD126B590074388E063BAAAD80AEB94', 'Aktif'),
  ('ast-029', 'Out Boat Motor Yamaha F300 DET', '3020303004-000012', '000012', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2026-06-29', '/asets/3020303004-000012.jpg', 'Baik', '198102142005021001', 'Digunakan sendiri untuk operasional · Merk: Yamaha F300 DET · Tipe: Yamaha F300 DET', '3020303004', 'Yamaha F300 DET', 'Yamaha F300 DET', NULL, NULL, '2025-12-31', '85/MK/KNL.1501/2026', '2026-06-29', 590520000, 59052000, 531468000, 18, 1, 'Digunakan sendiri untuk operasional', '49F9B13DFF103C23E06366E7D80A6961', 'Aktif'),
  ('ast-030', 'Out Boat Motor Yamaha F300 DET', '3020303004-000013', '000013', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2026-06-29', '/asets/3020303004-000013.jpg', 'Baik', '198212022007121002', 'Digunakan sendiri untuk operasional · Merk: Yamaha F300 DET · Tipe: Yamaha F300 DET', '3020303004', 'Yamaha F300 DET', 'Yamaha F300 DET', NULL, NULL, '2025-12-31', '85/MK/KNL.1501/2026', '2026-06-29', 590520000, 59052000, 531468000, 18, 1, 'Digunakan sendiri untuk operasional', '49F9B13DFF113C23E06366E7D80A6961', 'Aktif'),
  ('ast-031', 'Kapal SAR Kelas II Kapal Penyelamatan (Rescue Boat)', '3020303037-000001', '000001', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-16', '/asets/3020303037-000001.jpg', 'Baik', '199709262022031001', 'Digunakan sendiri untuk operasional · Merk: Kapal Penyelamatan (Rescue Boat) · Tipe: Kapal Penyelamatan (Rescue Boat)', '3020303037', 'Kapal Penyelamatan (Rescue Boat)', 'Kapal Penyelamatan (Rescue Boat)', NULL, NULL, '2021-12-01', '65/KM.6/KNL.1501/2024', '2024-07-16', 47961632500, 23980816250, 23980816250, 10, 1, 'Digunakan sendiri untuk operasional', 'E13C04DF637991F5E0531561F20AF978', 'Aktif'),
  ('ast-032', 'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', '3020303040-000002', '000002', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2024-07-16', '/asets/3020303040-000002.jpg', 'Baik', '198212022007121002', 'Digunakan sendiri untuk operasional · Merk: Rigid Inflatable Boat (RIB) Kelas I · Tipe: Vektor RIB 1100 · No. Polisi: RIB 02', '3020303040', 'Rigid Inflatable Boat (RIB) Kelas I', 'Vektor RIB 1100', NULL, 'RIB 02', '2021-06-04', '65/KM.6/KNL.1501/2024', '2024-07-16', 2824819300, 1553650615, 1271168685, 9, 2, 'Digunakan sendiri untuk operasional', 'E13C04DF637091F5E0531561F20AF978', 'Aktif'),
  ('ast-033', 'Rigid Inflatable Boat (RIB) Kelas I Sea First', '3020303040-000006', '000006', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2026-06-29', '/asets/3020303040-000006.jpg', 'Baik', '198807022022031001', 'Digunakan sendiri untuk operasional · Merk: Sea First · Tipe: Sea First', '3020303040', 'Sea First', 'Sea First', NULL, NULL, '2025-12-31', '85/MK/KNL.1501/2026', '2026-06-29', 51559500, 5155950, 46403550, 18, 1, 'Digunakan sendiri untuk operasional', '49F9B13DFF123C23E06366E7D80A6961', 'Aktif'),
  ('ast-034', 'Rigid Inflatable Boat (RIB) Kelas I RIGID BOUYANCY BOAT (RBB) SAR RESCUE BOAT', '3020303040-000007', '000007', 'Kapal', 'Standby', 'Dermaga / Gudang Perahu', '2026-06-29', '/asets/3020303040-000007.jpg', 'Baik', '198102142005021001', 'Digunakan sendiri untuk operasional · Merk: RIGID BOUYANCY BOAT (RBB) SAR RESCUE BOAT · Tipe: RIGID BOUYANCY BOAT (RBB) SAR RESCUE BOAT', '3020303040', 'RIGID BOUYANCY BOAT (RBB) SAR RESCUE BOAT', 'RIGID BOUYANCY BOAT (RBB) SAR RESCUE BOAT', NULL, NULL, '2025-12-31', '85/MK/KNL.1501/2026', '2026-06-29', 2458338090, 245833809, 2212504281, 18, 1, 'Digunakan sendiri untuk operasional', '4A1EAB2403FBE536E06366E7D80AFB1D', 'Aktif');

-- 2. RIWAYAT ASET (68 baris)
INSERT INTO public.riwayat_aset (aset_id, tanggal, aksi, keterangan, user_id) VALUES
  ('ast-001', '2009-11-26', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '199810212022032001'),
  ('ast-001', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '199810212022032001'),
  ('ast-002', '2011-11-21', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-002', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-003', '2024-05-28', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2025).', '199810212022032001'),
  ('ast-003', '2025-07-30', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2025.', '199810212022032001'),
  ('ast-004', '2024-05-28', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2025).', '1111111111111111'),
  ('ast-004', '2025-07-30', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2025.', '1111111111111111'),
  ('ast-005', '2015-10-12', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2026).', '199810212022032001'),
  ('ast-005', '2026-06-29', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2026.', '199810212022032001'),
  ('ast-006', '2020-03-20', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-006', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-007', '2018-08-15', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '199810212022032001'),
  ('ast-007', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '199810212022032001'),
  ('ast-008', '2020-08-31', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-008', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-009', '2022-02-07', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2025).', '199810212022032001'),
  ('ast-009', '2025-07-30', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2025.', '199810212022032001'),
  ('ast-010', '2013-06-28', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-010', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-011', '2020-07-30', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '199810212022032001'),
  ('ast-011', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '199810212022032001'),
  ('ast-012', '2020-07-30', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-012', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-013', '2020-07-30', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '199810212022032001'),
  ('ast-013', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '199810212022032001'),
  ('ast-014', '2014-10-16', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-014', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-015', '2009-01-07', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '199810212022032001'),
  ('ast-015', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '199810212022032001'),
  ('ast-016', '2009-04-01', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-016', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-017', '2022-02-07', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: SK.SU-187/PL.01.05/XI/BSN-2023).', '199810212022032001'),
  ('ast-017', '2023-11-07', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor SK.SU-187/PL.01.05/XI/BSN-2023.', '199810212022032001'),
  ('ast-018', '2013-12-16', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: SK.SU-187/PL.01.05/XI/BSN-2023).', '1111111111111111'),
  ('ast-018', '2023-11-07', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor SK.SU-187/PL.01.05/XI/BSN-2023.', '1111111111111111'),
  ('ast-019', '2002-04-30', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: SK.SU-187/PL.01.05/XI/BSN-2023).', '199810212022032001'),
  ('ast-019', '2023-11-07', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor SK.SU-187/PL.01.05/XI/BSN-2023.', '199810212022032001'),
  ('ast-020', '2009-04-01', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '1111111111111111'),
  ('ast-020', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '1111111111111111'),
  ('ast-021', '2009-04-01', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 134/KM.6/WKN.15/KNL.01/2020).', '199810212022032001'),
  ('ast-021', '2020-12-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 134/KM.6/WKN.15/KNL.01/2020.', '199810212022032001'),
  ('ast-022', '2009-01-07', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: SK.SU-187/PL.01.05/XI/BSN-2023).', '1111111111111111'),
  ('ast-022', '2023-11-07', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor SK.SU-187/PL.01.05/XI/BSN-2023.', '1111111111111111'),
  ('ast-023', '2021-06-04', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 65/KM.6/KNL.1501/2024).', '199810212022032001'),
  ('ast-023', '2024-07-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 65/KM.6/KNL.1501/2024.', '199810212022032001'),
  ('ast-024', '2021-06-04', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 65/KM.6/KNL.1501/2024).', '1111111111111111'),
  ('ast-024', '2024-07-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 65/KM.6/KNL.1501/2024.', '1111111111111111'),
  ('ast-025', '2021-12-27', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 65/KM.6/KNL.1501/2024).', '199810212022032001'),
  ('ast-025', '2024-07-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 65/KM.6/KNL.1501/2024.', '199810212022032001'),
  ('ast-026', '2021-12-27', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 65/KM.6/KNL.1501/2024).', '1111111111111111'),
  ('ast-026', '2024-07-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 65/KM.6/KNL.1501/2024.', '1111111111111111'),
  ('ast-027', '2023-10-02', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: SK.SU-125/PL.01.05/VII/BSN-2024).', '199810212022032001'),
  ('ast-027', '2024-07-18', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor SK.SU-125/PL.01.05/VII/BSN-2024.', '199810212022032001'),
  ('ast-028', '2023-10-02', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: SK.SU-125/PL.01.05/VII/BSN-2024).', '1111111111111111'),
  ('ast-028', '2024-07-18', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor SK.SU-125/PL.01.05/VII/BSN-2024.', '1111111111111111'),
  ('ast-029', '2025-12-31', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2026).', '199810212022032001'),
  ('ast-029', '2026-06-29', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2026.', '199810212022032001'),
  ('ast-030', '2025-12-31', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2026).', '1111111111111111'),
  ('ast-030', '2026-06-29', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2026.', '1111111111111111'),
  ('ast-031', '2021-12-01', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 65/KM.6/KNL.1501/2024).', '199810212022032001'),
  ('ast-031', '2024-07-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 65/KM.6/KNL.1501/2024.', '199810212022032001'),
  ('ast-032', '2021-06-04', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 65/KM.6/KNL.1501/2024).', '1111111111111111'),
  ('ast-032', '2024-07-16', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 65/KM.6/KNL.1501/2024.', '1111111111111111'),
  ('ast-033', '2025-12-31', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2026).', '199810212022032001'),
  ('ast-033', '2026-06-29', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2026.', '199810212022032001'),
  ('ast-034', '2025-12-31', 'Perolehan BMN', 'Aset diperoleh dan tercatat dalam register BMN (PSP: 85/MK/KNL.1501/2026).', '1111111111111111'),
  ('ast-034', '2026-06-29', 'Penetapan Status Penggunaan', 'Ditetapkan penggunaannya melalui PSP nomor 85/MK/KNL.1501/2026.', '1111111111111111');

-- 3. EWS TICKETS (6 baris)
INSERT INTO public.ews_tickets (id, aset_id, judul, deskripsi, tingkat_keparahan, status, tanggal_buat, tanggal_update, assigned_to) VALUES
  ('ews-001', 'ast-034', 'Kebocoran Halus pada Lambung RIB', 'Ditemukan kebocoran halus pada sambungan lambung RBB SAR Rescue Boat setelah operasi terakhir. Perlu uji tekanan dan penambalan sebelum dipakai kembali.', 'Sedang', 'Diproses', '2026-09-25', '2026-09-26', '1111111111111111'),
  ('ews-002', 'ast-007', 'Mesin Rescue Truck Bunyi Kasar', 'Rescue Truck ISUZU mengeluarkan bunyi kasar saat idle dan akselerasi. Khawatir mengganggu mobilisasi cepat saat operasi.', 'Tinggi', 'Diproses', '2026-09-27', '2026-09-27', '199810212022032001'),
  ('ews-003', 'ast-016', 'Mesin Tempel GEMINI Sulit Distarter', 'Mesin tempel GEMINI SEA RIDER pada Speed Boat sering gagal distarter saat dingin. Dugaan awal masalah pada busi dan sistem bahan bakar.', 'Rendah', 'Menunggu', '2026-09-23', '2026-09-23', '1111111111111111'),
  ('ews-004', 'ast-020', 'Pompa Air Pendingin Lemah', 'Out Boat Motor YAMAHA ENDURO menunjukkan aliran air pendingin yang melemah. Sudah dibersihkan, perlu pemantauan saat operasi berikutnya.', 'Sedang', 'Selesai', '2026-09-19', '2026-09-20', '199810212022032001'),
  ('ews-005', 'ast-031', 'GPS Navigasi Kapal SAR Tidak Akurat', 'Perangkat GPS pada Kapal SAR Kelas II menunjukkan deviasi posisi hingga 150 meter, berpotensi mengganggu navigasi saat misi pencarian area luas.', 'Rendah', 'Selesai', '2026-09-07', '2026-09-08', '200006042025061006'),
  ('ews-006', 'ast-029', 'Tekanan Oli Mesin F300 Tidak Stabil', 'Out Boat Motor Yamaha F300 DET menunjukkan tekanan oli tidak stabil pada putaran tinggi. Berisiko merusak mesin jika dipaksakan beroperasi.', 'Tinggi', 'Menunggu', '2026-09-26', '2026-09-26', '1111111111111111');

-- 4. ANTREAN VERIFIKASI (5 baris)
INSERT INTO public.antrean_verifikasi (id, tipe, judul, deskripsi, status, tanggal_buat, created_by, catatan_revisi) VALUES
  ('ver-001', 'Draf Aset', 'Penambahan Aset: Chain Stihl MS 261', 'Pengajuan penambahan mesin chainset Stihl MS 261 untuk keperluan operasi SAR di daerah hutan dan pegunungan. Harga perkiraan Rp 18.500.000.', 'Menunggu', '2026-09-26', '199810212022032001', NULL),
  ('ver-002', 'Laporan Kerusakan', 'Kerusakan Rescue Truck - Rusak Ringan', 'Rescue Truck ISUZU mengalami kebocoran halus pada sistem rem dan lampu kabin belakang mati. Perlu penggantian kampas rem dan pemeriksaan kelistrikan.', 'Disetujui', '2026-09-25', '198807022022031001', 'Disetujui. Gunakan anggaran pemeliharaan Q3. Mohon sertakan foto kerusakan lebih detail pada laporan berikutnya.'),
  ('ver-003', 'Laporan Kerusakan', 'Kerusakan RIB - Bocor Halus', 'RIB Kelas I ditemukan bocor halus pada sambungan jahitan lambung. Sudah dilakukan penambalan sementara, perlu perbaikan permanen.', 'Disetujui', '2026-09-19', '199709262022031001', NULL),
  ('ver-004', 'Draf Aset', 'Penambahan Aset: Thermal Imaging Camera', 'Pengajuan pembelian kamera termal FLIR untuk operasi pencarian korban dalam kondisi malam hari atau area berasap. Harga perkiraan Rp 85.000.000.', 'Ditolak', '2026-09-21', '199810212022032001', 'Ditolak sementara karena melebihi pagu anggaran BMN tahun berjalan. Mohon ajukan kembali pada penganggaran tahun depan dengan kajian kebutuhan yang lebih komprehensif.'),
  ('ver-005', 'Laporan Kerusakan', 'Kerusakan Mesin Tempel - Overheat', 'Out Boat Motor Yamaha F300 DET mengalami overheat pada operasi terakhir. Perlu pemeriksaan sistem pendingin dan penggantian impeller.', 'Menunggu', '2026-09-23', '198212022007121002', NULL);

-- 5a. CHECKLIST TEMPLATES (7 baris)
INSERT INTO public.checklist_templates (id, nama, kategori, periode, jenis_armada, sumber) VALUES
  ('arm-motor-mingguan', 'Ceklist Perawatan Motor Trail (Mingguan)', 'Motor', 'Mingguan', 'Motor', 'Ceklist Perawatan Motor Trail B 3184 PKQ'),
  ('arm-mobil-harian', 'Ceklist Perawatan Kendaraan (Harian)', 'Mobil', 'Harian', 'Mobil', 'Ceklist Perawatan Kendaraan'),
  ('arm-mobil-mingguan', 'Ceklist Perawatan Kendaraan (Mingguan)', 'Mobil', 'Mingguan', 'Mobil', 'Ceklist Perawatan Kendaraan'),
  ('arm-mobil-bulanan', 'Ceklist Perawatan Kendaraan (Bulanan)', 'Mobil', 'Bulanan', 'Mobil', 'Ceklist Perawatan Kendaraan'),
  ('arm-rib-pemeliharaan', 'Ceklist Pemeliharaan RIB', 'Kapal', 'Harian', 'RIB', 'Jurnal RIB 01 & 02 + Dokumentasi Data RIB'),
  ('arm-kapalar-harian', 'Ceklist Kapal Khusus SAR (Harian)', 'Kapal', 'Harian', 'Kapal', 'Logbook Kapal SAR KN SAR MAMUJU 01'),
  ('arm-rbb-harian', 'Ceklist RBB (Harian)', 'Kapal', 'Harian', 'RBB', 'Logbook RBB 309 MAMUJU');

-- 5b. CHECKLIST ITEMS (106 baris)
INSERT INTO public.checklist_items (template_id, item_id, label, wajib, kondisi, keterangan, is_kritis) VALUES
  ('arm-motor-mingguan', 'arm-motor-mingguan-01', 'Level Oli Mesin', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-02', 'Kondisi Ban', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-03', 'Tekanan Ban', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-04', 'Keausan', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-05', 'Rantai Penggerak', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-06', 'Baut Mur dan Pengencangan', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-07', 'Stang (Bergerak Lancar)', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-08', 'Level Minyak Rem', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-09', 'Kampas Rem', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-10', 'Kerja Gas', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-11', 'Tuas Kopling', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-12', 'Klakson', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-13', 'Lampu Depan', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-14', 'Lampu Belakang / Rem', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-15', 'Lampu Sein', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-16', 'Engine Stop Switch', true, 'Baik', NULL, true),
  ('arm-motor-mingguan', 'arm-motor-mingguan-17', 'Standar Samping', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-18', 'Indikator Spedometer', true, 'Baik', NULL, false),
  ('arm-motor-mingguan', 'arm-motor-mingguan-19', 'Kaca Spion', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-01', 'Oli Mesin', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-02', 'Oli Power Steering', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-03', 'Fan Belt', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-04', 'Tutup Radiator', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-05', 'Level Minyak Rem / Kopling', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-06', 'Radio Komunikasi', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-07', 'Seat Belt (Sabuk Pengaman)', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-08', 'Sirine & Lightbar', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-09', 'Gerak Bebas Pedal Rem', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-10', 'Gerak Bebas Kopling', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-11', 'Gerak Bebas Pedal Gas', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-12', 'Instrumen Indikator', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-13', 'Kemudahan Start Engine', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-14', 'Langkah Tuas Rem Parkir', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-15', 'Sapuan Wiper', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-16', 'Kaca Spion Dalam', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-17', 'Level Cairan Washer', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-18', 'Gerak Bebas Kemudi', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-19', 'Klakson', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-20', 'Power Window / Door Lock', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-21', 'Kunci Roda & Toolkit', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-22', 'Lampu-Lampu', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-23', 'Pegas Suspensi / Kaki-Kaki / Per Daun', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-24', 'Kebocoran / Tetesan Fluid', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-25', 'Kondisi Kaca-Kaca', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-26', 'Wiper', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-27', 'Saringan Bahan Bakar', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-28', 'Rolling Door Compartment', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-29', 'Engsel Pintu-Pintu', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-30', 'Kunci Pintu-Pintu', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-31', 'Towing', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-32', 'Tekanan Ban', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-33', 'Tapak dan Dinding Ban', true, 'Baik', NULL, true),
  ('arm-mobil-harian', 'arm-mobil-harian-34', 'Keausan Ban', true, 'Baik', NULL, false),
  ('arm-mobil-harian', 'arm-mobil-harian-35', 'Pemasangan Velg', true, 'Baik', NULL, true),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-01', 'Kerja AC', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-02', 'Kerja Rem', true, 'Baik', NULL, true),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-03', 'Kerja Kopling', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-04', 'Kerja Pedal Gas', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-05', 'Kerja Kaki-Kaki', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-06', 'Kerja Sistem 4WD', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-07', 'Kaca Depan', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-08', 'Spion Luar', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-09', 'Floodlight System', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-10', 'Lampu-Lampu', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-11', 'Level Cairan Pendingin', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-12', 'APAR', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-13', 'Plat Nopol', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-14', 'Ban Cadangan', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-15', 'Kebersihan Kendaraan', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-16', 'Jok / Tempat Duduk', true, 'Baik', NULL, false),
  ('arm-mobil-mingguan', 'arm-mobil-mingguan-17', 'Kaca Film', true, 'Baik', NULL, false),
  ('arm-mobil-bulanan', 'arm-mobil-bulanan-01', 'Winch', true, 'Baik', NULL, true),
  ('arm-rib-pemeliharaan', 'arm-rib-01', 'Pemanasan Mesin Rutin / Pra-Jalan', true, 'Baik', 'Standar: 15 menit, 100%', true),
  ('arm-rib-pemeliharaan', 'arm-rib-02', 'Indikator Mesin Aman Setelah Pemanasan', true, 'Baik', 'Mesin beroperasi normal, indikator aman', false),
  ('arm-rib-pemeliharaan', 'arm-rib-03', 'Jam Berangkat (WITA)', true, 'Baik', 'Contoh: 08:00 WITA', false),
  ('arm-rib-pemeliharaan', 'arm-rib-04', 'Jam Kembali (WITA)', true, 'Baik', 'Contoh: 12:00 WITA - Patroli Alut / Misi SAR', false),
  ('arm-rib-pemeliharaan', 'arm-rib-05', 'Sisa BBM Kemarin (Liter / % / Status)', true, 'Baik', 'Contoh: 50 L / 40% - Cukup atau Kurang', true),
  ('arm-rib-pemeliharaan', 'arm-rib-06', 'Penambahan BBM (Liter / % / No. Struk)', true, 'Baik', 'Contoh: 60 L / 50% - No. Struk / Sumber BBM', false),
  ('arm-rib-pemeliharaan', 'arm-rib-07', 'Saldo Akhir BBM (Total Liter / % / Kondisi Tanki)', true, 'Baik', 'Contoh: 110 L / 90% - Penuh, Cukup, atau Perlu Re-fill', true),
  ('arm-rib-pemeliharaan', 'arm-rib-08', 'Tali Tros', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-09', 'Lunas', true, 'Baik', NULL, true),
  ('arm-rib-pemeliharaan', 'arm-rib-10', 'Ban Pelampung', true, 'Baik', NULL, true),
  ('arm-rib-pemeliharaan', 'arm-rib-11', 'Deck', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-12', 'Transom (Stand Mesin)', true, 'Baik', NULL, true),
  ('arm-rib-pemeliharaan', 'arm-rib-13', 'Starting Engine', true, 'Baik', NULL, true),
  ('arm-rib-pemeliharaan', 'arm-rib-14', 'Kap Mesin Kanan', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-15', 'Kap Mesin Kiri', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-16', 'Karbulator', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-17', 'Selang BBM', true, 'Baik', NULL, true),
  ('arm-rib-pemeliharaan', 'arm-rib-18', 'Busi', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-19', 'Dinamo Stater', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-20', 'Dinamo Strom', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-21', 'Hydraulic Mesin', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-22', 'Aki / Baterai', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-23', 'GPS Furuno', true, 'Baik', NULL, false),
  ('arm-rib-pemeliharaan', 'arm-rib-24', 'GPS Stracking', true, 'Baik', NULL, false),
  ('arm-kapalar-harian', 'arm-kapalar-01', 'Alat Navigasi', true, 'Baik', NULL, false),
  ('arm-kapalar-harian', 'arm-kapalar-02', 'Alat Komunikasi', true, 'Baik', NULL, false),
  ('arm-kapalar-harian', 'arm-kapalar-03', 'Persentase BBM', true, 'Baik', NULL, false),
  ('arm-kapalar-harian', 'arm-kapalar-04', 'Endurance', true, 'Baik', NULL, false),
  ('arm-kapalar-harian', 'arm-kapalar-05', 'Kecepatan Rata', true, 'Baik', NULL, false),
  ('arm-rbb-harian', 'arm-rbb-01', 'Alat Navigasi', true, 'Baik', NULL, false),
  ('arm-rbb-harian', 'arm-rbb-02', 'Alat Komunikasi', true, 'Baik', NULL, false),
  ('arm-rbb-harian', 'arm-rbb-03', 'Persentase BBM', true, 'Baik', NULL, false),
  ('arm-rbb-harian', 'arm-rbb-04', 'Endurance', true, 'Baik', NULL, false),
  ('arm-rbb-harian', 'arm-rbb-05', 'Kecepatan Rata', true, 'Baik', NULL, false);

-- 6. NOTIFIKASI (6 baris)
INSERT INTO public.notifications (id, judul, pesan, tipe, dibaca, tanggal) VALUES
  ('ntf-001', 'Laporan Kerusakan Baru', 'RBB SAR Rescue Boat mengalami kebocoran halus pada lambung. Status: Menunggu Verifikasi.', 'warning', false, '2026-09-25T08:30:00'),
  ('ntf-002', 'Peminjaman Aset', 'Sepeda Motor Kawasaki KLX 230 (B 3184 PKQ) dipinjam oleh Hasril untuk operasi Binanga.', 'info', false, '2026-09-22T10:15:00'),
  ('ntf-003', 'Maintenance Kendaraan', 'Rescue Truck ISUZU (DC 8982) sedang dalam maintenance di bengkel. Estimasi selesai 2 Oktober 2026.', 'warning', true, '2026-09-27T09:00:00'),
  ('ntf-004', 'Verifikasi Disetujui', 'Laporan kerusakan RIB Kelas I telah disetujui oleh Verifikator.', 'success', true, '2026-09-20T14:45:00'),
  ('ntf-005', 'EWS Ticket Tinggi', 'Out Boat Motor Yamaha F300 DET mengalami tekanan oli tidak stabil. Segera tindak lanjuti!', 'danger', false, '2026-09-26T16:20:00'),
  ('ntf-006', 'Aset Kembali Standby', 'Kapal SAR Kelas II telah selesai dikalibrasi navigasinya dan kembali standby.', 'success', true, '2026-09-08T11:30:00');

-- 7. LOG AKTIVITAS (12 baris)
INSERT INTO public.activity_log (id, user_id, aksi, target, tanggal, detail) VALUES
  ('log-001', '199709262022031001', 'UPDATE_JURNAL_SIAGA', 'Jurnal Siaga Rutin', '2026-10-08T17:00:00', 'Jurnal Siaga Rutin 8 Oktober 2026 diperbarui (Shift Pagi)'),
  ('log-002', '198212022007121002', 'SETOR_CHECKLIST', 'Checklist RIB 12M', '2026-10-08T08:30:00', 'Checklist RIB Kelas I jam 08.00 disetor, semua item OK'),
  ('log-003', '198102142005021001', 'UPDATE_LOGBOOK', 'Logbook Motor', '2026-10-08T09:00:00', 'Logbook Sepeda Motor Kawasaki KLX 230 (B 3184 PKQ) diperiksa harian'),
  ('log-004', '198807022022031001', 'UPDATE_CHECKLIST', 'Checklist Mobil', '2026-10-07T16:00:00', 'Checklist harian Rescue Truck ISUZU disetor. Rem, lampu, dan kelistrikan dalam kondisi baik'),
  ('log-005', '199709262022031001', 'ABSENSI_SIAGA', 'Absensi Shift', '2026-10-07T07:00:00', 'Absensi shift pagi, 6 personel hadir, 0 tidak hadir'),
  ('log-006', '198212022007121002', 'SETOR_CHECKLIST', 'Checklist RIB Kelas I', '2026-10-07T08:15:00', 'Checklist harian RIB Kelas I. Lambung OK, pompa OK'),
  ('log-007', '199810212022032001', 'UPDATE_LOGBOOK', 'Logbook Mobil', '2026-10-06T10:00:00', 'Logbook Rescue Truck ISUZU (DC 8982), kembali dari bengkel, status Standby'),
  ('log-008', '199709262022031001', 'UPDATE_JURNAL_SIAGA', 'Jurnal Siaga Rutin', '2026-10-06T17:00:00', 'Jurnal Siaga Rutin 6 Oktober 2026. Shift Sore, kondisi normal'),
  ('log-009', '198807022022031001', 'SETOR_CHECKLIST', 'Checklist Mobil', '2026-10-05T09:00:00', 'Checklist mobil operasional. Lampu, klakson, dan radio komunikasi OK'),
  ('log-010', '198212022007121002', 'PEMANASAN_RIB', 'RIB Kelas I', '2026-10-05T07:30:00', 'Pemanasan mesin RIB Kelas I. RPM stabil, oli cukup, BBM 80%'),
  ('log-011', '198102142005021001', 'ABSENSI_SIAGA', 'Absensi Shift', '2026-10-04T07:00:00', 'Absensi shift pagi, 5 personel hadir, 1 cuti'),
  ('log-012', '199709262022031001', 'SETOR_CHECKLIST', 'Checklist Selam', '2026-10-04T08:00:00', 'Inspeksi peralatan selam. Tabung 200 bar, regulator OK');

-- 8. RIWAYAT OPERASI (2 baris)
INSERT INTO public.riwayat_operasi (id, tanggal, jenis, lokasi, durasi, personel, hasil, keterangan) VALUES
  ('op-001', '2026-10-02', 'Evakuasi Korban Tenggelam', 'Desa Binanga, Mamuju', '4 jam', 6, 'Berhasil', '1 korban dievakuasi selamat. Tim menggunakan RIB 12M dan peralatan selam.'),
  ('op-002', '2026-09-15', 'Pencarian Korban Hilang', 'Pantai Karampuang, Mamuju', '2 jam', 3, 'Berhasil', 'Korban ditemukan di area pantai selatan. Koordinasi dengan nelayan lokal.');

-- 9. APPROVAL (5 baris)
INSERT INTO public.approvals (id, kode, nama_aset, kategori, pengajuan_oleh, tanggal, status, alasan, rincian) VALUES
  ('apr-001', 'BMN-SAR-005', 'Chain Stihl MS 261', 'Peralatan SAR', '199810212022032001', '2026-09-26', 'Menunggu', 'Menggantikan chainsaw lama yang sudah tidak berfungsi optimal karena mata rantai aus.', '[{"label":"Kondisi Aset Lama","value":"Rusak Berat"},{"label":"Usia Pakai","value":"6 tahun"},{"label":"Estimasi Biaya","value":"Rp 4.500.000"},{"label":"Sumber Dana","value":"DIPA 2026"}]'::jsonb),
  ('apr-002', 'BMN-KOM-003', 'Thermal Imaging Camera FLIR', 'Komunikasi', '199810212022032001', '2026-09-21', 'Ditolak', 'Usulan tidak sesuai prioritas kebutuhan. Anggaran tahun ini sudah terpakai untuk kebutuhan komunikasi VHF.', '[{"label":"Kondisi Aset Lama","value":"Baik"},{"label":"Usia Pakai","value":"1 tahun"},{"label":"Estimasi Biaya","value":"Rp 38.000.000"},{"label":"Sumber Dana","value":"DIPA 2026"}]'::jsonb),
  ('apr-003', 'BMN-MED-003', 'Tabung Oksigen 10L', 'Medis', '1111111111111111', '2026-09-24', 'Disetujui', 'Menambah stok oksigen untuk tim medis lapangan agar siap pada setiap operasi evakuasi.', '[{"label":"Kondisi Aset Lama","value":"Habis Terpakai"},{"label":"Usia Pakai","value":"3 tahun"},{"label":"Estimasi Biaya","value":"Rp 1.750.000"},{"label":"Sumber Dana","value":"DIPA 2026"}]'::jsonb),
  ('apr-004', 'BMN-DOK-003', 'Laptop Field Rugged Panasonic', 'Dokumentasi', '198208042009121003', '2026-09-18', 'Menunggu', 'Laptop lama sering gagal menyala di lapangan karena kompresinya sudah tidak stabil.', '[{"label":"Kondisi Aset Lama","value":"Rusak Ringan"},{"label":"Usia Pakai","value":"5 tahun"},{"label":"Estimasi Biaya","value":"Rp 12.000.000"},{"label":"Sumber Dana","value":"DIPA 2026"}]'::jsonb),
  ('apr-005', 'BMN-KND-003', 'Motor Honda CRF250R', 'Motor', '199810212022032001', '2026-09-20', 'Menunggu', 'Menambah armada motor trail untuk memperbesar daya jangkau di wilayah pedalaman yang sulit dijangkau kendaraan roda empat.', '[{"label":"Kondisi Aset Lama","value":"Tidak Ada (Usulan Baru)"},{"label":"Usia Pakai","value":"-"},{"label":"Estimasi Biaya","value":"Rp 58.000.000"},{"label":"Sumber Dana","value":"DIPA 2026"}]'::jsonb);

-- 10. LOGBOOK PERJALANAN (16 baris)
INSERT INTO public.logbook_perjalanan (id, tanggal, jam_berangkat, jam_kembali, rute, tujuan, kategori_unit, jenis_unit, nahkoda, jumlah_personel, bbm_sebelum, bbm_sesudah, endurance_awal, endurance_akhir, km_sebelum, km_sesudah, status, catatan, tanggal_simpan, tanggal_lengkap) VALUES
  ('lp-01', '2026-10-08', '08:00', '10:30', 'Dermaga Mamuju - Perairan Mamuju', 'Patroli rutin', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', 'Fajar Farial', 4, '90%', '75%', '76:30', '63:45', NULL, NULL, 'Selesai', 'Kondisi laut normal, tidak ada insiden', '2026-10-08T08:00:00', '2026-10-08T10:30:00'),
  ('lp-02', '2026-10-08', '11:00', '13:00', 'Perairan Mamuju - Pantai Karampuang', 'Sosialisasi SAR', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Sea First', 'Hasril', 5, '85%', '65%', '63:45', '55:15', NULL, NULL, 'Selesai', 'Sosialisasi keselamatan pantai kepada nelayan', '2026-10-08T11:00:00', '2026-10-08T13:00:00'),
  ('lp-03', '2026-10-07', '09:00', '12:00', 'Dermaga Mamuju - Perairan Binanga', 'Operasi evakuasi', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', 'Ahmad Aidid', 6, '95%', '60%', '82:00', '58:30', NULL, NULL, 'Selesai', 'Evakuasi korban tenggelam, 2 orang selamat', '2026-10-07T09:00:00', '2026-10-07T12:00:00'),
  ('lp-04', '2026-10-07', '14:00', '16:00', 'Perairan Mamuju - Pos Pantai', 'Patroli pantai', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Sea First', 'Ardiansyah', 3, '80%', '70%', '70:15', '66:45', NULL, NULL, 'Selesai', 'Pantai ramai pengunjung, kondisi aman', '2026-10-07T14:00:00', '2026-10-07T16:00:00'),
  ('lp-05', '2026-10-06', '08:30', '11:30', 'Dermaga Mamuju - Perairan Mamuju', 'Latihan SAR', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', 'Medlyn R. Pagali', 8, '100%', '70%', '90:00', '72:30', NULL, NULL, 'Selesai', 'Latihan teknik penyelamatan korban di air', '2026-10-06T08:30:00', '2026-10-06T11:30:00'),
  ('lp-06', '2026-10-09', '08:00', NULL, 'Dermaga Mamuju - Perairan Mamuju', 'Patroli rutin', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Sea First', 'Kauluddin', 4, '88%', NULL, '78:15', NULL, NULL, NULL, 'Sedang Digunakan', 'Sedang dalam perjalanan', '2026-10-09T08:00:00', NULL),
  ('lp-07', '2026-10-09', '14:00', NULL, 'Perairan Mamuju - Pos Pantai', 'Patroli sore', 'RIB', 'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', 'Rizky Pratama', 3, '85%', NULL, '80:00', NULL, NULL, NULL, 'Sedang Digunakan', 'Dijadwalkan untuk shift sore', '2026-10-09T14:00:00', NULL),
  ('lp-11', '2026-10-10', '08:00', '10:30', 'Dermaga Mamuju - Perairan Mamuju - Pantai Karampuang', 'Patroli laut dan pengamatan korban', 'Kapal', 'Kapal SAR Kelas II Kapal Penyelamatan (Rescue Boat)', 'Ansaruddin', 6, '88%', '74%', '80:00', '70:15', NULL, NULL, 'Selesai', 'Pantai Karampuang, tinggi gelombang 1,5 meter. Kapal beroperasi normal.', '2026-10-10T08:00:00', '2026-10-10T10:30:00'),
  ('lp-12', '2026-10-09', '14:00', '16:45', 'Dermaga Mamuju - Perairan Teluk Mamuju', 'Sosialisasi kesiapsiagaan SAR', 'Kapal', 'Kapal SAR Kelas II Kapal Penyelamatan (Rescue Boat)', 'Kauluddin', 5, '82%', '71%', '74:30', '66:00', NULL, NULL, 'Selesai', 'Sosialisasi kepada manager desa dan BM bersudara.', '2026-10-09T14:00:00', '2026-10-09T16:45:00'),
  ('lp-13', '2026-10-11', NULL, NULL, 'Dermaga Mamuju - Perairan Mamuju', 'Patroli rutin', 'Kapal', 'Kapal SAR Kelas II Kapal Penyelamatan (Rescue Boat)', 'Fajar Farial', 6, '90%', NULL, '86:15', NULL, NULL, NULL, 'Menunggu Penggunaan', 'Shift pagi, menunggu konfirmasi cuaca.', '2026-10-11T07:00:00', NULL),
  ('lp-14', '2026-10-10', '09:00', '11:15', 'Dermaga Mamuju - Perairan Mamuju', 'Evakuasi korban tenggelam', 'RIB', 'RBB 309 MAMUJU', 'Ahmad Aidid', 4, '95%', '68%', '84:00', '61:45', NULL, NULL, 'Selesai', 'Satu korban tenggelam berhasil dievakuasi ke klinik terdekat.', '2026-10-10T09:00:00', '2026-10-10T11:15:00'),
  ('lp-15', '2026-10-09', '15:30', '17:00', 'Perairan Mamuju - Pulau Kecil', 'Patroli pulau', 'RIB', 'RBB 309 MAMUJU', 'Ardiansyah', 3, '78%', '72%', '70:00', '65:30', NULL, NULL, 'Selesai', 'Patroli normal, tidak ada kelainan.', '2026-10-09T15:30:00', '2026-10-09T17:00:00'),
  ('lp-16', '2026-10-11', '08:30', NULL, 'Dermaga Mamuju - Perairan Mamuju', 'Pemeriksaan RBB', 'RIB', 'RBB 309 MAMUJU', 'Agustang', 3, '88%', NULL, '78:30', NULL, NULL, NULL, 'Sedang Digunakan', 'Pemeriksaan RBB sebelum operasi hari ini', '2026-10-11T08:30:00', NULL),
  ('lp-08', '2026-10-08', '07:30', '11:00', 'Kantor SAR Mamuju - Desa Binanga', 'Distribusi logistik bantuan', 'Mobil', 'Rescue Truck ISUZU (DC 8982)', 'Hasril', 3, '90%', '55%', NULL, NULL, '45230', '45312', 'Selesai', 'Jalan menuju Desa Binanga berlubang, perlu hati-hati pada KM 67-69', '2026-10-08T07:30:00', '2026-10-08T11:00:00'),
  ('lp-09', '2026-10-07', '09:00', '12:30', 'Kantor SAR Mamuju - Pantai Karampuang', 'Survey lokasi sosialisasi', 'Motor', 'Sepeda Motor KAWASAKI KLX 230 (B 3184 PKQ)', 'Ardiansyah', 1, '80%', '50%', NULL, NULL, '12450', '12520', 'Selesai', 'Akses jalan ke pantai cukup baik, kondisi motor normal', '2026-10-07T09:00:00', '2026-10-07T12:30:00'),
  ('lp-10', '2026-10-09', '13:00', NULL, 'Kantor SAR Mamuju - Kecamatan Kalukku', 'Evakuasi korban banjir', 'Mobil', 'Rescue Truck ISUZU (DC 8982)', 'Medlyn R. Pagali', 5, '100%', NULL, NULL, NULL, '45312', NULL, 'Sedang Digunakan', 'Operasi evakuasi pasca banjir di Kalukku', '2026-10-09T13:00:00', NULL);

-- 11. CHECKLIST HARIAN (6 baris)
INSERT INTO public.checklist_harian (id, tanggal, unit, jenis_unit, template_id, pemeriksa, pemeriksa_id, aset_id, status, item_checked, item_total, items, catatan) VALUES
  ('manual-001', '2026-10-09', 'Out Boat Motor Yamaha E40 JMHL', 'Perahu', NULL, 'Hasril', NULL, NULL, 'Lengkap', 3, 3, '[{"label":"Mesin tempel dan baling-baling","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Sistem bahan bakar tidak bocor","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Tali pengaman mesin terpasang","wajib":true,"kondisi":"Baik","keterangan":""}]'::jsonb, 'Mesin tempel siap dipakai'),
  ('manual-002', '2026-10-08', 'Out Boat Motor YAMAHA 40 PK ENDURO', 'Perahu', NULL, 'Ahmad Aidid', NULL, NULL, 'Belum Lengkap', 2, 3, '[{"label":"Busi dan kabel pengapian","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Pompa air pendingin","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kondisi tangki bahan bakar","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""}]'::jsonb, 'Kondisi tangki bahan bakar perlu dicek sebelum operasi'),
  ('arm-001', '2026-10-10', 'Sepeda Motor KAWASAKI KLX 230 (B 3184 PKQ)', 'Motor', 'arm-motor-mingguan', 'Ardiansyah', NULL, NULL, 'Belum Lengkap', 17, 19, '[{"label":"Level Oli Mesin","wajib":true,"kondisi":"Rusak Ringan","keterangan":"Oli sudah encer, perlu diganti"},{"label":"Kondisi Ban","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Tekanan Ban","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Keausan","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Rantai Penggerak","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Baut Mur dan Pengencangan","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Stang (Bergerak Lancar)","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Level Minyak Rem","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kampas Rem","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kerja Gas","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Tuas Kopling","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Klakson","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Lampu Depan","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Lampu Belakang / Rem","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Lampu Sein","wajib":true,"kondisi":"Rusak Ringan","keterangan":"Lampu sein kanan mati"},{"label":"Engine Stop Switch","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Standar Samping","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Indikator Spedometer","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""},{"label":"Kaca Spion","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""}]'::jsonb, 'Level oli mesin perlu diganti, lampu sein kanan mati'),
  ('arm-002', '2026-10-10', 'Rescue Truck ISUZU (DC 8982)', 'Mobil', 'arm-mobil-harian', 'Ahmad Aidid', NULL, NULL, 'Belum Lengkap', 32, 35, '[{"label":"Oli Mesin","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Oli Power Steering","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Fan Belt","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Tutup Radiator","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Level Minyak Rem / Kopling","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Radio Komunikasi","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Seat Belt (Sabuk Pengaman)","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Sirine & Lightbar","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Gerak Bebas Pedal Rem","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Gerak Bebas Kopling","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Gerak Bebas Pedal Gas","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Instrumen Indikator","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kemudahan Start Engine","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Langkah Tuas Rem Parkir","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Sapuan Wiper","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kaca Spion Dalam","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Level Cairan Washer","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Gerak Bebas Kemudi","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Klakson","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Power Window / Door Lock","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kunci Roda & Toolkit","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Lampu-Lampu","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Pegas Suspensi / Kaki-Kaki / Per Daun","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kebocoran / Tetesan Fluid","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""},{"label":"Kondisi Kaca-Kaca","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Wiper","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Saringan Bahan Bakar","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Rolling Door Compartment","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Engsel Pintu-Pintu","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kunci Pintu-Pintu","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Towing","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Tekanan Ban","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Tapak dan Dinding Ban","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Keausan Ban","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""},{"label":"Pemasangan Velg","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""}]'::jsonb, 'Dua item belum diperiksa: Kebocoran/Tetesan Fluid dan Keausan Ban'),
  ('arm-003', '2026-10-09', 'Kapal SAR Kelas II Kapal Penyelamatan (Rescue Boat)', 'Kapal', 'arm-kapalar-harian', 'Ahmad Aidid', NULL, NULL, 'Lengkap', 5, 5, '[{"label":"Alat Navigasi","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Alat Komunikasi","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Persentase BBM","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Endurance","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kecepatan Rata","wajib":true,"kondisi":"Baik","keterangan":""}]'::jsonb, 'Semua 5 item utama dalam kondisi baik, kapal siap beroperasi'),
  ('arm-004', '2026-10-09', 'Rigid Inflatable Boat (RIB) Kelas I Vektor RIB 1100', 'Perahu', 'arm-rib-pemeliharaan', 'Ardiansyah', NULL, NULL, 'Belum Lengkap', 23, 24, '[{"label":"Pemanasan Mesin Rutin / Pra-Jalan","wajib":true,"kondisi":"Baik","keterangan":"15 menit, 100% - mesin hangat optimal"},{"label":"Indikator Mesin Aman Setelah Pemanasan","wajib":true,"kondisi":"Baik","keterangan":"Mesin beroperasi normal, indikator aman"},{"label":"Jam Berangkat (WITA)","wajib":true,"kondisi":"Baik","keterangan":"07:00 WITA"},{"label":"Jam Kembali (WITA)","wajib":true,"kondisi":"Baik","keterangan":"10:15 WITA - Patroli Alut / Misi SAR"},{"label":"Sisa BBM Kemarin (Liter / % / Status)","wajib":true,"kondisi":"Baik","keterangan":"50 L / 40% - Cukup"},{"label":"Penambahan BBM (Liter / % / No. Struk)","wajib":true,"kondisi":"Baik","keterangan":"60 L / 50% - No. Struk 0451/PU/2026"},{"label":"Saldo Akhir BBM (Total Liter / % / Kondisi Tanki)","wajib":true,"kondisi":"Baik","keterangan":"96 L / 80% - Cukup"},{"label":"Tali Tros","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Lunas","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Ban Pelampung","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Deck","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Transom (Stand Mesin)","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Starting Engine","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kap Mesin Kanan","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Kap Mesin Kiri","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Karbulator","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Selang BBM","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Busi","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Dinamo Stater","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Dinamo Strom","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Hydraulic Mesin","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"Aki / Baterai","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"GPS Furuno","wajib":true,"kondisi":"Baik","keterangan":""},{"label":"GPS Stracking","wajib":true,"kondisi":"Belum Diperiksa","keterangan":""}]'::jsonb, 'Pemanasan mesin, pengoperasian, dan checklist BBM terisi lengkap. GPS Stracking belum diperiksa, perlu cek kelengkapan perangkat.');

-- 12. BERITA ACARA (2 baris)
INSERT INTO public.berita_acara (id, tanggal, nama_aset, kode_aset, nomor, aset_id, checklist_id, tiket_id, pengaju_id, pelapor, pelapor_jabatan, pengaju_nama, pengaju_jabatan, tanggal_buat, tanggal_update, status, kendala, foto_bukti, uraian, alasan_penolakan, keterangan) VALUES
  ('ba-001', '2026-09-25', 'Rigid Inflatable Boat (RIB) Kelas I RBB SAR Rescue Boat', '3020303040-000007', NULL, 'ast-034', NULL, 'ews-001', '1111111111111111', 'Kauluddin', 'Pengelola BMN', 'Kauluddin', 'Pengelola BMN', '2026-09-25', '2026-09-26', 'Diserahkan', '[{"label":"Lambung RIB","merk":"RBB SAR Rescue Boat","jumlah":"1 titik","keterangan":"Bocor halus pada sambungan, perlu ditambal permanen","sifat":"Ringan"},{"label":"Katup Inflasi","merk":"Standar","jumlah":"1 pcs","keterangan":"Karet katup mulai getas, perlu diganti","sifat":"Ringan"}]'::jsonb, '[]'::jsonb, 'Ditemukan kebocoran halus pada sambungan lambung RIB setelah operasi terakhir. Sudah dilakukan penambalan sementara; diusulkan ke tempat service untuk perbaikan permanen dan penggantian katup inflasi.', NULL, 'Dikirim ke tempat service untuk perbaikan'),
  ('ba-002', '2026-09-26', 'Out Boat Motor Yamaha F300 DET', '3020303004-000012', NULL, 'ast-029', NULL, 'ews-006', '199810212022032001', 'Medlyn R. Pagali', 'Pengelola BMN', 'Medlyn R. Pagali', 'Pengelola BMN', '2026-09-26', '2026-09-26', 'Diserahkan', '[{"label":"Tekanan Oli Mesin","merk":"Yamaha F300 DET","jumlah":"1 unit","keterangan":"Tidak stabil pada putaran tinggi, perlu pemeriksaan","sifat":"Berat"}]'::jsonb, '[]'::jsonb, 'Tekanan oli tidak stabil saat mesin diuji pada putaran tinggi. Mesin tidak boleh dioperasikan sebelum sistem pelumasan diperiksa dan dinyatakan layak oleh teknisi.', NULL, 'Dikirim ke tempat service untuk perbaikan');

-- ==========================================================
-- COMMIT
-- ==========================================================
COMMIT;

-- ==========================================================
-- VERIFIKASI (cek jumlah baris per tabel)
-- ==========================================================
SELECT 'asets' AS tabel, count(*) FROM public.asets
UNION ALL SELECT 'riwayat_aset', count(*) FROM public.riwayat_aset
UNION ALL SELECT 'ews_tickets', count(*) FROM public.ews_tickets
UNION ALL SELECT 'antrean_verifikasi', count(*) FROM public.antrean_verifikasi
UNION ALL SELECT 'checklist_templates', count(*) FROM public.checklist_templates
UNION ALL SELECT 'checklist_items', count(*) FROM public.checklist_items
UNION ALL SELECT 'notifications', count(*) FROM public.notifications
UNION ALL SELECT 'activity_log', count(*) FROM public.activity_log
UNION ALL SELECT 'riwayat_operasi', count(*) FROM public.riwayat_operasi
UNION ALL SELECT 'approvals', count(*) FROM public.approvals
UNION ALL SELECT 'logbook_perjalanan', count(*) FROM public.logbook_perjalanan
UNION ALL SELECT 'checklist_harian', count(*) FROM public.checklist_harian
UNION ALL SELECT 'berita_acara', count(*) FROM public.berita_acara
ORDER BY tabel;