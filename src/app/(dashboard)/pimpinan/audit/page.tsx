"use client";

import { Users, TrendingUp, AlertOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
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
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-center">Ranking</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead className="text-center">Telat Kembali</TableHead>
              <TableHead className="text-center">Abaikan Checklist</TableHead>
              <TableHead className="text-center">Skor Kepatuhan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complianceRanking
              .sort((a, b) => b.skorKepatuhan - a.skorKepatuhan)
              .map((personel, index) => {
                const user = getUserById(personel.personelId);
                return (
                  <TableRow key={personel.personelId}>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-primary text-white"
                            : index === 1
                              ? "bg-slate-200 text-slate-700"
                              : index === 2
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {personel.nama}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user?.role ?? "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-medium ${
                          personel.telatKembali > 0
                            ? "text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        {personel.telatKembali}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-medium ${
                          personel.abaikanChecklist > 0
                            ? "text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        {personel.abaikanChecklist}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getSkorBadgeVariant(personel.skorKepatuhan)}>
                        <span className={getSkorColor(personel.skorKepatuhan)}>
                          {personel.skorKepatuhan}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
