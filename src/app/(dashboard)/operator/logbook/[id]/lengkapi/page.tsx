"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ship,
  Fuel,
  Clock,
  Info,
  CheckCircle2,
  Save,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  isArmadaLaut,
  validasiTahapAkhir,
  fieldBelumLengkap,
  logbookKeForm,
  tahapYangTertunda,
  selisihEndurance,
  selisihKm,
  formatMenit,
  formatEndurance,
  formatTanggal,
  type FormLogbook,
} from "@/components/shared/mock-data";
import {
  useLogbook,
  simpanTahapAkhir,
} from "@/components/shared/logbook-store";
import { cn } from "@/lib/utils";

/**
 * Tahap 2 pencatatan logbook perjalanan — pelengkapan data kepulangan.
 *
 * Operator membuka lagi catatan yang sama lalu mengisi jam kembali, endurance /
 * kilometer akhir, dan BBM sesudah. Penyimpanan memperbarui catatan berdasarkan
 * ID, tidak pernah membuat catatan baru, sehingga tidak ada duplikasi.
 *
 * Tombol "Selesaikan Perjalanan" baru aktif setelah seluruh data wajib tahap
 * akhir valid; hanya setelah itu status berubah menjadi `Selesai`.
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

export default function LengkapiLogbookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const logbooks = useLogbook();
  const logbook = logbooks.find((l) => l.id === params.id);

  const [form, setForm] = useState<FormLogbook | null>(() =>
    logbook ? logbookKeForm(logbook) : null
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormLogbook, string>>>(
    {}
  );
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  if (!logbook || !form) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Ship className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Catatan logbook tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          ID <span className="font-mono">{params.id}</span> tidak tersedia.
        </p>
        <Link href="/operator/logbook">
          <Button variant="outline">Kembali ke daftar logbook</Button>
        </Link>
      </div>
    );
  }

  const tahapTertunda = tahapYangTertunda(logbook.status);
  const sudahSelesai = tahapTertunda === null;
  /** Catatan "Menunggu Penggunaan" belum punya jam berangkat, jadi bisa diisi di sini. */
  const belumBerangkat = logbook.jamBerangkat === "";
  const laut = isArmadaLaut(form.kategoriUnit);

  const setField = <K extends keyof FormLogbook>(
    key: K,
    value: FormLogbook[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setErrorUmum(null);
  };

  const errorsTahapAkhir = validasiTahapAkhir(form);
  const masihAdaYangKurang = Object.keys(errorsTahapAkhir).length > 0;

  /** Field yang belum lengkap — sumber kebenaran untuk menonaktifkan tombol. */
  const fieldKurang = fieldBelumLengkap(form);

  // Hitung pratinjau durasi selama operator mengetik.
  const durasiEndurance = laut
    ? selisihEndurance(form.enduranceAwal, form.enduranceAkhir)
    : null;
  const jarakKm = laut ? null : selisihKm(form.kmSebelum, form.kmSesudah);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasil = simpanTahapAkhir(logbook.id, form);

    if ("error" in hasil) {
      setErrors(hasil.errors as Partial<Record<keyof FormLogbook, string>>);
      setErrorUmum(hasil.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Tahap 2 selesai — status sudah menjadi "Selesai" pada catatan yang sama.
    router.push(`/operator/logbook/${logbook.id}`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/operator/logbook/${logbook.id}`}>
          <Button variant="ghost" size="icon" aria-label="Kembali ke detail">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-800">
            Lengkapi Pencatatan
          </h1>
          <p className="mt-1 truncate text-sm text-slate-500">
            Tahap 2: {logbook.rute} ·{" "}
            <span className="font-mono">{logbook.id}</span>
          </p>
        </div>
      </div>

      {/* Penjelasan */}
      <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
        <div className="space-y-1 text-sm text-blue-900">
          <p>
            Ini adalah catatan yang sama dengan ID{" "}
            <span className="font-mono font-medium">{logbook.id}</span>. data
            keberangkatan di bawah sudah tersimpan dan tidak perlu diisi ulang.
          </p>
          <p>
            Setelah tahap ini selesai, catatan{" "}
            <span className="font-medium">diperbarui</span>, bukan dibuat baru.
          </p>
        </div>
      </div>

      {sudahSelesai && (
        <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p>
            Catatan ini sudah berstatus <strong>Selesai</strong>. Anda masih bisa
            memperbaiki angka, tetapi status tidak akan berubah.
          </p>
        </div>
      )}

      {errorUmum && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {errorUmum} Lengkapi dulu kolom yang ditandai merah.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge>Tahap 2 dari 2</Badge>
          <span className="text-sm text-slate-500">
            Data kepulangan. Status berubah menjadi Selesai setelah ini.
          </span>
        </div>

        {/* Ringkasan tahap awal (read-only) */}
        <Card className="p-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Lock className="h-4 w-4 text-slate-400" />
            Data Keberangkatan (Tersimpan)
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Data ini sudah tersimpan pada tahap 1 dan tidak dapat diubah di sini.
          </p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-3">
            <Ringkas label="Tanggal" value={formatTanggal(logbook.tanggal)} />
            <Ringkas
              label="Jam Berangkat"
              value={logbook.jamBerangkat || "Belum diisi"}
            />
            <Ringkas label="Unit" value={logbook.jenisUnit} />
            <Ringkas
              label={laut ? "Nahkoda" : "Pengemudi"}
              value={logbook.nahkoda}
            />
            <Ringkas
              label="Personel"
              value={`${logbook.jumlahPersonel} orang`}
            />
            <Ringkas label="BBM Sebelum" value={logbook.bbmSebelum} />
            <Ringkas
              label={laut ? "Endurance Awal" : "Km Awal"}
              value={
                laut
                  ? formatEndurance(logbook.enduranceAwal)
                  : logbook.kmSebelum || "-"
              }
            />
          </dl>
        </Card>

        {/* Data kepulangan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Clock className="h-5 w-5 text-primary" />
            Data Saat Kembali
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {belumBerangkat && (
              <Field
                label="Jam Berangkat"
                htmlFor="jamBerangkat"
                error={errors.jamBerangkat}
                hint="Catatan ini masih Menunggu Penggunaan. Isi jam keberangkatan di sini."
              >
                <Input
                  id="jamBerangkat"
                  type="time"
                  value={form.jamBerangkat}
                  onChange={(e) => setField("jamBerangkat", e.target.value)}
                  className={cn(errors.jamBerangkat && "border-red-300")}
                />
              </Field>
            )}

            <Field label="Jam Kembali" htmlFor="jamKembali" error={errors.jamKembali}>
              <Input
                id="jamKembali"
                type="time"
                value={form.jamKembali}
                onChange={(e) => setField("jamKembali", e.target.value)}
                className={cn(errors.jamKembali && "border-red-300")}
              />
            </Field>

            <Field
              label="BBM Sesudah (%)"
              htmlFor="bbmSesudah"
              error={errors.bbmSesudah}
            >
              <Input
                id="bbmSesudah"
                type="number"
                min={0}
                max={100}
                placeholder="Contoh: 75"
                value={form.bbmSesudah}
                onChange={(e) => setField("bbmSesudah", e.target.value)}
                className={cn(errors.bbmSesudah && "border-red-300")}
              />
            </Field>

            {laut ? (
              <Field
                label="Endurance Akhir (HH:MM)"
                htmlFor="enduranceAkhir"
                error={errors.enduranceAkhir}
                hint={`Awal ${formatEndurance(form.enduranceAwal)}. Sisa jam operasi sebelum kehabisan BBM.`}
              >
                <Input
                  id="enduranceAkhir"
                  inputMode="numeric"
                  placeholder="Contoh: 73:00"
                  value={form.enduranceAkhir}
                  onChange={(e) =>
                    setField("enduranceAkhir", sanitizeEndurance(e.target.value))
                  }
                  className={cn(errors.enduranceAkhir && "border-red-300")}
                />
              </Field>
            ) : (
              <Field
                label="Kilometer Sesudah (KM)"
                htmlFor="kmSesudah"
                error={errors.kmSesudah}
              >
                <Input
                  id="kmSesudah"
                  type="number"
                  min={0}
                  placeholder="Contoh: 45312"
                  value={form.kmSesudah}
                  onChange={(e) => setField("kmSesudah", e.target.value)}
                  className={cn(errors.kmSesudah && "border-red-300")}
                />
              </Field>
            )}

            <Field label="Catatan" htmlFor="catatan">
              <Textarea
                id="catatan"
                rows={3}
                placeholder="Kondisi sepulang, insiden, atau keterangan lain..."
                value={form.catatan}
                onChange={(e) => setField("catatan", e.target.value)}
              />
            </Field>
          </div>

          {/* Pratinjau hasil perhitungan */}
          {(laut ? durasiEndurance !== null : jarakKm !== null) && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
              <Fuel className="h-4 w-4 shrink-0 text-emerald-600" />
              {laut ? (
                <p>
                  Durasi tempuh berdasarkan pembacaan endurance:{" "}
                  <span className="font-medium">
                    {formatMenit(durasiEndurance!)}
                  </span>{" "}
                  <span className="text-xs">
                    (selisih {form.enduranceAwal} − {form.enduranceAkhir})
                  </span>
                </p>
              ) : (
                <p>
                  Jarak tempuh:{" "}
                  <span className="font-medium">{jarakKm} km</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Ringkasan kelengkapan + actions */}
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Kelengkapan Tahap Akhir
          </h3>

          <ul className="mb-4 space-y-1.5 text-sm">
            {belumBerangkat && (
              <Kelengkapan
                ok={form.jamBerangkat !== "" && !errors.jamBerangkat}
                label="Jam berangkat"
              />
            )}
            <Kelengkapan
              ok={form.jamKembali !== "" && !errors.jamKembali}
              label="Jam kembali"
            />
            <Kelengkapan ok={form.bbmSesudah !== ""} label="BBM sesudah" />
            {laut ? (
              <Kelengkapan
                ok={form.enduranceAkhir !== "" && !errors.enduranceAkhir}
                label="Endurance akhir"
              />
            ) : (
              <Kelengkapan
                ok={form.kmSesudah !== "" && !errors.kmSesudah}
                label="Kilometer sesudah"
              />
            )}
          </ul>

          {masihAdaYangKurang && fieldKurang.length > 0 && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Tombol selesai belum aktif. Masih perlu diisi:{" "}
              <span className="font-medium">{fieldKurang.join(", ")}</span>.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Status menjadi <span className="font-medium">Selesai</span> hanya
              setelah tombol di bawah ditekan.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Link href={`/operator/logbook/${logbook.id}`}>
                <Button variant="outline" type="button">
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={masihAdaYangKurang}>
                {sudahSelesai ? (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Selesaikan Perjalanan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

/** Baris ringkasan read-only pada kartu data keberangkatan. */
function Ringkas({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  );
}

/** Satu baris daftar periksa kelengkapan tahap akhir. */
function Kelengkapan({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <span className="ml-0.5 inline-block size-4 shrink-0 rounded-full border-2 border-slate-300" />
      )}
      <span className={ok ? "text-slate-700" : "text-slate-500"}>{label}</span>
      <span className={ok ? "text-xs text-emerald-600" : "text-xs text-slate-400"}>
        {ok ? "terisi" : "belum"}
      </span>
    </li>
  );
}

/** Pembungkus label + input + pesan error agar seragam. */
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