/**
 * Authentication Module
 * Email-based Authentication for Supabase
 * 
 * Login method:
 - Username: Email pengguna
 - Password: Password yang sudah ditetapkan
 * 
 * Additional Features:
 - "Masuk Sebagai" (Impersonation) untuk Mode Dev
 - Password recovery/reset support
 */

import { createSupabaseClient } from "./supabase";
import type { UserRole } from "@/config/navigation";

// Users table structure
// - id: uuid (primary)
// - email: string (unique, digunakan untuk login)
// - nip: string (optional, untuk identifikasi internal)
// - nama: string
// - role: UserRole
// - aktif: boolean
// - password_changed: boolean (sudah mengubah password default atau belum)
// - created_at: timestamptz
// - updated_at: timestamptz

// Default roles jika belum ditetapkan
const DEFAULT_ROLE: UserRole = "OPERATOR_LAPANGAN";

// Fungment helpers untuk role
function getDefaultRole(): UserRole {
  return DEFAULT_ROLE;
}

// ============================================================
// Login dengan Email & Password
// ============================================================

/**
 * Login pengguna menggunakan email dan password
 * @param email Email pengguna (bukan NIP lagi)
 * @param password Password pengguna
 */
export async function loginWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (data.user) {
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("role, nip, nama, aktif, password_changed")
        .eq("email", email)
        .single();

      if (fetchError) {
        console.error("Error fetching user data:", fetchError);
      }

      return {
        data: {
          user: data.user,
          role: userData?.role || getDefaultRole(),
          nama: userData?.nama || email,
          email: userData?.email || email,
          nip: userData?.nip,
          aktif: userData?.aktif || true,
          password_changed: userData?.password_changed ?? false,
        },
        error: null,
      };
    }

    return { data: null, error: "User not found" };
  } catch (err: any) {
    console.error("Login error:", err);
    return { data: null, error: err.message || "Login gagal" };
  }
}

// ============================================================
// "Masuk Sebagai" (Mode Dev / Impersonation)
// ============================================================

/**
 * Masuk sebagai user lain (hanya untuk development/debugging)
 * Fungsi ini memungkinkan admin/member dev login sebagai user target
 * 
 * @param targetEmail Email user yang akan di-login-sebagai
 * @returns Session user impersonated
 */
export async function loginAsUser(targetEmail: string) {
  // Cek apakah mode dev aktif (bisa dicek dari env atau localStorage)
  const isDevMode = import.meta.env.DEV || 
    typeof window !== 'undefined' && 
    localStorage.getItem('supabase-dev-impersonation') === 'true';

  if (!isDevMode) {
    return { data: null, error: "Mode dev tidak aktif" };
  }

  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  // Validasi user target ada di database
  const { data: targetUser, error: userError } = await supabase
    .from("users")
    .select("id, email, role, nama, aktif")
    .eq("email", targetEmail)
    .single();

  if (userError || !targetUser) {
    return { data: null, error: "User target tidak ditemukan" };
  }

  if (!targetUser.aktif) {
    return { data: null, error: "User target tidak aktif" };
  }

  // Buat session sebagai user target
  // Note: Ini adalah implementasi khusus dev, tidak melewali auth signin
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: sessionError.message };
  }

  // Update session user ke target user
  const impersonatedUser = {
    ...sessionData.session?.user,
    id: targetUser.id,
    email: targetUser.email,
    user_metadata: {
      ...sessionData.session?.user?.user_metadata,
      impersonating: targetEmail,
      dev_mode: true,
    },
  };

  // Simpan informasi impersonation ke localStorage untuk tracking
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase-impersonated-as', targetEmail);
    localStorage.setItem('supabase-dev-impersonation', 'true');
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
      targetEmail: targetEmail,
    },
    error: null,
  };
}

/**
 * Logout dari mode impersonation (kembali ke user asli)
 */
export async function logoutFromImpersonation() {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  // Hapus tracking impersonation dari localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase-impersonated-as');
    localStorage.removeItem('supabase-dev-impersonation');
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
 * @param email Email pengguna (unik)
 * @param password Password pengguna
 * @param nama Nama lengkap pengguna
 * @param role Role pengguna (opsional, default OPERATOR_LAPANGAN)
 */
export async function registerUserWithEmail(
  email: string, 
  password: string, 
  nama: string, 
  role: UserRole = "OPERATOR_LAPANGAN"
) {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  // Cek apakah email sudah terdaftar
  const { data: existingUser, error: checkError } = await supabase
    .from("users")
    .select("email")
    .eq("email", email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = not found, itu ok
    return { data: null, error: checkError.message };
  }

  if (existingUser) {
    return { data: null, error: "Email sudah terdaftar" };
  }

  // Buat user di auth Supabase
  const { data, error: signupError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        role: role,
        nama: nama,
        // NIP akan di-generate atau diisi secara manual nanti
      },
    },
  });

  if (signupError) {
    return { data: null, error: signupError.message };
  }

  // Buat entri di users table
  const { error: insertError } = await supabase
    .from("users")
    .insert({
      id: data.user?.id,
      email: email,
      nama: nama,
      role: role,
      aktif: true,
      nip: '', // Akan diisi nanti jika perlu
      password_changed: true, // Baru daftar, sudah memiliki password
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error("Error inserting user to table:", insertError);
    // Jika gagal insert table, bisa hapus user auth yang dibuat
    // tapi biarkan untuk sekarang
  }

  return { data, error: insertError?.message };
}

// ============================================================
// Fungsi Bantuan
// ============================================================

/**
 * Verifikasi apakah pengguna sudah login
 */
export async function isLoggedIn(): Promise<boolean> {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  const { data: { session }, error } = await supabase.auth.getSession();
  return !!(session?.user);
}

/**
 * Mendapatkan role pengguna saat ini
 */
export async function getUserRole(): Promise<UserRole> {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session?.user) {
    return getDefaultRole();
  }

  // Cek dari user_metadata jika ada impersonation
  const metadata = session.user.user_metadata as any;
  if (metadata?.isImpersonating) {
    return metadata.dev_role || getDefaultRole();
  }

  // Cek dari database
  if (session.user.email) {
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("role")
      .eq("email", session.user.email)
      .single();

    if (fetchError) {
      console.error("Error fetching role:", fetchError);
    }
    if (userData?.role) {
      return userData.role;
    }
  }

  return getDefaultRole();
}

/**
 * Cek apakah pengguna ada di database
 */
export async function userExistsInDatabase(email: string): Promise<boolean> {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("email", email);

  if (error) {
    console.error("Error checking user existence:", error);
    return false;
  }

  return !!(count && count > 0);
}

/**
 * Get current user with full profile
 */
export async function getUserProfile() {
  const supabase = createSupabaseClient(
    {} as Request,
    {} as Response
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null, error: "No session" };
  }

  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("*, profile:image_url")
    .eq("email", session.user.email)
    .single();

  if (fetchError) {
    console.error("Error fetching user profile:", fetchError);
    return { user: session.user, error: fetchError };
  }

  return {
    user: {
      ...session.user,
      ...userData,
    },
    error: null,
  };
}