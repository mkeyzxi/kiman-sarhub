"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Komponen kecil untuk state data di halaman master data:
 * - `<DataLoading />` skeleton saat loading
 * - `<DataError />` kartu error + tombol coba lagi (TANPA fallback mock)
 *
 * Pola pemakaian di halaman (hooks SEMUA dipanggil seragam di awal):
 *   const { data, loading, error, refetch } = useAsets();
 *   if (loading) return <DataLoading label="Memuat master aset…" />;
 *   if (error) return <DataError error={error} onRetry={refetch} />;
 */

export function DataLoading({
  label = "Memuat data…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-16 text-center",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function DataError({
  error,
  onRetry,
  label = "Gagal memuat data dari database",
  className,
}: {
  error: string | null;
  onRetry?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 py-12 text-center",
        className
      )}
      role="alert"
    >
      <AlertTriangle className="h-8 w-8 text-red-400" />
      <div>
        <p className="text-sm font-semibold text-red-800">{label}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function DataEmpty({
  message = "Belum ada data.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500",
        className
      )}
    >
      {message}
    </div>
  );
}
