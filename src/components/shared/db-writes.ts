/**
 * Operasi tulis (CRUD) ke Supabase — dipakai halaman/halaman form.
 *
 * Semua fungsi melempar `Error` bila gagal, sehingga form bisa menampilkan
 * pesan kepada user (tidak ada kegagalan diam-diam).
 *
 * Semua operasi memakai anon key + session (RLS aktif) — service-role key
 * tidak pernah diekspor ke klien.
 */

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { InputAset } from "@/components/shared/mock-data";
import type {
  AsetInsert,
  AsetUpdate,
  ChecklistHarianRow,
  BeritaAcaraRow,
} from "@/types/supabase";
import type {
  StatusAset,
  StatusBeritaAcara,
  KondisiAset,
} from "@/components/shared/mock-data";

/** Helper tanggal hari ini (ISO). */
function hariIni(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Terjemahkan pesan error Supabase ke pesan ramah pengguna. */
function pesan(raw: string): string {
  if (raw.includes("PGRST202") || raw.includes("Could not find the function")) {
    return "Fungsi database khusus belum terpasang — buka Supabase Dashboard → SQL Editor → jalankan scripts/rls-policies.sql versi terbaru, lalu coba lagi.";
  }
  if (raw.includes("duplicate key") || raw.includes("unique")) {
    return "Kode atau NUP sudah terdaftar untuk data lain.";
  }
  if (raw.includes("violates foreign key constraint")) {
    return "Referensi tidak valid (user/aset/tiket tidak ditemukan di database).";
  }
  if (raw.includes("row-level security") || raw.includes("permission")) {
    return "Anda tidak punya izin melakukan aksi ini (RLS per-role aktif).";
  }
  return raw;
}

// ─── ASETS ───────────────────────────────────────────────────────────────────

/** INSERT aset baru + entri riwayat penetapan. */
export async function insertAset(
  input: InputAset & { id: string; gambar?: string }
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const row: AsetInsert = {
    id: input.id,
    nama: input.nama,
    kode: input.kode,
    nup: input.nup,
    kategori: input.kategori,
    status: input.status,
    lokasi: input.lokasi,
    tanggal_penetapan: input.tanggalPenetapan,
    gambar: input.gambar ?? "",
    kondisi: input.kondisi,
    penanggung_jawab: input.penanggungJawab || null,
    keterangan: input.keterangan ?? "",
    // Kolom katalog BMN yang belum dimiliki form — diisi nilai default.
    kode_barang: "",
    merk: "",
    tipe: "",
    no_stnk: "",
    no_polisi: "",
    tanggal_perolehan: input.tanggalPenetapan,
    no_psp: "",
    tanggal_psp: null,
    nilai_perolehan: 0,
    nilai_penyusutan: 0,
    nilai_buku: 0,
    umur_aset_tahun: 0,
    jumlah_foto: 0,
    status_penggunaan: "",
    kode_register: "",
    status_bmn: "",
  };
  const { error } = await supa.from("asets").insert(row);
  if (error) throw new Error(pesan(error.message));

  await insertRiwayatAset(input.id, {
    tanggal: input.tanggalPenetapan,
    aksi: "Penetapan",
    keterangan: `Aset ditetapkan sebagai BMN dengan kode ${input.kode}`,
    userId: input.penanggungJawab,
  });
}

/** INSERT satu baris riwayat aset. */
export async function insertRiwayatAset(
  asetId: string,
  riwayat: {
    tanggal: string;
    aksi: string;
    keterangan: string;
    userId: string;
  }
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const { error } = await supa.from("riwayat_aset").insert({
    aset_id: asetId,
    tanggal: riwayat.tanggal,
    aksi: riwayat.aksi,
    keterangan: riwayat.keterangan,
    user_id: riwayat.userId || null,
  });
  if (error) throw new Error(pesan(error.message));
}

/**
 * UPDATE data master aset + (opsional) sisipkan riwayat baru.
 * @param changes kolom yang diubah (camelCase)
 * @param riwayatBaru entri riwayat tambahan
 */
export async function updateAsetRow(
  id: string,
  changes: Partial<InputAset & { gambar: string }>,
  riwayatBaru?: {
    tanggal: string;
    aksi: string;
    keterangan: string;
    userId: string;
  }
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  // Konversi camelCase → snake_case, bertipe AsetUpdate.
  const patch: AsetUpdate = {};
  if (changes.nama !== undefined) patch.nama = changes.nama;
  if (changes.kode !== undefined) patch.kode = changes.kode;
  if (changes.nup !== undefined) patch.nup = changes.nup;
  if (changes.kategori !== undefined) patch.kategori = changes.kategori;
  if (changes.status !== undefined) patch.status = changes.status;
  if (changes.lokasi !== undefined) patch.lokasi = changes.lokasi;
  if (changes.tanggalPenetapan !== undefined)
    patch.tanggal_penetapan = changes.tanggalPenetapan;
  if (changes.gambar !== undefined) patch.gambar = changes.gambar;
  if (changes.kondisi !== undefined) patch.kondisi = changes.kondisi;
  if (changes.penanggungJawab !== undefined)
    patch.penanggung_jawab = changes.penanggungJawab || null;
  if (changes.keterangan !== undefined)
    patch.keterangan = changes.keterangan ?? "";

  if (Object.keys(patch).length > 0) {
    const { error } = await supa.from("asets").update(patch).eq("id", id);
    if (error) throw new Error(pesan(error.message));
  }
  if (riwayatBaru) {
    await insertRiwayatAset(id, riwayatBaru);
  }
}

/** Ubah status aset + catat riwayat (dipakai aksi keputusan). */
export async function updateAsetStatus(
  id: string,
  status: StatusAset,
  nip: string,
  keterangan: string,
  aksi: string = "Selesai Digunakan",
  kondisi?: KondisiAset
): Promise<void> {
  // Kondisi fisik ikut diperbarui bila diberi tahu — halaman detail aset
  // menampilkan `kondisi`, bukan `status`, jadi keduanya harus senada.
  await updateAsetRow(
    id,
    kondisi ? { status, kondisi } : { status },
    { tanggal: hariIni(), aksi, keterangan, userId: nip }
  );
}

// ─── CHECKLIST ───────────────────────────────────────────────────────────────

/** Operator menyerahkan kerusakan lewat RPC SECURITY DEFINER (RLS aman). */
export async function serahkanKerusakanAset(
  asetId: string,
  kondisi: "Rusak Ringan" | "Rusak Berat",
  keterangan: string
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const { error } = await supa.rpc("serahkan_kerusakan_aset", {
    p_aset_id: asetId,
    p_kondisi: kondisi,
    p_keterangan: keterangan,
  });
  if (error) throw new Error(pesan(error.message));
}

/** UPDATE checklist harian (mis. tandai selesai diperiksa). */
export async function updateChecklistItem(
  id: string,
  patch: {
    status?: "Lengkap" | "Belum Lengkap";
    itemChecked?: number;
    itemTotal?: number;
    items?: unknown;
    catatan?: string;
  }
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const body: Partial<Omit<ChecklistHarianRow, "created_at">> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.itemChecked !== undefined) body.item_checked = patch.itemChecked;
  if (patch.itemTotal !== undefined) body.item_total = patch.itemTotal;
  if (patch.items !== undefined) body.items = patch.items;
  if (patch.catatan !== undefined) body.catatan = patch.catatan;

  if (Object.keys(body).length === 0) return;
  const { error } = await supa.from("checklist_harian").update(body).eq("id", id);
  if (error) throw new Error(pesan(error.message));
}

// ─── BERITA ACARA ────────────────────────────────────────────────────────────

/** INSERT berita acara baru (status Draf) dari alur checklist. */
export async function insertBeritaAcara(input: {
  id: string;
  tanggal: string;
  namaAset: string;
  kodeAset: string;
  nomor?: string;
  asetId?: string;
  checklistId?: string;
  tiketId?: string;
  pengajuId?: string;
  pengajuNama?: string;
  pengajuJabatan?: string;
  pelapor: string;
  pelaporJabatan: string;
  uraian: string;
  kendala?: unknown;
  fotoBukti?: unknown;
  keterangan?: string;
}): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const row: Omit<BeritaAcaraRow, "created_at"> = {
    id: input.id,
    tanggal: input.tanggal,
    nama_aset: input.namaAset,
    kode_aset: input.kodeAset,
    nomor: input.nomor ?? "",
    aset_id: input.asetId ?? null,
    checklist_id: input.checklistId ?? "",
    tiket_id: input.tiketId ?? null,
    pengaju_id: input.pengajuId ?? null,
    pengaju_nama: input.pengajuNama ?? "",
    pengaju_jabatan: input.pengajuJabatan ?? "",
    pelapor: input.pelapor,
    pelapor_jabatan: input.pelaporJabatan,
    tanggal_buat: input.tanggal,
    tanggal_update: input.tanggal,
    status: "Draf",
    kendala: input.kendala ?? [],
    foto_bukti: input.fotoBukti ?? [],
    uraian: input.uraian,
    alasan_penolakan: "",
    keterangan: input.keterangan ?? "",
  };
  const { error } = await supa.from("berita_acara").insert(row);
  if (error) throw new Error(pesan(error.message));
}

/** UPDATE status berita acara (Diserahkan / Disetujui / Ditolak dst.). */
export async function updateBeritaAcaraStatus(
  id: string,
  status: StatusBeritaAcara,
  extra: {
    alasanPenolakan?: string;
    keterangan?: string;
    tiketId?: string;
  } = {}
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const patch: Partial<Omit<BeritaAcaraRow, "created_at">> = {
    status,
    tanggal_update: hariIni(),
  };
  if (extra.alasanPenolakan !== undefined)
    patch.alasan_penolakan = extra.alasanPenolakan;
  if (extra.keterangan !== undefined) patch.keterangan = extra.keterangan;
  if (extra.tiketId !== undefined) patch.tiket_id = extra.tiketId;

  const { error } = await supa.from("berita_acara").update(patch).eq("id", id);
  if (error) throw new Error(pesan(error.message));
}

/** UPDATE isi berita acara (nomor, uraian, kendala, foto). */
export async function updateBeritaAcaraIsi(
  id: string,
  isi: {
    nomor?: string;
    uraian?: string;
    kendala?: unknown;
    fotoBukti?: unknown;
    namaAset?: string;
    kodeAset?: string;
  }
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const patch: Partial<Omit<BeritaAcaraRow, "created_at">> = {
    tanggal_update: hariIni(),
  };
  if (isi.nomor !== undefined) patch.nomor = isi.nomor;
  if (isi.uraian !== undefined) patch.uraian = isi.uraian;
  if (isi.kendala !== undefined) patch.kendala = isi.kendala;
  if (isi.fotoBukti !== undefined) patch.foto_bukti = isi.fotoBukti;
  if (isi.namaAset !== undefined) patch.nama_aset = isi.namaAset;
  if (isi.kodeAset !== undefined) patch.kode_aset = isi.kodeAset;

  const { error } = await supa.from("berita_acara").update(patch).eq("id", id);
  if (error) throw new Error(pesan(error.message));
}

/**
 * KAKANSAR memutus berita acara (acc / tolak) lewat RPC SECURITY DEFINER —
 * role KAKANSAR tidak punya izin UPDATE berita acara maupun aset langsung.
 * Setujui → BA "Disetujui" + aset "Dipindahkan"; Tolak → BA "Ditolak"
 * (alasan wajib). Pemanggil menunggu hasil; kesalahan dilempar ke form.
 */
export async function putuskanBeritaAcara(
  baId: string,
  setujui: boolean,
  alasan: string
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const { error } = await supa.rpc("putuskan_berita_acara", {
    p_ba_id: baId,
    p_setujui: setujui,
    p_alasan: alasan,
  });
  if (error) throw new Error(pesan(error.message));
}
