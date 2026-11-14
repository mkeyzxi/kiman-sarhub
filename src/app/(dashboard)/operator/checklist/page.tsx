"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  RefreshCw,
  PenLine,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import {
  checklistTemplates,
  countItemKritis,
  getUserById,
  labelModelAset,
  type ChecklistHarian,
} from "@/components/shared/mock-data";
import {
  beritaAcaraByChecklist,
  useBeritaAcara,
} from "@/components/shared/berita-acara-store";
import { cn } from "@/lib/utils";
import { useSesiUser } from "@/components/shared/use-session";
import { useChecklistsCombined, hapusChecklist } from "@/components/shared/checklist-store";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  useAsets,
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
    <div className="sm:p-2 sm:rounded-sm sm:bg-slate-50">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary-light text-primary font-semibold flex items-center justify-center text-sm">
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
          )} >
          {card.labelTahap}
        </span>
      </div>

      {/* Aset yang dimonitor */}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-1.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs text-slate-400 font-mono">{card.aset.kode}</span>
          <span className="text-sm text-slate-700 truncate" title={card.aset.nama}>
            {card.aset.nama}
          </span>
          {labelModelAset(card.aset) && (
            <span className="text-xs text-slate-400 truncate hidden sm:inline">
              · {labelModelAset(card.aset)}
            </span>
          )}
        </div>
        <Badge variant={card.aset.status === "Rusak Ringan" ? "warning" : card.aset.status === "Rusak Berat" ? "danger" : "outline"} className="text-[10px]">
          {card.aset.status}
        </Badge>
      </div>

      {/* Progress 5 step */}
      <div className="mt-2 flex items-center gap-1.5">
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
          )}>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>Laporan</span>
        <span>Perbaikan</span>
      </div>

      {/* Tiket terkait */}
      {tiketHref && (
        <Link href={tiketHref} className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 p-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {card.tiket?.judul}
              </p>
              <p className="text-[10px] text-slate-400">Tiket {card.tiket?.id}</p>
            </div>
          </div>
          <Badge
            variant={card.tiket?.status === "Selesai" ? "success" : card.tiket?.status === "Diproses" ? "warning" : "outline"}
            className="text-[10px] shrink-0"
          >
            {card.tiket?.status}
          </Badge>
        </Link>
      )}

      {/* Status akhir */}
      <div className="mt-2 flex items-center gap-2 text-xs">
        {card.perbaikanSelesai ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700">Perbaikan selesai — siap operasional</span>
          </>
        ) : card.tiket ? (
          <>
            <Loader2 className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-amber-700">
              Perbaikan {card.tiket.status.toLowerCase()}
            </span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500">Menunggu tindak lanjut alur</span>
          </>
        )}
      </div>
    </div>
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
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4.5 w-4.5", iconColor)} />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
          {subText && <p className="text-[11px] text-slate-400">{subText}</p>}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ChecklistPerawatanPage() {
  const ses = useSesiUser();
  const bolehBuatChecklist =
    ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR";
  /** Hak kelola (hapus) checklist — khusus Admin IT. */
  const bisaKelola = ses.role === "ADMIN_IT";
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [jenisFilter, setJenisFilter] = useState("Semua");

  // Modal konfirmasi hapus + state proses (untuk mencegah klik dobel).
  const [hapusTarget, setHapusTarget] = useState<ChecklistHarian | null>(null);
  const [sedangMenghapus, setSedangMenghapus] = useState(false);
  const [pesanGagalHapus, setPesanGagalHapus] = useState<string | null>(null);
  const [pesanBerhasilHapus, setPesanBerhasilHapus] = useState<string | null>(null);

  // Debounce search query untuk performa yang lebih baik
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Data checklist: Supabase + tulisan sesi ini (in-memory), digabung.
  const { data: checklistHarianList, loading, error, refetch } =
    useChecklistsCombined();
  // Master aset — sumber "Nama Referensi" untuk tiap unit checklist.
  const asetRef = useAsets();
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

  /**
   * Peta asetId → Penanggung Jawab (NIP) — dipakai menentukan apakah user
   * login adalah PJ aset pada baris checklist ini (bisa validasi/edit).
   */
  const pjAsetByRow = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of asetRef.data) {
      if (a.penanggungJawab) map.set(a.id, a.penanggungJawab);
    }
    return map;
  }, [asetRef.data]);

  /**
   * Peta pencari "Nama Referensi" sebuah unit checklist:
   * - pakai `asetId` bila terisi (andal),
   * - fallback: cocokkan nama resmi aset (`aset.nama`) dengan field `unit`.
   */
  const referensiByUnit = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of asetRef.data) {
      const ref = (a.namaReferensi ?? "").trim();
      if (!ref || ref === a.nama) continue;
      map.set(`id:${a.id}`, ref);
      map.set(`nama:${a.nama}`, ref);
    }
    return map;
  }, [asetRef.data]);

  /** Nama referensi untuk satu baris checklist — "-" bila tidak ditemukan. */
  const referensiUntuk = (row: { asetId?: string; unit: string }): string =>
    (row.asetId ? referensiByUnit.get(`id:${row.asetId}`) : undefined) ??
    referensiByUnit.get(`nama:${row.unit}`) ??
    "-";

  // Berlangganan store berita acara: memicu hidrasi Supabase sekali per sesi
  // dan re-render setelah data database masuk — status draft selalu segar
  // tanpa useEffect + setState (pemicu "Maximum update depth exceeded").
  useBeritaAcara();

  // Filter dengan debounced search - hitung sebelum early return
  const filteredChecklist = useMemo(() => {
    return checklistHarianList.filter((item) => {
      const matchSearch =
        item.unit.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.pemeriksa.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
      const matchJenis = jenisFilter === "Semua" || item.jenisUnit === jenisFilter;
      return matchSearch && matchStatus && matchJenis;
    });
  }, [checklistHarianList, debouncedSearch, statusFilter, jenisFilter]);

  // Pagination - HARUS dipanggil sebelum conditional return
  const pagination = usePagination(filteredChecklist.length, 20);
  const paginatedChecklist = useMemo(() => {
    return filteredChecklist.slice(pagination.startIndex, pagination.endIndex);
  }, [filteredChecklist, pagination.startIndex, pagination.endIndex]);

  /**
   * Draft milik user yang sedang login — dihitung langsung saat render
   * (bukan useEffect + setState) supaya tidak memicu loop render.
   * Draft sifatnya PER PENGGUNA: hanya checklist yang menjadi tanggung jawab
   * user (pemeriksaId = NIP user login) yang dipertimbangkan, sehingga draft
   * operator lain tidak ikut tampil.
   *
   * Prioritas alur "Lanjutkan Draft":
   *  1) Checklist berstatus "Belum Lengkap" → lanjutkan isian checklist dulu
   *     (link ke halaman detail checklist). Berita acara baru sah dibuat
   *     setelah checklist lengkap, jadi jangan langsung arahkan ke BA.
   *  2) Checklist sudah Lengkap tapi punya Berita Acara draft → lanjutkan
   *     pengisian Berita Acara (link ke halaman berita-acara).
   * Fallback: jika sesi belum siap atau data belum datang, tampilkan null
   * agar button "Lanjutkan Draft" tidak muncul sewaktu-waktu.
   */
  let checklistDraf: {
    id: string;
    nama: string;
    /** true = lanjutkan isian checklist, false = lanjutkan berita-acara */
    tipeDraft: "checklist" | "berita-acara";
  } | null = null;
  // Hanya hitung draft jika user sudah login DAN daftar checklist sudah muncul
  if (ses.id && checklistHarianList.length > 0) {
    for (const ck of checklistHarianList) {
      // cek pemeriksaId (NIP operator yang buat checklist) harus sama dengan user login
      if (ck.pemeriksaId !== ses.id) continue;
      if (ck.status === "Belum Lengkap") {
        checklistDraf = { id: ck.id, nama: ck.unit, tipeDraft: "checklist" };
        break;
      }
    }
    // 2) Checklist sudah lengkap tapi masih ada draft berita acara
    if (!checklistDraf) {
      for (const ck of checklistHarianList) {
        if (ck.pemeriksaId !== ses.id) continue;
        if (ck.status !== "Lengkap") continue;
        const ba = beritaAcaraByChecklist(ck.id);
        if (ba && ba.status === "Draf") {
          checklistDraf = { id: ck.id, nama: ck.unit, tipeDraft: "berita-acara" };
          break;
        }
      }
    }
  }

  // ── Management Admin IT: hapus checklist ──────────────────────────────────
  /**
   * Eksekusi penghapusan checklist: hapus dari in-memory + Supabase (RLS
   * memastikan hanya Admin IT yang bisa), lalu segarkan daftar agar
   * statistik & tabel langsung mengikuti.
   */
  const eksekusiHapus = async () => {
    if (!hapusTarget) return;
    setSedangMenghapus(true);
    setPesanGagalHapus(null);
    try {
      const ok = await hapusChecklist(hapusTarget.id);
      if (!ok) {
        setPesanGagalHapus(
          "Penghapusan ditolak database (RLS). Pastikan Anda login sebagai Admin IT."
        );
        return;
      }
      setPesanBerhasilHapus(
        `Checklist "${hapusTarget.unit}" (${hapusTarget.tanggal}) berhasil dihapus.`
      );
      setHapusTarget(null);
      // Segarkan data Supabase agar statistik + tabel langsung terupdate.
      refetch();
    } catch (err) {
      setPesanGagalHapus(
        err instanceof Error ? err.message : "Gagal menghapus checklist."
      );
    } finally {
      setSedangMenghapus(false);
    }
  };

  // Early return SETELAH semua hooks dipanggil
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
    <div className="sm:space-y-4 sm:mb-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Checklist Perawatan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan harian dan perawatan unit SAR
          </p>
        </div>
        {!bolehBuatChecklist && (<Badge variant="outline" className="self-start">Pengisian hanya oleh operator lapangan & akun kantor</Badge>)}
        <div>
          {bolehBuatChecklist ? (
            <>
              <Link href="/operator/checklist/buat">
                <Button>
                  <Plus className="h-4 w-4" />
                  Buat Checklist
                </Button>
              </Link>
              {checklistDraf && (
                <Link
                  href={checklistDraf.tipeDraft === "checklist"
                    ? `/operator/checklist/buat?draft=${checklistDraf.id}`
                    : `/operator/checklist/${checklistDraf.id}/berita-acara`}
                >
                  <Button variant="secondary" className="ml-2">
                    {checklistDraf.tipeDraft === "checklist" ? (
                      <PencilLine className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {checklistDraf.tipeDraft === "checklist"
                      ? "Lanjutkan Pengisian Checklist"
                      : "Lanjutkan Draft Berita Acara"}
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
              Pengisian hanya oleh operator lapangan & akun kantor
            </Badge>
          )}
        </div>
      </div>

      {/* Toast hasil hapus / gagal */}
      {pesanBerhasilHapus && (
        <div
          role="status"
          className="sm:rounded-lg sm:border sm:border-emerald-200 sm:bg-emerald-50 p-3 text-sm font-medium text-emerald-700"
        >
          <p>{pesanBerhasilHapus}</p>
          <button
            type="button"
            onClick={() => setPesanBerhasilHapus(null)}
            className="sm:text-emerald-600 hover:text-emerald-800 sm:ml-3"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}
      {pesanGagalHapus && (
        <div
          role="alert"
          className="sm:rounded-lg sm:border sm:border-red-200 sm:bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <p>{pesanGagalHapus}</p>
          <button
            type="button"
            onClick={() => setPesanGagalHapus(null)}
            className="sm:text-red-600 hover:text-red-800 sm:ml-3"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="sm:grid sm:grid-cols-3 gap-3 grid grid-cols-1">
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
      <div className="sm:space-y-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="sm:text-sm font-semibold text-slate-800">
            Monitor Alur Kerusakan Kendaraan
          </h2>
          <div className="flex items-center gap-2">
            {kartuSaya.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {kartuSaya.length} alur milik Anda terpantau
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => carduPJ.refetchKartu()}
              disabled={carduPJ.loading}
              className="h-8 px-2 text-xs sm:h-6 sm:px-2"
            >
              <RefreshCw className={cn("mr-1 h-3 w-2.5", carduPJ.loading && "animate-spin")} />
              Muat ulang
            </Button>
          </div>
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
          <div className="sm:p-2 sm:rounded-sm sm:bg-slate-50">
            <p className="text-sm text-slate-500">
              Belum ada alur kerusakan atas nama Anda — semua aset yang Anda
              tanggung jawabkan dalam kondisi siap operasional.
            </p>
          </div>
        ) : (
          <div className="sm:grid sm:grid-cols-2 sm:grid-cols-3 gap-3 grid grid-cols-1">
            {kartuSaya.map((card) => (
              <KartuPJItem key={card.nip} card={card} />
            ))}
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="sm:px-2 pt-2 pb-3 border-t sm:border-t-sm sm:border-slate-200">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari unit atau pemeriksa..."
              className="pl-7"
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
      </div>

      {/* Tabel Checklist - flat layout */}
      <div className="sm:px-2">
        <ResponsiveTable
          data={paginatedChecklist}
          getKey={(row) => row.id}
          cardTitle={(row) => (
            <span className="block">
              {row.unit}
              {referensiUntuk(row) !== "-" && (
                <span className="mt-0.5 block text-xs font-normal text-slate-400">
                  {referensiUntuk(row)}
                </span>
              )}
            </span>
          )}
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
              key: "unit",
              header: "Unit",
              render: (row) => (
                <div className="flex items-center gap-2">
                  {row.jenisUnit === "Kapal" && <Ship className="h-3 w-3 text-blue-500" />}
                  {row.jenisUnit === "Mobil" && <Car className="h-3 w-3 text-emerald-500" />}
                  {row.jenisUnit === "Motor" && <Bike className="h-3 w-3 text-orange-500" />}
                  {row.jenisUnit === "Perahu" && <Package className="h-3 w-3 text-amber-500" />}
                  <span className="font-medium text-slate-800">{row.unit}</span>
                </div>
              ),
              hideOnCard: true,
            },
            {
              key: "namaReferensi",
              header: "Nama Referensi",
              render: (row) => {
                const ref = referensiUntuk(row);
                return (
                  <span className={cn("whitespace-nowrap", ref === "-" ? "text-slate-300" : "text-slate-700")}>
                    {ref}
                  </span>
                );
              },
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
              render: (row) => (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-700">
                    {getUserById(row.pemeriksa)?.nama ?? row.pemeriksa}
                  </span>
                  {row.asetId && pjAsetByRow.get(row.asetId) === ses.nip && row.pemeriksaId !== ses.nip && (
                    <Badge
                      variant="outline"
                      className="mt-0.5 w-fit border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700"
                    >
                      Dipantau sebagai PJ
                    </Badge>
                  )}
                </div>
              ),
              cellClassName: "text-slate-700",
            },
            {
              key: "progress",
              header: "Progress",
              render: (row) => (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
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
              render: (row) => (
                <div
                  className="flex items-center justify-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/operator/checklist/${row.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Lihat detail checklist ${row.unit}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {/* Aksi edit — untuk operator/akuntor pemilik checklist,
                      atau penanggung jawab aset terkait (validasi & koreksi). */}
                  {(ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR") &&
                    (row.pemeriksaId === ses.nip ||
                      (row.asetId && pjAsetByRow.get(row.asetId) === ses.nip)) && (
                      <Link
                        href={`/operator/checklist/${row.id}/edit`}
                        className="relative/group/edit"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                          aria-label={`Edit checklist ${row.unit}`}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                        {row.pemeriksaId !== ses.nip && row.asetId && (
                          <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] text-white sm:hover/sm:block group-hover/edit:block">
                            Validasi (PJ aset)
                          </span>
                        )}
                      </Link>
                    )}
                  {/* Aksi hapus — khusus Admin IT (management data). */}
                  {bisaKelola && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:bg-red-50"
                      aria-label={`Hapus checklist ${row.unit}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPesanGagalHapus(null);
                        setHapusTarget(row);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ),
              headClassName: "text-center",
              hideBelowLg: true,
            },
          ]}
          onRowClick={(row) => router.push(`/operator/checklist/${row.id}`)}
        />

        {/* Pagination Controls */}
        {filteredChecklist.length > 0 && (
          <div className="sm:px-2 pt-3">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              startItem={pagination.startItem}
              endItem={pagination.endItem}
              hasPrevious={pagination.hasPrevious}
              hasNext={pagination.hasNext}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Template Checklist */}
      <div className="sm:px-2 pt-3 border-t sm:border-t-sm sm:border-slate-200">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Template Checklist Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {checklistTemplates.map((template) => (
                <div key={template.id} className="sm:p-2 sm:rounded-sm sm:border sm:border-slate-200 sm:hover:sm:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="sm:text-sm font-medium text-slate-800">{template.nama}</h3>
                    <Badge variant="outline" className="sm:text-[10px]">{template.kategori}</Badge>
                  </div>
                  <p className="sm:text-xs text-slate-500 mb-2">
                    {template.items.length} item · {template.periode}
                    {countItemKritis(template.id) > 0 && (
                      <> · {countItemKritis(template.id)} kritis</>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href="/operator/checklist" className="sm:flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-2.5 w-2.5 mr-1" />
                        Lihat
                      </Button>
                    </Link>
                    <Link href="/operator/checklist/buat" className="sm:flex-1">
                      <Button size="sm" className="w-full">
                        Gunakan
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 sm:flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <PencilLine className="mt-0.5 h-2.5 w-2 shrink-0 text-slate-500" />
              <p className="sm:text-xs text-slate-600">
                Peralatan <strong>Medis</strong> dan <strong>Komunikasi</strong>{" "}belum memiliki form template dari kantor. Pemeriksa menulis sendiri item yang diperiksa pada mode{" "}<strong>Input Manual</strong> saat membuat checklist.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Modal konfirmasi hapus (management Admin IT) ─────────────────── */}
      {hapusTarget && (
        <div className="sm:fixed inset-0 sm:z-50 sm:flex sm:items-center sm:justify-center bg-black/50 sm:p-4">
          <Card className="sm:w-full sm:max-w-md sm:p-6">
            <div className="mb-3 sm:flex sm:items-center gap-3">
              <div className="sm:flex sm:size-9 items-center justify-center rounded-sm sm:bg-red-100">
                <Trash2 className="sm:h-4 sm:w-4 sm:text-red-600" />
              </div>
              <div>
                <h3 className="sm.font-semibold text-slate-800">
                  Hapus Checklist Perawatan
                </h3>
                <p className="sm.text-sm sm:text-slate-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <div className="mb-5 sm:rounded-sm sm:border sm:border-slate-200 sm:bg-slate-50 sm:p-3 text-sm">
              <div className="sm:flex sm-items-center sm-justify-between">
                <span className="sm:text-slate-500">Unit</span>
                <span className="sm.font-medium text-slate-800">
                  {hapusTarget.unit}
                </span>
              </div>
              <div className="sm:flex sm-items-center sm-justify-between">
                <span className="sm:text-slate-500">Tanggal</span>
                <span className="sm.font-medium text-slate-800">
                  {hapusTarget.tanggal}
                </span>
              </div>
              <div className="sm:flex sm-items-center sm-justify-between">
                <span className="sm:text-slate-500">Pemeriksa</span>
                <span className="sm.font-medium text-slate-800">
                  {getUserById(hapusTarget.pemeriksa)?.nama ?? hapusTarget.pemeriksa}
                </span>
              </div>
              <div className="sm:flex sm-items-center sm-justify-between">
                <span className="sm:text-slate-500">Progress</span>
                <span className="sm.font-medium text-slate-800">
                  {hapusTarget.itemChecked}/{hapusTarget.itemTotal}
                </span>
              </div>
              <div className="sm:flex sm-items-center sm-justify-between">
                <span className="sm:text-slate-500">Status</span>
                <Badge
                  variant={hapusTarget.status === "Lengkap" ? "success" : "warning"}
                >
                  {hapusTarget.status}
                </Badge>
              </div>
            </div>
            <p className="sm:text-sm sm:text-slate-600">
              Checklist ini akan dihapus dari database. Gunakan bila data
              tercatat keliru (salah input / duplikat).
            </p>
            <div className="sm:flex sm-justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setHapusTarget(null)}
                disabled={sedangMenghapus}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={eksekusiHapus}
                disabled={sedangMenghapus}
              >
                <Trash2 className="sm:h-3.5 sm:w-3.5" />
                {sedangMenghapus ? "Menghapus..." : "Hapus Checklist"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}