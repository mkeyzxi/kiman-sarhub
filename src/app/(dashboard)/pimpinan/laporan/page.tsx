"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Users,
  Ship,
  Package,
  Activity,
  ShieldCheck,
  Clock,
  File,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  hitungReadinessStats,
  hitungStatusAsetLive,
} from "@/components/shared/mock-data";
import {
  useLogbooks,
  useAsets,
  useSupabaseUsers,
} from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  eksporLaporanExcel,
  eksporLaporanCSV,
} from "@/lib/export-laporan";
import { eksporLaporanPDF } from "@/lib/export-laporan-pdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  // Data master dari Supabase — tanpa fallback mock.
  const { data: logbookPerjalananList, loading, error, refetch } = useLogbooks();
  const { data: asetList } = useAsets();
  // Data personel: akun aktif dari tabel `users` Supabase — menggantikan
  // angka hardcode 45 yang tidak terhubung data mana pun.
  const { data: daftarUsers, loading: usersLoading } = useSupabaseUsers();

  // Readiness dihitung dari data aset Supabase (bukan mock statis) dengan
  // status live — "Sedang digunakan" diturunkan dari logbook yang belum
  // kembali, sama seperti dashboard /operator dan /pimpinan.
  const statusLive = hitungStatusAsetLive(asetList, logbookPerjalananList);
  const asetLive = asetList.map((aset) => ({
    ...aset,
    status: statusLive[aset.id] ?? aset.status,
  }));
  const readinessStats = hitungReadinessStats(asetLive);
  const personelAktif = (daftarUsers ?? []).filter((u) => u.aktif).length;

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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Laporan & Analisis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Laporan kesiapan SAR dan rekap riwayat perjalanan
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="2026">Tahun 2026</option>
            <option value="2025">Tahun 2025</option>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2">
              <Download className="h-4 w-4" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent className="absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <DropdownMenuItem
                onSelect={() =>
                  void eksporLaporanExcel({
                    tahun: selectedYear,
                    readinessStats,
                    asets: asetLive,
                    logbookPerjalanan: logbookPerjalananList,
                    daftarUsers: daftarUsers ?? [],
                    personelAktif,
                  })
                }
                className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Unduh sebagai Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  eksporLaporanPDF({
                    tahun: selectedYear,
                    readinessStats,
                    asets: asetLive,
                    logbookPerjalanan: logbookPerjalananList,
                    daftarUsers: daftarUsers ?? [],
                    personelAktif,
                  })
                }
                className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                <File className="h-4 w-4 text-slate-400" />
                Unduh sebagai PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  eksporLaporanCSV({
                    tahun: selectedYear,
                    readinessStats,
                    asets: asetLive,
                    logbookPerjalanan: logbookPerjalananList,
                    daftarUsers: daftarUsers ?? [],
                    personelAktif,
                  })
                }
                className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                <Package className="h-4 w-4 text-slate-400" />
                Unduh sebagai CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards — Readiness focused */}
      <div className="sm:grid sm:grid-cols-4 gap-4 grid grid-cols-1 sm:grid-cols-2">
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
          label="Total Perjalanan"
          value={logbookPerjalananList.length}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Personel Aktif"
          value={usersLoading ? "…" : personelAktif}
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Riwayat Perjalanan — Event Log dari logbook */}
      <div className="sm:px-2">
        <div className="sm:flex sm:items-center sm:justify-between sm:mb-3">
          <div className="sm:flex sm:items-center sm:gap-2">
            <FileText className="sm:h-5 sm:w-5 sm:text-primary" />
            <h2 className="sm:text-base sm:font-semibold sm:text-slate-800">Riwayat Perjalanan</h2>
          </div>
          <p className="text-xs text-slate-400 sm:mt-0 mt-2">
            {logbookPerjalananList.length} perjalanan tercatat
          </p>
        </div>
        {logbookPerjalananList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center sm:p-10">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              Belum ada perjalanan tercatat di database
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">
              Riwayat perjalanan muncul otomatis dari logbook. Cara menambah:
            </p>
            <div className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/operator/logbook/tambah"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
              >
                Tambah Logbook Perjalanan
              </Link>
            </div>
          </div>
        ) : (
          <div className="sm:space-y-3 space-y-2">
            {logbookPerjalananList.map((lp) => (
              <Link
                key={lp.id}
                href={`/operator/logbook/${lp.id}`}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-slate-100/60 transition-colors"
              >
                <div className="text-center shrink-0 w-14">
                  <p className="text-xl font-bold text-slate-800">
                    {new Date(lp.tanggal).getDate()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(lp.tanggal).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {lp.kategoriUnit ? `${lp.kategoriUnit} · ` : ""}{lp.jenisUnit}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {lp.rute}{lp.tujuan ? ` → ${lp.tujuan}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                    {lp.jamBerangkat && lp.jamKembali && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {lp.jamBerangkat}–{lp.jamKembali}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3" /> {lp.jumlahPersonel} personel
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Ship className="h-3 w-3" /> {lp.nahkoda}
                    </span>
                  </div>
                  {lp.catatan && (
                    <p className="text-xs text-slate-400 mt-2 truncate">{lp.catatan}</p>
                  )}
                </div>
                <Badge
                  variant={lp.status === "Selesai" ? "success" : lp.status === "Sedang Digunakan" ? "warning" : "outline"}
                  className="shrink-0"
                >
                  {lp.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Performa Unit — Dipertahankan */}
      <div className="sm:px-2">
        <div className="sm:flex sm:items-center sm:gap-2 sm:mb-3">
          <Package className="sm:h-5 sm:w-5 sm:text-primary" />
          <h2 className="sm:text-base sm:font-semibold sm:text-slate-800">Performa Unit</h2>
        </div>
        <div className="sm:space-y-3 space-y-2">
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
      </div>
    </div>
  );
}