"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ImagePlus,
  X,
  Send,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAsetById,
  getChecklistHarianById,
  cariAsetDmUnit,
  tambahBeritaAcara,
  ubahIsiBeritaAcara,
  ubahStatusBeritaAcara,
  ekstrakItemRusak,
  hitungTingkatKeparahan,
  tanggalTeks,
  angkaTeks,
  KETERANGAN_SERVICE_DEFAULT,
  type BeritaAcara,
  type BarisKendala,
} from "@/components/shared/mock-data";
import {
  DokumenBeritaAcara,
  susunButirAnalisa,
} from "./dokumen-berita-acara";
import "./berita-acara-print.css";
import {
  beritaAcaraByChecklist,
  beritaAcaraById,
} from "@/components/shared/berita-acara-store";
import {
  useSesiUser,
  jabatanUser,
  jabatanUserByNama,
} from "@/components/shared/use-session";
import { addTicket } from "@/components/shared/ticket-store";
import { cn } from "@/lib/utils";

const statusVariant: Record<
  BeritaAcara["status"],
  "warning" | "default" | "success" | "danger"
> = {
  Draf: "default",
  Diserahkan: "warning",
  Diproses: "default",
  Disetujui: "success",
  Ditolak: "danger",
};


export default function BeritaAcaraPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ses = useSesiUser();
  const checklistId = params.id;

  const checklist = getChecklistHarianById(checklistId);
  // Aset terkait: dari `asetId` checklist, atau dicari dari nama unit.
  const aset = checklist?.asetId
    ? getAsetById(checklist.asetId)
    : cariAsetDmUnit(checklist?.unit ?? "");

  // ── Siapkan berita acara (sekali saat komponen pertama kali dirender) ───
  // Kalau belum ada BA untuk checklist ini, buat otomatis dengan status
  // "Draf" supaya isinya bisa langsung diedit. Setelah diserahkan, statusnya
  // menjadi "Diserahkan".
  const [awal] = useState(() => {
    if (!checklist) {
      return {
        baId: "",
        nomor: "",
        uraian: "",
        fotoBukti: [] as string[],
        kendala: [] as BarisKendala[],
      };
    }

    const ada = beritaAcaraByChecklist(checklist.id);
    if (ada) {
      return {
        baId: ada.id,
        nomor: ada.nomor,
        uraian: ada.uraian,
        fotoBukti: ada.fotoBukti,
        kendala:
          ada.kendala.length > 0
            ? ada.kendala
            : ekstrakItemRusak(checklist.items),
      };
    }

    const baru = tambahBeritaAcara({
      tanggal: checklist.tanggal,
      namaAset: aset?.nama ?? checklist.unit,
      kodeAset: aset?.kode ?? "",
      nomor: "",
      asetId: aset?.id ?? "",
      checklistId: checklist.id,
      pelapor: checklist.pemeriksa,
      pelaporJabatan:
        jabatanUser(checklist.pemeriksaId ?? "") === "Petugas"
          ? jabatanUserByNama(checklist.pemeriksa)
          : jabatanUser(checklist.pemeriksaId ?? ""),
      kendala: ekstrakItemRusak(checklist.items),
      fotoBukti: [],
      uraian: "",
      keterangan: KETERANGAN_SERVICE_DEFAULT,
    });
    return {
      baId: baru.id,
      nomor: "",
      uraian: "",
      fotoBukti: [] as string[],
      kendala: baru.kendala,
    };
  });

  // ── State form ───────────────────────────────────────────────────────────
  const [nomor, setNomor] = useState(awal.nomor);
  const [uraian, setUraian] = useState(awal.uraian);
  const [fotoBukti, setFotoBukti] = useState<string[]>(awal.fotoBukti);
  const [kendala, setKendala] = useState<BarisKendala[]>(awal.kendala);
  const [pesan, setPesan] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baId = awal.baId;

  const rusakItems = useMemo(
    () =>
      (checklist?.items ?? []).filter(
        (i) => i.kondisi === "Rusak Ringan" || i.kondisi === "Rusak Berat"
      ),
    [checklist]
  );
  const adaRusak = rusakItems.length > 0;

  // ── Handler ──────────────────────────────────────────────────────────────
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setFotoBukti((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    // Reset input agar file yang sama bisa dipilih ulang.
    e.target.value = "";
  };

  const handleHapusFoto = (index: number) =>
    setFotoBukti((prev) => prev.filter((_, i) => i !== index));

  const ubahBarisKendala = (
    index: number,
    perubahan: Partial<Pick<BarisKendala, "merk" | "jumlah" | "keterangan">>
  ) =>
    setKendala((prev) =>
      prev.map((k, i) => (i === index ? { ...k, ...perubahan } : k))
    );

  /** Simpan isi form ke berita acara (status tetap "Draf"). */
  const handleSimpanDraf = () => {
    if (!baId) return;
    ubahIsiBeritaAcara(baId, { nomor, uraian, kendala, fotoBukti });
    ubahStatusBeritaAcara(baId, "Draf");
    setPesan("Berita acara disimpan sebagai draf.");
  };

  /** Serahkan ke Pengelola BMN + buat tiket EWS. */
  const handleSerahkan = () => {
    if (!baId || !aset) return;

    ubahIsiBeritaAcara(baId, { nomor, uraian, kendala, fotoBukti });

    // Tiket EWS dibuat lebih dulu agar ID-nya bisa disematkan ke BA.
    const tingkatKeparahan = hitungTingkatKeparahan(checklist?.items ?? []);
    const tiket = addTicket({
      asetId: aset.id,
      judul: `Kerusakan ${aset.nama}`,
      deskripsi:
        uraian ||
        `Item rusak: ${kendala.map((k) => k.label).join(", ")}`,
      tingkatKeparahan,
      assignedTo: ses.id,
    });

    ubahStatusBeritaAcara(baId, "Diserahkan", {
      pengajuId: ses.id,
      pengajuNama: ses.nama,
      pengajuJabatan: ses.jabatan,
      keterangan: KETERANGAN_SERVICE_DEFAULT,
      tiketId: tiket.id,
    });

    // Kembali ke detail checklist — berita acara sudah masuk antrean
    // Pengelola BMN. Operator lapangan tidak punya akses ke /bmn/*.
    router.push(`/operator/checklist/${checklistId}`);
  };

  // ── Data tampilan ────────────────────────────────────────────────────────
  const tglTeks = tanggalTeks(checklist?.tanggal ?? "");
  // Tanggal hari ditulis dalam kata (mis. "Lima") — mengikuti template acuan.
  const tanggalDokumen = tglTeks
    ? { ...tglTeks, tanggal: angkaTeks(Number(tglTeks.tanggal)) }
    : null;
  const pelaporNama = checklist?.pemeriksa ?? "-";
  const jabatanPJ = jabatanUser(checklist?.pemeriksaId ?? "");
  const pelaporJabatan =
    jabatanPJ === "Petugas"
      ? jabatanUserByNama(checklist?.pemeriksa ?? "")
      : jabatanPJ;
  const namaAset = aset?.nama ?? checklist?.unit ?? "-";
  // Butir "Hasil Pemeriksaan / Analisa" pada dokumen: uraian manual bila
  // diisi (satu baris = satu butir), jika tidak dibuat dari baris kendala.
  const butirAnalisa = useMemo(
    () => susunButirAnalisa(uraian, kendala),
    [uraian, kendala]
  );

  if (!checklist) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <FileText className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Checklist tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Checklist dengan ID &quot;{checklistId}&quot; tidak tersedia.
        </p>
        <Link href="/operator/checklist">
          <Button variant="outline">Kembali ke Daftar Checklist</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 ba-page">
      {/* Page Header */}
      <div className="no-print flex items-center gap-4">
        <Link href={`/operator/checklist/${checklistId}`}>
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Pengisian Berita Acara
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Berita acara kerusakan — {checklist.unit}
          </p>
        </div>
      </div>

      {/* Info Pemeriksaan */}
      <Card className="no-print p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Data Pemeriksaan
          </h2>
          {baId && (
            <Badge variant={statusVariant[beritaAcaraById(baId)?.status ?? "Draf"]}>
              {beritaAcaraById(baId)?.status ?? "Draf"}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Tanggal
            </p>
            <p className="text-sm font-medium text-slate-800">
              {checklist.tanggal}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Unit
            </p>
            <p className="text-sm font-medium text-slate-800">
              {checklist.unit}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Kode Aset
            </p>
            <p className="font-mono text-sm font-medium text-slate-800">
              {aset?.kode ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Pelapor (PJ)
            </p>
            <p className="text-sm font-medium text-slate-800">{pelaporNama}</p>
            <p className="text-xs text-slate-500">{pelaporJabatan}</p>
          </div>
        </div>

        {adaRusak ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-xs text-rose-800">
              <strong>{rusakItems.length} item</strong> berstatus rusak (Rusak
              Ringan/Berat) — wajib dilaporkan melalui berita acara.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-xs text-emerald-800">
              Tidak ada item rusak pada checklist ini. Berita acara tidak
              diperlukan.
            </p>
          </div>
        )}
      </Card>

      {/* Form Berita Acara */}
      {adaRusak && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Berita Acara Kerusakan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nomor (kosong — diisi unit administrasi) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomor">Nomor Berita Acara</Label>
                <Input
                  id="nomor"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value)}
                  placeholder="Dikosongkan — diisi oleh unit administrasi"
                />
                <p className="text-xs text-slate-400">
                  Nomor resmi diberikan oleh unit administrasi.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tanggal (terisi otomatis)</Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">
                    Pada hari ini, <strong>{tglTeks?.hari}</strong> Tanggal{" "}
                    <strong>{tglTeks?.tanggal}</strong> Bulan{" "}
                    <strong>{tglTeks?.bulan}</strong> Tahun{" "}
                    <strong>{tglTeks?.tahunKata}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Nama aset (otomatis dari master aset) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="namaAset">Nama Kendaraan / Alat</Label>
                <Input id="namaAset" value={namaAset} disabled />
                <p className="text-xs text-slate-400">
                  Terisi otomatis dari master aset yang diperiksa.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kodeAset">Kode Aset</Label>
                <Input id="kodeAset" value={aset?.kode ?? "-"} disabled />
              </div>
            </div>

            {/* Tabel Informasi Kendala */}
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-700">
                1. Informasi Kendala
              </h3>
              <p className="mb-3 text-xs text-slate-400">
                Diisi otomatis dari item checklist yang berstatus rusak.
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="w-10 px-3 py-2 text-left font-medium text-slate-600">
                        No
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">
                        Nama Barang
                      </th>
                      <th className="w-32 px-3 py-2 text-left font-medium text-slate-600">
                        Merk/Type
                      </th>
                      <th className="w-28 px-3 py-2 text-left font-medium text-slate-600">
                        Jumlah
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {kendala.map((k, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {k.label}
                          <span
                            className={cn(
                              "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              k.sifat === "Berat"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-amber-100 text-amber-600"
                            )}
                          >
                            Rusak {k.sifat}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            aria-label={`Merk ${k.label}`}
                            className="h-8 text-xs"
                            value={k.merk}
                            onChange={(e) =>
                              ubahBarisKendala(idx, { merk: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            aria-label={`Jumlah ${k.label}`}
                            className="h-8 text-xs"
                            value={k.jumlah}
                            onChange={(e) =>
                              ubahBarisKendala(idx, { jumlah: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            aria-label={`Keterangan ${k.label}`}
                            className="h-8 text-xs"
                            value={k.keterangan}
                            onChange={(e) =>
                              ubahBarisKendala(idx, {
                                keterangan: e.target.value,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {kendala.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-sm text-slate-400">
                          Tidak ada item rusak.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Uraian / Analisa */}
            <div className="space-y-2">
              <Label htmlFor="uraian">2. Hasil Pemeriksaan / Analisa</Label>
              <Textarea
                id="uraian"
                rows={4}
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                placeholder="Tulis hasil pemeriksaan / analisa kerusakan..."
              />
              <p className="text-xs text-slate-400">
                Setiap baris menjadi satu butir analisa (a, b, c, …) pada
                dokumen berita acara. Bila dikosongkan, butir analisa dibuat
                otomatis dari baris &quot;Informasi Kendala&quot;.
              </p>
            </div>

            {/* Upload Foto Bukti */}
            <div className="space-y-2">
              <Label>3. Foto Bukti ({fotoBukti.length} foto)</Label>
              <div
                className={cn(
                  "flex flex-wrap gap-3 rounded-lg border-2 border-dashed p-3",
                  fotoBukti.length > 0
                    ? "border-slate-300 bg-white"
                    : "border-slate-200 bg-slate-50"
                )}
              >
                {fotoBukti.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Belum ada foto. Upload bukti kerusakan di sini.
                  </p>
                )}
                {fotoBukti.map((foto, idx) => (
                  <div
                    key={idx}
                    className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200"
                  >
                    <img
                      src={foto}
                      alt={`Bukti ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleHapusFoto(idx)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                      aria-label="Hapus foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Tambah Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFotoUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-400">
                Bisa upload berapa pun foto sebagai bukti.
              </p>
            </div>

            {/* Penyerahan */}
            <div className="space-y-2">
              <Label>Penyerahan ke Tempat Service</Label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">
                  {KETERANGAN_SERVICE_DEFAULT}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Aset akan berstatus &quot;Dipindahkan&quot; setelah Pengelola BMN
                  menyetujui berita acara ini.
                </p>
              </div>
            </div>

            {pesan && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-800">{pesan}</p>
              </div>
            )}

            {/* Aksi */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Cetak
              </Button>
              <Button variant="secondary" onClick={handleSimpanDraf}>
                <Save className="h-4 w-4" />
                Simpan Draf
              </Button>
              <Button onClick={handleSerahkan} disabled={!aset}>
                <Send className="h-4 w-4" />
                Serahkan ke BMN
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Aksi cetak pratinjau (tidak ikut dicetak) ─────────────────────── */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Pratinjau dokumen berita acara — 3 halaman A4, dicetak sesuai
          template BASARNAS.
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* ── Pratinjau dokumen (identik dengan template berita acara) ───────── */}
      <DokumenBeritaAcara
        namaAset={namaAset}
        nomor={nomor}
        tanggal={tanggalDokumen}
        kendala={kendala}
        butirAnalisa={butirAnalisa}
        fotoBukti={fotoBukti}
        pengajuNama={ses.nama}
        pengajuJabatan={ses.jabatan}
        pelaporNama={pelaporNama}
        pelaporJabatan={pelaporJabatan}
      />
    </div>
  );
}
