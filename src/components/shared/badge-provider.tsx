"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useNavigationBadges, type NavigationBadges } from "./use-navigation-badges";

const BadgeContext = createContext<NavigationBadges>({
  maintenance: 0,
  beritaAcara: 0,
});

export function BadgeProvider({ children }: { children: ReactNode }) {
  const badges = useNavigationBadges();
  return <BadgeContext.Provider value={badges}>{children}</BadgeContext.Provider>;
}

/**
 * Hook untuk akses badge dinamis dari navigation.
 * Harus dipanggil di dalam <BadgeProvider>.
 */
export function useBadges(): NavigationBadges {
  return useContext(BadgeContext);
}
