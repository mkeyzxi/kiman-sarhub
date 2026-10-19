"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getUserById, type UserRole } from "@/components/shared/mock-data";
import { roleLabels, roleDescriptions } from "@/config/navigation";

const roleOptions: UserRole[] = [
  "ADMIN_IT",
  "PENGELOLA_BMN",
  "KAKANSAR",
  "OPERATOR_LAPANGAN",
];

export default function EditPenggunaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getUserById(params.id);

  const [formData, setFormData] = useState({
    nama: user?.nama ?? "",
    nip: user?.nip ?? "",
    email: user?.email ?? "",
    noTelepon: user?.noTelepon ?? "",
    role: user?.role ?? "",
    aktif: user?.aktif ?? true,
  });

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <User className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Pengguna tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Pengguna dengan ID &quot;{params.id}&quot; tidak tersedia.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form data:", formData);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/pengguna/${user.id}`}>
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.nama} ({roleLabels[user.role]})
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
                value={formData.noTelepon}
                onChange={(e) =>
                  setFormData({ ...formData, noTelepon: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Hak Akses & Status */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Hak Akses &amp; Status
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="aktif">Status Akun</Label>
              <Select
                id="aktif"
                value={formData.aktif ? "aktif" : "nonaktif"}
                onChange={(e) =>
                  setFormData({ ...formData, aktif: e.target.value === "aktif" })
                }
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Akun nonaktif tidak dapat masuk ke sistem.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/pengguna/${user.id}`}>
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit">Simpan Perubahan</Button>
        </div>
      </form>
    </div>
  );
}