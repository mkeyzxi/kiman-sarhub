"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ship,
  FileText,
  Plus,
  Search,
  Eye,
  Clock,
  Users,
  CheckCircle2,
  PencilLine,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import {
  isArmadaLaut,
  formatEndurance,
  formatMenit,
  selisihEndurance,
  selisihKm,
  cariAsetDariJenisUnit,
  type LogbookPerjalanan,
  type StatusPenggunaan,
} from "@/components/shared/mock-data";
import {
  mergeLogbooksWithSupabase,
  hapusLogbook,
} from "@/components/shared/logbook-store";
import { useAsets, useLogbooks } from "@/components/shared/use-supabase-data";
import { useSesiUser } from "@/components/shared/use-session";
import { DataLoading, DataError } from "@/components/shared/data-state";

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

/** Warna badge per status penggunaan armada. */
const statusVariant: Record<StatusPenggunaan, "success" | "warning" | "default"> = {
  Selesai: "success",
  "Sedang Digunakan": "warning",
  "Menunggu Penggunaan": "default",
  SudahDiedit: "success",
};

/** Label status untuk tampilan (SudahDiedit → "Sudah Diedit"). */
const labelStatus: Record<StatusPenggunaan, string> = {
  Selesai: "Selesai",
  "Sedang Digunakan": "Sedang Digunakan",
  "Menunggu Penggunaan": "Menunggu Penggunaan",
  SudahDiedit: "Sudah Diedit",
};

/** Badge status penggunaan — konsisten antara kartu mobile dan tabel desktop. */
function StatusBadge({ status }: { status: StatusPenggunaan }) {
  return <Badge variant={statusVariant[status]}>{labelStatus[status]}</Badge>;
}

/** Durasi tempuh sesuai jenis armadanya: jam operasi (laut) atau km (darat). */
function formatDurasiTempuh(log: LogbookPerjalanan): string {
  if (isArmadaLaut(log.kategoriUnit)) {
    const menit = selisihEndurance(log.enduranceAwal, log.enduranceAkhir);
    return menit === null ? "-" : formatMenit(menit);
  }
  const km = selisihKm(log.kmSebelum, log.kmSesudah);
  return km === null ? "-" : `${km} km`;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LogbookPerjalananPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const ses = useSesiUser();
  /** Hak kelola logbook (hapus/edit) — khusus Admin IT. */
  const bisaKelola = ses.role === "ADMIN_IT";
  /**
   * Semua role BOLEH menambah logbook perjalanan (untuk meminjam
   * kendaraan), KECUALI Akun Kantor — menunya tidak ditampilkan
   * untuk mereka (guard navigasi juga memblokir akses halamannya).
   */
  const bisaTambah = ses.role !== "AKUNTOR";
  /**
   * Operator lapangan & akun kantor bisa melengkapi logbook yang mereka
   * buat sendiri (createdBy = NIP mereka). Tombol "Lanjutkan Pengisian"
   * hanya tampil untuk pemilik.
   */
  const bisaLengkapi = (log: LogbookPerjalanan): boolean => {
    if (ses.role === "ADMIN_IT") return true;
    if (ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR") {
      // Pemilik = log.createdBy === NIP user, atau fallback: nahkoda = nama user.
      return log.createdBy === ses.nip || log.nahkoda === ses.nama;
    }
    return false;
  };

  // Modal konfirmasi hapus + state proses (untuk mencegah klik dobel).
  const [hapusTarget, setHapusTarget] = useState<LogbookPerjalanan | null>(null);
  const [sedangMenghapus, setSedangMenghapus] = useState(false);
  const [pesanGagalHapus, setPesanGagalHapus] = useState<string | null>(null);
  const [pesanBerhasilHapus, setPesanBerhasilHapus] = useState<string | null>(null);

  /** Debounce search query untuk mengurangi re-render saat mengetik */
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Data logbook dari Supabase.
  const {
    data: supabaseLogbooks,
    loading,
    error,
    refetch,
  } = useLogbooks();
  // Master aset — sumber "Nama Referensi" per unit di daftar perjalanan.
  const { data: asetList } = useAsets();

  /**
   * Cocokkan nama unit tersimpan di logbook (`jenis_unit`) kembali ke baris
   * master aset — memakai resolver yang SAMA dengan status live dashboard
   * (no. polisi → kode → nama referensi → tipe/merk → nama), sehingga nama
   * referensi yang tampil selalu sepadan dengan unit yang ditandai dipakai.
   */
  const asetDariUnit = (unitNama: string) =>
    cariAsetDariJenisUnit(unitNama, asetList);

  /** Nama referensi yang berbeda dari nama resmi — kosong bila sama/tak ada. */
  const referensiUnit = (unitNama: string): string => {
    const aset = asetDariUnit(unitNama);
    const referensi = aset?.namaReferensi?.trim() ?? "";
    return referensi && referensi !== unitNama ? referensi : "";
  };
  // Gabungkan logbook in-memory (baru disimpan sesi ini) + Supabase.
  const logbookPerjalananList = mergeLogbooksWithSupabase(
    supabaseLogbooks as unknown as LogbookPerjalanan[]
  );

  // Filter berdasarkan search query yang sudah di-debounce dan status
  const filteredLogbook = logbookPerjalananList.filter((log) => {
    const matchSearch =
      log.rute.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      log.tujuan.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      log.jenisUnit.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      log.nahkoda.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus = statusFilter === "Semua" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination untuk filtered data - HARUS dipanggil sebelum conditional return
  const pagination = usePagination(filteredLogbook.length, 20);
  const paginatedLogbook = filteredLogbook.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  const totalPerjalanan = logbookPerjalananList.length;
  const perjalananSelesai = logbookPerjalananList.filter((l) => l.status === "Selesai").length;
  const perjalananBerlangsung = logbookPerjalananList.filter((l) => l.status === "Sedang Digunakan").length;
  const menungguPenggunaan = logbookPerjalananList.filter((l) => l.status === "Menunggu Penggunaan").length;
  /**
   * Unit FISIK yang sedang keluar — hitung distinct aset hasil resolusi
   * jenis_unit, konsisten dengan kartu status di /operator, /bmn, dan
   * /pimpinan (satu unit = satu angka, bukan jumlah catatan). Dua catatan
   * berjalan untuk unit yang sama tetap berarti SATU unit keluar.
   */
  const idUnitDipakai = new Set(
    logbookPerjalananList
      .filter((l) => l.status === "Sedang Digunakan")
      .map((l) => cariAsetDariJenisUnit(l.jenisUnit, asetList)?.id)
      .filter((id): id is string => !!id)
  );
  const unitDipakai = idUnitDipakai.size;

  // ── Management Admin IT: hapus logbook ──────────────────────────────────────
  /**
   * Eksekusi penghapusan logbook: hapus dari in-memory + Supabase (RLS
   * memastikan hanya ADMIN_IT yang bisa), lalu segarkan daftar agar
   * statistik & tabel langsung mengikuti.
   */
  const eksekusiHapus = async () => {
    if (!hapusTarget) return;
    setSedangMenghapus(true);
    setPesanGagalHapus(null);
    try {
      const ok = await hapusLogbook(hapusTarget.id);
      if (!ok) {
        setPesanGagalHapus(
          "Penghapusan ditolak database (RLS). Pastikan Anda login sebagai Admin IT."
        );
        return;
      }
      setPesanBerhasilHapus(
        `Logbook "${hapusTarget.rute}" berhasil dihapus.`
      );
      setHapusTarget(null);
      // Segarkan data Supabase agar statistik + tabel langsung terupdate.
      refetch();
    } catch (err) {
      setPesanGagalHapus(
        err instanceof Error ? err.message : "Gagal menghapus logbook."
      );
    } finally {
      setSedangMenghapus(false);
    }
  };

  // Early return SETELAH semua hooks dipanggil
  if (loading) {
    return <DataLoading label="Memuat logbook perjalanan…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat logbook dari database"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Logbook Perjalanan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Catatan perjalanan operasional SAR
          </p>
        </div>
        {bisaTambah && (
          <Link href="/operator/logbook/tambah">
            <Button>
              <Plus className="h-4 w-4" />
              Tambah Logbook
            </Button>
          </Link>
        )}
      </div>

      {/* Toast hasil hapus / gagal */}
      {pesanBerhasilHapus && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700"
        >
          <p>{pesanBerhasilHapus}</p>
          <button
            type="button"
            onClick={() => setPesanBerhasilHapus(null)}
            className="text-emerald-600 hover:text-emerald-800"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}
      {pesanGagalHapus && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <p>{pesanGagalHapus}</p>
          <button
            type="button"
            onClick={() => setPesanGagalHapus(null)}
            className="text-red-600 hover:text-red-800"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Perjalanan"
          value={totalPerjalanan}
          icon={Ship}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          subText="Bulan ini"
        />
        <StatCard
          label="Menunggu Penggunaan"
          value={menungguPenggunaan}
          icon={Clock}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          label="Sedang Digunakan"
          value={unitDipakai}
          icon={Ship}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subText={
            perjalananBerlangsung !== unitDipakai
              ? `${perjalananBerlangsung} catatan berjalan`
              : undefined
          }
        />
        <StatCard
          label="Selesai"
          value={perjalananSelesai}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Search + Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari rute, tujuan, atau nahkoda..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Penggunaan">Menunggu Penggunaan</option>
            <option value="Sedang Digunakan">Sedang Digunakan</option>
            <option value="Selesai">Selesai</option>
            <option value="SudahDiedit">Sudah Diedit</option>
          </Select>
        </div>
      </Card>

      {/* Tabel Logbook — otomatis menjadi kartu di layar kecil */}
      <Card>
        <CardContent className="pt-0">
          <ResponsiveTable
            data={paginatedLogbook}
            getKey={(row) => row.id}
            cardTitle={(row) => row.rute}
            cardSubtitle={(row) => row.tujuan}
            cardBadge={(row) => <StatusBadge status={row.status} />}
            cardPreviewCount={3}
            detailLabel="Lihat detail perjalanan"
            emptyMessage="Tidak ada logbook yang ditemukan"
            fields={[
              {
                key: "tanggal",
                header: "Tanggal",
                render: (row) => row.tanggal,
                cellClassName: "text-slate-700",
              },
              {
                key: "jam",
                header: "Jam",
                render: (row) => (
                  <div className="text-sm">
                    <p className="font-mono">{row.jamBerangkat}</p>
                    {row.jamKembali && (
                      <p className="font-mono text-slate-400">{row.jamKembali}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "rute",
                header: "Rute / Tujuan",
                render: (row) => (
                  <div>
                    <p className="text-sm font-medium text-slate-800">{row.rute}</p>
                    <p className="text-xs text-slate-500">{row.tujuan}</p>
                  </div>
                ),
                hideOnCard: true,
              },
              {
                key: "jenisUnit",
                header: "Unit",
                render: (row) => (
                  <div className="min-w-0">
                    <Badge variant="outline" className="text-xs">
                      {row.jenisUnit}
                    </Badge>
                    {referensiUnit(row.jenisUnit) && (
                      <span className="mt-0.5 block text-xs font-medium text-emerald-600">
                        {referensiUnit(row.jenisUnit)}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "nahkoda",
                header: "Nahkoda",
                render: (row) => row.nahkoda,
                cellClassName: "text-slate-700",
              },
              {
                key: "jumlahPersonel",
                header: "Personel",
                render: (row) => (
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-slate-400" />
                    <span className="text-sm">{row.jumlahPersonel}</span>
                  </div>
                ),
                headClassName: "text-center",
                cellClassName: "text-center",
                hideBelowXl: true,
              },
              {
                key: "endurance",
                header: "Endurance",
                render: (row) =>
                  row.enduranceAwal === undefined ? (
                    <span className="text-xs text-slate-400">-</span>
                  ) : (
                    <div className="text-sm">
                      <p className="text-slate-700">
                        {formatEndurance(row.enduranceAwal)}
                      </p>
                      {row.enduranceAkhir ? (
                        <p className="text-slate-400">
                          {formatEndurance(row.enduranceAkhir)}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">Belum kembali</p>
                      )}
                    </div>
                  ),
                hideBelowXl: true,
              },
              {
                key: "durasi",
                header: "Durasi Tempuh",
                render: (row) => (
                  <span className="text-sm text-slate-700">
                    {formatDurasiTempuh(row)}
                  </span>
                ),
                hideBelowXl: true,
              },
              {
                key: "status",
                header: "Status Penggunaan",
                render: (row) => <StatusBadge status={row.status} />,
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
                    <Link href={`/operator/logbook/${row.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Lihat detail ${row.rute}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {row.status !== "Selesai" && row.status !== "SudahDiedit" && bisaLengkapi(row) && (
                      <Link href={`/operator/logbook/${row.id}/lengkapi`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          aria-label={`Lanjutkan pengisian ${row.rute}`}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                   
                    {bisaKelola && (
                      <>
                        <Link href={`/operator/logbook/${row.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            aria-label={`Edit logbook ${row.rute}`}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          aria-label={`Hapus logbook ${row.rute}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPesanGagalHapus(null);
                            setHapusTarget(row as LogbookPerjalanan);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {/* Aksi edit — untuk operator/akuntor pemilik logbook */}
                    {(ses.role === "OPERATOR_LAPANGAN" || ses.role === "AKUNTOR") &&
                      (row.createdBy === ses.nip || row.nahkoda === ses.nama) && (
                        <Link href={`/operator/logbook/${row.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            aria-label={`Edit logbook ${row.rute}`}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                  </div>
                ),
                headClassName: "text-center",
                hideBelowLg: true,
              },
            ]}
            onRowClick={(row) => router.push(`/operator/logbook/${row.id}`)}
          />
          
          {/* Pagination Controls */}
          {filteredLogbook.length > 0 && (
            <div className="mt-4">
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
        </CardContent>
      </Card>

      {/* Detail Logbook Terbaru */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detail Logbook Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const terbaru = logbookPerjalananList[0];
            if (!terbaru) {
              return (
                <p className="text-sm text-slate-500">
                  Belum ada catatan perjalanan.
                </p>
              );
            }
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Tanggal</p>
                    <p className="font-medium text-slate-800">
                      {terbaru.tanggal}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Jam Berangkat</p>
                    <p className="font-medium text-slate-800">
                      {terbaru.jamBerangkat || "Belum berangkat"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Jam Kembali</p>
                    <p className="font-medium text-slate-800">
                      {terbaru.jamKembali || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Unit</p>
                    <p className="font-medium text-slate-800">
                      {terbaru.jenisUnit}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-1 text-xs text-slate-500">Rute</p>
                    <p className="text-sm font-medium text-slate-800">
                      {terbaru.rute}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-1 text-xs text-slate-500">Tujuan</p>
                    <p className="text-sm font-medium text-slate-800">
                      {terbaru.tujuan}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-1 text-xs text-slate-500">Operator</p>
                    <p className="text-sm font-medium text-slate-800">
                      {terbaru.nahkoda}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="mb-1 text-xs text-slate-500">
                      Jumlah Personel
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {terbaru.jumlahPersonel} orang
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-1 text-xs text-blue-600">Catatan</p>
                  <p className="text-sm text-blue-800">
                    {terbaru.catatan || "Tidak ada catatan"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <StatusBadge status={terbaru.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/operator/logbook/${terbaru.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        Detail
                      </Button>
                    </Link>
                    {terbaru.status !== "Selesai" && (
                      <Link href={`/operator/logbook/${terbaru.id}/lengkapi`}>
                        <Button size="sm">
                          <PencilLine className="h-4 w-4" />
                          Lanjutkan Pengisian
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* ── Modal konfirmasi hapus (management Admin IT) ─────────────────── */}
      {hapusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  Hapus Logbook Perjalanan
                </h3>
                <p className="text-sm text-slate-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <div className="mb-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rute</span>
                <span className="font-medium text-slate-800">
                  {hapusTarget.rute}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Unit</span>
                <span className="font-medium text-slate-800">
                  {hapusTarget.jenisUnit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nahkoda</span>
                <span className="font-medium text-slate-800">
                  {hapusTarget.nahkoda}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={hapusTarget.status} />
              </div>
            </div>
            <p className="mb-6 text-sm text-slate-600">
              Catatan perjalanan ini akan dihapus dari database. Gunakan bila
              data tercatat keliru (salah input / duplikat).
            </p>
            <div className="flex justify-end gap-3">
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
                <Trash2 className="h-4 w-4" />
                {sedangMenghapus ? "Menghapus..." : "Hapus Logbook"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}