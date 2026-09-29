"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Clock, CheckCircle2, XCircle } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import {
  getUserById,
  formatTanggal,
} from "@/components/shared/mock-data";

interface ApprovalItem {
  id: string;
  kode: string;
  namaAset: string;
  kategori: string;
  pengajuanOleh: string;
  tanggal: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
}

const approvalData: ApprovalItem[] = [
  {
    id: "apr-001",
    kode: "BMN-SAR-005",
    namaAset: "Chain Stihl MS 261",
    kategori: "Peralatan SAR",
    pengajuanOleh: "usr-001",
    tanggal: "2026-09-26",
    status: "Menunggu",
  },
  {
    id: "apr-002",
    kode: "BMN-KOM-003",
    namaAset: "Thermal Imaging Camera FLIR",
    kategori: "Komunikasi",
    pengajuanOleh: "usr-001",
    tanggal: "2026-09-21",
    status: "Ditolak",
  },
  {
    id: "apr-003",
    kode: "BMN-MED-003",
    namaAset: "Tabung Oksigen 10L",
    kategori: "Medis",
    pengajuanOleh: "usr-002",
    tanggal: "2026-09-24",
    status: "Disetujui",
  },
  {
    id: "apr-004",
    kode: "BMN-DOK-003",
    namaAset: "Kamera GoPro Hero 12",
    kategori: "Dokumentasi",
    pengajuanOleh: "usr-003",
    tanggal: "2026-09-22",
    status: "Disetujui",
  },
  {
    id: "apr-005",
    kode: "BMN-KND-003",
    namaAset: "Motor Honda CRF250R",
    kategori: "Kendaraan",
    pengajuanOleh: "usr-001",
    tanggal: "2026-09-20",
    status: "Menunggu",
  },
];

const statusBadgeVariant: Record<
  ApprovalItem["status"],
  "warning" | "success" | "danger"
> = {
  Menunggu: "warning",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function ApprovalPage() {
  const [approvals] = useState<ApprovalItem[]>(approvalData);

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

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Kode</TableHead>
              <TableHead>Nama Aset</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Pengajuan Oleh</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => {
              const user = getUserById(approval.pengajuanOleh);
              return (
                <TableRow key={approval.id}>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {approval.kode}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {approval.namaAset}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{approval.kategori}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {user?.nama ?? "-"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatTanggal(approval.tanggal)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[approval.status]}>
                      {approval.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Link href={`/dashboard/executive/approval/${approval.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {approvals.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  Tidak ada data approval
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
