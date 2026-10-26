"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  Package,
  MapPin,
  User,
  Calendar,
  Wrench,
  FileText,
  Hash,
  CheckCircle,
  QrCode,
  Download,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import RiwayatTable from "./riwayat-table";
import {
  getUserById,
  formatTanggal,
  STATUS_ASET_VARIANT,
} from "@/components/shared/mock-data";
import { useAsetById } from "@/components/shared/use-supabase-data";
import { updateAsetStatus } from "@/components/shared/db-writes";
import { useSesiUser } from "@/components/shared/use-session";
import { useState, useCallback, useEffect } from "react";

export default function DetailAsetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ses = useSesiUser();
  // Aset dari Supabase.
  const { data: aset, loading, error, refetch } = useAsetById(id);
  const [gagal, setGagal] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrUrl = aset
    ? `${process.env.NEXT_PUBLIC_URL_QRCODE}/operator/logbook/tambah?unit=${encodeURIComponent(aset.kode)}`
    : "";

  // Salin URL ke clipboard
  const handleCopy = useCallback(async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: prompt
      window.prompt("Salin URL berikut:", qrUrl);
    }
  }, [qrUrl]);

  // Unduh QR code sebagai PNG
  const handleDownload = useCallback(() => {
    const svg = document.getElementById("qr-code-img") as SVGSVGElement | null;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `qrcode-${aset?.kode ?? "aset"}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [aset?.kode]);

  // Buka link dalam tab baru untuk testing
  const handleTestLink = useCallback(() => {
    if (qrUrl) window.open(qrUrl, "_blank");
  }, [qrUrl]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Memuat aset…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-rose-700">
          Gagal memuat aset dari database
        </p>
        <p className="text-xs text-rose-600">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!aset) {
    notFound();
  }

  const penanggungJawab = getUserById(aset.penanggungJawab);

  const handleSelesaiDigunakan = async () => {
    // UPDATE status aset + entri riwayat ke Supabase.
    try {
      await updateAsetStatus(
        aset.id,
        "Standby",
        ses.id || (penanggungJawab?.id ?? ""),
        "Aset selesai digunakan, kembali ke status Standby",
        "Selesai Digunakan",
        "Baik"
      );
      setGagal(null);
      // Muat ulang data terbaru dari database.
      refetch();
      router.refresh();
    } catch (e) {
      setGagal(e instanceof Error ? e.message : "Gagal memperbarui aset");
    }
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
              {aset.kode} · {aset.nama}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowQr(true)}>
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

      {/* Modal QR Code */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Aset</DialogTitle>
            <DialogDescription>
              Aset: {aset?.nama} · Kode: {aset?.kode}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {/* QR Code */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <QRCodeSVG
                id="qr-code-img"
                value={qrUrl}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            {/* Link Display */}
            <div className="w-full space-y-2">
              <p className="text-xs text-slate-500">Link QR Code:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1.5 text-xs text-slate-700">
                  {qrUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="ml-1 text-xs">Tersalin</span>
                    </>
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" size="sm" onClick={handleTestLink}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Test Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Unduh PNG
            </Button>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setShowQr(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  {penanggungJawab?.nip ? `NIP ${penanggungJawab.nip}` : "-"}
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

      {/* Data BMN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Data Register BMN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Kode Barang", value: aset.kodeBarang },
              { label: "Merk", value: aset.merk },
              { label: "Tipe", value: aset.tipe },
              { label: "No. Polisi", value: aset.noPolisi },
              { label: "No. STNK", value: aset.noStnk },
              {
                label: "Tanggal Perolehan",
                value: aset.tanggalPerolehan
                  ? formatTanggal(aset.tanggalPerolehan)
                  : undefined,
              },
              { label: "No. PSP", value: aset.noPsp },
              {
                label: "Tanggal PSP",
                value: aset.tanggalPsp ? formatTanggal(aset.tanggalPsp) : undefined,
              },

              {
                label: "Umur Aset",
                value:
                  aset.umurAsetTahun !== undefined
                    ? `${aset.umurAsetTahun} tahun`
                    : undefined,
              },
              { label: "Status Penggunaan", value: aset.statusPenggunaan },
              { label: "Status BMN", value: aset.statusBmn },
              { label: "Kode Register", value: aset.kodeRegister },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label}>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
                    {item.value}
                  </p>
                </div>
              ))}
          </div>
          {aset.jumlahFoto !== undefined && (
            <p className="mt-4 text-xs text-slate-500">
              {aset.jumlahFoto} foto terdokumentasi pada register BMN.
            </p>
          )}
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
            <div className="flex flex-col gap-3">
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
              {gagal && (
                <p className="text-xs text-rose-700">{gagal}</p>
              )}
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
