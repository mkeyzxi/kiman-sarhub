"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  FileText,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getUserById,
  formatTanggal,
  type StatusApproval,
} from "@/components/shared/mock-data";
import { useApprovals } from "@/components/shared/use-supabase-data";
import { saveApprovalKeputusan } from "@/components/shared/db-writes";
import { DataLoading, DataError } from "@/components/shared/data-state";

const statusBadgeVariant: Record<
  StatusApproval,
  "warning" | "success" | "danger"
> = {
  Menunggu: "warning",
  Disetujui: "success",
  Ditolak: "danger",
};

const statusIcon: Record<StatusApproval, typeof Clock> = {
  Menunggu: Clock,
  Disetujui: CheckCircle2,
  Ditolak: XCircle,
};

export default function ApprovalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Pengajuan dari Supabase.
  const { data: approvals, loading, error, refetch } = useApprovals();
  const approval = approvals.find((a) => a.id === params.id);

  const [catatan, setCatatan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  if (loading) {
    return <DataLoading label="Memuat detail pengajuan…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat pengajuan dari database"
      />
    );
  }

  if (!approval) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Package className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Pengajuan tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Pengajuan dengan ID &quot;{params.id}&quot; tidak tersedia.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const pengaju = getUserById(approval.pengajuanOleh ?? "");
  const StatusIcon = statusIcon[approval.status];

  /** Simpan keputusan pimpinan ke Supabase lalu kembali ke daftar. */
  const putuskan = async (keputusan: StatusApproval) => {
    setMenyimpan(true);
    setGagal(null);
    try {
      await saveApprovalKeputusan(approval.id, keputusan, catatan.trim());
      router.push("/pimpinan/approval");
    } catch (e) {
      setGagal(e instanceof Error ? e.message : "Gagal menyimpan keputusan.");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/pimpinan/approval"
            aria-label="Kembali ke daftar pengajuan"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Detail Pengajuan
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {approval.kode} · {approval.namaAset}
            </p>
          </div>
        </div>
        <Badge
          variant={statusBadgeVariant[approval.status]}
          className="flex w-fit items-center gap-1.5 px-3 py-1 text-sm"
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {approval.status}
        </Badge>
      </div>

      {/* Informasi Pengajuan */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengajuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Kode Aset
                </p>
                <p className="font-mono text-sm font-medium text-slate-800">
                  {approval.kode}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Nama Aset
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {approval.namaAset}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Kategori
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {approval.kategori}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Pengaju
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {pengaju?.nama ?? "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {pengaju?.role ?? "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Tanggal Pengajuan
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {formatTanggal(approval.tanggal)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alasan & Rincian */}
      <Card>
        <CardHeader>
          <CardTitle>Alasan &amp; Rincian Usulan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {approval.alasan}
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {approval.rincian.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-sm font-medium text-slate-800">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Aksi Persetujuan */}
      {approval.status === "Menunggu" ? (
        <Card>
          <CardHeader>
            <CardTitle>Keputusan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="catatan"
                className="text-sm font-medium leading-none text-slate-600"
              >
                Catatan Kepala Kantor (opsional)
              </label>
              <textarea
                id="catatan"
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan alasan keputusan atau instruksi tindak lanjut..."
                className="flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-colors placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => putuskan("Ditolak")}
                disabled={menyimpan}
              >
                <XCircle className="h-4 w-4" />
                Tolak Pengajuan
              </Button>
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => putuskan("Disetujui")}
                disabled={menyimpan}
              >
                <CheckCircle2 className="h-4 w-4" />
                {menyimpan ? "Menyimpan…" : "Setujui Pengajuan"}
              </Button>
            </div>
            {gagal && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                {gagal}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <StatusIcon
              className={
                approval.status === "Disetujui"
                  ? "h-5 w-5 text-emerald-600"
                  : "h-5 w-5 text-rose-600"
              }
            />
            <p className="text-sm text-slate-600">
              Pengajuan ini telah{" "}
              <strong>
                {approval.status === "Disetujui" ? "disetujui" : "ditolak"}
              </strong>{" "}
              oleh Kepala Kantor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}