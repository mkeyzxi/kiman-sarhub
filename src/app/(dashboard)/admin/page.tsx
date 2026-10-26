"use client";

import Link from "next/link";
import {
  Users,
  Shield,
  Settings,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatTanggal } from "@/components/shared/mock-data";
import { useSupabaseUsers } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { cn } from "@/lib/utils";

// ─── Data untuk halaman setting ──────────────────────────────────────────────
const pengaturanSistem = [
  {
    id: "set-01",
    kategori: "Keamanan",
    nama: "Waktu Sesi Login",
    nilai: "30 menit",
    status: "Aktif",
  },
  {
    id: "set-02",
    kategori: "Keamanan",
    nama: "Password Policy",
    namaDetail: "Min. 8 karakter, huruf besar & angka",
    nilai: "8+ karakter",
    status: "Aktif",
  },
  {
    id: "set-03",
    kategori: "Notifikasi",
    nama: "Email Notifikasi",
    nilai: "Aktif",
    status: "Aktif",
  },
  {
    id: "set-04",
    kategori: "Notifikasi",
    nama: "Push Notification",
    nilai: "Aktif",
    status: "Aktif",
  },
  {
    id: "set-05",
    kategori: "Sistem",
    nama: "Backup Otomatis",
    nilai: "Harian (02:00 WITA)",
    status: "Aktif",
  },
  {
    id: "set-06",
    kategori: "Sistem",
    nama: "Log Audit",
    nilai: "180 hari",
    status: "Aktif",
  },
];

// ─── Data untuk halaman log sistem ───────────────────────────────────────────
const logSistem = [
  {
    id: "sys-01",
    tanggal: "2026-09-28T18:00:00",
    level: "INFO",
    pesan: "Backup database berhasil dilakukan",
    user: "system",
  },
  {
    id: "sys-02",
    tanggal: "2026-09-28T17:30:00",
    level: "WARNING",
    pesan: "Percobaan login gagal 3x untuk user: unknown@basarnas.go.id",
    user: "system",
  },
  {
    id: "sys-03",
    tanggal: "2026-09-28T17:00:00",
    level: "INFO",
    pesan: "Export data aset oleh Rizky Pratama",
    user: "usr-004",
  },
  {
    id: "sys-04",
    tanggal: "2026-09-28T16:45:00",
    level: "INFO",
    pesan: "Update firmware drone DJI Mavic 3 Classic",
    user: "usr-004",
  },
  {
    id: "sys-05",
    tanggal: "2026-09-28T16:30:00",
    level: "INFO",
    pesan: "Verifikasi ditolak untuk pengajuan Thermal Imaging Camera",
    user: "usr-002",
  },
  {
    id: "sys-06",
    tanggal: "2026-09-28T16:00:00",
    level: "INFO",
    pesan: "Update checklist kesiapan peralatan medis",
    user: "usr-007",
  },
  {
    id: "sys-07",
    tanggal: "2026-09-28T15:30:00",
    level: "WARNING",
    pesan: "Penggunaan API melebihi 80% quota harian",
    user: "system",
  },
  {
    id: "sys-08",
    tanggal: "2026-09-28T15:00:00",
    level: "INFO",
    pesan: "Arsip kamera DSLR Canon EOS 90D untuk maintenance lensa",
    user: "usr-003",
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
export default function AdminPage() {
  // Pengguna dari Supabase; pengaturan sistem & log tetap konfigurasi lokal.
  const { data: users, loading, error, refetch } = useSupabaseUsers();
  const activeUsers = users.filter((u) => u.aktif).length;
  const totalUsers = users.length;

  if (loading) {
    return <DataLoading label="Memuat statistik pengguna…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat data pengguna dari database"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring sistem, konfigurasi, dan aktivitas pengguna
          </p>
        </div>
        <Link href="/admin/pengguna">
          <Button>
            <Users className="h-4 w-4" />
            Kelola Pengguna
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pengguna"
          value={totalUsers}
          icon={Users}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          subText={`${activeUsers} aktif`}
        />
        <StatCard
          label="Admin IT"
          value={users.filter((u) => u.role === "ADMIN_IT").length}
          icon={Shield}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Operator Lapangan"
          value={users.filter((u) => u.role === "OPERATOR_LAPANGAN").length}
          icon={Activity}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Login Hari Ini"
          value={12}
          icon={CheckCircle2}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subText="Terakhir: 17:45 WITA"
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengaturan Sistem */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Pengaturan Sistem
              </CardTitle>
              <Link href="/admin/pengaturan">
                <Button variant="ghost" size="sm">
                  Semua Pengaturan
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pengaturanSistem.slice(0, 4).map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{setting.nama}</p>
                    <p className="text-xs text-slate-500">{setting.kategori} • {setting.nilai}</p>
                  </div>
                  <Badge variant={setting.status === "Aktif" ? "success" : "warning"}>
                    {setting.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Log Sistem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Log Sistem Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logSistem.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    log.level === "WARNING" ? "bg-amber-500" : log.level === "ERROR" ? "bg-rose-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{log.pesan}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTanggal(log.tanggal)} • {log.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}