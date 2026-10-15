"use client";

import { Badge } from "@/components/ui/badge";
import {
  ResponsiveTable,
  type ResponsiveField,
} from "@/components/shared/responsive-table";

interface RiwayatItem {
  tanggal: string;
  aksi: string;
  keterangan: string;
  userId: string;
}

/** Baris tabel diperluas dengan nomor urut & nama pelaku (hasil lookup server). */
type BarisRiwayat = RiwayatItem & { no: number; namaPelaku: string };

const FIELDS: ResponsiveField<BarisRiwayat>[] = [
  {
    key: "tanggal",
    header: "Tanggal",
    render: (row) => row.tanggal,
    cellClassName: "text-slate-600",
  },
  {
    key: "aksi",
    header: "Aksi",
    render: (row) => <Badge variant="outline">{row.aksi}</Badge>,
    hideOnCard: true,
  },
  {
    key: "keterangan",
    header: "Keterangan",
    render: (row) => row.keterangan,
    cellClassName: "text-slate-600",
    hideOnCard: true,
  },
  {
    key: "userId",
    header: "Pelaku",
    render: (row) => row.namaPelaku,
    cellClassName: "text-slate-600",
  },
];

/**
 * Riwayat pemakaian aset. Di layar kecil otomatis berubah menjadi kartu;
 * menekan kartu membuka panel berisi seluruh detail riwayat.
 */
export default function RiwayatTable({
  items,
}: {
  items: (RiwayatItem & { namaPelaku: string })[];
}) {
  const data: BarisRiwayat[] = items.map((item, i) => ({ ...item, no: i + 1 }));

  return (
    <ResponsiveTable
      data={data}
      getKey={(row) => row.no}
      cardTitle={(row) => row.namaPelaku}
      cardSubtitle={(row) => row.tanggal}
      cardBadge={(row) => <Badge variant="outline">{row.aksi}</Badge>}
      cardPreviewCount={1}
      detailLabel="Lihat detail riwayat"
      emptyMessage="Belum ada riwayat pemakaian."
      fields={FIELDS}
    />
  );
}