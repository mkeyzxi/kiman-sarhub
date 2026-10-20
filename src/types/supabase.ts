/**
 * Supabase Database Types
 * Dibuat berdasarkan integrasi email-based auth
 */

// User profile from public.users table
export interface UserProfile {
  id: string;
  email: string;
  nip: string; // Bisa kosongterisi, opsional untuk identifikasi internal
  nama: string;
  role: UserRole;
  aktif: boolean;
  password_changed: boolean; // Sudah mengubah password default atau belum
  created_at: string;
  updated_at: string;
}

// Signup options data
export interface SignupOptions {
  email: string;
  password: string;
  nama: string;
  role: UserRole;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Session user extension
declare module "@supabase/supabase-js" {
  interface User {
    // User profile ditambahkan ke session
    user_profile?: UserProfile;
    
    // Metadata khusus untuk dev mode impersonation
    user_metadata?: {
      impersonating?: string; // Email user yang di-login-sebagai
      dev_mode?: boolean;
      dev_role?: UserRole;
    };
  }

  interface Session {
    user: User & UserProfile;
    
    // Additional session info
    app_metadata?: {
      provider: string;
      provider_id: string;
    };
  }
}