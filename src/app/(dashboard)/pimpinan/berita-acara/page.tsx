"use client";

import Link from "next/link";
import { FileText, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { formatTanggal } from "@/components/shared/mock-data";
import { useBeritaAcara } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError, DataEmpty } from "@/components/shared/data-state";
import type { BeritaAcaraMapped } from "@/components/shared/supabase-mock-mapper";

const statusVariant: Record<
  string,
  "warning" | "default" | "success" | "danger"
> = {
  Draf: "default",
  Diserahkan: "warning",
  Diproses: "default",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function BeritaAcaraPimpinanPage() {
  // Semua data langsung dari Supabase — KAKANSAR melihat berita acara
  // segera setelah operator menyerahkan ke BMN (RLS policy ba_select).
  const { data, loading, error, refetch } = useBeritaAcara();

  const menungguAcc = data.filter((b) => b.status === "Diproses").length;
  const disetujui = data.filter((b) => b.status === "Disetujui").length;
  const ditolak = data.filter((b) => b.status === "Ditolak").length;

  if (loading) {
    return <DataLoading label="Memuat berita acara…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat berita acara dari database"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Persetujuan Berita Acara
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tinjau template berita acara kerusakan aset, lalu acc atau tolak
          sebelum Pengelola BMN membuat tiket maintenance
        </p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{menungguAcc}</p>
              <p className="text-sm text-slate-500">Menunggu Persetujuan</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{disetujui}</p>
              <p className="text-sm text-slate-500">Disetujui</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50">
              <XCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{ditolak}</p>
              <p className="text-sm text-slate-500">Ditolak</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabel / Kartu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Daftar Berita Acara ({data.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <DataEmpty message="Belum ada berita acara masuk. Berita acara muncul di sini setelah operator menyerahkan kerusakan aset ke Pengelola BMN." />
          ) : (
            <ResponsiveTable<BeritaAcaraMapped>
              data={data}
              getKey={(ba) => ba.id}
              cardTitle={(ba) => ba.namaAset}
              cardSubtitle={(ba) =>
                `${ba.nomor || "Nomor belum diisi"} — ${formatTanggal(ba.tanggal)}`
              }
              cardBadge={(ba) => (
                <Badge variant={statusVariant[ba.status] ?? "default"}>
                  {ba.status}
                </Badge>
              )}
              emptyMessage="Tidak ada berita acara."
              fields={[
                {
                  key: "nomor",
                  header: "Nomor",
                  render: (ba) =>
                    ba.nomor || (
                      <span className="text-slate-400">Belum diisi</span>
                    ),
                },
                {
                  key: "tanggal",
                  header: "Tanggal",
                  render: (ba) => formatTanggal(ba.tanggal),
                },
                {
                  key: "aset",
                  header: "Aset",
                  render: (ba) => (
                    <div>
                      <p className="font-medium text-slate-800">{ba.namaAset}</p>
                      {ba.kodeAset && (
                        <p className="font-mono text-xs text-slate-500">
                          {ba.kodeAset}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "pengaju",
                  header: "Diserahkan Oleh",
                  render: (ba) => ba.pengajuNama ?? ba.pelapor ?? "-",
                  hideBelowLg: true,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (ba) => (
                    <Badge variant={statusVariant[ba.status] ?? "default"}>
                      {ba.status}
                    </Badge>
                  ),
                },
                {
                  key: "aksi",
                  header: "Aksi",
                  render: (ba) => (
                    <Link href={`/pimpinan/berita-acara/${ba.id}`}>
                      <Button
                        variant={ba.status === "Diproses" ? "primary" : "outline"}
                        size="sm"
                      >
                        {ba.status === "Diproses" ? "Tinjau & Acc" : "Lihat"}
                      </Button>
                    </Link>
                  ),
                  cellClassName: "text-right",
                  hideOnCard: true,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
