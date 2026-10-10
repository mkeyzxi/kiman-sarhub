"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex">
      {/* Sidebar — desktop: fixed left | mobile: drawer overlay */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main wrapper — offset oleh lebar sidebar di desktop */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-0">
        {/* Header — hamburger menu terhubung ke sidebar drawer */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Konten halaman — hanya area ini yang scroll */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — hanya tampil di layar kecil */}
      <MobileNav />
    </div>
  );
}
