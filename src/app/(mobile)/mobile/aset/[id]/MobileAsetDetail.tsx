"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Wrench,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  getAsetById,
  getUserById,
  formatTanggal,
  type StatusAset,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<StatusAset, "success" | "warning" | "danger" | "default"> = {
  Siaga: "success",
  Dipinjam: "warning",
  Rusak: "danger",
  Maintenance: "default",
};

export function MobileAsetDetail({ id }: { id: string }) {
  const aset = getAsetById(id);

  if (!aset) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Package className="h-12 w-12 text-slate-300" />
        <p className="text-sm text-slate-500">Aset tidak ditemukan</p>
        <Link href="/mobile/dashboard">
          <Button variant="outline" size="sm">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    );
  }

  const penanggungJawab = getUserById(aset.penanggungJawab);
  const riwayatTerakhir = aset.riwayat.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mobile/dashboard" className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </div>
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">Detail Aset</h1>
      </div>

      {/* Asset Info Card */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-800">
              {aset.nama}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{aset.kode}</p>
          </div>
          <Badge variant={statusBadgeVariant[aset.status]}>{aset.status}</Badge>
        </div>

        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Kategori</p>
              <p className="text-sm font-medium text-slate-800">
                {aset.kategori}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wrench className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Kondisi</p>
              <p className="text-sm font-medium text-slate-800">
                {aset.kondisi}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Lokasi</p>
              <p className="text-sm font-medium text-slate-800">
                {aset.lokasi}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Tanggal Perkiraan Kembali</p>
              <p className="text-sm font-medium text-slate-800">
                {formatTanggal(aset.tanggalPerkiraan)}
              </p>
            </div>
          </div>
          {penanggungJawab && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex items-center gap-2">
                <Avatar
                  src={penanggungJawab.avatar}
                  fallback={penanggungJawab.nama}
                  size="sm"
                />
                <div>
                  <p className="text-xs text-slate-500">Penanggung Jawab</p>
                  <p className="text-sm font-medium text-slate-800">
                    {penanggungJawab.nama}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons & Riwayat */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Action Buttons */}
          {aset.status === "Siaga" && (
            <Link href={`/mobile/checklist/${aset.id}`} className="block">
              <Button size="lg" className="w-full gap-2">
                <Package className="h-5 w-5" />
                Checkout Pinjam
              </Button>
            </Link>
          )}
          {aset.status === "Dipinjam" && (
            <div className="flex flex-col gap-3 md:flex-row">
              <Link href={`/mobile/checklist/${aset.id}`} className="block flex-1">
                <Button size="lg" className="w-full gap-2">
                  <Clock className="h-5 w-5" />
                  Check-in Kembali
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="flex-1 gap-2">
                Handshake
              </Button>
            </div>
          )}
        </div>

        {/* Riwayat Terakhir */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-800">
            Riwayat Terakhir
          </h2>
          <Card className="divide-y divide-slate-100">
            {riwayatTerakhir.map((item, idx) => {
              const user = getUserById(item.userId);
              return (
                <div key={idx} className="flex items-start gap-3 p-4">
                  {user && (
                    <Avatar
                      src={user.avatar}
                      fallback={user.nama}
                      size="sm"
                      className="mt-0.5"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {item.aksi}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.keterangan}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatTanggal(item.tanggal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      </div>
    </div>
  );
}
