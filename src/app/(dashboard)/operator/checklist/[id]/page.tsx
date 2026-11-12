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
  Printer,
  PencilLine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import RincianItemTable from "./rincian-item-table";
import TombolBeritaAcara from "./tombol-berita-acara";
import { useChecklistsCombined } from "@/components/shared/checklist-store";
import { kembalikanAsetBaik, serahkanKerusakanAset } from "@/components/shared/db-writes";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  checklistTemplates,
  formatTanggal,
} from "@/components/shared/mock-data";
import { useAsets, useAsetById } from "@/components/shared/use-supabase-data";
import {
  DokumenChecklist,
  type InfoUnitDokumen,
} from "@/components/shared/dokumen-checklist";
import { useSesiUser } from "@/components/shared/use-session";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CheckCircle2 as CheckCircleIcon, RefreshCw, AlertTriangle as AlertTri, Loader2 } from "lucide-react";
import "@/components/shared/berita-acara-print.css";
import "@/components/shared/dokumen-cetak-print.css";

const unitIcon = {
  Kapal: Ship,
  Mobil: Car,
  Motor: Bike,
  Perahu: Package,
} as const;

export default function DetailChecklistPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const ses = useSesiUser();

  // State proses validasi / serah kerusakan (tombol khusus operator PJ).
  const [prosesValidasi, setProsesValidasi] = useState<"baik" | "rusak" | null>(null);
  const [pesanValidasi, setPesanValidasi] = useState<string | null>(null);

  // Checklist dari Supabase + data sesi berjalan (in-memory), digabung.
  const { data, loading, error, refetch } = useChecklistsCombined();
  // Master BMN untuk melengkapi identitas unit pada dokumen cetak.
  const { data: asetList } = useAsets();
  const checklist = data.find((c) => c.id === id);
  const { data: asetDetail } = useAsetById(checklist?.asetId);

  // Identifikasi pemilik checklist (pemeriksaId === NIP user login).
  const pemilik = checklist?.pemeriksaId && checklist.pemeriksaId === ses.nip;

  /**
   * Operator lapangan / akun kantor yang menjadi PENANGGUNG JAWAB aset
   * checklist ini boleh memvalidasi & mengedit (mis. koreksi item rusak
   * menjadi Baik setelah dicek langsung ke unit).
   */
  const isPJAset =
    ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR"
      ? asetDetail?.penanggungJawab === ses.nip
      : false;

  const bisaEdit =
    ses.role === "ADMIN_IT" ||
    (ses.role === "OPERATOR_LAPANGAN" && (pemilik || isPJAset)) ||
    (ses.role === "AKUNTOR" && (pemilik || isPJAset));

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

  // Unit terkait dari master BMN: pakai asetId bila ada, fallback cocok
  // dengan nama unit. Dipakai dokumen cetak (nama referensi, kode, dll).
  const aset = checklist.asetId
    ? asetList.find((a) => a.id === checklist.asetId)
    : asetList.find((a) => a.nama === checklist.unit);
  const unitInfo: InfoUnitDokumen | null = aset
    ? {
        nama: aset.nama,
        namaReferensi: aset.namaReferensi,
        kode: aset.kode,
        nup: aset.nup,
        merk: aset.merk,
        tipe: aset.tipe,
        lokasi: aset.lokasi,
        penanggungJawab: aset.penanggungJawab,
      }
    : null;

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
    <div className="ba-page space-y-6">
      <div className="no-print space-y-6">
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
          {bisaEdit && (
            <>
              {isPJAset && !pemilik && (
                <span className="text-xs text-slate-500">
                  Anda memvalidasi checklist atas nama penanggung jawab aset
                </span>
              )}
              <Link
                href={`/operator/checklist/${id}/edit`}
                className={cn(buttonVariants({ variant: "outline" }), "w-fit gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700")}
              >
                <PencilLine className="h-4 w-4" />
                {isPJAset && !pemilik ? "Validasi & Edit" : "Edit Checklist"}
              </Link>
            </>
          )}
          <TombolBeritaAcara
            checklistId={id}
            adaRusak={rusakCount > 0}
            draftBelumLengkap={belumCount > 0}
          />
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
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              Checklist belum lengkap. Terdapat{" "}
              <strong>{belumCount} item</strong> yang belum diperiksa dan harus
              dilengkapi sebelum unit dinyatakan siap operasional.
            </p>
            <Link
              href={`/operator/checklist/buat?draft=${id}`}
              className="mt-2 inline-block"
            >
              <Button variant="secondary" size="sm">
                <PencilLine className="h-4 w-4 mr-1" />
                Lanjutkan Pengisian Checklist
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Aksi validasi PJ: kembalikan aset ke Baik atau laporkan kerusakan */}
      {isPJAset && belumCount === 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {prosesValidasi === null ? (
              <>
                {rusakCount > 0 ? (
                  <AlertTri className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                )}
                <p className="text-sm text-blue-800">
                  {rusakCount > 0
                    ? `Terdeteksi ${rusakCount} item rusak. Silakan laporkan untuk tindak lanjut.`
                    : "Semua item baik. Anda dapat mengonfirmasi aset kembali ke status Baik."}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-blue-800">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-sm">
                  {prosesValidasi === "baik"
                    ? "Mengembalikan aset ke status Baik…"
                    : "Melaporkan kerusakan aset…"}
                </p>
              </div>
            )}
          </div>
          {prosesValidasi === null && (
            <div className="flex gap-2">
              {rusakCount > 0 ? (
                <Button
                  size="sm"
                  className="gap-1.5 bg-rose-600 hover:bg-rose-700"
                  onClick={async () => {
                    if (!checklist.asetId || !ses.nip) return;
                    setProsesValidasi("rusak");
                    setPesanValidasi(null);
                    try {
                      await serahkanKerusakanAset(
                        checklist.asetId,
                        "Rusak Ringan",
                        `Validasi PJ ${ses.nama}: ${rusakCount} item rusak terdeteksi.`
                      );
                      await refetch();
                    } catch (e) {
                      setPesanValidasi(
                        e instanceof Error ? e.message : "Gagal melaporkan kerusakan."
                      );
                    } finally {
                      setProsesValidasi(null);
                    }
                  }}
                >
                  <AlertTri className="h-4 w-4" />
                  Laporkan Kerusakan
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={async () => {
                    if (!checklist.asetId || !ses.nip) return;
                    setProsesValidasi("baik");
                    setPesanValidasi(null);
                    try {
                      await kembalikanAsetBaik(
                        checklist.asetId,
                        `Validasi PJ ${ses.nama}: semua item baik, aset kembali Standby.`
                      );
                      await refetch();
                    } catch (e) {
                      setPesanValidasi(
                        e instanceof Error ? e.message : "Gagal memulihkan aset."
                      );
                    } finally {
                      setProsesValidasi(null);
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Kembalikan Aset ke Baik
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {pesanValidasi && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertTri className="h-4 w-4 shrink-0 text-rose-600" />
          {pesanValidasi}
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

      {/* ── Aksi cetak pratinjau (tidak ikut dicetak) ─────────────────────── */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Pratinjau dokumen laporan checklist — hasil cetak mengikuti kop surat
          BASARNAS.
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* ── Pratinjau dokumen (identik dengan dokumen berita acara) ───────── */}
      <DokumenChecklist
        checklist={checklist}
        templateNama={template?.nama}
        unit={unitInfo}
      />
    </div>
  );
}