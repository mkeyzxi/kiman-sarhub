"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { formatTanggal } from "@/components/shared/mock-data";
import { useTicketsCombined } from "@/components/shared/ticket-store";
import { useAsets, useSupabaseUsers } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { cn } from "@/lib/utils";

// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, subText }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subText?: string;
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
          {subText && <p className="text-xs text-slate-400">{subText}</p>}
        </div>
      </div>
    </Card>
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

  /** Nama petugas berdasarkan NIP (ews_tickets.assigned_to). */
  const namaPetugas = (nip: string): string =>
    userSemua.find((u) => u.nip === nip)?.nama ?? "-";
  /** Asset lookup in-memory (id Supabase). */
  const asetById = new Map(asetSemua.map((a) => [a.id, a]));

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

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      ticket.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "Semua" || ticket.status === statusFilter;
    const matchTingkat = tingkatFilter === "Semua" || ticket.tingkatKeparahan === tingkatFilter;
    return matchSearch && matchStatus && matchTingkat;
  });

  const totalTickets = tickets.length;
  const ticketsMenunggu = tickets.filter((t) => t.status === "Menunggu").length;
  const ticketsDiproses = tickets.filter((t) => t.status === "Diproses").length;
  const ticketsSelesai = tickets.filter((t) => t.status === "Selesai").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tiket Maintenance</h1>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tiket"
          value={totalTickets}
          icon={Wrench}
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          label="Menunggu"
          value={ticketsMenunggu}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Diproses"
          value={ticketsDiproses}
          icon={Wrench}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Selesai"
          value={ticketsSelesai}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
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
      </Card>

      {/* Tabel Tiket — otomatis menjadi kartu di layar kecil */}
      <Card>
        <CardContent className="pt-0">
          <ResponsiveTable
            data={filteredTickets}
            getKey={(row) => row.id}
            cardTitle={(row) => row.judul}
            cardSubtitle={(row) => row.id.toUpperCase()}
            cardBadge={(row) => (
              <Badge
                variant={
                  row.status === "Selesai"
                    ? "success"
                    : row.status === "Diproses"
                      ? "default"
                      : "warning"
                }
              >
                {row.status}
              </Badge>
            )}
            cardPreviewCount={2}
            detailLabel="Lihat detail tiket"
            emptyMessage="Tidak ada tiket yang ditemukan"
            fields={[
              {
                key: "id",
                header: "ID",
                render: (row) => row.id.toUpperCase(),
                cellClassName: "font-mono text-xs text-slate-600",
                hideBelowXl: true,
                hideOnCard: true,
              },
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
                  return (
                    <div className="flex min-w-0 items-center gap-2">
                      <Package className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">{aset?.nama ?? "-"}</p>
                        <p className="truncate text-xs text-slate-400">{aset?.kode}</p>
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
                    variant={
                      row.tingkatKeparahan === "Tinggi"
                        ? "danger"
                        : row.tingkatKeparahan === "Sedang"
                          ? "warning"
                          : "default"
                    }
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
                    variant={
                      row.status === "Selesai"
                        ? "success"
                        : row.status === "Diproses"
                          ? "default"
                          : "warning"
                    }
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
                  <div className="flex items-center justify-center">
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
        </CardContent>
      </Card>

      {/* Detail Tiket Tinggi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Tikit Prioritas Tinggi
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}