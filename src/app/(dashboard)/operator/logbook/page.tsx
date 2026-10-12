"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ship,
  FileText,
  Plus,
  Search,
  Eye,
  Clock,
  MapPin,
  Fuel,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Data Logbook Perjalanan ─────────────────────────────────────────────────
interface LogbookPerjalanan {
  id: string;
  tanggal: string;
  jamBerangkat: string;
  jamKembali: string;
  rute: string;
  tujuan: string;
  jenisUnit: string;
  nahkoda: string;
  jumlahPersonel: number;
  bbmSebelum: string;
  bbmSesudah: string;
  status: "Selesai" | "Berlangsung" | "Dijadwalkan";
  catatan: string;
}

const logbookPerjalananData: LogbookPerjalanan[] = [
  {
    id: "lp-01",
    tanggal: "2026-10-08",
    jamBerangkat: "08:00",
    jamKembali: "10:30",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    jenisUnit: "RIB 9 M",
    nahkoda: "Siti Nurhaliza",
    jumlahPersonel: 4,
    bbmSebelum: "90%",
    bbmSesudah: "75%",
    status: "Selesai",
    catatan: "Kondisi laut normal, tidak ada insiden",
  },
  {
    id: "lp-02",
    tanggal: "2026-10-08",
    jamBerangkat: "11:00",
    jamKembali: "13:00",
    rute: "Perairan Mamuju - Pantai Karampuang",
    tujuan: "Sosialisasi SAR",
    jenisUnit: "RIB 12 M",
    nahkoda: "Ahmad Fauzi",
    jumlahPersonel: 5,
    bbmSebelum: "85%",
    bbmSesudah: "65%",
    status: "Selesai",
    catatan: "Sosialisasi keselamatan pantai kepada nelayan",
  },
  {
    id: "lp-03",
    tanggal: "2026-10-07",
    jamBerangkat: "09:00",
    jamKembali: "12:00",
    rute: "Dermaga Mamuju - Perairan Binanga",
    tujuan: "Operasi evakuasi",
    jenisUnit: "RIB 9 M",
    nahkoda: "Dewi Lestari",
    jumlahPersonel: 6,
    bbmSebelum: "95%",
    bbmSesudah: "60%",
    status: "Selesai",
    catatan: "Evakuasi korban tenggelam, 2 orang selamat",
  },
  {
    id: "lp-04",
    tanggal: "2026-10-07",
    jamBerangkat: "14:00",
    jamKembali: "16:00",
    rute: "Perairan Mamuju - Pos Pantai",
    tujuan: "Patroli pantai",
    jenisUnit: "RIB 12 M",
    nahkoda: "Budi Santoso",
    jumlahPersonel: 3,
    bbmSebelum: "80%",
    bbmSesudah: "70%",
    status: "Selesai",
    catatan: "Pantai ramai pengunjung, kondisi aman",
  },
  {
    id: "lp-05",
    tanggal: "2026-10-06",
    jamBerangkat: "08:30",
    jamKembali: "11:30",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Latihan SAR",
    jenisUnit: "RIB 9 M",
    nahkoda: "Medlyn R. Pagali",
    jumlahPersonel: 8,
    bbmSebelum: "100%",
    bbmSesudah: "70%",
    status: "Selesai",
    catatan: "Latihan teknik penyelamatan korban di air",
  },
  {
    id: "lp-06",
    tanggal: "2026-10-09",
    jamBerangkat: "08:00",
    jamKembali: "",
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    jenisUnit: "RIB 12 M",
    nahkoda: "Kauluddin",
    jumlahPersonel: 4,
    bbmSebelum: "88%",
    bbmSesudah: "",
    status: "Berlangsung",
    catatan: "Sedang dalam perjalanan",
  },
  {
    id: "lp-07",
    tanggal: "2026-10-09",
    jamBerangkat: "14:00",
    jamKembali: "",
    rute: "Perairan Mamuju - Pos Pantai",
    tujuan: "Patroli sore",
    jenisUnit: "RIB 9 M",
    nahkoda: "Rizky Pratama",
    jumlahPersonel: 3,
    bbmSebelum: "85%",
    bbmSesudah: "",
    status: "Dijadwalkan",
    catatan: "Dijadwalkan untuk shift sore",
  },
];

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, subText }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subText?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {subText && <p className="text-xs text-slate-400">{subText}</p>}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LogbookPerjalananPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const filteredLogbook = logbookPerjalananData.filter((log) => {
    const matchSearch =
      log.rute.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.jenisUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.nahkoda.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "Semua" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPerjalanan = logbookPerjalananData.length;
  const perjalananSelesai = logbookPerjalananData.filter((l) => l.status === "Selesai").length;
  const perjalananBerlangsung = logbookPerjalananData.filter((l) => l.status === "Berlangsung").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Logbook Perjalanan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Catatan perjalanan operasional SAR
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Tambah Logbook
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Perjalanan"
          value={totalPerjalanan}
          icon={Ship}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          subText="Bulan ini"
        />
        <StatCard
          label="Selesai"
          value={perjalananSelesai}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Berlangsung"
          value={perjalananBerlangsung}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari rute, tujuan, atau nahkoda..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Berlangsung">Berlangsung</option>
            <option value="Dijadwalkan">Dijadwalkan</option>
          </Select>
        </div>
      </Card>

      {/* Tabel Logbook */}
      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Rute / Tujuan</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Nahkoda</TableHead>
                <TableHead className="text-center">Personel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogbook.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-slate-700">{log.tanggal}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-mono">{log.jamBerangkat}</p>
                      {log.jamKembali && <p className="text-slate-400 font-mono">{log.jamKembali}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{log.rute}</p>
                      <p className="text-xs text-slate-500">{log.tujuan}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{log.jenisUnit}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-700">{log.nahkoda}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span className="text-sm">{log.jumlahPersonel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "Selesai" ? "success" : log.status === "Berlangsung" ? "warning" : "default"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogbook.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Tidak ada logbook yang ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Logbook Terbaru */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detail Logbook Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logbookPerjalananData[0] && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">Tanggal</p>
                  <p className="font-medium text-slate-800">{logbookPerjalananData[0].tanggal}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Jam Berangkat</p>
                  <p className="font-medium text-slate-800">{logbookPerjalananData[0].jamBerangkat}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Jam Kembali</p>
                  <p className="font-medium text-slate-800">{logbookPerjalananData[0].jamKembali || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Unit</p>
                  <p className="font-medium text-slate-800">{logbookPerjalananData[0].jenisUnit}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Rute</p>
                  <p className="text-sm font-medium text-slate-800">{logbookPerjalananData[0].rute}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Tujuan</p>
                  <p className="text-sm font-medium text-slate-800">{logbookPerjalananData[0].tujuan}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Nahkoda</p>
                  <p className="text-sm font-medium text-slate-800">{logbookPerjalananData[0].nahkoda}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Jumlah Personel</p>
                  <p className="text-sm font-medium text-slate-800">{logbookPerjalananData[0].jumlahPersonel} orang</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Catatan</p>
                <p className="text-sm text-blue-800">{logbookPerjalananData[0].catatan}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}