"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { getDefaultPageForRole } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

export default function NotFound() {
  const router = useRouter();
  const role = (typeof localStorage !== "undefined"
    ? localStorage.getItem("userRole")
    : null) as UserRole | null;

  const defaultPage = role ? getDefaultPageForRole(role) : "/login";

  return (
    <div className="flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-800">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Maaf, halaman yang Anda cari tidak tersedia, telah dipindahkan, atau
        tautan yang Anda masukkan kurang tepat.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <ShieldAlert className="size-5 text-primary" />
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Tips:</span>{" "}
          Periksa kembali URL atau gunakan navigasi untuk menemukan halaman yang Anda cari
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <Link href={defaultPage}>
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            Ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
