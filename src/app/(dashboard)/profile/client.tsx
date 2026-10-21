"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, Save, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/config/navigation";
import { notifyLocalStorageChange } from "@/lib/use-local-storage";
import type { UserProfile } from "@/types/supabase";
import type { UserRole } from "@/components/shared/mock-data";

interface ProfileClientProps {
  initialProfile: UserProfile | null;
}

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: initialProfile?.nama ?? "",
    nip: initialProfile?.nip ?? "",
    email: initialProfile?.email ?? "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (passwordError) setPasswordError(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.nama.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }
    // Validasi email diasupuskan karena login pakai NIP,
    // email hanya untuk kontak/notification (opsional)
    // if (!formData.email.trim() || !formData.email.includes("@")) {
    //   setError("Email valid wajib diisi");
    //   return;
    // }

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal memperbarui profil");
        }

        setProfile(json.data);
        setSuccess("Profil berhasil diperbarui!");

        // Update localStorage + trigger re-render header/sidebar
        localStorage.setItem("userNama", json.data.nama);
        notifyLocalStorageChange();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan";
        setError(message);
      }
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordData.currentPassword) {
      setPasswordError("Password saat ini wajib diisi");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal mengubah password");
        }

        setPasswordSuccess(true);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess(false);
        }, 2000);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan";
        setPasswordError(message);
      }
    });
  };

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <User className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500">Profil tidak ditemukan</p>
        <Button onClick={() => router.back()} variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  const roleLabel = roleLabels[profile.role as UserRole] ?? profile.role;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi akun Anda
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {/* Info Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Role
              </p>
              <p className="mt-1 font-medium text-slate-800">{roleLabel}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Status Akun
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {profile.aktif ? "Aktif" : "Nonaktif"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Edit Profil */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Informasi</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-nama">Nama Lengkap</Label>
                <Input
                  id="profile-nama"
                  value={formData.nama}
                  onChange={(e) => handleProfileChange("nama", e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-nip">NIP (identitas login — tidak bisa diubah sendiri)</Label>
                <Input
                  id="profile-nip"
                  value={formData.nip}
                  onChange={(e) => handleProfileChange("nip", e.target.value)}
                  disabled
                  className="bg-slate-50 cursor-not-allowed text-slate-400"
                />
                <p className="text-xs text-slate-400">
                  Untuk mengubah NIP, hubungi Admin IT.
                </p>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="profile-email">Email (opsional)</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  // email opsional, tidak wajib untuk login (login pakai NIP)
                  disabled={isPending}
                />
                <p className="text-xs text-slate-400">
                  Digunakan untuk notifikasi/kontak, bukan untuk login.
                </p>
              </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Ganti Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Keamanan Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Password</p>
                <p className="text-xs text-slate-400">
                  {profile.password_changed
                    ? "Sudah pernah diubah"
                    : "Belum pernah diubah"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(true)}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                Ganti Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                  Password berhasil diubah!
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Saat Ini</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Masukkan password saat ini"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    handlePasswordChange("currentPassword", e.target.value)
                  }
                  required
                  disabled={isPending}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    minLength={8}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Ulangi password baru"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    minLength={8}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengubah...
                    </>
                  ) : (
                    "Ubah Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
