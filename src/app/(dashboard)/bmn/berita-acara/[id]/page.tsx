"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Printer,
  Save,
  Send,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatTanggal,
  tanggalTeks,
  angkaTeks,
} from "@/components/shared/mock-data";
import { DokumenBeritaAcara, susunButirAnalisa } from "@/components/shared/dokumen-berita-acara";
import "@/components/shared/berita-acara-print.css";
import { useBeritaAcara } from "@/components/shared/use-supabase-data";
import {
  updateBeritaAcaraIsi,
  updateBeritaAcaraStatus,
} from "@/components/shared/db-writes";
import { terapkanPatchBeritaAcara } from "@/components/shared/berita-acara-store";
import { DataLoading, DataError } from "@/components/shared/data-state";

const statusVariant: Record<
  string,
  "warning" | "default" | "success" | "danger"
> = {
  Draf: "default",
  Diserahkan: "warning",
  Diproses: "default",
  Disetujui: "success",
  Ditolak: "danger",
};

export default function DetailBeritaAcaraBmnPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // BA dari Supabase — tanpa fallback mock.
  const { data, loading, error, refetch } = useBeritaAcara();
  const ba = data.find((b) => b.id === params.id);

  // nomor = null → belum disentuh pengguna, ikuti nilai BA dari database.
  const [nomor, setNomor] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);

  if (loading) {
    return <DataLoading label="Memuat berita acara…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat berita acara dari database"
      />
    );
  }
  if (!ba) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <FileText className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Berita acara tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Berita acara dengan ID &quot;{params.id}&quot; tidak tersedia.
        </p>
        <Link href="/bmn/berita-acara">
          <Button variant="outline">Kembali ke Daftar Berita Acara</Button>
        </Link>
      </div>
    );
  }

  const nomorValue = nomor ?? ba.nomor ?? "";

  // Data dokumen (sama seperti halaman operator).
  const tglTeks = tanggalTeks(ba.tanggal);
  const tanggalDokumen = tglTeks
    ? { ...tglTeks, tanggal: angkaTeks(Number(tglTeks.tanggal)) }
    : null;
  const butirAnalisa = susunButirAnalisa(ba.uraian, ba.kendala);

  /**
   * BMN mengisi nomor surat lalu meneruskan BA ke KAKANSAR:
   * berita_acara.isi(nomor) → status("Diproses"). Kegagalan ditampilkan.
   */
  const handleTeruskan = async () => {
    if (!ba || menyimpan) return;
    if (!nomorValue.trim()) {
      setGagal("Nomor berita acara wajib diisi sebelum diteruskan ke KAKANSAR.");
      return;
    }
    setMenyimpan(true);
    setGagal(null);
    setPesan(null);
    try {
      await updateBeritaAcaraIsi(ba.id, { nomor: nomorValue.trim() });
    } catch (e) {
      setGagal(e instanceof Error ? e.message : "Gagal menyimpan nomor surat");
      setMenyimpan(false);
      return;
    }
    try {
      await updateBeritaAcaraStatus(ba.id, "Diproses");
    } catch (e) {
      setGagal(
        e instanceof Error ? e.message : "Gagal meneruskan ke KAKANSAR"
      );
      setMenyimpan(false);
      return;
    }
    // Selaraskan salinan in-memory (hard-copy card tiket dst.).
    terapkanPatchBeritaAcara(ba.id, {
      nomor: nomorValue.trim(),
      status: "Diproses",
    });
    void refetch();
    setPesan("Nomor surat tersimpan — berita acara diteruskan ke KAKANSAR.");
    setMenyimpan(false);
  };

  /** Setelah acc KAKANSAR, BMN membuat tiket maintenance & menyambungkan BA. */
  const buatTiketHref = `/bmn/maintenance/buat?aset=${encodeURIComponent(
    ba.asetId || ""
  )}&ba=${encodeURIComponent(ba.id)}`;

  const alurKeterangan: Record<string, { ikon: React.ElementType; judul: string; teks: string; warna: string }> = {
    Draf: {
      ikon: Clock,
      judul: "Operator belum menyerahkan",
      teks:
        "Berita acara masih berstatus draf di pihak PJ — akan masuk ke sini setelah operator menekan \u201CSerahkan ke BMN\u201D.",
      warna: "border-slate-200 bg-slate-50 text-slate-700",
    },
    Diserahkan: {
      ikon: Clock,
      judul: "Perlu pengisian nomor surat",
      teks:
        "Operator sudah menyerahkan berita acara. Isi nomor surat di bawah, lalu teruskan ke Kepala Kantor SAR (KAKANSAR) untuk persetujuan.",
      warna: "border-amber-200 bg-amber-50 text-amber-800",
    },
    Diproses: {
      ikon: Send,
      judul: "Menunggu acc KAKANSAR",
      teks:
        "Nomor surat sudah diisi dan berita acara dikirim ke Kepala Kantor SAR. Aset akan berstatus \u201CMaintenance\u201D setelah KAKANSAR setuju; kemudian buat tiket maintenance.",
      warna: "border-blue-200 bg-blue-50 text-blue-800",
    },
    Disetujui: {
      ikon: CheckCircle2,
      judul: "Disetujui KAKANSAR",
      teks: ba.tiketId
        ? "Persetujuan KAKANSAR sudah diterima dan tiket maintenance sudah dibuat untuk aset ini."
        : "Persetujuan KAKANSAR sudah diterima — aset siap dikirim ke unit service. Lanjutkan dengan membuat tiket maintenance.",
      warna: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    Ditolak: {
      ikon: XCircle,
      judul: "Ditolak KAKANSAR",
      teks:
        "KAKANSAR tidak meng-acc berita acara ini. Kembalikan ke PJ untuk perbaikan dokumen sebelum diurus ulang.",
      warna: "border-rose-200 bg-rose-50 text-rose-800",
    },
  };
  const Alur = alurKeterangan[ba.status] ?? alurKeterangan.Draf;

  return (
    <div className="ba-page space-y-6">
      {/* Page Header */}
      <div className="no-print flex items-center gap-4">
        <Link href="/bmn/berita-acara">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Berita Acara — {ba.namaAset}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {ba.nomor ? `Nomor ${ba.nomor}` : "Nomor belum diisi"} ·{" "}
            {formatTanggal(ba.tanggal)}
          </p>
        </div>
        <Badge
          variant={statusVariant[ba.status] ?? "default"}
          className="ml-auto px-3 py-1"
        >
          {ba.status}
        </Badge>
      </div>

      {/* Status alur */}
      <Card className="no-print">
        <CardContent className="space-y-4 pt-6">
          <div className={`flex items-start gap-3 rounded-lg border p-4 ${Alur.warna}`}>
            <Alur.ikon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{Alur.judul}</p>
              <p className="mt-0.5 text-xs leading-relaxed">{Alur.teks}</p>
            </div>
          </div>

          {/* Panel aksi utama — tergantung status */}
          {ba.status === "Diserahkan" && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="space-y-2">
                <Label htmlFor="nomorSurat">Nomor Berita Acara</Label>
                <Input
                  id="nomorSurat"
                  value={nomorValue}
                  onChange={(e) => setNomor(e.target.value)}
                  placeholder="Contoh: 145 / LNGM.BAR / 2026"
                />
                <p className="text-xs text-slate-500">
                  Isi nomor surat resmi, lalu teruskan berita acara ke KAKANSAR
                  untuk persetujuan.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleTeruskan} disabled={menyimpan}>
                  {menyimpan ? (
                    <>
                      <Save className="h-4 w-4" /> Menyimpan…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Simpan Nomor &amp; Teruskan ke KAKANSAR
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {ba.status === "Disetujui" && (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {!ba.tiketId && (
                <Button
                  onClick={() => router.push(buatTiketHref)}
                  disabled={!ba.asetId}
                  className={ba.asetId ? "" : "cursor-not-allowed opacity-50"}
                >
                  <Wrench className="h-4 w-4" />
                  Buat Tiket Maintenance
                </Button>
              )}
              {ba.tiketId && (
                <Link href={`/bmn/maintenance/${ba.tiketId}`}>
                  <Button variant="outline">
                    Lihat Tiket Maintenance
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {ba.status === "Ditolak" && ba.alasanPenolakan && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Alasan Penolakan
              </p>
              <p className="mt-0.5 text-sm text-rose-800">
                {ba.alasanPenolakan}
              </p>
            </div>
          )}

          {ba.asetId && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              Aset terkait:{" "}
              <Link
                href={`/bmn/${ba.asetId}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {ba.kodeAset || ba.asetId} ({ba.namaAset})
              </Link>
            </div>
          )}

          {pesan && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-emerald-800">{pesan}</p>
            </div>
          )}
          {gagal && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-xs text-rose-800">{gagal}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aksi cetak pratinjau */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Pratinjau dokumen (3 halaman A4) — identik dengan template BASARNAS.
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* Pratinjau dokumen */}
      <DokumenBeritaAcara
        namaAset={ba.namaAset}
        nomor={ba.nomor}
        tanggal={tanggalDokumen}
        kendala={ba.kendala}
        butirAnalisa={butirAnalisa}
        fotoBukti={ba.fotoBukti}
        pengajuNama={ba.pengajuNama ?? ba.pelapor}
        pengajuJabatan={ba.pengajuJabatan ?? ba.pelaporJabatan}
        pelaporNama={ba.pelapor}
        pelaporJabatan={ba.pelaporJabatan}
      />
    </div>
  );
}
