"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, CheckCircle2, AlertTriangle, Ship, Car, Bike, Anchor, Plus, Trash2, PencilLine, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  checklistTemplates,
  getKategoriTemplate,
  asetList,
  cariAsetDmUnit,
  bolehIsiChecklist,
  getUserById,
  type Aset,
  type KondisiHasil,
  type JenisArmada,
  type ItemHasilPengecekan,
} from "@/components/shared/mock-data";
import { useSesiUser, jabatanUser } from "@/components/shared/use-session";
import { tambahChecklist, ambilChecklist } from "@/components/shared/checklist-store";
import { cn } from "@/lib/utils";

const jenisArmadaOptions: { value: JenisArmada; label: string; icon: React.ElementType }[] = [
  { value: "Kapal", label: "Kapal", icon: Anchor },
  { value: "RIB", label: "RIB / Perahu", icon: Ship },
  { value: "RBB", label: "RBB", icon: Ship },
  { value: "Mobil", label: "Mobil", icon: Car },
  { value: "Motor", label: "Motor", icon: Bike },
];

/**
 * Pemetaan jenis armada ke kategori aset. RIB dan RBB termasuk kategori
 * "Kapal" pada register BMN, sehingga dibedakan lewat nama aset.
 */
const kategoriAsetMapping: Record<JenisArmada, string[]> = {
  Kapal: ["Kapal"],
  RIB: ["Kapal"],
  RBB: ["Kapal"],
  Mobil: ["Mobil"],
  Motor: ["Motor"],
  Lainnya: ["Peralatan SAR", "Medis", "Komunikasi", "Dokumentasi"],
};

/** Apakah aset termasuk jenis armada yang dipilih pada form. */
function cocokJenisArmada(aset: Aset, jenisArmada: JenisArmada): boolean {
  if (!kategoriAsetMapping[jenisArmada].includes(aset.kategori)) return false;
  if (jenisArmada === "RIB") {
    return /RIB|perahu/i.test(aset.nama) && !/RBB/i.test(aset.nama);
  }
  if (jenisArmada === "RBB") return /RBB/i.test(aset.nama);
  if (jenisArmada === "Kapal") return !/RIB|RBB/i.test(aset.nama);
  return true;
}

/**
 * Daftar unit yang boleh diperiksa: hanya aset yang menjadi tanggung jawab
 * user. Unit statis lama (RIB 9 M, KN SAR MAMUJU 01) tidak dipakai lagi karena
 * tidak ada di register BMN.
 */
function getUnitOptionsForArmada(
  jenisArmada: JenisArmada,
  userId: string
): { value: string; label: string }[] {
  return asetList
    .filter(
      (a) => cocokJenisArmada(a, jenisArmada) && a.penanggungJawab === userId
    )
    .map((a) => ({ value: a.kode, label: `${a.nama} (${a.kode})` }));
}

export default function BuatChecklistPage() {
  const ses = useSesiUser();
  const [tanggal, setTanggal] = useState("");
  const [unit, setUnit] = useState("");
  const [jenisUnit, setJenisUnit] = useState<JenisArmada>("Kapal");
  /** PJ (pemeriksa) terisi otomatis dari akun yang sedang login — bukan dropdown. */
  const pemeriksa = ses.nama;
  const [templateId, setTemplateId] = useState("");
  const [catatan, setCatatan] = useState("");
  /** Tersimpan sementara ID checklist yang baru dibuat (untuk tombol berita acara). */
  const [checklistBaruId, setChecklistBaruId] = useState<string | null>(null);

  // Aset terkait unit yang dipilih — untuk menampilkan PJ aset pada form.
  const asetTerkait = useMemo(() => cariAsetDmUnit(unit), [unit]);
  /**
   * Hak pengisian: user harus operator lapangan DAN penanggung jawab aset.
   * Unit yang dipilih selalu berasal dari aset milik user, tetapi pengecekan
   * ini tetap dilakukan sebagai lapisan pengaman saat submit.
   */
  const bolehIsiUnit = bolehIsiChecklist(asetTerkait, ses.id, ses.role);
  const pjAset = asetTerkait
    ? {
        id: asetTerkait.penanggungJawab,
        nama: getUserById(asetTerkait.penanggungJawab)?.nama ?? "-",
        jabatan: jabatanUser(asetTerkait.penanggungJawab),
      }
    : undefined;

  // Mode manual dipakai untuk peralatan yang tidak punya template dari form
  // fisik kantor (mis. peralatan lain). Item ditulis sendiri oleh pemeriksa.
  const [modeManual, setModeManual] = useState(false);
  const [itemManual, setItemManual] = useState<
    { id: string; label: string; kondisi: KondisiHasil; keterangan: string }[]
  >([]);

  // Hasil per item, keyed dengan label item agar tidak kacau saat template diganti.
  const [hasil, setHasil] = useState<Record<string, KondisiHasil>>({});
  const [keterangan, setKeterangan] = useState<Record<string, string>>({});

  const template = useMemo(
    () => checklistTemplates.find((t) => t.id === templateId),
    [templateId]
  );

  // Hanya armada yang punya template dari form fisik kantor. Peralatan
  // "Lainnya" memakai mode input manual.
  const templateTersedia = useMemo(
    () => checklistTemplates.filter((t) => t.jenisArmada === jenisUnit),
    [jenisUnit]
  );

  // Unit options hanya aset yang menjadi tanggung jawab user yang login.
  const unitOptions = useMemo(
    () => getUnitOptionsForArmada(jenisUnit, ses.id),
    [jenisUnit, ses.id]
  );

  // Item dikelompokkan mengikuti bagian pada form fisik (mis. "Kamar Mesin").
  const kelompokItem = useMemo(
    () => (template ? getKategoriTemplate(template.id) : []),
    [template]
  );

  const sudahDiperiksa = template
    ? template.items.filter((i) => hasil[i.label] && hasil[i.label] !== "Belum Diperiksa")
        .length
    : 0;

  // Jumlah item mode manual yang belum diisi namanya atau belum dijawab.
  const itemManualBelumSiap = itemManual.filter(
    (i) => !i.label.trim() || i.kondisi === "Belum Diperiksa"
  ).length;
  const itemManualRusakTanpaKeterangan = itemManual.filter(
    (i) =>
      i.kondisi !== "Baik" &&
      i.kondisi !== "Belum Diperiksa" &&
      i.keterangan.trim().length < 5
  ).length;
  const itemManualTerisi = itemManual.length - itemManualBelumSiap;

  // Validasi V1: semua item wajib dijawab, V2: kondisi rusak wajib keterangan.
  const itemBelumDijawab = template
    ? template.items.filter((i) => !hasil[i.label]).length
    : modeManual
      ? itemManualBelumSiap
      : 0;
  const itemRusakTanpaKeterangan = template
    ? template.items.filter(
        (i) =>
          hasil[i.label] &&
          hasil[i.label] !== "Baik" &&
          (keterangan[i.label] ?? "").trim().length < 5
      ).length
    : 0;

  const handleJenisArmadaChange = (newJenis: JenisArmada) => {
    setJenisUnit(newJenis);
    setTemplateId("");
    setUnit("");
    setHasil({});
    setKeterangan({});
    setModeManual(newJenis === "Lainnya");
    setItemManual([]);
    setChecklistBaruId(null);
  };

  /** Tambah baris item baru pada mode input manual. */
  const tambahItemManual = () =>
    setItemManual((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}-${prev.length}`,
        label: "",
        kondisi: "Belum Diperiksa",
        keterangan: "",
      },
    ]);

  const hapusItemManual = (id: string) =>
    setItemManual((prev) => prev.filter((i) => i.id !== id));

  const ubahItemManual = (
    id: string,
    perubahan: Partial<{ label: string; kondisi: KondisiHasil; keterangan: string }>
  ) =>
    setItemManual((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...perubahan } : i))
    );

  /**
   * Simpan checklist harian ke memori sesi (TODO: Supabase INSERT).
   * Jika ada item Rusak Ringan/Berat → tampilkan tombol "Pengisian Berita Acara".
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Hanya operator lapangan yang menjadi PJ unit boleh menyimpan checklist.
    if (!bolehIsiUnit) return;

    // Kumpulkan item hasil pemeriksaan
    const items: ItemHasilPengecekan[] = modeManual
      ? itemManual.map((i) => ({
          label: i.label,
          wajib: true,
          kondisi: i.kondisi,
          keterangan: i.keterangan,
        }))
      : template
        ? template.items.map((i) => ({
            label: i.label,
            wajib: i.wajib,
            kondisi: hasil[i.label] ?? "Belum Diperiksa",
            keterangan: keterangan[i.label] ?? "",
          }))
        : [];

    const itemChecked = items.filter(
      (i) => i.kondisi !== "Belum Diperiksa"
    ).length;

    // Simpan checklist
    const result = tambahChecklist({
      tanggal,
      unit: asetTerkait?.nama ?? unit,
      jenisUnit: (jenisUnit === "RIB" || jenisUnit === "RBB")
        ? "Perahu"
        : (jenisUnit as "Kapal" | "Mobil" | "Motor"),
      templateId: modeManual ? undefined : templateId,
      pemeriksa,
      pemeriksaId: ses.id,
      itemChecked,
      itemTotal: items.length,
      items,
      catatan,
      asetId: asetTerkait?.id,
    });
    setChecklistBaruId(result.id);

    // Reset form agar siap buat checklist berikutnya
    setTanggal("");
    setUnit("");
    setTemplateId("");
    setCatatan("");
    setHasil({});
    setKeterangan({});
    setItemManual([]);
  };

  /** Apakah hasil pemeriksaan barusan ada item rusak? */
  const adaItemRusak = checklistBaruId
    ? (ambilChecklist(checklistBaruId)?.items.some(
        (i) => i.kondisi === "Rusak Ringan" || i.kondisi === "Rusak Berat"
      ) ?? false)
    : false;

  // Aturan akses: hanya Operator Lapangan yang boleh membuka form pengisian.
  // Pengelola BMN, Kakansar, dan Admin IT hanya dapat melihat checklist.
  if (ses.role !== "OPERATOR_LAPANGAN") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-semibold text-slate-800">
            Tidak berhak mengisi checklist
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Checklist perawatan hanya dapat diisi oleh{" "}
            <strong>Operator Lapangan</strong> yang ditunjuk sebagai penanggung
            jawab unit. Peran Anda saat ini: <strong>{ses.jabatan}</strong>.
          </p>
          <Link href="/operator/checklist" className="mt-5 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Checklist
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/operator/checklist">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Checklist</h1>
          <p className="mt-1 text-sm text-slate-500">
            Isi hasil pemeriksaan harian untuk unit yang akan diperiksa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Pemeriksaan */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Data Pemeriksaan
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Input
                id="pemeriksa"
                value={pemeriksa}
                disabled
                required
              />
              <p className="text-xs text-slate-400">
                Otomatis terisi dari akun yang sedang login
                {unit && asetTerkait ? ` — Penanggung Jawab aset: ${pjAset?.nama ?? "-"}` : ""}
              </p>
            </div>
          </div>

          {/* Jenis Armada — Visual Toggle */}
          <div className="mt-5">
            <Label>Jenis Armada</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {jenisArmadaOptions.map((opt) => {
                const isActive = jenisUnit === opt.value;
                const templateCount = checklistTemplates.filter(
                  (t) => t.jenisArmada === opt.value
                ).length;
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleJenisArmadaChange(opt.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-all",
                      isActive
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <IconComp className="h-5 w-5" />
                    <span>{opt.label}</span>
                    {templateCount > 0 && (
                      <span
                        className={cn(
                          "text-[10px] rounded-full px-1.5 py-0.5",
                          isActive
                            ? "bg-primary/20 text-primary"
                            : "bg-slate-100 text-slate-400"
                        )}
                      >
                        {templateCount} template
                      </span>
                    )}
                    {templateCount === 0 && opt.value !== "Lainnya" && (
                      <span className="text-[10px] text-slate-400">
                        Belum ada
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit Dropdown */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit yang Diperiksa</Label>
              {unitOptions.length > 0 ? (
                <Select
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                >
                  <option value="">Pilih unit</option>
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Tidak ada unit{" "}
                  <strong>
                    {jenisArmadaOptions.find((j) => j.value === jenisUnit)?.label ??
                      jenisUnit}
                  </strong>{" "}
                  yang menjadi tanggung jawab Anda.
                </div>
              )}
              <p className="text-xs text-slate-500">
                {unitOptions.length > 0
                  ? "Hanya unit yang menjadi tanggung jawab Anda yang ditampilkan."
                  : "Hubungi Pengelola BMN bila penanggung jawab unit perlu diubah."}
              </p>
              {unit && !bolehIsiUnit && (
                <p className="text-xs text-rose-600">
                  Anda bukan penanggung jawab unit ini sehingga tidak dapat
                  menyimpan checklist.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Template / Input Manual */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            {modeManual ? (
              <PencilLine className="h-5 w-5 text-primary" />
            ) : (
              <ClipboardCheck className="h-5 w-5 text-primary" />
            )}
            {modeManual ? "Input Manual" : "Template Checklist"}
          </h2>

          {modeManual ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                Peralatan <strong>Medis</strong> dan <strong>Komunikasi</strong>{" "}
                belum punya form template dari kantor. Tulis sendiri item yang
                diperiksa, lalu tentukan kondisinya.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="templateId">Pilih Template</Label>
                {templateTersedia.length > 0 ? (
                  <Select
                    id="templateId"
                    value={templateId}
                    onChange={(e) => {
                      setTemplateId(e.target.value);
                      setHasil({});
                      setKeterangan({});
                    }}
                    required
                  >
                    <option value="">Pilih template</option>
                    {templateTersedia.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama} ({t.periode}, {t.items.length} item)
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-800">
                      Belum ada template checklist untuk jenis armada{" "}
                      <strong>
                        {jenisArmadaOptions.find((j) => j.value === jenisUnit)?.label ?? jenisUnit}
                      </strong>
                      . Hubungi admin untuk menambahkan template, atau pilih jenis
                      armada lain.
                    </p>
                  </div>
                )}
                {template?.sumber && (
                  <p className="mt-1 text-xs text-slate-500">
                    Sumber form: {template.sumber}. Daftar item mengikuti template
                    yang dipilih. Pilih ulang template akan mengosongkan hasil yang
                    sudah diisi.
                  </p>
                )}
              </div>

              {/* Info ringkasan template terpilih */}
              {template && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {template.jenisArmada}
                  </Badge>
                  <Badge variant="outline">
                    {template.periode}
                  </Badge>
                  <Badge variant="outline">
                    {template.items.length} item
                  </Badge>
                  {template.items.some((i) => i.isKritis) && (
                    <Badge variant="warning">
                      {template.items.filter((i) => i.isKritis).length} kritis
                    </Badge>
                  )}
                </div>
              )}
            </>
          )}
        </Card>

        {/* Hasil Pemeriksaan — mode input manual */}
        {modeManual && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  Daftar Item yang Diperiksa
                </h2>
                <Badge
                  variant={
                    itemManual.length > 0 &&
                    itemManualBelumSiap === 0 &&
                    itemManualRusakTanpaKeterangan === 0
                      ? "success"
                      : "outline"
                  }
                >
                  {itemManualTerisi} / {itemManual.length} item diisi
                </Badge>
              </div>

              {itemManual.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <PencilLine className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    Belum ada item. Tekan &quot;Tambah Item&quot; untuk menulis
                    equipment yang diperiksa.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itemManual.map((item, idx) => {
                    const perluKeterangan =
                      item.kondisi !== "Baik" &&
                      item.kondisi !== "Belum Diperiksa" &&
                      item.keterangan.trim().length < 5;
                    return (
                      <div
                        key={item.id}
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
                              aria-label={"Item pemeriksaan " + (idx + 1)}
                              className="min-w-0"
                              value={item.label}
                              onChange={(e) =>
                                ubahItemManual(item.id, { label: e.target.value })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={"Hapus item " + (idx + 1)}
                            onClick={() => hapusItemManual(item.id)}
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
                                onClick={() =>
                                  ubahItemManual(item.id, { kondisi: k })
                                }
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
                            aria-label={"Keterangan item " + (idx + 1)}
                            className={cn(
                              "text-xs",
                              perluKeterangan &&
                                "border-rose-400 focus-visible:ring-rose-400"
                            )}
                            value={item.keterangan}
                            onChange={(e) =>
                              ubahItemManual(item.id, {
                                keterangan: e.target.value,
                              })
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

        {/* Hasil Pemeriksaan */}
        {template && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  Hasil Pemeriksaan
                </h2>
                <Badge variant={sudahDiperiksa === template.items.length ? "success" : "outline"}>
                  {sudahDiperiksa} / {template.items.length} item diisi
                </Badge>
              </div>

              {template.items.some((i) => i.isKritis) && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800">
                    Item bertanda <strong>Kritis</strong>: bila berstatus
                    &quot;Rusak Berat&quot;, armada akan otomatis terkunci dan
                    dibuatkan tiket perbaikan.
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
                        {kelompok.items.length} item
                      </span>
                    </div>

                    {kelompok.items.map((item) => {
                      const kondisi = hasil[item.label];
                      const perluKeterangan =
                        kondisi &&
                        kondisi !== "Baik" &&
                        (keterangan[item.label] ?? "").trim().length < 5;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "rounded-lg border p-4",
                            kondisi && kondisi !== "Belum Diperiksa"
                              ? "border-slate-200 bg-white"
                              : "border-slate-200 bg-slate-50"
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div className="min-w-0">
                                <p className="text-sm text-slate-700">
                                  {item.label}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.wajib && (
                                    <Badge variant="outline" className="text-xs">
                                      Wajib
                                    </Badge>
                                  )}
                                  {item.isKritis && (
                                    <Badge variant="warning" className="text-xs">
                                      Kritis
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-2 sm:w-52">
                              {(["Baik", "Rusak Ringan", "Rusak Berat"] as const).map(
                                (k) => (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() =>
                                      setHasil((prev) => ({
                                        ...prev,
                                        [item.label]: k,
                                      }))
                                    }
                                    aria-pressed={kondisi === k}
                                    className={cn(
                                      "flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                                      kondisi === k
                                        ? k === "Baik"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : k === "Rusak Ringan"
                                            ? "border-amber-500 bg-amber-50 text-amber-700"
                                            : "border-rose-500 bg-rose-50 text-rose-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                    )}
                                  >
                                    {kondisi === k && (
                                      <CheckCircle2 className="h-3 w-3" />
                                    )}
                                    {k === "Rusak Ringan" ? "Ringan" : k}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pl-9">
                            <Input
                              placeholder={
                                kondisi && kondisi !== "Baik"
                                  ? "Keterangan wajib diisi (min. 5 karakter)"
                                  : "Keterangan (opsional)"
                              }
                              className={cn(
                                "text-xs",
                                perluKeterangan && "border-rose-400 focus-visible:ring-rose-400"
                              )}
                              value={keterangan[item.label] ?? ""}
                              onChange={(e) =>
                                setKeterangan((prev) => ({
                                  ...prev,
                                  [item.label]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
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

        {/* Validasi sebelum simpan */}
        {(template || modeManual) &&
          (itemBelumDijawab > 0 ||
            itemRusakTanpaKeterangan > 0 ||
            itemManualRusakTanpaKeterangan > 0) && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              {itemBelumDijawab > 0 && (
                <p>
                  <strong>{itemBelumDijawab} item</strong> belum dijawab. Semua
                  item template wajib diisi sebelum disimpan.
                </p>
              )}
              {(itemRusakTanpaKeterangan > 0 ||
                itemManualRusakTanpaKeterangan > 0) && (
                <p className="mt-1">
                  <strong>
                    {itemRusakTanpaKeterangan + itemManualRusakTanpaKeterangan}{" "}
                    item
                  </strong>{" "}
                  berstatus rusak tanpa keterangan. Keterangan wajib diisi minimal
                  5 karakter.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/operator/checklist">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button
            type="submit"
            disabled={
              !bolehIsiUnit ||
              (modeManual
                ? itemManual.length === 0 ||
                  itemBelumDijawab > 0 ||
                  itemManualRusakTanpaKeterangan > 0
                : !template ||
                  itemBelumDijawab > 0 ||
                  itemRusakTanpaKeterangan > 0)
            }
          >
            Simpan Checklist
          </Button>
        </div>

        {/* Setelah simpan: jika ada item rusak → tombol pengisian berita acara */}
        {checklistBaruId && adaItemRusak && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">
                Checklist berhasil disimpan. Terdapat item rusak — silakan
                lanjutkan pengisian Berita Acara.
              </p>
            </div>
            <Link href={`/operator/checklist/${checklistBaruId}/berita-acara`}>
              <Button variant="primary" size="sm">
                <FileText className="h-4 w-4" />
                Pengisian Berita Acara
              </Button>
            </Link>
          </div>
        )}

        {checklistBaruId && !adaItemRusak && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">
                Checklist berhasil disimpan. Tidak ada item rusak — unit siap
                operasional.
              </p>
            </div>
            <Link href={`/operator/checklist/${checklistBaruId}`}>
              <Button variant="outline" size="sm">
                Lihat Detail
              </Button>
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}