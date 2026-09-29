"use client";

import Link from "next/link";
import { Bell, Package, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  asetList,
  notifikasiList,
  formatTanggalWaktu,
  type StatusAset,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<StatusAset, "success" | "warning" | "danger" | "default"> = {
  Siaga: "success",
  Dipinjam: "warning",
  Rusak: "danger",
  Maintenance: "default",
};

const notifikasiDotColor: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
};

export default function MobileDashboardPage() {
  const barangDipinjam = asetList.filter((a) => a.status === "Dipinjam");
  const menungguHandshake = barangDipinjam.filter((a) => {
    const deadline = new Date(a.tanggalPerkiraan);
    const now = new Date();
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  });
  const notifikasiTerbaru = notifikasiList.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src="/avatars/medlyn.png"
            fallback="Medlyn R. Pagali"
            size="md"
          />
          <div>
            <p className="text-sm text-slate-500">Selamat datang kembali,</p>
            <h1 className="text-lg font-semibold text-slate-800">
              Halo, Rescuer!
            </h1>
          </div>
        </div>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              Barang Dipinjam
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            {barangDipinjam.length}
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 sm:h-10 sm:w-10">
              <Clock className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              Menunggu Handshake
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            {menungguHandshake.length}
          </p>
        </Card>
      </div>

      {/* Barang yang Anda Pegang & Notifikasi */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Barang yang Anda Pegang */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              Barang yang Anda Pegang
            </h2>
            <Link
              href="/mobile/aset"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
            >
              Lihat Semua
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {barangDipinjam.map((aset) => (
              <Link key={aset.id} href={`/mobile/aset/${aset.id}`}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:border-slate-300">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {aset.nama}
                    </p>
                    <p className="text-xs text-slate-500">{aset.kategori}</p>
                  </div>
                  <Badge variant={statusBadgeVariant[aset.status]}>
                    {aset.status}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Notifikasi Terbaru */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              Notifikasi Terbaru
            </h2>
          </div>
          <Card className="divide-y divide-slate-100">
            {notifikasiTerbaru.map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-4">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notifikasiDotColor[notif.tipe]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {notif.judul}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {notif.pesan}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatTanggalWaktu(notif.tanggal)}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
