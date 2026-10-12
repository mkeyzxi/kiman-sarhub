"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Home, ArrowLeft, ShieldAlert, HelpCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased text-slate-600">
      <div className="flex flex-col items-center justify-center p-6">
        {/* Latar Belakang Abstrak & Dekorasi Melayang */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-100/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-50" />

        {/* Ikon-ikon dekoratif yang tersebar */}
        <Home className="absolute top-[20%] left-[20%] w-12 h-12 text-orange-200 -rotate-12 animate-[bounce_4s_ease-in-out_infinite]" />
        <ShieldAlert className="absolute bottom-[25%] right-[25%] w-16 h-16 text-slate-200 rotate-12 animate-[bounce_5s_ease-in-out_infinite]" />

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
              onClick={() => router.back()}
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
      </div>
    </div>
  );
}