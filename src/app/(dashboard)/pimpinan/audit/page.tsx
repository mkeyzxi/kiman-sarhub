"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, AlertOctagon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { DataLoading, DataError } from "@/components/shared/data-state";
import {
  useAuditKepatuhan,
  hitungRingkasanAudit,
  labelPeriode,
  type BarisAuditKepatuhan,
} from "@/components/shared/use-supabase-data";

function getSkorColor(skor: number): string {
  if (skor >= 90) return "text-emerald-600";
  if (skor >= 75) return "text-amber-600";
  return "text-rose-600";
}

function getSkorBadgeVariant(
  skor: number
): "success" | "warning" | "danger" {
  if (skor >= 90) return "success";
  if (skor >= 75) return "warning";
  return "danger";
}

interface BarisRanking extends BarisAuditKepatuhan {
  rank: number;
}

/**
 * Filter yang berasal dari kartu statistik (diklik → tabel difilter).
 *  - "semua"       → semua personel (kondisi awal / reset)
 *  - "rata-rata"   → personel dengan skor kepatuhan ≥ rata-rata
 *  - "pelanggaran" → personel yang tercatat punya pelanggaran di periode ini
 */
type FilterKartu = "semua" | "rata-rata" | "pelanggaran";

export default function AuditPage() {
  // Skor dinilai per bulan — default bulan berjalan, dan tiap tanggal 1 skor
  // mulai lagi dari 100 (recovery otomatis). Dropdown periode untuk melihat
  // bulan-bulan sebelumnya.
  const bulanSekarang = new Date().toISOString().slice(0, 7);
  const [periode, setPeriode] = useState(bulanSekarang);
  const [kategori, setKategori] = useState("Semua");
  const [cari, setCari] = useState("");
  /** Filter aktif dari kartu statistik. */
  const [filterKartu, setFilterKartu] = useState<FilterKartu>("semua");
  /** Token pemicu scroll ke tabel setelah kartu statistik diklik. */
  const [tokenScroll, setTokenScroll] = useState(0);
  
  // Debounce search
  const debouncedCari = useDebounce(cari, 300);

  const { data, loading, error, refetch, opsiPeriode } =
    useAuditKepatuhan(periode);
  const { totalPersonel, rataSkor, pelanggaranBulanIni } =
    hitungRingkasanAudit(data);

  // Filter kategori skor + pencarian nama/NIP, lalu peringkat dihitung ulang
  // untuk daftar yang tampil (urutan skor tetap dari hook).
  const kataKunci = debouncedCari.trim().toLowerCase();
  const cocokKategori = (skor: number) => {
    if (kategori === "baik") return skor >= 90;
    if (kategori === "cukup") return skor >= 75 && skor < 90;
    if (kategori === "perlu") return skor < 75;
    return true;
  };
  /**
   * Filter tambahan dari kartu statistik — berjalan berdampingan dengan
   * filter kategori skor & pencarian (filter kartu tidak menimpa keduanya).
   */
  const cocokFilterKartu = (r: BarisAuditKepatuhan): boolean => {
    if (filterKartu === "rata-rata") return r.skorKepatuhan >= rataSkor;
    if (filterKartu === "pelanggaran")
      return r.telatBulanIni + r.abaikanBulanIni > 0;
    return true;
  };
  const ranking: BarisRanking[] = data
    .filter((r) => cocokKategori(r.skorKepatuhan))
    .filter(cocokFilterKartu)
    .filter(
      (r) =>
        kataKunci === "" ||
        r.nama.toLowerCase().includes(kataKunci) ||
        r.personelId.toLowerCase().includes(kataKunci)
    )
    .map((item, i) => ({
      ...item,
      rank: i + 1,
    }));

  // Pagination - panggil sebelum early return
  const pagination = usePagination(ranking.length, 20);
  const paginatedRanking = ranking.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  const labelPelanggaran =
    periode === bulanSekarang
      ? "Pelanggaran Bulan Ini"
      : `Pelanggaran ${labelPeriode(periode)}`;

  /**
   * Klik kartu statistik → tabel difilter sesuai kartu tersebut.
   * Klik kartu yang sedang aktif → kembali ke "semua" (toggle).
   */
  const klikKartuStat = (filter: FilterKartu) => {
    setFilterKartu((f) => (f === filter ? "semua" : filter));
    // Kembali ke halaman pertama supaya hasil filter langsung terlihat
    // (bukan halaman terakhir dari daftar sebelumnya).
    pagination.goToPage(1);
    // Naikkan token scroll → efek di bawah menjalankan scroll SETELAH tabel
    // selesai di-render ulang dengan hasil filter terbaru.
    setTokenScroll((t) => t + 1);
  };

  /**
   * Scroll ke tabel kepatuhan setelah kartu statistik diklik.
   * Dipakai token (angka) alih-alih boolean supaya scroll tetap berjalan
   * walau filter tidak berubah (mis. klik "Total Personel" saat sudah
   * "semua"). Efek berjalan setelah commit render, jadi tabel sudah
   * menampilkan data terfilter saat digulir.
   */
  useEffect(() => {
    if (tokenScroll === 0) return;
    const el = document.getElementById("audit-table-target");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tokenScroll]);

  const stats: {
    label: string;
    value: number;
    icon: typeof Users;
    iconBg: string;
    iconColor: string;
    filter: FilterKartu;
  }[] = [
    {
      label: "Total Personel",
      value: totalPersonel,
      icon: Users,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
      filter: "semua",
    },
    {
      label: "Rata-rata Skor",
      value: rataSkor,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      filter: "rata-rata",
    },
    {
      label: labelPelanggaran,
      value: pelanggaranBulanIni,
      icon: AlertOctagon,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      filter: "pelanggaran",
    },
  ];

  /** Label ringkas filter kartu aktif (untuk penanda di bawah filter). */
  const labelFilterKartu: Record<FilterKartu, string> = {
    semua: "Semua personel",
    "rata-rata": `Skor ≥ rata-rata (${rataSkor})`,
    pelanggaran: "Punya pelanggaran",
  };

  // Early return setelah semua hooks
  if (loading) {
    return <DataLoading label="Memuat pemantauan kepatuhan…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat data kepatuhan dari database"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-800">Pemantauan Kepatuhan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluasi kepatuhan personel terhadap prosedur operasional SAR
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Skor dinilai per bulan — setiap tanggal 1 skor mulai lagi dari 100
          (pelanggaran bulan sebelumnya tidak terbawa ke bulan baru; yang masih
          berlangsung tetap dihitung di bulan berjalan). Aset Rusak Belum Dilaporkan = unit
          rusak masih dipegang tanpa berita acara · Checklist Belum Dilengkapi =
          pemeriksaan lewat waktunya dan masih Belum Lengkap. Semua dihitung
          otomatis dari data.
        </p>
      </div>

      {/* Stats Cards — klik = filter tabel + scroll ke hasil */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          // Kartu aktif bila filter kartu saat ini = filter kartu ini.
          const aktif = filterKartu === stat.filter;
          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => klikKartuStat(stat.filter)}
              aria-pressed={aktif}
              className={`group relative w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                // z-10 agar shadow & ring kartu yang disorot menggambar di
                // atas kartu tetangga (bg-white tetangga tidak menutupi
                // border bawahnya).
                aktif ? "z-10" : "hover:z-10"
              }`}
            >
              <Card
                className={`h-full w-full p-6 sm:p-4 transition-all ${
                  aktif
                    ? "border-primary ring-2 ring-primary shadow-md"
                    : "border-slate-200 group-hover:border-primary/60 group-hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg}`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                    <p
                      className={`text-sm ${
                        aktif ? "font-semibold text-primary" : "text-slate-500"
                      }`}
                    >
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Filter: cari personel · periode bulan · kategori skor */}
      <div className="sm:px-2 pt-2 pb-3 border-t sm:border-t-sm sm:border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau NIP personel…"
              className="pl-9"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-56"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          >
            {opsiPeriode.map((p) => (
              <option key={p} value={p}>
                {p === bulanSekarang ? "Bulan ini · " : ""}
                {labelPeriode(p)}
              </option>
            ))}
          </Select>
          <Select
            className="sm:w-56"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          >
            <option value="Semua">Semua Kategori</option>
            <option value="baik">Baik — skor 90 ke atas</option>
            <option value="cukup">Cukup — skor 75–89</option>
            <option value="perlu">Perlu Perbaikan — skor di bawah 75</option>
          </Select>
        </div>
        {/* Penanda filter kartu yang sedang aktif (diklik di kartu statistik). */}
        {filterKartu !== "semua" && (
          <p className="mt-2 text-xs text-slate-500">
            Filter kartu:{" "}
            <span className="font-semibold text-primary">
              {labelFilterKartu[filterKartu]}
            </span>{" "}
            — klik kartu statistik yang sama lagi untuk menghapus filter.
          </p>
        )}
      </div>

      {/* Compliance Table */}
      {/* id dipakai sebagai target scroll saat kartu statistik diklik.
          `scroll-mt-14 md:scroll-mt-16` menyisakan ruang untuk header
          sticky agar judul tabel tidak tertutup saat digulir. */}
      <div
        id="audit-table-target"
        className="sm:px-2 scroll-mt-14 md:scroll-mt-16"
      >
        <ResponsiveTable
          data={paginatedRanking}
          getKey={(row) => row.personelId}
          cardTitle={(row) => row.nama}
          cardSubtitle={(row) => row.jabatan}
          cardBadge={(row) => (
            <Badge variant={getSkorBadgeVariant(row.skorKepatuhan)}>
              <span className={getSkorColor(row.skorKepatuhan)}>
                Skor {row.skorKepatuhan}
              </span>
            </Badge>
          )}
          cardPreviewCount={2}
          detailLabel="Lihat detail kepatuhan"
          emptyMessage={
            data.length === 0
              ? "Belum ada data kepatuhan personel."
              : "Tidak ada personel yang cocok dengan filter."
          }
          fields={[
            {
              key: "rank",
              header: "Ranking",
              render: (row) => (
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    row.rank === 1
                      ? "bg-primary text-white"
                      : row.rank === 2
                        ? "bg-slate-200 text-slate-700"
                        : row.rank === 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {row.rank}
                </span>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "nama",
              header: "Nama",
              render: (row) => row.nama,
              cellClassName: "font-medium text-slate-800",
              hideOnCard: true,
            },
            {
              key: "jabatan",
              header: "Jabatan",
              render: (row) => <Badge variant="outline">{row.jabatan}</Badge>,
              hideOnCard: true,
            },
            {
              key: "telatKembali",
              header: "Aset Rusak Belum Dilaporkan",
              render: (row) => (
                <span
                  className={`font-medium ${
                    row.telatKembali > 0 ? "text-rose-600" : "text-slate-600"
                  }`}
                >
                  {row.telatKembali}
                </span>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "abaikanChecklist",
              header: "Checklist Belengkapi",
              render: (row) => (
                <span
                  className={`font-medium ${
                    row.abaikanChecklist > 0 ? "text-rose-600" : "text-slate-600"
                  }`}
                >
                  {row.abaikanChecklist}
                </span>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
            {
              key: "rincian",
              header: "Keterangan Pelanggaran",
              render: (row) =>
                row.rincian.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-600">
                    {row.rincian.map((teks, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertOctagon className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
                        <span>{teks}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                ),
            },
            {
              key: "skorKepatuhan",
              header: "Skor Kepatuhan",
              render: (row) => (
                <Badge variant={getSkorBadgeVariant(row.skorKepatuhan)}>
                  <span className={getSkorColor(row.skorKepatuhan)}>
                    {row.skorKepatuhan}
                  </span>
                </Badge>
              ),
              headClassName: "text-center",
              cellClassName: "text-center",
            },
          ]}
        />
        
        {/* Pagination Controls */}
        {ranking.length > 0 && (
          <div className="sm:px-2 pt-3 border-t sm:border-t-sm sm:border-slate-200">
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
    </div>
  );
}
