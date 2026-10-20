"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Search, Users, ShieldCheck, UserX, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { roleLabels, roleDescriptions } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/supabase";

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
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("size-6", iconColor)} />
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

function initials(nama: string): string {
  return nama
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PenggunaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/pengguna");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setUsers(json.data || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      user.nama.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.nip || "").includes(q);
    const matchRole = roleFilter === "Semua" || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.aktif).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminCount = users.filter((u) => u.role === "ADMIN_IT").length;

  const stats = [
    {
      label: "Total Pengguna",
      value: totalUsers,
      subText: `${activeUsers} aktif`,
      icon: Users,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      label: "Admin IT",
      value: adminCount,
      subText: roleDescriptions.ADMIN_IT,
      icon: ShieldCheck,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Akun Nonaktif",
      value: inactiveUsers,
      subText: inactiveUsers > 0 ? "Perlu ditinjau" : "Semua akun aktif",
      icon: UserX,
      iconBg: inactiveUsers > 0 ? "bg-rose-50" : "bg-emerald-50",
      iconColor: inactiveUsers > 0 ? "text-rose-600" : "text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-slate-500">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchUsers} variant="outline">Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tambah, ubah, dan nonaktifkan akun pengguna sistem
          </p>
        </div>
        <Link href="/admin/pengguna/tambah">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama, email, atau NIP..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-56"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Semua">Semua Role</option>
            <option value="ADMIN_IT">Admin IT</option>
            <option value="PENGELOLA_BMN">Pengelola BMN</option>
            <option value="KAKANSAR">Kepala Kantor</option>
            <option value="OPERATOR_LAPANGAN">Operator Lapangan</option>
          </Select>
        </div>
      </Card>

      {/* Tabel Pengguna */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Daftar Pengguna Sistem
            </CardTitle>
            <span className="text-xs text-slate-500">
              Menampilkan {filteredUsers.length} dari {totalUsers} pengguna
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveTable
            data={filteredUsers}
            getKey={(row) => row.id}
            cardTitle={(row) => row.nama}
            cardSubtitle={(row) => row.nip || row.email}
            cardBadge={(row) => (
              <Badge variant={row.aktif ? "success" : "danger"} className="text-xs">
                {row.aktif ? "Aktif" : "Nonaktif"}
              </Badge>
            )}
            cardPreviewCount={2}
            detailLabel="Lihat detail pengguna"
            emptyMessage="Tidak ada pengguna yang ditemukan"
            fields={[
              {
                key: "nama",
                header: "Nama",
                render: (row) => (
                  <Link
                    href={`/admin/pengguna/${row.id}`}
                    className="group flex items-center gap-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light">
                      <span className="text-xs font-bold text-primary">
                        {initials(row.nama)}
                      </span>
                    </span>
                    <span className="font-medium text-slate-800 group-hover:text-primary">
                      {row.nama}
                    </span>
                  </Link>
                ),
                hideOnCard: true,
              },
              {
                key: "nip",
                header: "NIP",
                render: (row) => row.nip || "-",
                cellClassName: "font-mono text-xs text-slate-600",
              },
              {
                key: "email",
                header: "Email",
                render: (row) => row.email,
                cellClassName: "break-all text-slate-600",
              },
              {
                key: "role",
                header: "Role",
                render: (row) => (
                  <Badge variant="outline" className="text-xs">
                    {roleLabels[row.role] || row.role}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge
                    variant={row.aktif ? "success" : "danger"}
                    className="text-xs"
                  >
                    {row.aktif ? "Aktif" : "Nonaktif"}
                  </Badge>
                ),
                hideOnCard: true,
              },
              {
                key: "aksi",
                header: "Aksi",
                render: (row) => (
                  <Link
                    href={`/admin/pengguna/${row.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    Detail
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ),
                headClassName: "text-right",
                hideBelowLg: true,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}