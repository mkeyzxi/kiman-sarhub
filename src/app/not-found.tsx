"use client";

import Link from "next/link";
import { useState } from "react";

import {
  LayoutDashboard,
  FileText,
  Package,
  BarChart2,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  HelpCircle,
  Home,
  ShieldAlert,
} from "lucide-react";

export default function NotFound() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#FAFAFA] font-sans antialiased text-slate-600">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-full shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF6905] to-[#f98835] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/20">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-base leading-tight">ProcureHub</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Pengadaan</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 mt-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#EF6905] transition-all duration-300">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/pengajuan" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#EF6905] transition-all duration-300">
            <FileText className="w-5 h-5" />
            <span>Daftar Pengajuan</span>
          </Link>
          <Link href="/barang" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#EF6905] transition-all duration-300">
            <Package className="w-5 h-5" />
            <span>Katalog Barang</span>
          </Link>
          <Link href="/laporan" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#EF6905] transition-all duration-300">
            <BarChart2 className="w-5 h-5" />
            <span>Laporan & Analitik</span>
          </Link>
          <Link href="/pengaturan" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#EF6905] transition-all duration-300">
            <Settings className="w-5 h-5" />
            <span>Pengaturan</span>
          </Link>
        </div>

        <div className="p-4 mb-2 shrink-0">
          <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300">
            <LogOut className="w-5 h-5" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full z-10 shadow-2xl animate-in slide-in-from-left-64 duration-300">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EF6905] to-[#f98835] flex items-center justify-center text-white font-bold">P</div>
                <span className="font-bold text-slate-800">ProcureHub</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/pengajuan" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                <FileText className="w-5 h-5" />
                <span>Daftar Pengajuan</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* AREA KANAN */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 flex items-center justify-between shrink-0 z-20 relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-[#EF6905] rounded-full hover:bg-slate-50 transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative hidden sm:block w-80 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#EF6905] transition-colors" />
              <input
                type="text"
                placeholder="Cari pengajuan, barang, dokumen..."
                className="w-full bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 placeholder-slate-400 pl-11 pr-4 py-2.5 rounded-full border border-transparent focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button type="button" className="relative p-2 text-slate-400 hover:text-[#EF6905] rounded-full hover:bg-orange-50 transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#EF6905] rounded-full ring-2 ring-white" />
            </button>

            <div className="w-px h-6 bg-slate-200" />

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-[#EF6905] transition-colors">Ahmad Fauzi</span>
                <span className="text-xs text-slate-500">Staf Pengadaan</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 text-[#EF6905] font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-transparent group-hover:ring-orange-200 transition-all">
                AF
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT 404 (NO CONTAINER, DYNAMIC CANVAS) */}
        <main className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-6 z-0">
          
          {/* Latar Belakang Abstrak & Dekorasi Melayang */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-100/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-50" />

          {/* Ikon-ikon dekoratif yang tersebar */}
          <Package className="absolute top-[20%] left-[20%] w-12 h-12 text-orange-200 -rotate-12 animate-[bounce_4s_ease-in-out_infinite]" />
          <FileText className="absolute bottom-[25%] right-[25%] w-16 h-16 text-slate-200 rotate-12 animate-[bounce_5s_ease-in-out_infinite]" />
          <Search className="absolute top-[30%] right-[20%] w-10 h-10 text-orange-100 rotate-45 animate-[bounce_6s_ease-in-out_infinite]" />

          {/* Area Konten Inti - Bebas Tanpa Batas */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
            
            {/* Teks 404 Super Besar & Menyatu dengan background */}
            <div className="relative flex justify-center items-center w-full">
              <h1 className="text-[12rem] md:text-[18rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-200 to-slate-300/40 select-none drop-shadow-sm tracking-tighter">
                404
              </h1>
              
              {/* Box Ikon Melayang di Tengah Angka 404 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-tr from-[#EF6905] to-[#ff8c33] rounded-3xl md:rounded-[2rem] rotate-12 flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-[bounce_3s_ease-in-out_infinite]">
                  <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-white -rotate-12" />
                </div>
              </div>
            </div>

            {/* Tipografi & Pesan */}
            <div className="-mt-8 md:-mt-16 mb-10 z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight drop-shadow-sm">
                Kehilangan Jejak?
              </h2>
              <p className="text-base md:text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                Halaman atau dokumen pengadaan yang Anda cari sepertinya tidak ada di sistem kami, atau mungkin sudah dipindahkan.
              </p>
            </div>

            {/* Tombol Aksi Melayang */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#EF6905] hover:bg-[#d45d04] text-white text-base font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
              >
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Kembali ke Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/80 backdrop-blur-md border-2 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600 text-base font-semibold transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Kembali</span>
              </button>
            </div>

            {/* Bantuan */}
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-slate-400">
              <HelpCircle className="w-4 h-4" />
              <span>
                Butuh bantuan sistem? {" "}
                <a href="/bantuan" className="text-[#EF6905] hover:text-[#d45d04] font-semibold transition-colors">
                  Hubungi Admin
                </a>
              </span>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}