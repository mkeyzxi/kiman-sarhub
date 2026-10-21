"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    email: "",
    role: "",
    password: "",
    konfirmasiPassword: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error saat user mulai mengetik
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.nama.trim()) return "Nama lengkap wajib diisi";
    if (!formData.nip.trim()) return "NIP wajib diisi";
    const cleanNip = formData.nip.replace(/[\s.\-_]/g, "");
    if (!/^\d{16,18}$/.test(cleanNip))
      return "Format NIP tidak valid. Harus 16-18 digit angka.";
    // Email opsional — jika kosong, sistem otomatis memakai {NIP}@basarnas.ac.id
    if (formData.email.trim() && !formData.email.includes("@"))
      return "Format email tidak valid";
    if (!formData.role) return "Role wajib dipilih";
    if (formData.password.length < 8) return "Password minimal 8 karakter";
    if (formData.password !== formData.konfirmasiPassword)
      return "Konfirmasi password tidak cocok";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nama: formData.nama,
          nip: formData.nip,
          role: formData.role,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Gagal menambahkan pengguna (Status: ${res.status})`);
      }

      setSuccess(true);
      // Reset form
      setFormData({
        nama: "",
        nip: "",
        email: "",
        role: "",
        password: "",
        konfirmasiPassword: "",
      });

      // Redirect setelah 2 detik
      setTimeout(() => {
        router.push("/admin/pengguna");
      }, 2000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Error submitting form:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
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

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
          Pengguna berhasil ditambahkan! Mengalihkan ke daftar pengguna...
        </div>
      )}

      {/* Error Message */}
      {error && !success && (
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
                placeholder="Contoh: Siti Nurhaliza"
                value={formData.nama}
                onChange={(e) => handleChange("nama", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP (identitas login)</Label>
              <Input
                id="nip"
                placeholder="Contoh: 198208042009121003"
                value={formData.nip}
                onChange={(e) => handleChange("nip", e.target.value)}
                required
                inputMode="numeric"
                minLength={16}
                maxLength={18}
                disabled={isLoading}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                16-18 digit angka — dipakai sebagai username login
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email / Kontak (opsional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Kosongkan → otomatis {NIP}@basarnas.ac.id"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isLoading}
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
              onChange={(e) => handleChange("role", e.target.value)}
              required
              disabled={isLoading}
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
                onChange={(e) => handleChange("password", e.target.value)}
                minLength={8}
                required
                disabled={isLoading}
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
                  handleChange("konfirmasiPassword", e.target.value)
                }
                minLength={8}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/pengguna">
            <Button variant="outline" disabled={isLoading} type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Pengguna"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}