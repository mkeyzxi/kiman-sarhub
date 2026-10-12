"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMobileNavItems } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

export function MobileNav({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const effectiveRole: UserRole =
    role ||
    (typeof localStorage !== "undefined"
      ? (localStorage.getItem("userRole") as UserRole)
      : null) ||
    "OPERATOR_LAPANGAN";

  const items = getMobileNavItems(effectiveRole);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors relative",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
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
