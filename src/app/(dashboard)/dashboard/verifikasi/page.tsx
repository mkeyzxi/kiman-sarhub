"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Clock, CheckCircle2, FileText } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  antreanVerifikasi,
  formatTanggal,
  type StatusVerifikasi,
  type TipeVerifikasi,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<
  StatusVerifikasi,
  "warning" | "success" | "danger"
> = {
  Menunggu: "warning",
  Disetujui: "success",
  Ditolak: "danger",
};

const tipeBadgeVariant: Record<TipeVerifikasi, "default" | "outline"> = {
  "Draf Aset": "default",
  "Laporan Kerusakan": "outline",
};

const filterTabs = ["Semua", "Draf Aset", "Laporan Kerusakan"] as const;

export default function VerifikasiPage() {
  const [activeTab, setActiveTab] = useState<string>("Semua");

  const filteredItems =
    activeTab === "Semua"
      ? antreanVerifikasi
      : antreanVerifikasi.filter((item) => item.tipe === activeTab);

  const totalAntrean = antreanVerifikasi.length;
  const menunggu = antreanVerifikasi.filter(
    (item) => item.status === "Menunggu"
  ).length;
  const selesai = antreanVerifikasi.filter(
    (item) => item.status === "Disetujui" || item.status === "Ditolak"
  ).length;

  const stats = [
    {
      label: "Total Antrean",
      value: totalAntrean,
      icon: FileText,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Menunggu",
      value: menunggu,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Selesai",
      value: selesai,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Antrean Verifikasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola dan verifikasi pengajuan aset serta laporan kerusakan
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

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {filterTabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>ID</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs text-slate-600">
                  {item.id.toUpperCase()}
                </TableCell>
                <TableCell>
                  <Badge variant={tipeBadgeVariant[item.tipe]}>
                    {item.tipe}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-800 max-w-[280px] truncate">
                  {item.judul}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[item.status]}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">
                  {formatTanggal(item.tanggalBuat)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Link href={`/dashboard/verifikasi/${item.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  Tidak ada antrean yang ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
