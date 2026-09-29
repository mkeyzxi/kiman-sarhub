"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  ShieldAlert,
} from "lucide-react";
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
import {
  readinessStats,
  asetList,
  type KategoriAset,
} from "@/components/shared/mock-data";

const kategoriColors: Record<KategoriAset, string> = {
  Kendaraan: "bg-blue-500",
  "Peralatan SAR": "bg-primary",
  Komunikasi: "bg-violet-500",
  Medis: "bg-emerald-500",
  Dokumentasi: "bg-amber-500",
};

export default function ExecutivePage() {
  const stats = [
    {
      label: "Total Aset",
      value: readinessStats.totalAset,
      icon: Package,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Siaga",
      value: readinessStats.siaga,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Dipinjam",
      value: readinessStats.dipinjam,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Rusak",
      value: readinessStats.rusak,
      icon: Wrench,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  const alertAset = asetList.filter(
    (a) => a.status === "Rusak" || a.status === "Maintenance"
  );

  const readinessColor =
    readinessStats.readinessIndex >= 95
      ? "bg-emerald-500"
      : readinessStats.readinessIndex >= 80
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Live Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau kesiapan dan status aset SAR secara real-time
        </p>
      </div>

      {/* Readiness Index */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Readiness Index</p>
              <p className="text-3xl font-bold text-slate-800">
                {readinessStats.readinessIndex}%
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Target: 95%</span>
              {readinessStats.readinessIndex < 95 && (
                <Badge variant="danger">Di bawah target</Badge>
              )}
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${readinessColor}`}
                style={{ width: `${readinessStats.readinessIndex}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Kesiapan per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle>Kesiapan per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Siaga</TableHead>
                <TableHead className="w-[30%]">Persentase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readinessStats.kesiapanPerKategori.map((kategori) => (
                <TableRow key={kategori.kategori}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${kategoriColors[kategori.kategori]}`}
                      />
                      <span className="font-medium text-slate-800">
                        {kategori.kategori}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {kategori.total}
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {kategori.siaga}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            kategori.persentase >= 95
                              ? "bg-emerald-500"
                              : kategori.persentase >= 70
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${kategori.persentase}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-12 text-right">
                        {kategori.persentase}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Alert Perlu Perhatian</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertAset.map((aset) => (
              <div
                key={aset.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      aset.status === "Rusak" ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {aset.nama}
                    </p>
                    <p className="text-xs text-slate-500">
                      {aset.kode} — {aset.lokasi}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={aset.status === "Rusak" ? "danger" : "warning"}
                >
                  {aset.status}
                </Badge>
              </div>
            ))}
            {alertAset.length === 0 && (
              <p className="text-center py-4 text-slate-500">
                Tidak ada aset yang perlu perhatian
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
