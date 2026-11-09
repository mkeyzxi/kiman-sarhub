-- ============================================================
-- MIGRASI: Update nama_referensi & penanggung_jawab aset
-- Jalankan SETELAH public.users sudah berisi NIP PIC yang benar.
-- Idempoten — aman dijalankan ulang.
--
-- Peta PIC kendaraan per penempatan:
--   KANTOR:    Abd. Malik, Muhammad Adiaksa, Agan Kalana,
--              Ibnu Anjaya, Muh. Abduh Yanis, Calvin Datundelang,
--              Wahyudi, Muhammad Fajrin S.Y., Sulaeman Mustamin
--   KAPAL:     Fajar Farial (KN SAR Parikesit), Ardiansyah (RBB)
--   MAJENE:    Hasril (RIB 02, D-Max Compartment 01)
--   POLMAN:    Agustang (D-Max Compartment 02), Ahmad Aidid (RIB 01)
--   PASANGKAYU: Akmal Suryadil (D-Max DC 03, Trail 01)
--   MAMASA:    Muhammad Akbar (D-Max DC 01, Trail 03)
-- ============================================================

BEGIN;

-- ─── 1. Update nama_referensi & penanggung_jawab ─────────────────────────────

-- KANTOR
UPDATE public.asets SET
  nama_referensi = 'Rescue Truck 01 — DC 8982',
  penanggung_jawab = '199806052022031001'
WHERE id = 'ast-007';

UPDATE public.asets SET
  nama_referensi = 'Rescue Truck 02 — DC 8977',
  penanggung_jawab = '199807192025211027'
WHERE id = 'ast-008';

UPDATE public.asets SET
  nama_referensi = 'Truck Compartment — DC 8981',
  penanggung_jawab = '200206132025061001'
WHERE id = 'ast-009';

UPDATE public.asets SET
  nama_referensi = 'D-Max Compartment 02 — DC 8979',
  penanggung_jawab = '198908082010121001'
WHERE id = 'ast-011';

UPDATE public.asets SET
  nama_referensi = 'D-Max Double Cabin 02 — DC 8978',
  penanggung_jawab = '200004152022031002'
WHERE id = 'ast-012';

UPDATE public.asets SET
  nama_referensi = 'D-Max Double Cabin 03 — DC 8980',
  penanggung_jawab = '199612212022031001'
WHERE id = 'ast-013';

UPDATE public.asets SET
  nama_referensi = 'Rescue Carrier — DC 1802',
  penanggung_jawab = '199610042025211053'
WHERE id = 'ast-014';

UPDATE public.asets SET
  nama_referensi = 'D-Max Double Cabin 01 — DC 8145',
  penanggung_jawab = '199705052022031001'
WHERE id = 'ast-015';

UPDATE public.asets SET
  nama_referensi = 'KN SAR Parikesit',
  penanggung_jawab = '199709262022031001'
WHERE id = 'ast-031';

UPDATE public.asets SET
  nama_referensi = 'RIB 02 — 12 M',
  penanggung_jawab = '198212022007121002'
WHERE id = 'ast-032';

UPDATE public.asets SET
  nama_referensi = 'RIB 01 — 9 M',
  penanggung_jawab = '198807022022031001'
WHERE id = 'ast-033';

UPDATE public.asets SET
  nama_referensi = 'Trail 04 — B 3184 PKQ',
  penanggung_jawab = '200305132025061001'
WHERE id = 'ast-004';

UPDATE public.asets SET
  nama_referensi = 'Trail 01 — DC 3480',
  penanggung_jawab = '199612212022031001'
WHERE id = 'ast-005';

UPDATE public.asets SET
  nama_referensi = 'Trail 02 — DC 3481',
  penanggung_jawab = '200409052025061001'
WHERE id = 'ast-002';

UPDATE public.asets SET
  nama_referensi = 'Trail 03 — B 3183 PKQ',
  penanggung_jawab = '199705052022031001'
WHERE id = 'ast-003';

-- RBB (kapal besar) — pakai ast-034 (RIB terakhir yang tersedia)
-- Jika ada aset RBB spesifik, ganti ID di bawah.
UPDATE public.asets SET
  nama_referensi = 'RBB',
  penanggung_jawab = '198102142005021001'
WHERE id = 'ast-034';

COMMIT;

-- ─── 2. Verifikasi ─────────────────────────────────────────────────────────────
SELECT a.id, a.nama_referensi, a.penanggung_jawab,
       u.nama AS pic_nama, u.role AS pic_role
FROM public.asets a
LEFT JOIN public.users u ON u.nip = a.penanggung_jawab
ORDER BY a.id;
