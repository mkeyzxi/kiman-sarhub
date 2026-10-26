"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Users,
  Ship,
  Package,
  Activity,
  ShieldCheck,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  hitungReadinessStats,
} from "@/components/shared/mock-data";
import {
  useRiwayatOperasi,
  useLogbooks,
  useAsets,
} from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
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
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  // Data master dari Supabase (fallback mock saat offline/gagal).
  const { data: riwayatOperasi } = useRiwayatOperasi();
  const { data: logbookPerjalananList, loading, error, refetch } = useLogbooks();
  const { data: asetList } = useAsets();

  // Readiness dihitung dari data aset Supabase (bukan mock statis).
  const readinessStats = hitungReadinessStats(asetList);

  if (loading) {
    return <DataLoading label="Menyiapkan laporan…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat data dari database"
      />
    );
  }

  // Rekap perjalanan diturunkan dari logbook agar angkanya selalu sinkron.
  const perjalananAir = logbookPerjalananList.filter(
    (l) =>
      l.kategoriUnit === "Kapal" ||
      l.kategoriUnit === "RIB" ||
      l.kategoriUnit === "RBB"
  ).length;
  const perjalananDarat = logbookPerjalananList.filter(
    (l) => l.kategoriUnit === "Mobil" || l.kategoriUnit === "Motor"
  ).length;
  const jamPersonel = Math.round(
    logbookPerjalananList.reduce((total, l) => {
      if (!l.jamKembali) return total;
      const [jamBerangkat, menitBerangkat] = l.jamBerangkat.split(":").map(Number);
      const [jamKembali, menitKembali] = l.jamKembali.split(":").map(Number);
      const durasiJam =
        (jamKembali * 60 + menitKembali - (jamBerangkat * 60 + menitBerangkat)) / 60;
      return total + (durasiJam > 0 ? durasiJam : 0) * l.jumlahPersonel;
    }, 0)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan & Analisis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Laporan kesiapan SAR dan rekap riwayat operasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="2026">Tahun 2026</option>
            <option value="2025">Tahun 2025</option>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards — Readiness focused */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Readiness Index"
          value={`${readinessStats.readinessIndex}%`}
          icon={Activity}
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          label="Aset Standby"
          value={`${readinessStats.standby}/${readinessStats.totalAset}`}
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Total Riwayat Operasi"
          value={riwayatOperasi.length}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Personel Standby"
          value={45}
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Riwayat Operasi — Event Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Riwayat Operasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riwayatOperasi.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Belum ada operasi tercatat</p>
              <p className="text-xs mt-1">Riwayat operasi akan muncul di sini setelah kejadian dicatat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {riwayatOperasi.map((op) => (
                <div key={op.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-xl font-bold text-slate-800">
                      {new Date(op.tanggal).getDate()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(op.tanggal).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{op.jenis}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {op.lokasi}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {op.durasi}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Users className="h-3 w-3" /> {op.personel} personel
                      </span>
                    </div>
                    {op.keterangan && (
                      <p className="text-xs text-slate-400 mt-2">{op.keterangan}</p>
                    )}
                  </div>
                  <Badge variant={op.hasil === "Berhasil" ? "success" : op.hasil === "Sebagian Berhasil" ? "warning" : "danger"} className="shrink-0">
                    {op.hasil}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performa Unit — Dipertahankan */}
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
                  <p className="text-sm font-medium text-slate-800">Kapal & Perahu Karet</p>
                  <p className="text-xs text-slate-500">Kapal, RIB & RBB</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">{perjalananAir}</p>
                <p className="text-xs text-slate-500">perjalanan</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Kendaraan Darat</p>
                  <p className="text-xs text-slate-500">Mobil & Motor</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">{perjalananDarat}</p>
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
                  <p className="text-xs text-slate-500">Total kumulatif</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">{jamPersonel}</p>
                <p className="text-xs text-slate-500">jam operasi</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}