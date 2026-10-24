/**
 * Generator: memuat data dari mock-data.ts lalu menghasilkan file SQL
 * seed lengkap (kecuali users) untuk dipaste di Supabase SQL Editor.
 *
 * Jalankan:
 *   node scripts/generate-seed-sql.mjs
 *
 * Hasil: scripts/seed-supabase-data.sql
 *
 * Catatan:
 * - Tabel dibuat IF NOT EXISTS agar aman dijalankan berulang.
 * - Data di-clear dulu (DELETE) supaya script idempoten, lalu di-INSERT.
 * - Kolom nama mengikuti konvensi snake_case.
 * - Kolom referensi user (penanggung_jawab, user_id, dst.) menyimpan
 *   **NIP (text)** dengan FK ke public.users(nip) — sesuai keputusan
 *   proyek "NIP untuk relasi".
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require2 = createRequire(path.join(process.cwd(), "package.json"));
const jitiPath =
  path.join(
    process.cwd(),
    "node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti.cjs"
  );
const jiti = require2(jitiPath);
const run = jiti(
  path.join(process.cwd(), "scripts/generate-seed-sql.mjs"),
  { interopDefault: true, cache: false, moduleCache: false }
);
const mock = run(
  path.join(process.cwd(), "src/components/shared/mock-data.ts")
);

// ---------- PETA usr-XXX → NIP ----------
// mock-data.ts masih menyimpan placeholder "usr-XXX" di beberapa field
// (mis. riwayat userId, approvedBy, etc.) — tetapi PJ_ASET sudah NIP.
// Peta ini menerjemahkan "usr-XXX" → NIP saat generate SQL, agar nilai
// yang di-INSERT ke kolom FK users(nip) valid.
// NIP di ambil dari `users` array di mock-data.ts (source of truth lokal).
const USR_TO_NIP = {};
if (Array.isArray(mock.users)) {
  for (const u of mock.users) {
    if (u.id && u.nip) USR_TO_NIP[u.id] = u.nip;
  }
}
// Fallback NIP (bilamana mock.users tidak ter-load via jiti).
Object.assign(
  USR_TO_NIP,
  {
    "usr-001": "198503122010012001",
    "usr-002": "197801152005011002",
    "usr-003": "196905201994031003",
    "usr-004": "199201102015011004",
    "usr-005": "199709262022031001",
    "usr-006": "198212022007121002",
    "usr-007": "198807022022031001",
    "usr-008": "198102142005021001",
    "usr-009": "198908082010121001",
    "usr-010": "198802052007121001",
    "usr-011": "199806052022031001",
    "usr-012": "199811182022031001",
    "usr-013": "200001052025211020",
    "usr-014": "200206132025061001",
    "usr-015": "200004152022031002",
    "usr-016": "200305132025061001",
    "usr-017": "199807192025211027",
    "usr-018": "199610042025211053",
    "usr-019": "200409052025061001",
    "usr-020": "199612212022031001",
    "usr-021": "199705052022031001",
    "usr-022": "198607222007121001",
    "usr-023": "199811292022031001",
  }
);

// Terjemahkan nilai referensi user:
// - "usr-XXX" → NIP lewat peta USR_TO_NIP
// - NIP (16-18 digit) → dipakai apa adanya
// - kosong / null / undefined → null (untuk FK nullable)
const toUserNip = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v);
  if (s.startsWith("usr-")) return USR_TO_NIP[s] ?? null;
  // Sudah NIP (16-18 digit angka) — return apa adanya
  if (/^\d{16,18}$/.test(s)) return s;
  // Fallback: jika bukan usr-XXX dan bukan NIP, anggap sudah NIP
  return s;
};

// ---------- Helpers ----------
const str = (v) =>
  v === null || v === undefined
    ? "NULL"
    : `'${String(v).replace(/'/g, "''")}'`;
const num = (v) => (v === null || v === undefined ? "NULL" : String(v));
const bool = (v) => (v === true ? "true" : v === false ? "false" : "NULL");
// Nilai jsonb — serialisasi jadi SQL fragment `'...'::jsonb`.
const json = (v) => {
  if (v === undefined || v === null) return "NULL";
  const s = JSON.stringify(v).replace(/'/g, "''");
  return `'${s}'::jsonb`;
};

// Kolom bertipe text yang menyimpan NIP user (FK ke public.users(nip)).
// Nilai mentah bisa "usr-XXX" (mock) atau sudah NIP; toUserNip() menerjemahkan.
const USER_NIP_COLS = new Set([
  "penanggung_jawab",
  "user_id",
  "assigned_to",
  "created_by",
  "pemeriksa_id",
  "pengaju_id",
  "pengajuan_oleh",
]);

function strVal(row, col) {
  const raw = row[col];
  // Kolom referensi user → konversi ke NIP.
  if (USER_NIP_COLS.has(col)) {
    const nip = toUserNip(raw);
    return nip === null ? "NULL" : str(nip);
  }
  if (raw === undefined || raw === null) return "NULL";
  const s = String(raw);
  // Fragment SQL yang sudah jadi (string literal dari json(), atau NULL)
  // → dipakai apa adanya, TIDAK di-quote ulang.
  if (s === "NULL" || s.startsWith("'")) return s;
  const isNumberCol =
    col === "jumlah_personel" ||
    col === "item_checked" ||
    col === "item_total" ||
    col === "jumlah_foto" ||
    col === "umur_aset_tahun" ||
    col === "nilai_perolehan" ||
    col === "nilai_penyusutan" ||
    col === "nilai_buku" ||
    col === "skor_kepatuhan" ||
    col === "telat_kembali" ||
    col === "abaikan_checklist" ||
    col === "personel";
  if (isNumberCol) return num(raw);
  const isBoolCol =
    col === "aktif" ||
    col === "dibaca" ||
    col === "wajib" ||
    col === "isKritis" ||
    col === "is_kritis";
  if (isBoolCol) return bool(raw);
  const isTsCol = col === "tanggal_simpan" || col === "tanggal_lengkap";
  if (isTsCol) return s === "" ? "NULL" : str(raw);
  const isDateCol =
    col.endsWith("At") ||
    col.endsWith("_at") ||
    col === "tanggal" ||
    col === "tanggalBuat" ||
    col === "tanggalUpdate" ||
    col === "tanggalPerolehan" ||
    col === "tanggalPsp" ||
    col === "tanggal_spp" ||
    col === "tanggal_perolehan" ||
    col === "tanggal_psp" ||
    col === "tanggal_penetapan";
  if (isDateCol) return s === "" ? "NULL" : str(raw);
  // default: string (nilai kosong → NULL agar aman untuk FK / lookup)
  return s === "" ? "NULL" : str(raw);
}

function insertRows(table, columns, rows) {
  if (rows.length === 0) return `-- (tidak ada data untuk ${table})\n`;
  const lines = rows.map(
    (r) => `  (${columns.map((c) => strVal(r, c)).join(", ")})`
  );
  return `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES\n${lines.join(",\n")};\n`;
}

// ---------- 1. ASETS ----------
const asetCols = [
  "id",
  "nama",
  "kode",
  "nup",
  "kategori",
  "status",
  "lokasi",
  "tanggal_penetapan",
  "gambar",
  "kondisi",
  "penanggung_jawab",
  "keterangan",
  "kode_barang",
  "merk",
  "tipe",
  "no_stnk",
  "no_polisi",
  "tanggal_perolehan",
  "no_psp",
  "tanggal_psp",
  "nilai_perolehan",
  "nilai_penyusutan",
  "nilai_buku",
  "umur_aset_tahun",
  "jumlah_foto",
  "status_penggunaan",
  "kode_register",
  "status_bmn",
];
const asetRows = mock.asetList.map((a) => ({
  id: a.id,
  nama: a.nama,
  kode: a.kode,
  nup: a.nup,
  kategori: a.kategori,
  status: a.status,
  lokasi: a.lokasi,
  tanggal_penetapan: a.tanggalPenetapan,
  gambar: a.gambar,
  kondisi: a.kondisi,
  penanggung_jawab: a.penanggungJawab,
  keterangan: a.keterangan ?? "",
  kode_barang: a.kodeBarang ?? "",
  merk: a.merk ?? "",
  tipe: a.tipe ?? "",
  no_stnk: a.noStnk ?? "",
  no_polisi: a.noPolisi ?? "",
  tanggal_perolehan: a.tanggalPerolehan ?? "",
  no_psp: a.noPsp ?? "",
  tanggal_psp: a.tanggalPsp ?? "",
  nilai_perolehan: a.nilaiPerolehan ?? 0,
  nilai_penyusutan: a.nilaiPenyusutan ?? 0,
  nilai_buku: a.nilaiBuku ?? 0,
  umur_aset_tahun: a.umurAsetTahun ?? 0,
  jumlah_foto: a.jumlahFoto ?? 0,
  status_penggunaan: a.statusPenggunaan ?? "",
  kode_register: a.kodeRegister ?? "",
  status_bmn: a.statusBmn ?? "Aktif",
}));

// ---------- 2. RIWAYAT ASET ----------
const riwayatCols = ["aset_id", "tanggal", "aksi", "keterangan", "user_id"];
const riwayatRows = mock.asetList.flatMap((a) =>
  (a.riwayat ?? []).map((r) => ({
    aset_id: a.id,
    tanggal: r.tanggal,
    aksi: r.aksi,
    keterangan: r.keterangan,
    user_id: r.userId,
  }))
);

// ---------- 3. EWS TICKETS ----------
const ewsCols = [
  "id",
  "aset_id",
  "judul",
  "deskripsi",
  "tingkat_keparahan",
  "status",
  "tanggal_buat",
  "tanggal_update",
  "assigned_to",
];
const ewsRows = mock.ewsTickets.map((t) => ({
  id: t.id,
  aset_id: t.asetId,
  judul: t.judul,
  deskripsi: t.deskripsi,
  tingkat_keparahan: t.tingkatKeparahan,
  status: t.status,
  tanggal_buat: t.tanggalBuat,
  tanggal_update: t.tanggalUpdate,
  assigned_to: t.assignedTo,
}));

// ---------- 4. ANTREAN VERIFIKASI ----------
const antreanCols = [
  "id",
  "tipe",
  "judul",
  "deskripsi",
  "status",
  "tanggal_buat",
  "created_by",
  "catatan_revisi",
];
const antreanRows = mock.antreanVerifikasi.map((v) => ({
  id: v.id,
  tipe: v.tipe,
  judul: v.judul,
  deskripsi: v.deskripsi,
  status: v.status,
  tanggal_buat: v.tanggalBuat,
  created_by: v.createdBy,
  catatan_revisi: v.catatanRevisi ?? "",
}));

// ---------- 5. CHECKLIST TEMPLATES ----------
const templateCols = [
  "id",
  "nama",
  "kategori",
  "periode",
  "jenis_armada",
  "sumber",
];
const templateRows = mock.checklistTemplates.map((t) => ({
  id: t.id,
  nama: t.nama,
  kategori: t.kategori,
  periode: t.periode,
  jenis_armada: t.jenisArmada,
  sumber: t.sumber ?? "",
}));

const itemCols = [
  "template_id",
  "item_id",
  "label",
  "wajib",
  "kondisi",
  "keterangan",
  "is_kritis",
];
const itemRows = mock.checklistTemplates.flatMap((t) =>
  t.items.map((i) => ({
    template_id: t.id,
    item_id: i.id,
    label: i.label,
    wajib: i.wajib,
    kondisi: i.kondisi,
    keterangan: i.keterangan,
    is_kritis: i.isKritis ?? false,
  }))
);

// ---------- 6. NOTIFIKASI ----------
const notifCols = ["id", "judul", "pesan", "tipe", "dibaca", "tanggal"];
const notifRows = mock.notifikasiList.map((n) => ({
  id: n.id,
  judul: n.judul,
  pesan: n.pesan,
  tipe: n.tipe,
  dibaca: n.dibaca,
  tanggal: n.tanggal,
}));

// ---------- 7. LOG AKTIVITAS ----------
const logAktCols = ["id", "user_id", "aksi", "target", "tanggal", "detail"];
const logAktRows = mock.logAktivitas.map((l) => ({
  id: l.id,
  user_id: l.userId,
  aksi: l.aksi,
  target: l.target,
  tanggal: l.tanggal,
  detail: l.detail,
}));

// ---------- 8. RIWAYAT OPERASI ----------
const riwOpCols = [
  "id",
  "tanggal",
  "jenis",
  "lokasi",
  "durasi",
  "personel",
  "hasil",
  "keterangan",
];
const riwOpRows = mock.riwayatOperasi.map((o) => ({
  id: o.id,
  tanggal: o.tanggal,
  jenis: o.jenis,
  lokasi: o.lokasi,
  durasi: o.durasi,
  personel: o.personel,
  hasil: o.hasil,
  keterangan: o.keterangan ?? "",
}));

// ---------- 9. APPROVAL ----------
const approvalCols = [
  "id",
  "kode",
  "nama_aset",
  "kategori",
  "pengajuan_oleh",
  "tanggal",
  "status",
  "alasan",
  "rincian",
];
const approvalRows = mock.approvalList.map((a) => ({
  id: a.id,
  kode: a.kode,
  nama_aset: a.namaAset,
  kategori: a.kategori,
  pengajuan_oleh: a.pengajuanOleh,
  tanggal: a.tanggal,
  status: a.status,
  alasan: a.alasan,
  rincian: json(a.rincian),
}));

// ---------- 10. LOGBOOK PERJALANAN ----------
const logbookCols = [
  "id",
  "tanggal",
  "jam_berangkat",
  "jam_kembali",
  "rute",
  "tujuan",
  "kategori_unit",
  "jenis_unit",
  "nahkoda",
  "jumlah_personel",
  "bbm_sebelum",
  "bbm_sesudah",
  "endurance_awal",
  "endurance_akhir",
  "km_sebelum",
  "km_sesudah",
  "status",
  "catatan",
  "tanggal_simpan",
  "tanggal_lengkap",
];
const logbookRows = mock.logbookPerjalananList.map((l) => ({
  id: l.id,
  tanggal: l.tanggal,
  jam_berangkat: l.jamBerangkat,
  jam_kembali: l.jamKembali,
  rute: l.rute,
  tujuan: l.tujuan,
  kategori_unit: l.kategoriUnit ?? "",
  jenis_unit: l.jenisUnit,
  nahkoda: l.nahkoda,
  jumlah_personel: l.jumlahPersonel,
  bbm_sebelum: l.bbmSebelum,
  bbm_sesudah: l.bbmSesudah,
  endurance_awal: l.enduranceAwal ?? "",
  endurance_akhir: l.enduranceAkhir ?? "",
  km_sebelum: l.kmSebelum ?? "",
  km_sesudah: l.kmSesudah ?? "",
  status: l.status,
  catatan: l.catatan,
  tanggal_simpan: l.tanggalSimpan ?? "",
  tanggal_lengkap: l.tanggalLengkap ?? "",
}));

// ---------- 11. CHECKLIST HARIAN ----------
const chCols = [
  "id",
  "tanggal",
  "unit",
  "jenis_unit",
  "template_id",
  "pemeriksa",
  "pemeriksa_id",
  "aset_id",
  "status",
  "item_checked",
  "item_total",
  "items",
  "catatan",
];
const chRows = mock.checklistHarianList.map((c) => ({
  id: c.id,
  tanggal: c.tanggal,
  unit: c.unit,
  jenis_unit: c.jenisUnit,
  template_id: c.templateId ?? "",
  pemeriksa: c.pemeriksa,
  pemeriksa_id: c.pemeriksaId ?? "",
  aset_id: c.asetId ?? "",
  status: c.status,
  item_checked: c.itemChecked,
  item_total: c.itemTotal,
  items: json(c.items),
  catatan: c.catatan,
}));

// ---------- 12. BERITA ACARA ----------
const baCols = [
  "id",
  "tanggal",
  "nama_aset",
  "kode_aset",
  "nomor",
  "aset_id",
  "checklist_id",
  "tiket_id",
  "pengaju_id",
  "pelapor",
  "pelapor_jabatan",
  "pengaju_nama",
  "pengaju_jabatan",
  "tanggal_buat",
  "tanggal_update",
  "status",
  "kendala",
  "foto_bukti",
  "uraian",
  "alasan_penolakan",
  "keterangan",
];
const baRows = mock.beritaAcaraList.map((b) => ({
  id: b.id,
  tanggal: b.tanggal,
  nama_aset: b.namaAset,
  kode_aset: b.kodeAset,
  nomor: b.nomor,
  aset_id: b.asetId,
  checklist_id: b.checklistId ?? "",
  tiket_id: b.tiketId ?? "",
  pengaju_id: b.pengajuId ?? "",
  pelapor: b.pelapor,
  pelapor_jabatan: b.pelaporJabatan,
  pengaju_nama: b.pengajuNama ?? "",
  pengaju_jabatan: b.pengajuJabatan ?? "",
  tanggal_buat: b.tanggalBuat,
  tanggal_update: b.tanggalUpdate,
  status: b.status,
  kendala: json(b.kendala),
  foto_bukti: json(b.fotoBukti),
  uraian: b.uraian,
  alasan_penolakan: b.alasanPenolakan ?? "",
  keterangan: b.keterangan,
}));

// ---------- RILIS ----------
const out = [];
out.push(`-- ============================================================`);
out.push(`-- SUPABASE SEED DATA (kecuali users)`);
out.push(`-- Kantor Pencarian & Pertolongan Kelas B Mamuju`);
out.push(`-- Dibuat otomatis dari src/components/shared/mock-data.ts`);
out.push(`-- Jalankan di Supabase Dashboard -> SQL Editor.`);
out.push(`-- Idempoten: tabel dibuat IF NOT EXISTS, data di-clear dulu.`);
out.push(`--`);
out.push(`-- Kolom referensi user memakai **NIP (text)** + FK public.users(nip).`);
out.push(`-- Prasyarat: public.users.nip sudah UNIQUE NOT NULL.`);
out.push(`-- ============================================================`);
out.push(``);
out.push(`BEGIN;`);
out.push(``);

// --- PRASYARAT: pastikan public.users.nip UNIQUE ---
out.push(`-- ==========================================================`);
out.push(`-- PRASYARAT: constraint UNIQUE pada public.users.nip`);
out.push(`-- (idempoten — hanya ditambahkan jika belum ada)`);
out.push(`-- ==========================================================`);
out.push(`DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_nip_unique'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_nip_unique UNIQUE (nip);
  END IF;
END $$;`);
out.push(``);

// --- CREATE TABLES ---
out.push(`-- ==========================================================`);
out.push(`-- 1. TABEL ASET (asets)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.asets (
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
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 2. RIWAYAT ASET (riwayat_aset)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.riwayat_aset (
  id              bigserial PRIMARY KEY,
  aset_id         text NOT NULL REFERENCES public.asets(id) ON DELETE CASCADE,
  tanggal         date NOT NULL,
  aksi            text NOT NULL,
  keterangan      text,
  user_id         text REFERENCES public.users(nip) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 3. EWS TICKETS (ews_tickets)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.ews_tickets (
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
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 4. ANTREAN VERIFIKASI (antrean_verifikasi)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.antrean_verifikasi (
  id              text PRIMARY KEY,
  tipe            text,
  judul           text NOT NULL,
  deskripsi       text,
  status          text,
  tanggal_buat    date,
  created_by      text REFERENCES public.users(nip) ON DELETE SET NULL,
  catatan_revisi  text,
  created_at      timestamptz DEFAULT now()
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 5. CHECKLIST TEMPLATES (checklist_templates + checklist_items)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id            text PRIMARY KEY,
  nama          text NOT NULL,
  kategori      text,
  periode       text,
  jenis_armada  text,
  sumber        text,
  created_at    timestamptz DEFAULT now()
);`);
out.push(``);
out.push(`CREATE TABLE IF NOT EXISTS public.checklist_items (
  template_id   text NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  item_id       text NOT NULL,
  label         text NOT NULL,
  wajib         boolean DEFAULT true,
  kondisi       text,
  keterangan    text,
  is_kritis     boolean DEFAULT false,
  PRIMARY KEY (template_id, item_id)
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 6. NOTIFIKASI (notifications)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.notifications (
  id          text PRIMARY KEY,
  judul       text NOT NULL,
  pesan       text,
  tipe        text,
  dibaca      boolean DEFAULT false,
  tanggal     timestamptz,
  created_at  timestamptz DEFAULT now()
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 7. LOG AKTIVITAS (activity_log)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.activity_log (
  id          text PRIMARY KEY,
  user_id     text REFERENCES public.users(nip) ON DELETE SET NULL,
  aksi        text NOT NULL,
  target      text,
  tanggal     timestamptz,
  detail      text,
  created_at  timestamptz DEFAULT now()
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 8. RIWAYAT OPERASI (riwayat_operasi)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.riwayat_operasi (
  id          text PRIMARY KEY,
  tanggal     date,
  jenis       text,
  lokasi      text,
  durasi      text,
  personel    integer,
  hasil       text,
  keterangan  text,
  created_at  timestamptz DEFAULT now()
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 9. APPROVAL (approvals)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.approvals (
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
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 10. LOGBOOK PERJALANAN (logbook_perjalanan)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.logbook_perjalanan (
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
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 11. CHECKLIST HARIAN (checklist_harian)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.checklist_harian (
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
);`);
out.push(``);

out.push(`-- ==========================================================`);
out.push(`-- 12. BERITA ACARA (berita_acara)`);
out.push(`-- ==========================================================`);
out.push(`CREATE TABLE IF NOT EXISTS public.berita_acara (
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
);`);
out.push(``);

// --- CLEAR (idempoten) ---
out.push(`-- ==========================================================`);
out.push(`-- CLEAR DATA LAMA (idempoten)`);
out.push(`-- ==========================================================`);
out.push(`DELETE FROM public.riwayat_aset;
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
DELETE FROM public.berita_acara;`);
out.push(``);

// --- INSERTS ---
out.push(`-- ==========================================================`);
out.push(`-- INSERT DATA`);
out.push(`-- ==========================================================`);
out.push(``);
out.push(`-- 1. ASET (${asetRows.length} baris)`);
out.push(insertRows("public.asets", asetCols, asetRows));
out.push(`-- 2. RIWAYAT ASET (${riwayatRows.length} baris)`);
out.push(insertRows("public.riwayat_aset", riwayatCols, riwayatRows));
out.push(`-- 3. EWS TICKETS (${ewsRows.length} baris)`);
out.push(insertRows("public.ews_tickets", ewsCols, ewsRows));
out.push(`-- 4. ANTREAN VERIFIKASI (${antreanRows.length} baris)`);
out.push(insertRows("public.antrean_verifikasi", antreanCols, antreanRows));
out.push(`-- 5a. CHECKLIST TEMPLATES (${templateRows.length} baris)`);
out.push(insertRows("public.checklist_templates", templateCols, templateRows));
out.push(`-- 5b. CHECKLIST ITEMS (${itemRows.length} baris)`);
out.push(insertRows("public.checklist_items", itemCols, itemRows));
out.push(`-- 6. NOTIFIKASI (${notifRows.length} baris)`);
out.push(insertRows("public.notifications", notifCols, notifRows));
out.push(`-- 7. LOG AKTIVITAS (${logAktRows.length} baris)`);
out.push(insertRows("public.activity_log", logAktCols, logAktRows));
out.push(`-- 8. RIWAYAT OPERASI (${riwOpRows.length} baris)`);
out.push(insertRows("public.riwayat_operasi", riwOpCols, riwOpRows));
out.push(`-- 9. APPROVAL (${approvalRows.length} baris)`);
out.push(insertRows("public.approvals", approvalCols, approvalRows));
out.push(`-- 10. LOGBOOK PERJALANAN (${logbookRows.length} baris)`);
out.push(insertRows("public.logbook_perjalanan", logbookCols, logbookRows));
out.push(`-- 11. CHECKLIST HARIAN (${chRows.length} baris)`);
out.push(insertRows("public.checklist_harian", chCols, chRows));
out.push(`-- 12. BERITA ACARA (${baRows.length} baris)`);
out.push(insertRows("public.berita_acara", baCols, baRows));

// --- COMMIT ---
out.push(`-- ==========================================================`);
out.push(`-- COMMIT`);
out.push(`-- ==========================================================`);
out.push(`COMMIT;`);
out.push(``);

// --- VERIFIKASI ---
out.push(`-- ==========================================================`);
out.push(`-- VERIFIKASI (cek jumlah baris per tabel)`);
out.push(`-- ==========================================================`);
out.push(`SELECT 'asets' AS tabel, count(*) FROM public.asets
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
ORDER BY tabel;`);

const sql = out.join("\n");
const outPath = path.join(process.cwd(), "scripts/seed-supabase-data.sql");
fs.writeFileSync(outPath, sql, "utf8");
console.log(`✅ Ditulis ke: ${outPath}`);
console.log(`   Total baris SQL: ${sql.split("\n").length}`);
console.log(`   Aset: ${asetRows.length}, Riwayat: ${riwayatRows.length}, EWS: ${ewsRows.length}`);
console.log(
  `   Verifikasi: ${antreanRows.length}, Templates: ${templateRows.length}, Items: ${itemRows.length}`
);
console.log(
  `   Notif: ${notifRows.length}, LogAkt: ${logAktRows.length}, RiwayatOp: ${riwOpRows.length}`
);
console.log(
  `   Approval: ${approvalRows.length}, Logbook: ${logbookRows.length}, Checklist: ${chRows.length}, BA: ${baRows.length}`
);
