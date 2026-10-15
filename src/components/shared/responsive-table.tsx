"use client";

import * as React from "react";
import { ChevronRight, X } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Definisi satu kolom tabel sekaligus satu baris data pada kartu mobile. */
export interface ResponsiveField<T> {
  /** Kunci unik kolom. */
  key: string;
  /** Label kolom pada tabel desktop & label baris pada detail. */
  header: string;
  /** Isi sel (desktop) dan nilai pada detail (mobile). */
  render: (row: T) => React.ReactNode;
  /** Kelas tambahan untuk `<TableHead>`. */
  headClassName?: string;
  /** Kelas tambahan untuk `<TableCell>`. */
  cellClassName?: string;
  /** Sembunyikan kolom di layar medium agar tabel tidak terlalu lebar. */
  hideBelowLg?: boolean;
  /** Sembunyikan kolom di laptop kecil (1024–1279px) agar tabel tidak perlu digeser. */
  hideBelowXl?: boolean;
  /** Jangan tampilkan field ini di kartu ringkasan mobile. */
  hideOnCard?: boolean;
}

export interface ResponsiveTableProps<T> {
  /** Baris data. */
  data: readonly T[];
  /** Konfigurasi kolom. */
  fields: ResponsiveField<T>[];
  /** Key unik untuk setiap baris. */
  getKey: (row: T) => string | number;
  /** Judul kartu pada mobile — biasanya kolom paling penting. */
  cardTitle: (row: T) => React.ReactNode;
  /** Subjudul opsional pada kartu mobile. */
  cardSubtitle?: (row: T) => React.ReactNode;
  /** Badge ringkas di kanan atas kartu mobile. */
  cardBadge?: (row: T) => React.ReactNode;
  /** Jumlah field yang diringkas pada kartu mobile. Default 3. */
  cardPreviewCount?: number;
  /** Judul panel detail. Default: nilai `cardTitle`. */
  detailTitle?: (row: T) => React.ReactNode;
  /** Label tombol di mobile, mis. "Lihat detail". */
  detailLabel?: string;
  /** Pesan saat `data` kosong. */
  emptyMessage?: string;
  className?: string;
}

/**
 * Tabel yang otomatis berubah menjadi kartu pada layar kecil.
 *
 * - `xl` ke atas  : tabel lengkap.
 * - `lg`          : tabel dengan kolom `hideBelowLg` disembunyikan.
 * - `< lg`        : kartu; menekan kartu membuka panel detail.
 *
 * Tabel sengaja hanya tampil di `lg` ke atas supaya ponsel dan tablet
 * tidak pernah perlu digeser ke samping.
 */
export function ResponsiveTable<T>({
  data,
  fields,
  getKey,
  cardTitle,
  cardSubtitle,
  cardBadge,
  cardPreviewCount = 3,
  detailTitle,
  detailLabel = "Lihat detail",
  emptyMessage = "Belum ada data.",
  className,
}: ResponsiveTableProps<T>) {
  const [selected, setSelected] = React.useState<T | null>(null);

  // Tutup panel detail dengan tombol Escape.
  React.useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  // Kunci scroll body selagi panel detail terbuka.
  React.useEffect(() => {
    if (selected === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  const previewFields = fields.filter((f) => !f.hideOnCard).slice(0, cardPreviewCount);

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={className}>
      {/* ── Desktop: tabel (hanya di layar besar, agar tidak perlu digeser) ── */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {fields.map((field) => (
                <TableHead
                  key={field.key}
                  className={cn(
                    field.hideBelowLg && "hidden lg:table-cell",
                    field.hideBelowXl && "hidden xl:table-cell",
                    field.headClassName
                  )}
                >
                  {field.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={getKey(row)}>
                {fields.map((field) => (
                  <TableCell
                    key={field.key}
                    className={cn(
                      field.hideBelowLg && "hidden lg:table-cell",
                      field.hideBelowXl && "hidden xl:table-cell",
                      field.cellClassName
                    )}
                  >
                    {field.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile & tablet: daftar kartu ──────────────────────────────── */}
      <ul className="space-y-3 lg:hidden">
        {data.map((row) => (
          <li key={getKey(row)} className="relative">
            <div
              className={cn(
                "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors",
                "hover:border-primary/40 hover:bg-slate-50 active:bg-slate-100",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {cardTitle(row)}
                  </p>
                  {cardSubtitle && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {cardSubtitle(row)}
                    </p>
                  )}
                </div>
                {cardBadge && <div className="shrink-0">{cardBadge(row)}</div>}
              </div>

              {previewFields.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  {previewFields.map((field) => (
                    <div key={field.key} className="min-w-0">
                      <dt className="truncate text-[11px] uppercase tracking-wide text-slate-400">
                        {field.header}
                      </dt>
                      <dd className="truncate text-sm font-medium text-slate-700">
                        {field.render(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                {detailLabel}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </p>
            </div>

            {/* Lapisan tombol transparan: seluruh kartu bisa ditekan. */}
            <button
              type="button"
              onClick={() => setSelected(row)}
              className="absolute inset-0 rounded-xl focus-visible:outline-none"
            >
              <span className="sr-only">
                {detailLabel}: {cardTitle(row)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* ── Panel detail (mobile) ────────────────────────────────────────── */}
      {selected !== null && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Tutup detail"
            onClick={() => setSelected(null)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detail informasi"
            className={cn(
              "relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl",
              "animate-in slide-in-from-bottom-4 fade-in"
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-800">
                  {detailTitle ? detailTitle(selected) : cardTitle(selected)}
                </p>
                {cardSubtitle && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {cardSubtitle(selected)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Tutup"
                className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <dl className="divide-y divide-slate-100">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4"
                  >
                    <dt className="text-xs uppercase tracking-wide text-slate-500 sm:pt-0.5">
                      {field.header}
                    </dt>
                    <dd className="text-sm font-medium break-words text-slate-800">
                      {field.render(selected)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResponsiveTable;