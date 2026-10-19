"use client";

import { useSyncExternalStore } from "react";
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
 * Mengikuti pola `ticket-store.ts`: data awal dari mock-data, lalu bisa ditambah
 * dan dilengkapi selama sesi berjalan. Modul-level supaya tidak butuh provider
 * dan tetap konsisten antar halaman.
 *
 * Aturan penting yang ditegakkan store ini:
 *
 * 1. Tahap awal hanya menyetor data keberangkatan. `status` bukan input operator
 *    melainkan diturunkan dari isi form (`statusPenggunaanOtomatis`).
 * 2. Tahap pelengkapan **memperbarui catatan yang sama berdasarkan ID** — tidak
 *    pernah membuat entri baru, sehingga tidak ada duplikasi data.
 * 3. Tahap pelengkapan hanya boleh dipanggil bila `validasiTahapAkhir` lolos;
 *    hanya setelah itu status menjadi `Selesai`.
 *
 * Catatan: ini hanya bertahan selama tab browser terbuka. Saat proyek pindah ke
 * backend, seluruh fungsi di bawah tinggal diganti dengan pemanggilan API.
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

/**
 * Simpan data awal (tahap 1).
 *
 * Endurance akhir sengaja tidak ada di sini: unit masih dalam perjalanan ketika
 * tahap ini dicatat, jadi operator cukup mengisi `enduranceAwal`.
 *
 * @returns catatan yang tersimpan, atau `null` bila validasi gagal.
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
}