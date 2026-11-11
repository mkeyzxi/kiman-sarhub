"use client";

import { useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  logbookKeForm,
  angkaKePersen,
  statusPenggunaanOtomatis,
  validasiTahapAwal,
  validasiTahapAkhir,
  type FormLogbook,
  type LogbookPerjalanan,
  type StatusPenggunaan,
} from "./mock-data";

/**
 * Store logbook perjalanan di sisi klien.
 *
 * - **Tulis**: INSERT/UPDATE ke Supabase `logbook_perjalanan` (Tahap 4);
 *   tetap masuk in-memory sebagai fallback (UI tidak hangus saat offline).
 * - **Baca**: data Supabase + tulisan sesi berjalan (in-memory).
 *   SEED MOCK sengaja tidak digabung lagi supaya daftar & statistik
 *   selalu nyata dari database.
 *
 * Aturan penting yang ditegakkan store ini:
 *
 * 1. Tahap awal hanya menyetor data keberangkatan. `status` bukan input
 *    operator melainkan diturunkan dari isi form.
 * 2. Tahap pelengkapan **memperbarui catatan yang sama berdasarkan ID**.
 * 3. Tahap pelengkapan hanya boleh dipanggil bila `validasiTahapAkhir` lolos.
 */

let logbooks: LogbookPerjalanan[] = [];
const listeners = new Set<() => void>();

/**
 * Reset in-memory state ke kosong — hanya dipakai untuk pengujian.
 * Dipanggil dari test agar state tidak saling mencemari antar test case.
 */
export function resetLogbooksForTesting(): void {
  logbooks = [];
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot untuk render di server / pengambilan awal hydration. */
function getServerSnapshot(): LogbookPerjalanan[] {
  return logbooks;
}

/** Daftar seluruh catatan logbook, paling baru di atas. */
export function useLogbook(): LogbookPerjalanan[] {
  return useSyncExternalStore(subscribe, () => logbooks, getServerSnapshot);
}

/**
 * Merge logbook dari Supabase dengan data in-memory.
 * Logbook dari Supabase yang tidak ada di `logbooks` (in-memory)
 * ditambahkan; yang sudah ada di in-memory (belum persist ke Supabase)
 * dipertahankan. Urutan: paling baru di atas (berdasarkan tanggalSimpan).
 */
export function mergeLogbooksWithSupabase(
  supabaseLogbooks: LogbookPerjalanan[]
): LogbookPerjalanan[] {
  const inMemoryIds = new Set(logbooks.map((l) => l.id));
  const fromSupabase = supabaseLogbooks.filter((l) => !inMemoryIds.has(l.id));
  const merged = [...logbooks, ...fromSupabase];
  // Urutkan: tanggalSimpan terbaru di atas; yang belum disimpan di bawah.
  merged.sort((a, b) => {
    if (!a.tanggalSimpan) return 1;
    if (!b.tanggalSimpan) return -1;
    return b.tanggalSimpan.localeCompare(a.tanggalSimpan);
  });
  return merged;
}

/**
 * Daftar catatan tanpa memakai hook.
 *
 * Berguna di konteks non-komponen (mis. pengujian atau hitung ringkasan di luar
 * render) di mana `useLogbook()` tidak boleh dipanggil.
 */
export function getAllLogbook(): LogbookPerjalanan[] {
  return logbooks;
}

/** Catatan logbook berdasarkan ID. */
export function getLogbookById(id: string): LogbookPerjalanan | undefined {
  return logbooks.find((l) => l.id === id);
}

function nowStamp(jamBerangkat: string): string {
  const hariIni = new Date().toISOString().slice(0, 10);
  return jamBerangkat ? `${hariIni}T${jamBerangkat}:00` : `${hariIni}T07:00:00`;
}

/**
 * ID logbook baru — berbasis waktu unik (bentuk selaras `chk-…`/`ba-…`).
 * Tanpa menyentuh seed/DB: kalaupun memori hangus antar sesi, ID tetap
 * unik sehingga tidak menabrak primary key saat INSERT ke database.
 */
function idBerikutnya(): string {
  return `lp-${Date.now()}`;
}

// ── Helpers INSERT/UPDATE ke Supabase ───────────────────────────────────────

/** Mapping LogbookPerjalanan (camelCase) → baris INSERT Supabase (snake_case). */
function toSupabaseRow(l: LogbookPerjalanan) {
  return {
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
    bbm_tambahan: l.bbmTambahan ?? null,
    endurance_awal: l.enduranceAwal ?? "",
    endurance_akhir: l.enduranceAkhir ?? "",
    km_sebelum: l.kmSebelum ?? "",
    km_sesudah: l.kmSesudah ?? "",
    status: l.status,
    catatan: l.catatan,
    tanggal_simpan: l.tanggalSimpan ?? null,
    tanggal_lengkap: l.tanggalLengkap ?? null,
  };
}

/**
 * INSERT logbook baru ke Supabase. Silent (tanpa error) bila Supabase belum
 * aktif / offline — data tetap masuk in-memory.
 */
async function persistInsert(l: LogbookPerjalanan): Promise<void> {
  try {
    const supa = getSupabaseBrowserClient();
    await supa.from("logbook_perjalanan").insert(toSupabaseRow(l));
  } catch {
    // Offline / Supabase belum dikonfigurasi — abaikan, data in-memory.
  }
}

/**
 * UPDATE logbook di Supabase (stages 2 / tandaiBerangkat). Silent pada gagal.
 */
async function persistUpdate(id: string, l: LogbookPerjalanan): Promise<void> {
  try {
    const supa = getSupabaseBrowserClient();
    await supa.from("logbook_perjalanan").update(toSupabaseRow(l)).eq("id", id);
  } catch {
    // Offline / Supabase belum dikonfigurasi — abaikan, data in-memory.
  }
}

// ── Fungsi publik ────────────────────────────────────────────────────────────

/**
 * Simpan data awal (tahap 1).
 *
 * Endurance akhir sengaja tidak ada di sini: unit masih dalam perjalanan
 * ketika tahap ini dicatat, jadi operator cukup mengisi `enduranceAwal`.
 *
 * @returns catatan yang tersimpan.
 */
export function simpanTahapAwal(
  form: FormLogbook
): { logbook: LogbookPerjalanan } | { error: string; errors: Record<string, string> } {
  const errors = validasiTahapAwal(form);
  if (Object.keys(errors).length > 0) {
    return { error: "Data tahap awal belum lengkap.", errors };
  }

  const laut = form.kategoriUnit !== "" &&
    ["Kapal", "RBB", "RIB"].includes(form.kategoriUnit);

  const logbook: LogbookPerjalanan = {
    id: idBerikutnya(),
    tanggal: form.tanggal,
    jamBerangkat: form.jamBerangkat,
    jamKembali: "",
    rute: form.rute.trim(),
    tujuan: form.tujuan.trim(),
    kategoriUnit: form.kategoriUnit === "" ? undefined : form.kategoriUnit,
    jenisUnit: form.jenisUnit,
    nahkoda: form.nahkoda.trim(),
    jumlahPersonel: Number(form.jumlahPersonel),
    bbmSebelum: angkaKePersen(form.bbmSebelum),
    bbmSesudah: "",
    // BBM tambahan (isi ulang di perjalanan) diisi nanti pada tahap 2.
    bbmTambahan: "",
    ...(laut
      ? { enduranceAwal: form.enduranceAwal, enduranceAkhir: "" }
      : { kmSebelum: form.kmSebelum, kmSesudah: "" }),
    status: statusPenggunaanOtomatis(form),
    catatan: form.catatan.trim(),
    tanggalSimpan: nowStamp(form.jamBerangkat),
  };

  logbooks = [logbook, ...logbooks];
  emit();
  // Persist ke Supabase (fire-and-forget, silent).
  void persistInsert(logbook);
  return { logbook };
}

/**
 * Lengkapi catatan yang sama (tahap 2).
 *
 * Tidak pernah membuat catatan baru: entri dengan `id` yang sama diperbarui di
 * tempat. Status menjadi `Selesai` hanya bila seluruh data wajib tahap akhir
 * sudah terisi.
 *
 * @param fallback Catatan hasil fetch Supabase — dipakai bila ID tidak ada di
 *   in-memory store (sesi browser baru: store hanya berisi catatan yang dibuat
 *   pada sesi yang sama). Record diadopsi ke store sehingga update & operasi
 *   lanjutan tetap konsisten tanpa membuat baris baru.
 */
export function simpanTahapAkhir(
  id: string,
  form: FormLogbook,
  fallback?: LogbookPerjalanan
):
  | { logbook: LogbookPerjalanan }
  | { error: string; errors: Record<string, string> } {
  let existing = logbooks.find((l) => l.id === id);
  if (!existing && fallback && fallback.id === id) {
    // Catatan hanya tersedia dari Supabase — adopsi ke in-memory store.
    existing = fallback;
    logbooks = [fallback, ...logbooks];
  }
  if (!existing) {
    return { error: "Catatan logbook tidak ditemukan.", errors: {} };
  }

  // Gabungkan data tahap awal yang tidak diedit ulang dengan isian baru.
  const gabungan: FormLogbook = {
    ...logbookKeForm(existing),
    ...form,
  };

  const errors = validasiTahapAkhir(gabungan);
  if (Object.keys(errors).length > 0) {
    return { error: "Data pelengkapan belum lengkap.", errors };
  }

  const status: StatusPenggunaan = "Selesai";
  const laut = gabungan.kategoriUnit !== "" &&
    ["Kapal", "RBB", "RIB"].includes(gabungan.kategoriUnit);

  const terupdate: LogbookPerjalanan = {
    ...existing,
    // Jam berangkat hanya ikut tersimpan bila sebelumnya kosong: catatan yang
    // sudah berangkat tidak boleh diundurkan lewat tahap pelengkapan.
    ...(existing.jamBerangkat === "" && gabungan.jamBerangkat !== ""
      ? { jamBerangkat: gabungan.jamBerangkat }
      : {}),
    jamKembali: gabungan.jamKembali,
    bbmSesudah: angkaKePersen(gabungan.bbmSesudah),
    // Pengisian BBM tambahan selama perjalanan (opsional, boleh kosong).
    bbmTambahan: gabungan.bbmTambahan.trim() ? angkaKePersen(gabungan.bbmTambahan) : "",
    catatan: gabungan.catatan.trim() || existing.catatan,
    status,
    ...(laut
      ? { enduranceAkhir: gabungan.enduranceAkhir }
      : { kmSesudah: gabungan.kmSesudah }),
    tanggalLengkap: nowStamp(gabungan.jamKembali),
  };

  logbooks = logbooks.map((l) => (l.id === id ? terupdate : l));
  emit();
  // Persist update ke Supabase (fire-and-forget, silent).
  void persistUpdate(id, terupdate);
  return { logbook: terupdate };
}

/**
 * Ubah catatan lama menjadi "Sedang Digunakan" setelah armada berangkat —
 * dipakai ketika operator baru mengisi jam keberangkatan pada catatan yang
 * sebelumnya masih "Menunggu Penggunaan". Tetap memperbarui ID yang sama.
 */
export function tandaiBerangkat(id: string): void {
  logbooks = logbooks.map((l) =>
    l.id === id && l.status === "Menunggu Penggunaan"
      ? { ...l, status: "Sedang Digunakan", tanggalSimpan: nowStamp(l.jamBerangkat) }
      : l
  );
  emit();
  // Persist status update ke Supabase.
  const updated = logbooks.find((l) => l.id === id);
  if (updated) void persistUpdate(id, updated);
}

// ── HAPUS (manajemen Admin IT) ───────────────────────────────────────────────

/**
 * Hapus catatan logbook dari in-memory + Supabase.
 *
 * Hak hapus ada pada role ADMIN_IT (UI menahan aksi ini di tabel logbook;
 * sisi RLS database juga hanya memberi izin delete ke ADMIN_IT).
 * Bila Supabase menolak (mis. RLS) maka catatan in-memory dikembalikan —
 * UI tetap konsisten dengan isi database.
 *
 * @returns `true` bila penghapusan berhasil, `false` bila ditolak database.
 */
export async function hapusLogbook(id: string): Promise<boolean> {
  const snapshotSebelum = logbooks;
  const adaInMemory = snapshotSebelum.some((l) => l.id === id);
  const sisa = snapshotSebelum.filter((l) => l.id !== id);
  logbooks = sisa;
  emit();
  try {
    const supa = getSupabaseBrowserClient();
    const { error } = await supa
      .from("logbook_perjalanan")
      .delete()
      .eq("id", id);
    if (error) {
      // Database menolak hapus — kembalikan snapshot lama.
      logbooks = snapshotSebelum;
      emit();
      return false;
    }
  } catch {
    // Offline / Supabase belum dikonfigurasi — hapus in-memory saja.
  }
  return adaInMemory;
}

/**
 * Update logbook di Supabase untuk keperluan management admin (edit full data).
 * Menulis seluruh kolom (bukan fire-and-forget) dan melempar error agar
 * halaman admin bisa menampilkan pesan gagal.
 */
export async function updateLogbookDB(
  id: string,
  baris: LogbookPerjalanan
): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const { error } = await supa
    .from("logbook_perjalanan")
    .update(toSupabaseRow(baris))
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Hapus logbook di Supabase (throw bila gagal — untuk halaman admin). */
export async function hapusLogbookDB(id: string): Promise<void> {
  const supa = getSupabaseBrowserClient();
  const { error } = await supa
    .from("logbook_perjalanan")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
