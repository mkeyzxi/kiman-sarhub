"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountStatusGuard } from "@/components/layout/account-status-guard";
import { canAccessPath, getDefaultPageForRole } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Simpan role dari localStorage ke ref (hindari setState langsung di effect)
  const storedRoleRef = useRef<UserRole | null>(null);

  // Load role from localStorage ke ref
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as UserRole | null;
    if (!storedRole) {
      router.replace("/login");
      return;
    }
    storedRoleRef.current = storedRole;
  }, [router]);

  // Sinkronisasi ref ke state (effect dengan dependency kosong — jalan sekali)
  useEffect(() => {
    if (storedRoleRef.current) {
      setRole(storedRoleRef.current);
    }
  }, []);

  // Route protection — redirect ke 403 jika tidak punya akses
  useEffect(() => {
    if (!role) return;
    if (!canAccessPath(role, pathname)) {
      router.replace("/403");
    }
  }, [role, pathname, router]);

  // Redirect ke default page jika mengakses root dashboard
  useEffect(() => {
    if (!role) return;
    if (pathname === "/dashboard" || pathname === "/") {
      router.replace(getDefaultPageForRole(role));
    }
  }, [role, pathname, router]);

  // Tampilkan loading saat role belum dimuat
  if (!role) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-x-clip">
      {/* Guard: pastikan akun masih aktif (jika dinonaktifkan, logout otomatis) */}
      <AccountStatusGuard />

      {/* Sidebar — desktop: fixed left | mobile: drawer overlay */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

      {/* Main wrapper — offset oleh lebar sidebar di desktop.
          `min-w-0` WAJIB: sebagai flex item, default `min-width: auto`
          membuatnya tidak mau menyempit di bawah lebar min-content
          elemen di dalamnya. Tanpa itu, konten lebar memaksa halaman
          ikut melebar dan bisa digeser ke samping. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:pl-64">
        {/* Header — hamburger menu terhubung ke sidebar drawer */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          role={role}
        />

        {/* Konten halaman — hanya area ini yang scroll.
            `min-w-0` + `overflow-x-clip` menjaga agar tidak ada
            elemen yang membuat halaman bisa digeser ke samping. */}
        <main className="flex-1 overflow-y-auto overflow-x-clip min-w-0 bg-slate-50 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — hanya tampil di layar kecil */}
      <MobileNav role={role} />
    </div>
  );
}
