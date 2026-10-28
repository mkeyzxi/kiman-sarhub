"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Package,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getUserById,
  formatTanggal,
  type TingkatKeparahan,
  type StatusTicket,
  type StatusBeritaAcara,
} from "@/components/shared/mock-data";
import {
  beritaAcaraByTiket,
  useBeritaAcara,
} from "@/components/shared/berita-acara-store";
import { useTicketsCombined, updateTicketStatus } from "@/components/shared/ticket-store";
import { putuskanTiketMaintenance } from "@/components/shared/db-writes";
import { useAsetById } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { useSesiUser } from "@/components/shared/use-session";
import { cn } from "@/lib/utils";

const severityVariant: Record<TingkatKeparahan, "danger" | "warning" | "success"> = {
  Tinggi: "danger",
  Sedang: "warning",
  Rendah: "success",
};

const statusVariant: Record<StatusTicket, "warning" | "default" | "success"> = {
  Menunggu: "warning",
  Diproses: "default",
  Selesai: "success",
};

const statusIcon: Record<StatusTicket, typeof Clock> = {
  Menunggu: Clock,
  Diproses: Wrench,
  Selesai: CheckCircle2,
};

/** Badge status berita acara. */
const statusBAVariant: Record<
  StatusBeritaAcara,
  "warning" | "default" | "success" | "danger"
> = {
  Draf: "default",
  Diserahkan: "warning",
  Diproses: "default",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function DetailTiketPage() {
  const params = useParams<{ id: string }>();
  const ses = useSesiUser();
  const { data: tickets, loading, error, refetch } = useTicketsCombined();
  // Pasang hidrasi berita acara dari Supabase sekali (sekaligus memicu
  // render ulang setelah baris DB masuk ke daftar store).
  useBeritaAcara();

  const ticket = tickets.find((t) => t.id === params.id);
  const beritaAcara = ticket ? beritaAcaraByTiket(ticket.id) : undefined;
  // Penanggung jawab (operator) adalah pelaksana perbaikan: ia ikut punya
  // hak ubah status tiket yang diarahkan ke NIP-nya (RLS sudah mengizinkan
  // update bila `assigned_to = nip_jwt`).
  const sayaPenanggungJawab =
    !!ticket && !!ses?.nip && ticket.assignedTo === ses.nip;

  // Keputusan tiket lewat RPC SECURITY DEFINER (putuskan_tiket_maintenance):
  // selesai → aset kembali "Standby" (kondisi "Baik"); tolak → aset kembali
  // ke status rusaknya. Kesalahan ditampilkan di panel aksi.
  const [memutus, setMemutus] = useState(false);
  const [gagalPutus, setGagalPutus] = useState<string | null>(null);
  const handlePutuskan = async (selesai: boolean) => {
    if (!ticket || memutus) return;
    setMemutus(true);
    setGagalPutus(null);
    try {
      await putuskanTiketMaintenance(ticket.id, selesai);
    } catch (e) {
      setGagalPutus(
        e instanceof Error ? e.message : "Gagal menyimpan keputusan tiket"
      );
      setMemutus(false);
      return;
    }
    // Selaraskan salinan in-memory tiket (tulis ulang sama — idempoten).
    updateTicketStatus(ticket.id, "Selesai");
    void refetch();
    setMemutus(false);
  };

  // Aset dari database Supabase (bukan mock). Hook dipanggil selalu — id
  // undefined saat tiket belum ketemu → tidak fetch.
  const { data: aset } = useAsetById(ticket?.asetId || undefined);
  const petugas = ticket ? getUserById(ticket.assignedTo) : undefined;

  if (loading) {
    return <DataLoading label="Memuat detail tiket…" />;
  }
  if (error) {
    return (
      <DataError error={error} onRetry={refetch} label="Gagal memuat tiket" />
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Wrench className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">Tiket tidak ditemukan</h1>
        <p className="text-sm text-slate-500">
          Tiket dengan ID &quot;{params.id}&quot; tidak tersedia.
        </p>
        <Link href="/bmn/maintenance">
          <Button variant="outline">Kembali ke daftar tiket</Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusIcon[ticket.status];

  const alur = [
    { label: "Dilaporkan", value: ticket.tanggalBuat },
    { label: "Diperbarui", value: ticket.tanggalUpdate },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bmn/maintenance"
            aria-label="Kembali ke daftar tiket"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ticket.judul}</h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{ticket.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={severityVariant[ticket.tingkatKeparahan]}>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {ticket.tingkatKeparahan}
          </Badge>
          <Badge variant={statusVariant[ticket.status]} className="px-3 py-1">
            {ticket.status}
          </Badge>
        </div>
      </div>

      {/* Aset terkait */}
      {aset && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Aset Terkait
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Nama Aset
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {aset.nama}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Kode
                  </p>
                  <p className="font-mono text-sm font-medium text-slate-800">
                    {aset.kode}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Kondisi &amp; Status
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {aset.kondisi} · {aset.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Lokasi
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {aset.lokasi}
                  </p>
                </div>
              </div>
              <Link href={`/bmn/${aset.id}`}>
                <Button variant="outline" size="sm">
                  Lihat Aset
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deskripsi */}
      <Card>
        <CardHeader>
          <CardTitle>Deskripsi Kerusakan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {ticket.deskripsi}
          </p>
        </CardContent>
      </Card>

      {/* Berita Acara — diisi PJ (pemeriksa); nomor BMN; acc oleh KAKANSAR */}
      {beritaAcara && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Berita Acara Kerusakan
              <Badge
                variant={statusBAVariant[beritaAcara.status]}
                className="ml-auto"
              >
                {beritaAcara.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Nomor
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {beritaAcara.nomor || (
                    <span className="text-slate-400">
                      (belum diisi unit administrasi)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Tanggal
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {formatTanggal(beritaAcara.tanggal)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Diserahkan oleh
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {beritaAcara.pengajuNama ?? beritaAcara.pelapor}
                </p>
                <p className="text-xs text-slate-500">
                  {beritaAcara.pengajuJabatan ?? beritaAcara.pelaporJabatan}
                </p>
              </div>
            </div>

            {/* Tabel Informasi Kendala */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-10 px-3 py-2 text-left font-medium text-slate-600">
                      No
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Nama Barang
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Merk/Type
                    </th>
                    <th className="w-24 px-3 py-2 text-left font-medium text-slate-600">
                      Jumlah
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {beritaAcara.kendala.map((k, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {k.label}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{k.merk}</td>
                      <td className="px-3 py-2 text-slate-600">{k.jumlah}</td>
                      <td className="px-3 py-2 text-slate-600">{k.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {beritaAcara.uraian && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                  Hasil Pemeriksaan / Analisa
                </p>
                <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {beritaAcara.uraian}
                </p>
              </div>
            )}

            {beritaAcara.fotoBukti.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                  Foto Bukti ({beritaAcara.fotoBukti.length})
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {beritaAcara.fotoBukti.map((foto, idx) => (
                    <img
                      key={idx}
                      src={foto}
                      alt={`Bukti ${idx + 1}`}
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Penyerahan ke Tempat Service
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">
                {beritaAcara.keterangan}
              </p>
            </div>

            {beritaAcara.alasanPenolakan && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs uppercase tracking-wider text-rose-600">
                  Alasan Penolakan
                </p>
                <p className="mt-0.5 text-sm text-rose-800">
                  {beritaAcara.alasanPenolakan}
                </p>
              </div>
            )}

            {/* Info alur BA — keputusan acc/tolak dilakukan KAKANSAR di
                halaman pimpinan; BMN mengisi nomor di menu Berita Acara. */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                {beritaAcara.status === "Diserahkan" &&
                  "Menunggu Pengelola BMN mengisi nomor surat — kelola di menu \u201CBerita Acara\u201D."}
                {beritaAcara.status === "Diproses" &&
                  "Menunggu persetujuan Kepala Kantor SAR (KAKANSAR)."}
                {beritaAcara.status === "Disetujui" &&
                  "Disetujui KAKANSAR — aset dikirim ke unit service (Maintenance). Aset kembali Standby setelah tiket ini ditandai selesai."}
                {beritaAcara.status === "Draf" &&
                  "Belum diserahkan oleh PJ."}
                {beritaAcara.status === "Ditolak" &&
                  "Ditolak KAKANSAR — dokumen dikembalikan untuk perbaikan."}
              </p>
            </div>

            <div className="flex justify-end">
              <Link href={`/bmn/berita-acara/${beritaAcara.id}`}>
                <Button variant="outline" size="sm">
                  Kelola Berita Acara
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline & petugas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Riwayat Tiket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {alur.map((a, i) => (
                <li key={a.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        i === 0
                          ? "bg-primary-light text-primary"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                    </div>
                    {i < alur.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-slate-200" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-medium text-slate-800">
                      {a.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTanggal(a.value)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Penanggung Jawab
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-light">
                <span className="text-sm font-bold text-primary">
                  {petugas?.nama?.charAt(0) ?? "?"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {petugas?.nama ?? "-"}
                </p>
                <p className="text-xs text-slate-500">{petugas?.role ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  ticket.status === "Selesai"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                )}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Status Saat Ini
                </p>
                <p className="text-xs text-slate-500">{ticket.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aksi — Pengelola BMN/ADMIN, atau penanggung jawab (operator)
          pelaksana perbaikan pada tiket yang diarahkan ke NIP-nya. */}
      {ticket.status !== "Selesai" && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <p className="text-xs text-slate-500 sm:mr-auto">
              {sayaPenanggungJawab
                ? "Anda penanggung jawab aset ini — tandai selesai setelah perbaikan dilakukan; aset otomatis kembali Standby."
                : "Tandai selesai → aset kembali Standby. Tolak → aset kembali berstatus rusak."}
            </p>
            {gagalPutus && (
              <p className="text-xs text-rose-600 sm:w-full sm:text-right">
                {gagalPutus}
              </p>
            )}
            <Button
              variant="outline"
              className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => handlePutuskan(false)}
              disabled={memutus}
            >
              <XCircle className="h-4 w-4" />
              {memutus ? "Menyimpan…" : "Tolak Tiket"}
            </Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handlePutuskan(true)}
              disabled={memutus}
            >
              <CheckCircle2 className="h-4 w-4" />
              {memutus ? "Menyimpan…" : "Tandai Selesai"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}