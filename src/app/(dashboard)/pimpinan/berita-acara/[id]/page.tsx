"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
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
import { putuskanBeritaAcara } from "@/components/shared/db-writes";
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

export default function DetailBeritaAcaraPimpinanPage() {
  const params = useParams<{ id: string }>();

  const { data, loading, error, refetch } = useBeritaAcara();
  const ba = data.find((b) => b.id === params.id);

  const [catatan, setCatatan] = useState("");
  const [memutus, setMemutus] = useState(false);
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
        <Link href="/pimpinan/berita-acara">
          <Button variant="outline">Kembali ke Daftar Berita Acara</Button>
        </Link>
      </div>
    );
  }

  const tglTeks = tanggalTeks(ba.tanggal);
  const tanggalDokumen = tglTeks
    ? { ...tglTeks, tanggal: angkaTeks(Number(tglTeks.tanggal)) }
    : null;
  const butirAnalisa = susunButirAnalisa(ba.uraian, ba.kendala);

  /**
   * Keputusan KAKANSAR lewat RPC SECURITY DEFINER (putuskan_berita_acara):
   * setujui → BA "Disetujui" + aset "Maintenance";
   * tolak → BA "Ditolak" + alasan wajib.
   */
  const handlePutuskan = async (setujui: boolean) => {
    if (!ba || memutus) return;
    if (!setujui && !catatan.trim()) {
      setGagal("Alasan penolakan wajib diisi.");
      return;
    }
    setMemutus(true);
    setGagal(null);
    setPesan(null);
    try {
      await putuskanBeritaAcara(ba.id, setujui, catatan.trim());
    } catch (e) {
      setGagal(
        e instanceof Error ? e.message : "Gagal menyimpan keputusan ke database"
      );
      setMemutus(false);
      return;
    }
    terapkanPatchBeritaAcara(ba.id, {
      status: setujui ? "Disetujui" : "Ditolak",
      ...(setujui ? {} : { alasanPenolakan: catatan.trim() }),
    });
    void refetch();
    setPesan(
      setujui
        ? "Berita acara disetujui — aset dapat dikirim ke unit service. Pengelola BMN dapat membuat tiket maintenance."
        : "Berita acara ditolak — dokumen dikembalikan ke PJ/Pengelola BMN untuk perbaikan."
    );
    setMemutus(false);
  };

  return (
    <div className="ba-page space-y-6">
      {/* Page Header */}
      <div className="no-print flex flex-wrap items-center gap-4">
        <Link href="/pimpinan/berita-acara">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tinjau Berita Acara — {ba.namaAset}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {ba.nomor ? `Nomor ${ba.nomor}` : "Nomor belum diisi"} ·{" "}
            {formatTanggal(ba.tanggal)} · Pengaju:{" "}
            {ba.pengajuNama ?? ba.pelapor}
          </p>
        </div>
        <Badge
          variant={statusVariant[ba.status] ?? "default"}
          className="ml-auto px-3 py-1"
        >
          {ba.status}
        </Badge>
      </div>

      {/* Status alur + keputusan */}
      <Card className="no-print">
        <CardContent className="space-y-4 pt-6">
          {ba.status === "Draf" && (
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700">
              <Clock className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">
                Operator masih mengisi draf berita acara ini — belum diserahkan.
              </p>
            </div>
          )}
          {ba.status === "Diserahkan" && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <Clock className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">
                Telah diserahkan ke Pengelola BMN — menunggu pengisian nomor
                surat. Berita acara masuk ke persetujuan Anda setelah
                berstatus <strong>&quot;Diproses&quot;</strong>.
              </p>
            </div>
          )}
          {ba.status === "Diproses" && (
            <>
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
                <Send className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">
                  Nomor surat sudah diisi Pengelola BMN. Tinjau dokumen di
                  bawah, lalu beri keputusan (setujui / tolak).
                </p>
              </div>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="space-y-2">
                  <Label htmlFor="catatanPutusan">
                    Catatan Keputusan (wajib bila menolak)
                  </Label>
                  <Textarea
                    id="catatanPutusan"
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: disetujui, segera kirim ke service / tolak: foto bukti tidak jelas..."
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => handlePutuskan(false)}
                    disabled={memutus}
                  >
                    <XCircle className="h-4 w-4" />
                    Tolak Berita Acara
                  </Button>
                  <Button
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handlePutuskan(true)}
                    disabled={memutus}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {memutus ? "Menyimpan…" : "Setujui Berita Acara"}
                  </Button>
                </div>
              </div>
            </>
          )}
          {ba.status === "Disetujui" && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">
                Berita acara ini sudah Anda setujui. Aset berstatus
                &quot;Maintenance&quot; dan Pengelola BMN membuat tiket
                maintenance untuk perbaikan.
              </p>
            </div>
          )}
          {ba.status === "Ditolak" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    Berita acara ditolak
                  </p>
                  {ba.alasanPenolakan && (
                    <p className="mt-0.5 text-xs">
                      Alasan: {ba.alasanPenolakan}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meta aset (dokumen penuh di bawah) */}
          {ba.asetId && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Package className="h-3.5 w-3.5" />
              Aset terkait:{" "}
              <span className="font-mono font-medium text-slate-700">
                {ba.kodeAset || ba.asetId}
              </span>
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

      {/* Aksi cetak */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Pratinjau dokumen (3 halaman A4) — template sama dengan milik
          operator &amp; Pengelola BMN.
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* Pratinjau dokumen — template sama persis dengan milik operator */}
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
