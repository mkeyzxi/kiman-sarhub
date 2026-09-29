import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-800">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak
        pernah ada.
      </p>
      <Link href="/dashboard/bmn">
        <Button className="mt-6" size="lg">
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  );
}
