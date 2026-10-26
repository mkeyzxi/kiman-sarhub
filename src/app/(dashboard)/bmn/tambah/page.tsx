"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  users,
  STATUS_ASET,
  normalizeNup,
  NUP_MAX_DIGIT,
  todayISODate,
  isValidISODate,
  isKodeAsetTerpakai,
  isNupAsetTerpakai,
  type KategoriAset,
  type KondisiAset,
  type StatusAset,
} from "@/components/shared/mock-data";
import { insertAset } from "@/components/shared/db-writes";

/** Field yang punya pesan error; key tidak ada berarti valid. */
type FormErrors = Partial<
  Record<"kode" | "nup" | "tanggalPenetapan", string>
>;

const KATEGORI_OPTIONS: KategoriAset[] = [
  "Mobil",
  "Motor",
  "Kapal",
  "Peralatan SAR",
  "Komunikasi",
  "Medis",
  "Dokumentasi",
];

const KONDISI_OPTIONS: KondisiAset[] = ["Baik", "Rusak Ringan", "Rusak Berat"];

export default function TambahAsetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(() => ({
    nama: "",
    kode: "",
    nup: "",
    kategori: "" as KategoriAset | "",
    lokasi: "",
    status: "" as StatusAset | "",
    kondisi: "" as KondisiAset | "",
    // Default hari ini. Komponen ini juga dirender di server, jadi nilainya
    // bisa berbeda bila zona waktu server != browser; `suppressHydrationWarning`
    // pada input tanggal di bawah yang menutup selisih tersebut.
    tanggalPenetapan: todayISODate(),
    penanggungJawab: "",
    keterangan: "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [simpanGagal, setSimpanGagal] = useState<string | null>(null);

  /** Validasi field yang punya aturan unik/format. */
  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (isKodeAsetTerpakai(formData.kode)) {
      next.kode = "Kode aset sudah dipakai aset lain.";
    }
    if (isNupAsetTerpakai(formData.nup)) {
      next.nup = "NUP sudah terdaftar pada aset lain.";
    }
    if (!isValidISODate(formData.tanggalPenetapan)) {
      next.tanggalPenetapan = "Tanggal penetapan belum diisi.";
    } else if (formData.tanggalPenetapan > todayISODate()) {
      next.tanggalPenetapan = "Tanggal penetapan tidak boleh di masa depan.";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setMenyimpan(true);
    setSimpanGagal(null);
    try {
      const id = crypto.randomUUID();
      await insertAset({
        id,
        nama: formData.nama.trim(),
        kode: formData.kode.trim(),
        nup: formData.nup,
        kategori: formData.kategori as KategoriAset,
        status: formData.status as StatusAset,
        lokasi: formData.lokasi.trim(),
        kondisi: formData.kondisi as KondisiAset,
        tanggalPenetapan: formData.tanggalPenetapan,
        penanggungJawab: formData.penanggungJawab,
        keterangan: formData.keterangan.trim() || undefined,
      });
      router.push(`/bmn/${id}`);
    } catch (err) {
      setSimpanGagal(
        err instanceof Error ? err.message : "Gagal menyimpan aset ke database."
      );
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/bmn">
          <Button variant="ghost" size="icon" aria-label="Kembali ke daftar aset">
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

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Error dari database (RLS / duplikat / FK) */}
        {simpanGagal && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-800">
              <span className="font-medium">Gagal tersimpan.</span>{" "}
              {simpanGagal}
            </p>
          </div>
        )}

        {/* Ringkasan error */}
        {Object.keys(errors).length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="text-sm text-rose-800">
              <p className="font-medium">Data belum dapat disimpan</p>
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
                placeholder="Contoh: 000013"
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
                  Hanya angka yang diperbolehkan.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select
                id="kategori"
                value={formData.kategori}
                onChange={(e) =>
                  setFormData({ ...formData, kategori: e.target.value as KategoriAset })
                }
                required
              >
                <option value="">Pilih kategori</option>
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
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
                  setFormData({ ...formData, kondisi: e.target.value as KondisiAset })
                }
                required
              >
                <option value="">Pilih kondisi</option>
                {KONDISI_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as StatusAset })
                }
                required
              >
                <option value="">Pilih status</option>
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
                suppressHydrationWarning
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
                {users
                  .filter(
                    (user) =>
                      user.role === "OPERATOR_LAPANGAN" && user.aktif
                  )
                  .map((user) => (
                    <option key={user.nip} value={user.nip}>
                      {user.nama} ({user.role})
                    </option>
                  ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Keterangan */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Keterangan
          </h2>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Catatan / Keterangan Aset</Label>
            <Textarea
              id="keterangan"
              rows={4}
              placeholder="Contoh: Unit Allison Transmission, digunakan untuk operasi di perairan terbuka."
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
            />
            <p className="text-xs text-slate-500">
              Keterangan singkat tentang spesifikasi, fungsi, atau catatan
              khusus aset ini.
            </p>
          </div>
        </Card>

        {/* Dokumen */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Dokumen
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>BPKB / STNK</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Drag &amp; drop file atau klik untuk upload
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
                  Drag &amp; drop file atau klik untuk upload
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
          <Link href="/bmn">
            <Button variant="outline" type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={menyimpan}>
            {menyimpan ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </div>
  );
}