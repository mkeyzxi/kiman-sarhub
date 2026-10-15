"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Ship,
  Package,
  Car,
  Bike,
  Wrench,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { checklistTemplates, countItemKritis, getUserById } from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";
import { checklistHarianList } from "@/components/shared/mock-data";

// ─── Data Checklist Perawatan ────────────────────────────────────────────────
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
export default function ChecklistPerawatanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [jenisFilter, setJenisFilter] = useState("Semua");

  const filteredChecklist = checklistHarianList.filter((item) => {
    const matchSearch =
      item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pemeriksa.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
    const matchJenis = jenisFilter === "Semua" || item.jenisUnit === jenisFilter;
    return matchSearch && matchStatus && matchJenis;
  });

  const totalChecklist = checklistHarianList.length;
  const checklistLengkap = checklistHarianList.filter((c) => c.status === "Lengkap").length;
  const checklistBelumLengkap = checklistHarianList.filter((c) => c.status === "Belum Lengkap").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Checklist Perawatan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pemeriksaan harian dan perawatan unit SAR
          </p>
        </div>
        <Link href="/operator/checklist/buat">
          <Button>
            <Plus className="h-4 w-4" />
            Buat Checklist
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Checklist"
          value={totalChecklist}
          icon={ClipboardCheck}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          subText="Minggu ini"
        />
        <StatCard
          label="Lengkap"
          value={checklistLengkap}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Belum Lengkap"
          value={checklistBelumLengkap}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari unit atau pemeriksa..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-40"
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Kapal">Kapal (KN SAR)</option>
            <option value="Perahu">Perahu (RIB)</option>
            <option value="Mobil">Mobil</option>
            <option value="Motor">Motor</option>
          </Select>
          <Select
            className="sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Belum Lengkap">Belum Lengkap</option>
          </Select>
        </div>
      </Card>

      {/* Tabel Checklist — otomatis menjadi kartu di layar kecil */}
      <Card>
        <CardContent className="pt-0">
          <ResponsiveTable
            data={filteredChecklist}
            getKey={(row) => row.id}
            cardTitle={(row) => row.unit}
            cardSubtitle={(row) => row.tanggal}
            cardBadge={(row) => (
              <Badge variant={row.status === "Lengkap" ? "success" : "warning"}>
                {row.status}
              </Badge>
            )}
            cardPreviewCount={2}
            detailLabel="Lihat detail checklist"
            emptyMessage="Tidak ada checklist yang ditemukan"
            fields={[
              {
                key: "tanggal",
                header: "Tanggal",
                render: (row) => row.tanggal,
                cellClassName: "text-slate-700",
              },
              {
                key: "unit",
                header: "Unit",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.jenisUnit === "Kapal" && <Ship className="h-4 w-4 text-blue-500" />}
                    {row.jenisUnit === "Mobil" && <Car className="h-4 w-4 text-emerald-500" />}
                    {row.jenisUnit === "Motor" && <Bike className="h-4 w-4 text-orange-500" />}
                    {row.jenisUnit === "Perahu" && <Package className="h-4 w-4 text-amber-500" />}
                    <span className="font-medium text-slate-800">{row.unit}</span>
                  </div>
                ),
                hideOnCard: true,
              },
              {
                key: "jenisUnit",
                header: "Jenis",
                render: (row) => (
                  <Badge variant="outline" className="text-xs">
                    {row.jenisUnit}
                  </Badge>
                ),
                hideBelowXl: true,
                hideOnCard: true,
              },
              {
                key: "pemeriksa",
                header: "Pemeriksa",
                render: (row) => getUserById(row.pemeriksa)?.nama ?? row.pemeriksa,
                cellClassName: "text-slate-700",
              },
              {
                key: "progress",
                header: "Progress",
                render: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          row.status === "Lengkap" ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${(row.itemChecked / row.itemTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {row.itemChecked}/{row.itemTotal}
                    </span>
                  </div>
                ),
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={row.status === "Lengkap" ? "success" : "warning"}>
                    {row.status}
                  </Badge>
                ),
                hideOnCard: true,
              },
              {
                key: "aksi",
                header: "Aksi",
                render: () => (
                  <div className="flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ),
                headClassName: "text-center",
                hideBelowLg: true,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Template Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Template Checklist Tersedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {checklistTemplates.map((template) => (
              <div key={template.id} className="p-4 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-800">{template.nama}</h3>
                  <Badge variant="outline" className="text-xs">{template.kategori}</Badge>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {template.items.length} item pemeriksaan · {template.periode}
                  {countItemKritis(template.id) > 0 && (
                    <> · {countItemKritis(template.id)} item kritis</>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Link href="/operator/checklist" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-3 w-3 mr-1" />
                      Lihat
                    </Button>
                  </Link>
                  <Link href="/operator/checklist/buat" className="flex-1">
                    <Button size="sm" className="w-full">
                      Gunakan
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}