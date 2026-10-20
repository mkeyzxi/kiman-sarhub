"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  User,
  Mail,
  Shield,
  IdCard,
  KeyRound,
  Activity,
  Trash2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { roleLabels, roleDescriptions, navGroupsByRole } from "@/config/navigation";
import type { UserProfile } from "@/types/supabase";
import { PasswordModal } from "./password-modal";

export function UserDetailClient({ user }: { user: UserProfile }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const aksesModul = navGroupsByRole[user.role] ?? [];

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/pengguna/${user.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal menghapus pengguna");
      }

      setDeleteSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/pengguna";
      }, 2000);
    } catch (err: any) {
      setDeleteError(err.message || "Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
    }
  };

  if (deleteSuccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
          Pengguna berhasil dihapus! Mengalihkan ke daftar pengguna...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pengguna"
            aria-label="Kembali ke daftar pengguna"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary-light">
              <span className="text-sm font-bold text-primary">
                {user.nama
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{user.nama}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.aktif ? "success" : "danger"} className="px-3 py-1">
            {user.aktif ? "Aktif" : "Nonaktif"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
            <Lock className="h-4 w-4" />
            Ganti Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
          <Link href={`/admin/pengguna/${user.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {deleteError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      {/* Informasi Akun */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <IdCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  NIP
                </p>
                <p className="font-mono text-sm font-medium text-slate-800">
                  {user.nip || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Email
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  User ID
                </p>
                <p className="font-mono text-sm font-medium text-slate-800">
                  {user.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hak Akses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>Hak Akses</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            {roleDescriptions[user.role]}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aksesModul.map((group) => (
              <div
                key={group.title}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="mb-2 text-sm font-medium text-slate-800">
                  {group.title}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item.href}
                      className="flex items-center gap-2 text-xs text-slate-500"
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aktivitas Terakhir */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Aktivitas Terakhir</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Shield className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              Belum ada aktivitas tercatat untuk pengguna ini.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  Hapus Pengguna
                </h3>
                <p className="text-sm text-slate-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-slate-600">
              Anda akan menghapus akun{" "}
              <strong>{user.nama}</strong> ({user.email}). Pengguna tidak akan
              bisa login lagi, namun data akan tetap tersimpan di database.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Hapus Pengguna"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordModal
          userId={user.id}
          userName={user.nama}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}