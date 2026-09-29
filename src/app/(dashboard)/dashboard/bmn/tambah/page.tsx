"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Input,
  Select,
  Label,
} from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { users } from "@/components/shared/mock-data";

export default function TambahAsetPage() {
  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    kategori: "" as string,
    lokasi: "",
    kondisi: "" as string,
    tanggalPerkiraan: "",
    penanggungJawab: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form data:", formData);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bmn">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tambah Aset Baru</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lengkapi informasi aset BMN yang akan ditambahkan
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Dasar */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Informasi Dasar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Aset</Label>
              <Input
                id="nama"
                placeholder="Masukkan nama aset"
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
                placeholder="Contoh: BMN-SAR-005"
                value={formData.kode}
                onChange={(e) =>
                  setFormData({ ...formData, kode: e.target.value })
                }
                required
              />
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
                <option value="Kendaraan">Kendaraan</option>
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
                placeholder="Contoh: Gudang SAR Lt. 1"
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
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Detail</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">Pilih kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalPerkiraan">
                Tanggal Perkiraan
              </Label>
              <Input
                id="tanggalPerkiraan"
                type="date"
                value={formData.tanggalPerkiraan}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPerkiraan: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
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
                    {user.nama} — {user.role}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Dokumen */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Dokumen</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>BPKB / STNK</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Drag & drop file atau klik untuk upload
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, JPG, PNG (maks. 5MB)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Foto Aset</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Drag & drop file atau klik untuk upload
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  JPG, PNG (maks. 5MB)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/bmn">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </div>
  );
}
