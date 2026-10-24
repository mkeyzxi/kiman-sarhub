"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wrench, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  users,
  type TingkatKeparahan,
 
} from "@/components/shared/mock-data";
import { addTicket } from "@/components/shared/ticket-store";
import { buatUsulanApproval } from "@/components/shared/db-writes";
import { useAsets } from "@/components/shared/use-supabase-data";
import { useSesiUser } from "@/components/shared/use-session";
import { DataLoading, DataError } from "@/components/shared/data-state";

const keparahanOptions: TingkatKeparahan[] = ["Rendah", "Sedang", "Tinggi"];

const keparahanHints: Record<TingkatKeparahan, string> = {
  Rendah: "Kerusakan ringan, unit masih bisa dipakai untuk operasional.",
  Sedang: "Unit berfungsi terbatas, perlu segera diperbaiki.",
  Tinggi: "Unit tidak dapat dipakai untuk operasional.",
};

export default function BuatTiketPage() {
  // Aset dari Supabase.
  const { data: asetList, loading, error, refetch } = useAsets();
  const [formData, setFormData] = useState({
    asetId: "",
    judul: "",
    deskripsi: "",
    tingkatKeparahan: "Sedang" as TingkatKeparahan,
    assignedTo: "",
  });

  const router = useRouter();
  const ses = useSesiUser();
  const [menyimpan, setMenyimpan] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  if (loading) {
    return <DataLoading label="Memuat daftar aset…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat aset dari database"
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenyimpan(true);
    setGagal(null);
    const tiket = addTicket({
      asetId: formData.asetId,
      judul: formData.judul,
      deskripsi: formData.deskripsi,
      tingkatKeparahan: formData.tingkatKeparahan,
      assignedTo: formData.assignedTo,
    });

    // Tiket atas aset rusak otomatis membuat usulan untuk pimpinan
    // (KAKANSAR) — diputus di /pimpinan/approval.
    if (
      asetTerpilih &&
      (asetTerpilih.status === "Rusak Ringan" ||
        asetTerpilih.status === "Rusak Berat")
    ) {
      try {
        await buatUsulanApproval({
          id: `apr-${tiket.id}`,
          kode: `UP-${asetTerpilih.kode}`,
          namaAset: asetTerpilih.nama,
          kategori: asetTerpilih.kategori,
          pengajuanOleh: ses.id,
          alasan: formData.deskripsi || formData.judul,
          rincian: [
            { label: "Kondisi Aset Lama", value: asetTerpilih.kondisi },
            { label: "Status Aset", value: asetTerpilih.status },
            {
              label: "Tingkat Keparahan Tiket",
              value: formData.tingkatKeparahan,
            },
            { label: "Tiket", value: tiket.id },
          ],
        });
      } catch (e) {
        setGagal(
          e instanceof Error
            ? e.message
            : "Gagal membuat usulan approval ke database"
        );
        setMenyimpan(false);
        return;
      }
    }

    router.push("/bmn/maintenance");
  };

  const asetTerpilih = asetList.find((a) => a.id === formData.asetId);

  // Dropdown tiket hanya memuat aset yang benar-benar bermasalah.
  // Aset kondisi baik tidak perlu tiket maintenance.
  const asetRusak = asetList.filter(
    (a) => a.status === "Rusak Ringan" || a.status === "Rusak Berat"
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/bmn/maintenance">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Tiket Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Laporkan kerusakan atau kebutuhan perawatan sebuah aset
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Aset */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Package className="h-5 w-5 text-primary" />
            Aset Bermasalah
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asetId">Pilih Aset Rusak</Label>
              <Select
                id="asetId"
                value={formData.asetId}
                onChange={(e) =>
                  setFormData({ ...formData, asetId: e.target.value })
                }
                required
              >
                <option value="">Pilih aset rusak (ringan/berat)</option>
                {asetRusak.map((aset) => (
                  <option key={aset.id} value={aset.id}>
                    {aset.kode} ({aset.nama}) — {aset.status}
                  </option>
                ))}
              </Select>
              {asetList.length > 0 && asetRusak.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Belum ada aset berstatus Rusak Ringan/Rusak Berat. Aset masuk
                  ke daftar ini setelah operator menyerahkan kerusakan lewat
                  form checklist &rarr; &quot;Serahkan ke BMN&quot;.
                </p>
              )}
            </div>

            {asetTerpilih && (
              <div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Kondisi Saat Ini
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {asetTerpilih.kondisi}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {asetTerpilih.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Lokasi
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {asetTerpilih.lokasi}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Detail Kerusakan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Wrench className="h-5 w-5 text-primary" />
            Detail Kerusakan
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="judul">Judul Tiket</Label>
              <Input
                id="judul"
                placeholder="Contoh: Mesin Rescue Truck Bunyi Kasar"
                value={formData.judul}
                onChange={(e) =>
                  setFormData({ ...formData, judul: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                rows={5}
                placeholder="Jelaskan gejala kerusakan, kapan terjadi, dan dampaknya terhadap operasional..."
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsi: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Severity & Petugas */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Severity &amp; Penanggung Jawab
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tingkatKeparahan">Tingkat Keparahan</Label>
              <Select
                id="tingkatKeparahan"
                value={formData.tingkatKeparahan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tingkatKeparahan: e.target.value as TingkatKeparahan,
                  })
                }
              >
                {keparahanOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                {keparahanHints[formData.tingkatKeparahan]}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Ditugaskan Kepada</Label>
              <Select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                required
              >
                <option value="">Pilih petugas</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama} ({u.role})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/bmn/maintenance">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit" disabled={menyimpan}>
            {menyimpan ? "Menyimpan..." : "Buat Tiket"}
          </Button>
        </div>
        {gagal && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            {gagal}
          </p>
        )}
      </form>
    </div>
  );
}