/**
 * Supabase Client Configuration (Browser)
 *
 * Menggunakan @supabase/ssr untuk Next.js App Router.
 * Session dikelola otomatis via cookies oleh @supabase/ssr.
 *
 * Project ID: yzswezcgttegsrqisrfq
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types/supabase";

/**
 * Tipe client Supabase browser, diturunkan langsung dari factory
 * `createBrowserClient` agar generic Database & SchemaName ter-resolve konsisten.
 */
export type SupabaseBrowserClient = ReturnType<
  typeof createBrowserClient<Database>
>;

/**
 * Client Supabase singleton untuk sisi browser (Client Components).
 *
 * @supabase/ssr mengelola session via cookies secara otomatis,
 * sehingga tidak perlu konfigurasi `auth.storage` manual.
 */
let browserClient: SupabaseBrowserClient | undefined;

export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Refresh token otomatis sebelum session expire
          autoRefreshToken: true,
          // Simpan session (dikelola @supabase/ssr via cookies)
          persistSession: true,
          // Deteksi session dari URL (magic link / callback OAuth)
          detectSessionInUrl: true,
        },
      }
    );
  }

  return browserClient;
}

export type { Database };
