import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Pencil,
  Package,
  MapPin,
  User,
  Calendar,
  Wrench,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RiwayatTable from "./riwayat-table";
import {
  getAsetById,
  getUserById,
  formatTanggal,
  type StatusAset,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<StatusAset, "success" | "warning" | "danger" | "default"> = {
  Siaga: "success",
  Operasi: "default",
  Dipinjam: "warning",
  Rusak: "danger",
  Maintenance: "warning",
  "Tidak Siap": "danger",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailAsetPage({ params }: PageProps) {
  const { id } = await params;
  const aset = getAsetById(id);

  if (!aset) {
    notFound();
  }

  const penanggungJawab = getUserById(aset.penanggungJawab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/bmn"
            aria-label="Kembali ke daftar aset"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Detail Aset</h1>
            <p className="text-sm text-slate-500 mt-1">
              {aset.kode} — {aset.nama}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <QrCode className="h-4 w-4" />
            Cetak QR Code
          </Button>
          <Link href={`/bmn/${aset.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Asset Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informasi Aset</CardTitle>
            <Badge variant={statusBadgeVariant[aset.status]} className="text-sm px-3 py-1">
              {aset.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Kode
                </p>
                <p className="text-sm font-medium text-slate-800 font-mono">
                  {aset.kode}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Kategori
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {aset.kategori}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Lokasi
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {aset.lokasi}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Tanggal Perkiraan
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {formatTanggal(aset.tanggalPerkiraan)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Penanggung Jawab
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {penanggungJawab?.nama ?? "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {penanggungJawab?.role ?? "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Badge
                  variant={
                    aset.kondisi === "Baik"
                      ? "success"
                      : aset.kondisi === "Rusak Ringan"
                        ? "warning"
                        : "danger"
                  }
                  className="h-10 w-10 rounded-lg border-0"
                >
                  <span className="text-xs font-bold">
                    {aset.kondisi === "Baik"
                      ? "B"
                      : aset.kondisi === "Rusak Ringan"
                        ? "RR"
                        : "RB"}
                  </span>
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Kondisi
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {aset.kondisi}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keterangan */}
      {aset.keterangan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Keterangan Aset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {aset.keterangan}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Riwayat Pemakaian */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemakaian (Audit Trail)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RiwayatTable
            items={aset.riwayat.map((item) => ({
              tanggal: formatTanggal(item.tanggal),
              aksi: item.aksi,
              keterangan: item.keterangan,
              userId: item.userId,
              namaPelaku: getUserById(item.userId)?.nama ?? "-",
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
