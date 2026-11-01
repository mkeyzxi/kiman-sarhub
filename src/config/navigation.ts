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
  FileSignature,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/components/shared/mock-data";
import { normalizeNip } from "@/lib/auth-identity";

// Re-export UserRole agar modul lain bisa import langsung dari navigation.ts
export type { UserRole };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Key untuk badge dinamis dari BadgeProvider. */
  badgeKey?: "maintenance" | "beritaAcara";
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// ─── Pembatasan Menu Tiket Maintenance (Per-Pengguna, berdasarkan NIP) ───────

/**
 * NIP tunggal yang berwenang mengakses menu Tiket Maintenance —
 * termasuk menerbitkan tiket baru lewat "Buat Tiket".
 *
 * Kebutuhan proyek: hanya pengelola BMN ZULKIFLI S.I.P. (NIP di bawah)
 * yang boleh membuka /bmn/maintenance dan form penerbitan tiket.
 * Menu disembunyikan dan aksesnya ditolak untuk NIP lain, termasuk Admin IT.
 *
 * Semua NIP terdaftar di daftar di bawah — tambahkan NIP baru ke daftar
 * bila kelak ada petugas tambahan yang diberi wewenang.
 */
export const NIP_PENGELOLA_TIKET_MAINTENANCE: readonly string[] = [
  "19850331200812100",
];

/** Cek apakah NIP tertentu boleh membuka menu Tiket Maintenance. */
export function canAccessTiketMaintenance(
  nip: string | null | undefined
): boolean {
  if (!nip) return false;
  return NIP_PENGELOLA_TIKET_MAINTENANCE.includes(normalizeNip(nip));
}

/**
 * Saring grup navigasi berdasarkan NIP: item yang tidak boleh diakses
 * oleh NIP tertentu (mis. "Tiket Maintenance") disembunyikan.
 */
export function filterNavGroupsForNip(
  groups: NavGroup[],
  nip: string | null | undefined
): NavGroup[] {
  if (canAccessTiketMaintenance(nip)) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.href !== "/bmn/maintenance"
      ),
    }))
    .filter((group) => group.items.length > 0);
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
        { href: "/bmn/berita-acara", label: "Berita Acara", icon: FileSignature },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { href: "/pimpinan", label: "Dashboard Pimpinan", icon: LayoutDashboard },
        { href: "/pimpinan/laporan", label: "Laporan & Analisis", icon: BarChart3 },
        { href: "/pimpinan/audit", label: "Audit Kepatuhan", icon: ClipboardList },
        { href: "/pimpinan/berita-acara", label: "Berita Acara", icon: FileSignature },
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
        { href: "/bmn/berita-acara", label: "Berita Acara", icon: FileSignature },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { href: "/pimpinan", label: "Dashboard Pimpinan", icon: LayoutDashboard },
        { href: "/pimpinan/laporan", label: "Laporan & Analisis", icon: BarChart3 },
        { href: "/pimpinan/audit", label: "Audit Kepatuhan", icon: ClipboardList },
        { href: "/pimpinan/berita-acara", label: "Berita Acara", icon: FileSignature },
      ],
    },
  ],
  KAKANSAR: [
    {
      title: "Monitoring",
      items: [
        { href: "/pimpinan", label: "Dashboard Pimpinan", icon: LayoutDashboard },
        { href: "/pimpinan/berita-acara", label: "Berita Acara", icon: FileSignature },
        { href: "/pimpinan/laporan", label: "Laporan & Analisis", icon: BarChart3 },
        { href: "/pimpinan/audit", label: "Audit Kepatuhan", icon: ClipboardList },
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
 *
 * @param nip NIP user login (opsional, dari localStorage) — dipakai untuk
 *   pembatasan per-pengguna di luar pembatasan per-role.
 */
export function canAccessPath(
  role: UserRole,
  pathname: string,
  nip?: string | null
): boolean {
  // Semua role bisa akses halaman profile
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return true;
  }
  // Menu Tiket Maintenance + form penerbitan tiket hanya untuk NIP yang
  // ditunjuk (lihat NIP_PENGELOLA_TIKET_MAINTENANCE) — melampaui
  // pembatasan role biasa, jadi diperiksa lebih dulu. Halaman DETAIL
  // (/bmn/maintenance/<id>) tetap mengikuti aturan per-role di bawah,
  // termasuk akses operator pada tiket yang diarahkan ke mereka.
  if (
    pathname === "/bmn/maintenance" ||
    pathname.startsWith("/bmn/maintenance/buat")
  ) {
    return canAccessTiketMaintenance(nip);
  }
  const accessibleHrefs = getAccessibleHrefs(role);
  // Operator lapangan adalah penanggung jawab kendaraan: mereka perlu
  // membuka detail tiket maintenance yang diarahkan ke mereka (dan RLS
  // menjamin hanya update tiket milik sendiri). Guard per-role di atas
  // tidak mengenal relasi user↔aset, jadi beri akses terbatas ini.
  if (role === "OPERATOR_LAPANGAN") {
    if (
      pathname.startsWith("/bmn/maintenance") &&
      pathname !== "/bmn/maintenance/buat"
    ) {
      return true;
    }
    // Baca kartu BA milik operator (pengaju) — halaman BA tidak boleh
    // dikelola, hanya dilihat.
    if (pathname.startsWith("/operator/checklist/")) {
      return true;
    }
  }
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
