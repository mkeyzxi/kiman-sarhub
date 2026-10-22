"use client";

import {
  checklistHarianList,
  getChecklistHarianById,
  type ItemHasilPengecekan,
} from "@/components/shared/mock-data";

/**
 * Penyimpanan checklist harian di memori (sisi klien).
 *
 * Saat ini hanya "memori" — saat proyek pindah ke Supabase, fungsi
 * `tambahChecklist` tinggal diganti dengan fetch/INSERT.
 *
 * Polanya mengikuti `ticket-store`: array mutabel + re-render.
 */

/** ID checklist berikutnya. */
function nextChecklistId(): string {
  const maks = checklistHarianList.reduce((acc, c) => {
    const nomor = Number(c.id.replace(/\D/g, ""));
    return Number.isFinite(nomor) ? Math.max(acc, nomor) : acc;
  }, 0);
  return `chk-${String(maks + 1).padStart(3, "0")}`;
}

export interface InputChecklist {
  tanggal: string;
  unit: string;
  jenisUnit: "Kapal" | "Mobil" | "Motor" | "Perahu";
  templateId?: string;
  /** Nama pemeriksa (PJ) — terisi otomatis dari akun yang login. */
  pemeriksa: string;
  /** ID user pemeriksa (untuk riwayat & auto-fill berita acara). */
  pemeriksaId?: string;
  itemChecked: number;
  itemTotal: number;
  items: ItemHasilPengecekan[];
  catatan: string;
  /** Aset BMN terkait (untuk mengisi otomatis berita acara). */
  asetId?: string;
}

export interface ChecklistBaru {
  id: string;
  status: "Lengkap" | "Belum Lengkap";
}

/**
 * Tambah checklist ke daftar (status dihitung dari itemChecked/itemTotal).
 *
 * TODO: ganti dengan INSERT ke tabel `checklist`.
 */
export function tambahChecklist(input: InputChecklist): ChecklistBaru {
  const lengkap = input.itemChecked === input.itemTotal;
  const baru = {
    ...input,
    id: nextChecklistId(),
    status: (lengkap ? "Lengkap" : "Belum Lengkap") as
      | "Lengkap"
      | "Belum Lengkap",
  };
  checklistHarianList.unshift(baru as never);
  return { id: baru.id, status: baru.status };
}

/**
 * Ambil satu checklist berdasarkan ID — gabungkan data mock (seed) dan
 * data yang baru disimpan di memori sesi ini.
 */
export function ambilChecklist(
  id: string
): (typeof checklistHarianList)[number] | undefined {
  // Data seed
  const seed = getChecklistHarianById(id);
  if (seed) return seed;

  // Data yang baru disimpan sesi ini
  const sesi = checklistHarianList.find((c) => c.id === id);
  return sesi;
}
