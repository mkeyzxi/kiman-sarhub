"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, ClipboardCheck, User, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const navItems = [
  { href: "/mobile/dashboard", label: "Beranda", icon: Home },
  { href: "/mobile/scan", label: "Scan", icon: QrCode },
  { href: "/mobile/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/mobile/profil", label: "Profil", icon: User },
];

export function MobileTopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:border-r md:border-slate-200 md:z-50">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <LifeBuoy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800">Siap SAR</h1>
          <p className="text-xs text-slate-500">Kantor P3KB Mamuju</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src="/avatars/medlyn.png"
            fallback="Medlyn R. Pagali"
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              Medlyn R. Pagali
            </p>
            <p className="text-xs text-slate-500">Rescuer</p>
          </div>
        </div>
      </div>
    </header>
  );
}
