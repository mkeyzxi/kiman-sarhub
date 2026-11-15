"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Clock, Send, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { formatTanggal } from "@/components/shared/mock-data";
import { useAsets, useBeritaAcara } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import type { BeritaAcaraMapped } from "@/components/shared/supabase-mock-mapper";
import { cn } from "@/lib/utils";

/** Alur BA: Draf → Diserahkan (PJ) → Diproses (BMN isi nomor) → KAKANSAR. */
const statusVariant: Record<string, "warning" | "default" | "success" | "danger"> = {
  Draf: "default",
  Diserahkan: "warning",
  Diproses: "default",
  Disetujui: "success",
  Ditolak: "danger",
};

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, aktif, onClick }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  /** Kartu sedang aktif sebagai filter tabel. */
  aktif?: boolean;
  /** Klik kartu = set filter status. */
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`group relative w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        // z-10 agar shadow & ring kartu yang disorot menggambar di atas
        // kartu tetangga (bg-white tetangga tidak menutupi border bawahnya).
        aktif ? "z-10" : "hover:z-10"
      }`}
    >
      <Card
        className={cn(
          "h-full w-full p-4 transition-all",
          aktif
            ? "border-primary ring-2 ring-primary shadow-md"
            : "border-slate-200 group-hover:border-primary/60 group-hover:shadow-md"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-800">{value}</p>
            <p
              className={cn(
                "text-sm",
                aktif ? "font-semibold text-primary" : "text-slate-500"
              )}
            >
              {label}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DaftarBeritaAcaraPage() {
  // Semua data langsung dari Supabase — tanpa fallback mock.
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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  /** Token pemicu scroll ke tabel berita acara setelah kartu diklik. */
  const [tokenScroll, setTokenScroll] = useState(0);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  const baList = useMemo(
    () =>
      data.filter((ba) => {
        // Draf operator TIDAK ditampilkan — aset milik PJ sampai operator
        // menyerahkan berita acara ke BMN.
        if (ba.status === "Draf") return false;
        const q = debouncedSearch.toLowerCase();
        const matchQuery =
          q === "" ||
          ba.namaAset.toLowerCase().includes(q) ||
          (ba.nomor || "").toLowerCase().includes(q) ||
          (ba.kodeAset || "").toLowerCase().includes(q) ||
          (ba.pengajuNama || ba.pelapor || "").toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "Semua" || ba.status === statusFilter;
        return matchQuery && matchStatus;
      }),
    [data, debouncedSearch, statusFilter]
  );

  // Pagination - panggil sebelum early return
  const pagination = usePagination(baList.length, 20);
  const paginatedBA = useMemo(
    () => baList.slice(pagination.startIndex, pagination.endIndex),
    [baList, pagination.startIndex, pagination.endIndex]
  );

  const menungguNomor = baList.filter((b) => b.status === "Diserahkan").length;
  const menungguAcc = baList.filter((b) => b.status === "Diproses").length;
  const disetujui = baList.filter((b) => b.status === "Disetujui").length;

  /**
   * Klik kartu statistik → tabel difilter sesuai status kartu tersebut.
   * Klik kartu yang sedang aktif → kembali ke "Semua" (toggle).
   * Kartu memakai nilai status yang SAMA dengan dropdown filter status,
   * jadi tidak ada pemetaan label tambahan yang bisa salah.
   */
  const klikKartuStat = (status: string) => {
    setStatusFilter(statusFilter === status ? "Semua" : status);
    // Kembali ke halaman pertama supaya hasil filter langsung terlihat
    // (bukan halaman terakhir dari daftar sebelumnya).
    pagination.goToPage(1);
    // Naikkan token scroll → efek di bawah menjalankan scroll SETELAH tabel
    // selesai di-render ulang dengan hasil filter terbaru.
    setTokenScroll((t) => t + 1);
  };

  /**
   * Scroll ke tabel berita acara setelah kartu statistik diklik.
   * Dipakai token (angka) alih-alih boolean supaya scroll tetap berjalan
   * walau filter tidak berubah (mis. klik "Total Berita Acara" saat sudah
   * "Semua"). Efek berjalan setelah commit render, jadi tabel sudah
   * menampilkan data terfilter saat digulir.
   */
  useEffect(() => {
    if (tokenScroll === 0) return;
    const el = document.getElementById("berita-acara-table-target");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tokenScroll]);

  // Early return setelah semua hooks
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
      <div className="sm:mb-3">
        <h1 className="text-lg font-bold text-slate-800">Berita Acara</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola berita acara kerusakan — isi nomor surat, teruskan ke
          Kepala Kantor SAR, dan sambungkan tiket setelah acc
        </p>
      </div>

      {/* Stat Cards — klik = filter tabel + scroll ke hasil */}
      {/* `grid grid-cols-1` sebagai basis: tanpa itu `gap-3` tidak berlaku
          di mobile sehingga kartu menempel & border bawah tertutup kartu
          berikutnya (bg-white). */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Berita Acara"
          value={baList.length}
          icon={FileText}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          aktif={statusFilter === "Semua"}
          onClick={() => klikKartuStat("Semua")}
        />
        <StatCard
          label="Menunggu Nomor Surat"
          value={menungguNomor}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          aktif={statusFilter === "Diserahkan"}
          onClick={() => klikKartuStat("Diserahkan")}
        />
        <StatCard
          label="Menunggu Acc KAKANSAR"
          value={menungguAcc}
          icon={Send}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          aktif={statusFilter === "Diproses"}
          onClick={() => klikKartuStat("Diproses")}
        />
        <StatCard
          label="Disetujui"
          value={disetujui}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          aktif={statusFilter === "Disetujui"}
          onClick={() => klikKartuStat("Disetujui")}
        />
      </div>

      {/* Filter */}
      <div className="sm:px-2 pt-3 pb-4 border-t sm:border-t-sm sm:border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aset, nomor surat, atau pengaju…"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-52"
          >
            <option value="Semua">Semua Status</option>
            <option value="Diserahkan">Menunggu Nomor Surat</option>
            <option value="Diproses">Menunggu Acc KAKANSAR</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </Select>
        </div>
        {/* Penanda filter kartu yang sedang aktif (diklik di kartu statistik). */}
        {statusFilter !== "Semua" && (
          <p className="mt-2 text-xs text-slate-500">
            Filter kartu:{" "}
            <span className="font-semibold text-primary">{statusFilter}</span>{" "}
            — klik kartu statistik yang sama lagi untuk menghapus filter.
          </p>
        )}
      </div>

      {/* Tabel / Kartu */}
      {/* id dipakai sebagai target scroll saat kartu statistik diklik.
          `scroll-mt-14 md:scroll-mt-16` menyisakan ruang untuk header
          sticky agar judul tabel tidak tertutup saat digulir. */}
      <div
        id="berita-acara-table-target"
        className="sm:px-2 pt-3 pb-4 border-t sm:border-t-sm sm:border-slate-200 scroll-mt-14 md:scroll-mt-16"
      >
        <ResponsiveTable<BeritaAcaraMapped>
          data={paginatedBA}
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
              },
              hideOnCard: true,
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
                <Link href={`/bmn/berita-acara/${ba.id}`}>
                  <Button variant="outline" size="sm">
                    Kelola
                  </Button>
                </Link>
              ),
              cellClassName: "text-right",
              hideOnCard: true,
            },
          ]}
        />
      </div>
    </div>
  );
}