"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Ship,
  Package,
  Car,
  Bike,
  PencilLine,
  Wrench,
  Loader2,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import {
  checklistTemplates,
  countItemKritis,
  getUserById,
  labelModelAset,
} from "@/components/shared/mock-data";
import {
  beritaAcaraByChecklist,
  useBeritaAcara,
} from "@/components/shared/berita-acara-store";
import { cn } from "@/lib/utils";
import { useSesiUser } from "@/components/shared/use-session";
import { useChecklistsCombined } from "@/components/shared/checklist-store";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  useKartuPenanggungJawab,
  labelTahap,
  type KartuPJ,
} from "@/components/shared/use-supabase-data";

// ─── Kartu Penanggung Jawab (monitor alur kerusakan) ─────────────────────────
function KartuPJItem({ card }: { card: KartuPJ }) {
  const warnaBadge: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  const inisial = card.nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  // Tahap alur: 0→4, 5 dot (0 = titik abu).
  const totalTahap = 5;
  const tercapai = card.tahap; // 0..4 — "tahap berjalan / selesai"
  const tiketHref = card.tiket ? `/bmn/maintenance/${card.tiket.id}` : null;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-primary-light text-primary font-semibold flex items-center justify-center text-sm">
            {inisial || "?"}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{card.nama}</p>
          <p className="text-xs text-slate-500">NIP {card.nip}</p>
        </div>
        <span
          className={cn(
            "text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap",
            warnaBadge[card.warnaTahap]
          )}
        >
          {card.labelTahap}
        </span>
      </div>

      {/* Aset yang dimonitor */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-400 font-mono">{card.aset.kode}</span>
          <span className="text-sm text-slate-700 truncate" title={card.aset.nama}>
            {card.aset.nama}
          </span>
          {labelModelAset(card.aset) && (
            <span className="text-xs text-slate-400 truncate hidden xl:inline">
              · {labelModelAset(card.aset)}
            </span>
          )}
        </div>
        <Badge variant={card.aset.status === "Rusak Ringan" ? "warning" : card.aset.status === "Rusak Berat" ? "danger" : "outline"} className="text-[10px]">
          {card.aset.status}
        </Badge>
      </div>

      {/* Progress 5 step */}
      <div className="mt-3 flex items-center gap-1.5">
        {Array.from({ length: totalTahap }).map((_, i) => (
          <div
            key={i}
            title={labelTahap[i]}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i <= tercapai
                ? card.warnaTahap === "emerald"
                  ? "bg-emerald-500"
                  : card.warnaTahap === "amber"
                  ? "bg-amber-500"
                  : "bg-blue-500"
                : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>Laporan</span>
        <span>Perbaikan</span>
      </div>

      {/* Tiket terkait */}
      {tiketHref && (
        <Link href={tiketHref} className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 p-2.5 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <Wrench className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {card.tiket?.judul}
              </p>
              <p className="text-[10px] text-slate-400">Tiket {card.tiket?.id}</p>
            </div>
          </div>
          <Badge
            variant={
              card.tiket?.status === "Selesai"
                ? "success"
                : card.tiket?.status === "Diproses"
                ? "warning"
                : "outline"
            }
            className="text-[10px] shrink-0"
          >
            {card.tiket?.status}
          </Badge>
        </Link>
      )}

      {/* Status akhir */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {card.perbaikanSelesai ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700">Perbaikan selesai — siap operasional</span>
          </>
        ) : card.tiket ? (
          <>
            <Loader2 className="h-4 w-4 text-amber-600" />
            <span className="text-amber-700">
              Perbaikan {card.tiket.status.toLowerCase()}
            </span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Menunggu tindak lanjut alur</span>
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Data Checklist Perawatan ────────────────────────────────────────────────
// ─── Komponen ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, subText }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subText?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {subText && <p className="text-xs text-slate-400">{subText}</p>}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ChecklistPerawatanPage() {
  const ses = useSesiUser();
  const bolehBuatChecklist = ses.role === "OPERATOR_LAPANGAN";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [jenisFilter, setJenisFilter] = useState("Semua");
  // Data checklist: Supabase + tulisan sesi ini (in-memory), digabung.
  const { data: checklistHarianList, loading, error, refetch } =
    useChecklistsCombined();
  // Kartu monitor alur kerusakan per penanggung jawab (independen dari gate
  // loading checklist supaya tetap tampil saat data checklist sudah siap).
  const carduPJ = useKartuPenanggungJawab();
  /**
   * Kartu alur milik user yang sedang login — hook `useKartuPenanggungJawab`
   * mengambil data SEMUA penanggung jawab (dipakai juga halaman lain), jadi
   * di halaman operator disaring: hanya kartu dengan NIP = NIP user login.
   * Tanpa filter ini, operator melihat alur kerusakan operator lain
   * (mis. Adriansyah melihat kartu atas nama Fajar Farial).
   */
  const kartuSaya = useMemo(
    () =>
      ses.id
        ? carduPJ.data.filter((card) => card.nip === ses.id)
        : [],
    [carduPJ.data, ses.id]
  );

  // Berlangganan store berita acara: memicu hidrasi Supabase sekali per sesi
  // dan re-render setelah data database masuk — status draft selalu segar
  // tanpa useEffect + setState (pemicu "Maximum update depth exceeded").
  useBeritaAcara();

  /**
   * Draft Berita Acara milik user yang sedang login — dihitung langsung saat
   * render (bukan useEffect + setState) supaya tidak memicu loop render.
   * Draft sifatnya PER PENGGUNA: hanya checklist yang menjadi tanggung jawab
   * user (pemeriksaId = NIP user login) yang dipertimbangkan, sehingga draft
   * operator lain tidak ikut tampil.
   * Fallback: jika sesi belum siap atau data belum datang, tampilkan null
   * agar button "Lanjutkan Draft" tidak muncul sewaktu-waktu.
   */
  let checklistDraf: { id: string; nama: string } | null = null;
  // Hanya hitung draft jika user sudah login DAN daftar checklist sudah muncul
  if (ses.id && checklistHarianList.length > 0) {
    for (const ck of checklistHarianList) {
      // cek pemeriksaId (NIP operator yang buat checklist) harus sama dengan user login
      if (ck.pemeriksaId !== ses.id) continue;
      const ba = beritaAcaraByChecklist(ck.id);
      if (ba && ba.status === "Draf") {
        checklistDraf = { id: ck.id, nama: ck.unit };
        break;
      }
    }
  }

  if (loading) {
    return <DataLoading label="Memuat daftar checklist harian…" />;
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

  const filteredChecklist = checklistHarianList.filter((item) => {
    const matchSearch =
      item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pemeriksa.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
    const matchJenis = jenisFilter === "Semua" || item.jenisUnit === jenisFilter;
    return matchSearch && matchStatus && matchJenis;
  });

  const totalChecklist = checklistHarianList.length;
  const checklistLengkap = checklistHarianList.filter((c) => c.status === "Lengkap").length;
  const checklistBelumLengkap = checklistHarianList.filter((c) => c.status === "Belum Lengkap").length;
  // "Minggu ini" dihitung nyata dari database: sejak Senin pekan berjalan.
  const sekarang = new Date();
  const geserKeSenin = (sekarang.getDay() + 6) % 7; // Senin = 0 … Minggu = 6
  const hariSenin = new Date(sekarang);
  hariSenin.setDate(hariSenin.getDate() - geserKeSenin);
  const awalMinggu = hariSenin.toISOString().slice(0, 10);
  const checklistMingguIni = checklistHarianList.filter(
    (c) => c.tanggal && c.tanggal >= awalMinggu
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Checklist Perawatan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pemeriksaan harian dan perawatan unit SAR
          </p>
        </div>
        {bolehBuatChecklist ? (
          <>
            <Link href="/operator/checklist/buat">
              <Button>
                <Plus className="h-4 w-4" />
                Buat Checklist
              </Button>
            </Link>
            {checklistDraf && (
              <Link href={`/operator/checklist/${checklistDraf.id}/berita-acara`}>
                <Button variant="secondary" className="ml-2">
                  <FileText className="h-4 w-4" />
                  Lanjutkan Draft
                </Button>
              </Link>
            )}
            {!checklistDraf && (
              <Badge variant="outline" className="ml-2 self-start text-sm">
                Belum ada draft
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="outline" className="self-start">
            Pengisian hanya oleh operator lapangan
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Checklist"
          value={totalChecklist}
          icon={ClipboardCheck}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          subText={`${checklistMingguIni} minggu ini`}
        />
        <StatCard
          label="Lengkap"
          value={checklistLengkap}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Belum Lengkap"
          value={checklistBelumLengkap}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Kartu monitor alur kerusakan — hanya milik user yang login */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Monitor Alur Kerusakan Kendaraan
          </h2>
          {kartuSaya.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {kartuSaya.length} alur milik Anda terpantau
            </Badge>
          )}
        </div>

        {carduPJ.loading ? (
          <DataLoading label="Memuat status penanggung jawab…" />
        ) : carduPJ.error ? (
          <DataError
            error={carduPJ.error}
            onRetry={carduPJ.refetch}
            label="Gagal memuat status penanggung jawab dari database"
          />
        ) : kartuSaya.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-slate-500">
              Belum ada alur kerusakan atas nama Anda — semua aset yang Anda
              tanggung jawabkan dalam kondisi siap operasional.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kartuSaya.map((card) => (
              <KartuPJItem key={card.nip} card={card} />
            ))}
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari unit atau pemeriksa..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-40"
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Kapal">Kapal</option>
            <option value="Perahu">Perahu (RIB)</option>
            <option value="Mobil">Mobil</option>
            <option value="Motor">Motor</option>
          </Select>
          <Select
            className="sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Belum Lengkap">Belum Lengkap</option>
          </Select>
        </div>
      </Card>

      {/* Tabel Checklist — otomatis menjadi kartu di layar kecil */}
      <Card>
        <CardContent className="pt-0">
          <ResponsiveTable
            data={filteredChecklist}
            getKey={(row) => row.id}
            cardTitle={(row) => row.unit}
            cardSubtitle={(row) => row.tanggal}
            cardBadge={(row) => (
              <Badge variant={row.status === "Lengkap" ? "success" : "warning"}>
                {row.status}
              </Badge>
            )}
            cardPreviewCount={2}
            detailLabel="Lihat detail checklist"
            emptyMessage="Tidak ada checklist yang ditemukan"
            fields={[
              {
                key: "tanggal",
                header: "Tanggal",
                render: (row) => row.tanggal,
                cellClassName: "text-slate-700",
              },
              {
                key: "unit",
                header: "Unit",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.jenisUnit === "Kapal" && <Ship className="h-4 w-4 text-blue-500" />}
                    {row.jenisUnit === "Mobil" && <Car className="h-4 w-4 text-emerald-500" />}
                    {row.jenisUnit === "Motor" && <Bike className="h-4 w-4 text-orange-500" />}
                    {row.jenisUnit === "Perahu" && <Package className="h-4 w-4 text-amber-500" />}
                    <span className="font-medium text-slate-800">{row.unit}</span>
                  </div>
                ),
                hideOnCard: true,
              },
              {
                key: "jenisUnit",
                header: "Jenis",
                render: (row) => (
                  <Badge variant="outline" className="text-xs">
                    {row.jenisUnit}
                  </Badge>
                ),
                hideBelowXl: true,
                hideOnCard: true,
              },
              {
                key: "pemeriksa",
                header: "Pemeriksa",
                render: (row) => getUserById(row.pemeriksa)?.nama ?? row.pemeriksa,
                cellClassName: "text-slate-700",
              },
              {
                key: "progress",
                header: "Progress",
                render: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          row.status === "Lengkap" ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${(row.itemChecked / row.itemTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {row.itemChecked}/{row.itemTotal}
                    </span>
                  </div>
                ),
                headClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={row.status === "Lengkap" ? "success" : "warning"}>
                    {row.status}
                  </Badge>
                ),
                hideOnCard: true,
              },
              {
                key: "aksi",
                header: "Aksi",
                render: () => (
                  <div className="flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ),
                headClassName: "text-center",
                hideBelowLg: true,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Template Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Template Checklist Tersedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {checklistTemplates.map((template) => (
              <div key={template.id} className="p-4 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-800">{template.nama}</h3>
                  <Badge variant="outline" className="text-xs">{template.kategori}</Badge>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {template.items.length} item pemeriksaan · {template.periode}
                  {countItemKritis(template.id) > 0 && (
                    <> · {countItemKritis(template.id)} item kritis</>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Link href="/operator/checklist" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-3 w-3 mr-1" />
                      Lihat
                    </Button>
                  </Link>
                  <Link href="/operator/checklist/buat" className="flex-1">
                    <Button size="sm" className="w-full">
                      Gunakan
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <PencilLine className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-xs text-slate-600">
              Peralatan <strong>Medis</strong> dan <strong>Komunikasi</strong>{" "}
              belum memiliki form template dari kantor. Pemeriksa menulis sendiri
              item yang diperiksa pada mode{" "}
              <strong>Input Manual</strong> saat membuat checklist.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}