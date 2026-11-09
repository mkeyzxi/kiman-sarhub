"use client";

import Link from "next/link";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { beritaAcaraByChecklist } from "@/components/shared/berita-acara-store";

/**
 * Tombol "Pengisian Berita Acara" pada detail checklist.
 *
 * Hanya muncul bila hasil pemeriksaan memuat item Rusak Ringan / Rusak Berat.
 * Bila berita acara sudah pernah dibuat, tampilkan statusnya.
 */
export default function TombolBeritaAcara({
  checklistId,
  adaRusak,
  /** true jika masih ada item "Belum Diperiksa" → BA tidak valid. */
  draftBelumLengkap,
}: {
  checklistId: string;
  adaRusak: boolean;
  draftBelumLengkap?: boolean;
}) {
  if (!adaRusak) return null;

  const ba = beritaAcaraByChecklist(checklistId);
  const sudahDiserahkan = ba && ba.status !== "Draf";

  // Jika draft belum lengkap, tidak boleh lanjut ke Berita Acara.
  if (draftBelumLengkap && !ba) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Checklist belum lengkap — lengkapi dulu sebelum pengisian Berita
          Acara.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {ba && (
        <Badge
          variant={
            ba.status === "Disetujui"
              ? "success"
              : ba.status === "Ditolak"
                ? "danger"
                : ba.status === "Draf"
                  ? "default"
                  : "warning"
          }
          className="px-3 py-1"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Berita Acara: {ba.status}
        </Badge>
      )}
      <Link href={`/operator/checklist/${checklistId}/berita-acara`}>
        <Button variant={sudahDiserahkan ? "outline" : "primary"}>
          <FileText className="h-4 w-4" />
          {sudahDiserahkan ? "Lihat Berita Acara" : "Pengisian Berita Acara"}
        </Button>
      </Link>
    </div>
  );
}
