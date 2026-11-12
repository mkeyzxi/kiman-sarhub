-- ═══════════════════════════════════════════════════════════════════════════
-- REKONSILIASI USERS ↔ EXCEL (sumber: DATAEXCEL.md, 10 Nov 2026) — v3
-- Jalankan di Supabase Dashboard → SQL Editor. Idempoten — aman diulang.
--
-- PERBAIKAN v3 (penyebab error 23503 users_id_fkey sebelumnya):
--   public.users.id ternyata FOREIGN KEY ke auth.users(id) — profil TIDAK
--   boleh dibuat tanpa akun auth-nya. Bagian 6 sekarang membuat akun AUTH
--   dulu (email {nip}@basarnas.ac.id, password default "password123"),
--   lalu identity email-nya, lalu profil public.users dengan id yang sama
--   (paritas dengan create-supabase-users-v3.mjs / Admin UI). app_metadata
--   ikut diisi agar login 0 RTT. Bagian 7 (baru) menyelaraskan email &
--   app_metadata akun auth dengan profil terkini (penting untuk NIP yang
--   di-rename — tanpa ini login dengan NIP baru akan gagal).
--
-- PERBAIKAN v2 (penyebab error 23505 users_email_key sebelumnya):
--   Sebelumnya bagian 4 memaksa RENAME NIP lama → NIP target. Bila ternyata
--   sudah ada baris lain memegang NIP/email target (kasus Zulkifli), UPDATE
--   menabrak constraint UNIQUE. Sekarang strateginya "adopsi ATAU duplikat":
--   • NIP target BELUM dipakai → rename baris lama (nama+NIP+email).
--   • NIP target SUDAH dipakai baris lain → baris lama dianggap duplikat:
--     FK-nya dipindah ke baris target, lalu baris lama dihapus.
--   Pembersihan user dummy juga diberi urutan aman: nama & email disinkron
--   DULU (menghilangkan email nyasar), baru duplikat dirapikan, baru hapus.
--
-- ATURAN PENCOCOKAN:
--   • NIP = identitas utama. NIP sama → orang yang sama → nama mengikuti
--     Excel (lengkap dengan gelar).
--   • Nama sama + NIP berbeda → orang BERBEDA (tidak pernah digabung).
--   • DELETE hanya untuk NIP yang tidak ada di Excel, KECUALI:
--       - 6 akun kantor (NIP diawali '1000000000000001'..'0000006')
--       - penanggung jawab kendaraan di tabel asets
--   • CREATE untuk pegawai Excel yang belum ada di sistem
--     (role default: Operator Lapangan).
--
-- CATATAN LOGIN:
--   Login memakai Supabase Auth (email sintetis {nip}@basarnas.ac.id).
--   Script ini juga membuat AKUN AUTH untuk user baru — password default
--   "password123" (bagikan ke yang bersangkutan; minta diganti segera,
--   flag password_changed-nya false sebagai penanda). User existing yang
--   NIP-nya di-rename (Musliadi, Zulkifli) tetap login dengan password
--   lamanya — akun auth-nya tidak dibuat ulang.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 0. DAFTAR PEGAWAI EXCEL (nip, nama final dgn gelar) ────────────────────
-- DROP dulu agar aman dijalankan ulang dalam sesi/koneksi yang sama.
DROP TABLE IF EXISTS excel_pegawai;
CREATE TEMP TABLE excel_pegawai (nip text PRIMARY KEY, nama text NOT NULL);

INSERT INTO excel_pegawai (nip, nama) VALUES
  ('198208042009121003', 'Mahmud Afandi, S.E., M.B.A.'),
  ('198102142005021001', 'Ardiansyah, S.E.'),
  ('199006192009121002', 'Aswandi, S.E.'),
  ('198503312008121002', 'Zulkifli, S.I.P.'),
  ('198709272009121001', 'Yusuf Admarapami, S.E.'),
  ('197909052007122002', 'Vanina Easty Putri AB, S.Kom.'),
  ('199810212022032001', 'Medline, S.Tr.Log.'),
  ('199208112022032001', 'Arleny Lisu Lembang, S.E.'),
  ('198704022022032001', 'Mila Afrianti, S.E.'),
  ('199104242022032001', 'Marinda Ayu Wulandari S.A.'),
  ('198802052007121001', 'Abd. Malik'),
  ('198212022007121002', 'Hasril, S.E.'),
  ('198607222007121001', 'Andi Juli Adenam Syariyanto'),
  ('199008022009121002', 'Muslih Mijayanto'),
  ('198908082010121001', 'Agustang'),
  ('199708192022031001', 'Abdal Azizul Shafa, A.Md.'),
  ('199707262022031001', 'Wawan Irwandi, A.Md.'),
  ('199612212022031001', 'Akmal Suryadil, A.Md.'),
  ('199705052022031001', 'Muhammad Akbar, A.Md.T.'),
  ('198911052022032001', 'Suria Linting, A.Md.'),
  ('199110012022031001', 'Hasrullah, A.Md.Kep.'),
  ('199812202022032001', 'Nurmiati, A.Md.Kep.'),
  ('200007182022031001', 'Abd. Rahman. R'),
  ('199811292022031001', 'Andrie Nurseta'),
  ('200202272022031001', 'Asaputra Ahmanansa'),
  ('200104132022031001', 'Abdul Kholiq Haryanto'),
  ('200004152022031002', 'Ibnu Anjaya'),
  ('200108062022031001', 'Muh. Haerul'),
  ('199807272022032001', 'Nurfiqhi Islamiyah'),
  ('199811202022031001', 'M. Yusuf Arifman'),
  ('200105082022031001', 'Muh. Ikhsan Muttaqin'),
  ('199908252022032001', 'Nur Fachira Altin Paturusi'),
  ('200111042022031001', 'Nurikhsan'),
  ('200302022022032001', 'Nurul Adha'),
  ('199806052022031001', 'Muhammad Adiaksa'),
  ('200001132022031001', 'A. Maulana Iqbal'),
  ('199804122022031001', 'Ibrahim'),
  ('199810102022031001', 'Ayr Fardan'),
  ('199811182022031001', 'Agan Kalana'),
  ('199704242020121001', 'Kamiruddin'),
  ('198802152007122001', 'Rosmiati, S.E.'),
  ('199709262022031001', 'Fajar Farial, A.Md.Tra'),
  ('199102272022031001', 'Hery Ponglimbong, A.Md.'),
  ('199305042017121007', 'Musliadi'),
  ('198807022022031001', 'Ahmad Aidid'),
  ('199210092022031001', 'Fahmi Attamimi'),
  ('200005272022031001', 'Muhammad Alfian Nur'),
  ('199108252022031001', 'Andi Tri Amri Wiratama'),
  ('200005302022031001', 'Alfiansyah'),
  ('200111082022032001', 'Selvi'),
  ('199404302022031001', 'Ardiansyah'),
  ('199106032022031001', 'Muh. Nurally Akbar'),
  ('198703122022031001', 'Jumaadi'),
  ('200006042025061006', 'Oky Juneva Marsel, A.Md.Kom.'),
  ('200505052025062003', 'A. Zarah Ghina Ulayya'),
  ('200403072025061001', 'A. M. Wacana Dewa'),
  ('200206252025061001', 'Arjun Saputra'),
  ('200305132025061001', 'Calvin Datundelang'),
  ('200508172025061001', 'Dirga Agung Saputra Juang'),
  ('200212292025062002', 'Eka Oktaviana'),
  ('200306102025061001', 'Elvin Yudistira'),
  ('200406182025061001', 'Felix Perdinandus Tumanggor'),
  ('200307072025061001', 'Halim Ma''Ruf'),
  ('200512092025062001', 'Keysa Desilga Afrinda'),
  ('200401222025061001', 'La Ode Fatur Rahman'),
  ('200206132025061001', 'Muh. Abduh Yanis'),
  ('200305252025061001', 'Muh. Alfath Maulidan'),
  ('200111212025061001', 'Muh. Azhar Hidayat R'),
  ('200003062025061003', 'Muh. Khaliq Mushawir'),
  ('200311142025061001', 'Muh. Nurfadillah Ramadan'),
  ('200011212025061002', 'Muhammad Azrullah Jaelani'),
  ('200604162025062001', 'Nadhila Syaqi'),
  ('200110212025061001', 'Rizky Prayoga'),
  ('200309162025061001', 'Shiddieq Amanah Asdar'),
  ('200109262025062002', 'Siti Irmayanti'),
  ('200409052025061001', 'Sulaeman Mustamin'),
  ('200212032025061001', 'Veri Rizal'),
  ('199401052025212023', 'Hijrana'),
  ('198505232025211013', 'Mustapa'),
  ('200012042025211002', 'Muhammad Fiqri'),
  ('199712312025211005', 'Haerunnas'),
  ('199902172025211024', 'Mujo Syahrany'),
  ('198705172025211068', 'Irwan Sukri'),
  ('199908222025211023', 'Syahrir'),
  ('200109062025211012', 'Yasrinaldi Muhajir'),
  ('199905122025211023', 'M. Adryan Nur'),
  ('200001052025211020', 'Haerul Vikra'),
  ('199612252025211046', 'Riswan Kadir'),
  ('199807192025211027', 'Wahyudi'),
  ('199610042025211053', 'Muhammad Fajrin S.Y.'),
  ('199606272025211063', 'Mustari');

-- ─── 1. READ SEBELUM + DIAGNOSA ZULKIFLI ────────────────────────────────────
SELECT nip, nama, role, email FROM public.users ORDER BY nama;

-- Baris yang terlibat kasus Zulkifli — lihat siapa pemegang NIP/email target.
-- Hasilnya menjelaskan error 23505 sebelumnya (baris duplikat).
SELECT nip, nama, email, role, aktif
FROM public.users
WHERE nip LIKE '198503312008121%' OR email LIKE '198503312008121%'
ORDER BY nip;

-- Definisi constraint public.users — users_id_fkey: id adalah FK ke
-- auth.users(id). Itulah sebabnya profil baru WAJIB memakai id akun auth
-- (bagian 6), bukan gen_random_uuid() (penyebab error 23503 versi lama).
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
ORDER BY conname;

-- ─── 2. UPDATE NAMA sesuai Excel (pencocokan berdasarkan NIP) ───────────────
-- NIP sama → orang yang sama → nama diganti mengikuti Excel (lengkap gelar).
UPDATE public.users u
SET nama = e.nama
FROM excel_pegawai e
WHERE u.nip = e.nip
  AND u.nama IS DISTINCT FROM e.nama;

-- Sinkronkan email ke format sintetis {nip}@basarnas.ac.id.
-- PENTING: langkah ini juga "melepas" email nyasar yang dipinjam baris lain
-- (mis. baris duplikat Zulkifli 15-digit) — sehingga langkah 4 bebas tabrakan
-- email (penyebab error users_email_key versi lama).
UPDATE public.users
SET email = nip || '@basarnas.ac.id'
WHERE nip IS NOT NULL
  AND email IS DISTINCT FROM nip || '@basarnas.ac.id';

-- ─── 3. ROLE KHUSUS — Ardiansyah (pengelola BMN) ────────────────────────────
-- Excel: Ardiansyah, S.E. (198102142005021001) = Pengelola BMN.
-- Ardiansyah kedua (199404302022031001, Operator Lapangan) dibuat di bagian 6.
-- Hapus blok ini bila ternyata tetap ingin Operator Lapangan.
UPDATE public.users
SET role = 'PENGELOLA_BMN'
WHERE nip = '198102142005021001'
  AND role IS DISTINCT FROM 'PENGELOLA_BMN';

-- ─── 4. NORMALISASI NIP — adopsi ATAU duplikat (anti error 23505) ───────────
-- 4a. ZULKIFLI — target: 198503312008121002 (Excel).
--     • Belum ada baris dgn NIP target → rename baris aktif lama (...121000).
--     • Sudah ada baris dgn NIP target → baris itu yang dipakai (nama & email
--       sudah dibenahi di langkah 2); baris ...121000 lama jadi duplikat dan
--       dibersihkan di langkah 5 setelah FK-nya dipindah (langkah 4c).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE nip = '198503312008121002') THEN
    UPDATE public.users
    SET nip   = '198503312008121002',
        nama  = 'Zulkifli, S.I.P.',
        email = '198503312008121002@basarnas.ac.id'
    WHERE nip = '198503312008121000';
  ELSE
    -- Baris target sudah ada: pastikan ia aktif & memegang role lama
    -- (Pengelola BMN) agar karakter akunnya tidak berubah.
    UPDATE public.users
    SET role  = 'PENGELOLA_BMN',
        aktif = TRUE
    WHERE nip = '198503312008121002'
      AND (role IS DISTINCT FROM 'PENGELOLA_BMN' OR aktif IS DISTINCT FROM TRUE);
  END IF;
END $$;

-- 4b. MUSLIADI — target: 199305042017121007 (Excel); lama: 199506262014031001.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE nip = '199305042017121007') THEN
    UPDATE public.users
    SET nip   = '199305042017121007',
        nama  = 'Musliadi',
        email = '199305042017121007@basarnas.ac.id'
    WHERE nip = '199506262014031001';
  END IF;
  -- Bila NIP target sudah dipakai baris lain → baris lama jadi duplikat,
  -- dibersihkan di langkah 5 setelah FK-nya dipindah (langkah 4c).
END $$;

-- 4c. PINDAHKAN FK ke NIP target — WAJIB SEBELUM baris lama dihapus, karena
--     8 tabel ber-FK ke users(nip) TANPA ON UPDATE/DELETE CASCADE kecuali
--     SET NULL (kalau FK dipindah setelah baris dihapus, relasi hilang/NULL).
-- Sumber → target:
--   199506262014031001 (Musliadi lama)  → 199305042017121007
--   198503312008121000 (Zulkifli lama)  → 198503312008121002
--   19850331200812100  (dup. nonaktif)  → 198503312008121002
--     (kolom yang tidak punya baris terkait → 0 baris ter-update, aman)

-- Musliadi
UPDATE public.asets              SET penanggung_jawab = '199305042017121007' WHERE penanggung_jawab = '199506262014031001';
UPDATE public.riwayat_aset       SET user_id         = '199305042017121007' WHERE user_id         = '199506262014031001';
UPDATE public.ews_tickets        SET assigned_to     = '199305042017121007' WHERE assigned_to     = '199506262014031001';
UPDATE public.antrean_verifikasi SET created_by      = '199305042017121007' WHERE created_by      = '199506262014031001';
UPDATE public.activity_log       SET user_id         = '199305042017121007' WHERE user_id         = '199506262014031001';
UPDATE public.approvals          SET pengajuan_oleh  = '199305042017121007' WHERE pengajuan_oleh  = '199506262014031001';
UPDATE public.checklist_harian   SET pemeriksa_id    = '199305042017121007' WHERE pemeriksa_id    = '199506262014031001';
UPDATE public.berita_acara       SET pengaju_id      = '199305042017121007' WHERE pengaju_id      = '199506262014031001';

-- Zulkifli (kedua NIP lama)
UPDATE public.asets              SET penanggung_jawab = '198503312008121002' WHERE penanggung_jawab IN ('198503312008121000', '19850331200812100');
UPDATE public.riwayat_aset       SET user_id         = '198503312008121002' WHERE user_id         IN ('198503312008121000', '19850331200812100');
UPDATE public.ews_tickets        SET assigned_to     = '198503312008121002' WHERE assigned_to     IN ('198503312008121000', '19850331200812100');
UPDATE public.antrean_verifikasi SET created_by      = '198503312008121002' WHERE created_by      IN ('198503312008121000', '19850331200812100');
UPDATE public.activity_log       SET user_id         = '198503312008121002' WHERE user_id         IN ('198503312008121000', '19850331200812100');
UPDATE public.approvals          SET pengajuan_oleh  = '198503312008121002' WHERE pengajuan_oleh  IN ('198503312008121000', '19850331200812100');
UPDATE public.checklist_harian   SET pemeriksa_id    = '198503312008121002' WHERE pemeriksa_id    IN ('198503312008121000', '19850331200812100');
UPDATE public.berita_acara       SET pengaju_id      = '198503312008121002' WHERE pengaju_id      IN ('198503312008121000', '19850331200812100');

-- ─── 5. DELETE user dummy (NIP tidak ada di Excel) ──────────────────────────
-- 5a. PRATINJAU — periksa daftar ini di panel Results sebelum eksekusi.
SELECT u.nip,
       u.nama,
       u.role,
       EXISTS (SELECT 1 FROM public.asets a WHERE a.penanggung_jawab = u.nip) AS pj_aset
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM excel_pegawai e WHERE e.nip = u.nip)
  AND u.nip IS NOT NULL
  AND u.nip NOT LIKE '100000000000000%'          -- 6 akun kantor: dipertahankan
  AND NOT EXISTS (SELECT 1 FROM public.asets a
                   WHERE a.penanggung_jawab = u.nip)  -- PJ kendaraan: dipertahankan
ORDER BY u.nip;

-- 5b. EKSEKUSI hapus profil.
--     Termasuk di sini: Zulkifli ...121000 & duplikat ...12100 bila baris
--     target sudah ada, Musliadi ...199506262014031001 bila target sudah ada,
--     "Irwan" (bukan Irwan Sukri), dan seluruh NIP asal-asalan.
--     Bila pratinjau (5a) masih memuat user yang ingin DIPERTAHANKAN,
--     tambahkan di bawah:  AND u.nip <> '<NIP-nya>'
--     Contoh opsional — pertahankan "Muhammad Makbul N" (Pengelola BMN,
--     NIP asal-asalan 1111111111111111, bukan PJ aset):
--       AND u.nip <> '1111111111111111'
DELETE FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM excel_pegawai e WHERE e.nip = u.nip)
  AND u.nip IS NOT NULL
  AND u.nip NOT LIKE '100000000000000%'
  AND NOT EXISTS (SELECT 1 FROM public.asets a
                   WHERE a.penanggung_jawab = u.nip);

-- 5c. Bersihkan akun LOGIN (auth.users) yang profilnya sudah tidak ada.
--     Supaya akun dummy tidak bisa login sama sekali. Identity & session
--     terkait ikut terhapus (FK CASCADE di schema auth).
--     Bila SQL Editor menolak akses schema auth, lewati — profil yang sudah
--     dihapus tetap membuat login ditolak ("profil tidak ditemukan").
DELETE FROM auth.users au
WHERE au.email LIKE '%@basarnas.ac.id'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

-- ─── 6. CREATE — pegawai Excel yang belum ada (akun auth + profil) ─────────
-- public.users.id adalah FK ke auth.users(id) (users_id_fkey) — urutan yang
-- benar: buat akun AUTH dulu, baru profil dengan id yang sama. Paritas dengan
-- create-supabase-users-v3.mjs / Admin UI:
--   • email {nip}@basarnas.ac.id, password default "password123"
--     (hash bcrypt di bawah — MINTA user ganti setelah login pertama).
--   • email sudah terkonfirmasi (email_confirmed_at = now()).
--   • app_metadata berisi role/nip/nama/aktif → login 0 RTT dari JWT.
--   • password_changed = false → penanda password masih default.
-- Guard idempoten: lewati bila NIP sudah punya profil ATAU email-nya sudah
-- terpakai — aman dijalankan ulang.

-- 6a. Buat akun AUTH untuk pegawai Excel yang belum punya profil.
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  e.nip || '@basarnas.ac.id',
  '$2b$10$BzSALDoQ1zABlrV3DtkoFuMeNza01gpDTSARFnGNlJfLV9A0Ey9Yu',
  now(),
  now(),
  now(),
  jsonb_build_object(
    'provider',  'email',
    'providers', jsonb_build_array('email'),
    'role',      'OPERATOR_LAPANGAN',
    'nip',       e.nip,
    'nama',      e.nama,
    'aktif',     TRUE,
    'password_changed', FALSE
  ),
  jsonb_build_object('role', 'OPERATOR_LAPANGAN', 'nip', e.nip, 'nama', e.nama)
FROM excel_pegawai e
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.nip = e.nip)
  AND NOT EXISTS (SELECT 1 FROM auth.users au
                   WHERE au.email = e.nip || '@basarnas.ac.id');

-- 6b. Buat identity "email" untuk akun auth internal yang belum punya
--     (GoTrue selalu membuatnya saat signup via Admin API — disamakan).
INSERT INTO auth.identities
  (id, user_id, provider_id, identity_data, provider,
   last_sign_in_at, created_at, updated_at)
SELECT
  au.id,
  au.id,
  au.id::text,
  jsonb_build_object('sub', au.id::text, 'email', au.email,
                     'email_verified', TRUE),
  'email',
  now(), now(), now()
FROM auth.users au
WHERE au.email LIKE '%@basarnas.ac.id'
  AND NOT EXISTS (SELECT 1 FROM auth.identities i
                   WHERE i.user_id = au.id AND i.provider = 'email');

-- 6c. Buat profil public.users — id WAJIB sama dengan id akun auth (FK).
INSERT INTO public.users
  (id, email, nip, nama, role, aktif, password_changed, created_at, updated_at)
SELECT
  au.id,
  e.nip || '@basarnas.ac.id',
  e.nip,
  e.nama,
  'OPERATOR_LAPANGAN',
  TRUE,
  FALSE,
  now(),
  now()
FROM excel_pegawai e
JOIN auth.users au ON au.email = e.nip || '@basarnas.ac.id'
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.nip = e.nip)
  AND NOT EXISTS (SELECT 1 FROM public.users u2 WHERE u2.id = au.id);

-- 6d. Jaring pengaman: profil yang ternyata belum punya akun auth (FK lama
--     bisa jadi NOT VALID) — buatkan akunnya dengan id = id profil.
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data)
SELECT
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.nip || '@basarnas.ac.id',
  '$2b$10$BzSALDoQ1zABlrV3DtkoFuMeNza01gpDTSARFnGNlJfLV9A0Ey9Yu',
  now(),
  now(),
  now(),
  jsonb_build_object(
    'provider',  'email',
    'providers', jsonb_build_array('email'),
    'role',      u.role::text,
    'nip',       u.nip,
    'nama',      u.nama,
    'aktif',     u.aktif,
    'password_changed', u.password_changed
  ),
  jsonb_build_object('role', u.role::text, 'nip', u.nip, 'nama', u.nama)
FROM public.users u
WHERE u.nip IS NOT NULL
  AND u.nip <> ''
  AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM auth.users au2
                   WHERE au2.email = u.nip || '@basarnas.ac.id');

-- ─── 7. SELARASKAN akun auth dengan profil terkini ─────────────────────────
-- Login membaca role/nip/nama/aktif dari app_metadata di JWT (0 RTT), dan
-- mencari akun auth lewat email {nip}@basarnas.ac.id. Karena NIP beberapa
-- user di-rename (Musliadi, Zulkifli), email & metadata akun auth-nya WAJIB
-- diikuti — kalau tidak, login dengan NIP baru akan gagal / salah data.

-- 7a. Sinkronkan EMAIL akun auth dengan NIP profil (kasus rename).
UPDATE auth.users au
SET email      = u.nip || '@basarnas.ac.id',
    updated_at = now()
FROM public.users u
WHERE au.id = u.id
  AND u.nip IS NOT NULL
  AND u.nip <> ''
  AND au.email IS DISTINCT FROM u.nip || '@basarnas.ac.id';

-- 7b. Sinkronkan app_metadata + user_metadata dengan profil.
--     user_metadata tidak di-overwrite penuh (kendaraan/penempatan yang
--     sudah ada dipertahankan) — hanya role/nip/nama yang ditambal.
UPDATE auth.users au
SET raw_app_meta_data = jsonb_build_object(
      'provider',  'email',
      'providers', jsonb_build_array('email'),
      'role',      u.role::text,
      'nip',       u.nip,
      'nama',      u.nama,
      'aktif',     u.aktif,
      'password_changed', u.password_changed
    ),
    raw_user_meta_data = COALESCE(au.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', u.role::text, 'nip', u.nip, 'nama', u.nama),
    updated_at = now()
FROM public.users u
WHERE au.id = u.id
  AND (au.raw_app_meta_data->>'role' IS DISTINCT FROM u.role::text
    OR au.raw_app_meta_data->>'nip'  IS DISTINCT FROM u.nip
    OR au.raw_app_meta_data->>'nama' IS DISTINCT FROM u.nama
    OR au.raw_app_meta_data->>'aktif' IS DISTINCT FROM u.aktif::text
    OR au.raw_app_meta_data->>'password_changed'
         IS DISTINCT FROM u.password_changed::text);

-- ─── 8. READ SESUDAH (hasil akhir, urut nama) ───────────────────────────────
SELECT nip, nama, role, email FROM public.users ORDER BY nama;

-- ─── 9. VERIFIKASI ──────────────────────────────────────────────────────────
-- 9a. Pegawai Excel yang MASIH belum terdaftar — HARUS 0 baris.
--     Bila masih ada, cek hasil diagnosa langkah 1: biasanya email-nya
--     masih dipinjam baris lain — laporkan, akan ditangani manual.
SELECT e.nip, e.nama
FROM excel_pegawai e
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.nip = e.nip);

-- 9b. Total user di sistem (profil).
SELECT count(*) AS total_users FROM public.users;

-- 9c. Rekap per role.
SELECT role, count(*) AS jumlah FROM public.users GROUP BY role ORDER BY role;

-- 9d. Sisa duplikat Zulkifli — harus tersisa TEPAT SATU baris NIP benar.
SELECT nip, nama, email, role, aktif
FROM public.users
WHERE nip LIKE '198503312008121%' OR email LIKE '198503312008121%'
ORDER BY nip;

-- 9e. Profil TANPA akun auth — HARUS 0 baris (FK users_id_fkey tuntas).
SELECT u.nip, u.nama
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id IS NULL;

-- 9f. Akun auth internal TANPA profil — HARUS 0 baris.
SELECT au.email
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
  AND au.email LIKE '%@basarnas.ac.id';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- LANGKAH SETELAH SQL INI:
-- 1. User baru LANGSUNG bisa login: NIP + password default "password123".
--    Minta mereka ganti password di halaman Profil setelah login pertama
--    (flag password_changed masih false — Admin bisa melihat siapa saja
--    yang masih memakai password default).
-- 2. Cek halaman /admin/pengguna — pastikan jumlah user sesuai dan
--    6 akun kantor masih ada.
-- 3. Role user baru default Operator Lapangan; ubah via Admin bila ada yang
--    seharusnya Kakansar / Pengelola BMN (app_metadata ikut tersinkron).
-- ═══════════════════════════════════════════════════════════════════════════
