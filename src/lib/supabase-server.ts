/**
 * Supabase Server Client
 *
 * Untuk dipakai di Server Components & Route Handlers.
 * Membaca session dari cookies request (session Supabase SSR disimpan di cookie).
 */

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Client Supabase untuk server-side (Server Component / Route Handler).
 * Session dibaca dari cookies request secara otomatis.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Dipanggil dari Server Component — cookie tidak bisa ditulis.
            // Diabaikan dengan aman; refresh token ditangani middleware/API route.
          }
        },
      },
    }
  );
}

/**
 * Client Supabase dengan service_role key — bypass RLS.
 * Gunakan hanya di server-side untuk operasi admin (CRUD user).
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Ambil user yang sedang login berdasarkan session di cookies.
 * @returns User Supabase, atau null jika belum login.
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
