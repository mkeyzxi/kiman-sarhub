/**
 * Authentication Module
 * NIP-based Authentication for Supabase (email sintetis dari NIP)
 *
 * Login method:
 * - Username: NIP pengguna (16-18 digit, contoh: 198208042009121003)
 * - Password: Password yang telah ditetapkan
 * Email internal dipetakan: {nip}@basarnas.ac.id
 *
 * Additional Features:
 * - "Masuk Sebagai" (Impersonation) untuk Mode Dev
 *
 * CATATAN TEKNIS:
 * Tipe tabel `users` pada `src/types/supabase.ts` WAJIB menggunakan
 * `type` alias (bukan `interface`) agar TypeScript dapat meng-infer
 * hasil query PostgREST dengan benar.
 * Seluruh pencarian profil diwajibkan pakai `id` (auth.uid()), bukan email,
 * untuk menghindari masalah ketika email diganti/admin merubahnya.
 */

import { getSupabaseBrowserClient } from "./supabase";
import type { UserRole } from "@/config/navigation";
import { normalizeNip, nipToInternalEmail, isValidNip, INTERNAL_EMAIL_DOMAIN } from "./auth-identity";

// Default roles jika belum ditetapkan
const DEFAULT_ROLE: UserRole = "OPERATOR_LAPANGAN";

// Metadata khusus untuk fitur impersonation ("Masuk Sebagai" Mode Dev)
interface ImpersonationMetadata {
  impersonating?: string;
  dev_mode?: boolean;
  dev_role?: UserRole;
  [key: string]: unknown;
}

// Helper untuk role
function getDefaultRole(): UserRole {
  return DEFAULT_ROLE;
}

// ============================================================
// Login dengan Email & Password
// ============================================================

/**
 * Pesan error yang ditampilkan saat akun dinonaktifkan oleh Admin IT.
 */
export const INACTIVE_ACCOUNT_MESSAGE =
  "Akun Anda nonaktif. Silahkan menghubungi admin.";

/**
 * Login pengguna menggunakan NIP dan password
 *
 * Arsitektur performa:
 *   1. Validasi format NIP di client (0 ms).
 *   2. Konversi NIP → email internal `{nip}@basarnas.ac.id` (0 ms).
 *   3. signInWithPassword (1 RTT, ~380 ms). JWT-nya sudah membawa `app_metadata`
 *      yang berisi `{ role, aktif, nip, nama }` → TANPA query DB kedua.
 *   4. Jika `app_metadata.aktif === false` → tolak login, session langsung
 *      signOut. Cek `aktif` real-time di halaman dashboard tetap dilakukan
 *      `AccountStatusGuard` di background (non-blocking).
 *
 * @param nip NIP pengguna (16-18 digit, contoh: 198208042009121003)
 * @param password Password pengguna
 */
export async function loginWithNip(nip: string, password: string) {
  // 1. Validasi format NIP
  if (!isValidNip(nip)) {
    return { data: null, error: "NIP tidak valid. Harus 16-18 digit angka." };
  }

  // 2. Konversi NIP ke email internal Supabase auth
  const internalEmail = nipToInternalEmail(nip);

  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (data.user) {
      // 3. Baca profil langsung dari app_metadata di JWT (0 RTT).
      //    `app_metadata` diisi server (via service_role) setiap kali
      //    data user berubah. Lihat `scripts/repair-auth-metadata.mjs`.
      //    Jika field belum ada di metadata (mis. JWT lama sebelum
      //    backfill), fallback ke query DB.
      const meta = data.user.app_metadata as
        | {
            role?: UserRole;
            aktif?: boolean;
            nip?: string;
            nama?: string;
          }
        | undefined;

      let role: UserRole | undefined = meta?.role;
      let nama: string | undefined = meta?.nama;
      let nipDb: string | undefined = meta?.nip;
      let aktif: boolean | undefined = meta?.aktif;

      // Fallback: kalau app_metadata belum di-backfill, ambil dari DB
      if (role === undefined || nama === undefined || aktif === undefined) {
        const { data: rawUser, error: fetchError } = await supabase
          .from("users")
          .select("role, nama, nip, aktif")
          .eq("id", data.user.id)
          .single();

        if (fetchError) {
          console.error("Login ok tapi profil gagal dimuat:", fetchError);
          await supabase.auth.signOut();
          return { data: null, error: "Login berhasil tapi profil tidak ditemukan" };
        }

        if (role === undefined) role = rawUser?.role;
        if (nama === undefined) nama = rawUser?.nama;
        nipDb = rawUser?.nip ?? undefined;
        if (aktif === undefined) aktif = rawUser?.aktif;
      }

      // 4. Cek status akun: nonaktif → tolak login.
      if (aktif === false) {
        await supabase.auth.signOut();
        return { data: null, error: INACTIVE_ACCOUNT_MESSAGE };
      }

      return {
        data: {
          user: data.user,
          role: role ?? getDefaultRole(),
          nama: nama ?? normalizeNip(nip),
          email: internalEmail,
          nip: nipDb ?? normalizeNip(nip),
          aktif: aktif ?? true,
          password_changed: (data.user.app_metadata as Record<string, unknown>)
            ?.password_changed as boolean | undefined ?? false,
        },
        error: null,
      };
    }

    return { data: null, error: "User not found" };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Login gagal");
    console.error("Login error:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Login pengguna menggunakan email dan password
 *
 * Fungsi ini tetap dijaga untuk kompatibilitas atau kasus tertentu,
 * namun login utama sekarang digunakan `loginWithNip()`.
 *
 * @param email Email pengguna (bisa email asli atau email sintetis {nip}@basarnas.ac.id)
 * @param password Password pengguna
 */
export async function loginWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (data.user) {
      // Cari data profil dari public.users berdasarkan email yang login
      const { data: rawUser, error: fetchError } = await supabase
        .from("users")
        .select("id, email, role, nip, nama, aktif, password_changed")
        .eq("email", email)
        .single();

      if (fetchError) {
        console.error("Error fetching user data:", fetchError);
      }

      const userData = rawUser;

      // Cek status akun: nonaktif (soft delete) → tolak login.
      // Kolom `aktif` adalah sumber kebenaran tunggal; kolom `deleted_at`
      // bersifat opsional (lihat migration `add_deleted_at.sql`).
      if (userData && !userData.aktif) {
        // Putuskan session yang baru dibuat agar tidak bisa dipakai
        await supabase.auth.signOut();

        return { data: null, error: INACTIVE_ACCOUNT_MESSAGE };
      }

      return {
        data: {
          user: data.user,
          role: userData?.role ?? getDefaultRole(),
          nama: userData?.nama ?? email,
          email: userData?.email ?? email,
          nip: userData?.nip ?? null,
          aktif: userData?.aktif ?? true,
          password_changed: userData?.password_changed ?? false,
        },
        error: null,
      };
    }

    return { data: null, error: "User not found" };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Login gagal");
    console.error("Login error:", error);
    return { data: null, error: error.message };
  }
}

// ============================================================
// "Masuk Sebagai" (Mode Dev / Impersonation)
// ============================================================

/**
 * Masuk sebagai user lain (hanya untuk development/debugging)
 *
 * @param targetNip NIP user yang akan di-login-sebagai
 */
export async function loginAsUser(targetNip: string) {
  // Cek apakah mode dev aktif
  const isDevMode =
    import.meta.env.DEV ||
    (typeof window !== "undefined" &&
      localStorage.getItem("supabase-dev-impersonation") === "true");

  if (!isDevMode) {
    return { data: null, error: "Mode dev tidak aktif" };
  }

  const supabase = getSupabaseBrowserClient();

  // Validasi user target ada di database berdasarkan NIP
  const { data: rawTarget, error: userError } = await supabase
    .from("users")
    .select("id, email, role, nama, nip, aktif")
    .eq("nip", targetNip)
    .single();

  if (userError || !rawTarget) {
    return { data: null, error: "User target tidak ditemukan" };
  }

  const targetUser = rawTarget;

  if (!targetUser.aktif) {
    return { data: null, error: "User target tidak aktif" };
  }

  // Ambil session saat ini
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: sessionError.message };
  }

  // Susun user impersonated
  const impersonatedUser = {
    ...sessionData.session?.user,
    id: targetUser.id,
    email: targetUser.email,
    user_metadata: {
      ...sessionData.session?.user?.user_metadata,
      impersonating: targetNip,
      dev_mode: true,
    },
  };

  // Simpan informasi impersonation ke localStorage untuk tracking
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase-impersonated-as", targetNip);
    localStorage.setItem("supabase-dev-impersonation", "true");
  }

  return {
    data: {
      user: impersonatedUser,
      role: targetUser.role,
      nama: targetUser.nama,
      email: targetUser.email,
      nip: targetUser.nip,
      aktif: targetUser.aktif,
      isImpersonating: true,
      targetNip,
    },
    error: null,
  };
}

/**
 * Logout dari mode impersonation (kembali ke user asli)
 */
export async function logoutFromImpersonation() {
  const supabase = getSupabaseBrowserClient();

  // Hapus tracking impersonation dari localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("supabase-impersonated-as");
    localStorage.removeItem("supabase-dev-impersonation");
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error);
  }
  return { error };
}

// ============================================================
// Register User Baru
// ============================================================

/**
 * Mendaftarkan user baru dengan email
 */
export async function registerUserWithEmail(
  email: string,
  password: string,
  nama: string,
  role: UserRole = "OPERATOR_LAPANGAN"
) {
  const supabase = getSupabaseBrowserClient();

  // Cek apakah email sudah terdaftar
  const { data: existingRaw } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingRaw) {
    return { data: null, error: "Email sudah terdaftar" };
  }

  // Buat user di auth.users
  const { data, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        nama,
        // NIP bisa diisi kemudian oleh Admin IT
      },
    },
  });

  if (signupError) {
    return { data: null, error: signupError.message };
  }

  // Insert ke public.users
  // Cast eksplisit — lihat catatan teknis di header file
  const { error: insertError } = await supabase.from("users").insert({
    id: data.user?.id ?? "",
    email,
    nama,
    role,
    aktif: true,
    nip: "",
    password_changed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Error inserting user to table:", insertError);
  }

  return { data, error: insertError?.message ?? null };
}

// ============================================================
// Fungsi Bantuan
// ============================================================

/**
 * Verifikasi apakah pengguna sudah login
 */
export async function isLoggedIn(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return !!data.session?.user;
}

/**
 * Mendapatkan role pengguna saat ini
 *
 * Performa: baca dulu dari `app_metadata` di JWT (0 RTT). Hanya query DB
 * sebagai fallback kalau metadata belum di-backfill.
 */
export async function getUserRole(): Promise<UserRole> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session?.user) {
    return getDefaultRole();
  }

  // Cek dari user_metadata jika ada impersonation
  const metadata = data.session.user.user_metadata as ImpersonationMetadata;
  if (metadata?.isImpersonating) {
    return metadata.dev_role ?? getDefaultRole();
  }

  // 1) Baca dari app_metadata di JWT (0 RTT)
  const appMeta = data.session.user.app_metadata as
    | { role?: UserRole }
    | undefined;
  if (appMeta?.role) {
    return appMeta.role;
  }

  // 2) Fallback: query database berdasarkan ID user (bukan email),
  //    karena email bisa berubah saat admin merubah data profil.
  if (data.session.user.id) {
    const { data: rawUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.session.user.id)
      .single();

    const userData = rawUser;
    if (userData?.role) {
      return userData.role;
    }
  }

  return getDefaultRole();
}

/**
 * Cek apakah pengguna ada di database berdasarkan NIP
 */
export async function userExistsInDatabase(nip: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("nip", nip);

  if (error) {
    console.error("Error checking user existence:", error);
    return false;
  }

  return !!count && count > 0;
}

/**
 * Get current user with full profile
 */
export async function getUserProfile() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session?.user?.id) {
    return { user: null, error: "No session" };
  }

  // Ambil profil dari public.users menggunakan ID user (bukan email).
  // Alasan: email bisa diganti admin sewaktu-waktu, tetapi id selalu stabil
  // dan sama dengan auth.uid() di session.
  const { data: rawUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.session.user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching user profile:", fetchError);
    return { user: data.session.user, error: fetchError };
  }

  const userData = rawUser;

  return {
    user: {
      ...data.session.user,
      ...userData,
    },
    error: null,
  };
}
