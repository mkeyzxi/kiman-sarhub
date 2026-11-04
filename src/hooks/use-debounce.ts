import { useEffect, useState } from "react";

/**
 * Hook untuk debounce nilai input.
 * Menunda update nilai sampai user berhenti mengetik selama `delay` ms.
 * 
 * @param value - Nilai yang akan di-debounce
 * @param delay - Waktu tunggu dalam milidetik (default: 500ms)
 * @returns Nilai yang sudah di-debounce
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * // debouncedSearch hanya update 500ms setelah user berhenti mengetik
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout untuk update nilai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: batalkan timeout jika value berubah sebelum delay selesai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
