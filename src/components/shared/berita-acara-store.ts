"use client";

import {
  beritaAcaraList,
  getBeritaAcaraById,
  getBeritaAcaraByTiketId,
  type BeritaAcara,
} from "@/components/shared/mock-data";

/**
 * Store berita acara di sisi klien (modul-level, seperti `ticket-store`).
 *
 * `beritaAcaraList` hidup di memori selama tab terbuka. Saat proyek
 * pindah ke Supabase, mutasinya (`tambahBeritaAcara`,
 * `ubahStatusBeritaAcara` di `mock-data.ts`) tinggal diganti fetch —
 * tanda TODO sudah diletakkan di fungsi mutasinya.
 *
 * Halaman-halaman memakai store ini sebagai titik akses tunggal supaya
 * sumber data berita acara mudah ditelusuri saat migrasi database.
 */

export function useBeritaAcara(): BeritaAcara[] {
  // Baca langsung dari array modul-level; semua mutasi `ubahStatusBeritaAcara`
  // mengganti properti objek di tempat, dan setiap navigasi kembali ke
  // halaman akan me-render ulang array yang sama.
  return beritaAcaraList;
}

/** Ambil satu berita acara berdasarkan ID. */
export function beritaAcaraById(id: string): BeritaAcara | undefined {
  return getBeritaAcaraById(id);
}

/** Ambil berita acara berdasarkan tiket terkait (bila ada). */
export function beritaAcaraByTiket(tiketId: string): BeritaAcara | undefined {
  return getBeritaAcaraByTiketId(tiketId);
}

/** Ambil berita acara yang dibuat dari sebuah checklist. */
export function beritaAcaraByChecklist(
  checklistId: string
): BeritaAcara | undefined {
  return beritaAcaraList.find((b) => b.checklistId === checklistId);
}

/** Daftar berita acara milik sebuah aset. */
export function beritaAcaraByAset(asetId: string): BeritaAcara[] {
  return beritaAcaraList.filter((b) => b.asetId === asetId);
}
