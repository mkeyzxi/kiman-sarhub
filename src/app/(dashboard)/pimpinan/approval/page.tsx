"use client";

import Link from "next/link";
import { Eye, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import {
  getUserById,
  type StatusApproval,
  formatTanggal,
} from "@/components/shared/mock-data";
import { useApprovals } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";


const statusBadgeVariant: Record<
  StatusApproval,
  "warning" | "success" | "danger"
> = {
  Menunggu: "warning",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function ApprovalPage() {
  // Data approval dari Supabase.
  const { data: approvals, loading, error, refetch } = useApprovals();

  if (loading) {
    return <DataLoading label="Memuat daftar pengajuan…" />;
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

  const totalPending = approvals.filter((a) => a.status === "Menunggu").length;
  const disetujui = approvals.filter((a) => a.status === "Disetujui").length;
  const ditolak = approvals.filter((a) => a.status === "Ditolak").length;

  const stats = [
    {
      label: "Total Pending",
      value: totalPending,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Disetujui",
      value: disetujui,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Ditolak",
      value: ditolak,
      icon: XCircle,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approval BMN</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola persetujuan pengajuan aset BMN oleh personel
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table — otomatis menjadi kartu di layar kecil */}
      <Card>
        <ResponsiveTable
          data={approvals}
          getKey={(row) => row.id}
          cardTitle={(row) => row.namaAset}
          cardSubtitle={(row) => `${row.kode} \u00b7 ${formatTanggal(row.tanggal)}`}
          cardBadge={(row) => (
            <Badge variant={statusBadgeVariant[row.status as StatusApproval]}>{row.status}</Badge>
          )}
          cardPreviewCount={2}
          detailLabel="Lihat detail pengajuan"
          emptyMessage="Tidak ada data approval"
          fields={[
            {
              key: "kode",
              header: "Kode",
              render: (row) => row.kode,
              cellClassName: "font-mono text-xs text-slate-600",
            },
            {
              key: "namaAset",
              header: "Nama Aset",
              render: (row) => row.namaAset,
              cellClassName: "font-medium text-slate-800",
              hideOnCard: true,
            },
            {
              key: "kategori",
              header: "Kategori",
              render: (row) => <Badge variant="outline">{row.kategori}</Badge>,
            },
            {
              key: "pengajuanOleh",
              header: "Pengajuan Oleh",
              render: (row) => getUserById(row.pengajuanOleh ?? "")?.nama ?? "-",
              cellClassName: "text-slate-600",
            },
            {
              key: "tanggal",
              header: "Tanggal",
              render: (row) => formatTanggal(row.tanggal),
              cellClassName: "text-slate-600",
              hideOnCard: true,
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge variant={statusBadgeVariant[row.status as StatusApproval]}>{row.status}</Badge>
              ),
              hideOnCard: true,
            },
            {
              key: "aksi",
              header: "Aksi",
              render: (row) => (
                <div className="flex items-center justify-center">
                  <Link href={`/pimpinan/approval/${row.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ),
              headClassName: "text-center",
              hideBelowLg: true,
            },
          ]}
        />
      </Card>
    </div>
  );
}
