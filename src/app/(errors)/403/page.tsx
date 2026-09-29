import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
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

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <ShieldAlert className="size-5 text-primary" />
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Role yang dibutuhkan:</span>{" "}
          Administrator atau Pengelola BMN
        </p>
      </div>

      <Link href="/login">
        <Button variant="outline" className="mt-6" size="lg">
          Kembali
        </Button>
      </Link>
    </div>
  );
}
