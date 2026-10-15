"use client";

import { Users, TrendingUp, AlertOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import {
  complianceRanking,
  getUserById,
} from "@/components/shared/mock-data";

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

export default function AuditPage() {
  const totalPersonel = complianceRanking.length;
  const rataSkor = Math.round(
    complianceRanking.reduce((sum, p) => sum + p.skorKepatuhan, 0) /
      totalPersonel
  );
  const pelanggaran = complianceRanking.reduce(
    (sum, p) => sum + p.telatKembali + p.abaikanChecklist,
    0
  );

  // Diurutkan dari skor tertinggi, dengan peringkat yang sudah dilampirkan.
  const ranking = [...complianceRanking]
    .sort((a, b) => b.skorKepatuhan - a.skorKepatuhan)
    .map((item, i) => ({ ...item, rank: i + 1 }));

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
      value: pelanggaran,
      icon: AlertOctagon,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit Kepatuhan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluasi kepatuhan personel terhadap prosedur operasional SAR
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
          cardSubtitle={(row) => getUserById(row.personelId)?.role ?? "-"}
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
              key: "role",
              header: "Jabatan",
              render: (row) => (
                <Badge variant="outline">{getUserById(row.personelId)?.role ?? "-"}</Badge>
              ),
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
