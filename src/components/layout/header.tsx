"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notifikasiList } from "@/components/shared/mock-data";
import { roleLabels } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";
import { useEffect, useState } from "react";
import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
  role?: UserRole;
}

/**
 * Generate inisial dari nama user
 * Contoh: "Mahmud Afandi" -> "MA"
 *          "Medline" -> "ME"
 */
function getInitials(name: string): string {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
}

export function Header({ onMenuClick, role }: HeaderProps) {
  const unreadCount = notifikasiList.filter((n) => !n.dibaca).length;
  const displayRole = role ? roleLabels[role] : null;

  // Baca nama user dari localStorage
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userNama") || localStorage.getItem("userName") || "";
      setUserName(storedName);
    }
  }, []);

  // Gunakan nama dari localStorage atau fallback
  const displayName = userName || "User";
  const displayInitials = getInitials(displayName);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shrink-0">
      {/* Left: hamburger for mobile */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search — visible on sm+ */}
        <div className="hidden sm:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aset, tiket..."
              className="w-64 h-9 pl-9 pr-4 rounded-full bg-slate-100 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white border border-transparent focus:border-primary/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          )}
        </Button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        {/* Profile - Nama dinamis dari localStorage, bisa klik ke halaman profile */}
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-slate-100"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-light text-primary text-xs font-semibold">
              {displayInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500">
              {displayRole || "Kepala Kantor"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}