"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  Car,
  Ship,
  Package,
  ClipboardCheck,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RincianItemTable from "./rincian-item-table";
import TombolBeritaAcara from "./tombol-berita-acara";
import { useChecklistsCombined } from "@/components/shared/checklist-store";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  checklistTemplates,
  formatTanggal,
} from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";

const unitIcon = {
  Kapal: Ship,
  Mobil: Car,
  Motor: Bike,
  Perahu: Package,
} as const;

export default function DetailChecklistPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  // Checklist dari Supabase + data sesi berjalan (in-memory), digabung.
  const { data, loading, error, refetch } = useChecklistsCombined();
  const checklist = data.find((c) => c.id === id);

  if (loading) {
    return <DataLoading label="Memuat detail checklist…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat checklist dari database"
      />
    );
  }

  if (!checklist) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <FileText className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Checklist tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Checklist dengan ID &quot;{id}&quot; tidak tersedia.
        </p>
        <Link href="/operator/checklist">
          <Button variant="outline">Kembali ke Daftar Checklist</Button>
        </Link>
      </div>
    );
  }

  const Icon = unitIcon[checklist.jenisUnit] ?? Package;
  const template = checklistTemplates.find((t) => t.id === checklist.templateId);
  const persen =
    checklist.itemTotal > 0
      ? Math.round((checklist.itemChecked / checklist.itemTotal) * 100)
      : 0;

  const rusakCount = checklist.items.filter(
    (i) => i.kondisi === "Rusak Ringan" || i.kondisi === "Rusak Berat"
  ).length;
  const belumCount = checklist.items.filter(
    (i) => i.kondisi === "Belum Diperiksa"
  ).length;

  const info = [
    { icon: Calendar, label: "Tanggal", value: formatTanggal(checklist.tanggal) },
    { icon: User, label: "Pemeriksa", value: checklist.pemeriksa },
    { icon: ClipboardCheck, label: "Template", value: template?.nama ?? "-" },
    {
      icon: CheckCircle2,
      label: "Item Diperiksa",
      value: `${checklist.itemChecked} / ${checklist.itemTotal}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/operator/checklist"
            aria-label="Kembali ke daftar checklist"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-light">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Detail Checklist
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">{checklist.unit}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Badge
            variant={checklist.status === "Lengkap" ? "success" : "warning"}
            className="w-fit px-3 py-1 text-sm"
          >
            {checklist.status}
          </Badge>
          <TombolBeritaAcara checklistId={id} adaRusak={rusakCount > 0} />
        </div>
      </div>

      {/* Ringkasan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Ringkasan Pemeriksaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Progres pengisian</span>
              <span>
                {checklist.itemChecked} dari {checklist.itemTotal} item
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  persen === 100
                    ? "bg-emerald-500"
                    : persen >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                )}
                style={{ width: `${persen}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="success">
              {checklist.itemChecked - rusakCount - belumCount} Baik
            </Badge>
            {rusakCount > 0 && (
              <Badge variant="danger">{rusakCount} Rusak</Badge>
            )}
            {belumCount > 0 && (
              <Badge variant="outline">{belumCount} Belum Diperiksa</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peringatan belum lengkap */}
      {belumCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Checklist belum lengkap. Terdapat{" "}
            <strong>{belumCount} item</strong> yang belum diperiksa dan harus
            dilengkapi sebelum unit dinyatakan siap operasional.
          </p>
        </div>
      )}

      {/* Rincian item */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Item Checklist</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RincianItemTable items={checklist.items} />
        </CardContent>
      </Card>

      {/* Catatan */}
      <Card>
        <CardHeader>
          <CardTitle>Catatan Pemeriksa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {checklist.catatan || "Tidak ada catatan."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}