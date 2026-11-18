"use client";

import * as React from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Kontrol sorting yang konsisten di seluruh dashboard (tabel dengan filter).
 *
 * Desain: satu chip trigger yang menampilkan ikon + label kolom yang sedang
 * diurutkan; klik membuka panel (menu dropdown ringan) berisi daftar kolom
 * dan dua tombol arah (Terbaru/Terlama atau Ascending/Descending). Panel
 * tertutup otomatis saat klik di luar — pola yang sama dengan
 * `DropdownMenu` yang sudah dipakai di halaman laporan.
 *
 * Dipakai di: /operator/logbook, /operator/checklist, /bmn,
 * /bmn/maintenance, /bmn/berita-acara, /pimpinan, /admin/pengguna —
 * supaya tampilan sorting seragam di semua halaman.
 */

export interface SortOption {
  /** Nilai `sortBy` (diidentifikasi lewat prop, dipakai di onChange). */
  value: string;
  /** Label kolom yang tampil di UI. */
  label: string;
}

export interface SortControlProps {
  /** Daftar kolom yang bisa diurutkan (mis. [{value:"tanggal",label:"Tanggal"}]). */
  options: SortOption[];
  /** Kolom yang sedang dipilih. */
  sortBy: string;
  /** Arah sorting aktif: "asc" | "desc". */
  sortDir: "asc" | "desc";
  /** Dipanggil saat pilihan kolom / arah berubah. */
  onChange: (next: { sortBy: string; sortDir: "asc" | "desc" }) => void;
  /**
   * Label dua opsi arah. Default "Terbaru"/"Terlama" — sesuaikan untuk
   * halaman yang memang semantik Asc/Desc lebih tepat (mis. nama/role).
   */
  dirLabels?: [string, string]; // [desc, asc]
  /** Label kecil di atas panel bila perlu. */
  ariaLabel?: string;
  /** Kelas tambahan (mis. lebar di mobile). */
  className?: string;
}

/** Ikon kecil yang menandai arah sort aktif. */
function DirIndicator({ dir, active }: { dir: "asc" | "desc"; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
      )}
      title={active ? "Aktif" : undefined}
    >
      {dir === "desc" ? "↓" : "↑"}
    </span>
  );
}

export function SortControl({
  options,
  sortBy,
  sortDir,
  onChange,
  dirLabels = ["Terbaru", "Terlama"],
  ariaLabel,
  className,
}: SortControlProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar / tekan Escape.
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  const aktifLabel = options.find((o) => o.value === sortBy)?.label ?? sortBy;

  const pilihKolom = (value: string) => {
    onChange({ sortBy: value, sortDir });
    // Jangan tutup panel: user biasanya memilih kolom lalu memilih arah.
  };

  const pilihArah = (dir: "asc" | "desc") => {
    onChange({ sortBy, sortDir: dir });
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex items-center gap-2", className)}
    >
      {/* Trigger — satu chip kompak yang mewakili seluruh kontrol sort */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel ?? "Atur pengurutan data"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
          open
            ? "border-primary ring-2 ring-primary/30 text-slate-900"
            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <ArrowUpDown className="h-4 w-4 text-slate-400" />
        <span className="max-w-[8rem] truncate">{aktifLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Panel dropdown: kolom + arah */}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg",
            "right-0"
          )}
        >
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Urutkan berdasarkan
          </p>
          <div className="flex flex-col">
            {options.map((o) => {
              const aktif = o.value === sortBy;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={aktif}
                  onClick={() => pilihKolom(o.value)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors",
                    "hover:bg-slate-100 focus:bg-slate-100 focus:outline-none",
                    aktif ? "font-medium text-slate-900" : "text-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      aktif
                        ? "border-primary bg-primary text-white"
                        : "border-slate-300 text-transparent"
                    )}
                  >
                    {aktif && "•"}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Arah
            </p>
            <div className="flex gap-1.5 px-3 pb-1.5">
              <button
                type="button"
                onClick={() => pilihArah("desc")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  sortDir === "desc"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <DirIndicator dir="desc" active={sortDir === "desc"} />
                {dirLabels[0]}
              </button>
              <button
                type="button"
                onClick={() => pilihArah("asc")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  sortDir === "asc"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <DirIndicator dir="asc" active={sortDir === "asc"} />
                {dirLabels[1]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
