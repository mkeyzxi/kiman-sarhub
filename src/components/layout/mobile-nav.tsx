"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { href: "/operator", label: "Beranda", icon: LayoutDashboard },
  { href: "/operator/logbook", label: "Logbook", icon: FileText },
  { href: "/operator/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/bmn", label: "Aset", icon: Package },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const isActive =
            item.href === "/operator"
              ? pathname === "/operator"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
