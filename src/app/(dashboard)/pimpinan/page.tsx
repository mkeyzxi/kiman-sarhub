"use client";

import { useState } from "react";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  ShieldCheck,
  Users,
  ClipboardList,
  Clock,
  ArrowUpRight,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import {
  readinessStats,
  asetList,
  complianceRanking,
  notifikasiList,
  formatTanggal,
  getUserById,
  logAktivitas,
  riwayatOperasi,
  type StatusAset,
} from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";

const statusAsetVariant: Record<
  StatusAset,
  "success" | "default" | "warning" | "danger" | "outline"
> = {
  Siaga: "success",
  Operasi: "default",
  Dipinjam: "warning",
  Maintenance: "warning",
  Rusak: "danger",
  "Tidak Siap": "danger",
};

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
export default function PimpinanPage() {
  const [asetFilter, setAsetFilter] = useState<"Semua" | "Siaga" | "Belum Lengkap">("Semua");

  const asetSiaga = readinessStats.siaga;
  const totalAset = readinessStats.totalAset;
  const readinessIndex = readinessStats.readinessIndex;

  // Status aset yang dihitung "lengkap" = benar-benar siap operasional.
  const SIAGA = ["Siaga", "Operasi"] as const;
  const filteredAset = asetList.filter((aset) => {
    if (asetFilter === "Siaga") return SIAGA.includes(aset.status as (typeof SIAGA)[number]);
    if (asetFilter === "Belum Lengkap") return !SIAGA.includes(aset.status as (typeof SIAGA)[number]);
    return true;
  });

  // Diurutkan dari skor tertinggi, dengan peringkat yang sudah dilampirkan.
  const ranking = [...complianceRanking]
    .sort((a, b) => b.skorKepatuhan - a.skorKepatuhan)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Pimpinan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoring kesiapsiagaan SAR dan catatan operasional
        </p>
      </div>

      {/* Stats Cards — 3 kartu readiness, tanpa angka operasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Readiness Index"
          value={`${readinessIndex}%`}
          icon={Activity}
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          label="Aset Siaga"
          value={`${asetSiaga}/${totalAset}`}
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Personel Siaga"
          value={45}
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Rincian Aset Siaga &amp; Tidak Lengkap */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Rincian Kesiapan Aset
            </CardTitle>
            <div className="flex flex-wrap gap-1">
              {(["Semua", "Siaga", "Belum Lengkap"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAsetFilter(f)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    asetFilter === f
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveTable
            data={filteredAset}
            getKey={(row) => row.id}
            cardTitle={(row) => row.nama}
            cardSubtitle={(row) => `${row.kode} \u00b7 ${row.kategori}`}
            cardBadge={(row) => (
              <Badge variant={statusAsetVariant[row.status]} className="text-xs">
                {row.status}
              </Badge>
            )}
            cardPreviewCount={1}
            detailLabel="Lihat detail aset"
            emptyMessage="Tidak ada aset pada filter ini."
            fields={[
              {
                key: "kode",
                header: "Kode",
                render: (row) => row.kode,
                headClassName: "w-32",
                cellClassName: "font-mono text-xs text-slate-600",
              },
              {
                key: "nama",
                header: "Nama Aset",
                render: (row) => (
                  <Link
                    href={`/bmn/${row.id}`}
                    className="font-medium text-slate-800 hover:text-primary hover:underline"
                  >
                    {row.nama}
                  </Link>
                ),
                hideOnCard: true,
              },
              {
                key: "kategori",
                header: "Kategori",
                render: (row) => (
                  <Badge variant="outline" className="text-xs">
                    {row.kategori}
                  </Badge>
                ),
                headClassName: "w-36",
              },
              {
                key: "kondisi",
                header: "Kondisi",
                render: (row) => (
                  <Badge
                    variant={
                      row.kondisi === "Baik"
                        ? "success"
                        : row.kondisi === "Rusak Ringan"
                          ? "warning"
                          : "danger"
                    }
                    className="text-xs"
                  >
                    {row.kondisi}
                  </Badge>
                ),
                headClassName: "w-28",
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={statusAsetVariant[row.status]} className="text-xs">
                    {row.status}
                  </Badge>
                ),
                headClassName: "w-32",
                hideOnCard: true,
              },
            ]}
          />
        </CardContent>
      </Card>

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
          <ResponsiveTable
            data={ranking}
            getKey={(row) => row.personelId}
            cardTitle={(row) => row.nama}
            cardSubtitle={(row) => getUserById(row.personelId)?.role ?? "-"}
            cardBadge={(row) => (
              <Badge
                variant={
                  row.skorKepatuhan >= 90
                    ? "success"
                    : row.skorKepatuhan >= 75
                      ? "warning"
                      : "danger"
                }
              >
                Skor {row.skorKepatuhan}
              </Badge>
            )}
            cardPreviewCount={2}
            detailLabel="Lihat detail kepatuhan"
            emptyMessage="Belum ada data kepatuhan."
            fields={[
              {
                key: "rank",
                header: "Rank",
                render: (row) => (
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      row.rank === 1
                        ? "bg-primary text-white"
                        : row.rank === 2
                          ? "bg-slate-200 text-slate-700"
                          : row.rank === 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {row.rank}
                  </span>
                ),
                headClassName: "w-12 text-center",
                cellClassName: "text-center",
              },
              {
                key: "nama",
                header: "Nama",
                render: (row) => row.nama,
                cellClassName: "font-medium text-slate-800",
                hideOnCard: true,
              },
              {
                key: "role",
                header: "Jabatan",
                render: (row) => (
                  <Badge variant="outline">{getUserById(row.personelId)?.role ?? "-"}</Badge>
                ),
                hideOnCard: true,
              },
              {
                key: "telatKembali",
                header: "Telat Kembali",
                render: (row) => (
                  <span
                    className={cn(
                      "font-medium",
                      row.telatKembali > 0 ? "text-rose-600" : "text-slate-600"
                    )}
                  >
                    {row.telatKembali}
                  </span>
                ),
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "abaikanChecklist",
                header: "Abaikan Checklist",
                render: (row) => (
                  <span
                    className={cn(
                      "font-medium",
                      row.abaikanChecklist > 0 ? "text-rose-600" : "text-slate-600"
                    )}
                  >
                    {row.abaikanChecklist}
                  </span>
                ),
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "skorKepatuhan",
                header: "Skor",
                render: (row) => (
                  <Badge
                    variant={
                      row.skorKepatuhan >= 90
                        ? "success"
                        : row.skorKepatuhan >= 75
                          ? "warning"
                          : "danger"
                    }
                  >
                    {row.skorKepatuhan}
                  </Badge>
                ),
                headClassName: "text-center",
                cellClassName: "text-center",
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Riwayat Operasi — event log, bukan statistik */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Riwayat Operasi
            </CardTitle>
            <Link href="/pimpinan/laporan">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {riwayatOperasi.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada operasi tercatat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {riwayatOperasi.map((op) => (
                <div key={op.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-center shrink-0">
                    <p className="text-lg font-bold text-slate-800">
                      {new Date(op.tanggal).getDate()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(op.tanggal).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{op.jenis}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
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
                      <p className="text-xs text-slate-400 mt-1">{op.keterangan}</p>
                    )}
                  </div>
                  <Badge variant={op.hasil === "Berhasil" ? "success" : op.hasil === "Sebagian Berhasil" ? "warning" : "danger"}>
                    {op.hasil}
                  </Badge>
                </div>
              ))}
            </div>
          )}
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
                      {" "}<span className="text-slate-500">{log.aksi.replace(/_/g, " ").toLowerCase()}</span>
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