"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notifikasiList } from "@/components/shared/mock-data";
import { roleLabels } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

interface HeaderProps {
  onMenuClick?: () => void;
  role?: UserRole;
}

export function Header({ onMenuClick, role }: HeaderProps) {
  const unreadCount = notifikasiList.filter((n) => !n.dibaca).length;
  const displayRole = role ? roleLabels[role] : null;

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

        {/* Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-light text-primary text-xs font-semibold">
              AR
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800">Ansaruddin</p>
            <p className="text-xs text-slate-500">
              {displayRole || "Kepala Kantor"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
