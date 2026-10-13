"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ship, MapPin, Fuel, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { users } from "@/components/shared/mock-data";

export default function TambahLogbookPage() {
  const [formData, setFormData] = useState({
    tanggal: "",
    jamBerangkat: "",
    jamKembali: "",
    rute: "",
    tujuan: "",
    jenisUnit: "RIB 9 M",
    nahkoda: "",
    jumlahPersonel: "1",
    bbmSebelum: "",
    bbmSesudah: "",
    status: "Dijadwalkan",
    catatan: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form data:", formData);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/operator/logbook">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tambah Logbook Perjalanan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Catat perjalanan unit dan hasil kegiatan lapangan
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Jadwal */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Jadwal Perjalanan
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Dijadwalkan">Dijadwalkan</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jamBerangkat">Jam Berangkat</Label>
              <Input
                id="jamBerangkat"
                type="time"
                value={formData.jamBerangkat}
                onChange={(e) =>
                  setFormData({ ...formData, jamBerangkat: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jamKembali">Jam Kembali</Label>
              <Input
                id="jamKembali"
                type="time"
                value={formData.jamKembali}
                onChange={(e) =>
                  setFormData({ ...formData, jamKembali: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                Kosongkan bila perjalanan masih berlangsung.
              </p>
            </div>
          </div>
        </Card>

        {/* Rute & Tujuan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <MapPin className="h-5 w-5 text-primary" />
            Rute &amp; Tujuan
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rute">Rute</Label>
              <Input
                id="rute"
                placeholder="Contoh: Dermaga Mamuju - Perairan Mamuju"
                value={formData.rute}
                onChange={(e) =>
                  setFormData({ ...formData, rute: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tujuan">Tujuan Kegiatan</Label>
              <Input
                id="tujuan"
                placeholder="Contoh: Patroli rutin, Operasi evakuasi, Sosialisasi"
                value={formData.tujuan}
                onChange={(e) =>
                  setFormData({ ...formData, tujuan: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Unit & Personel */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Ship className="h-5 w-5 text-primary" />
            Unit &amp; Personel
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jenisUnit">Jenis Unit</Label>
              <Select
                id="jenisUnit"
                value={formData.jenisUnit}
                onChange={(e) =>
                  setFormData({ ...formData, jenisUnit: e.target.value })
                }
              >
                <option value="RIB 9 M">RIB 9 M</option>
                <option value="RIB 12 M">RIB 12 M</option>
                <option value="KN SAR MAMUJU 01">KN SAR MAMUJU 01</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nahkoda">Nahkoda</Label>
              <Select
                id="nahkoda"
                value={formData.nahkoda}
                onChange={(e) =>
                  setFormData({ ...formData, nahkoda: e.target.value })
                }
                required
              >
                <option value="">Pilih nahkoda</option>
                {users.map((user) => (
                  <option key={user.id} value={user.nama}>
                    {user.nama}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlahPersonel">Jumlah Personel</Label>
              <Input
                id="jumlahPersonel"
                type="number"
                min={1}
                value={formData.jumlahPersonel}
                onChange={(e) =>
                  setFormData({ ...formData, jumlahPersonel: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* BBM & Catatan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Fuel className="h-5 w-5 text-primary" />
            BBM &amp; Catatan
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bbmSebelum">BBM Sebelum (%)</Label>
                <Input
                  id="bbmSebelum"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Contoh: 90"
                  value={formData.bbmSebelum}
                  onChange={(e) =>
                    setFormData({ ...formData, bbmSebelum: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bbmSesudah">BBM Sesudah (%)</Label>
                <Input
                  id="bbmSesudah"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Kosongkan bila belum kembali"
                  value={formData.bbmSesudah}
                  onChange={(e) =>
                    setFormData({ ...formData, bbmSesudah: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                rows={4}
                placeholder="Kondisi laut,cuaca, insiden, atau keterangan lain..."
                value={formData.catatan}
                onChange={(e) =>
                  setFormData({ ...formData, catatan: e.target.value })
                }
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/operator/logbook">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit">Simpan Logbook</Button>
        </div>
      </form>
    </div>
  );
}