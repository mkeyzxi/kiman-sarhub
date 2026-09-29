"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAsetById,
  checklistTemplates,
  type ChecklistItem,
} from "@/components/shared/mock-data";

type ChecklistResponse = "Baik" | "Rusak" | "Tidak Ada";

const responseOptions: { value: ChecklistResponse; color: string }[] = [
  { value: "Baik", color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "Rusak", color: "border-rose-500 bg-rose-50 text-rose-700" },
  { value: "Tidak Ada", color: "border-slate-300 bg-slate-50 text-slate-600" },
];

export function MobileChecklist({ id }: { id: string }) {
  const aset = getAsetById(id);
  const [responses, setResponses] = useState<
    Record<string, ChecklistResponse | undefined>
  >({});
  const [submitted, setSubmitted] = useState(false);

  if (!aset) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Package className="h-12 w-12 text-slate-300" />
        <p className="text-sm text-slate-500">Aset tidak ditemukan</p>
        <Link href="/mobile/dashboard">
          <Button variant="outline" size="sm">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    );
  }

  const template = checklistTemplates.find((t) => t.kategori === aset.kategori);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Checklist Tersimpan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Checklist kesiapan untuk <strong>{aset.nama}</strong> telah berhasil
            disimpan.
          </p>
        </div>
        <Link href="/mobile/dashboard">
          <Button size="lg">Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/mobile/aset/${aset.id}`} className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </div>
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">
          Checklist Kesiapan
        </h1>
      </div>

      {/* Asset Info Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Package className="h-6 w-6 text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {aset.nama}
            </p>
            <p className="text-xs text-slate-500">
              {aset.kode} &middot; {aset.kategori}
            </p>
          </div>
        </div>
      </Card>

      {/* Template Info */}
      {template && (
        <div className="rounded-lg bg-primary-light px-4 py-3">
          <p className="text-sm font-medium text-primary">{template.nama}</p>
          <p className="mt-0.5 text-xs text-primary/70">
            {template.items.length} item pengecekan
          </p>
        </div>
      )}

      {/* Checklist Items */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {template?.items.map((item: ChecklistItem, idx: number) => (
          <Card key={item.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">
                {idx + 1}. {item.label}
              </p>
              {item.wajib && (
                <Badge variant="danger" className="shrink-0">
                  Wajib
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {responseOptions.map((option) => {
                const isSelected = responses[item.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setResponses((prev) => ({
                        ...prev,
                        [item.id]: option.value,
                      }))
                    }
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? option.color
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option.value}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!template}
      >
        Simpan Checklist
      </Button>
    </form>
  );
}
