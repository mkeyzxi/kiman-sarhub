"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Clock,
  Users,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Globe,
  Lock,
  Mail,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Select, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Data Pengaturan ─────────────────────────────────────────────────────────
interface PengaturanItem {
  id: string;
  kategori: string;
  nama: string;
  deskripsi: string;
  nilai: string;
  tipe: "text" | "select" | "toggle";
  opsi?: string[];
  status: "Aktif" | "Nonaktif";
}

const pengaturanData: PengaturanItem[] = [
  {
    id: "set-01",
    kategori: "Keamanan",
    nama: "Waktu Sesi Login",
    deskripsi: "Durasi waktu sesi sebelum pengguna diminta login ulang",
    nilai: "30 menit",
    tipe: "select",
    opsi: ["15 menit", "30 menit", "1 jam", "2 jam", "4 jam"],
    status: "Aktif",
  },
  {
    id: "set-02",
    kategori: "Keamanan",
    nama: "Password Policy",
    deskripsi: "Kebijakan password minimum untuk semua pengguna",
    nilai: "8+ karakter",
    tipe: "select",
    opsi: ["6+ karakter", "8+ karakter", "10+ karakter", "12+ karakter"],
    status: "Aktif",
  },
  {
    id: "set-03",
    kategori: "Keamanan",
    nama: "Two-Factor Authentication",
    deskripsi: "Wajibkan 2FA untuk semua akun pengguna",
    nilai: "Nonaktif",
    tipe: "toggle",
    status: "Nonaktif",
  },
  {
    id: "set-04",
    kategori: "Notifikasi",
    nama: "Email Notifikasi",
    deskripsi: "Kirim notifikasi penting melalui email",
    nilai: "Aktif",
    tipe: "toggle",
    status: "Aktif",
  },
  {
    id: "set-05",
    kategori: "Notifikasi",
    nama: "Push Notification",
    deskripsi: "Notifikasi push untuk alert darurat",
    nilai: "Aktif",
    tipe: "toggle",
    status: "Aktif",
  },
  {
    id: "set-06",
    kategori: "Notifikasi",
    nama: "SMS Gateway",
    deskripsi: "Notifikasi SMS untuk alert tingkat tinggi",
    nilai: "Nonaktif",
    tipe: "toggle",
    status: "Nonaktif",
  },
  {
    id: "set-07",
    kategori: "Sistem",
    nama: "Backup Otomatis",
    deskripsi: "Jadwal backup database otomatis",
    nilai: "Harian (02:00 WITA)",
    tipe: "select",
    opsi: ["Harian (02:00 WITA)", "Mingguan", "Bulan", "Nonaktif"],
    status: "Aktif",
  },
  {
    id: "set-08",
    kategori: "Sistem",
    nama: "Retensi Log Audit",
    deskripsi: "Durasi penyimpanan log audit dalam sistem",
    nilai: "180 hari",
    tipe: "select",
    opsi: ["30 hari", "90 hari", "180 hari", "365 hari", "Selamanya"],
    status: "Aktif",
  },
  {
    id: "set-09",
    kategori: "Sistem",
    nama: "Bahasa Default",
    deskripsi: "Bahasa antarmuka default sistem",
    nilai: "Bahasa Indonesia",
    tipe: "select",
    opsi: ["Bahasa Indonesia", "English"],
    status: "Aktif",
  },
  {
    id: "set-10",
    kategori: "Sistem",
    nama: "Zona Waktu",
    deskripsi: "Zona waktu yang digunakan sistem",
    nilai: "WITA (UTC+8)",
    tipe: "select",
    opsi: ["WIB (UTC+7)", "WITA (UTC+8)", "WIT (UTC+9)"],
    status: "Aktif",
  },
];

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
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState("semua");

  const tabs = [
    { id: "semua", label: "Semua", icon: Settings },
    { id: "keamanan", label: "Keamanan", icon: Shield },
    { id: "notifikasi", label: "Notifikasi", icon: Bell },
    { id: "sistem", label: "Sistem", icon: Database },
  ];

  const filteredPengaturan = pengaturanData.filter((p) => {
    if (activeTab === "semua") return true;
    return p.kategori.toLowerCase() === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola konfigurasi dan preferensi sistem
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pengaturan Aktif"
          value={pengaturanData.filter((p) => p.status === "Aktif").length}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Pengaturan Nonaktif"
          value={pengaturanData.filter((p) => p.status === "Nonaktif").length}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Kategori"
          value={3}
          icon={Settings}
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Daftar Pengaturan */}
      <div className="space-y-4">
        {filteredPengaturan.map((pengaturan) => (
          <Card key={pengaturan.id}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    pengaturan.kategori === "Keamanan" ? "bg-blue-50" :
                    pengaturan.kategori === "Notifikasi" ? "bg-amber-50" : "bg-slate-100"
                  )}>
                    {pengaturan.kategori === "Keamanan" && <Lock className="h-5 w-5 text-blue-600" />}
                    {pengaturan.kategori === "Notifikasi" && <Bell className="h-5 w-5 text-amber-600" />}
                    {pengaturan.kategori === "Sistem" && <Database className="h-5 w-5 text-slate-600" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{pengaturan.nama}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{pengaturan.deskripsi}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{pengaturan.kategori}</Badge>
                      <Badge
                        variant={pengaturan.status === "Aktif" ? "success" : "warning"}
                        className="text-xs"
                      >
                        {pengaturan.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {pengaturan.tipe === "select" && (
                    <Select
                      className="w-40"
                      defaultValue={pengaturan.nilai}
                    >
                      {pengaturan.opsi?.map((opsi) => (
                        <option key={opsi} value={opsi}>{opsi}</option>
                      ))}
                    </Select>
                  )}
                  {pengaturan.tipe === "toggle" && (
                    <button
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        pengaturan.status === "Aktif" ? "bg-primary" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          pengaturan.status === "Aktif" ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  )}
                  <Button variant="outline" size="sm">
                    Simpan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Sistem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Informasi Sistem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Versi Sistem</p>
              <p className="font-medium text-slate-800">v2.4.1</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Database</p>
              <p className="font-medium text-slate-800">PostgreSQL 15</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Server</p>
              <p className="font-medium text-slate-800">AWS Singapore</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Uptime</p>
              <p className="font-medium text-slate-800">99.9%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}