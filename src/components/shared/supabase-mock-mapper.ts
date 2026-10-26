/**
 * Mapper: baris Supabase (snake_case) → bentuk mock (camelCase).
 *
 * Dipakai oleh hooks di `supabase-data.ts` agar halaman yang sudah
 * terikat ke bentuk mock (Aset, LogbookPerjalanan, ChecklistHarian, dst.)
 * tetap berfungsi tanpa perlu rewrite besar — hanya ganti sumber array.
 *
 * NIP (text) di kolom FK user langsung dipakai apa adanya; tidak ada
 * konversi UUID. Sesuai keputusan proyek "NIP untuk relasi".
 */

import type {
  AsetRow,
  RiwayatAsetRow,
  LogbookPerjalananRow,
  ChecklistHarianRow,
  EwsTicketRow,
  NotificationRow,
  ActivityLogRow,
  RiwayatOperasiRow,
  BeritaAcaraRow,
  AntreanVerifikasiRow,
  ChecklistTemplateRow,
  ChecklistItemRow,
} from "@/types/supabase";
import type { BarisKendala } from "@/components/shared/mock-data";

// ─── ASET ───────────────────────────────────────────────────────────────────
// Bentuk Aset mock yang diharapkan halaman (subset yang dipakai UI).
// `kategori` & `status` memakai union type mock agar bisa langsung
// menggantikan `Aset[]` dari mock-data tanpa cast tambahan.
import type {
  KategoriAset,
  StatusAset,
  KondisiAset,
} from "@/components/shared/mock-data";

export interface AsetMapped {
  id: string;
  nama: string;
  kode: string;
  nup: string;
  kategori: KategoriAset;
  status: StatusAset;
  lokasi: string;
  tanggalPenetapan: string;
  gambar: string;
  kondisi: KondisiAset;
  penanggungJawab: string;
  keterangan?: string;
  riwayat: {
    tanggal: string;
    aksi: string;
    keterangan: string;
    userId: string;
  }[];
  kodeBarang?: string;
  merk?: string;
  tipe?: string;
  noStnk?: string;
  noPolisi?: string;
  tanggalPerolehan?: string;
  noPsp?: string;
  tanggalPsp?: string;
  nilaiPerolehan?: number;
  nilaiPenyusutan?: number;
  nilaiBuku?: number;
  umurAsetTahun?: number;
  jumlahFoto?: number;
  statusPenggunaan?: string;
  kodeRegister?: string;
  statusBmn?: "Aktif" | "Tidak Aktif";
}

/**
 * Gabungkan `asets` + `riwayat_aset` → array `AsetMapped`.
 * @param asets Daftar baris asets
 * @param riwayat Daftar baris riwayat_aset (semua aset, atau sudah difilter)
 */
export function mapAsets(
  asets: AsetRow[],
  riwayat: RiwayatAsetRow[] = []
): AsetMapped[] {
  // Index riwayat per aset_id
  const byAset = new Map<string, RiwayatAsetRow[]>();
  for (const r of riwayat) {
    const arr = byAset.get(r.aset_id) ?? [];
    arr.push(r);
    byAset.set(r.aset_id, arr);
  }

  return asets.map((a) => ({
    id: a.id,
    nama: a.nama,
    kode: a.kode,
    nup: a.nup,
    kategori: a.kategori as KategoriAset,
    status: a.status as StatusAset,
    lokasi: a.lokasi,
    tanggalPenetapan: a.tanggal_penetapan ?? "",
    gambar: a.gambar,
    kondisi: a.kondisi as KondisiAset,
    penanggungJawab: a.penanggung_jawab ?? "",
    keterangan: a.keterangan,
    riwayat: (byAset.get(a.id) ?? []).map((r) => ({
      tanggal: r.tanggal,
      aksi: r.aksi,
      keterangan: r.keterangan,
      userId: r.user_id ?? "",
    })),
    kodeBarang: a.kode_barang || undefined,
    merk: a.merk || undefined,
    tipe: a.tipe || undefined,
    noStnk: a.no_stnk || undefined,
    noPolisi: a.no_polisi || undefined,
    tanggalPerolehan: a.tanggal_perolehan || undefined,
    noPsp: a.no_psp || undefined,
    tanggalPsp: a.tanggal_psp || undefined,
    nilaiPerolehan: a.nilai_perolehan || undefined,
    nilaiPenyusutan: a.nilai_penyusutan || undefined,
    nilaiBuku: a.nilai_buku || undefined,
    umurAsetTahun: a.umur_aset_tahun || undefined,
    jumlahFoto: a.jumlah_foto || undefined,
    statusPenggunaan: a.status_penggunaan || undefined,
    kodeRegister: a.kode_register || undefined,
    statusBmn: (a.status_bmn as "Aktif" | "Tidak Aktif") || undefined,
  }));
}

// ─── LOGBOOK ──────────────────────────────────────────────────────────────────
export interface LogbookMapped {
  id: string;
  tanggal: string;
  jamBerangkat: string;
  jamKembali: string;
  rute: string;
  tujuan: string;
  kategoriUnit?: string;
  jenisUnit: string;
  nahkoda: string;
  jumlahPersonel: number;
  bbmSebelum: string;
  bbmSesudah: string;
  enduranceAwal?: string;
  enduranceAkhir?: string;
  kmSebelum?: string;
  kmSesudah?: string;
  status: string;
  catatan: string;
  tanggalSimpan?: string;
  tanggalLengkap?: string;
}

export function mapLogbooks(rows: LogbookPerjalananRow[]): LogbookMapped[] {
  return rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    jamBerangkat: r.jam_berangkat,
    jamKembali: r.jam_kembali,
    rute: r.rute,
    tujuan: r.tujuan,
    kategoriUnit: r.kategori_unit || undefined,
    jenisUnit: r.jenis_unit,
    nahkoda: r.nahkoda,
    jumlahPersonel: r.jumlah_personel,
    bbmSebelum: r.bbm_sebelum,
    bbmSesudah: r.bbm_sesudah,
    enduranceAwal: r.endurance_awal || undefined,
    enduranceAkhir: r.endurance_akhir || undefined,
    kmSebelum: r.km_sebelum || undefined,
    kmSesudah: r.km_sesudah || undefined,
    status: r.status,
    catatan: r.catatan,
    tanggalSimpan: r.tanggal_simpan ?? undefined,
    tanggalLengkap: r.tanggal_lengkap ?? undefined,
  }));
}

// ─── CHECKLIST HARIAN ────────────────────────────────────────────────────────
export interface ChecklistMapped {
  id: string;
  tanggal: string;
  unit: string;
  jenisUnit: string;
  templateId?: string;
  pemeriksa: string;
  pemeriksaId?: string;
  asetId?: string;
  status: string;
  itemChecked: number;
  itemTotal: number;
  items: unknown;
  catatan: string;
}

export function mapChecklists(rows: ChecklistHarianRow[]): ChecklistMapped[] {
  return rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    unit: r.unit,
    jenisUnit: r.jenis_unit,
    templateId: r.template_id ?? undefined,
    pemeriksa: r.pemeriksa,
    pemeriksaId: r.pemeriksa_id ?? undefined,
    asetId: r.aset_id ?? undefined,
    status: r.status,
    itemChecked: r.item_checked,
    itemTotal: r.item_total,
    items: r.items,
    catatan: r.catatan,
  }));
}

// ─── EWS TICKET ───────────────────────────────────────────────────────────────
export interface EwsTicketMapped {
  id: string;
  asetId?: string;
  judul: string;
  deskripsi: string;
  tingkatKeparahan: string;
  status: string;
  tanggalBuat?: string;
  tanggalUpdate?: string;
  assignedTo?: string;
}

export function mapEwsTickets(rows: EwsTicketRow[]): EwsTicketMapped[] {
  return rows.map((r) => ({
    id: r.id,
    asetId: r.aset_id ?? undefined,
    judul: r.judul,
    deskripsi: r.deskripsi,
    tingkatKeparahan: r.tingkat_keparahan,
    status: r.status,
    tanggalBuat: r.tanggal_buat ?? undefined,
    tanggalUpdate: r.tanggal_update ?? undefined,
    assignedTo: r.assigned_to ?? undefined,
  }));
}

// ─── NOTIFIKASI ──────────────────────────────────────────────────────────────
export interface NotifikasiMapped {
  id: string;
  judul: string;
  pesan: string;
  tipe: string;
  dibaca: boolean;
  tanggal: string;
}

export function mapNotifications(rows: NotificationRow[]): NotifikasiMapped[] {
  return rows.map((r) => ({
    id: r.id,
    judul: r.judul,
    pesan: r.pesan,
    tipe: r.tipe,
    dibaca: r.dibaca,
    tanggal: r.tanggal,
  }));
}

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────
export interface LogAktivitasMapped {
  id: string;
  userId?: string;
  aksi: string;
  target: string;
  tanggal: string;
  detail: string;
}

export function mapActivityLog(rows: ActivityLogRow[]): LogAktivitasMapped[] {
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id ?? undefined,
    aksi: r.aksi,
    target: r.target,
    tanggal: r.tanggal,
    detail: r.detail,
  }));
}

// ─── RIWAYAT OPERASI ─────────────────────────────────────────────────────────
export interface RiwayatOperasiMapped {
  id: string;
  tanggal: string;
  jenis: string;
  lokasi: string;
  durasi: string;
  personel: number;
  hasil: string;
  keterangan: string;
}

export function mapRiwayatOperasi(rows: RiwayatOperasiRow[]): RiwayatOperasiMapped[] {
  return rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    jenis: r.jenis,
    lokasi: r.lokasi,
    durasi: r.durasi,
    personel: r.personel,
    hasil: r.hasil,
    keterangan: r.keterangan,
  }));
}

// ─── BERITA ACARA ────────────────────────────────────────────────────────────
export interface BeritaAcaraMapped {
  id: string;
  tanggal: string;
  namaAset: string;
  kodeAset: string;
  nomor: string;
  asetId?: string;
  checklistId?: string;
  tiketId?: string;
  pengajuId?: string;
  pelapor: string;
  pelaporJabatan: string;
  pengajuNama?: string;
  pengajuJabatan?: string;
  tanggalBuat?: string;
  tanggalUpdate?: string;
  status: string;
  kendala: BarisKendala[];
  fotoBukti: string[];
  uraian: string;
  alasanPenolakan?: string;
  keterangan: string;
}

export function mapBeritaAcara(rows: BeritaAcaraRow[]): BeritaAcaraMapped[] {
  return rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    // Kolom teks di DB nullable (seed memasukkan NULL) — null-guard supaya
    // tidak ada `null` mengalir ke <Input value> / template string.
    namaAset: r.nama_aset ?? "",
    kodeAset: r.kode_aset ?? "",
    nomor: r.nomor ?? "",
    asetId: r.aset_id ?? undefined,
    checklistId: r.checklist_id || undefined,
    tiketId: r.tiket_id ?? undefined,
    pengajuId: r.pengaju_id ?? undefined,
    pelapor: r.pelapor ?? "",
    pelaporJabatan: r.pelapor_jabatan ?? "",
    pengajuNama: r.pengaju_nama || undefined,
    pengajuJabatan: r.pengaju_jabatan || undefined,
    tanggalBuat: r.tanggal_buat ?? undefined,
    tanggalUpdate: r.tanggal_update ?? undefined,
    status: r.status,
    kendala: Array.isArray(r.kendala) ? (r.kendala as BarisKendala[]) : [],
    fotoBukti: Array.isArray(r.foto_bukti) ? (r.foto_bukti as string[]) : [],
    uraian: r.uraian ?? "",
    alasanPenolakan: r.alasan_penolakan || undefined,
    keterangan: r.keterangan ?? "",
  }));
}

// ─── ANTREAN VERIFIKASI ──────────────────────────────────────────────────────
export interface AntreanVerifikasiMapped {
  id: string;
  tipe: string;
  judul: string;
  deskripsi: string;
  status: string;
  tanggalBuat?: string;
  createdBy?: string;
  catatanRevisi: string;
}

export function mapAntreanVerifikasi(rows: AntreanVerifikasiRow[]): AntreanVerifikasiMapped[] {
  return rows.map((r) => ({
    id: r.id,
    tipe: r.tipe,
    judul: r.judul,
    deskripsi: r.deskripsi,
    status: r.status,
    tanggalBuat: r.tanggal_buat ?? undefined,
    createdBy: r.created_by ?? undefined,
    catatanRevisi: r.catatan_revisi,
  }));
}

// ─── CHECKLIST TEMPLATES + ITEMS ─────────────────────────────────────────────
export interface ChecklistTemplateMapped {
  id: string;
  nama: string;
  kategori: string;
  periode: string;
  jenisArmada: string;
  sumber?: string;
  items: {
    id: string;
    label: string;
    wajib: boolean;
    kondisi: string;
    keterangan: string;
    isKritis: boolean;
  }[];
}

export function mapChecklistTemplates(
  templates: ChecklistTemplateRow[],
  items: ChecklistItemRow[] = []
): ChecklistTemplateMapped[] {
  const byTemplate = new Map<string, ChecklistItemRow[]>();
  for (const i of items) {
    const arr = byTemplate.get(i.template_id) ?? [];
    arr.push(i);
    byTemplate.set(i.template_id, arr);
  }

  return templates.map((t) => ({
    id: t.id,
    nama: t.nama,
    kategori: t.kategori,
    periode: t.periode,
    jenisArmada: t.jenis_armada,
    sumber: t.sumber || undefined,
    items: (byTemplate.get(t.id) ?? []).map((i) => ({
      id: i.item_id,
      label: i.label,
      wajib: i.wajib,
      kondisi: i.kondisi,
      keterangan: i.keterangan,
      isKritis: i.is_kritis,
    })),
  }));
}
