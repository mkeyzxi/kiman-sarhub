"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { notifyLocalStorageChange } from "@/lib/use-local-storage";

/**
 * AccountStatusGuard
 *
 * Cek bahwa akun yang sedang login masih AKTIF di database.
 *
 * Performa (2 lapis):
 *  1. Sinkron dari `app_metadata.aktif` di JWT — 0 ms, jika false langsung
 *     signOut & redirect. Ini menangkap deactivation yang sudah diketahui
 *     server saat token dibuat/refresh.
 *  2. Revalidasi ke `public.users` di background (non-blocking) — menangkap
 *     deactivation yang terjadi SEBELUM token terbit. Saat redirect, UI
 *     sudah tampil; tidak ada lagi full-screen "Memeriksa status akun...".
 */
export function AccountStatusGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccountStatus() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Belum login — biarkan layout yang redirect ke /login
        if (!session?.user?.id) return;

        // ── Lapis 1: cek sinkron dari app_metadata (0 ms) ─────────────
        const meta = session.user.app_metadata as
          | { aktif?: boolean }
          | undefined;
        if (meta?.aktif === false) {
          await supabase.auth.signOut();
          if (!cancelled) clearSessionStorage();
          router.replace(`/login?error=${encodeURIComponent(INACTIVE_ACCOUNT_MESSAGE)}`);
          return;
        }

        // ── Lapis 2: revalidasi ke DB di background (non-blocking) ───
        // Jalankan tanpa memblokir render; kalau akun dinonaktifkan
        // setelah token terbit, revalidasi ini akan menangkapnya.
        const { data: profile, error } = await supabase
          .from("users")
          .select("aktif")
          .eq("id", session.user.id)
          .single();

        if (!cancelled) {
          // Jika revalidasi menemukan akun nonaktif (atau data tak ada),
          // signOut + redirect. Tidak ada indikator UI (sudah lewat).
          if (error || profile?.aktif === false) {
            await supabase.auth.signOut();
            clearSessionStorage();
            router.replace(
              `/login?error=${encodeURIComponent(
                error ? "Sesi berakhir. Silakan login kembali." : INACTIVE_ACCOUNT_MESSAGE
              )}`
            );
          }
        }
      } catch (err) {
        // Kesalahan di background tidak boleh crash UI — cukup log
        console.error("AccountStatusGuard error:", err);
      }
    }

    checkAccountStatus();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Tidak lagi blokir seluruh render; hanya spinner kecil saat Lapis 1
  // sedang memeriksa (hanya terjadi di awal mount, praktis <1ms).
  return null;
}

/**
 * Bersihkan data sesi di localStorage.
 */
function clearSessionStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("userRole");
  localStorage.removeItem("userNama");
  localStorage.removeItem("userNip");
  localStorage.removeItem("userEmail");
  notifyLocalStorageChange();
}
