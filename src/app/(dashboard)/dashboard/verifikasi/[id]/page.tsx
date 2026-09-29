"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import {
  antreanVerifikasi,
  asetList,
  getUserById,
  formatTanggal,
  type StatusVerifikasi,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<
  StatusVerifikasi,
  "warning" | "success" | "danger"
> = {
  Menunggu: "warning",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function VerifikasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showRevisi, setShowRevisi] = useState(false);
  const [catatanRevisi, setCatatanRevisi] = useState("");

  const item = antreanVerifikasi.find((v) => v.id === id);

  if (!item) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/verifikasi">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <p className="text-slate-500">Data verifikasi tidak ditemukan</p>
        </Card>
      </div>
    );
  }

  const creator = getUserById(item.createdBy);
  const relatedAset =
    item.tipe === "Draf Aset"
      ? asetList.find((a) =>
          item.judul.toLowerCase().includes(a.nama.toLowerCase().split(" ")[0])
        )
      : asetList.find((a) =>
          item.judul.toLowerCase().includes(a.nama.toLowerCase().split(" ")[0])
        );

  return (
    <div className="space-y-6">
      {/* Back Button + Title */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/verifikasi">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detail Verifikasi</h1>
          <p className="text-sm text-slate-500 mt-1">
            {item.id.toUpperCase()} — {item.judul}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informasi Pengajuan</CardTitle>
            <Badge variant={statusBadgeVariant[item.status]}>{item.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Tipe</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {item.tipe}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tanggal Pengajuan</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {formatTanggal(item.tanggalBuat)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Judul</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {item.judul}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Diajukan Oleh</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {creator?.nama ?? "-"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Deskripsi</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {item.deskripsi}
            </p>
          </div>
          {item.catatanRevisi && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-medium text-amber-800">Catatan Revisi</p>
              <p className="text-sm text-amber-700 mt-1">{item.catatanRevisi}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Aset */}
      {item.tipe === "Draf Aset" && (
        <Card>
          <CardHeader>
            <CardTitle>Data Aset</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedAset ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Aset</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kondisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {relatedAset.kode}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {relatedAset.nama}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{relatedAset.kategori}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          relatedAset.status === "Siaga"
                            ? "success"
                            : relatedAset.status === "Dipinjam"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {relatedAset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {relatedAset.kondisi}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Data aset terkait tidak ditemukan</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Catatan Revisi */}
      {showRevisi && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan Revisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Tulis catatan revisi untuk penolakan ini..."
              value={catatanRevisi}
              onChange={(e) => setCatatanRevisi(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRevisi(false)}>
                Batal
              </Button>
              <Button
                variant="danger"
                disabled={!catatanRevisi.trim()}
                onClick={() => {
                  // Handle reject logic
                  setShowRevisi(false);
                }}
              >
                <XCircle className="h-4 w-4" />
                Konfirmasi Penolakan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {item.status === "Menunggu" && (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              // Handle approve logic
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Setujui
          </Button>
          <Button variant="danger" onClick={() => setShowRevisi(true)}>
            <XCircle className="h-4 w-4" />
            Tolak
          </Button>
        </div>
      )}
    </div>
  );
}
