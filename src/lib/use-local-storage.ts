/**
 * Hook untuk membaca nilai dari localStorage tanpa memicu setState di dalam effect.
 *
 * Menggunakan `useSyncExternalStore` — API resmi React untuk menyinkronkan
 * state dengan sumber data eksternal (localStorage) secara aman:
 * - Tidak ada cascading render (setState di dalam effect_body)
 * - Aman untuk SSR (server snapshot dikembalikan saat render di server)
 * - Re-render otomatis saat nilai berubah
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe ke perubahan localStorage.
 * `storage` event hanya fires di tab lain, jadi kita jugaispatch event
 * custom (`local-storage-change`) dari setter di halaman login.
 */
function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener("local-storage-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("local-storage-change", callback);
  };
}

/**
 * Hook untuk membaca satu key dari localStorage.
 *
 * @param key Key localStorage yang dibaca
 * @param fallback Nilai yang dikembalikan jika key tidak ada / bukan string
 */
export function useLocalStorageValue(
  key: string,
  fallback = ""
): string {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return fallback;
    }
    return window.localStorage.getItem(key) ?? fallback;
  }, [key, fallback]);

  // Server selalu menggunakan fallback agar render server & client konsisten
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Notifikasi semua subscriber bahwa localStorage berubah.
 * Dipanggil setelah `localStorage.setItem` agar UI langsung ter-update.
 */
export function notifyLocalStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("local-storage-change"));
  }
}
