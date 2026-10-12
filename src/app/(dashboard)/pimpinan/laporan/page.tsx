"use client";

import { useState } from "react";
import {
  BarChart3,
  FileText,
  Download,
  Users,
  Ship,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Data Laporan Operasional ─────────────────────────────────────────────────
interface LaporanOperasional {
  id: string;
  bulan: string;
  totalOperasi: number;
  operasiBerhasil: number;
  operasiGagal: number;
  personelTerlibat: number;
  kendaraanTerpakai: number;
  perahuTerpakai: number;
  totalJamOperasi: number;
}

const laporanOperasionalData: LaporanOperasional[] = [
  {
    id: "lap-01",
    bulan: "Juli 2024",
    totalOperasi: 8,
    operasiBerhasil: 7,
    operasiGagal: 1,
    personelTerlibat: 32,
    kendaraanTerpakai: 5,
    perahuTerpakai: 2,
    totalJamOperasi: 48,
  },
  {
    id: "lap-02",
    bulan: "Agustus 2024",
    totalOperasi: 10,
    operasiBerhasil: 8,
    operasiGagal: 2,
    personelTerlibat: 40,
    kendaraanTerpakai: 7,
    perahuTerpakai: 3,
    totalJamOperasi: 65,
  },
  {
    id: "lap-03",
    bulan: "September 2024",
    totalOperasi: 12,
    operasiBerhasil: 10,
    operasiGagal: 2,
    personelTerlibat: 48,
    kendaraanTerpakai: 8,
    perahuTerpakai: 2,
    totalJamOperasi: 72,
  },
  {
    id: "lap-04",
    bulan: "Oktober 2024",
    totalOperasi: 8,
    operasiBerhasil: 7,
    operasiGagal: 1,
    personelTerlibat: 35,
    kendaraanTerpakai: 6,
    perahuTerpakai: 1,
    totalJamOperasi: 55,
  },
  {
    id: "lap-05",
    bulan: "November 2024",
    totalOperasi: 15,
    operasiBerhasil: 13,
    operasiGagal: 2,
    personelTerlibat: 60,
    kendaraanTerpakai: 10,
    perahuTerpakai: 4,
    totalJamOperasi: 95,
  },
  {
    id: "lap-06",
    bulan: "Desember 2024",
    totalOperasi: 11,
    operasiBerhasil: 9,
    operasiGagal: 2,
    personelTerlibat: 45,
    kendaraanTerpakai: 7,
    perahuTerpakai: 3,
    totalJamOperasi: 68,
  },
];

// ─── Data Analisis Trend ─────────────────────────────────────────────────────
const trendData = [
  { bulan: "Jul", operasi: 8, personel: 32, jam: 48 },
  { bulan: "Agu", operasi: 10, personel: 40, jam: 65 },
  { bulan: "Sep", operasi: 12, personel: 48, jam: 72 },
  { bulan: "Okt", operasi: 8, personel: 35, jam: 55 },
  { bulan: "Nov", operasi: 15, personel: 60, jam: 95 },
  { bulan: "Des", operasi: 11, personel: 45, jam: 68 },
];

// ─── Data Kategori Operasi ───────────────────────────────────────────────────
const kategoriOperasi = [
  { kategori: "Evakuasi Medis", jumlah: 12, persentase: 25 },
  { kategori: "Pencarian & Penyelamatan", jumlah: 18, persentase: 37.5 },
  { kategori: "Patroli Rutin", jumlah: 10, persentase: 20.8 },
  { kategori: "Sosialisasi & Pelatihan", jumlah: 6, persentase: 12.5 },
  { kategori: "Operasi Bencana", jumlah: 2, persentase: 4.2 },
];

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, trendValue }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {trend && trendValue && (
            <div className={cn("flex items-center gap-1 text-xs mt-1", trend === "up" ? "text-emerald-600" : "text-rose-600")}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [selectedYear, setSelectedYear] = useState("2024");

  const totalOperasi = laporanOperasionalData.reduce((sum, l) => sum + l.totalOperasi, 0);
  const totalBerhasil = laporanOperasionalData.reduce((sum, l) => sum + l.operasiBerhasil, 0);
  const totalPersonel = laporanOperasionalData.reduce((sum, l) => sum + l.personelTerlibat, 0);
  const totalJam = laporanOperasionalData.reduce((sum, l) => sum + l.totalJamOperasi, 0);

  const successRate = Math.round((totalBerhasil / totalOperasi) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan & Analisis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis operasional SAR dan kinerja personel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="2024">Tahun 2024</option>
            <option value="2025">Tahun 2025</option>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Operasi"
          value={totalOperasi}
          icon={Activity}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          trend="up"
          trendValue="12% dari semester lalu"
        />
        <StatCard
          label="Tingkat Keberhasilan"
          value={`${successRate}%`}
          icon={Target}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend="up"
          trendValue="5% peningkatan"
        />
        <StatCard
          label="Personel Terlibat"
          value={totalPersonel}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Jam Operasi"
          value={`${totalJam} jam`}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Trend Operasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Trend Operasi 6 Bulan Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendData.map((item) => (
              <div key={item.bulan} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-slate-700">{item.bulan}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{item.operasi} operasi</span>
                    <span className="text-xs font-medium text-slate-600">{item.jam} jam</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-linear-to-r from-primary to-primary-light transition-all"
                      style={{ width: `${(item.operasi / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Operasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Kategori Operasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kategoriOperasi.map((kategori) => (
                <div key={kategori.kategori} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{kategori.kategori}</span>
                      <span className="text-xs text-slate-500">{kategori.jumlah} operasi ({kategori.persentase}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${kategori.persentase}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performa Kendaraan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Performa Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Ship className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Perahu Karet</p>
                    <p className="text-xs text-slate-500">RIB 9M & 12M</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">12</p>
                  <p className="text-xs text-slate-500">perjalanan</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Kendaraan</p>
                    <p className="text-xs text-slate-500">Hilux & CRF</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">43</p>
                  <p className="text-xs text-slate-500">perjalanan</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Jam Personel</p>
                    <p className="text-xs text-slate-500">Total personel</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">260</p>
                  <p className="text-xs text-slate-500">jam operasi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Laporan Operasional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detail Laporan Operasional
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Bulan</TableHead>
                <TableHead className="text-center">Total Operasi</TableHead>
                <TableHead className="text-center">Berhasil</TableHead>
                <TableHead className="text-center">Gagal</TableHead>
                <TableHead className="text-center">Personel</TableHead>
                <TableHead className="text-center">Kendaraan</TableHead>
                <TableHead className="text-center">Jam Operasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanOperasionalData.map((laporan) => (
                <TableRow key={laporan.id}>
                  <TableCell className="font-medium text-slate-800">{laporan.bulan}</TableCell>
                  <TableCell className="text-center">{laporan.totalOperasi}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-emerald-600 font-medium">{laporan.operasiBerhasil}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-rose-600 font-medium">{laporan.operasiGagal}</span>
                  </TableCell>
                  <TableCell className="text-center">{laporan.personelTerlibat}</TableCell>
                  <TableCell className="text-center">{laporan.kendaraanTerpakai}</TableCell>
                  <TableCell className="text-center">{laporan.totalJamOperasi}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}