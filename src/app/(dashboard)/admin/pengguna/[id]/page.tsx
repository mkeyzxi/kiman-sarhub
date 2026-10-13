import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  User,
  Mail,
  Phone,
  Shield,
  IdCard,
  KeyRound,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getUserById, logAktivitas } from "@/components/shared/mock-data";
import { roleLabels, roleDescriptions, navGroupsByRole } from "@/config/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPenggunaPage({ params }: PageProps) {
  const { id } = await params;
  const user = getUserById(id);

  if (!user) {
    notFound();
  }

  const aksesModul = navGroupsByRole[user.role] ?? [];
  const aktivitas = logAktivitas.filter((log) => log.userId === user.id);

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
                  .slice(0, 2)}
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
          <Link href={`/admin/pengguna/${user.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

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
                  {user.nip}
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
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  No. Telepon
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {user.noTelepon}
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
          {aktivitas.length > 0 ? (
            <ul className="space-y-3">
              {aktivitas.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg bg-slate-50 p-3 text-sm"
                >
                  <p className="text-slate-700">{log.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(log.tanggal).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Shield className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                Belum ada aktivitas tercatat untuk pengguna ini.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}