// =============================================================================
// Konfigurasi Navigasi Terpusat - Dashboard Siap SAR
// Single source of truth untuk navigasi berdasarkan role
// =============================================================================

import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Settings,
  BarChart3,
  Users,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/components/shared/mock-data";

// Re-export UserRole agar modul lain bisa import langsung dari navigation.ts
export type { UserRole };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// ─── Role Labels (user-friendly) ─────────────────────────────────────────────

export const roleLabels: Record<UserRole, string> = {
  ADMIN_IT: "Admin IT",
  PENGELOLA_BMN: "Pengelola BMN",
  KAKANSAR: "Kepala Kantor",
  OPERATOR_LAPANGAN: "Operator Lapangan",
};

export const roleDescriptions: Record<UserRole, string> = {
  ADMIN_IT: "Akses penuh ke seluruh modul sistem",
  PENGELOLA_BMN: "Pengelolaan aset, maintenance, dan monitoring",
  KAKANSAR: "Monitoring kesiapsiagaan dan laporan",
  OPERATOR_LAPANGAN: "Operasional lapangan dan checklist kesiapan",
};

// ─── Navigasi per Role ───────────────────────────────────────────────────────

export const navGroupsByRole: Record<UserRole, NavGroup[]> = {
  ADMIN_IT: [
    {
      title: "Operasional",
      items: [
        { href: "/operator", label: "Dashboard Operasional", icon: LayoutDashboard },
        { href: "/operator/logbook", label: "Logbook Perjalanan", icon: FileText },
        { href: "/operator/checklist", label: "Checklist Perawatan", icon: ClipboardCheck },
      ],
    },
    {
      title: "Aset & Maintenance",
      items: [
        { href: "/bmn", label: "Master Data BMN", icon: Package },
        { href: "/bmn/maintenance", label: "Tiket Maintenance", icon: AlertTriangle, badge: 3 },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { href: "/pimpinan", label: "Dashboard Pimpinan", icon: LayoutDashboard },
        { href: "/pimpinan/laporan", label: "Laporan & Analisis", icon: BarChart3 },
        { href: "/pimpinan/audit", label: "Audit Kepatuhan", icon: ClipboardList },
        { href: "/pimpinan/approval", label: "Persetujuan", icon: CheckCircle2 },
      ],
    },
    {
      title: "Sistem",
      items: [
        { href: "/admin", label: "Dashboard Admin", icon: LayoutDashboard },
        { href: "/admin/pengguna", label: "Kelola Pengguna", icon: Users },
        { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
      ],
    },
  ],
  PENGELOLA_BMN: [
    {
      title: "Aset & Maintenance",
      items: [
        { href: "/bmn", label: "Master Data BMN", icon: Package },
        { href: "/bmn/maintenance", label: "Tiket Maintenance", icon: AlertTriangle, badge: 3 },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { href: "/pimpinan", label: "Dashboard Pimpinan", icon: LayoutDashboard },
        { href: "/pimpinan/laporan", label: "Laporan & Analisis", icon: BarChart3 },
        { href: "/pimpinan/audit", label: "Audit Kepatuhan", icon: ClipboardList },
        { href: "/pimpinan/approval", label: "Persetujuan", icon: CheckCircle2 },
      ],
    },
  ],
  KAKANSAR: [
    {
      title: "Monitoring",
      items: [
        { href: "/pimpinan", label: "Dashboard Pimpinan", icon: LayoutDashboard },
        { href: "/pimpinan/laporan", label: "Laporan & Analisis", icon: BarChart3 },
        { href: "/pimpinan/audit", label: "Audit Kepatuhan", icon: ClipboardList },
        { href: "/pimpinan/approval", label: "Persetujuan", icon: CheckCircle2 },
      ],
    },
  ],
  OPERATOR_LAPANGAN: [
    {
      title: "Operasional",
      items: [
        { href: "/operator", label: "Dashboard Operasional", icon: LayoutDashboard },
        { href: "/operator/logbook", label: "Logbook Perjalanan", icon: FileText },
        { href: "/operator/checklist", label: "Checklist Perawatan", icon: ClipboardCheck },
      ],
    },
  ],
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Mendapatkan semua href yang dapat diakses oleh role tertentu
 */
export function getAccessibleHrefs(role: UserRole): string[] {
  return navGroupsByRole[role].flatMap((group) =>
    group.items.map((item) => item.href)
  );
}

/**
 * Mengecek apakah role tertentu dapat mengakses path tertentu
 */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  // Semua role bisa akses halaman profile
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return true;
  }
  const accessibleHrefs = getAccessibleHrefs(role);
  return accessibleHrefs.some(
    (href) => pathname === href || pathname.startsWith(href + "/")
  );
}

/**
 * Mendapatkan halaman default (landing) untuk role tertentu
 */
export function getDefaultPageForRole(role: UserRole): string {
  return navGroupsByRole[role][0]?.items[0]?.href || "/operator";
}

/**
 * Mendapatkan item navigasi aktif berdasarkan pathname
 */
export function getActiveNavItem(role: UserRole, pathname: string): NavItem | null {
  for (const group of navGroupsByRole[role]) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Mendapatkan maksimal 4 item untuk mobile bottom nav
 * Prioritas: item pertama dari setiap grup
 */
export function getMobileNavItems(role: UserRole): NavItem[] {
  const groups = navGroupsByRole[role];
  const items: NavItem[] = [];

  // Ambil item pertama dari setiap grup (maksimal 4)
  for (const group of groups) {
    if (group.items.length > 0 && items.length < 4) {
      items.push(group.items[0]);
    }
  }

  return items;
}
