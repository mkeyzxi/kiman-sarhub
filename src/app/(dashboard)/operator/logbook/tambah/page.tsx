"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ship,
  MapPin,
  Fuel,
  Car,
  Bike,
  Anchor,
  Info,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  users,
  cariAsetDmUnit,
  type FormLogbook,
  type Aset,
} from "@/components/shared/mock-data";
import { simpanTahapAwal } from "@/components/shared/logbook-store";
import { useAsets } from "@/components/shared/use-supabase-data";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { cn } from "@/lib/utils";

/**
 * Tahap 1 pencatatan logbook perjalanan.
 *
 * Yang dicatat di sini hanya data keberangkatan. Endurance akhir sengaja tidak
 * ada karena belum diketahui sampai armada kembali — diisi pada tahap 2 lewat
 * tombol "Lanjutkan Pengisian" pada catatan yang sama.
 */

const kategoriLogbookOptions: {
  value: NonNullable<FormLogbook["kategoriUnit"]>;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "RIB", label: "RIB / Perahu", icon: Ship },
  { value: "RBB", label: "RBB", icon: Ship },
  { value: "Kapal", label: "Kapal", icon: Anchor },
  { value: "Mobil", label: "Mobil", icon: Car },
  { value: "Motor", label: "Motor", icon: Bike },
];

/** Armada laut memakai endurance; armada darat memakai kilometer. */
const ARMADA_LAUT: readonly string[] = ["Kapal", "RBB", "RIB"];

function isArmadaLaut(kategori: FormLogbook["kategoriUnit"]): boolean {
  return kategori !== "" && ARMADA_LAUT.includes(kategori);
}

/** Label operator unit tergantung kategori */
function getOperatorLabel(kategori: FormLogbook["kategoriUnit"]) {
  if (isArmadaLaut(kategori)) return "Nahkoda";
  if (kategori === "Motor") return "Pengemudi";
  return "Pengemudi / Driver";
}

/** Daftar unit berdasarkan kategori, diambil dari master aset real. */
function getUnitOptions(
  kategori: FormLogbook["kategoriUnit"],
  asets: Aset[]
): {
  value: string;
  label: string;
}[] {
  return asets
    .filter((a) => {
      if (kategori === "Mobil") return a.kategori === "Mobil";
      if (kategori === "Motor") return a.kategori === "Motor";
      if (a.kategori !== "Kapal") return false;
      if (kategori === "RIB") {
        return /RIB|perahu/i.test(a.nama) && !/RBB/i.test(a.nama);
      }
      if (kategori === "RBB") return /RBB/i.test(a.nama);
      if (kategori === "Kapal") return !/RIB|RBB/i.test(a.nama);
      return false;
    })
    .map((a) => ({ value: a.kode, label: `${a.nama} (${a.kode})` }));
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

const FORM_KOSONG: FormLogbook = {
  tanggal: new Date().toISOString().slice(0, 10),
  jamBerangkat: "",
  jamKembali: "",
  rute: "",
  tujuan: "",
  kategoriUnit: "RIB",
  // jenisUnit diisi di runtime oleh komponen (asset belum tersedia saat modul load).
  jenisUnit: "",
  nahkoda: "",
  jumlahPersonel: "1",
  bbmSebelum: "",
  bbmSesudah: "",
  enduranceAwal: "",
  enduranceAkhir: "",
  kmSebelum: "",
  kmSesudah: "",
  catatan: "",
};

export default function TambahLogbookPage() {
  const router = useRouter();
  // Aset dari Supabase — dipakai untuk daftar unit.
  const { data: asetList, loading, error, refetch } = useAsets();
  const [formData, setFormData] = useState<FormLogbook>(FORM_KOSONG);
  const [errors, setErrors] = useState<Partial<Record<keyof FormLogbook, string>>>(
    {}
  );
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  const unitOptions = useMemo(
    () => getUnitOptions(formData.kategoriUnit, asetList),
    [formData.kategoriUnit, asetList]
  );

  const laut = isArmadaLaut(formData.kategoriUnit);

  if (loading) {
    return <DataLoading label="Menyiapkan form logbook…" />;
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

  /** Perbarui satu field dan bersihkan errorassociated-nya. */
  const setField = <K extends keyof FormLogbook>(
    key: K,
    value: FormLogbook[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setErrorUmum(null);
  };

  const handleKategoriChange = (kategori: FormLogbook["kategoriUnit"]) => {
    const units = getUnitOptions(kategori, asetList);
    const keDarat = kategori === "Mobil" || kategori === "Motor";
    setFormData((prev) => ({
      ...prev,
      kategoriUnit: kategori,
      jenisUnit: units[0]?.value ?? "",
      kmSebelum: keDarat ? prev.kmSebelum : "",
      enduranceAwal: keDarat ? "" : prev.enduranceAwal,
    }));
    setErrors({});
    setErrorUmum(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jenisUnit) {
      setErrors((prev) => ({ ...prev, jenisUnit: "Pilih unit terlebih dahulu" }));
      setErrorUmum("Unit belum dipilih.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const asetUnit = cariAsetDmUnit(formData.jenisUnit);
    const hasil = simpanTahapAwal({
      ...formData,
      jenisUnit: asetUnit?.nama ?? formData.jenisUnit,
    });

    if ("error" in hasil) {
      setErrors(hasil.errors as Partial<Record<keyof FormLogbook, string>>);
      setErrorUmum(hasil.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Tahap 1 selesai — arahkan operator ke daftar agar bisa melanjutkan Filling.
    router.push("/operator/logbook");
  };

  const KategoriIcon =
    kategoriLogbookOptions.find((k) => k.value === formData.kategoriUnit)?.icon ??
    Ship;

  const rutePlaceholder = laut
    ? "Contoh: Dermaga Mamuju - Perairan Mamuju"
    : "Contoh: Kantor SAR Mamuju - Desa Binanga";

  const tujuanPlaceholder = laut
    ? "Contoh: Patroli rutin, Operasi evakuasi, Sosialisasi"
    : "Contoh: Patroli darat, Evakuasi korban, Distribusi logistik";

  const catatanPlaceholder = laut
    ? "Kondisi laut, cuaca, insiden, atau keterangan lain..."
    : "Kondisi jalan, cuaca, insiden, atau keterangan lain...";

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
            Tahap 1: catat data keberangkatan armada
          </p>
        </div>
      </div>

      {/* Penjelasan alur dua tahap */}
      <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
        <div className="space-y-2 text-sm text-blue-900">
          <p>
            Pencatatan dilakukan dua tahap agar tidak perlu mengisi ulang dari
            awal saat armada belum kembali.
          </p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>
              <span className="font-medium">Tahap 1 (halaman ini)</span>, simpan
              data keberangkatan. Endurance awal wajib diisi untuk armada laut.
            </li>
            <li>
              <span className="font-medium">Tahap 2 (nanti)</span>, buka lagi
              catatan yang sama lewat tombol{" "}
              <span className="font-medium">Lanjutkan Pengisian</span> untuk
              mengisi jam kembali, endurance akhir, dan BBM sesudah. Catatan ini
              diperbarui, bukan dibuat baru.
            </li>
          </ol>
          <p>
            Status hanya menjadi <span className="font-medium">Selesai</span>{" "}
            setelah seluruh data wajib tahap 2 terisi.
          </p>
        </div>
      </div>

      {errorUmum && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {errorUmum} Lengkapi dulu kolom yang ditandai merah.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Penanda tahap */}
        <div className="flex items-center gap-2">
          <Badge>Tahap 1 dari 2</Badge>
          <span className="text-sm text-slate-500">
            Data keberangkatan. Endurance akhir diisi setelah kembali.
          </span>
        </div>

        {/* Jadwal */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Jadwal Perjalanan
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Tanggal"
              htmlFor="tanggal"
              error={errors.tanggal}
            >
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setField("tanggal", e.target.value)}
                className={cn(errors.tanggal && "border-red-300")}
              />
            </Field>

            <Field
              label="Jam Berangkat"
              htmlFor="jamBerangkat"
              error={errors.jamBerangkat}
              hint="Kosongkan bila armada masih menunggu keberangkatan."
            >
              <Input
                id="jamBerangkat"
                type="time"
                value={formData.jamBerangkat}
                onChange={(e) => setField("jamBerangkat", e.target.value)}
                className={cn(errors.jamBerangkat && "border-red-300")}
              />
            </Field>
          </div>
        </Card>

        {/* Rute & Tujuan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <MapPin className="h-5 w-5 text-primary" />
            Rute &amp; Tujuan
          </h2>
          <div className="space-y-4">
            <Field label="Rute" htmlFor="rute" error={errors.rute}>
              <Input
                id="rute"
                placeholder={rutePlaceholder}
                value={formData.rute}
                onChange={(e) => setField("rute", e.target.value)}
                className={cn(errors.rute && "border-red-300")}
              />
            </Field>
            <Field
              label="Tujuan Kegiatan"
              htmlFor="tujuan"
              error={errors.tujuan}
            >
              <Input
                id="tujuan"
                placeholder={tujuanPlaceholder}
                value={formData.tujuan}
                onChange={(e) => setField("tujuan", e.target.value)}
                className={cn(errors.tujuan && "border-red-300")}
              />
            </Field>
          </div>
        </Card>

        {/* Unit & Personel */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <KategoriIcon className="h-5 w-5 text-primary" />
            Unit &amp; Personel
          </h2>

          <div className="mb-5">
            <Label>Kategori Unit</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
            {errors.kategoriUnit && (
              <p className="mt-1 text-xs text-red-600">{errors.kategoriUnit}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Jenis Unit" htmlFor="jenisUnit" error={errors.jenisUnit}>
              <Select
                id="jenisUnit"
                value={formData.jenisUnit}
                onChange={(e) => setField("jenisUnit", e.target.value)}
              >
                {unitOptions.length === 0 && (
                  <option value="">Tidak ada unit tersedia</option>
                )}
                {unitOptions.length > 0 && <option value="">Pilih unit</option>}
                {unitOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={getOperatorLabel(formData.kategoriUnit)}
              htmlFor="operator"
              error={errors.nahkoda}
            >
              <Select
                id="operator"
                value={formData.nahkoda}
                onChange={(e) => setField("nahkoda", e.target.value)}
              >
                <option value="">
                  Pilih {getOperatorLabel(formData.kategoriUnit).toLowerCase()}
                </option>
                {users
                  .filter((u) => u.aktif)
                  .map((u) => (
                    <option key={u.id} value={u.nama}>
                      {u.nama}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field
              label="Jumlah Personel"
              htmlFor="jumlahPersonel"
              error={errors.jumlahPersonel}
            >
              <Input
                id="jumlahPersonel"
                type="number"
                min={1}
                value={formData.jumlahPersonel}
                onChange={(e) => setField("jumlahPersonel", e.target.value)}
                className={cn(errors.jumlahPersonel && "border-red-300")}
              />
            </Field>
          </div>
        </Card>

        {/* Kondisi Armada saat keberangkatan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Fuel className="h-5 w-5 text-primary" />
            Kondisi Saat Berangkat
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="BBM Sebelum (%)"
                htmlFor="bbmSebelum"
                error={errors.bbmSebelum}
              >
                <Input
                  id="bbmSebelum"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Contoh: 90"
                  value={formData.bbmSebelum}
                  onChange={(e) => setField("bbmSebelum", e.target.value)}
                  className={cn(errors.bbmSebelum && "border-red-300")}
                />
              </Field>

              {laut ? (
                <Field
                  label="Endurance Awal (HH:MM)"
                  htmlFor="enduranceAwal"
                  error={errors.enduranceAwal}
                  hint="Wajib diisi untuk armada laut. Format jam:menit, contoh 80:30."
                >
                  <Input
                    id="enduranceAwal"
                    inputMode="numeric"
                    placeholder="Contoh: 80:30"
                    value={formData.enduranceAwal}
                    onChange={(e) =>
                      setField("enduranceAwal", sanitizeEndurance(e.target.value))
                    }
                    className={cn(errors.enduranceAwal && "border-red-300")}
                  />
                </Field>
              ) : (
                <Field
                  label="Kilometer Awal (KM)"
                  htmlFor="kmSebelum"
                  error={errors.kmSebelum}
                >
                  <Input
                    id="kmSebelum"
                    type="number"
                    min={0}
                    placeholder="Contoh: 45230"
                    value={formData.kmSebelum}
                    onChange={(e) => setField("kmSebelum", e.target.value)}
                    className={cn(errors.kmSebelum && "border-red-300")}
                  />
                </Field>
              )}
            </div>

            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {laut
                ? "Endurance akhir, jam kembali, dan BBM sesudah diisi pada tahap 2 setelah armada kembali."
                : "Kilometer akhir, jam kembali, dan BBM sesudah diisi pada tahap 2 setelah kendaraan kembali."}
            </p>

            <Field label="Catatan" htmlFor="catatan">
              <Textarea
                id="catatan"
                rows={4}
                placeholder={catatanPlaceholder}
                value={formData.catatan}
                onChange={(e) => setField("catatan", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Setelah disimpan, catatan dapat dibuka kembali kapan saja untuk
            melengkapi data kepulangan.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Link href="/operator/logbook">
              <Button variant="outline" type="button">
                Batal
              </Button>
            </Link>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Simpan Data Awal
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Pembungkus label + input + pesan error agar seragam di seluruh form. */
function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}