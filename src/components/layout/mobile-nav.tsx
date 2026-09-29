"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, ClipboardCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/mobile/dashboard", label: "Beranda", icon: Home },
  { href: "/mobile/scan", label: "Scan", icon: QrCode },
  { href: "/mobile/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/mobile/profil", label: "Profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[64px] transition-colors",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
