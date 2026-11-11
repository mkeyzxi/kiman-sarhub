-- ============================================================
-- MIGRASI: Update lokasi penempatan aset (Master Data BMN)
-- Sumber daftar: penempatan kendaraan & penanggung jawab (9 Nov 2026)
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Idempoten — aman dijalankan ulang.
--
-- Lokasi target (sesuai daftar akun kantor / checklist harian):
--   Kantor SAR Mamuju, Pos SAR Majene,
--   USS Polewali Mandar, USS Pasangkayu, USS Mamasa
--
-- Aturan pemetaan: aset mengikuti penempatan PENANGGUNG JAWAB-nya.
--   KANTOR      -> Kantor SAR Mamuju
--   KAPAL       -> Kantor SAR Mamuju (dermaga kantor Mamuju)
--   MAJENE      -> Pos SAR Majene
--   POLMAN      -> USS Polewali Mandar
--   PASANGKAYU  -> USS Pasangkayu
--   MAMASA      -> USS Mamasa
--
-- NIP penanggung jawab (sumber: users + migrasi-peta-pic-kendaraan.sql):
--   Abd. Malik      198802052007121001
--   Muhammad Adiaksa 199806052022031001
--   Agan Kalana     199811182022031001 (Peralatan Gudang — belum ada asetnya)
--   Ibnu Anjaya     200004152022031002
--   Muh. Abduh Yanis 200206132025061001
--   Calvin Datundelang 200305132025061001
--   Wahyudi         199807192025211027
--   Muh Fajrin S.Y. 199610042025211053
--   Sulaeman Mustamin 200409052025061001
--   Fajar Farial    199709262022031001
--   Ardiansyah      198102142005021001
--   Hasril          198212022007121002
--   Agustang        198908082010121001
--   Ahmad Aidid     198807022022031001
--   Akmal Suryadil  199612212022031001
--   Muhammad Akbar  199705052022031001
-- ============================================================

BEGIN;

-- ─── KANTOR SAR MAMUJU ────────────────────────────────────────────────────────
-- Kendaraan umum + unit yang PJ-nya pegawai kantor Mamuju.

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Abd. Malik — kendaraan umum
WHERE id = 'ast-001';                                  -- Sedan · DC 1801

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Muh Fajrin S.Y.
WHERE id = 'ast-006';                                  -- Mobil Operasional PJR

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Muhammad Adiaksa
WHERE id = 'ast-007';                                  -- Rescue Truck 01 · DC 8982

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Wahyudi
WHERE id = 'ast-008';                                  -- Rescue Truck 02 · DC 8977

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Muh. Abduh Yanis
WHERE id = 'ast-009';                                  -- Truck Compartment · DC 8981

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Ibnu Anjaya
WHERE id = 'ast-012';                                  -- D-Max Double Cabin 02 · DC 8978

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Muh Fajrin S.Y.
WHERE id = 'ast-014';                                  -- Rescue Carrier · DC 1802

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Calvin Datundelang
WHERE id = 'ast-004';                                  -- Trail 04 · B 3184 PKQ

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Sulaeman Mustamin
WHERE id = 'ast-002';                                  -- Trail 02 · DC 3481

-- Out Boat Motor (mesin tempel) milik Fajar Farial & Ardiansyah —
-- mengikuti armada perahu dermaga Kantor SAR Mamuju.
UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'
WHERE penanggung_jawab IN ('199709262022031001', '198102142005021001') -- Fajar, Ardiansyah
  AND kategori = 'Kapal'
  AND nama = 'Out Boat Motor';

-- ─── KAPAL — Kantor SAR Mamuju (dermaga kantor) ──────────────────────────────
-- KN SAR Parikesit & RBB beroperasi dari dermaga Kantor SAR Mamuju.

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Fajar Farial
WHERE id = 'ast-031';                                  -- Kapal SAR Kelas II · KN SAR Parikesit

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Ardiansyah
WHERE id = 'ast-034';                                  -- RBB

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Fajar Farial
WHERE id = 'ast-016';                                  -- Speed Boat Gemini SEA RIDER

UPDATE public.asets SET lokasi = 'Kantor SAR Mamuju'   -- Ardiansyah
WHERE id = 'ast-017';                                  -- Speed Boat Yamaha E25BMH

-- ─── POS SAR MAJENE ───────────────────────────────────────────────────────────
-- Semua aset yang PJ-nya Hasril (RIB 02, D-Max Compartment 01, mesin tempelnya).

UPDATE public.asets SET lokasi = 'Pos SAR Majene'
WHERE penanggung_jawab = '198212022007121002';         -- Hasril
-- Cakupan: ast-010 (D-Max Compartment 01), ast-032 (RIB 02 — 12 M),
--          ast-018/022/026/030 (Out Boat Motor pendampingnya)

-- ─── USS POLEWALI MANDAR (POLMAN) ─────────────────────────────────────────────

UPDATE public.asets SET lokasi = 'USS Polewali Mandar' -- Agustang
WHERE id = 'ast-011';                                  -- D-Max Compartment 02 · DC 8979

UPDATE public.asets SET lokasi = 'USS Polewali Mandar' -- Ahmad Aidid
WHERE id = 'ast-033';                                  -- RIB 01 — 9 M

-- Out Boat Motor milik Ahmad Aidid — mengikuti RIB 01 di Polewali Mandar.
UPDATE public.asets SET lokasi = 'USS Polewali Mandar'
WHERE penanggung_jawab = '198807022022031001'          -- Ahmad Aidid
  AND kategori = 'Kapal'
  AND nama = 'Out Boat Motor';
-- Cakupan: ast-019, ast-023, ast-027

-- ─── USS PASANGKAYU ───────────────────────────────────────────────────────────
-- Semua aset yang PJ-nya Akmal Suryadil.

UPDATE public.asets SET lokasi = 'USS Pasangkayu'
WHERE penanggung_jawab = '199612212022031001';         -- Akmal Suryadil
-- Cakupan: ast-005 (Trail 01 · DC 3480), ast-013 (D-Max Double Cabin 03 · DC 8980)

-- ─── USS MAMASA ───────────────────────────────────────────────────────────────
-- Semua aset yang PJ-nya Muhammad Akbar.

UPDATE public.asets SET lokasi = 'USS Mamasa'
WHERE penanggung_jawab = '199705052022031001';         -- Muhammad Akbar
-- Cakupan: ast-003 (Trail 03 · B 3183 PKQ), ast-015 (D-Max Double Cabin 01 · DC 8145)

COMMIT;

-- ─── Verifikasi ───────────────────────────────────────────────────────────────
-- Cek hasil pemetaan lokasi per aset (rincian lengkap).

SELECT a.id,
       a.nama,
       a.nama_referensi,
       a.no_polisi,
       a.lokasi,
       u.nama AS penanggung_jawab
FROM public.asets a
LEFT JOIN public.users u ON u.nip = a.penanggung_jawab
ORDER BY a.lokasi, a.id;

-- Cek rekap jumlah aset per lokasi (harus total 34).
SELECT lokasi, COUNT(*) AS jumlah_aset
FROM public.asets
GROUP BY lokasi
ORDER BY jumlah_aset DESC, lokasi;
