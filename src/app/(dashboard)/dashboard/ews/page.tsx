"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Loader,
  CheckCircle2,
  Eye,
} from "lucide-react";
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
  ewsTickets,
  getAsetById,
  formatTanggal,
  type StatusTicket,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<StatusTicket, "warning" | "default" | "success"> = {
  Menunggu: "warning",
  Diproses: "default",
  Selesai: "success",
};

const severityBadgeVariant: Record<string, "success" | "warning" | "danger"> = {
  Rendah: "success",
  Sedang: "warning",
  Tinggi: "danger",
};

export default function EWSPage() {
  const [activeTab, setActiveTab] = useState("Semua");

  const filteredTickets =
    activeTab === "Semua"
      ? ewsTickets
      : ewsTickets.filter((t) => t.status === activeTab);

  const totalTiket = ewsTickets.length;
  const menunggu = ewsTickets.filter((t) => t.status === "Menunggu").length;
  const diproses = ewsTickets.filter((t) => t.status === "Diproses").length;
  const selesai = ewsTickets.filter((t) => t.status === "Selesai").length;

  const stats = [
    {
      label: "Total Tiket",
      value: totalTiket,
      icon: AlertTriangle,
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
      label: "Diproses",
      value: diproses,
      icon: Loader,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
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
        <h1 className="text-2xl font-bold text-slate-800">
          Early Warning System
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau dan tindaklanjut laporan kerusakan aset secara dini
        </p>
      </div>

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

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Semua">Semua</TabsTrigger>
          <TabsTrigger value="Menunggu">Menunggu</TabsTrigger>
          <TabsTrigger value="Diproses">Diproses</TabsTrigger>
          <TabsTrigger value="Selesai">Selesai</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>ID Tiket</TableHead>
              <TableHead>Aset</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Tingkat Keparahan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => {
              const aset = getAsetById(ticket.asetId);
              return (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {ticket.id.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-[160px] truncate">
                    {aset?.nama ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 max-w-[240px] truncate">
                    {ticket.judul}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityBadgeVariant[ticket.tingkatKeparahan]}>
                      {ticket.tingkatKeparahan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[ticket.status]}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatTanggal(ticket.tanggalBuat)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Link href={`/dashboard/ews/${ticket.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredTickets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  Tidak ada tiket yang ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
