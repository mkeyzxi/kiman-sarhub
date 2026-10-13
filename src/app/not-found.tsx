"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, ShieldAlert, Compass } from "lucide-react";
import { useState } from "react";
import { getDefaultPageForRole } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

// Arahkan pengguna ke landing page sesuai role yang tersimpan di localStorage.
// getDefaultPageForRole() sudah memetakan role -> route yang benar.
function resolveDashboardUrl(): string {
  if (typeof localStorage === "undefined") return "/login";

  const role = localStorage.getItem("userRole") as UserRole | null;
  return role ? getDefaultPageForRole(role) : "/login";
}

export default function NotFound() {
  const [dashboardUrl] = useState(resolveDashboardUrl);
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#FAFAFA] p-6 font-sans antialiased text-slate-600">
      {/* Dekorasi latar */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 left-10 size-96 rounded-full bg-orange-200/40 opacity-70 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 bottom-10 size-96 rounded-full bg-rose-200/40 opacity-70 blur-[80px]"
      />

      {/* Area konten inti */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        {/* Angka 404 dengan ikon di tengah */}
        <div className="relative flex w-full items-center justify-center">
          <h1 className="select-none bg-linear-to-br from-slate-200 to-slate-300/40 bg-clip-text text-[12rem] leading-none font-black tracking-tighter text-transparent drop-shadow-sm md:text-[18rem]">
            404
          </h1>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex size-24 rotate-12 items-center justify-center rounded-3xl bg-linear-to-tr from-primary to-orange-400 shadow-2xl shadow-orange-500/40 md:size-32 md:rounded-4xl">
              <ShieldAlert className="size-12 -rotate-12 text-white md:size-16" />
            </div>
          </div>
        </div>

        {/* Judul & pesan */}
        <div className="-mt-8 z-10 mb-10 md:-mt-16">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm md:text-5xl">
            Kehilangan Jejak?
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-slate-500 md:text-lg">
            Halaman yang Anda cari tidak ditemukan. Mungkin tautannya salah,
            atau halaman tersebut sudah dipindahkan.
          </p>
        </div>

        {/* Aksi */}
        <div className="flex w-full flex-col justify-center gap-4 px-4 sm:flex-row">
          <Link
            href={dashboardUrl}
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-primary-hover hover:shadow-xl hover:shadow-orange-500/30 focus:ring-4 focus:ring-orange-500/20 focus:outline-none"
          >
            <Home className="size-5 transition-transform group-hover:scale-110" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-slate-200 bg-white/80 px-8 py-4 text-base font-semibold text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md hover:border-slate-300"
          >
            <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Bantuan */}
        <div className="mt-16 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Compass className="size-4" />
          <span>
            Tidak menemukan yang dicari?{" "}
            <Link
              href="/operator"
              className="font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Kembali ke Dashboard Operasional
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}