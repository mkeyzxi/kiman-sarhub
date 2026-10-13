"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { roleLabels, roleDescriptions } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

const roleOptions: UserRole[] = [
  "ADMIN_IT",
  "PENGELOLA_BMN",
  "KAKANSAR",
  "OPERATOR_LAPANGAN",
];

export default function TambahPenggunaPage() {
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    email: "",
    noTelepon: "",
    role: "" as string,
    password: "",
    konfirmasiPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form data:", formData);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/pengguna">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tambah Pengguna Baru
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lengkapi data akun dan tentukan hak akses pengguna
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Utama */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Data Utama
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                placeholder="Contoh: Siti Nurhaliza"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                placeholder="18 digit NIP"
                value={formData.nip}
                onChange={(e) =>
                  setFormData({ ...formData, nip: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Instansi</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@basarnas.go.id"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noTelepon">No. Telepon</Label>
              <Input
                id="noTelepon"
                placeholder="Contoh: 0812-3456-7890"
                value={formData.noTelepon}
                onChange={(e) =>
                  setFormData({ ...formData, noTelepon: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Hak Akses */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Hak Akses
          </h2>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              required
            >
              <option value="">Pilih role</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </Select>
            {formData.role && (
              <p className="mt-1 text-xs text-slate-500">
                {roleDescriptions[formData.role as UserRole]}
              </p>
            )}
          </div>
        </Card>

        {/* Keamanan */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Keamanan
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="konfirmasiPassword">Konfirmasi Password</Label>
              <Input
                id="konfirmasiPassword"
                type="password"
                placeholder="Ulangi password"
                value={formData.konfirmasiPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    konfirmasiPassword: e.target.value,
                  })
                }
                minLength={8}
                required
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/pengguna">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit">Simpan Pengguna</Button>
        </div>
      </form>
    </div>
  );
}