import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** Halaman saat ini (1-based) */
  currentPage: number;
  /** Total halaman */
  totalPages: number;
  /** Total item */
  totalItems: number;
  /** Jumlah item per halaman */
  pageSize: number;
  /** Nomor item pertama yang ditampilkan */
  startItem: number;
  /** Nomor item terakhir yang ditampilkan */
  endItem: number;
  /** Apakah ada halaman sebelumnya */
  hasPrevious: boolean;
  /** Apakah ada halaman berikutnya */
  hasNext: boolean;
  /** Handler untuk pindah halaman */
  onPageChange: (page: number) => void;
  /** Handler untuk ubah page size */
  onPageSizeChange: (size: number) => void;
  /** Opsi page size yang tersedia */
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Komponen pagination lengkap dengan kontrol navigasi dan page size selector.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startItem,
  endItem,
  hasPrevious,
  hasNext,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  // Generate page numbers untuk ditampilkan
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maksimal angka halaman yang ditampilkan

    if (totalPages <= maxVisible) {
      // Tampilkan semua halaman jika sedikit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Tampilkan dengan ellipsis jika banyak
      if (currentPage <= 3) {
        // Di awal: 1 2 3 4 ... 10
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Di akhir: 1 ... 7 8 9 10
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Di tengah: 1 ... 4 5 6 ... 10
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {/* Info: Menampilkan X-Y dari Z item */}
      <div className="text-sm text-slate-600">
        Menampilkan <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> dari{" "}
        <span className="font-medium">{totalItems}</span> item
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 whitespace-nowrap">Item per halaman:</span>
          <Select
            value={pageSize.toString()}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="w-20"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevious}
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevious}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "primary" : "outline"}
                  size="icon-sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "min-w-[2rem]",
                    isActive && "pointer-events-none"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Mobile: current page indicator */}
          <div className="flex sm:hidden items-center px-3 text-sm text-slate-600">
            <span className="font-medium">{currentPage}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext}
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
