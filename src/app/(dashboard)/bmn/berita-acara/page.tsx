"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { formatTanggal } from "@/components/shared/mock-data";
import { useBeritaAcara } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError, DataEmpty } from "@/components/shared/data-state";
import type { BeritaAcaraMapped } from "@/components/shared/supabase-mock-mapper";
import { cn } from "@/lib/utils";

/** Alur BA: Draf → Diserahkan (PJ) → Diproses (BMN isi nomor) → KAKANSAR. */
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

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DaftarBeritaAcaraPage() {
  // Semua data langsung dari Supabase — tanpa fallback mock.
  const { data, loading, error, refetch } = useBeritaAcara();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const baList = useMemo(
    () =>
      data.filter((ba) => {
        const q = searchQuery.toLowerCase();
        const matchQuery =
          q === "" ||
          ba.namaAset.toLowerCase().includes(q) ||
          (ba.nomor || "").toLowerCase().includes(q) ||
          (ba.kodeAset || "").toLowerCase().includes(q) ||
          (ba.pengajuNama || ba.pelapor || "").toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "Semua" || ba.status === statusFilter;
        return matchQuery && matchStatus;
      }),
    [data, searchQuery, statusFilter]
  );

  const menungguNomor = data.filter((b) => b.status === "Diserahkan").length;
  const menungguAcc = data.filter((b) => b.status === "Diproses").length;
  const disetujui = data.filter((b) => b.status === "Disetujui").length;

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Berita Acara</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola berita acara kerusakan — isi nomor surat, teruskan ke
            Kepala Kantor SAR, dan sambungkan tiket setelah acc
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Berita Acara"
          value={data.length}
          icon={FileText}
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          label="Menunggu Nomor Surat"
          value={menungguNomor}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Menunggu Acc KAKANSAR"
          value={menungguAcc}
          icon={Send}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Disetujui"
          value={disetujui}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aset, nomor surat, atau pengaju…"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-52"
          >
            <option value="Semua">Semua Status</option>
            <option value="Draf">Draf (belum diserahkan)</option>
            <option value="Diserahkan">Menunggu Nomor Surat</option>
            <option value="Diproses">Menunggu Acc KAKANSAR</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </Select>
        </div>
      </Card>

      {/* Tabel / Kartu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Daftar Berita Acara ({baList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {baList.length === 0 ? (
            <DataEmpty
              message={
                data.length === 0
                  ? "Belum ada berita acara di database. Berita acara dibuat operator dari checklist yang berisi kerusakan → tombol \u201CSerahkan ke BMN\u201D."
                  : "Tidak ada berita acara yang cocok dengan pencarian/filter."
              }
            />
          ) : (
            <ResponsiveTable<BeritaAcaraMapped>
              data={baList}
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
                    <Link href={`/bmn/berita-acara/${ba.id}`}>
                      <Button variant="outline" size="sm">
                        Kelola
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

      {data.some((b) => b.status === "Ditolak") && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-xs text-slate-600">
            Berita acara yang ditolak KAKANSAR dapat dilihat di detail masing-masing
            beserta alasan penolakan — kembalikan ke PJ untuk perbaikan dokumen
            sebelum diurus ulang.
          </p>
        </div>
      )}
    </div>
  );
}
