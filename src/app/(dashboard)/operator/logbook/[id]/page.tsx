"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
  PencilLine,
  TrendingDown,
  Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  isArmadaLaut,
  formatTanggal,
  formatEndurance,
  formatMenit,
  enduranceKeMenit,
  selisihEndurance,
  selisihKm,
  tahapYangTertunda,
  type StatusPenggunaan,
  type LogbookPerjalanan,
} from "@/components/shared/mock-data";
import { mergeLogbooksWithSupabase } from "@/components/shared/logbook-store";
import { useLogbooks } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { cn } from "@/lib/utils";

/** Warna badge per status penggunaan — beda dari status kesiapsiagaan armada. */
const statusVariant: Record<
  StatusPenggunaan,
  "success" | "warning" | "default"
> = {
  Selesai: "success",
  "Sedang Digunakan": "warning",
  "Menunggu Penggunaan": "default",
};

const labelStatus: Record<StatusPenggunaan, string> = {
  Selesai: "Selesai",
  "Sedang Digunakan": "Sedang Digunakan",
  "Menunggu Penggunaan": "Menunggu Penggunaan",
};

export default function DetailLogbookPage() {
  const params = useParams<{ id: string }>();
  // Data logbook dari Supabase.
  const {
    data: supabaseLogbooks,
    loading,
    error,
    refetch,
  } = useLogbooks();
  const logbooks = mergeLogbooksWithSupabase(
    supabaseLogbooks as unknown as LogbookPerjalanan[]
  );
  const log = logbooks.find((l) => l.id === params.id);

  if (loading) {
    return <DataLoading label="Memuat detail logbook…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat logbook dari database"
      />
    );
  }

  if (!log) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Ship className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Logbook tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Catatan dengan ID <span className="font-mono">{params.id}</span> tidak
          tersedia.
        </p>
        <Link href="/operator/logbook">
          <Button variant="outline">Kembali ke daftar logbook</Button>
        </Link>
      </div>
    );
  }

  const laut = isArmadaLaut(log.kategoriUnit);
  const tahapTertunda = tahapYangTertunda(log.status);
  const sudahSelesai = tahapTertunda === null;

  // Durasi perjalanan TempUH (jam dinding) bila sudah kembali.
  let durasi = "-";
  if (log.jamBerangkat && log.jamKembali) {
    const [jh, jm] = log.jamBerangkat.split(":").map(Number);
    const [kh, kmv] = log.jamKembali.split(":").map(Number);
    const selisih = kh * 60 + kmv - (jh * 60 + jm);
    durasi = formatMenit(selisih > 0 ? selisih : 0);
  }

  const sisaEndurance = enduranceKeMenit(log.enduranceAkhir);
  const terpakaiEndurance = selisihEndurance(log.enduranceAwal, log.enduranceAkhir);
  const jarakKm = selisihKm(log.kmSebelum, log.kmSesudah);

  let konsumsiBbm = "-";
  if (log.bbmSebelum && log.bbmSesudah) {
    const sebelum = parseInt(log.bbmSebelum);
    const sesudah = parseInt(log.bbmSesudah);
    const diff = sebelum - sesudah;
    konsumsiBbm = diff > 0 ? `${diff}%` : "0%";
  }

  const info = [
    { icon: Calendar, label: "Tanggal", value: formatTanggal(log.tanggal) },
    { icon: Clock, label: "Jam Berangkat", value: log.jamBerangkat || "-" },
    { icon: Clock, label: "Jam Kembali", value: log.jamKembali || "-" },
    { icon: Route, label: "Durasi", value: durasi },
    { icon: Ship, label: "Jenis Unit", value: log.jenisUnit },
    { icon: Users, label: laut ? "Nahkoda" : "Pengemudi", value: log.nahkoda },
    {
      icon: Users,
      label: "Jumlah Personel",
      value: `${log.jumlahPersonel} orang`,
    },
    { icon: Fuel, label: "Konsumsi BBM", value: konsumsiBbm },
    ...(laut && !sudahSelesai
      ? []
      : [
          {
            icon: Gauge,
            label: laut ? "Sisa Endurance" : "Jarak Tempuh",
            value: laut
              ? formatEndurance(log.enduranceAkhir)
              : formatJarakKm(jarakKm),
          },
        ]),
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
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-slate-500">
                {log.id}
              </span>
              <Badge variant={statusVariant[log.status]}>
                {labelStatus[log.status]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tombol lanjut pengisian — hanya selama catatan belum selesai */}
        {!sudahSelesai && (
          <Link
            href={`/operator/logbook/${log.id}/lengkapi`}
            className={cn(buttonVariants(), "w-fit")}
          >
            <PencilLine className="h-4 w-4" />
            Lanjutkan Pengisian
          </Link>
        )}
      </div>

      {/* Info grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Rute &amp; Tujuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {info.slice(0, 4).map((item) => (
                <InfoRow key={item.label} {...item} />
              ))}
            </div>
            <div className="space-y-4">
              {info.slice(4).map((item) => (
                <InfoRow key={item.label} {...item} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Endurance — hanya untuk armada laut */}
        {laut && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Endurance (Jam &amp; Menit)
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Awal: {formatEndurance(log.enduranceAwal)}
              </span>
              <span className="text-slate-300">&rarr;</span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  !log.enduranceAkhir || sisaEndurance === null
                    ? "bg-slate-100 text-slate-500"
                    : sisaEndurance >= 24 * 60
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                )}
              >
                Akhir: {log.enduranceAkhir ? formatEndurance(log.enduranceAkhir) : "Belum diisi"}
              </span>
              {terpakaiEndurance !== null && terpakaiEndurance > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  terpakai {formatMenit(terpakaiEndurance)} (durasi tempuh)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Kilometer — hanya untuk armada darat */}
        {!laut && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Kilometer
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Awal: {log.kmSebelum ? `${log.kmSebelum} km` : "-"}
              </span>
              <span className="text-slate-300">&rarr;</span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  log.kmSesudah
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                Akhir: {log.kmSesudah ? `${log.kmSesudah} km` : "Belum diisi"}
              </span>
              {jarakKm !== null && jarakKm > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  jarak tempuh {jarakKm} km
                </span>
              )}
            </div>
          </div>
        )}

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

        {/* Catatan */}
        {log.catatan && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Catatan
            </p>
            <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm text-slate-700">{log.catatan}</p>
            </div>
          </div>
        )}
      </div>

      {/* Ajakan meloncot ke tahap pelengkapan */}
      {!sudahSelesai && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Pencatatan belum lengkap
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                {tahapTertunda === "Awal"
                  ? "Belum ada jam keberangkatan. Isi jam berangkat lalu lengkapi data saat kembali agar status menjadi Selesai."
                  : `Isi jam kembali, ${laut ? "endurance akhir" : "kilometer sesudah"}, dan BBM sesudah agar status berubah menjadi Selesai.`}
              </p>
            </div>
            <Link
              href={`/operator/logbook/${log.id}/lengkapi`}
              className={cn(
                buttonVariants(),
                "w-fit shrink-0 bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600"
              )}
            >
              <PencilLine className="h-4 w-4" />
              Lanjutkan Pengisian
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Label jarak tempuh untuk armada darat. */
function formatJarakKm(jarakKm: number | null): string {
  return jarakKm === null ? "-" : `${jarakKm} km`;
}

/** Satu baris informasi pada grid ringkasan. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}