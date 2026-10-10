"use client";

import Link from "next/link";
import {
  Map,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ship,
  Package,
  Users,
  Fuel,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShieldCheck,
  ClipboardList,
  Eye,
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
import {
  readinessStats,
  asetList,
  complianceRanking,
  notifikasiList,
  formatTanggal,
  getUserById,
  logAktivitas,
} from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";

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
          {trend && (
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

// ─── Data Peta Kesiapsiagaan ─────────────────────────────────────────────────
const petaKesiapsiagaan = [
  {
    id: "lok-01",
    nama: "Pos SAR Mamuju",
    lat: -2.6745,
    lng: 118.8885,
    status: "Aktif",
    personel: 5,
    kendaraan: 2,
    perahu: 1,
  },
  {
    id: "lok-02",
    nama: "Basecamp Binanga",
    lat: -2.7123,
    lng: 118.9234,
    status: "Aktif",
    personel: 3,
    kendaraan: 1,
    perahu: 1,
  },
  {
    id: "lok-03",
    nama: "Pos Pantai Karampuang",
    lat: -2.5890,
    lng: 118.8456,
    status: "Standby",
    personel: 2,
    kendaraan: 1,
    perahu: 0,
  },
  {
    id: "lok-04",
    nama: "Pos Pegunungan",
    lat: -2.7456,
    lng: 118.9567,
    status: "Aktif",
    personel: 4,
    kendaraan: 2,
    perahu: 0,
  },
];

// ─── Data Laporan ─────────────────────────────────────────────────────────────
const laporanBulanan = [
  {
    id: "lap-01",
    bulan: "September 2024",
    totalOperasi: 12,
    operasiBerhasil: 10,
    operasiGagal: 2,
    personelTerlibat: 45,
    kendaraanTerpakai: 8,
  },
  {
    id: "lap-02",
    bulan: "Oktober 2024",
    totalOperasi: 8,
    operasiBerhasil: 7,
    operasiGagal: 1,
    personelTerlibat: 32,
    kendaraanTerpakai: 6,
  },
  {
    id: "lap-03",
    bulan: "November 2024",
    totalOperasi: 15,
    operasiBerhasil: 13,
    operasiGagal: 2,
    personelTerlibat: 58,
    kendaraanTerpakai: 10,
  },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PimpinanPage() {
  const asetSiaga = readinessStats.siaga;
  const totalAset = readinessStats.totalAset;
  const readinessIndex = readinessStats.readinessIndex;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Pimpinan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoring kesiapan SAR dan laporan operasional
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Readiness Index"
          value={`${readinessIndex}%`}
          icon={Activity}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          trend="up"
          trendValue="2.3% dari bulan lalu"
        />
        <StatCard
          label="Aset Siaga"
          value={`${asetSiaga}/${totalAset}`}
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Operasi Bulan Ini"
          value={12}
          icon={Ship}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend="up"
          trendValue="3 operasi baru"
        />
        <StatCard
          label="Personel Siaga"
          value={45}
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Kesiapan per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Kesiapan per Kategori Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readinessStats.kesiapanPerKategori.map((kategori) => (
              <div key={kategori.kategori} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-slate-700">{kategori.kategori}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{kategori.siaga}/{kategori.total} siaga</span>
                    <span className={cn("text-xs font-medium", kategori.persentase >= 80 ? "text-emerald-600" : kategori.persentase >= 50 ? "text-amber-600" : "text-rose-600")}>
                      {kategori.persentase}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={cn("h-2.5 rounded-full transition-all", kategori.persentase >= 80 ? "bg-emerald-500" : kategori.persentase >= 50 ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${kategori.persentase}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peta Kesiapsiagaan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Peta Kesiapsiagaan
              </CardTitle>
              <Link href="/pimpinan/peta">
                <Button variant="ghost" size="sm">
                  Lihat Peta
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {petaKesiapsiagaan.map((lokasi) => (
                <div key={lokasi.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", lokasi.status === "Aktif" ? "bg-emerald-500" : "bg-amber-500")} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{lokasi.nama}</p>
                      <p className="text-xs text-slate-500">
                        {lokasi.personel} personel • {lokasi.kendaraan} kendaraan
                      </p>
                    </div>
                  </div>
                  <Badge variant={lokasi.status === "Aktif" ? "success" : "warning"}>
                    {lokasi.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Laporan Bulanan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Laporan Bulanan
              </CardTitle>
              <Link href="/pimpinan/laporan">
                <Button variant="ghost" size="sm">
                  Detail
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {laporanBulanan.map((laporan) => (
                <div key={laporan.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-800">{laporan.bulan}</h3>
                    <Badge variant="outline">{laporan.totalOperasi} Operasi</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Berhasil</p>
                      <p className="font-semibold text-emerald-600">{laporan.operasiBerhasil}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Gagal</p>
                      <p className="font-semibold text-rose-600">{laporan.operasiGagal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Personel</p>
                      <p className="font-semibold text-slate-700">{laporan.personelTerlibat}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Ranking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Kepatuhan Personel
            </CardTitle>
            <Link href="/pimpinan/audit">
              <Button variant="ghost" size="sm">
                Detail Audit
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12 text-center">Rank</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead className="text-center">Telat Kembali</TableHead>
                <TableHead className="text-center">Abaikan Checklist</TableHead>
                <TableHead className="text-center">Skor</TableHead>
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
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                          index === 0 ? "bg-primary text-white" : index === 1 ? "bg-slate-200 text-slate-700" : index === 2 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{personel.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user?.role ?? "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-medium", personel.telatKembali > 0 ? "text-rose-600" : "text-slate-600")}>
                          {personel.telatKembali}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-medium", personel.abaikanChecklist > 0 ? "text-rose-600" : "text-slate-600")}>
                          {personel.abaikanChecklist}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={personel.skorKepatuhan >= 90 ? "success" : personel.skorKepatuhan >= 75 ? "warning" : "danger"}>
                          {personel.skorKepatuhan}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notifikasi Terbaru */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Notifikasi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifikasiList.slice(0, 5).map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2 shrink-0",
                  notif.tipe === "danger" ? "bg-rose-500" : notif.tipe === "warning" ? "bg-amber-500" : notif.tipe === "success" ? "bg-emerald-500" : "bg-blue-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{notif.judul}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{notif.pesan}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatTanggal(notif.tanggal)}</p>
                </div>
                {!notif.dibaca && (
                  <Badge variant="default" className="text-xs">Baru</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Aktivitas Terbaru */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Log Aktivitas Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logAktivitas.slice(0, 8).map((log) => {
              const user = getUserById(log.userId);
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user?.nama?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">{user?.nama}</span>
                      {" "}<span className="text-slate-500">{log.aksi.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{log.detail}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTanggal(log.tanggal)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}