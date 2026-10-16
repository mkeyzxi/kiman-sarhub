"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  getAsetById,
  users,
  STATUS_ASET,
  normalizeNup,
  NUP_MAX_DIGIT,
} from "@/components/shared/mock-data";

export default function EditAsetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const aset = getAsetById(params.id);

  const [formData, setFormData] = useState({
    nama: aset?.nama ?? "",
    kode: aset?.kode ?? "",
    nup: aset?.nup ?? "",
    kategori: aset?.kategori ?? "",
    lokasi: aset?.lokasi ?? "",
    kondisi: aset?.kondisi ?? "",
    tanggalPerkiraan: aset?.tanggalPerkiraan ?? "",
    penanggungJawab: aset?.penanggungJawab ?? "",
    status: aset?.status ?? "",
    keterangan: aset?.keterangan ?? "",
  });

  if (!aset) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Package className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">Aset tidak ditemukan</h1>
        <p className="text-sm text-slate-500">
          Aset dengan ID &quot;{params.id}&quot; tidak tersedia.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form data:", formData);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/bmn/${aset.id}`}>
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Aset</h1>
          <p className="mt-1 text-sm text-slate-500">
            {aset.kode} — {aset.nama}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Dasar */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Informasi Dasar
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Aset</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Aset</Label>
              <Input
                id="kode"
                value={formData.kode}
                onChange={(e) =>
                  setFormData({ ...formData, kode: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nup">NUP (Nomor Urut Pendaftaran)</Label>
              <Input
                id="nup"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={NUP_MAX_DIGIT}
                value={formData.nup}
                onChange={(e) =>
                  setFormData({ ...formData, nup: normalizeNup(e.target.value) })
                }
                required
              />
              <p className="text-xs text-slate-500">
                Nomor urut pendaftaran BMN, maksimal {NUP_MAX_DIGIT} digit.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select
                id="kategori"
                value={formData.kategori}
                onChange={(e) =>
                  setFormData({ ...formData, kategori: e.target.value })
                }
                required
              >
                <option value="">Pilih kategori</option>
                <option value="Mobil">Mobil</option>
                <option value="Motor">Motor</option>
                <option value="Peralatan SAR">Peralatan SAR</option>
                <option value="Komunikasi">Komunikasi</option>
                <option value="Medis">Medis</option>
                <option value="Dokumentasi">Dokumentasi</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) =>
                  setFormData({ ...formData, lokasi: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Detail */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Detail</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kondisi">Kondisi</Label>
              <Select
                id="kondisi"
                value={formData.kondisi}
                onChange={(e) =>
                  setFormData({ ...formData, kondisi: e.target.value })
                }
                required
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                required
              >
                {STATUS_ASET.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalPerkiraan">Tanggal Perkiraan</Label>
              <Input
                id="tanggalPerkiraan"
                type="date"
                value={formData.tanggalPerkiraan}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPerkiraan: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penanggungJawab">Penanggung Jawab</Label>
              <Select
                id="penanggungJawab"
                value={formData.penanggungJawab}
                onChange={(e) =>
                  setFormData({ ...formData, penanggungJawab: e.target.value })
                }
                required
              >
                <option value="">Pilih penanggung jawab</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nama}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Keterangan */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Keterangan
          </h2>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Catatan / Keterangan Aset</Label>
            <Textarea
              id="keterangan"
              rows={4}
              placeholder="Spesifikasi, fungsi, atau catatan khusus aset ini."
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/bmn/${aset.id}`}>
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit">Simpan Perubahan</Button>
        </div>
      </form>
    </div>
  );
}