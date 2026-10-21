"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { roleLabels, roleDescriptions } from "@/config/navigation";
import type { UserProfile } from "@/types/supabase";
import type { UserRole } from "@/components/shared/mock-data";

const roleOptions = [
  "ADMIN_IT",
  "PENGELOLA_BMN",
  "KAKANSAR",
  "OPERATOR_LAPANGAN",
] as const;

export function EditPenggunaClient({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: user.nama ?? "",
    nip: user.nip ?? "",
    email: user.email ?? "",
    role: user.role ?? "OPERATOR_LAPANGAN",
    aktif: user.aktif ?? true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nama.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }
    if (!formData.nip.trim()) {
      setError("NIP wajib diisi (identitas login, 16-18 digit)");
      return;
    }
    if (!/^\d{16,18}$/.test(formData.nip.replace(/[\s.\-_]/g, ""))) {
      setError("Format NIP tidak valid. Harus 16-18 digit angka.");
      return;
    }
    if (!formData.role) {
      setError("Role wajib dipilih");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/pengguna/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal menyimpan perubahan");
        }

        router.push(`/admin/pengguna/${user.id}`);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan. Silakan coba lagi.";
        setError(message);
      }
    });
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
            {formData.nama} (
            {roleLabels[formData.role as UserRole] || formData.role})
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

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
                onChange={(e) => handleChange("nama", e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP (identitas login)</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => handleChange("nip", e.target.value)}
                required
                inputMode="numeric"
                disabled={isPending}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email / Kontak (opsional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isPending}
                placeholder="Jika kosong, sistem memakai {NIP}@basarnas.ac.id"
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
                onChange={(e) => handleChange("role", e.target.value)}
                required
                disabled={isPending}
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
                onChange={(e) => handleChange("aktif", e.target.value === "aktif")}
                disabled={isPending}
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
            <Button variant="outline" disabled={isPending} type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
