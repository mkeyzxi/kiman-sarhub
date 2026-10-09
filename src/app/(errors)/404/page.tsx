'use client'
import Link from 'next/link'
import {useState} from 'react'
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
} from 'lucide-react'
export default function NotFound() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 font-sans antialiased text-slate-600">
      {/* ------------------------------------------------------------------- */}
      {/* 1. SIDEBAR (MENI NAVIGASI KIRI) - Desktop & Tablet                  */}
      {/* ------------------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shrink-0 z-20">
        {/* Header Logo */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EF6905] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-base leading-tight">ProcureHub</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Pengadaan Barang
              </span>
            </div>
          </div>
        </div>

        {/* Daftar Menu Navigasi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 text-slate-400" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/pengajuan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <FileText className="w-5 h-5 text-slate-400" />
            <span>Daftar Pengajuan</span>
          </Link>

          <Link
            href="/barang"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Package className="w-5 h-5 text-slate-400" />
            <span>Katalog Barang</span>
          </Link>

          <Link
            href="/laporan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <BarChart2 className="w-5 h-5 text-slate-400" />
            <span>Laporan & Analitik</span>
          </Link>

          <Link
            href="/pengaturan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Pengaturan</span>
          </Link>
        </div>

        {/* Footer Akun & Logout */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-rose-500" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-white h-full z-10 shadow-xl">
            <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EF6905] flex items-center justify-center text-white font-bold">
                  P
                </div>
                <span className="font-bold text-slate-800">ProcureHub</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LayoutDashboard className="w-5 h-5 text-slate-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/pengajuan"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span>Daftar Pengajuan</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. WRAPPER KONTEN KANAN                                             */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER (BILAH ATAS) */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
          {/* Sisi Kiri: Hamburger & Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar Pil */}
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengajuan, barang, dokumen..."
                className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-full border border-transparent focus:border-slate-300 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Sisi Kanan: Notifikasi, Pemisah, & Profil */}
          <div className="flex items-center gap-4">
            {/* Tombol Notifikasi */}
            <button
              type="button"
              className="relative p-2 text-slate-400 hover:text-[#EF6905] rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF6905] rounded-full ring-2 ring-white" />
            </button>

            {/* Garis Pemisah Vertikal */}
            <div className="w-px h-6 bg-slate-200" />

            {/* Profil Pengguna */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#fdf0e6] text-[#EF6905] border border-[#EF6905]/20 font-semibold flex items-center justify-center text-sm shadow-sm">
                AF
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  Ahmad Fauzi
                </span>
                <span className="text-xs text-slate-500">Staf Pengadaan</span>
              </div>
            </div>
          </div>
        </header>

        {/* ----------------------------------------------------------------- */}
        {/* 3. MAIN CONTENT AREA (HANYA BAGIAN INI YANG BISA DI-SCROLL)      */}
        {/* ----------------------------------------------------------------- */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-6 flex flex-col items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center flex flex-col items-center">
            {/* Badge Indicator Status */}
            <div className="w-16 h-16 rounded-full bg-[#fdf0e6] text-[#EF6905] flex items-center justify-center mb-6 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Angka Kode Error */}
            <span className="text-xs font-bold uppercase tracking-widest text-[#EF6905] bg-[#fdf0e6] px-3 py-1 rounded-full mb-3">
              Kesalahan 404
            </span>

            {/* Judul Halaman / Error */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>

            {/* Deskripsi Teks Paragraf */}
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              Maaf, halaman pengadaan barang yang Anda cari tidak tersedia, telah dipindahkan, atau
              tautan yang Anda masukkan kurang tepat.
            </p>

            {/* Tombol Aksi Utama & Sekunder */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#EF6905] hover:bg-[#d45d04] text-white text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EF6905] focus:ring-offset-2"
              >
                <Home className="w-4 h-4" />
                <span>Ke Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            </div>

            {/* Bantuan Tambahan */}
            <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>
                Butuh bantuan?{' '}
                <a href="/bantuan" className="text-[#EF6905] hover:underline font-medium">
                  Hubungi Admin Sistem
                </a>
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
