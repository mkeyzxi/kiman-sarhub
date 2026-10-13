"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Package,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getAsetById,
  getUserById,
  formatTanggal,
  type TingkatKeparahan,
  type StatusTicket,
} from "@/components/shared/mock-data";
import { useTickets, updateTicketStatus } from "@/components/shared/ticket-store";
import { cn } from "@/lib/utils";

const severityVariant: Record<TingkatKeparahan, "danger" | "warning" | "success"> = {
  Tinggi: "danger",
  Sedang: "warning",
  Rendah: "success",
};

const statusVariant: Record<StatusTicket, "warning" | "default" | "success"> = {
  Menunggu: "warning",
  Diproses: "default",
  Selesai: "success",
};

const statusIcon: Record<StatusTicket, typeof Clock> = {
  Menunggu: Clock,
  Diproses: Wrench,
  Selesai: CheckCircle2,
};

export default function DetailTiketPage() {
  const params = useParams<{ id: string }>();
  const tickets = useTickets();
  const ticket = tickets.find((t) => t.id === params.id);

  if (!ticket) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Wrench className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">Tiket tidak ditemukan</h1>
        <p className="text-sm text-slate-500">
          Tiket dengan ID &quot;{params.id}&quot; tidak tersedia.
        </p>
        <Link href="/bmn/maintenance">
          <Button variant="outline">Kembali ke daftar tiket</Button>
        </Link>
      </div>
    );
  }

  const aset = getAsetById(ticket.asetId);
  const petugas = getUserById(ticket.assignedTo);
  const StatusIcon = statusIcon[ticket.status];

  const alur = [
    { label: "Dilaporkan", value: ticket.tanggalBuat },
    { label: "Diperbarui", value: ticket.tanggalUpdate },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bmn/maintenance"
            aria-label="Kembali ke daftar tiket"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ticket.judul}</h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{ticket.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={severityVariant[ticket.tingkatKeparahan]}>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {ticket.tingkatKeparahan}
          </Badge>
          <Badge variant={statusVariant[ticket.status]} className="px-3 py-1">
            {ticket.status}
          </Badge>
        </div>
      </div>

      {/* Aset terkait */}
      {aset && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Aset Terkait
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Nama Aset
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {aset.nama}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Kode
                  </p>
                  <p className="font-mono text-sm font-medium text-slate-800">
                    {aset.kode}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Lokasi
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {aset.lokasi}
                  </p>
                </div>
              </div>
              <Link href={`/bmn/${aset.id}`}>
                <Button variant="outline" size="sm">
                  Lihat Aset
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deskripsi */}
      <Card>
        <CardHeader>
          <CardTitle>Deskripsi Kerusakan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {ticket.deskripsi}
          </p>
        </CardContent>
      </Card>

      {/* Timeline & petugas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Riwayat Tiket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {alur.map((a, i) => (
                <li key={a.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        i === 0
                          ? "bg-primary-light text-primary"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                    </div>
                    {i < alur.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-slate-200" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-medium text-slate-800">
                      {a.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTanggal(a.value)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Penanggung Jawab
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-light">
                <span className="text-sm font-bold text-primary">
                  {petugas?.nama?.charAt(0) ?? "?"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {petugas?.nama ?? "-"}
                </p>
                <p className="text-xs text-slate-500">{petugas?.role ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  ticket.status === "Selesai"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                )}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Status Saat Ini
                </p>
                <p className="text-xs text-slate-500">{ticket.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aksi */}
      {ticket.status !== "Selesai" && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => updateTicketStatus(ticket.id, "Selesai")}
            >
              <XCircle className="h-4 w-4" />
              Tolak Tiket
            </Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => updateTicketStatus(ticket.id, "Selesai")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Tandai Selesai
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}