"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checklistTemplates, users, type KondisiHasil } from "@/components/shared/mock-data";
import { cn } from "@/lib/utils";

const kondisiOptions: KondisiHasil[] = [
  "Baik",
  "Rusak Ringan",
  "Rusak Berat",
  "Belum Diperiksa",
];

export default function BuatChecklistPage() {
  const [tanggal, setTanggal] = useState("");
  const [unit, setUnit] = useState("");
  const [jenisUnit, setJenisUnit] = useState("Kapal");
  const [pemeriksa, setPemeriksa] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [catatan, setCatatan] = useState("");

  // Hasil per item, keyed dengan label item agar tidak kacau saat template diganti.
  const [hasil, setHasil] = useState<Record<string, KondisiHasil>>({});
  const [keterangan, setKeterangan] = useState<Record<string, string>>({});

  const template = useMemo(
    () => checklistTemplates.find((t) => t.id === templateId),
    [templateId]
  );

  const sudahDiperiksa = template
    ? template.items.filter((i) => hasil[i.label] && hasil[i.label] !== "Belum Diperiksa")
        .length
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log({ tanggal, unit, jenisUnit, pemeriksa, templateId, hasil, catatan });
  };

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
              <Label htmlFor="jenisUnit">Jenis Unit</Label>
              <Select
                id="jenisUnit"
                value={jenisUnit}
                onChange={(e) => setJenisUnit(e.target.value)}
              >
                <option value="Kapal">Kapal</option>
                <option value="Perahu">Perahu</option>
                <option value="Mobil">Mobil</option>
                <option value="Motor">Motor</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit yang Diperiksa</Label>
              <Input
                id="unit"
                placeholder="Contoh: RIB 12 M"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pemeriksa">Pemeriksa</Label>
              <Select
                id="pemeriksa"
                value={pemeriksa}
                onChange={(e) => setPemeriksa(e.target.value)}
                required
              >
                <option value="">Pilih pemeriksa</option>
                {users.map((u) => (
                  <option key={u.id} value={u.nama}>
                    {u.nama}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Template */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Template Checklist
          </h2>
          <div className="space-y-2">
            <Label htmlFor="templateId">Pilih Template</Label>
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
              {checklistTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama} ({t.periode})
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-500">
              Daftar item mengikuti template yang dipilih. Pilih ulang template
              akan mengosongkan hasil yang sudah diisi.
            </p>
          </div>
        </Card>

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

              <div className="space-y-3">
                {template.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border p-4",
                      hasil[item.label] && hasil[item.label] !== "Belum Diperiksa"
                        ? "border-slate-200 bg-white"
                        : "border-slate-200 bg-slate-50"
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 w-6 shrink-0 text-xs text-slate-400">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700">{item.label}</p>
                          {item.wajib && (
                            <Badge variant="outline" className="mt-1 text-xs">
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
                              onClick={() =>
                                setHasil((prev) => ({ ...prev, [item.label]: k }))
                              }
                              aria-pressed={hasil[item.label] === k}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                                hasil[item.label] === k
                                  ? k === "Baik"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : k === "Rusak Ringan"
                                      ? "border-amber-500 bg-amber-50 text-amber-700"
                                      : "border-rose-500 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                              )}
                            >
                              {hasil[item.label] === k && (
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
                        placeholder="Keterangan (opsional)"
                        className="text-xs"
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/operator/checklist">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit">Simpan Checklist</Button>
        </div>
      </form>
    </div>
  );
}