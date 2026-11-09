"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ship,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Wrench,
  Bike,
  Car,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BAGIAN_TEMPLATE,
  STATUS_ASET_VARIANT,
  formatEndurance,
  formatMenit,
  labelModelAset,
  type Aset,
} from "@/components/shared/mock-data";
import { beritaAcaraByAset } from "@/components/shared/berita-acara-store";
import {
  useAsets,
  useLogbooks,
  useChecklists,
  useChecklistTemplates,
  usePengisianBBM,
  useCatatanPerbaikan,
} from "@/components/shared/use-supabase-data";
import type {
  AsetMapped,
  CatatanPerbaikanMapped,
  ChecklistMapped,
  ChecklistTemplateMapped,
  LogbookMapped,
  PengisianBbmMapped,
} from "@/components/shared/supabase-mock-mapper";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  ResponsiveTable,
  type ResponsiveField,
} from "@/components/shared/responsive-table";

// ─── Helper dasar ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

/**
 * Tautan ke master data detail aset (/bmn/<id>) — tampil di setiap
 * kendaraan pada dashboard. Semua role bisa MEMBUKA (lihat saja);
 * mengedit master data hanya PENGELOLA_BMN / ADMIN_IT.
 */
function DetailAsetLink({ id, label = "Detail Aset" }: { id: string; label?: string }) {
  return (
    <Link
      href={`/bmn/${id}`}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
      title="Buka detail master data aset"
    >
      <ExternalLink className="h-3 w-3" />
      {label}
    </Link>
  );
}

/** Badge kondisi untuk item ceklist: Baik / Rusak Ringan / Rusak Berat. */
function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "Baik"
      ? "success"
      : status === "Rusak Ringan"
        ? "warning"
        : status === "Rusak Berat"
          ? "danger"
          : "outline";
  return (
    <Badge variant={variant} className="text-xs">
      {status}
    </Badge>
  );
}

/** Badge status aset dari master data (Standby / Sedang digunakan / …). */
function BadgeStatusAset({ status }: { status: string }) {
  const variant = STATUS_ASET_VARIANT[status as keyof typeof STATUS_ASET_VARIANT] ?? "outline";
  return (
    <Badge variant={variant} className="text-xs">
      {status}
    </Badge>
  );
}

/** Nama tampilan unit: nama aset + merk·tipe, no. polisi dalam kurung. */
function namaUnit(aset: AsetMapped): string {
  const inti = [aset.nama, labelModelAset(aset)].filter(Boolean).join(" · ");
  return aset.noPolisi ? `${inti} (${aset.noPolisi})` : inti;
}

/**
 * Nama panggilan unit — mudah dikenali orang awam: nama referensi
 * ("mobil dinas kakansar", "motor tempel") bila terisi di database;
 * bila kosong, jatuh ke nama aset resmi.
 */
function namaPanggilan(aset: AsetMapped): string {
  return aset.namaReferensi?.trim() || aset.nama;
}

/** Tahun pengadaan unit dari tanggal perolehan. */
function tahunUnit(aset: AsetMapped): string {
  return aset.tanggalPerolehan ? aset.tanggalPerolehan.slice(0, 4) : "-";
}

/** "45312" → "45.312"; teks lain ditampilkan apa adanya. */
function formatAngka(nilai?: string): string {
  if (!nilai) return "-";
  return /^\d+$/.test(nilai) ? Number(nilai).toLocaleString("id-ID") : nilai;
}

/** "08:00" → menit; null bila tidak bisa dibaca. */
function jamKeMenit(jam?: string | null): number | null {
  if (!jam) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(jam.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Durasi perjalanan dari jam berangkat → kembali, mis. "2 Jam 30 Menit". */
function durasiPerjalanan(berangkat?: string | null, kembali?: string | null): string {
  const a = jamKeMenit(berangkat);
  const b = jamKeMenit(kembali);
  if (a === null || b === null || b < a) return "-";
  return formatMenit(b - a);
}

/** Pecah "Kantor - Desa Binanga" → { dari, ke }. */
function pecahRute(rute: string): { dari: string; ke: string } {
  const bag = rute.split(" - ").map((b) => b.trim());
  return { dari: bag[0] || rute, ke: bag.length > 1 ? bag[bag.length - 1] : "-" };
}

function urutkanPerjalanan(trips: LogbookMapped[]): LogbookMapped[] {
  return [...trips].sort((a, b) => {
    return (
      b.tanggal.localeCompare(a.tanggal) ||
      (b.jamBerangkat || "").localeCompare(a.jamBerangkat || "")
    );
  });
}

/**
 * Cocokkan catatan logbook_perjalanan dengan sebuah aset master:
 * - darat  → kategori sama + no. polisi muncul di `jenis_unit`
 * - RIB    → kategori_unit "RIB" + merk unit muncul di `jenis_unit`
 * - kapal  → kategori_unit "Kapal" + nama aset muncul di `jenis_unit`
 */
function perjalananUnit(logs: LogbookMapped[], aset: AsetMapped): LogbookMapped[] {
  if (aset.kategori === "Mobil" || aset.kategori === "Motor") {
    return logs.filter(
      (l) =>
        l.kategoriUnit === aset.kategori &&
        !!aset.noPolisi &&
        l.jenisUnit.includes(aset.noPolisi)
    );
  }
  if (aset.kategori === "Kapal") {
    if (aset.nama.toLowerCase().includes("rib")) {
      return logs.filter(
        (l) => l.kategoriUnit === "RIB" && !!aset.merk && l.jenisUnit.includes(aset.merk)
      );
    }
    return logs.filter(
      (l) => l.kategoriUnit === "Kapal" && l.jenisUnit.includes(aset.nama)
    );
  }
  return [];
}

// ─── Item ceklist dari instance checklist_harian (JSONB) ─────────────────────

type ItemCeklist = {
  label: string;
  wajib: boolean;
  kondisi: string;
  keterangan: string;
  kategori?: string;
};

/** Baca array `items` JSONB instance checklist → bentuk aman untuk render. */
function bacaItemsCek(instance?: ChecklistMapped): ItemCeklist[] {
  const mentah = instance?.items;
  if (!Array.isArray(mentah)) return [];
  return (mentah as Record<string, unknown>[])
    .filter((i) => typeof i.label === "string")
    .map((i) => ({
      label: String(i.label),
      wajib: i.wajib !== false,
      kondisi: typeof i.kondisi === "string" && i.kondisi ? i.kondisi : "Belum Diperiksa",
      keterangan: typeof i.keterangan === "string" ? i.keterangan : "",
      kategori: typeof i.kategori === "string" && i.kategori ? i.kategori : undefined,
    }));
}

type KelompokBagian = { nama: string; items: ItemCeklist[] };

/**
 * Kelompokkan item calendar instance ke bagian form fisik.
 * 1) kalau item punya `kategori` (dari seed) → pakai itu;
 * 2) kalau tidak → ikuti urutan template lewat `BAGIAN_TEMPLATE`;
 * 3) kalau dua di atas kosong → satu grup dengan nama template.
 */
function kelompokkanItems(
  instance: ChecklistMapped | undefined,
  template: ChecklistTemplateMapped | undefined
): KelompokBagian[] {
  const semua = bacaItemsCek(instance);
  if (semua.length === 0) return [];

  if (semua.some((i) => i.kategori)) {
    const urutan: string[] = [];
    const byKategori = new Map<string, ItemCeklist[]>();
    for (const i of semua) {
      const k = i.kategori ?? "Lainnya";
      if (!byKategori.has(k)) {
        byKategori.set(k, []);
        urutan.push(k);
      }
      byKategori.get(k)!.push(i);
    }
    return urutan.map((nama) => ({ nama, items: byKategori.get(nama)! }));
  }

  const bagian = template ? BAGIAN_TEMPLATE[template.id] : undefined;
  if (bagian) {
    let dari = 0;
    return bagian.map((b) => {
      const items = semua.slice(dari, b.upto);
      dari = b.upto;
      return { nama: b.nama, items };
    });
  }

  return [{ nama: template?.nama ?? "Item Pemeriksaan", items: semua }];
}

/** Item pemeliharaan RIB = item template ke-8 s/d 24 (di luar pemanasan/jam/BBM). */
function itemPemeliharaanRIB(
  instance: ChecklistMapped | undefined,
  template: ChecklistTemplateMapped | undefined
): ItemCeklist[] {
  if (!template) return [];
  const semua = bacaItemsCek(instance);
  const semuaPemeliharaan = template.items.slice(7);
  return semuaPemeliharaan.map((lbl) => {
    const ketemu = semua.find((i) => i.label === lbl.label);
    return {
      label: lbl.label,
      wajib: lbl.wajib,
      kondisi: ketemu?.kondisi ?? "Belum Diperiksa",
      keterangan: ketemu?.keterangan ?? "",
    };
  });
}

// ─── Data Kondisi Armada (turunan dari master aset) ─────────────────────────
// Sumber tunggal: useAsets (Supabase). Status "Standby" = siap operasional,
// status "Sedang digunakan" = unit sedang dipakai (logbook berjalan).

type UnitArmada = {
  id: string;
  /** Nama panggilan — mudah dikenali orang awam (nama referensi). */
  nama: string;
  /** Nama teknis resmi dari master BMN; tidak tampil bila sama dgn `nama`. */
  namaTeknis: string;
  status: string;
  kondisi: string;
  lokasi: string;
  rusak: boolean;
};

type JenisArmadaDashboard = "darat" | "air";

/** Susun daftar unit armada dengan status live dari master aset. */
function susunUnitArmada(
  jenis: JenisArmadaDashboard,
  asets: Aset[]
): UnitArmada[] {
  return asets
    .filter((a) =>
      jenis === "darat"
        ? a.kategori === "Mobil" || a.kategori === "Motor"
        : a.kategori === "Kapal"
    )
    .map((aset) => ({
      id: aset.id,
      nama: namaPanggilan(aset),
      namaTeknis: namaUnit(aset),
      status: aset.status,
      kondisi: aset.kondisi,
      lokasi: aset.lokasi,
      rusak:
        aset.kondisi !== "Baik" ||
        aset.status === "Rusak Berat" ||
        aset.status === "Rusak Ringan",
    }));
}

/** Catatan terakhir pada riwayat aset (paling baru). */
function keteranganTerakhir(aset: Aset): string {
  if (aset.riwayat.length === 0) return "-";
  let terbaru = aset.riwayat[0];
  for (const r of aset.riwayat) {
    if (r.tanggal >= terbaru.tanggal) terbaru = r;
  }
  return terbaru.keterangan;
}

/** Berita acara terakhir milik sebuah aset (bila ada). */
function beritaAcaraAset(asetId: string) {
  return beritaAcaraByAset(asetId)[0];
}

/**
 * Kartu kondisi armada: unit dikelompokkan Standby / Sedang digunakan /
 * Tidak Standby — langsung dari status master aset di database.
 */
function KondisiArmadaCard({
  judul,
  icon: Icon,
  iconBg,
  iconColor,
  units,
  subtitle,
}: {
  judul: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  units: UnitArmada[];
  subtitle?: string;
}) {
  const standby = units.filter((u) => u.status === "Standby");
  const dipakai = units.filter((u) => u.status === "Sedang digunakan");
  const tidakStandby = units.filter(
    (u) => u.status !== "Standby" && u.status !== "Sedang digunakan"
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </span>
            {judul}
          </CardTitle>
          <Badge variant="success" className="text-xs">
            {standby.length}/{units.length} standby
          </Badge>
        </div>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unit standby */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Siap / Standby
          </p>
          {standby.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada unit yang standby.</p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {standby.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/bmn/${u.id}`}
                      className="inline-flex items-center gap-1 font-medium text-slate-700 transition-colors hover:text-sky-700 hover:underline"
                      title="Buka detail master data aset"
                    >
                      {u.nama}
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </Link>
                    {u.namaTeknis !== u.nama && (
                      <span className="block truncate text-xs text-slate-400">
                        {u.namaTeknis}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{u.lokasi}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unit sedang dipakai */}
        {dipakai.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-600">
              <Clock className="h-3.5 w-3.5" />
              Sedang Digunakan
            </p>
            <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {dipakai.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/bmn/${u.id}`}
                      className="inline-flex items-center gap-1 font-medium text-slate-700 transition-colors hover:text-sky-700 hover:underline"
                      title="Buka detail master data aset"
                    >
                      {u.nama}
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </Link>
                    {u.namaTeknis !== u.nama && (
                      <span className="block truncate text-xs text-slate-400">
                        {u.namaTeknis}
                      </span>
                    )}
                  </div>
                  <Badge variant="default" className="shrink-0 text-xs">
                    Sedang digunakan
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unit tidak standby */}
        {tidakStandby.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <Wrench className="h-3.5 w-3.5" />
              Tidak Standby
            </p>
            <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {tidakStandby.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/bmn/${u.id}`}
                      className="inline-flex items-center gap-1 font-medium text-slate-700 transition-colors hover:text-sky-700 hover:underline"
                      title="Buka detail master data aset"
                    >
                      {u.nama}
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </Link>
                    {u.namaTeknis !== u.nama && (
                      <span className="block truncate text-xs text-slate-400">
                        {u.namaTeknis}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={STATUS_ASET_VARIANT[u.status as keyof typeof STATUS_ASET_VARIANT] ?? "outline"}
                    className="shrink-0 text-xs"
                  >
                    {u.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Field tabel ceklist ─────────────────────────────────────────────────────

const CEKLIST_FIELDS: ResponsiveField<ItemCeklist>[] = [
  {
    key: "label",
    header: "Item Pemeriksaan",
    render: (row) => row.label,
    cellClassName: "text-slate-700",
    hideOnCard: true,
  },
  {
    key: "kondisi",
    header: "Kondisi",
    render: (row) => <StatusBadge status={row.kondisi} />,
    headClassName: "w-28 text-center",
    cellClassName: "text-center",
  },
  {
    key: "keterangan",
    header: "Keterangan",
    render: (row) => row.keterangan || "-",
    cellClassName: "text-slate-600 text-xs",
    hideBelowLg: true,
  },
];

// ─── Kartu: Jurnal RIB ───────────────────────────────────────────────────────

function KartuJurnalRIBUnit({
  aset,
  template,
  instance,
  trips,
  pengisian,
}: {
  aset: AsetMapped;
  template?: ChecklistTemplateMapped;
  instance?: ChecklistMapped;
  trips: LogbookMapped[];
  pengisian: PengisianBbmMapped[];
}) {
  const tripSelesai = urutkanPerjalanan(trips).filter((t) => t.status === "Selesai");
  const tripInfo = tripSelesai[0];
  const pemeliharaan = itemPemeliharaanRIB(instance, template);
  const pengisianTerakhir = pengisian[0];

  const barisPengisian = [
    { no: 1, label: "Sisa Kemarin", liter: "-", persen: pengisianTerakhir?.sisaSebelum ?? "-" },
    { no: 2, label: "Penambahan", liter: pengisianTerakhir?.penambahan ?? "-", persen: "-" },
    { no: 3, label: "Saldo Akhir", liter: "-", persen: pengisianTerakhir?.saldoAkhir ?? "-" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-primary" />
            Jurnal {namaPanggilan(aset)}
          </CardTitle>
          <div className="flex items-center gap-3">
            <DetailAsetLink id={aset.id} />
            <BadgeStatusAset status={aset.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info RIB */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-500">Jenis Unit</p>
            <p className="font-medium text-slate-800">{namaUnit(aset)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Tahun Pengadaan</p>
            <p className="font-medium text-slate-800">{tahunUnit(aset)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Sisa Endurance</p>
            <p className="font-medium text-slate-800">
              {tripInfo ? formatEndurance(tripInfo.enduranceAkhir ?? tripInfo.enduranceAwal) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Waktu Operasi Terakhir</p>
            <p className="font-medium text-slate-800">
              {tripInfo ? durasiPerjalanan(tripInfo.jamBerangkat, tripInfo.jamKembali) : "-"}
            </p>
          </div>
        </div>

        {/* A. Pemeliharaan — dari instance checklist arm-rib-pemeliharaan */}
        <div>
          <SectionTitle>
            <ClipboardCheck className="h-5 w-5 text-primary" />
            A. Pemeliharaan
          </SectionTitle>
          <ResponsiveTable
            data={pemeliharaan}
            getKey={(item) => item.label}
            cardTitle={(item) => item.label}
            cardBadge={(item) => <StatusBadge status={item.kondisi} />}
            cardPreviewCount={0}
            detailLabel="Lihat detail pengecekan"
            emptyMessage="Belum ada data pengecekan — buat checklist RIB di menu Ceklist Harian."
            fields={CEKLIST_FIELDS}
          />
        </div>

        {/* B. Pemanasan Mesin dan Pengoperasian Alut — dari logbook_perjalanan */}
        <div>
          <SectionTitle>
            <Clock className="h-5 w-5 text-primary" />
            B. Pemanasan Mesin dan Pengoperasian Alut
          </SectionTitle>
          <ResponsiveTable
            data={urutkanPerjalanan(trips).slice(0, 3)}
            getKey={(item) => item.id}
            cardTitle={(item) => item.tujuan || item.rute}
            cardSubtitle={(row) => `${row.jamBerangkat || "–"} - ${row.jamKembali || "–"}`}
            cardPreviewCount={2}
            detailLabel="Lihat detail pemanasan"
            emptyMessage="Belum ada data pemanasan."
            fields={[
              {
                key: "tujuan",
                header: "Kegiatan",
                render: (item) => item.tujuan || "Pengoperasian alut",
                cellClassName: "text-slate-700",
                hideOnCard: true,
              },
              {
                key: "waktu",
                header: "Waktu",
                render: (item) =>
                  item.jamKembali
                    ? durasiPerjalanan(item.jamBerangkat, item.jamKembali)
                    : item.status === "Sedang Digunakan"
                      ? "Berlangsung"
                      : "-",
                headClassName: "w-24",
                cellClassName: "text-slate-600",
              },
              {
                key: "rute",
                header: "Tujuan (Rute)",
                render: (item) => item.rute,
                cellClassName: "text-slate-600",
              },
              {
                key: "berangkat",
                header: "Berangkat",
                render: (item) => item.jamBerangkat || "-",
                headClassName: "w-20",
                cellClassName: "font-mono text-sm",
              },
              {
                key: "kembali",
                header: "Kembali",
                render: (item) => item.jamKembali || "-",
                headClassName: "w-20",
                cellClassName: "font-mono text-sm",
              },
              {
                key: "keterangan",
                header: "Keterangan",
                render: (item) => item.catatan || "-",
                cellClassName: "text-slate-600 text-xs",
                hideBelowLg: true,
              },
            ]}
          />
        </div>

        {/* C. Pengisian BBM — dari tabel pengisian_bbm (unit ber-roda "RIB 02") */}
        {pengisian.length > 0 && (
          <div>
            <SectionTitle>
              <Wrench className="h-5 w-5 text-primary" />
              C. Pengisian BBM
            </SectionTitle>
            <ResponsiveTable
              data={barisPengisian}
              getKey={(item) => item.no}
              cardTitle={(item) => item.label}
              cardBadge={(item) => (
                <Badge
                  variant={item.label === "Saldo Akhir" ? "primary" : "outline"}
                  className="text-xs"
                >
                  {item.persen !== "-" ? item.persen : item.liter}
                </Badge>
              )}
              cardPreviewCount={1}
              detailLabel="Lihat detail pengisian"
              fields={[
                {
                  key: "label",
                  header: "Pengisian BBM",
                  render: (item) => item.label,
                  cellClassName: "text-slate-700",
                  hideOnCard: true,
                },
                {
                  key: "liter",
                  header: "Liter",
                  render: (item) => item.liter,
                  headClassName: "w-24 text-center",
                  cellClassName: "text-center",
                },
                {
                  key: "persen",
                  header: "Persen (%)",
                  render: (item) => item.persen,
                  headClassName: "w-24 text-center",
                  cellClassName: "text-center",
                },
              ]}
            />
            {pengisianTerakhir?.keterangan && (
              <p className="mt-2 text-xs text-slate-500">{pengisianTerakhir.keterangan}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Kartu: Logbook Kapal ────────────────────────────────────────────────────

function KartuLogbookKapal({
  aset,
  instance,
  trips,
}: {
  aset: AsetMapped;
  instance?: ChecklistMapped;
  trips: LogbookMapped[];
}) {
  const semua = urutkanPerjalanan(trips);
  const tripSelesai = semua.filter((t) => t.status === "Selesai");
  const tripInfo = tripSelesai[0];

  const ceklistItems = bacaItemsCek(instance);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-primary" />
            Logbook Harian {namaPanggilan(aset)}
          </CardTitle>
          <div className="flex items-center gap-3">
            <DetailAsetLink id={aset.id} />
            <BadgeStatusAset status={aset.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* I. Informasi Operasional Kapal */}
        <div>
          <SectionTitle>
            <Ship className="h-5 w-5 text-primary" />
            I. Informasi Operasional Kapal
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500">Nama Kapal</p>
              <p className="font-medium text-slate-800">{aset.nama}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">No. Lambung</p>
              <p className="font-medium text-slate-800">{aset.noPolisi ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tanggal</p>
              <p className="font-medium text-slate-800">{tripInfo?.tanggal ?? instance?.tanggal ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">BBM</p>
              <p className="font-medium text-slate-800">
                {tripInfo?.bbmSesudah ?? tripInfo?.bbmSebelum ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Endurance</p>
              <p className="font-medium text-slate-800">
                {tripInfo ? formatEndurance(tripInfo.enduranceAkhir ?? tripInfo.enduranceAwal) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Kecepatan Rata-rata</p>
              <p className="font-medium text-slate-800">{tripInfo?.kecepatanRata ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pangkalan</p>
              <p className="font-medium text-slate-800">{aset.lokasi || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Running Hours</p>
              {/* Belum ada kolom running hours di database — tampilkan "-" */}
              <p className="font-medium text-slate-800">-</p>
            </div>
          </div>
        </div>

        {/* II. Ceklist Harian Kapal — instance arm-kapalar-harian */}
        <div>
          <SectionTitle>
            <ClipboardCheck className="h-5 w-5 text-primary" />
            II. Ceklist Harian Kapal
          </SectionTitle>
          <ResponsiveTable
            data={ceklistItems}
            getKey={(item) => item.label}
            cardTitle={(item) => item.label}
            cardSubtitle={(item) => item.keterangan || "-"}
            cardBadge={(item) => <StatusBadge status={item.kondisi} />}
            cardPreviewCount={0}
            detailLabel="Lihat detail ceklist"
            emptyMessage="Belum ada ceklist kapal — buat checklist di menu Ceklist Harian."
            fields={[
              {
                key: "label",
                header: "Item Pemeriksaan",
                render: (item) => item.label,
                cellClassName: "text-slate-700",
              },
              {
                key: "kondisi",
                header: "Kondisi",
                render: (item) => <StatusBadge status={item.kondisi} />,
                headClassName: "w-28 text-center",
                cellClassName: "text-center",
              },
              {
                key: "keterangan",
                header: "Keterangan",
                render: (item) => item.keterangan || "-",
                cellClassName: "text-slate-600 text-xs",
                hideBelowLg: true,
              },
            ]}
          />
        </div>

        {/* III. Jurnal Olah Gerak Harian — dari logbook_perjalanan */}
        <div>
          <SectionTitle>
            <FileText className="h-5 w-5 text-primary" />
            III. Jurnal Olah Gerak Harian
          </SectionTitle>
          <ResponsiveTable
            data={semua}
            getKey={(item) => item.id}
            cardTitle={(item) => item.rute}
            cardSubtitle={(row) => `${row.jamBerangkat || "–"} - ${row.jamKembali || "–"}`}
            cardPreviewCount={4}
            detailLabel="Lihat detail perjalanan"
            emptyMessage="Belum ada jurnal olah gerak."
            fields={[
              {
                key: "tanggal",
                header: "Tanggal",
                render: (item) => item.tanggal,
                cellClassName: "text-slate-600 text-xs",
                hideBelowXl: true,
              },
              {
                key: "jamStart",
                header: "Jam Start",
                render: (item) => item.jamBerangkat || "-",
                cellClassName: "font-mono text-sm",
                hideOnCard: true,
              },
              {
                key: "jamStop",
                header: "Jam Stop",
                render: (item) => item.jamKembali || "-",
                cellClassName: "font-mono text-sm",
                hideOnCard: true,
              },
              {
                key: "rute",
                header: "Rute / Lokasi Patroli",
                render: (item) => item.rute,
                cellClassName: "text-slate-700",
                hideOnCard: true,
              },
              {
                key: "kecepatan",
                header: "Kecepatan",
                render: (item) => item.kecepatanRata ?? "-",
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "endurance",
                header: "Sisa Endurance",
                render: (item) =>
                  item.enduranceAkhir ? formatEndurance(item.enduranceAkhir) : "-",
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "bbm",
                header: "Sisa BBM",
                render: (item) =>
                  item.bbmSesudah ?? (item.status === "Sedang Digunakan" ? `${item.bbmSebelum} (belum kembali)` : "-"),
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "nahkoda",
                header: "Nahkoda",
                render: (item) => item.nahkoda,
                cellClassName: "text-slate-700",
              },
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Kartu: Logbook Sarana Darat (Mobil / Motor) ─────────────────────────────

function KartuLogbookDarat({
  aset,
  trips,
  catatanPerbaikan,
  instances,
  templateById,
}: {
  aset: AsetMapped;
  trips: LogbookMapped[];
  catatanPerbaikan: CatatanPerbaikanMapped[];
  instances: ChecklistMapped[];
  templateById: Map<string, ChecklistTemplateMapped>;
}) {
  const semua = urutkanPerjalanan(trips);
  const tripSelesai = semua.filter((t) => t.status === "Selesai");
  const tripInfo = tripSelesai[0];
  const kmTerakhir =
    tripInfo?.kmSesudah ?? tripInfo?.kmSebelum ?? semua[0]?.kmSebelum ?? undefined;
  const bbmTerakhir =
    semua[0]?.bbmSesudah ?? semua[0]?.bbmSebelum ?? undefined;

  const instancesAset = instances.filter((c) => c.asetId === aset.id);
  const instanceHarian = instancesAset.find((c) => templateById.get(c.templateId ?? "")?.periode === "Harian");
  const instanceMingguan = instancesAset.find((c) => templateById.get(c.templateId ?? "")?.periode === "Mingguan");
  const instanceBulanan = instancesAset.find((c) => templateById.get(c.templateId ?? "")?.periode === "Bulanan");

  const itemTambahan = instancesAset
    .flatMap((c) => bacaItemsCek(c))
    .filter((i) => i.kategori === "Item Tambahan");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {aset.kategori === "Mobil" ? (
              <Car className="h-5 w-5 text-primary" />
            ) : (
              <Bike className="h-5 w-5 text-primary" />
            )}
            Logbook {namaPanggilan(aset)}
          </CardTitle>
          <div className="flex items-center gap-3">
            <DetailAsetLink id={aset.id} />
            <BadgeStatusAset status={aset.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* I. Informasi Kendaraan */}
        <div>
          <SectionTitle>
            {aset.kategori === "Mobil" ? (
              <Car className="h-5 w-5 text-primary" />
            ) : (
              <Bike className="h-5 w-5 text-primary" />
            )}
            I. Informasi Kendaraan
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500">Jenis Kendaraan</p>
              <p className="font-medium text-slate-800">{aset.nama}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">No. Polisi</p>
              <p className="font-medium text-slate-800">{aset.noPolisi ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tahun Pengadaan</p>
              <p className="font-medium text-slate-800">{tahunUnit(aset)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Merk / Tipe</p>
              <p className="font-medium text-slate-800">{labelModelAset(aset) || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Kilometer (KM)</p>
              <p className="font-medium text-slate-800">{formatAngka(kmTerakhir)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">BBM</p>
              <p className="font-medium text-slate-800">{bbmTerakhir ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* II. Riwayat Penggunaan — dari logbook_perjalanan */}
        <div>
          <SectionTitle>
            <FileText className="h-5 w-5 text-primary" />
            II. Riwayat Penggunaan
          </SectionTitle>
          <ResponsiveTable
            data={semua}
            getKey={(item) => item.id}
            cardTitle={(item) => {
              const r = pecahRute(item.rute);
              return `${r.dari} \u2192 ${r.ke}`;
            }}
            cardSubtitle={(item) => item.tanggal}
            cardPreviewCount={4}
            detailLabel="Lihat detail perjalanan"
            emptyMessage="Belum ada riwayat penggunaan."
            fields={[
              {
                key: "tanggal",
                header: "Tanggal",
                render: (item) => item.tanggal,
                cellClassName: "text-slate-700",
              },
              {
                key: "dari",
                header: "Dari",
                render: (item) => pecahRute(item.rute).dari,
                cellClassName: "text-slate-700",
                hideOnCard: true,
              },
              {
                key: "ke",
                header: "Ke",
                render: (item) => pecahRute(item.rute).ke,
                cellClassName: "text-slate-700",
                hideOnCard: true,
              },
              {
                key: "bbmSebelum",
                header: "BBM Sebelum",
                render: (item) => item.bbmSebelum || "-",
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "bbmSesudah",
                header: "BBM Sesudah",
                render: (item) => item.bbmSesudah || "-",
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "kmSebelum",
                header: "KM Sebelum",
                render: (item) => formatAngka(item.kmSebelum),
                headClassName: "text-center",
                cellClassName: "text-center font-mono text-sm",
              },
              {
                key: "kmSesudah",
                header: "KM Sesudah",
                render: (item) => formatAngka(item.kmSesudah),
                headClassName: "text-center",
                cellClassName: "text-center font-mono text-sm",
              },
              {
                key: "catatan",
                header: "Catatan",
                render: (item) => item.catatan || "-",
                cellClassName: "text-slate-600",
                hideBelowLg: true,
              },
            ]}
          />
        </div>

        {/* III. Catatan Penggantian, Perbaikan, dan Overhaul — dari catatan_perbaikan */}
        <div>
          <SectionTitle>
            <Wrench className="h-5 w-5 text-primary" />
            III. Catatan Penggantian, Perbaikan, dan Overhaul
          </SectionTitle>
          <ResponsiveTable
            data={catatanPerbaikan.filter((c) => c.asetId === aset.id)}
            getKey={(item) => item.id}
            cardTitle={(item) => item.detailPekerjaan}
            cardSubtitle={(item) => item.tanggal}
            cardPreviewCount={1}
            detailLabel="Lihat detail pekerjaan"
            emptyMessage="Belum ada catatan perbaikan."
            fields={[
              {
                key: "tanggal",
                header: "Tanggal",
                render: (item) => item.tanggal,
                cellClassName: "text-slate-700",
                hideOnCard: true,
              },
              {
                key: "detailPekerjaan",
                header: "Detail Pelaksanaan Pekerjaan",
                render: (item) => item.detailPekerjaan,
                cellClassName: "text-slate-700",
                hideOnCard: true,
              },
              {
                key: "pelaksana",
                header: "Pelaksana",
                render: (item) => item.pelaksana || "-",
                cellClassName: "text-slate-600",
              },
            ]}
          />
        </div>

        {/* IV. Ceklist Perawatan Harian — instance per periode Harian */}
        <div>
          <SectionTitle>
            <ClipboardCheck className="h-5 w-5 text-primary" />
            IV. Ceklist Perawatan Harian
          </SectionTitle>
          {instanceHarian ? (
            <div className="space-y-4">
              {kelompokkanItems(instanceHarian, templateById.get(instanceHarian.templateId ?? "")).map(
                (kelompok) => (
                  <div key={kelompok.nama}>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">{kelompok.nama}</h3>
                    <ResponsiveTable
                      data={kelompok.items}
                      getKey={(item) => kelompok.nama + item.label}
                      cardTitle={(item) => item.label}
                      cardBadge={(item) => <StatusBadge status={item.kondisi} />}
                      cardPreviewCount={0}
                      detailLabel="Lihat detail item"
                      emptyMessage="Belum ada item pemeriksaan."
                      fields={CEKLIST_FIELDS}
                    />
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Belum ada checklist harian untuk unit ini.</p>
          )}
        </div>

        {/* V. Ceklist Perawatan Mingguan & Bulanan */}
        <div>
          <SectionTitle>
            <ClipboardCheck className="h-5 w-5 text-primary" />
            V. Ceklist Perawatan Mingguan &amp; Bulanan
          </SectionTitle>
          {[instanceMingguan, instanceBulanan].every((i) => !i) ? (
            <p className="text-sm text-slate-400">
              Belum ada checklist mingguan/bulanan untuk unit ini.
            </p>
          ) : (
            <div className="space-y-4">
              {[instanceMingguan, instanceBulanan].map((instance) =>
                instance
                  ? kelompokkanItems(instance, templateById.get(instance.templateId ?? "")).map(
                      (kelompok) => (
                        <div key={`${instance.id}-${kelompok.nama}`}>
                          <h3 className="text-sm font-semibold text-slate-700 mb-2">
                            {kelompok.nama}
                          </h3>
                          <ResponsiveTable
                            data={kelompok.items}
                            getKey={(item) => instance.id + kelompok.nama + item.label}
                            cardTitle={(item) => item.label}
                            cardBadge={(item) => <StatusBadge status={item.kondisi} />}
                            cardPreviewCount={0}
                            detailLabel="Lihat detail item"
                            emptyMessage="Belum ada item pemeriksaan."
                            fields={CEKLIST_FIELDS}
                          />
                        </div>
                      )
                    )
                  : null
              )}
            </div>
          )}
        </div>

        {/* VI. Item Tambahan (Jika Ada) */}
        <div>
          <SectionTitle>
            <Wrench className="h-5 w-5 text-primary" />
            VI. Item Tambahan (Jika Ada)
          </SectionTitle>
          <ResponsiveTable
            data={itemTambahan}
            getKey={(item) => item.label}
            cardTitle={(item) => item.label}
            cardBadge={(item) => <StatusBadge status={item.kondisi} />}
            cardPreviewCount={0}
            detailLabel="Lihat detail item"
            emptyMessage="Tidak ada item tambahan."
            fields={CEKLIST_FIELDS}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function OperatorPage() {
  const [activeTab, setActiveTab] = useState<"rib" | "kapal" | "mobil" | "motor">("rib");
  const [armadaFilter, setArmadaFilter] = useState<"Semua" | "Mobil" | "Motor" | "Kapal">("Semua");

  // Data hidup dari Supabase.
  const asetQuery = useAsets();
  const logbookQuery = useLogbooks();
  const ceklistQuery = useChecklists();
  const templateQuery = useChecklistTemplates();
  const pengisianQuery = usePengisianBBM();
  const perbaikanQuery = useCatatanPerbaikan();

  const loading =
    asetQuery.loading ||
    logbookQuery.loading ||
    ceklistQuery.loading ||
    templateQuery.loading ||
    pengisianQuery.loading ||
    perbaikanQuery.loading;
  const error =
    asetQuery.error ??
    logbookQuery.error ??
    ceklistQuery.error ??
    templateQuery.error ??
    pengisianQuery.error ??
    perbaikanQuery.error;

  const refetchSemua = () => {
    asetQuery.refetch();
    logbookQuery.refetch();
    ceklistQuery.refetch();
    templateQuery.refetch();
    pengisianQuery.refetch();
    perbaikanQuery.refetch();
  };

  if (loading) {
    return <DataLoading label="Memuat dashboard operasional…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetchSemua}
        label="Gagal memuat data dari database"
      />
    );
  }

  const asetList = asetQuery.data;
  const templateById = new Map(
    templateQuery.data.map((t) => [t.id as string, t] as const)
  );

  // ── Status live dari master aset ──────────────────────────────────────────
  // Dihitung saat render supaya keputusan Pengelola BMN (setujui → aset
  // "Maintenance", tolak → aset tetap "Rusak") langsung tercermin di sini.
  const unitDarat = susunUnitArmada("darat", asetList);
  const unitAir = susunUnitArmada("air", asetList);

  /** Unit yang perlu perhatian: aset rusak atau sudah dikirim ke service. */
  const unitPerluPerawatan = asetList
    .filter((aset) => {
      if (aset.kondisi !== "Baik") return true;
      if (aset.status === "Rusak Berat" || aset.status === "Rusak Ringan")
        return true;
      // Maintenance karena berita acara disetujui → menunggu service.
      const ba = beritaAcaraAset(aset.id);
      return aset.status === "Maintenance" && ba?.status === "Disetujui";
    })
    .map((aset) => {
      const ba = beritaAcaraAset(aset.id);
      const keterangan =
        ba?.status === "Disetujui"
          ? `Berita acara disetujui — ${ba.keterangan || "dikirim ke tempat service"}`
          : keteranganTerakhir(aset);
      return {
        id: aset.id,
        nama: namaPanggilan(aset),
        namaTeknis: aset.nama,
        kondisi: aset.status,
        keterangan,
      };
    });

  const unitPunyaData = (aset: AsetMapped): boolean =>
    perjalananUnit(logbookQuery.data, aset).length > 0 ||
    ceklistQuery.data.some((c) => c.asetId === aset.id) ||
    pengisianQuery.data.some((p) => p.asetId === aset.id);

  /** Unit yang tampil di sebuah tab: harus punya data logbook/ceklist/BBM. */
  function unitsTab(jenis: "rib" | "kapal" | "mobil" | "motor"): AsetMapped[] {
    return asetList.filter((aset) => {
      if (jenis === "mobil" || jenis === "motor") {
        if (aset.kategori !== (jenis === "mobil" ? "Mobil" : "Motor")) return false;
      } else if (aset.kategori !== "Kapal") {
        return false;
      } else if (jenis === "rib" && !aset.nama.toLowerCase().includes("rib")) {
        return false;
      } else if (jenis === "kapal" && !aset.nama.toLowerCase().includes("kapal")) {
        return false;
      }
      return unitPunyaData(aset);
    });
  }

  const templatesFor = (instance?: ChecklistMapped) =>
    instance ? templateById.get(instance.templateId ?? "") : undefined;

  // `armada` menentukan tab mana yang terlihat untuk tiap jenis armada
  const tabs = [
    { id: "rib" as const, label: "Jurnal RIB", icon: Ship, armada: ["Kapal"] },
    { id: "kapal" as const, label: "Logbook Kapal", icon: ClipboardCheck, armada: ["Kapal"] },
    { id: "mobil" as const, label: "Logbook Mobil", icon: Car, armada: ["Mobil"] },
    { id: "motor" as const, label: "Logbook Motor", icon: Bike, armada: ["Motor"] },
  ];

  const visibleTabs = tabs.filter(
    (tab) => armadaFilter === "Semua" || tab.armada.includes(armadaFilter)
  );

  // Jika filter armada menyembunyikan tab yang sedang aktif, tampilkan tab
  // valid pertama tanpa memicu setState di dalam render.
  const tabAktif = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? "rib");

  // Blok ringkas "Pengisian BBM Terakhir — RIB 02".
  const asetRIB02 = asetList.find((a) => a.noPolisi === "RIB 02");
  const daftarPengisianRIB02 = asetRIB02
    ? pengisianQuery.data.filter((p) => p.asetId === asetRIB02.id)
    : [];
  const pengisianRIB02 = daftarPengisianRIB02[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Operasional</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor kondisi armada &amp; logbook kapal dan sarana darat
        </p>
      </div>

      {/* Kondisi Armada — kartu ringkas + rincian unit */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(armadaFilter === "Semua" || armadaFilter === "Mobil" || armadaFilter === "Motor") && (
          <KondisiArmadaCard
            judul="Kendaraan Darat (Mobil & Motor)"
            icon={armadaFilter === "Motor" ? Bike : Car}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            units={unitDarat}
            subtitle="Siap operasional & kondisi saat ini"
          />
        )}
        {(armadaFilter === "Semua" || armadaFilter === "Kapal") && (
          <KondisiArmadaCard
            judul="Armada Air (RIB & Perahu Karet)"
            icon={Ship}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            units={unitAir}
            subtitle="RIB 9M & 12M + mesin outboard"
          />
        )}
      </div>

      {/* Perlu Perawatan — aset rusak/maintenance dari status master DB */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <Wrench className="h-5 w-5 text-amber-600" />
            </span>
            Perlu Perawatan
            <Badge variant="warning" className="ml-auto text-xs">
              {unitPerluPerawatan.length} unit
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unitPerluPerawatan.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    <Link
                      href={`/bmn/${u.id}`}
                      className="inline-flex items-center gap-1 transition-colors hover:text-sky-700 hover:underline"
                      title="Buka detail master data aset"
                    >
                      {u.nama}
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </Link>
                  </p>
                  {u.namaTeknis !== u.nama && (
                    <p className="text-xs text-slate-400">{u.namaTeknis}</p>
                  )}
                  <p className="text-xs text-slate-500">{u.keterangan}</p>
                </div>
                <Badge
                  variant={u.kondisi === "Rusak Berat" ? "danger" : "warning"}
                  className="text-xs"
                >
                  {u.kondisi}
                </Badge>
              </div>
            ))}
            {unitPerluPerawatan.length === 0 && (
              <p className="text-sm text-slate-400">
                Semua unit dalam kondisi baik.
              </p>
            )}
          </div>

          {/* Pengisian BBM terakhir (RIB 02) — dari tabel pengisian_bbm */}
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
            <p className="mb-2 font-medium text-slate-700">
              Pengisian BBM Terakhir{asetRIB02 ? ` — ${asetRIB02.noPolisi}` : ""}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-2 text-center border border-slate-200">
                <p className="text-xs text-slate-500">Sisa Kemarin</p>
                <p className="font-semibold text-slate-800">
                  {pengisianRIB02?.sisaSebelum ?? "-"}
                </p>
              </div>
              <div className="rounded-lg bg-white p-2 text-center border border-slate-200">
                <p className="text-xs text-slate-500">Penambahan</p>
                <p className="font-semibold text-slate-800">
                  {pengisianRIB02?.penambahan ?? "-"}
                </p>
              </div>
              <div className="rounded-lg bg-white p-2 text-center border border-slate-200">
                <p className="text-xs text-slate-500">Saldo Akhir</p>
                <p className="font-semibold text-slate-800">
                  {pengisianRIB02?.saldoAkhir ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Armada */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Filter Armada:</span>
        <div className="flex flex-wrap gap-1">
          {(["Semua", "Mobil", "Motor", "Kapal"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setArmadaFilter(filter)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                armadaFilter === filter
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs — difilter berdasarkan armada yang dipilih */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tabAktif === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Empty state — armada tidak punya jurnal */}
      {unitsTab(tabAktif).length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500">
            Belum ada data logbook/ceklist untuk armada{" "}
            {armadaFilter === "Semua" ? "ini" : armadaFilter} di database.
          </p>
        </Card>
      )}

      {/* Tab Content */}
      {tabAktif === "rib" && (
        <div className="space-y-6">
          {unitsTab("rib").map((aset) => {
            const trips = urutkanPerjalanan(perjalananUnit(logbookQuery.data, aset));
            const instance = ceklistQuery.data.find((c) => c.asetId === aset.id);
            const pengisian = pengisianQuery.data.filter((p) => p.asetId === aset.id);
            return (
              <KartuJurnalRIBUnit
                key={aset.id}
                aset={aset}
                template={templatesFor(instance)}
                instance={instance}
                trips={trips}
                pengisian={pengisian}
              />
            );
          })}
        </div>
      )}

      {tabAktif === "kapal" && (
        <div className="space-y-6">
          {unitsTab("kapal").map((aset) => {
            const trips = urutkanPerjalanan(perjalananUnit(logbookQuery.data, aset));
            const instance = ceklistQuery.data.find((c) => c.asetId === aset.id);
            return (
              <KartuLogbookKapal
                key={aset.id}
                aset={aset}
                instance={instance}
                trips={trips}
              />
            );
          })}
        </div>
      )}

      {(tabAktif === "mobil" || tabAktif === "motor") && (
        <div className="space-y-6">
          {unitsTab(tabAktif).map((aset) => (
            <KartuLogbookDarat
              key={aset.id}
              aset={aset}
              trips={perjalananUnit(logbookQuery.data, aset)}
              catatanPerbaikan={perbaikanQuery.data}
              instances={ceklistQuery.data}
              templateById={templateById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
