"use client";

import Link from "next/link";
import { FileText, CheckCircle2 } from "lucide-react";
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
}: {
  checklistId: string;
  adaRusak: boolean;
}) {
  if (!adaRusak) return null;

  const ba = beritaAcaraByChecklist(checklistId);
  const sudahDiserahkan = ba && ba.status !== "Draf";

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
