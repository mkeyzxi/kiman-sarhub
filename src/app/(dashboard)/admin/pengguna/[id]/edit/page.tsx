"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { roleLabels, roleDescriptions } from "@/config/navigation";
import type { UserProfile } from "@/types/supabase";

const roleOptions = [
  "ADMIN_IT",
  "PENGELOLA_BMN",
  "KAKANSAR",
  "OPERATOR_LAPANGAN",
] as const;

export default function EditPenggunaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    email: "",
    role: "",
    aktif: true,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      setLoading(true);
      const res = await fetch(`/api/pengguna/${params.id}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        setNotFound(true);
        return;
      }

      setUser(json.data);
      setFormData({
        nama: json.data.nama || "",
        nip: json.data.nip || "",
        email: json.data.email || "",
        role: json.data.role || "",
        aktif: json.data.aktif ?? true,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nama.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email wajib diisi");
      return;
    }
    if (!formData.role) {
      setError("Role wajib dipilih");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/pengguna/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan perubahan");
      }

      router.push(`/admin/pengguna/${params.id}`);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !user) {
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
            {formData.nama} ({roleLabels[formData.role as keyof typeof roleLabels] || formData.role})
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
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => handleChange("nip", e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Instansi</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                disabled={saving}
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
                disabled={saving}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </Select>
              {formData.role && (
                <p className="mt-1 text-xs text-slate-500">
                  {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aktif">Status Akun</Label>
              <Select
                id="aktif"
                value={formData.aktif ? "aktif" : "nonaktif"}
                onChange={(e) => handleChange("aktif", e.target.value === "aktif")}
                disabled={saving}
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
            <Button variant="outline" disabled={saving} type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
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