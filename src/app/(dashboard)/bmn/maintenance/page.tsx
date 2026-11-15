"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wrench, Plus, Search, Eye, Clock, CheckCircle2, AlertTriangle, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { formatTanggal, labelModelAset } from "@/components/shared/mock-data";
import { useTicketsCombined } from "@/components/shared/ticket-store";
import { useAsets, useSupabaseUsers } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { cn } from "@/lib/utils";

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, subText, aktif, onClick }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subText?: string;
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
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
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
            {subText && <p className="text-xs text-slate-400">{subText}</p>}
          </div>
        </div>
      </Card>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TiketMaintenancePage() {
  // Tiket: Supabase + tulisan sesi ini (in-memory), digabung.
  const { data: tickets, loading, error, refetch } = useTicketsCombined();
  // Aset & pengguna dari Supabase — sumber nama aset/petugas yang benar
  // (mock getUserById/getAsetById tidak mengenal UUID/NIP data asli).
  const { data: asetSemua } = useAsets();
  const { data: userSemua } = useSupabaseUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [tingkatFilter, setTingkatFilter] = useState("Semua");
  /** Token pemicu scroll ke tabel tiket setelah kartu statistik diklik. */
  const [tokenScroll, setTokenScroll] = useState(0);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  /** Nama petugas berdasarkan NIP (ews_tickets.assigned_to). */
  const namaPetugas = (nip: string): string =>
    userSemua.find((u) => u.nip === nip)?.nama ?? "-";
  /** Asset lookup in-memory (id Supabase). */
  const asetById = new Map(asetSemua.map((a) => [a.id, a]));

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      ticket.judul.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      ticket.deskripsi.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus = statusFilter === "Semua" || ticket.status === statusFilter;
    const matchTingkat = tingkatFilter === "Semua" || ticket.tingkatKeparahan === tingkatFilter;
    return matchSearch && matchStatus && matchTingkat;
  });

  // Pagination - panggil sebelum early return
  const pagination = usePagination(filteredTickets.length, 20);
  const paginatedTickets = filteredTickets.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  const totalTickets = tickets.length;
  const ticketsMenunggu = tickets.filter((t) => t.status === "Menunggu").length;
  const ticketsDiproses = tickets.filter((t) => t.status === "Diproses").length;
  const ticketsSelesai = tickets.filter((t) => t.status === "Selesai").length;

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
   * Scroll ke tabel tiket setelah kartu statistik diklik.
   * Dipakai token (angka) alih-alih boolean supaya scroll tetap berjalan
   * walau filter tidak berubah (mis. klik "Total Tiket" saat sudah "Semua").
   * Efek berjalan setelah commit render, jadi tabel sudah menampilkan data
   * terfilter saat digulir.
   */
  useEffect(() => {
    if (tokenScroll === 0) return;
    const el = document.getElementById("maintenance-table-target");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tokenScroll]);

  // Early return SETELAH semua hooks dipanggil
  if (loading) {
    return <DataLoading label="Memuat antrean tiket maintenance…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat tiket dari database"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Tiket Maintenance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola tiket perbaikan dan maintenance aset
          </p>
        </div>
        <Link href="/bmn/maintenance/buat">
          <Button>
            <Plus className="h-4 w-4" />
            Buat Tiket
          </Button>
        </Link>
      </div>

      {/* Stats Cards — klik = filter tabel + scroll ke hasil */}
      {/* `grid grid-cols-1` sebagai basis: tanpa itu `gap-4` tidak berlaku
          di mobile sehingga kartu menempel & border bawah tertutup kartu
          berikutnya (bg-white). */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tiket"
          value={totalTickets}
          icon={Wrench}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          aktif={statusFilter === "Semua"}
          onClick={() => klikKartuStat("Semua")}
        />
        <StatCard
          label="Menunggu"
          value={ticketsMenunggu}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          aktif={statusFilter === "Menunggu"}
          onClick={() => klikKartuStat("Menunggu")}
        />
        <StatCard
          label="Diproses"
          value={ticketsDiproses}
          icon={Wrench}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          aktif={statusFilter === "Diproses"}
          onClick={() => klikKartuStat("Diproses")}
        />
        <StatCard
          label="Selesai"
          value={ticketsSelesai}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          aktif={statusFilter === "Selesai"}
          onClick={() => klikKartuStat("Selesai")}
        />
      </div>

      {/* Search + Filter */}
      <div className="sm:px-2 pt-3 pb-4 border-t sm:border-t-sm sm:border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari judul atau deskripsi..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-40"
            value={tingkatFilter}
            onChange={(e) => setTingkatFilter(e.target.value)}
          >
            <option value="Semua">Semua Tingkat</option>
            <option value="Rendah">Rendah</option>
            <option value="Sedang">Sedang</option>
            <option value="Tinggi">Tinggi</option>
          </Select>
          <Select
            className="sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
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

      {/* Tabel Tiket - flat layout */}
      {/* id dipakai sebagai target scroll saat kartu statistik diklik.
          `scroll-mt-14 md:scroll-mt-16` menyisakan ruang untuk header
          sticky agar judul tabel tidak tertutup saat digulir. */}
      <div
        id="maintenance-table-target"
        className="sm:px-2 pt-3 pb-4 border-t sm:border-t-sm sm:border-slate-200 scroll-mt-14 md:scroll-mt-16"
      >
        <ResponsiveTable
          data={paginatedTickets}
          getKey={(row) => row.id}
          cardTitle={(row) => row.judul}
          cardSubtitle={(row) => row.id.toUpperCase()}
          cardBadge={(row) => (
            <Badge
              variant={row.status === "Selesai" ? "success" : row.status === "Diproses" ? "default" : "warning"}
            >
              {row.status}
            </Badge>
          )}
          cardPreviewCount={2}
          detailLabel="Lihat detail tiket"
          emptyMessage="Tidak ada tiket yang ditemukan"
          fields={[
            {
              key: "judul",
              header: "Judul",
              render: (row) => (
                <div>
                  <p className="font-medium text-slate-800">{row.judul}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{row.deskripsi}</p>
                </div>
              ),
              hideOnCard: true,
            },
            {
              key: "aset",
              header: "Aset",
              render: (row) => {
                const aset = asetById.get(row.asetId);
                const model = labelModelAset(aset);
                // Nama referensi jadi baris pertama — mudah dikenali
                // orang awam; nama resmi & kode tetap tampil di bawah.
                const referensi = aset?.namaReferensi?.trim() ?? "";
                return (
                  <div className="flex min-w-0 items-center gap-2">
                    <Package className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      {referensi && referensi !== aset?.nama && (
                        <p className="truncate text-sm font-medium text-emerald-600">
                          {referensi}
                        </p>
                      )}
                      <p className="truncate text-sm text-slate-700">{aset?.nama ?? "-"}</p>
                      <p className="truncate text-xs text-slate-400">
                        {model ? `${model} · ` : ""}
                        {aset?.kode}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "petugas",
              header: "Petugas",
              render: (row) => namaPetugas(row.assignedTo),
              cellClassName: "text-sm text-slate-600",
              hideBelowXl: true,
            },
            {
              key: "tingkatKeparahan",
              header: "Tingkat",
              render: (row) => (
                <Badge
                  variant={row.tingkatKeparahan === "Tinggi" ? "danger" : row.tingkatKeparahan === "Sedang" ? "warning" : "default"}
                >
                  {row.tingkatKeparahan}
                </Badge>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge
                  variant={row.status === "Selesai" ? "success" : row.status === "Diproses" ? "default" : "warning"}
                >
                  {row.status}
                </Badge>
              ),
              hideOnCard: true,
            },
            {
              key: "tanggal",
              header: "Tanggal",
              render: (row) => formatTanggal(row.tanggalBuat),
              cellClassName: "text-slate-600",
            },
            {
              key: "aksi",
              header: "Aksi",
              render: (row) => (
                <div className="flex items-center justify-center gap-1">
                  <Link href={`/bmn/maintenance/${row.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ),
              headClassName: "text-center",
              hideBelowLg: true,
            },
          ]}
        />

        {/* Detail Tiket Tinggi */}
        <div className="sm:px-2 pt-3 pb-4 border-t sm:border-t-sm sm:border-slate-200">
          <div className="space-y-3">
            {tickets
              .filter((t) => t.tingkatKeparahan === "Tinggi")
              .map((ticket) => {
                const aset = asetById.get(ticket.asetId);
                return (
                  <div key={ticket.id} className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-rose-800">{ticket.judul}</h3>
                        <Badge variant="danger">{ticket.status}</Badge>
                      </div>
                      <p className="text-sm text-rose-700 mb-2">{ticket.deskripsi}</p>
                      <div className="flex items-center gap-4 text-xs text-rose-600">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {aset?.nama}
                          {labelModelAset(aset) && (
                            <span className="text-slate-500">
                              · {labelModelAset(aset)}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTanggal(ticket.tanggalBuat)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}