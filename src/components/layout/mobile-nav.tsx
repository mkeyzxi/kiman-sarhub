"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMobileNavItems } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

// Baca posisi scroll saat ini: dari elemen <main> jika ada, jika tidak dari window.
function readScrollTop(el: HTMLElement | null): number {
  return el ? el.scrollTop : window.scrollY;
}

export function MobileNav({ role }: { role?: UserRole }) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const effectiveRole: UserRole =
    role ||
    (typeof localStorage !== "undefined"
      ? (localStorage.getItem("userRole") as UserRole)
      : null) ||
    "OPERATOR_LAPANGAN";

  const items = getMobileNavItems(effectiveRole);

  useEffect(() => {
    // <main> di layout dashboard yang jadi area scroll, bukan window
    const container: HTMLElement | null =
      typeof document === "undefined"
        ? null
        : document.querySelector<HTMLElement>("main");
    const target: HTMLElement | Window = container ?? window;

    lastScrollTopRef.current = readScrollTop(container);

    const handleScroll = () => {
      const current = readScrollTop(container);
      const last = lastScrollTopRef.current;

      // Scroll ke bawah -> sembunyikan, scroll ke atas -> tampilkan
      if (current > last && current > 40) {
        setIsVisible(false);
      } else if (current < last) {
        setIsVisible(true);
      }

      lastScrollTopRef.current = current;

      // Berhenti scrolling -> tampilkan lagi
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 200);
    };

    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [pathname]);

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg rounded-tr-2xl rounded-tl-2xl safe-area-bottom",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
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
                "relative flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              {isActive && (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full " />
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