"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { roleLabels, getDefaultPageForRole } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

export default function Forbidden() {
  const router = useRouter();
  const role = (typeof localStorage !== "undefined"
    ? localStorage.getItem("userRole")
    : null) as UserRole | null;

  const defaultPage = role ? getDefaultPageForRole(role) : "/login";

  return (
    <div className="flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold tracking-tight text-primary">403</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-800">
        Akses Ditolak
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi
        administrator jika Anda merasa ini adalah kesalahan.
      </p>

      {role && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <ShieldAlert className="size-5 text-primary" />
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">Role Anda:</span>{" "}
            {roleLabels[role] || role}
          </p>
        </div>
      )}

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
          <Button size="lg">Ke Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
