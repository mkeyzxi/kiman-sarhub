"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Search, Users, ShieldCheck, UserX, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input, Select } from "@/components/ui/input";
import { users } from "@/components/shared/mock-data";
import { roleLabels, roleDescriptions } from "@/config/navigation";
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
    .slice(0, 2);
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PenggunaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      user.nama.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.nip.includes(q);
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
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nama</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/admin/pengguna/${user.id}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light">
                        <span className="text-xs font-bold text-primary">
                          {initials(user.nama)}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800 group-hover:text-primary">
                        {user.nama}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {user.nip}
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.aktif ? "success" : "danger"}
                      className="text-xs"
                    >
                      {user.aktif ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/pengguna/${user.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      Detail
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-slate-500"
                  >
                    Tidak ada pengguna yang ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}