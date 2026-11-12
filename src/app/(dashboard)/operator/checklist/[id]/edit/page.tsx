"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  PencilLine,
  FileText,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  checklistTemplates,
  getKategoriTemplate,
  type KondisiHasil,
  type ItemHasilPengecekan,
  type ChecklistHarian,
} from "@/components/shared/mock-data";
import {
  useChecklistsCombined,
  ambilChecklistDariDb,
  updateChecklistDraft,
} from "@/components/shared/checklist-store";
import { useSesiUser } from "@/components/shared/use-session";
import { DataLoading, DataError } from "@/components/shared/data-state";
import { useAsetById } from "@/components/shared/use-supabase-data";
import { cn } from "@/lib/utils";

/**
 * Halaman EDIT checklist harian — untuk operator lapangan & akun kantor.
 *
 * Pemilik checklist (pemeriksaId === NIP user login) bisa:
 * - Mengubah kondisi item yang sudah / belum diperiksa
 * - Menambah / menghapus item (mode manual)
 * - Mengubah keterangan & catatan
 *
 * Tanggal, unit, jenis, dan template tidak bisa diubah — hanya isi item
 * dan catatan yang bisa diperbaiki. Status otomatis diturunkan dari
 * kelengkapan item (Lengkap / Belum Lengkap).
 */

export default function EditChecklistPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const ses = useSesiUser();

  // Data checklist dari gabungan Supabase + in-memory.
  const { data: checklistList, loading, error, refetch } =
    useChecklistsCombined();
  const checklist = checklistList.find((c) => c.id === id);

  // Identifikasi pemilik: hanya pemilik yang boleh edit.
  const pemilik =
    checklist?.pemeriksaId && checklist.pemeriksaId === ses.nip;

  /**
   * Penanggung jawab aset checklist ini boleh memvalidasi & mengedit
   * (koreksi item rusak menjadi Baik setelah cek langsung ke unit).
   * Haknya baru bisa dipastikan setelah detail aset selesai dimuat.
   */
  const { data: asetDetail, loading: loadingAset } = useAsetById(
    checklist?.asetId
  );
  const isPJAset =
    ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR"
      ? asetDetail?.penanggungJawab === ses.nip
      : false;

  // Hak edit: operator lapangan & akun kantor pemilik checklist-nya,
  // PENANGGUNG JAWAB aset (memvalidasi), atau ADMIN_IT (semua checklist).
  const bisaEdit =
    ses.role === "ADMIN_IT" ||
    (ses.role === "OPERATOR_LAPANGAN" && (pemilik || isPJAset)) ||
    (ses.role === "AKUNTOR" && (pemilik || isPJAset));

  /**
   * Hak PJ baru bisa diputuskan setelah detail aset selesai dimuat.
   * Selama masih loading, jangan tolak akses — halaman tetap loading.
   * Tanpa guard ini, halaman sempat menampilkan "Akses Ditolak" sesaat
   * (query aset belum selesai) lalu kembali normal, dan pemanggilan
   * ulang komponen membuang state form (items/catatan) yang sedang
   * diubah user — persis keluhan "bisa berubah lalu tiba-tiba hilang".
   */
  const aksesTetap = !loading && !loadingAset;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [itemChecked, setItemChecked] = useState(0);
  const [items, setItems] = useState<ItemHasilPengecekan[]>([]);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorUmum, setErrorUmum] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [sukses, setSukses] = useState(false);

  // Mode manual: checklist tanpa template → item ditulis sendiri.
  const isManual = !checklist?.templateId;

  // Label item yang masuk kelompok template — dipakai untuk render.
  const labelDalamTemplate = (label: string): boolean => {
    if (!checklist?.templateId) return false;
    const tpl = checklistTemplates.find((t) => t.id === checklist.templateId);
    if (!tpl) return false;
    return tpl.items.some((i) => i.label === label);
  };

  // Prefill form dari data checklist (sekali saja, setelah data siap).
  const prefillDone = useRef(false);
  useEffect(() => {
    if (checklist && !prefillDone.current) {
      prefillDone.current = true;
      setItems(
        (checklist.items as ItemHasilPengecekan[]) ?? []
      );
      setCatatan(checklist.catatan ?? "");
      const checked = (checklist.items as ItemHasilPengecekan[]).filter(
        (i) => i.kondisi !== "Belum Diperiksa"
      ).length;
      setItemChecked(checked);
    }
  }, [checklist]);

  // ── Guard akses ──────────────────────────────────────────────────────────────
  // Cek "Akses Ditolak" HANYA setelah SEMUA data penentu hak selesai dimuat
  // (daftar checklist + detail aset). Selama masih loading, tampilkan loading
  // — bukan tolak. Ini mencegah flash "Akses Ditolak" palsu saat query aset
  // belum balik (bug race-condition: guard lama mengecek `!bisaEdit` sebelum
  // aset selesai dimuat, lalu halaman me-replace seluruh tree komponen dan
  // membuang state form yang sedang diubah user).
  if (loading || loadingAset) {
    return <DataLoading label="Memuat checklist untuk edit…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat checklist dari database"
      />
    );
  }
  // Guard: bukan pemilik/PJ & bukan admin → akses ditolak.
  // Hanya aktif saat data sudah lengkap (aksesTetap) — agar tidak menolak
  // sementara di antara dua query (checklist vs detail aset) yang belum
  // selesai, yang dulu bikin "Akses Ditolak" nyelip lalu hilang sendiri
  // sekaligus membuang state form user.
  if (aksesTetap && !bisaEdit) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-300" />
        <h1 className="text-xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="text-sm text-slate-500">
          Halaman edit checklist hanya untuk pemilik checklist, penanggung jawab
          aset terkait, atau Admin IT.
        </p>
        <Link href="/operator/checklist">
          <Button variant="outline">Kembali ke daftar checklist</Button>
        </Link>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-800">
          Checklist tidak ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Checklist dengan ID <span className="font-mono">{id}</span> tidak
          tersedia (mungkin sudah dihapus).
        </p>
        <Link href="/operator/checklist">
          <Button variant="outline">Kembali ke daftar checklist</Button>
        </Link>
      </div>
    );
  }

  // ── Helper untuk mengubah kondisi item ─────────────────────────────────────
  const ubahKondisi = (idx: number, kondisi: KondisiHasil) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, kondisi } : item
      )
    );
    // Hitung ulang itemChecked
    const checked = items
      .map((item, i) => (i === idx ? { ...item, kondisi } : item))
      .filter((i) => i.kondisi !== "Belum Diperiksa").length;
    setItemChecked(checked);
  };

  const ubahKeterangan = (idx: number, keterangan: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, keterangan } : item
      )
    );
  };

  // ── Mode manual: tambah / hapus item ──────────────────────────────────────
  const tambahItemManual = () => {
    setItems((prev) => [
      ...prev,
      {
        label: "",
        wajib: true,
        kondisi: "Belum Diperiksa",
        keterangan: "",
      },
    ]);
  };

  const hapusItemManual = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    setItemChecked(
      next.filter((i) => i.kondisi !== "Belum Diperiksa").length
    );
  };

  const ubahLabelManual = (idx: number, label: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, label } : item))
    );
  };

  // ── Simpan ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi: item rusak harus punya keterangan minimal 5 karakter.
    const rusakTanpaKeterangan = items.filter(
      (i) =>
        i.kondisi !== "Baik" &&
        i.kondisi !== "Belum Diperiksa" &&
        i.keterangan.trim().length < 5
    );
    if (rusakTanpaKeterangan.length > 0) {
      setErrors({
        umum: `${rusakTanpaKeterangan.length} item rusak belum punya keterangan (min. 5 karakter).`,
      });
      setErrorUmum(
        "Lengkapi keterangan item rusak terlebih dahulu."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Mode manual: label wajib diisi.
    if (isManual) {
      const kosongLabel = items.filter((i) => !i.label.trim());
      if (kosongLabel.length > 0) {
        setErrors({
          umum: `${kosongLabel.length} item belum punya nama.`,
        });
        setErrorUmum("Isi nama item yang kosong.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setMenyimpan(true);
    setErrorUmum(null);
    setErrors({});

    try {
      const result = await updateChecklistDraft(id, {
        itemChecked,
        itemTotal: items.length,
        items,
        catatan: catatan.trim(),
      });

      if (result.error) {
        setErrorUmum(result.error);
        return;
      }

      setSukses(true);
      // Segarkan daftar checklist.
      refetch();
      setTimeout(() => {
        router.push(`/operator/checklist/${id}`);
      }, 600);
    } catch (err) {
      const pesan =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setErrorUmum(pesan);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setMenyimpan(false);
    }
  };

  if (sukses) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
          Perubahan checklist berhasil disimpan. Mengalihkan ke detail…
        </div>
      </div>
    );
  }

  // Template untuk melihat daftar item standar (non-manual).
  const template = checklist.templateId
    ? checklistTemplates.find((t) => t.id === checklist.templateId)
    : undefined;
  const kelompokItem = template
    ? getKategoriTemplate(template.id)
    : [];

  // Item belum diperiksa (untuk peringatan).
  const belumDiperiksa = items.filter(
    (i) => i.kondisi === "Belum Diperiksa"
  ).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/operator/checklist/${id}`}>
          <Button variant="ghost" size="icon" aria-label="Kembali ke detail">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Edit Checklist Perawatan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {checklist.unit} · {checklist.tanggal} · ID{" "}
            <span className="font-mono text-xs">{checklist.id}</span>
          </p>
        </div>
      </div>

      {/* Info ringkas */}
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <PencilLine className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p>
          Anda sedang <strong>memperbaiki data</strong> checklist yang sudah
          ada — ubah kondisi item, keterangan, dan catatan. Tanggal, unit,
          dan template tidak bisa diubah.
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
        {/* ── Mode Template: item dari template, kondisi bisa diubah ──────── */}
        {!isManual && items.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  Hasil Pemeriksaan
                </h2>
                <Badge
                  variant={
                    itemChecked === items.length ? "success" : "outline"
                  }
                >
                  {itemChecked} / {items.length} item diperiksa
                </Badge>
              </div>

              {belumDiperiksa > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800">
                    <strong>{belumDiperiksa} item</strong> masih{" "}
                    &quot;Belum Diperiksa&quot; — status checklist akan
                    tetap &quot;Belum Lengkap&quot; sampai semua item dijawab.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {kelompokItem.map((kelompok) => (
                  <div key={kelompok.nama} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-700">
                        {kelompok.nama}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {items.filter(
                          (i) =>
                            kelompok.items.some(
                              (t) => t.label === i.label
                            )
                        ).length}{" "}
                        item
                      </span>
                    </div>

                    {items.map((item, idx) => {
                      if (!kelompok.items.some((t) => t.label === item.label))
                        return null;
                      const perluKeterangan =
                        item.kondisi !== "Baik" &&
                        item.kondisi !== "Belum Diperiksa" &&
                        item.keterangan.trim().length < 5;

                      return (
                        <div
                          key={item.label}
                          className={cn(
                            "rounded-lg border p-4",
                            item.kondisi !== "Belum Diperiksa"
                              ? "border-slate-200 bg-white"
                              : "border-slate-200 bg-slate-50"
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700">
                                {item.label}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.wajib && (
                                  <Badge variant="outline" className="text-xs">
                                    Wajib
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-2 sm:w-52">
                              {(["Baik", "Rusak Ringan", "Rusak Berat"] as const).map(
                                (k) => (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => ubahKondisi(idx, k)}
                                    aria-pressed={item.kondisi === k}
                                    className={cn(
                                      "flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                                      item.kondisi === k
                                        ? k === "Baik"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : k === "Rusak Ringan"
                                            ? "border-amber-500 bg-amber-50 text-amber-700"
                                            : "border-rose-500 bg-rose-50 text-rose-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                    )}
                                  >
                                    {item.kondisi === k && (
                                      <CheckCircle2 className="h-3 w-3" />
                                    )}
                                    {k === "Rusak Ringan" ? "Ringan" : k}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pl-0 sm:pl-9">
                            <Input
                              placeholder={
                                perluKeterangan
                                  ? "Keterangan wajib diisi (min. 5 karakter)"
                                  : "Keterangan (opsional)"
                              }
                              className={cn(
                                "text-xs",
                                perluKeterangan &&
                                  "border-rose-400 focus-visible:ring-rose-400"
                              )}
                              value={item.keterangan}
                              onChange={(e) =>
                                ubahKeterangan(idx, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Item yang tidak masuk kelompok template (jika ada) */}
                {(() => {
                  const labelKelompok = new Set(
                    kelompokItem.flatMap((k) => k.items.map((t) => t.label))
                  );
                  const sisa = items.filter(
                    (i) => !labelKelompok.has(i.label)
                  );
                  if (sisa.length === 0) return null;
                  return (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Item Lain
                      </h3>
                      {items.map((item, idx) => {
                        if (labelKelompok.has(item.label)) return null;
                        const perluKeterangan =
                          item.kondisi !== "Baik" &&
                          item.kondisi !== "Belum Diperiksa" &&
                          item.keterangan.trim().length < 5;
                        return (
                          <div
                            key={item.label}
                            className={cn(
                              "rounded-lg border p-4",
                              item.kondisi !== "Belum Diperiksa"
                                ? "border-slate-200 bg-white"
                                : "border-slate-200 bg-slate-50"
                            )}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-slate-700">
                                  {item.label}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-2 sm:w-52">
                                {(["Baik", "Rusak Ringan", "Rusak Berat"] as const).map(
                                  (k) => (
                                    <button
                                      key={k}
                                      type="button"
                                      onClick={() => ubahKondisi(idx, k)}
                                      aria-pressed={item.kondisi === k}
                                      className={cn(
                                        "flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                                        item.kondisi === k
                                          ? k === "Baik"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : k === "Rusak Ringan"
                                              ? "border-amber-500 bg-amber-50 text-amber-700"
                                              : "border-rose-500 bg-rose-50 text-rose-700"
                                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                      )}
                                    >
                                      {item.kondisi === k && (
                                        <CheckCircle2 className="h-3 w-3" />
                                      )}
                                      {k === "Rusak Ringan" ? "Ringan" : k}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="mt-3">
                              <Input
                                placeholder={
                                  perluKeterangan
                                    ? "Keterangan wajib diisi (min. 5 karakter)"
                                    : "Keterangan (opsional)"
                                }
                                className={cn(
                                  "text-xs",
                                  perluKeterangan &&
                                    "border-rose-400 focus-visible:ring-rose-400"
                                )}
                                value={item.keterangan}
                                onChange={(e) =>
                                  ubahKeterangan(idx, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Mode Manual: item ditulis sendiri, bisa tambah/hapus ─────────── */}
        {isManual && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  Daftar Item yang Diperiksa
                </h2>
                <Badge
                  variant={
                    itemChecked === items.length ? "success" : "outline"
                  }
                >
                  {itemChecked} / {items.length} item diisi
                </Badge>
              </div>

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <PencilLine className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    Belum ada item. Tekan &quot;Tambah Item&quot; untuk
                    menulis item yang diperiksa.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => {
                    const perluKeterangan =
                      item.kondisi !== "Baik" &&
                      item.kondisi !== "Belum Diperiksa" &&
                      item.keterangan.trim().length < 5;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-lg border p-4",
                          item.kondisi === "Belum Diperiksa"
                            ? "border-slate-200 bg-slate-50"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="mt-2 w-6 shrink-0 text-center text-xs font-semibold text-slate-400">
                              {idx + 1}
                            </span>
                            <Input
                              placeholder="Contoh: Baterai AED terisi penuh"
                              aria-label={`Item pemeriksaan ${idx + 1}`}
                              className="min-w-0"
                              value={item.label}
                              onChange={(e) =>
                                ubahLabelManual(idx, e.target.value)
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus item ${idx + 1}`}
                            onClick={() => hapusItemManual(idx)}
                            className="shrink-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 sm:pl-9">
                          {(["Baik", "Rusak Ringan", "Rusak Berat"] as const).map(
                            (k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => ubahKondisi(idx, k)}
                                aria-pressed={item.kondisi === k}
                                className={cn(
                                  "flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors sm:flex-none",
                                  item.kondisi === k
                                    ? k === "Baik"
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                      : k === "Rusak Ringan"
                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                        : "border-rose-500 bg-rose-50 text-rose-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                {item.kondisi === k && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {k === "Rusak Ringan" ? "Ringan" : k}
                              </button>
                            )
                          )}
                        </div>

                        <div className="mt-3 sm:pl-9">
                          <Input
                            placeholder={
                              perluKeterangan
                                ? "Keterangan wajib diisi (min. 5 karakter)"
                                : "Keterangan (opsional)"
                            }
                            aria-label={`Keterangan item ${idx + 1}`}
                            className={cn(
                              "text-xs",
                              perluKeterangan &&
                                "border-rose-400 focus-visible:ring-rose-400"
                            )}
                            value={item.keterangan}
                            onChange={(e) =>
                              ubahKeterangan(idx, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={tambahItemManual}
              >
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Catatan */}
        <Card className="p-6">
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Pemeriksa</Label>
            <Textarea
              id="catatan"
              rows={4}
              placeholder="Ringkasan hasil pemeriksaan atau tindakan lanjutan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </Card>

        {/* Aksi simpan */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/operator/checklist/${id}`}>
            <Button variant="outline" type="button" disabled={menyimpan}>
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={menyimpan}>
            {menyimpan ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
