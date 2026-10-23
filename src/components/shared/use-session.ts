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

  if (nama) {
    const peran = (role || cocok?.role || "PENGELOLA_BMN") as UserRole;
    return {
      id: cocok?.id ?? `login:${nama}`,
      nama,
      role: peran,
      jabatan: roleLabels[peran],
    };
  }

  // Fallback untuk preview tanpa login: operator lapangan, supaya form
  // checklist tetap dapat dicoba. Saat login, identitas asli dari localStorage
  // yang dipakai.
  const fallback =
    getUserById("usr-005") ??
    users.find((u) => u.role === "OPERATOR_LAPANGAN") ??
    users[0];
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
