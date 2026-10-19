"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  QrCode,
  Pencil,
  Package,
  MapPin,
  User,
  Calendar,
  Wrench,
  FileText,
  Hash,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RiwayatTable from "./riwayat-table";
import {
  getAsetById,
  getUserById,
  formatTanggal,
  ubahStatusAset,
  STATUS_ASET_VARIANT,
} from "@/components/shared/mock-data";

export default function DetailAsetPage() {
  const { id } = useParams<{ id: string }>();
  const aset = getAsetById(id);

  if (!aset) {
    notFound();
  }

  const penanggungJawab = getUserById(aset.penanggungJawab);
  const router = useRouter();

  const handleSelesaiDigunakan = () => {
    // TODO: ganti dengan PATCH ke endpoint aset saat API tersedia.
    ubahStatusAset(
      aset.id,
      "Standby",
      penanggungJawab?.id ?? "usr-unknown",
      "Aset selesai digunakan, kembali ke status Standby"
    );

    // Refresh agar kartu detail membaca status terbaru.
    router.refresh();
  };

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
            <Badge variant={STATUS_ASET_VARIANT[aset.status]} className="text-sm px-3 py-1">
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
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  NUP
                </p>
                <p className="text-sm font-medium text-slate-800 font-mono">
                  {aset.nup}
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
                  Tanggal Penetapan
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {formatTanggal(aset.tanggalPenetapan)}
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

      {/* Form Selesai Digunakan */}
      {aset.status === "Sedang digunakan" && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Selesai Digunakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Aset sedang digunakan. Klik di bawah untuk menandai sebagai selesai digunakan dan kembali ke status Standby.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button
                onClick={handleSelesaiDigunakan}
                className="bg-primary text-primary-foreground"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Selesaikan Penggunaan
              </Button>
            </div>
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
