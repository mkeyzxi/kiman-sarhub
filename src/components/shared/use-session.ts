"use client";

import { useLocalStorageValue } from "@/lib/use-local-storage";
import { users, getUserById, type UserRole } from "./mock-data";
import { roleLabels } from "@/config/navigation";

/**
 * Hook sesi pengguna — identitas user yang sedang login.
 *
 * Sumber: `userRole` & `userNama` di localStorage (di-set oleh halaman
 * login Supabase). Dipakai untuk:
 * - mengisi otomatis nama PJ (pelapor) pada form berita acara,
 * - menampilkan "menyerahkan oleh" pada antrean BMN.
 *
 * Data mock `users` dipakai sebagai fallback agar form tetap berfungsi
 * saat preview tanpa login. Nantinya cukup diganti fetch profil.
 */

export interface SesiUser {
  id: string;
  nama: string;
  role: UserRole;
  jabatan: string;
}

export function useSesiUser(): SesiUser {
  const nama = useLocalStorageValue("userNama");
  const role = useLocalStorageValue("userRole") as UserRole | "";

  // Cocokkan nama login dengan daftar user mock
  const cocok = nama ? users.find((u) => u.nama === nama) : undefined;

  if (nama && cocok) {
    const peran = (role || cocok.role) as UserRole;
    return {
      id: cocok.id,
      nama: cocok.nama,
      role: peran,
      jabatan: roleLabels[peran],
    };
  }

  // Fallback: user pertama (preview)
  const fallback = getUserById("usr-001") ?? users[0];
  const peranFallback = fallback.role;
  return {
    id: fallback.id,
    nama: fallback.nama,
    role: peranFallback,
    jabatan: roleLabels[peranFallback],
  };
}

/** Jabatan label untuk user tertentu (untuk riwayat aset / berita acara). */
export function jabatanUser(userId: string): string {
  const u = getUserById(userId);
  if (!u) return "Petugas";
  return roleLabels[u.role];
}

/**
 * Jabatan berdasarkan nama user — dipakai untuk checklist lama yang hanya
 * menyimpan nama pemeriksa (belum ada `pemeriksaId`).
 */
export function jabatanUserByNama(nama: string): string {
  const u = users.find((x) => x.nama === nama);
  if (!u) return "Petugas";
  return roleLabels[u.role];
}
