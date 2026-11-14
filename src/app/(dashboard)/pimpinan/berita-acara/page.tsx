"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { FileText, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { formatTanggal } from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";
import { useAsets, useBeritaAcara } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError, DataEmpty } from "@/components/shared/data-state";
import type { BeritaAcaraMapped } from "@/components/shared/supabase-mock-mapper";
import { usePagination } from "@/hooks/use-pagination";

const statusVariant: Record<
  string,
  "warning" | "default" | "success" | "danger"
> = {
  Draf: "default",
  Diserahkan: "warning",
  Diproses: "default",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function BeritaAcaraPimpinanPage() {
  /** Token pemicu scroll ke tabel berita acara setelah kartu diklik. */
  const [tokenScroll, setTokenScroll] = useState(0);
  /** Filter status yang dipilih dari kartu statistik. */
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Semua data langsung dari Supabase — KAKANSAR melihat berita acara
  // segera setelah operator menyerahkan ke BMN (RLS policy ba_select).
  // Draf operator TIDAK ditampilkan — aset milik PJ sampai diserahkan.
  const { data, loading, error, refetch } = useBeritaAcara();
  // Master aset — sumber "Nama Referensi" dari asetId/nama aset di BA.
  const { data: asetSemua } = useAsets();
  const asetById = useMemo(
    () => new Map(asetSemua.map((a) => [a.id, a])),
    [asetSemua]
  );

  /** Nama referensi BA: ikut asetId, fallback nama resmi. Kosong bila sama. */
  const referensiBA = (ba: BeritaAcaraMapped): string => {
    const aset =
      (ba.asetId ? asetById.get(ba.asetId) : undefined) ??
      asetSemua.find((a) => a.nama === ba.namaAset);
    const referensi = aset?.namaReferensi?.trim() ?? "";
    return referensi && referensi !== ba.namaAset ? referensi : "";
  };

  const alurAktif = data.filter((b) => b.status !== "Draf");
  const menungguAcc = alurAktif.filter((b) => b.status === "Diproses").length;
  const disetujui = alurAktif.filter((b) => b.status === "Disetujui").length;
  const ditolak = alurAktif.filter((b) => b.status === "Ditolak").length;

  /** Paginasi tabel berita acara. */
  const pagination = usePagination(alurAktif.length, 20);

  /** Klik kartu statistik → tabel difilter sesuai status kartu tersebut. */
  const klikKartuStat = (status: string) => {
    setStatusFilter(statusFilter === status ? "Semua" : status);
    // Kembali ke halaman pertama supaya hasil filter langsung terlihat
    // (bukan halaman terakhir dari daftar sebelumnya).
    pagination.goToPage(1);
    // Naikkan token scroll → efek di bawah menjalankan scroll SETELAH tabel
    // selesai di-render ulang dengan hasil filter terbaru.
    setTokenScroll((t) => t + 1);
  };

  /** Scroll ke tabel berita acara setelah kartu statistik diklik. */
  useEffect(() => {
    if (tokenScroll === 0) return;
    const el = document.getElementById("berita-acara-table-target");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tokenScroll]);

  if (loading) {
    return <DataLoading label="Memuat berita acara…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat berita acara dari database"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-800">
          Persetujuan Berita Acara
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tinjau template berita acara kerusakan aset, lalu acc atau tolak
          sebelum Pengelola BMN membuat tiket maintenance
        </p>
      </div>

      {/* Counters — klik = filter tabel + scroll ke hasil */}
      <div className="sm:grid sm:grid-cols-3 gap-4 grid grid-cols-1">
        {/* Menunggu Persetujuan */}
        <div
          onClick={() => klikKartuStat("Diproses")}
          className={cn(
            "sm:p-2 flex items-center gap-4 border-b sm:border-b sm:border-slate-200 sm:hover:sm:border-primary/50 transition-colors cursor-pointer",
            statusFilter === "Diproses" && "border-primary ring-2 ring-primary"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
            <Send className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{menungguAcc}</p>
            <p className="text-sm text-slate-500">Menunggu Persetujuan</p>
          </div>
        </div>
        {/* Disetujui */}
        <div
          onClick={() => klikKartuStat("Disetujui")}
          className={cn(
            "sm:p-2 flex items-center gap-4 border-b sm:border-b sm:border-slate-200 sm:hover:sm:border-primary/50 transition-colors cursor-pointer",
            statusFilter === "Disetujui" && "border-primary ring-2 ring-primary"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{disetujui}</p>
            <p className="text-sm text-slate-500">Disetujui</p>
          </div>
        </div>
        {/* Ditolak */}
        <div
          onClick={() => klikKartuStat("Ditolak")}
          className={cn(
            "sm:p-2 flex items-center gap-4 border-b sm:border-b sm:border-slate-200 sm:hover:sm:border-primary/50 transition-colors cursor-pointer",
            statusFilter === "Ditolak" && "border-primary ring-2 ring-primary"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50">
            <XCircle className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{ditolak}</p>
            <p className="text-sm text-slate-500">Ditolak</p>
          </div>
        </div>
      </div>

      {/* Penanda filter aktif */}
      {statusFilter !== "Semua" && (
        <p className="mt-2 text-xs text-slate-500">
          Filter kartu:{" "}
          <span className="font-semibold text-primary">{statusFilter}</span>{" "}
          — klik kartu statistik yang sama lagi untuk menghapus filter.
        </p>
      )}

      {/* Tabel / Kartu */}
      {/* id dipakai sebagai target scroll saat kartu statistik diklik.
          `scroll-mt-14 md:scroll-mt-16` menyisakan ruang untuk header
          sticky agar judul tabel tidak tertutup saat digulir. */}
      <div
        id="berita-acara-table-target"
        className="sm:px-2 pt-4 pb-4 border-t sm:border-t-sm sm:border-slate-200 scroll-mt-14 md:scroll-mt-16"
      >
        {alurAktif.length === 0 ? (
          <DataEmpty message={data.length > alurAktif.length
            ? "Berita acara belum masuk ke proses — draf milik penanggung jawab akan tampil setelah operator menyerahkannya ke Pengelola BMN."
            : "Belum ada berita acara masuk. Berita acara muncul di sini setelah operator menyerahkan kerusakan aset ke Pengelola BMN."}
          />
        ) : (
          <ResponsiveTable<BeritaAcaraMapped>
            data={alurAktif}
            getKey={(ba) => ba.id}
            cardTitle={(ba) => {
              // Nama referensi ditampilkan di bawah nama resmi — bacaan
              // pertama orang awam ("RIB 01 - 9 M", "motor tempel", dst.).
              const referensi = referensiBA(ba);
              return (
                <span className="block">
                  {ba.namaAset}
                  {referensi && (
                    <span className="mt-0.5 block text-xs font-normal text-emerald-600">
                      {referensi}
                    </span>
                  )}
                </span>
              );
            }}
            cardSubtitle={(ba) =>
              `${ba.nomor || "Nomor belum diisi"} — ${formatTanggal(ba.tanggal)}`
            }
            cardBadge={(ba) => (
              <Badge variant={statusVariant[ba.status] ?? "default"}>
                {ba.status}
              </Badge>
            )}
            emptyMessage="Tidak ada berita acara."
            fields={[
              {
                key: "nomor",
                header: "Nomor",
                render: (ba) =>
                  ba.nomor || (
                    <span className="text-slate-400">Belum diisi</span>
                  ),
              },
              {
                key: "tanggal",
                header: "Tanggal",
                render: (ba) => formatTanggal(ba.tanggal),
              },
              {
                key: "aset",
                header: "Aset",
                render: (ba) => {
                  const referensi = referensiBA(ba);
                  return (
                    <div className="min-w-0">
                      {referensi && (
                        <p className="text-sm font-medium text-emerald-600">
                          {referensi}
                        </p>
                      )}
                      <p className="font-medium text-slate-800">{ba.namaAset}</p>
                      {ba.kodeAset && (
                        <p className="font-mono text-xs text-slate-500">
                          {ba.kodeAset}
                        </p>
                      )}
                    </div>
                  );
                }
              },
              {
                key: "pengaju",
                header: "Diserahkan Oleh",
                render: (ba) => ba.pengajuNama ?? ba.pelapor ?? "-",
                hideBelowLg: true,
              },
              {
                key: "status",
                header: "Status",
                render: (ba) => (
                  <Badge variant={statusVariant[ba.status] ?? "default"}>
                    {ba.status}
                  </Badge>
                ),
              },
              {
                key: "aksi",
                header: "Aksi",
                render: (ba) => (
                  <Link href={`/pimpinan/berita-acara/${ba.id}`}>
                    <Button
                      variant={ba.status === "Diproses" ? "primary" : "outline"}
                      size="sm"
                    >
                      {ba.status === "Diproses" ? "Tinjau & Acc" : "Lihat"}
                    </Button>
                  </Link>
                ),
                cellClassName: "text-right",
                hideOnCard: true,
              }
            ]}
          />
        )}
      </div>
    </div>
  );
}