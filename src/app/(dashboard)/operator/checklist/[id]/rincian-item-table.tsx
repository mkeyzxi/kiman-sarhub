"use client";

import { Badge } from "@/components/ui/badge";
import {
  ResponsiveTable,
  type ResponsiveField,
} from "@/components/shared/responsive-table";
import type { KondisiHasil } from "@/components/shared/mock-data";

const kondisiVariant: Record<
  KondisiHasil,
  "success" | "warning" | "danger" | "outline"
> = {
  Baik: "success",
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
  "Belum Diperiksa": "outline",
};

interface ItemChecklist {
  label: string;
  wajib: boolean;
  kondisi: KondisiHasil;
  keterangan: string;
}

/** Baris tabel diperluas dengan nomor urut agar bisa dipakai sebagai key. */
type BarisItem = ItemChecklist & { no: number };

const FIELDS: ResponsiveField<BarisItem>[] = [
  {
    key: "no",
    header: "No",
    render: (row) => row.no,
    headClassName: "w-12 text-center",
    cellClassName: "text-center text-slate-500",
    hideOnCard: true,
  },
  {
    key: "label",
    header: "Item Pemeriksaan",
    render: (row) => row.label,
    cellClassName: "text-slate-700",
    hideOnCard: true,
  },
  {
    key: "wajib",
    header: "Wajib",
    render: (row) =>
      row.wajib ? (
        <Badge variant="outline" className="text-xs">
          Wajib
        </Badge>
      ) : (
        <span className="text-xs text-slate-400">Opsional</span>
      ),
    headClassName: "w-24 text-center",
    cellClassName: "text-center",
    hideOnCard: true,
  },
  {
    key: "kondisi",
    header: "Kondisi",
    render: (row) => (
      <Badge variant={kondisiVariant[row.kondisi]} className="text-xs">
        {row.kondisi}
      </Badge>
    ),
    headClassName: "w-40 text-center",
    cellClassName: "text-center",
    hideOnCard: true,
  },
  {
    key: "keterangan",
    header: "Keterangan",
    render: (row) => row.keterangan || "-",
    cellClassName: "text-xs text-slate-600",
  },
];

/**
 * Rincian item checklist. Di layar kecil otomatis berubah menjadi kartu;
 * menekan kartu membuka panel berisi seluruh detail item.
 */
export default function RincianItemTable({ items }: { items: ItemChecklist[] }) {
  const data: BarisItem[] = items.map((item, i) => ({ ...item, no: i + 1 }));

  return (
    <ResponsiveTable
      data={data}
      getKey={(row) => row.no}
      cardTitle={(row) => row.label}
      cardSubtitle={(row) => row.keterangan || "-"}
      cardBadge={(row) => (
        <Badge variant={kondisiVariant[row.kondisi]} className="text-xs">
          {row.kondisi}
        </Badge>
      )}
      cardPreviewCount={0}
      detailLabel="Lihat detail item"
      emptyMessage="Belum ada item checklist."
      fields={FIELDS}
    />
  );
}