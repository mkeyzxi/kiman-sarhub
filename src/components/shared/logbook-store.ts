"use client";

import { useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  logbookPerjalananList,
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
 * - **Baca**: gabungan mock seed + in-memory sesi + data Supabase.
 * - **Tulis**: INSERT/UPDATE ke Supabase `logbook_perjalanan` (Tahap 4);
 *   tetap masuk in-memory sebagai fallback (UI tidak hangus saat offline).
 *
 * Aturan penting yang ditegakkan store ini:
 *
 * 1. Tahap awal hanya menyetor data keberangkatan. `status` bukan input
 *    operator melainkan diturunkan dari isi form.
 * 2. Tahap pelengkapan **memperbarui catatan yang sama berdasarkan ID**.
 * 3. Tahap pelengkapan hanya boleh dipanggil bila `validasiTahapAkhir` lolos.
 */

let logbooks: LogbookPerjalanan[] = [...logbookPerjalananList];
const listeners = new Set<() => void>();

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
  return logbookPerjalananList;
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

/** Catatan logbook berdasarkan ID; ikut mencari data mock saat SSR. */
export function getLogbookById(id: string): LogbookPerjalanan | undefined {
  return logbooks.find((l) => l.id === id);
}

function nowStamp(jamBerangkat: string): string {
  const hariIni = new Date().toISOString().slice(0, 10);
  return jamBerangkat ? `${hariIni}T${jamBerangkat}:00` : `${hariIni}T07:00:00`;
}

function idBerikutnya(): string {
  return `lp-${String(logbooks.length + 1).padStart(2, "0")}`;
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
 */
export function simpanTahapAkhir(
  id: string,
  form: FormLogbook
):
  | { logbook: LogbookPerjalanan }
  | { error: string; errors: Record<string, string> } {
  const existing = logbooks.find((l) => l.id === id);
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
