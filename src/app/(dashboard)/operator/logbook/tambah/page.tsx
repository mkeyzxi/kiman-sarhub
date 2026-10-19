"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ship, MapPin, Fuel, Car, Bike, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { users, asetList, parseEndurance } from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";

/**
 * Kategori unit untuk logbook perjalanan.
 * Masing-masing kategori menarik daftar unit dari asetList sesuai mapping KategoriAset.
 */
type KategoriLogbook = "Kapal" | "RIB" | "RBB" | "Mobil" | "Motor";

const kategoriLogbookOptions: { value: KategoriLogbook; label: string; icon: React.ElementType }[] = [
  { value: "RIB", label: "RIB / Perahu", icon: Ship },
  { value: "RBB", label: "RBB", icon: Ship },
  { value: "Kapal", label: "Kapal", icon: Anchor },
  { value: "Mobil", label: "Mobil", icon: Car },
  { value: "Motor", label: "Motor", icon: Bike },
];

/** Armada laut memakai endurance; armada darat memakai kilometer. */
const ARMADA_LAUT: readonly KategoriLogbook[] = ["Kapal", "RIB", "RBB"];

function isArmadaLaut(kategori: KategoriLogbook): boolean {
  return ARMADA_LAUT.includes(kategori);
}

/** Daftar unit berdasarkan kategori, termasuk unit-unit standar yang tetap + dari asetList. */
function getUnitOptions(kategori: KategoriLogbook): { value: string; label: string }[] {
  const staticUnits: Record<KategoriLogbook, { value: string; label: string }[]> = {
    RIB: [
      { value: "RIB 9 M", label: "RIB 9 M" },
      { value: "RIB 12 M", label: "RIB 12 M" },
    ],
    RBB: [
      { value: "RBB 309 MAMUJU", label: "RBB 309 MAMUJU" },
    ],
    Kapal: [
      { value: "KN SAR MAMUJU 01", label: "KN SAR MAMUJU 01" },
    ],
    Mobil: [],
    Motor: [],
  };

  // Tambahkan dari asetList yang cocok kategori
  const kategoriMap: Record<KategoriLogbook, string[]> = {
    RIB: ["Peralatan SAR"],
    RBB: ["Peralatan SAR"],
    Kapal: ["Kapal"],
    Mobil: ["Mobil"],
    Motor: ["Motor"],
  };

  const asetUnits = asetList
    .filter((a) => kategoriMap[kategori].includes(a.kategori))
    .map((a) => ({ value: a.nama, label: `${a.nama} (${a.kode})` }));

  // Gabungkan tanpa duplikat (berdasarkan value)
  const merged = [...staticUnits[kategori]];
  asetUnits.forEach((u) => {
    if (!merged.some((m) => m.value === u.value)) {
      merged.push(u);
    }
  });

  return merged;
}

/** Apakah kategori ini kendaraan darat (butuh KM) */
function isDarat(kategori: KategoriLogbook) {
  return kategori === "Mobil" || kategori === "Motor";
}

/** Label operator unit tergantung kategori */
function getOperatorLabel(kategori: KategoriLogbook) {
  if (isArmadaLaut(kategori)) return "Nahkoda";
  if (kategori === "Motor") return "Pengemudi";
  return "Pengemudi / Driver";
}

/**
 * Bersihkan input endurance saat diketik: hanya izinkan angka dengan satu titik
 * dua, maksimal 3 digit jam dan 2 digit menit.
 */
function sanitizeEndurance(nilai: string): string {
  const parts = nilai.split(":");
  if (parts.length === 1) return parts[0].replace(/\D/g, "").slice(0, 3);

  const jam = (parts[0] ?? "").replace(/\D/g, "").slice(0, 3);
  const menit = parts
    .slice(1)
    .join(":")
    .replace(/\D/g, "")
    .slice(0, 2);
  return `${jam}:${menit}`;
}

/** Pesan validasi endurance; string kosong berarti tidak ada error. */
type EnduranceError = { awal?: string; akhir?: string };

function validateEndurance(form: {
  enduranceAwal: string;
  enduranceAkhir: string;
}): EnduranceError {
  const error: EnduranceError = {};
  const pola = /^(\d{1,3}):([0-5]\d)$/;

  if (form.enduranceAwal === "") {
    error.awal = "Endurance awal wajib diisi.";
  } else if (!pola.test(form.enduranceAwal)) {
    error.awal = "Format harus HH:MM, contoh 80:30.";
  }

  if (form.enduranceAkhir !== "" && !pola.test(form.enduranceAkhir)) {
    error.akhir = "Format harus HH:MM, contoh 80:30.";
  } else if (form.enduranceAkhir !== "" && pola.test(form.enduranceAwal)) {
    const awal = parseEndurance(form.enduranceAwal);
    const akhir = parseEndurance(form.enduranceAkhir);
    if (awal && akhir && akhir.jam > awal.jam) {
      error.akhir = "Endurance akhir tidak boleh lebih besar dari endurance awal.";
    }
  }

  return error;
}

export default function TambahLogbookPage() {
  const [enduranceError, setEnduranceError] = useState<EnduranceError>({});
  const [formData, setFormData] = useState({
    tanggal: "",
    jamBerangkat: "",
    jamKembali: "",
    rute: "",
    tujuan: "",
    kategoriUnit: "RIB" as KategoriLogbook,
    jenisUnit: "RIB 9 M",
    operator: "",
    jumlahPersonel: "1",
    bbmSebelum: "",
    bbmSesudah: "",
    enduranceAwal: "",
    enduranceAkhir: "",
    kmSebelum: "",
    kmSesudah: "",
    status: "Dijadwalkan",
    catatan: "",
  });

  const unitOptions = useMemo(
    () => getUnitOptions(formData.kategoriUnit),
    [formData.kategoriUnit]
  );

  // Reset jenisUnit ketika kategori berubah
  const handleKategoriChange = (kategori: KategoriLogbook) => {
    const units = getUnitOptions(kategori);
    setEnduranceError({});
    setFormData({
      ...formData,
      kategoriUnit: kategori,
      jenisUnit: units[0]?.value ?? "",
      // reset km jika beralih ke laut, reset endurance jika beralih ke darat
      kmSebelum: isDarat(kategori) ? formData.kmSebelum : "",
      kmSesudah: isDarat(kategori) ? formData.kmSesudah : "",
      enduranceAwal: isArmadaLaut(kategori) ? formData.enduranceAwal : "",
      enduranceAkhir: isArmadaLaut(kategori) ? formData.enduranceAkhir : "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form data:", formData);
  };

  const KategoriIcon = kategoriLogbookOptions.find(
    (k) => k.value === formData.kategoriUnit
  )?.icon ?? Ship;

  const rutePlaceholder = isDarat(formData.kategoriUnit)
    ? "Contoh: Kantor SAR Mamuju - Desa Binanga"
    : "Contoh: Dermaga Mamuju - Perairan Mamuju";

  const tujuanPlaceholder = isDarat(formData.kategoriUnit)
    ? "Contoh: Patroli darat, Evakuasi korban, Distribusi logistik"
    : "Contoh: Patroli rutin, Operasi evakuasi, Sosialisasi";

  const catatanPlaceholder = isDarat(formData.kategoriUnit)
    ? "Kondisi jalan, cuaca, insiden, atau keterangan lain..."
    : "Kondisi laut, cuaca, insiden, atau keterangan lain...";

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
                placeholder={rutePlaceholder}
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
                placeholder={tujuanPlaceholder}
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
            <KategoriIcon className="h-5 w-5 text-primary" />
            Unit &amp; Personel
          </h2>

          {/* Pilihan Kategori Unit — visual toggle */}
          <div className="mb-5">
            <Label>Kategori Unit</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kategoriLogbookOptions.map((opt) => {
                const isActive = formData.kategoriUnit === opt.value;
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleKategoriChange(opt.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <IconComp className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

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
                {unitOptions.length === 0 && (
                  <option value="">— Tidak ada unit tersedia —</option>
                )}
                {unitOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500">
                {isDarat(formData.kategoriUnit)
                  ? "Pilih unit kendaraan darat yang digunakan"
                  : "Pilih unit kapal/RIB yang digunakan"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator">
                {getOperatorLabel(formData.kategoriUnit)}
              </Label>
              <Select
                id="operator"
                value={formData.operator}
                onChange={(e) =>
                  setFormData({ ...formData, operator: e.target.value })
                }
                required
              >
                <option value="">Pilih {getOperatorLabel(formData.kategoriUnit).toLowerCase()}</option>
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

        {/* BBM, KM & Catatan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Fuel className="h-5 w-5 text-primary" />
            BBM{isDarat(formData.kategoriUnit) ? ", Kilometer" : ", Endurance"} &amp; Catatan
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

            {/* Endurance hanya untuk armada laut: Kapal, RIB, RBB */}
            {isArmadaLaut(formData.kategoriUnit) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enduranceAwal">Endurance Awal (HH:MM)</Label>
                  <Input
                    id="enduranceAwal"
                    inputMode="numeric"
                    placeholder="Contoh: 80:30"
                    value={formData.enduranceAwal ?? ""}
                    onChange={(e) => {
                      setEnduranceError((prev) => ({ ...prev, awal: undefined }));
                      setFormData({
                        ...formData,
                        enduranceAwal: sanitizeEndurance(e.target.value),
                      });
                    }}
                    onBlur={() => setEnduranceError(validateEndurance(formData))}
                    className={enduranceError.awal ? "border-red-300" : undefined}
                    aria-invalid={enduranceError.awal ? true : undefined}
                    required
                  />
                  {enduranceError.awal && (
                    <p className="text-xs text-red-600">{enduranceError.awal}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enduranceAkhir">Endurance Akhir (HH:MM)</Label>
                  <Input
                    id="enduranceAkhir"
                    inputMode="numeric"
                    placeholder="Kosongkan bila belum kembali"
                    value={formData.enduranceAkhir ?? ""}
                    onChange={(e) => {
                      setEnduranceError((prev) => ({ ...prev, akhir: undefined }));
                      setFormData({
                        ...formData,
                        enduranceAkhir: sanitizeEndurance(e.target.value),
                      });
                    }}
                    onBlur={() => setEnduranceError(validateEndurance(formData))}
                    className={enduranceError.akhir ? "border-red-300" : undefined}
                    aria-invalid={enduranceError.akhir ? true : undefined}
                  />
                  {enduranceError.akhir && (
                    <p className="text-xs text-red-600">{enduranceError.akhir}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Sisa jam dan menit operasi sebelum kehabisan BBM. Dicatat
                    saat armada kembali ke dermaga.
                  </p>
                </div>
              </div>
            )}

            {/* KM hanya untuk kendaraan darat */}
            {isDarat(formData.kategoriUnit) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kmSebelum">Kilometer Sebelum (KM)</Label>
                  <Input
                    id="kmSebelum"
                    type="number"
                    min={0}
                    placeholder="Contoh: 45230"
                    value={formData.kmSebelum}
                    onChange={(e) =>
                      setFormData({ ...formData, kmSebelum: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kmSesudah">Kilometer Sesudah (KM)</Label>
                  <Input
                    id="kmSesudah"
                    type="number"
                    min={0}
                    placeholder="Kosongkan bila belum kembali"
                    value={formData.kmSesudah}
                    onChange={(e) =>
                      setFormData({ ...formData, kmSesudah: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                rows={4}
                placeholder={catatanPlaceholder}
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