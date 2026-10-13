import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Ship,
  Clock,
  MapPin,
  Fuel,
  Users,
  Route,
  FileText,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getLogbookPerjalananById,
  formatTanggal,
} from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";

const statusVariant = {
  Selesai: "success",
  Berlangsung: "warning",
  Dijadwalkan: "default",
} as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailLogbookPage({ params }: PageProps) {
  const { id } = await params;
  const log = getLogbookPerjalananById(id);

  if (!log) {
    notFound();
  }

  // Durasi perjalanan dalam jam (kosong bila belum kembali)
  let durasi = "-";
  if (log.jamBerangkat && log.jamKembali) {
    const [jh, jm] = log.jamBerangkat.split(":").map(Number);
    const [kh, km] = log.jamKembali.split(":").map(Number);
    const selisih = kh * 60 + km - (jh * 60 + jm);
    const jam = Math.floor(selisih / 60);
    const menit = selisih % 60;
    durasi = `${jam} jam ${menit} menit`;
  }

  // Konsumsi BBM bila data sebelum & sesudah tersedia
  let konsumsiBbm = "-";
  if (log.bbmSebelum && log.bbmSesudah) {
    const sebelum = parseInt(log.bbmSebelum);
    const sesudah = parseInt(log.bbmSesudah);
    const diff = sebelum - sesudah;
    konsumsiBbm = diff > 0 ? `${diff}%` : "0%";
  }

  const info = [
    { icon: Calendar, label: "Tanggal", value: formatTanggal(log.tanggal) },
    { icon: Clock, label: "Jam Berangkat", value: log.jamBerangkat },
    { icon: Clock, label: "Jam Kembali", value: log.jamKembali || "-" },
    { icon: Route, label: "Durasi", value: durasi },
    { icon: Ship, label: "Jenis Unit", value: log.jenisUnit },
    { icon: Users, label: "Nahkoda", value: log.nahkoda },
    { icon: Users, label: "Jumlah Personel", value: `${log.jumlahPersonel} orang` },
    { icon: Fuel, label: "Konsumsi BBM", value: konsumsiBbm },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/operator/logbook"
            aria-label="Kembali ke daftar logbook"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Detail Logbook Perjalanan
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {log.tujuan} — {log.jenisUnit}
            </p>
          </div>
        </div>
        <Badge
          variant={statusVariant[log.status]}
          className="w-fit px-3 py-1 text-sm"
        >
          {log.status}
        </Badge>
      </div>

      {/* Informasi Perjalanan */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Perjalanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {info.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rute & Tujuan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Rute &amp; Tujuan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Rute
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {log.rute}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Tujuan Kegiatan
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {log.tujuan}
              </p>
            </div>
          </div>

          {/* BBM */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              BBM
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  log.bbmSesudah === "" || parseInt(log.bbmSesudah) >= 50
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                )}
              >
                Sebelum: {log.bbmSebelum || "-"}
              </span>
              <span className="text-slate-300">&rarr;</span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  log.bbmSesudah === ""
                    ? "bg-slate-100 text-slate-500"
                    : parseInt(log.bbmSesudah) >= 50
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                )}
              >
                Sesudah: {log.bbmSesudah || "Belum diisi"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catatan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Catatan awak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {log.catatan || "Tidak ada catatan."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}