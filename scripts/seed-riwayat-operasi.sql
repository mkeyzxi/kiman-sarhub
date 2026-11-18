-- ============================================================
-- Seed data: riwayat_operasi
-- ============================================================
-- Isilah tabel public.riwayat_operasi dengan 10 baris contoh
-- yang realistis untuk Kantor SAR Mamuju (Sulawesi Barat).
--
-- Cara pakai:
--   • Jalankan di Supabase SQL Editor (pakai service role) atau
--   • Jalankan via REST API dengan service_role key.
--
-- Script idempoten: resolusi `ON CONFLICT DO NOTHING` di bagian
-- INSERT membuat baris yang sudah ada tidak akan digandakan.

DELETE FROM public.riwayat_operasi WHERE id LIKE 'op-%';

INSERT INTO public.riwayat_operasi (id, tanggal, jenis, lokasi, durasi, personel, hasil, keterangan) VALUES
  ('op-001', '2026-11-05', 'Evakuasi Korban Tenggelam',
    'Desa Binanga, Mamuju', '4 jam', 6, 'Berhasil',
    '1 korban dievakuasi selamat. Tim menggunakan RIB 12M dan peralatan selam.'),
  ('op-002', '2026-10-18', 'Pencarian Korban Hilang',
    'Pantai Karampuang, Mamuju', '6 jam', 8, 'Sebagian Berhasil',
    'Korban ditemukan di area pantai selatan. Koordinasi dengan nelayan lokal. Masih dalam proses identifikasi.'),
  ('op-003', '2026-09-15', 'Latihan Siaga SAR',
    'Kantor SAR Mamuju', '3 jam', 12, 'Berhasil',
    'Latihan rutin bulanan. Simulasi evakuasi korban di area perairan dangkal.'),
  ('op-004', '2026-08-22', 'Evakuasi Medis Darurat',
    'Pegunungan Marisa, Mamasa', '5 jam', 4, 'Berhasil',
    'Jalur evakuasi dari ketinggian 2.500 mdpl. Koordinasi dengan RSUD Mamuju.'),
  ('op-005', '2026-07-30', 'Pencarian & Penyelamatan',
    'Sungai Malili, Mamuju Tengah', '8 jam', 10, 'Tidak Berhasil',
    'Korban belum ditemukan. Henti pencarian sementara karena cuaca buruk, dilanjutkan keesokan harinya.'),
  ('op-006', '2026-06-12', 'Evakuasi Korban Banjir',
    'Kec. Kalukku Mamasa', '2 jam', 5, 'Berhasil',
    '3 keluarga dievakuasi ke tempat pengungsian. Menggunakan perahu karet.'),
  ('op-007', '2026-05-03', 'Latihan Siaga SAR',
    'Lapangan Kantor SAR Mamuju', '4 jam', 15, 'Berhasil',
    'Simulasi gempa bumi & tsunami. Evaluasi: respon tim 45 menit, target tercapai.'),
  ('op-008', '2026-03-25', 'Pencarian Korban Hiking',
    'Gunung Rantemario, Mamasa', '12 jam', 6, 'Berhasil',
    '2 pendaki terjebak di ketinggian 3.200 mdpl. Dievakuasi dengan teknik descender.'),
  ('op-009', '2026-02-14', 'Evakuasi Medis Darurat',
    'Pulau Karama, Mamuju Utara', '6 jam', 4, 'Sebagian Berhasil',
    'Jalur evakuasi dari perairan terbuka. 2 korban berhasil dipulangkan, 1 dalam perawatan intensif.'),
  ('op-010', '2025-11-20', 'Pencarian & Penyelamatan',
    'Teluk Mamuju', '10 jam', 12, 'Berhasil',
    '3 nelayan karam di perairan dangkal. Semua korban berhasil dievakuasi selamat.')
ON CONFLICT (id) DO NOTHING;

-- Verifikasi cepat
SELECT 'riwayat_operasi' AS tabel, count(*) AS baris
FROM public.riwayat_operasi WHERE id LIKE 'op-%';
-- Expected: 10
