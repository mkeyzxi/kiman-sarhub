/**
 * Supabase Client Configuration
 * Menggunakan @supabase/ssr untuk Next.js 14+ App Router
 * 
 * Konfigurasi untuk auth berbasis email
 * Project ID: yzswezcgttegsrqisrfq
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types/supabase";

/**
 * Create Supabase client instance
 * Note: Di @supabase/ssr versi baru, createClient di-rename menjadi createBrowserClient
 * @param request Next.js request object
 * @param response Next.js response object
 */
export const createSupabaseClient = (
  request: Request,
  response: Response
) => {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      // Auto refresh token
      autoRefreshToken: true,
      // Persist session ke localStorage/cookie
      persistSession: true,
      // Deteksi session dari URL (magic link)
      detectSessionInUrl: true,
      // Minimum session lifetime (detik)
      // Session akan di-refresh sebelum expire
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
        },
      },
    },
  });
};

export type { Database };