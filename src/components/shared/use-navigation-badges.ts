/**
 * Hook untuk badge dinamis di sidebar navigation.
 * 
 * Badge dihitung dari data nyata database:
 * - Tiket Maintenance: jumlah tiket status "Menunggu" atau "Diproses"
 * - Berita Acara: jumlah BA status "Diserahkan" atau "Diproses" (menunggu aksi)
 */

import { useMemo } from "react";
import { useTicketsCombined } from "./ticket-store";
import { useBeritaAcara as useBeritaAcaraSupabase } from "./use-supabase-data";

export interface NavigationBadges {
  /** Badge Tiket Maintenance: tiket yang perlu diproses (Menunggu/Diproses). */
  maintenance: number;
  /** Badge Berita Acara: BA menunggu aksi BMN/KAKANSAR (Diserahkan/Diproses). */
  beritaAcara: number;
}

/**
 * Hitung badge navigation dari data nyata.
 * Panggil sekali di layout agar semua komponen dapat akses.
 */
export function useNavigationBadges(): NavigationBadges {
  const { data: tickets, loading: ticketLoading } = useTicketsCombined();
  const { data: beritaAcara, loading: baLoading } = useBeritaAcaraSupabase();

  const maintenance = useMemo(() => {
    if (ticketLoading) return 0;
    return tickets.filter(
      (t) => t.status === "Menunggu" || t.status === "Diproses"
    ).length;
  }, [tickets, ticketLoading]);

  const beritaAcaraBadge = useMemo(() => {
    if (baLoading) return 0;
    return beritaAcara.filter(
      (ba) => ba.status === "Diserahkan" || ba.status === "Diproses"
    ).length;
  }, [beritaAcara, baLoading]);

  return {
    maintenance,
    beritaAcara: beritaAcaraBadge,
  };
}
