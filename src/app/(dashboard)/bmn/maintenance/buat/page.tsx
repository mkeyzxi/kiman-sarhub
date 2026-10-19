"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wrench, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  asetList,
  users,
  type TingkatKeparahan,
} from "@/components/shared/mock-data";
import { addTicket } from "@/components/shared/ticket-store";

const keparahanOptions: TingkatKeparahan[] = ["Rendah", "Sedang", "Tinggi"];

const keparahanHints: Record<TingkatKeparahan, string> = {
  Rendah: "Kerusakan ringan, unit masih bisa dipakai untuk operasional.",
  Sedang: "Unit berfungsi terbatas, perlu segera diperbaiki.",
  Tinggi: "Unit tidak dapat dipakai untuk operasional.",
};

export default function BuatTiketPage() {
  const [formData, setFormData] = useState({
    asetId: "",
    judul: "",
    deskripsi: "",
    tingkatKeparahan: "Sedang" as TingkatKeparahan,
    assignedTo: "",
  });

  const router = useRouter();
  const [menyimpan, setMenyimpan] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMenyimpan(true);
    addTicket({
      asetId: formData.asetId,
      judul: formData.judul,
      deskripsi: formData.deskripsi,
      tingkatKeparahan: formData.tingkatKeparahan,
      assignedTo: formData.assignedTo,
    });
    router.push("/bmn/maintenance");
  };

  const asetTerpilih = asetList.find((a) => a.id === formData.asetId);

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
              <Label htmlFor="asetId">Pilih Aset</Label>
              <Select
                id="asetId"
                value={formData.asetId}
                onChange={(e) =>
                  setFormData({ ...formData, asetId: e.target.value })
                }
                required
              >
                <option value="">Pilih aset yang bermasalah</option>
                {asetList.map((aset) => (
                  <option key={aset.id} value={aset.id}>
                    {aset.kode} ({aset.nama})
                  </option>
                ))}
              </Select>
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
                placeholder="Contoh: Mesin Hilux Bunyi Kasar"
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
      </form>
    </div>
  );
}