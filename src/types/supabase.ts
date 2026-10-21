/**
 * Supabase Database Types
 * Dibuat berdasarkan integrasi email-based auth
 *
 * CATATAN PENTING:
 * 1. Tipe `UserRole` didefinisikan lokal di file ini (bukan di-import dari
 *    `mock-data.ts`) untuk menghindari circular dependency.
 * 2. Semua tipe table menggunakan `type` alias, BUKAN `interface`.
 *    reason: `interface` pada tabel PostgREST memicu batas inferensi tipe
 *    TypeScript sehingga hasil query `.from("users").select(...)` di-infer
 *    sebagai `never` dan `insert()` menolak argumen.
 */

/** Role pengguna yang tersedia di sistem */
export type UserRole =
  | "ADMIN_IT"
  | "PENGELOLA_BMN"
  | "KAKANSAR"
  | "OPERATOR_LAPANGAN";

// ─── Public Schema: users table ──────────────────────────────────────────────

export type UserRow = {
  id: string;
  email: string;
  nip: string | null;
  nama: string;
  role: UserRole;
  aktif: boolean;
  password_changed: boolean;
  /** Opsional — tersedia setelah migration `add_deleted_at.sql` dijalankan */
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserInsert = {
  id: string;
  email: string;
  nip?: string | null;
  nama: string;
  role: UserRole;
  aktif?: boolean;
  password_changed?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UserUpdate = {
  id?: string;
  email?: string;
  nip?: string | null;
  nama?: string;
  role?: UserRole;
  aktif?: boolean;
  password_changed?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Tipe Database untuk generic Supabase client.
 * Format ini mengikuti hasil generate `supabase gen types`.
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Convenience types ───────────────────────────────────────────────────────

/**
 * User profile dari tabel public.users.
 * `nip` & `deleted_at` bisa null.
 */
export type UserProfile = UserRow;

/**
 * Form data untuk login (NIP-based authentication).
 * `email` masih ada untuk kompatibilitas — lihat `loginWithEmail()`.
 */
export type LoginFormData = {
  nip: string;
  password: string;
};

/**
 * Form data untuk login lama (email-based) — masih didukung,
 * tapi bukan jalur utama. Jalur utama sekarang `loginWithNip()`.
 */
export type LoginEmailFormData = {
  email: string;
  password: string;
};

/**
 * Metadata khusus untuk fitur impersonation ("Masuk Sebagai" Mode Dev).
 */
export type ImpersonationMetadata = {
  impersonating?: string;
  dev_mode?: boolean;
  dev_role?: UserRole;
  [key: string]: unknown;
};

// CATATAN: Module augmentation untuk `@supabase/supabase-js` SENGAJA tidak
// digunakan di sini. Augmentasi `interface User` / `interface Session`
// membuat TypeScript mengalami circular type inference sehingga hasil
// query `.from("users").select(...)` menjadi `never`.
//
// Jika metadata dev dibutuhkan, gunakan type assertion lokal di tempat
// yang membutuhkannya (lihat `src/lib/auth.ts` → `ImpersonationMetadata`).
