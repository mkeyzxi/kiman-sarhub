"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  QrCode,
  FileText,
  Settings,
  LogOut,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/dashboard/bmn", label: "Master Data BMN", icon: <Package className="h-5 w-5" /> },
      { href: "/dashboard/ews", label: "EWS Maintenance", icon: <AlertTriangle className="h-5 w-5" />, badge: 3 },
      { href: "/dashboard/verifikasi", label: "Verifikasi", icon: <ShieldCheck className="h-5 w-5" />, badge: 2 },
    ],
  },
  {
    title: "Eksekutif",
    items: [
      { href: "/dashboard/executive", label: "Live Monitoring", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/dashboard/executive/audit", label: "Audit Kepatuhan", icon: <ClipboardCheck className="h-5 w-5" /> },
      { href: "/dashboard/executive/approval", label: "Approval BMN", icon: <FileText className="h-5 w-5" /> },
    ],
  },
  {
    title: "Mobile PWA",
    items: [
      { href: "/mobile/dashboard", label: "Dashboard Mobile", icon: <QrCode className="h-5 w-5" /> },
      { href: "/mobile/scan", label: "Scan Aset", icon: <QrCode className="h-5 w-5" /> },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/dashboard/pengaturan", label: "Pengaturan", icon: <Settings className="h-5 w-5" /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200">
      {/* Header Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <LifeBuoy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800">Siap SAR</h1>
          <p className="text-xs text-slate-500">Kantor P3KB Mamuju</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sidebarGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary-light text-primary"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <span className={cn(isActive ? "text-primary" : "text-slate-400")}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400" />
          <span>Keluar</span>
        </Link>
      </div>
    </aside>
  );
}
