"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  getAsetById,
  users,
  STATUS_ASET,
  normalizeNup,
  NUP_MAX_DIGIT,
  todayISODate,
  isValidISODate,
  isKodeAsetTerpakai,
  isNupAsetTerpakai,
  updateAset,
  formatTanggal,
  type RiwayatAset,
  type KategoriAset,
  type KondisiAset,
  type StatusAset,
} from "@/components/shared/mock-data";

/** Field yang punya pesan error; key tidak ada berarti valid. */
type FormErrors = Partial<
  Record<"kode" | "nup" | "tanggalPenetapan", string>
>;

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
    tanggalPenetapan: aset?.tanggalPenetapan ?? "",
    penanggungJawab: aset?.penanggungJawab ?? "",
    status: aset?.status ?? "",
    keterangan: aset?.keterangan ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

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

  /** Validasi field yang punya aturan unik/format; `id` dikecualikan. */
  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (isKodeAsetTerpakai(formData.kode, aset.id)) {
      next.kode = "Kode aset sudah dipakai aset lain.";
    }
    if (isNupAsetTerpakai(formData.nup, aset.id)) {
      next.nup = "NUP sudah terdaftar pada aset lain.";
    }
    if (!isValidISODate(formData.tanggalPenetapan)) {
      next.tanggalPenetapan = "Tanggal penetapan belum diisi.";
    } else if (formData.tanggalPenetapan > todayISODate()) {
      next.tanggalPenetapan = "Tanggal penetapan tidak boleh di masa depan.";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Bila tanggal penetapan berubah, catat ke riwayat agar jejak audit konsisten.
    const tanggalPenetapanBerubah =
      formData.tanggalPenetapan !== aset.tanggalPenetapan;
    const riwayatBaru: RiwayatAset[] = tanggalPenetapanBerubah
      ? [
          {
            tanggal: todayISODate(),
            aksi: "Perubahan Tanggal Penetapan",
            keterangan: `Tanggal penetapan diubah dari ${formatTanggal(aset.tanggalPenetapan)} menjadi ${formatTanggal(formData.tanggalPenetapan)}`,
            userId: formData.penanggungJawab,
          },
        ]
      : [];

    updateAset(
      aset.id,
      {
        nama: formData.nama.trim(),
        kode: formData.kode.trim(),
        nup: formData.nup,
        kategori: formData.kategori as KategoriAset,
        lokasi: formData.lokasi.trim(),
        kondisi: formData.kondisi as KondisiAset,
        tanggalPenetapan: formData.tanggalPenetapan,
        penanggungJawab: formData.penanggungJawab,
        status: formData.status as StatusAset,
        keterangan: formData.keterangan.trim() || undefined,
      },
      riwayatBaru
    );

    // TODO: ganti navigasi ini dengan redirect setelah API berhasil menyimpan.
    router.push(`/bmn/${aset.id}`);
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

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Ringkasan error */}
        {Object.keys(errors).length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="text-sm text-rose-800">
              <p className="font-medium">Perubahan belum dapat disimpan</p>
              <ul className="mt-1 list-inside list-disc">
                {Object.values(errors).map((pesan) => (
                  <li key={pesan}>{pesan}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
              {errors.kode && (
                <p className="text-xs text-rose-600">{errors.kode}</p>
              )}
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
              {errors.nup ? (
                <p className="text-xs text-rose-600">{errors.nup}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  Nomor urut pendaftaran BMN, maksimal {NUP_MAX_DIGIT} digit.
                </p>
              )}
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
              <Label htmlFor="tanggalPenetapan">Tanggal Penetapan</Label>
              <Input
                id="tanggalPenetapan"
                type="date"
                max={todayISODate()}
                value={formData.tanggalPenetapan}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPenetapan: e.target.value })
                }
                required
              />
              {errors.tanggalPenetapan ? (
                <p className="text-xs text-rose-600">
                  {errors.tanggalPenetapan}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Tanggal resmi aset ditetapkan sebagai BMN. Tidak boleh di masa
                  depan.
                </p>
              )}
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