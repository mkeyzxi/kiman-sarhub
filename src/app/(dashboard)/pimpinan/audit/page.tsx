"use client";

import { Users, TrendingUp, AlertOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  useAuditKepatuhan,
  hitungRingkasanAudit,
  type BarisAuditKepatuhan,
} from "@/components/shared/use-supabase-data";

function getSkorColor(skor: number): string {
  if (skor >= 90) return "text-emerald-600";
  if (skor >= 75) return "text-amber-600";
  return "text-rose-600";
}

function getSkorBadgeVariant(
  skor: number
): "success" | "warning" | "danger" {
  if (skor >= 90) return "success";
  if (skor >= 75) return "warning";
  return "danger";
}

interface BarisRanking extends BarisAuditKepatuhan {
  rank: number;
}

export default function AuditPage() {
  const { data, loading, error, refetch } = useAuditKepatuhan();
  const { totalPersonel, rataSkor, pelanggaranBulanIni } =
    hitungRingkasanAudit(data);

  // Peringkat sudah tertata di hook (skor tertinggi dulu) — lampirkan rank.
  const ranking: BarisRanking[] = data.map((item, i) => ({
    ...item,
    rank: i + 1,
  }));

  const stats = [
    {
      label: "Total Personel",
      value: totalPersonel,
      icon: Users,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Rata-rata Skor",
      value: rataSkor,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Pelanggaran Bulan Ini",
      value: pelanggaranBulanIni,
      icon: AlertOctagon,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  if (loading) {
    return <DataLoading label="Memuat audit kepatuhan…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat data kepatuhan dari database"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit Kepatuhan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluasi kepatuhan personel terhadap prosedur operasional SAR
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Telat Kembali = unit rusak masih dipegang tanpa berita acara ·
          Abaikan Checklist = pemeriksaan lewat waktunya dan masih Belum
          Lengkap. Semua dihitung otomatis dari data.
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

      {/* Compliance Table */}
      <Card>
        <ResponsiveTable
          data={ranking}
          getKey={(row) => row.personelId}
          cardTitle={(row) => row.nama}
          cardSubtitle={(row) => row.jabatan}
          cardBadge={(row) => (
            <Badge variant={getSkorBadgeVariant(row.skorKepatuhan)}>
              <span className={getSkorColor(row.skorKepatuhan)}>
                Skor {row.skorKepatuhan}
              </span>
            </Badge>
          )}
          cardPreviewCount={2}
          detailLabel="Lihat detail kepatuhan"
          emptyMessage="Belum ada data kepatuhan personel."
          fields={[
            {
              key: "rank",
              header: "Ranking",
              render: (row) => (
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    row.rank === 1
                      ? "bg-primary text-white"
                      : row.rank === 2
                        ? "bg-slate-200 text-slate-700"
                        : row.rank === 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {row.rank}
                </span>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "nama",
              header: "Nama",
              render: (row) => row.nama,
              cellClassName: "font-medium text-slate-800",
              hideOnCard: true,
            },
            {
              key: "jabatan",
              header: "Jabatan",
              render: (row) => <Badge variant="outline">{row.jabatan}</Badge>,
              hideOnCard: true,
            },
            {
              key: "telatKembali",
              header: "Telat Kembali",
              render: (row) => (
                <span
                  className={`font-medium ${
                    row.telatKembali > 0 ? "text-rose-600" : "text-slate-600"
                  }`}
                >
                  {row.telatKembali}
                </span>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "abaikanChecklist",
              header: "Abaikan Checklist",
              render: (row) => (
                <span
                  className={`font-medium ${
                    row.abaikanChecklist > 0 ? "text-rose-600" : "text-slate-600"
                  }`}
                >
                  {row.abaikanChecklist}
                </span>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "rincian",
              header: "Keterangan Pelanggaran",
              render: (row) =>
                row.rincian.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-600">
                    {row.rincian.map((teks, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertOctagon className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
                        <span>{teks}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                ),
            },
            {
              key: "skorKepatuhan",
              header: "Skor Kepatuhan",
              render: (row) => (
                <Badge variant={getSkorBadgeVariant(row.skorKepatuhan)}>
                  <span className={getSkorColor(row.skorKepatuhan)}>
                    {row.skorKepatuhan}
                  </span>
                </Badge>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
          ]}
        />
      </Card>
    </div>
  );
}
