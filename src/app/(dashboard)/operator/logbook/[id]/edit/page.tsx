"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  cariAsetDmUnit,
  isArmadaLaut,
  angkaKePersen,
  persenKeAngka,
  type FormLogbook,
  type KategoriLogbook,
  type LogbookPerjalanan,
  type StatusPenggunaan,
} from "@/components/shared/mock-data";
import {
  mergeLogbooksWithSupabase,
  updateLogbookDB,
} from "@/components/shared/logbook-store";
import { useAsets, useLogbooks } from "@/components/shared/use-supabase-data";
import { useSesiUser } from "@/components/shared/use-session";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { cn } from "@/lib/utils";

/**
 * Halaman EDIT logbook perjalanan — khusus role ADMIN_IT.
 *
 * Berbedar dari form "tambah" operator (dua tahap, data keberangkatan saja):
 * admin boleh memperbaiki SEMUA field — termasuk jam kembali, endurance akhir,
 * kilometer, BBM sesudah, dan status — karena tujuan utamanya adalah
 * pemeliharaan data (perbaikan salah ketik, kelengkapan, dst.).
 *
 * Validasi memakai aturan yang sama dengan alur operator:
 * - armada laut → endurance (HH:MM)
 * - armada darat → kilometer
 * - jam kembali harus setelah jam berangkat
 * - BBM sesudah ≤ BBM sebelum (kecuali ada BBM tambahan)
 *
 * Hak akses dijaga di dua lapis:
 * 1. UI: halaman ini menolak render bila user bukan ADMIN_IT.
 * 2. RLS database: hanya ADMIN_IT yang punya izin UPDATE/DELETE logbook.
 */

const kategoriOpsi: { value: KategoriLogbook; label: string }[] = [
  { value: "RIB", label: "RIB / Perahu" },
  { value: "RBB", label: "RBB" },
  { value: "Kapal", label: "Kapal" },
  { value: "Mobil", label: "Mobil" },
  { value: "Motor", label: "Motor" },
];

/** Bersihkan input endurance: hanya digit + satu titik dua. */
function sanitizeEndurance(nilai: string): string {
  const parts = nilai.split(":");
  if (parts.length === 1) return parts[0].replace(/\D/g, "").slice(0, 3);
  const jam = (parts[0] ?? "").replace(/\D/g, "").slice(0, 3);
  const menit = parts.slice(1).join(":").replace(/\D/g, "").slice(0, 2);
  return `${jam}:${menit}`;
}

type FormErrors = Partial<Record<keyof FormLogbook, string>>;

/** Validasi lengkap untuk form edit (gabungan aturan tahap awal + akhir). */
function validasiFormEdit(
  form: FormLogbook,
  status: StatusPenggunaan
): FormErrors {
  const e: FormErrors = {};
  const laut = isArmadaLaut(form.kategoriUnit);

  // Field wajib dasar
  if (!form.tanggal) e.tanggal = "Tanggal wajib diisi.";
  if (!form.rute.trim()) e.rute = "Rute wajib diisi.";
  if (!form.tujuan.trim()) e.tujuan = "Tujuan kegiatan wajib diisi.";
  if (!form.kategoriUnit) e.kategoriUnit = "Kategori unit wajib dipilih.";
  if (!form.jenisUnit) e.jenisUnit = "Jenis unit wajib dipilih.";
  if (!form.nahkoda.trim()) e.nahkoda = "Operator wajib diisi.";
  if (!form.jumlahPersonel.trim() || Number(form.jumlahPersonel) < 1) {
    e.jumlahPersonel = "Jumlah personel minimal 1.";
  }
  if (!form.bbmSebelum.trim()) e.bbmSebelum = "BBM sebelum wajib diisi.";

  // Jam (format saja — tidak wajib diisi bila catatan belum berangkat/kembali)
  const cekJam = (nilai: string, nama: string) => {
    if (!nilai) return;
    if (!/^\d{2}:\d{2}$/.test(nilai)) {
      e[nama === "jamBerangkat" ? "jamBerangkat" : "jamKembali"] = `${
        nama
      } format HH:MM (mis. 08:00).`;
    }
  };
  cekJam(form.jamBerangkat, "Jam berangkat");
  cekJam(form.jamKembali, "Jam kembali");

  // Jam kembali harus setelah jam berangkat (hanya bila keduanya terisi).
  if (
    form.jamBerangkat &&
    form.jamKembali &&
    /^\d{2}:\d{2}$/.test(form.jamBerangkat) &&
    /^\d{2}:\d{2}$/.test(form.jamKembali)
  ) {
    const [jh, jm] = form.jamBerangkat.split(":").map(Number);
    const [kh, km] = form.jamKembali.split(":").map(Number);
    if (kh * 60 + km <= jh * 60 + jm) {
      e.jamKembali = "Jam kembali harus setelah jam berangkat.";
    }
  }

  // BBM sesudah (wajib bila status sudah "Selesai"; boleh kosong bila belum).
  if (status === "Selesai") {
    if (!form.bbmSesudah.trim()) {
      e.bbmSesudah = "Status Selesai membutuhkan BBM sesudah.";
    } else if (
      Number(form.bbmSesudah) > Number(form.bbmSebelum || "0") &&
      !form.bbmTambahan.trim()
    ) {
      e.bbmSesudah =
        "BBM sesudah tidak boleh lebih besar dari BBM sebelum (kecuali ada BBM tambahan).";
    }
  }

  // Endurance / kilometer sesuai kategori — hanya divalidasi bila terisi,
  // kecuali status "Selesai" yang mewajibkan angka akhir.
  const POLA = /^(\d{1,3}):([0-5]\d)$/;
  if (laut) {
    if (form.enduranceAwal && !POLA.test(form.enduranceAwal)) {
      e.enduranceAwal = "Format endurance HH:MM (mis. 80:30).";
    }
    if (status === "Selesai" && !form.enduranceAkhir.trim()) {
      e.enduranceAkhir = "Status Selesai membutuhkan endurance akhir.";
    }
    if (form.enduranceAkhir && !POLA.test(form.enduranceAkhir)) {
      e.enduranceAkhir = "Format endurance HH:MM (mis. 73:00).";
    }
  } else {
    if (status === "Selesai" && !form.kmSesudah.trim()) {
      e.kmSesudah = "Status Selesai membutuhkan kilometer sesudah.";
    }
  }

  return e;
}

export default function EditLogbookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ses = useSesiUser();
  // ADMIN_IT boleh edit semua logbook; OPERATOR_LAPANGAN/AKUNTOR hanya bisa
  // edit logbook yang mereka buat sendiri.
  const bisaKelola = ses.role === "ADMIN_IT";
  const {
    data: supabaseLogbooks,
    loading,
    error,
    refetch,
  } = useLogbooks();
  const { data: asetList } = useAsets();

  const logbooks = mergeLogbooksWithSupabase(
    supabaseLogbooks as unknown as LogbookPerjalanan[]
  );
  const log = logbooks.find((l) => l.id === params.id);

  // Identifikasi apakah user adalah pemilik logbook ini.
  // Fallback: cocokkan NIP, atau nama nahkoda (untuk logbook lama tanpa createdBy).
  const pemilik =
    (log?.createdBy && log.createdBy === ses.nip) ||
    (log?.nahkoda === ses.nama);
  const bisaEdit =
    bisaKelola ||
    ((ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR") && pemilik);

  // Isi form dari logbook yang ditemukan. Kategori kosong bila DB lama.
  const [form, setForm] = useState<FormLogbook | null>(() =>
    log
      ? {
          tanggal: log.tanggal,
          jamBerangkat: log.jamBerangkat,
          jamKembali: log.jamKembali,
          rute: log.rute,
          tujuan: log.tujuan,
          kategoriUnit: (log.kategoriUnit ?? "") as KategoriLogbook | "",
          jenisUnit: log.jenisUnit,
          nahkoda: log.nahkoda,
          jumlahPersonel: String(log.jumlahPersonel),
          bbmSebelum: persenKeAngka(log.bbmSebelum),
          bbmSesudah: persenKeAngka(log.bbmSesudah),
          bbmTambahan: persenKeAngka(log.bbmTambahan ?? ""),
          enduranceAwal: log.enduranceAwal ?? "",
          enduranceAkhir: log.enduranceAkhir ?? "",
          kmSebelum: log.kmSebelum ?? "",
          kmSesudah: log.kmSesudah ?? "",
          catatan: log.catatan,
        }
      : null
  );

  // Form edit memiliki field tambahan di luar FormLogbook: status.
  const [status, setStatus] = useState<StatusPenggunaan>(log?.status ?? "Menunggu Penggunaan");
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorUmum, setErrorUmum] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [sukses, setSukses] = useState(false);

  // Isi ulang form sekali saja saat logbook selesai dimuat & data tersedia.
  const formDiisi = useRef(false);
  useEffect(() => {
    if (log && !formDiisi.current) {
      formDiisi.current = true;
      setForm({
        tanggal: log.tanggal,
        jamBerangkat: log.jamBerangkat,
        jamKembali: log.jamKembali,
        rute: log.rute,
        tujuan: log.tujuan,
        kategoriUnit: (log.kategoriUnit ?? "") as KategoriLogbook | "",
        jenisUnit: log.jenisUnit,
        nahkoda: log.nahkoda,
        jumlahPersonel: String(log.jumlahPersonel),
        bbmSebelum: persenKeAngka(log.bbmSebelum),
        bbmSesudah: persenKeAngka(log.bbmSesudah),
        bbmTambahan: persenKeAngka(log.bbmTambahan ?? ""),
        enduranceAwal: log.enduranceAwal ?? "",
        enduranceAkhir: log.enduranceAkhir ?? "",
        kmSebelum: log.kmSebelum ?? "",
        kmSesudah: log.kmSesudah ?? "",
        catatan: log.catatan,
      });
      setStatus(log.status);
    }
  }, [log]);

  // Guard UI: non-admin tidak boleh membuka halaman ini, kecuali operator/akuntor
  // yang memiliki logbook ini.
  if (!bisaEdit) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-300" />
        <h1 className="text-xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="text-sm text-slate-500">
          Halaman edit logbook hanya untuk role Admin IT atau pemilik logbook
          (operator/akuntor yang membuat catatan ini).
        </p>
        <Link href="/operator/logbook">
          <Button variant="outline">Kembali ke daftar logbook</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <DataLoading label="Memuat logbook untuk edit…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat logbook dari database"
      />
    );
  }
  if (!log || !form) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Logbook tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Catatan dengan ID <span className="font-mono">{params.id}</span>{" "}
          tidak tersedia (mungkin sudah dihapus).
        </p>
        <Link href="/operator/logbook">
          <Button variant="outline">Kembali ke daftar logbook</Button>
        </Link>
      </div>
    );
  }

  const laut = isArmadaLaut(form.kategoriUnit);

  /** Perbarui satu field & bersihkan error field-nya. */
  const setField = <K extends keyof FormLogbook>(
    key: K,
    value: FormLogbook[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setErrorUmum(null);
  };

  /** Pilih status manual (admin bisa memaksa status apa pun). */
  const setStatusField = (nilai: StatusPenggunaan) => {
    setStatus(nilai);
    setErrorUmum(null);
  };

  /**
   * Simpan perubahan: validasi → UPDATE baris Supabase (melewati RLS
   * khusus admin). Setelah berhasil, segarkan daftar logbook.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cek = validasiFormEdit(form, status);
    setErrors(cek);
    if (Object.keys(cek).length > 0) {
      setErrorUmum("Perbaiki dulu kolom yang ditandai merah.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setMenyimpan(true);
    setErrorUmum(null);
    try {
      // Resolusi unit yang tersimpan agar konsisten dengan form "tambah":
      // simpan "Nama Resmi (No. Polisi)" bila aset master ditemukan.
      const asetUnit = cariAsetDmUnit(form.jenisUnit, asetList);
      const jenisUnitTersimpan = asetUnit
        ? asetUnit.noPolisi
          ? `${asetUnit.nama} (${asetUnit.noPolisi})`
          : asetUnit.nama
        : form.jenisUnit;

      const baris: LogbookPerjalanan = {
        id: log.id,
        tanggal: form.tanggal,
        jamBerangkat: form.jamBerangkat,
        jamKembali: form.jamKembali,
        rute: form.rute.trim(),
        tujuan: form.tujuan.trim(),
        kategoriUnit: (form.kategoriUnit || undefined) as LogbookPerjalanan["kategoriUnit"],
        jenisUnit: jenisUnitTersimpan,
        nahkoda: form.nahkoda.trim(),
        jumlahPersonel: Number(form.jumlahPersonel),
        bbmSebelum: angkaKePersen(form.bbmSebelum),
        bbmSesudah: angkaKePersen(form.bbmSesudah),
        bbmTambahan: form.bbmTambahan.trim()
          ? angkaKePersen(form.bbmTambahan)
          : "",
        enduranceAwal: form.enduranceAwal,
        enduranceAkhir: form.enduranceAkhir,
        kmSebelum: form.kmSebelum,
        kmSesudah: form.kmSesudah,
        // Pertahankan NIP creator — jangan di-reset saat edit.
        createdBy: log.createdBy ?? ses.nip,
        // Jika operator/akuntor melakukan edit, status otomatis menjadi "SudahDiedit"
        // agar kentara ada perubahan setelah data terkirim. Admin tetap bebas memilih.
        status: bisaKelola ? status : "SudahDiedit" as StatusPenggunaan,
        catatan: form.catatan.trim(),
        tanggalSimpan: log.tanggalSimpan,
        tanggalLengkap: status === "Selesai" ? log.tanggalLengkap ?? log.tanggalSimpan : log.tanggalLengkap,
      };

      await updateLogbookDB(log.id, baris);
      setSukses(true);
      // Segarkan daftar agar halaman asal melihat data terbaru.
      refetch();
      setTimeout(() => {
        router.push(`/operator/logbook/${log.id}`);
      }, 600);
    } catch (err) {
      const pesan =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setErrorUmum(
        pesan.toLowerCase().includes("row-level") ||
          pesan.toLowerCase().includes("permission")
          ? "Anda tidak punya izin mengubah logbook ini (RLS per-role aktif)."
          : pesan
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setMenyimpan(false);
    }
  };

  if (sukses) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
          Perubahan logbook berhasil disimpan. Mengalihkan ke detail…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/operator/logbook/${log.id}`}>
          <Button variant="ghost" size="icon" aria-label="Kembali ke detail">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Edit Logbook Perjalanan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Management Admin IT · ID{" "}
            <span className="font-mono text-xs">{log.id}</span>
          </p>
        </div>
      </div>

      {/* Info hak akses */}
      <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p>
          Halaman ini untuk <strong>memperbaiki data</strong> logbook yang sudah
          ada — termasuk jam kembali, endurance/kilometer akhir, dan status.
          Gunakan bila ada salah ketik atau data belum lengkap. Hapus pakai
          tombol di halaman daftar logbook.
        </p>
      </div>

      {errorUmum && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {errorUmum}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Jadwal */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Jadwal & Rute
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tanggal" htmlFor="tanggal" error={errors.tanggal}>
              <Input
                id="tanggal"
                type="date"
                value={form.tanggal}
                onChange={(e) => setField("tanggal", e.target.value)}
                className={cn(errors.tanggal && "border-red-300")}
              />
            </Field>
            <Field
              label="Jam Berangkat"
              htmlFor="jamBerangkat"
              error={errors.jamBerangkat}
              hint="Kosongkan bila armada belum berangkat."
            >
              <Input
                id="jamBerangkat"
                type="time"
                value={form.jamBerangkat}
                onChange={(e) => setField("jamBerangkat", e.target.value)}
                className={cn(errors.jamBerangkat && "border-red-300")}
              />
            </Field>
            <Field label="Rute" htmlFor="rute" error={errors.rute}>
              <Input
                id="rute"
                value={form.rute}
                onChange={(e) => setField("rute", e.target.value)}
                className={cn(errors.rute && "border-red-300")}
              />
            </Field>
            <Field label="Tujuan" htmlFor="tujuan" error={errors.tujuan}>
              <Input
                id="tujuan"
                value={form.tujuan}
                onChange={(e) => setField("tujuan", e.target.value)}
                className={cn(errors.tujuan && "border-red-300")}
              />
            </Field>
          </div>
        </Card>

        {/* Unit & Operator */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Unit &amp; Operator
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Kategori Unit" htmlFor="kategoriUnit" error={errors.kategoriUnit}>
              <Select
                id="kategoriUnit"
                value={form.kategoriUnit}
                onChange={(e) =>
                  setField(
                    "kategoriUnit",
                    (e.target.value || "") as KategoriLogbook | ""
                  )
                }
              >
                <option value="">Pilih kategori</option>
                {kategoriOpsi.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Jenis Unit" htmlFor="jenisUnit" error={errors.jenisUnit}>
              <Input
                id="jenisUnit"
                value={form.jenisUnit}
                onChange={(e) => setField("jenisUnit", e.target.value)}
                className={cn(errors.jenisUnit && "border-red-300")}
              />
            </Field>
            <Field
              label={laut ? "Nahkoda" : "Operator / Pengemudi"}
              htmlFor="nahkoda"
              error={errors.nahkoda}
            >
              <Input
                id="nahkoda"
                value={form.nahkoda}
                onChange={(e) => setField("nahkoda", e.target.value)}
                className={cn(errors.nahkoda && "border-red-300")}
              />
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
                value={form.jumlahPersonel}
                onChange={(e) => setField("jumlahPersonel", e.target.value)}
                className={cn(errors.jumlahPersonel && "border-red-300")}
              />
            </Field>
          </div>
        </Card>

        {/* BBM & Endurance / Kilometer */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            BBM &amp; Bacaan Armada
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="BBM Sebelum (%)" htmlFor="bbmSebelum" error={errors.bbmSebelum}>
              <Input
                id="bbmSebelum"
                type="number"
                min={0}
                max={100}
                value={form.bbmSebelum}
                onChange={(e) => setField("bbmSebelum", e.target.value)}
                className={cn(errors.bbmSebelum && "border-red-300")}
              />
            </Field>
            <Field
              label="BBM Sesudah (%)"
              htmlFor="bbmSesudah"
              error={errors.bbmSesudah}
              hint="Wajib bila status Selesai."
            >
              <Input
                id="bbmSesudah"
                type="number"
                min={0}
                max={100}
                value={form.bbmSesudah}
                onChange={(e) => setField("bbmSesudah", e.target.value)}
                className={cn(errors.bbmSesudah && "border-red-300")}
              />
            </Field>
            <Field
              label="BBM Tambahan (%)"
              htmlFor="bbmTambahan"
              error={errors.bbmTambahan}
              hint="Opsional — isi ulang BBM di tengah perjalanan."
            >
              <Input
                id="bbmTambahan"
                type="number"
                min={0}
                max={100}
                value={form.bbmTambahan}
                onChange={(e) => setField("bbmTambahan", e.target.value)}
                className={cn(errors.bbmTambahan && "border-red-300")}
              />
            </Field>
            {laut ? (
              <>
                <Field
                  label="Endurance Awal (HH:MM)"
                  htmlFor="enduranceAwal"
                  error={errors.enduranceAwal}
                >
                  <Input
                    id="enduranceAwal"
                    inputMode="numeric"
                    value={form.enduranceAwal}
                    onChange={(e) =>
                      setField("enduranceAwal", sanitizeEndurance(e.target.value))
                    }
                    className={cn(errors.enduranceAwal && "border-red-300")}
                  />
                </Field>
                <Field
                  label="Endurance Akhir (HH:MM)"
                  htmlFor="enduranceAkhir"
                  error={errors.enduranceAkhir}
                  hint="Wajib bila status Selesai."
                >
                  <Input
                    id="enduranceAkhir"
                    inputMode="numeric"
                    value={form.enduranceAkhir}
                    onChange={(e) =>
                      setField("enduranceAkhir", sanitizeEndurance(e.target.value))
                    }
                    className={cn(errors.enduranceAkhir && "border-red-300")}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Kilometer Awal" htmlFor="kmSebelum" error={errors.kmSebelum}>
                  <Input
                    id="kmSebelum"
                    type="number"
                    min={0}
                    value={form.kmSebelum}
                    onChange={(e) => setField("kmSebelum", e.target.value)}
                    className={cn(errors.kmSebelum && "border-red-300")}
                  />
                </Field>
                <Field
                  label="Kilometer Sesudah"
                  htmlFor="kmSesudah"
                  error={errors.kmSesudah}
                  hint="Wajib bila status Selesai."
                >
                  <Input
                    id="kmSesudah"
                    type="number"
                    min={0}
                    value={form.kmSesudah}
                    onChange={(e) => setField("kmSesudah", e.target.value)}
                    className={cn(errors.kmSesudah && "border-red-300")}
                  />
                </Field>
              </>
            )}
          </div>
        </Card>

        {/* Status & Catatan */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Status &amp; Catatan
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Status Penggunaan"
              htmlFor="status"
              hint="Biasanya diturunkan otomatis dari jam berangkat/kembali; admin dapat memaksa."
            >
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatusField(e.target.value as StatusPenggunaan)}
              >
                <option value="Menunggu Penggunaan">Menunggu Penggunaan</option>
                <option value="Sedang Digunakan">Sedang Digunakan</option>
                <option value="Selesai">Selesai</option>
              </Select>
            </Field>
            <Field label="Jam Kembali" htmlFor="jamKembali" error={errors.jamKembali}>
              <Input
                id="jamKembali"
                type="time"
                value={form.jamKembali}
                onChange={(e) => setField("jamKembali", e.target.value)}
                className={cn(errors.jamKembali && "border-red-300")}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Catatan" htmlFor="catatan">
              <Textarea
                id="catatan"
                rows={4}
                value={form.catatan}
                onChange={(e) => setField("catatan", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        {/* Aksi simpan */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/operator/logbook/${log.id}`}>
            <Button variant="outline" type="button" disabled={menyimpan}>
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={menyimpan}>
            <Save className="h-4 w-4" />
            {menyimpan ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
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
