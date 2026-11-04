import { useState, useMemo } from "react";

export interface PaginationState {
  /** Halaman saat ini (1-based) */
  currentPage: number;
  /** Jumlah item per halaman */
  pageSize: number;
  /** Total jumlah item */
  totalItems: number;
}

export interface PaginationControls extends PaginationState {
  /** Total halaman */
  totalPages: number;
  /** Apakah ada halaman sebelumnya */
  hasPrevious: boolean;
  /** Apakah ada halaman berikutnya */
  hasNext: boolean;
  /** Pindah ke halaman tertentu */
  goToPage: (page: number) => void;
  /** Pindah ke halaman berikutnya */
  nextPage: () => void;
  /** Pindah ke halaman sebelumnya */
  previousPage: () => void;
  /** Ubah jumlah item per halaman */
  setPageSize: (size: number) => void;
  /** Index awal item di halaman ini (0-based, untuk slice) */
  startIndex: number;
  /** Index akhir item di halaman ini (0-based, untuk slice) */
  endIndex: number;
  /** Nomor item pertama di halaman ini (1-based, untuk display) */
  startItem: number;
  /** Nomor item terakhir di halaman ini (1-based, untuk display) */
  endItem: number;
}

/**
 * Hook untuk mengelola state pagination dengan kontrol lengkap.
 * 
 * @param totalItems - Total jumlah item yang akan dipaginasi
 * @param initialPageSize - Jumlah item per halaman awal (default: 10)
 * @returns Controls untuk pagination
 * 
 * @example
 * const pagination = usePagination(data.length, 20);
 * const paginatedData = data.slice(pagination.startIndex, pagination.endIndex);
 */
export function usePagination(
  totalItems: number,
  initialPageSize: number = 10
): PaginationControls {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-adjust jika currentPage melebihi totalPages
  const safePage = Math.min(currentPage, totalPages);

  const controls = useMemo<PaginationControls>(() => {
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    return {
      currentPage: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasPrevious: safePage > 1,
      hasNext: safePage < totalPages,
      startIndex,
      endIndex,
      startItem: totalItems === 0 ? 0 : startIndex + 1,
      endItem: endIndex,
      goToPage: (page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
      },
      nextPage: () => {
        if (safePage < totalPages) {
          setCurrentPage(safePage + 1);
        }
      },
      previousPage: () => {
        if (safePage > 1) {
          setCurrentPage(safePage - 1);
        }
      },
      setPageSize: (size: number) => {
        setPageSize(size);
        setCurrentPage(1); // Reset ke halaman pertama saat ubah page size
      },
    };
  }, [safePage, pageSize, totalItems, totalPages]);

  return controls;
}
