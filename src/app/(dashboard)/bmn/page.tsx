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
import { Card } from "@/components/ui/card";
import {
  asetList,
  type StatusAset,
} from "@/components/shared/mock-data";

const statusBadgeVariant: Record<StatusAset, "success" | "warning" | "danger" | "default"> = {
  Siaga: "success",
  Operasi: "default",
  Dipinjam: "warning",
  Rusak: "danger",
  Maintenance: "warning",
  "Tidak Siap": "danger",
};

export default function MasterDataBMNPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const filteredAset = asetList.filter((aset) => {
    const matchSearch =
      aset.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aset.kode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "Semua" || aset.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAset = asetList.length;
  const siaga = asetList.filter((a) => a.status === "Siaga").length;
  const dipinjam = asetList.filter((a) => a.status === "Dipinjam").length;
  const rusak = asetList.filter((a) => a.status === "Rusak").length;

  const stats = [
    {
      label: "Total Aset",
      value: totalAset,
      icon: Package,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Siaga",
      value: siaga,
      icon: ShieldCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Dipinjam",
      value: dipinjam,
      icon: Users,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Rusak",
      value: rusak,
      icon: Wrench,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data BMN</h1>
          <p className="text-sm text-slate-500 mt-1">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama aset atau kode..."
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
            <option value="Siaga">Siaga</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Rusak">Rusak</option>
            <option value="Maintenance">Maintenance</option>
          </Select>
        </div>
      </Card>

      {/* Table — otomatis menjadi kartu di layar kecil */}
      <Card>
        <ResponsiveTable
          data={filteredAset}
          getKey={(row) => row.id}
          cardTitle={(row) => row.nama}
          cardSubtitle={(row) => `${row.kode} \u00b7 ${row.kategori}`}
          cardBadge={(row) => (
            <Badge variant={statusBadgeVariant[row.status]}>{row.status}</Badge>
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
              key: "nama",
              header: "Nama Aset",
              render: (row) => row.nama,
              cellClassName: "font-medium text-slate-800",
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
                <Badge variant={statusBadgeVariant[row.status]}>{row.status}</Badge>
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
      </Card>
    </div>
  );
}
