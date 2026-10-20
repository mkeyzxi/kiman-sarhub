"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, IdCard, Lock, Loader2, Save, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/config/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { UserProfile } from "@/types/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    email: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Gunakan Supabase SSR client untuk mengambil session token
  async function getAccessToken(): Promise<string> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  }

  async function fetchProfile() {
    try {
      setLoading(true);

      const token = await getAccessToken();
      if (!token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat profil");
      }

      setProfile(json.data);
      setFormData({
        nama: json.data.nama || "",
        nip: json.data.nip || "",
        email: json.data.email || "",
      });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

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
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Email valid wajib diisi");
      return;
    }

    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal memperbarui profil");
      }

      setSuccess("Profil berhasil diperbarui!");
      setProfile(json.data);
      localStorage.setItem("userNama", json.data.nama);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
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

    setPasswordLoading(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    } catch (err: any) {
      setPasswordError(err.message || "Terjadi kesalahan");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <p className="mt-1 font-medium text-slate-800">
                {roleLabels[profile.role]}
              </p>
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
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-nip">NIP</Label>
                <Input
                  id="profile-nip"
                  value={formData.nip}
                  onChange={(e) => handleProfileChange("nip", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                required
                disabled={saving}
              />
              <p className="text-xs text-slate-400">
                Email digunakan untuk login. Pastikan email aktif.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
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
                  {profile.password_changed ? "Sudah pernah diubah" : "Belum pernah diubah"}
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
                  disabled={passwordLoading}
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
                    disabled={passwordLoading}
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
                    disabled={passwordLoading}
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
                  disabled={passwordLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
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