"use client";

import { useEffect, useState } from "react";
import { useLocalStorageValue } from "@/lib/use-local-storage";
import { roleLabels } from "@/config/navigation";
import { users, getUserById as mockGetUserById, type UserRole } from "./mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Klien Supabase sisi browser (anon key + session cookie via @supabase/ssr).
 * Diambil lazy saat dibutuhkan, bukan saat modul dievaluasi — supaya tidak
 * memicu error "supabaseKey is required" jika env belum siap di client.
 */
function getSupa() {
  return getSupabaseBrowserClient();
}

/** Interface untuk profil dari tabel `users` di Supabase. */
interface SupabaseProfile {
  id: string;
  nama?: string;
  email?: string;
  role?: string;
  nip?: string;
}

/**
 * Ambil profil user dari tabel `users` berdasarkan NIP.
 * Login sistem memakai NIP, jadi identifier yang stabil adalah `nip`.
 * Hasil disimpan ke localStorage untuk dipakai lintas render.
 */
async function fetchProfileByNip(nip: string): Promise<SupabaseProfile | null> {
  if (!nip) return null;
  const supa = getSupa();
  const { data, error } = await supa
    .from("users")
    .select("id, nama, email, role, nip")
    .eq("nip", nip)
    .maybeSingle();
  if (error || !data) return null;
  return data as SupabaseProfile;
}

/**
 * Hook sesi pengguna — identitas user yang sedang login.
 *
 * `id` selalu berisi **NIP** (16-18 digit), bukan UUID `public.users.id`
 * maupun placeholder `usr-XXX`. NIP adalah kunci identitas standar di
 * seluruh app (sesuai keputusan proyek "NIP untuk relasi").
 *
 * - `nip`: NIP user login (identik dengan `id`).
 * - `uuid`: ID Supabase Auth (UUID `public.users.id`) — tersedia bila
 *   profile Supabase sudah ter-fetch; dipakai bila butuh referensi
 *   ke `public.users.id` (mis. FK ke tabel lain yang pakai UUID).
 */

export interface SesiUser {
  /** NIP user (16-18 digit). Ini kunci identitas di seluruh app. */
  id: string;
  /** NIP — identik dengan `id`. Dipertahankan eksplisit untuk kejelasan. */
  nip: string;
  /** UUID `public.users.id` (bila profile Supabase sudah ter-fetch). */
  uuid?: string;
  nama: string;
  role: UserRole;
  jabatan: string;
}

export function useSesiUser(): SesiUser {
  const nama = useLocalStorageValue("userNama");
  const nip = useLocalStorageValue("userNip");
  const roleStored = useLocalStorageValue("userRole");

  // State profil dari Supabase
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);

  // --- FASE 1: Coba ambil profil dari Supabase berdasarkan NIP (sudah login) ---
  useEffect(() => {
    if (!nip) return;
    let cancelled = false;
    fetchProfileByNip(nip).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [nip]);

  // Determine user identity:
  // Priority 1: profile dari Supabase (jika sudah ter-fetch)
  // Priority 2: localStorage (role + nama) yang diset saat login
  // Priority 3: fallback ke mock data

  // Cek apakah profile sudah tersedia dari Supabase
  if (profile) {
    const pRole = (profile.role || roleStored || "OPERATOR_LAPANGAN") as UserRole;
    const profileNip = profile.nip || nip || "";
    return {
      id: profileNip,
      nip: profileNip,
      uuid: profile.id,
      nama: profile.nama || nama || "User",
      role: pRole,
      jabatan: roleLabels[pRole],
    };
  }

  // Jika belum ada profile dari Supabase (belum login / loading),
  // pakai data localStorage yang diset saat login.
  if (roleStored && (nama || nip)) {
    const lr = roleStored as UserRole;
    const n = nip || "unknown";
    return {
      id: n,
      nip: n,
      nama: nama || n,
      role: lr,
      jabatan: roleLabels[lr],
    };
  }

  // Fallback ke mock data (mode pengembangan / offline)
  const mockUser = nama ? users.find((u) => u.nama === nama) : undefined;

  if (mockUser) {
    return {
      id: mockUser.nip,
      nip: mockUser.nip,
      nama: mockUser.nama,
      role: mockUser.role,
      jabatan: roleLabels[mockUser.role],
    };
  }

  // Fallback terakhir: user tak dikenal menjadi operator/PJ untuk preview form
  const fallback =
    mockGetUserById("usr-005") ?? // usr-005 adalah Fajar Farial (operator pertama)
    users.find((u) => u.role === "OPERATOR_LAPANGAN") ?? users[0];
  const peranFallback = fallback.role;
  return {
    id: fallback.nip,
    nip: fallback.nip,
    nama: fallback.nama,
    role: peranFallback,
    jabatan: roleLabels[peranFallback],
  };
}

/** Jabatan label untuk user tertentu (untuk riwayat aset / berita acara). */
export function jabatanUser(userId: string): string {
  // Coba ambil dari Supabase profiles dulu (butuh query ke supa)
  // Untuk saat ini, pakai mock data karena butuh supa client di sisi server
  const u = mockGetUserById(userId);
  if (!u) return "Petugas";
  return roleLabels[u.role];
}

/** Jabatan berdasarkan nama user — dipakai untuk checklist lama yang hanya menyimpan nama pemeriksa. */
export function jabatanUserByNama(nama: string): string {
  const u = users.find((x) => x.nama === nama);
  if (!u) return "Petugas";
  return roleLabels[u.role];
}

/** Mendapatkan data lengkap user berdasarkan NIP (digunakan di form admin). */
export async function userByNip(nip: string): Promise<{ id: string; nama: string; role: UserRole } | null> {
  const supa = getSupa();
  const { data, error } = await supa
    .from("users")
    .select("id, nama, role, nip")
    .eq("nip", nip)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    nama: data.nama ?? nip,
    role: (data.role as UserRole) ?? "OPERATOR_LAPANGAN",
  };
}