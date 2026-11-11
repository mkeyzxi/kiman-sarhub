"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Package,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import {
  STATUS_ASET,
  STATUS_ASET_VARIANT,
  hitungStatusAsetLive,
  labelModelAset,
  namaReferensiAset,
  nupTampil,

} from "@/components/shared/mock-data";
import { useAsets, useLogbooks } from "@/components/shared/use-supabase-data";
import {
  DataLoading,
  DataError,
  DataEmpty,
} from "@/components/shared/data-state";

export default function MasterDataBMNPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  
  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Aset dari Supabase + logbook perjalanan (untuk status "hidup").
  const { data: asetList, loading, error, refetch } = useAsets();
  const { data: logbookList } = useLogbooks();

  /**
   * Status aset secara live: turunkan "Sedang digunakan" dari logbook yang
   * belum kembali, bukan semata kolom status di database — sama persis dengan
   * statistik /operator/logbook. Statistik kartu, filter, dan tabel tabel di
   * bawah memakai nilai ini supaya selalu sepadan.
   */
  const statusLive = hitungStatusAsetLive(asetList, logbookList);
  /** Tampilkan status live pada tabel/kartu aset; kolom DB tetap untuk edit. */
  const statusEfektif = (aset: (typeof asetList)[number]) =>
    statusLive[aset.id] ?? aset.status;

  // Filter aset dengan debounced search — status memakai nilai **live**
  // (turunan logbook berjalan) agar filter "Sedang digunakan" juga menemukan
  // unit yang sedang dipakai walau kolom DB masih "Standby".
  const filteredAset = asetList.filter((aset) => {
    const q = debouncedSearch.toLowerCase();
    const statusEfektif = statusLive[aset.id] ?? aset.status;
    const matchSearch =
      aset.nama.toLowerCase().includes(q) ||
      aset.kode.toLowerCase().includes(q) ||
      aset.nup.includes(debouncedSearch) ||
      (aset.kodeBarang ?? "").toLowerCase().includes(q) ||
      (aset.noPolisi ?? "").toLowerCase().includes(q) ||
      (aset.merk ?? "").toLowerCase().includes(q) ||
      (aset.tipe ?? "").toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "Semua" || statusEfektif === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination - panggil sebelum early return
  const pagination = usePagination(filteredAset.length, 20);
  const paginatedAset = filteredAset.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  const totalAset = asetList.length;
  // Hitung dari status **live** (turunan logbook), bukan kolom DB saja:
  // unit yang masih ada logbook "Sedang Digunakan"-nya tampil terpakai.
  const hitung = (status: string) =>
    asetList.filter((a) => statusEfektif(a) === status).length;

  /**
   * Klik kartu statistik → langsung memfilter tabel di bawah, lalu
   * auto-scroll supaya hasil filter terlihat. Kartu "Total Aset"
   * (reset) tidak di-scroll karena tabel sudah terlihat dari atas.
   */
  const statusKartuAktif =
    statusFilter === "Semua" ? null : statusFilter;

  const klikKartuStat = (label: string) => {
    const statusTarget = label === "Total Aset" ? null : label;
    const reset = statusKartuAktif === statusTarget;
    if (reset) {
      setStatusFilter("Semua");
      return;
    }
    setStatusFilter(statusTarget ?? "Semua");
    // Setelah re-render, scroll lembut ke area tabel supaya hasil
    // filter langsung terlihat tanpa harus mencari manual.
    requestAnimationFrame(() => {
      const el = document.getElementById("bmn-table-target");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const stats = [
    {
      label: "Total Aset",
      value: totalAset,
      icon: Package,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Standby",
      value: hitung("Standby"),
      icon: ShieldCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Sedang Digunakan",
      value: hitung("Sedang digunakan"),
      icon: Users,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Rusak Berat",
      value: hitung("Rusak Berat"),
      icon: Wrench,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  ];

  // Early return setelah semua hooks
  if (loading) {
    return <DataLoading label="Memuat master aset BMN…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat master aset dari database"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data BMN</h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola dan pantau seluruh aset BMN yang dimiliki
          </p>
        </div>
        <Link href="/bmn/tambah">
          <Button>
            <Plus className="h-4 w-4" />
            Tambah Aset
          </Button>
        </Link>
      </div>

      {/* Stats Cards — klik untuk memfilter tabel di bawah */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const aktif = statusKartuAktif === stat.label;
          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => klikKartuStat(stat.label)}
              className="w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Card
                className={`h-full w-full p-6 transition-all ${
                  aktif
                    ? "ring-2 ring-primary shadow-md"
                    : "hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg}`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className={`text-sm ${aktif ? "font-semibold text-primary" : "text-slate-600"}`}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <Input
              placeholder="Cari nama, kode barang, NUP, atau nomor polisi..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            {STATUS_ASET.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Kosong total (bukan karena filter) → bimbingan aktif */}
      {asetList.length === 0 && (
        <DataEmpty message="Database Supabase terhubung, tetapi tidak ada baris aset yang dapat Anda baca. Cek: (1) Anda sudah login di aplikasi; (2) scripts/rls-policies.sql sudah dijalankan di SQL Editor Supabase." className="mb-4" />
      )}

      {/* Table — otomatis menjadi kartu di layar kecil */}
      <Card id="bmn-table-target">
        <ResponsiveTable
          data={paginatedAset}
          getKey={(row) => row.id}
          cardTitle={(row) => row.nama}
          cardSubtitle={(row) => {
            const model = labelModelAset(row);
            const nup = nupTampil(row.nup) ? `NUP ${nupTampil(row.nup)}` : "";
            return [model, row.kode, nup, row.kategori]
              .filter(Boolean)
              .join(" · ");
          }}
          cardBadge={(row) => (
            <Badge variant={STATUS_ASET_VARIANT[statusEfektif(row)]}>
              {statusEfektif(row)}
            </Badge>
          )}
          cardPreviewCount={2}
          detailLabel="Lihat detail aset"
          emptyMessage="Tidak ada aset yang ditemukan"
          fields={[
            {
              key: "kode",
              header: "Kode",
              render: (row) => row.kode,
              cellClassName: "font-mono text-xs text-slate-600",
            },
            {
              key: "nup",
              header: "NUP",
              render: (row) => nupTampil(row.nup),
              cellClassName: "font-mono text-xs text-slate-600",
            },
            {
              key: "nama",
              header: "Nama Aset",
              render: (row) => {
                const model = labelModelAset(row);
                return (
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{row.nama}</p>
                    {model && (
                      <p className="truncate text-xs text-slate-600">{model}</p>
                    )}
                  </div>
                );
              },
              cellClassName: "font-medium text-slate-800",
              hideOnCard: true,
            },
            {
              key: "namaReferensi",
              header: "Nama Referensi",
              render: (row) => {
                // Prioritaskan nilai manual dari DB; fallback ke perhitungan
                // otomatis agar data lama tetap punya nama referensi terbaca.
                const referensi =
                  row.namaReferensi || namaReferensiAset(row);
                return (
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-600">
                      {referensi || "-"}
                    </p>
                  </div>
                );
              },
              hideOnCard: true,
            },
            {
              key: "kategori",
              header: "Kategori",
              render: (row) => row.kategori,
              hideBelowXl: true,
              hideOnCard: true,
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge variant={STATUS_ASET_VARIANT[statusEfektif(row)]}>
                  {statusEfektif(row)}
                </Badge>
              ),
              hideOnCard: true,
            },
            {
              key: "kondisi",
              header: "Kondisi",
              render: (row) => row.kondisi,
            },
            {
              key: "lokasi",
              header: "Lokasi",
              render: (row) => row.lokasi,
            },
            {
              key: "aksi",
              header: "Aksi",
              render: (row) => (
                <div className="flex items-center justify-center gap-1">
                  <Link href={`/bmn/${row.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/bmn/${row.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ),
              headClassName: "text-center",
              hideBelowLg: true,
            },
          ]}
        />
        
        {/* Pagination Controls */}
        {filteredAset.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              startItem={pagination.startItem}
              endItem={pagination.endItem}
              hasPrevious={pagination.hasPrevious}
              hasNext={pagination.hasNext}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
