"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ship,
  FileText,
  ClipboardCheck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Fuel,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Data Jurnal Siaga Rutin ─────────────────────────────────────────────────
const jurnalSiagaRutin = [
  {
    no: 1,
    jam: "08:00",
    uraian: "Apel pagi shift I, briefing tugas dan tanggung jawab",
    ket: "Hadir 5 orang",
  },
  {
    no: 2,
    jam: "08:30",
    uraian: "Pengecekan kelengkapan peralatan SAR di gudang",
    ket: "Siap",
  },
  {
    no: 3,
    jam: "09:00",
    uraian: "Pengecekan kelengkapan kendaraan dan perahu karet",
    ket: "Siap",
  },
  {
    no: 4,
    jam: "10:00",
    uraian: "Koordinasi dengan Basarnas Makassar via radio",
    ket: "Normal",
  },
  {
    no: 5,
    jam: "11:00",
    uraian: "Patroli pantai sekitar Perairan Mamuju",
    ket: "Aman",
  },
  {
    no: 6,
    jam: "12:00",
    uraian: "Istirahat dan makan siang",
    ket: "-",
  },
  {
    no: 7,
    jam: "13:00",
    uraian: "Pengecekan ulang peralatan komunikasi",
    ket: "Normal",
  },
  {
    no: 8,
    jam: "14:00",
    uraian: "Laporan cuaca dari BMKG, kondisi laut normal",
    ket: "Normal",
  },
  {
    no: 9,
    jam: "15:00",
    uraian: "Maintenance ringan perahu karet Zodiac",
    ket: "Selesai",
  },
  {
    no: 10,
    jam: "16:00",
    uraian: "Koordinasi dengan Polsek setempat",
    ket: "Normal",
  },
  {
    no: 11,
    jam: "17:00",
    uraian: "Serah terima tugas shift II",
    ket: "Selesai",
  },
];

const absensiShiftI = [
  { no: 1, nama: "Siti Nurhaliza", ket: "Hadir" },
  { no: 2, nama: "Ahmad Fauzi", ket: "Hadir" },
  { no: 3, nama: "Dewi Lestari", ket: "Hadir" },
  { no: 4, nama: "Budi Santoso", ket: "Hadir" },
  { no: 5, nama: "Medlyn R. Pagali", ket: "Hadir" },
];

const absensiShiftII = [
  { no: 1, nama: "Kauluddin", ket: "Hadir" },
  { no: 2, nama: "Rizky Pratama", ket: "Hadir" },
  { no: 3, nama: "Ansaruddin", ket: "Hadir" },
  { no: 4, nama: "Dewi Lestari", ket: "Hadir" },
  { no: 5, nama: "Budi Santoso", ket: "Hadir" },
];

// ─── Data Jurnal RIB ─────────────────────────────────────────────────────────
const jurnalRIB = [
  {
    id: "rib-01",
    nama: "RIB 9 M",
    tahun: "2009",
    status: "Siaga",
    kondisi: "Baik",
    endurance: "85%",
    waktu: "2 Jam 30 Menit",
    pemanasan: [
      { no: 1, kegiatan: "Pemanasan mesin", waktu: "15 menit", rute: "Dermaga - Perairan Mamuju", berangkat: "08:00", kembali: "08:15" },
      { no: 2, kegiatan: "Uji fungsi mesin", waktu: "10 menit", rute: "Perairan Mamuju", berangkat: "08:20", kembali: "08:30" },
    ],
    pengecekan: [
      { no: 1, item: "Tali Tros", status: "Baik" },
      { no: 2, item: "Lunas", status: "Baik" },
      { no: 3, item: "Ban Pelampung", status: "Baik" },
      { no: 4, item: "Deck", status: "Baik" },
      { no: 5, item: "Transom (Stand Mesin)", status: "Baik" },
      { no: 6, item: "Starting Engine", status: "Baik" },
      { no: 7, item: "Kap Mesin Kanan", status: "Baik" },
      { no: 8, item: "Kap Mesin Kiri", status: "Baik" },
      { no: 9, item: "Kaburator", status: "Baik" },
      { no: 10, item: "Selang BBM", status: "Baik" },
      { no: 11, item: "Busi", status: "Baik" },
      { no: 12, item: "Dinamo Stater", status: "Baik" },
      { no: 13, item: "Dinamo Strom", status: "Baik" },
      { no: 14, item: "Hydraulic Mesin", status: "Baik" },
      { no: 15, item: "Aki/Baterai", status: "Baik" },
      { no: 16, item: "GPS Furuno", status: "Baik" },
      { no: 17, item: "GPS Tracking", status: "Baik" },
    ],
  },
  {
    id: "rib-02",
    nama: "RIB 12 M",
    tahun: "2021",
    status: "Siaga",
    kondisi: "Baik",
    endurance: "92%",
    waktu: "3 Jam 15 Menit",
    pemanasan: [
      { no: 1, kegiatan: "Pemanasan mesin", waktu: "20 menit", rute: "Dermaga - Perairan Mamuju", berangkat: "08:00", kembali: "08:20" },
      { no: 2, kegiatan: "Uji fungsi mesin", waktu: "15 menit", rute: "Perairan Mamuju", berangkat: "08:25", kembali: "08:40" },
    ],
    pengecekan: [
      { no: 1, item: "Tali Tros", status: "Baik" },
      { no: 2, item: "Lunas", status: "Baik" },
      { no: 3, item: "Ban Pelampung", status: "Baik" },
      { no: 4, item: "Deck", status: "Baik" },
      { no: 5, item: "Transom (Stand Mesin)", status: "Baik" },
      { no: 6, item: "Starting Engine", status: "Baik" },
      { no: 7, item: "Kap Mesin Kanan", status: "Baik" },
      { no: 8, item: "Kap Mesin Kiri", status: "Baik" },
      { no: 9, item: "Kaburator", status: "Baik" },
      { no: 10, item: "Selang BBM", status: "Baik" },
      { no: 11, item: "Busi", status: "Baik" },
      { no: 12, item: "Dinamo Stater", status: "Baik" },
      { no: 13, item: "Dinamo Strom", status: "Baik" },
      { no: 14, item: "Hydraulic Mesin", status: "Baik" },
      { no: 15, item: "Aki/Baterai", status: "Baik" },
      { no: 16, item: "GPS Furuno", status: "Baik" },
      { no: 17, item: "GPS Tracking", status: "Baik" },
    ],
  },
];

// ─── Data Logbook Kapal ──────────────────────────────────────────────────────
const logbookKapal = [
  {
    id: "log-01",
    namaKapal: "KN SAR MAMUJU 01",
    noLambung: "309",
    tanggal: "2026-10-08",
    bbm: "82.64%",
    endurance: "76 Jam",
    kecepatan: "12 Knot",
    statusSiap: "Ya",
    pangkalan: "Dermaga Mamuju",
    runningHours: "1.245 Jam",
    kamarMesin: [
      { no: 1, item: "Level Oli Mesin Utama", status: "Baik" },
      { no: 2, item: "Level Oli Genset", status: "Baik" },
      { no: 3, item: "Sistem Pendingin Air Laut & Air Tawar", status: "Baik" },
      { no: 4, item: "Level Bahan Bakar (Harian)", status: "Baik" },
      { no: 5, item: "Filter BBM & Separator", status: "Baik" },
      { no: 6, item: "Sistem Kemudi / Hydraulic Steering", status: "Baik" },
      { no: 7, item: "Pompa Bilga (Bilge Pump) & Automatic Switch", status: "Baik" },
      { no: 8, item: "Tegangan Baterai / Accu Start", status: "Baik" },
      { no: 9, item: "Kebocoran Pipa / Valve / Tetesan Oli", status: "Baik" },
    ],
    anjungan: [
      { no: 1, item: "Radar Navigasi", status: "Baik" },
      { no: 2, item: "GPS Navigasi", status: "Baik" },
      { no: 3, item: "AIS (Automatic Identification System)", status: "Baik" },
      { no: 4, item: "Radio Komunikasi VHF / HF", status: "Baik" },
      { no: 5, item: "Echo Sounder / Fishfinder", status: "Baik" },
      { no: 6, item: "Kompas Magnet / Gyro", status: "Baik" },
      { no: 7, item: "Lampu-Lampu Navigasi", status: "Baik" },
      { no: 8, item: "Lampu Sorot (Searchlight) & Sirine", status: "Baik" },
      { no: 9, item: "Wiper Kaca Anjungan", status: "Baik" },
    ],
    geladak: [
      { no: 1, item: "Life Jacket (Jaket Penolong)", status: "Baik" },
      { no: 2, item: "Life Buoy (Pelampung Penolong)", status: "Baik" },
      { no: 3, item: "Inflatable Liferaft (ILR) / Sekoci", status: "Baik" },
      { no: 4, item: "APAR / Alat Pemadam Kebakaran", status: "Baik" },
      { no: 5, item: "Pompa Pemadam Kebakaran", status: "Baik" },
      { no: 6, item: "Winch / Jangkar & Rantai", status: "Baik" },
      { no: 7, item: "Tali Temali (Mooring Line) & Fender", status: "Baik" },
      { no: 8, item: "Pintu Kedap Air / Palka", status: "Baik" },
      { no: 9, item: "Kebersihan Geladak (Deck)", status: "Baik" },
    ],
    jurnalOlahGerak: [
      { jamStart: "08:00", jamStop: "10:00", rute: "Dermaga - Perairan Mamuju", kecepatan: "12 Knot", endurance: "76 Jam", bbm: "82.64%", nahkoda: "Ansaruddin" },
      { jamStart: "10:30", jamStop: "12:30", rute: "Perairan Mamuju - Pantai Karampuang", kecepatan: "10 Knot", endurance: "74 Jam", bbm: "78.50%", nahkoda: "Siti Nurhaliza" },
    ],
  },
];

// ─── Data Logbook Sarana Darat ───────────────────────────────────────────────
const logbookDarat = [
  {
    id: "dar-01",
    jenisKendaraan: "Toyota Hilux",
    noPolisi: "DA 1234 SAR",
    tahun: "2019",
    tipe: "Double Cabin 4x4",
    km: "45.230",
    bbm: "75%",
    riwayatPenggunaan: [
      { no: 1, tanggal: "2026-10-07", dari: "Kantor", ke: "Desa Binanga", bbmSebelum: "80%", bbmSesudah: "65%", kmSebelum: "45.200", kmSesudah: "45.230", catatan: "Operasi evakuasi pasca banjir" },
      { no: 2, tanggal: "2026-10-06", dari: "Kantor", ke: "Bandara", bbmSebelum: "90%", bbmSesudah: "80%", kmSebelum: "45.150", kmSesudah: "45.200", catatan: "Antar jemput tim SAR" },
      { no: 3, tanggal: "2026-10-05", dari: "Kantor", ke: "Pelabuhan", bbmSebelum: "85%", bbmSesudah: "70%", kmSebelum: "45.100", kmSesudah: "45.150", catatan: "Patroli pantai" },
    ],
    pemeriksaanHarian: [
      { kategori: "Menjungkitkan Kabin", items: [
        { item: "Oli Mesin", status: "Baik" },
        { item: "Oli Power Steering", status: "Baik" },
        { item: "Fan Belt", status: "Baik" },
        { item: "Tutup Radiator", status: "Baik" },
      ]},
      { kategori: "Dalam Kabin", items: [
        { item: "Level Minyak Rem / Kopling", status: "Baik" },
        { item: "Radio Komunikasi", status: "Baik" },
        { item: "Seat Belt (Sabuk Pengaman)", status: "Baik" },
        { item: "Sirine & Lightbar", status: "Baik" },
        { item: "Instrumen Indikator", status: "Baik" },
        { item: "Kemudahan Start Engine", status: "Baik" },
      ]},
      { kategori: "Keliling Kendaraan", items: [
        { item: "Lampu-Lampu", status: "Baik" },
        { item: "Pegas Suspensi / Kaki-Kaki", status: "Baik" },
        { item: "Kebocoran / Tetesan Fluid", status: "Baik" },
        { item: "Kondisi Kaca-Kaca", status: "Baik" },
      ]},
      { kategori: "Roda dan Ban", items: [
        { item: "Tekanan Ban", status: "Baik" },
        { item: "Tapak dan Dinding Ban", status: "Baik" },
        { item: "Keausan Ban", status: "Baik" },
        { item: "Pemasangan Velg", status: "Baik" },
      ]},
    ],
  },
];

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OperatorPage() {
  const [activeTab, setActiveTab] = useState<"siaga" | "rib" | "kapal" | "darat">("siaga");

  const tabs = [
    { id: "siaga" as const, label: "Jurnal Siaga Rutin", icon: FileText },
    { id: "rib" as const, label: "Jurnal RIB", icon: Ship },
    { id: "kapal" as const, label: "Logbook Kapal", icon: ClipboardCheck },
    { id: "darat" as const, label: "Logbook Sarana Darat", icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Operasional</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola jurnal siaga, logbook kapal, dan sarana darat
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Personel Siaga"
          value={10}
          icon={Users}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          subText="Shift I & II"
        />
        <StatCard
          label="Kendaraan Siaga"
          value={8}
          icon={Package}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subText="Siap operasional"
        />
        <StatCard
          label="Perahu Karet"
          value={2}
          icon={Ship}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subText="RIB 9M & 12M"
        />
        <StatCard
          label="BBM Rata-rata"
          value="82%"
          icon={Fuel}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subText="Semua unit"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
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

      {/* Tab Content */}
      {activeTab === "siaga" && (
        <div className="space-y-6">
          {/* Jurnal Kegiatan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Jurnal Kegiatan Siaga Rutin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Hari/Tanggal:</span>
                    <p className="font-medium text-slate-800">Kamis, 8 Oktober 2026</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Shift:</span>
                    <p className="font-medium text-slate-800">I & II</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Lokasi:</span>
                    <p className="font-medium text-slate-800">Kantor P3KB Mamuju</p>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-20">Jam</TableHead>
                    <TableHead>Uraian Kegiatan</TableHead>
                    <TableHead className="w-32">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jurnalSiagaRutin.map((item) => (
                    <TableRow key={item.no}>
                      <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                      <TableCell className="font-mono text-sm">{item.jam}</TableCell>
                      <TableCell className="text-slate-700">{item.uraian}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.ket}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Absensi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Absensi Shift I (08.00 - 20.00 WITA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10 text-center">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="w-20 text-center">Ket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absensiShiftI.map((item) => (
                      <TableRow key={item.no}>
                        <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                        <TableCell className="font-medium text-slate-800">{item.nama}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="success" className="text-xs">{item.ket}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Absensi Shift II (20.00 - 08.00 WITA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10 text-center">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="w-20 text-center">Ket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absensiShiftII.map((item) => (
                      <TableRow key={item.no}>
                        <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                        <TableCell className="font-medium text-slate-800">{item.nama}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="success" className="text-xs">{item.ket}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Lembar Pengesahan */}
          <Card>
            <CardHeader>
              <CardTitle>Lembar Pengesahan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-slate-200 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-2">Mengetahui:</p>
                  <p className="font-medium text-slate-800">Kepala Subseksi Operasi dan Siaga</p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="font-bold text-slate-800">ASWANDI, S.E</p>
                    <p className="text-xs text-slate-500">Penata Muda TK.I (III/b)</p>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-2">Penanggung Jawab RBB</p>
                  <p className="font-medium text-slate-800">RBB 309 Mamuju</p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="font-bold text-slate-800">ARDIANSYAH</p>
                    <p className="text-xs text-slate-500">Pengatur Muda TK.I (II/a)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "rib" && (
        <div className="space-y-6">
          {jurnalRIB.map((rib) => (
            <Card key={rib.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-primary" />
                    Jurnal {rib.nama}
                  </CardTitle>
                  <Badge variant="success">{rib.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info RIB */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Jenis Unit</p>
                    <p className="font-medium text-slate-800">{rib.nama}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tahun Pembuatan</p>
                    <p className="font-medium text-slate-800">{rib.tahun}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Endurance</p>
                    <p className="font-medium text-slate-800">{rib.endurance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Waktu Operasi</p>
                    <p className="font-medium text-slate-800">{rib.waktu}</p>
                  </div>
                </div>

                {/* Tabel Pengecekan */}
                <div>
                  <SectionTitle>
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    A. Pemeliharaan
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center">No</TableHead>
                        <TableHead>Uraian Pengecekan</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rib.pengecekan.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                          <TableCell className="text-slate-700">{item.item}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="success" className="text-xs">{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Tabel Pemanasan */}
                <div>
                  <SectionTitle>
                    <Clock className="h-5 w-5 text-primary" />
                    B. Pemanasan Mesin dan Pengoperasian Alut
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center">No</TableHead>
                        <TableHead>Kegiatan Pemanasan</TableHead>
                        <TableHead className="w-24">Waktu</TableHead>
                        <TableHead>Tujuan (Rute)</TableHead>
                        <TableHead className="w-20">Berangkat</TableHead>
                        <TableHead className="w-20">Kembali</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rib.pemanasan.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                          <TableCell className="text-slate-700">{item.kegiatan}</TableCell>
                          <TableCell className="text-slate-600">{item.waktu}</TableCell>
                          <TableCell className="text-slate-600">{item.rute}</TableCell>
                          <TableCell className="font-mono text-sm">{item.berangkat}</TableCell>
                          <TableCell className="font-mono text-sm">{item.kembali}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Catatan */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Catatan:</strong> Semua unit RIB dalam kondisi siap operasional. 
                    Pengecekan dilakukan sesuai prosedur standar operasional SAR.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "kapal" && (
        <div className="space-y-6">
          {logbookKapal.map((kapal) => (
            <Card key={kapal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-primary" />
                    Logbook Harian {kapal.namaKapal}
                  </CardTitle>
                  <Badge variant="success">Siap Layar</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Operasional */}
                <div>
                  <SectionTitle>
                    <Ship className="h-5 w-5 text-primary" />
                    I. Informasi Operasional Kapal
                  </SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-500">Nama Kapal</p>
                      <p className="font-medium text-slate-800">{kapal.namaKapal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">No. Lambung</p>
                      <p className="font-medium text-slate-800">{kapal.noLambung}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tanggal</p>
                      <p className="font-medium text-slate-800">{kapal.tanggal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">BBM</p>
                      <p className="font-medium text-slate-800">{kapal.bbm}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Endurance</p>
                      <p className="font-medium text-slate-800">{kapal.endurance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Kecepatan Rata-rata</p>
                      <p className="font-medium text-slate-800">{kapal.kecepatan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pangkalan</p>
                      <p className="font-medium text-slate-800">{kapal.pangkalan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Running Hours</p>
                      <p className="font-medium text-slate-800">{kapal.runningHours}</p>
                    </div>
                  </div>
                </div>

                {/* Ceklist Kamar Mesin */}
                <div>
                  <SectionTitle>
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    II. Ceklist Kamar Mesin (Engine Room)
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center">No</TableHead>
                        <TableHead>Item Pemeriksaan</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kapal.kamarMesin.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                          <TableCell className="text-slate-700">{item.item}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="success" className="text-xs">{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Ceklist Anjungan */}
                <div>
                  <SectionTitle>
                    <MapPin className="h-5 w-5 text-primary" />
                    III. Ceklist Anjungan & Navigasi
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center">No</TableHead>
                        <TableHead>Item Pemeriksaan</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kapal.anjungan.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                          <TableCell className="text-slate-700">{item.item}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="success" className="text-xs">{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Ceklist Geladak */}
                <div>
                  <SectionTitle>
                    <Package className="h-5 w-5 text-primary" />
                    IV. Ceklist Geladak & Alat Keselamatan
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center">No</TableHead>
                        <TableHead>Item Pemeriksaan</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kapal.geladak.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                          <TableCell className="text-slate-700">{item.item}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="success" className="text-xs">{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Jurnal Olah Gerak */}
                <div>
                  <SectionTitle>
                    <FileText className="h-5 w-5 text-primary" />
                    V. Jurnal Olah Gerak Harian
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Jam Start</TableHead>
                        <TableHead>Jam Stop</TableHead>
                        <TableHead>Rute / Lokasi Patroli</TableHead>
                        <TableHead className="text-center">Kecepatan</TableHead>
                        <TableHead className="text-center">Sisa Endurance</TableHead>
                        <TableHead className="text-center">Sisa BBM</TableHead>
                        <TableHead>Nahkoda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kapal.jurnalOlahGerak.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{item.jamStart}</TableCell>
                          <TableCell className="font-mono text-sm">{item.jamStop}</TableCell>
                          <TableCell className="text-slate-700">{item.rute}</TableCell>
                          <TableCell className="text-center">{item.kecepatan}</TableCell>
                          <TableCell className="text-center">{item.endurance}</TableCell>
                          <TableCell className="text-center">{item.bbm}</TableCell>
                          <TableCell className="text-slate-700">{item.nahkoda}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "darat" && (
        <div className="space-y-6">
          {logbookDarat.map((kendaraan) => (
            <Card key={kendaraan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Logbook {kendaraan.jenisKendaraan}
                  </CardTitle>
                  <Badge variant="success">Siap Operasional</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Kendaraan */}
                <div>
                  <SectionTitle>
                    <Package className="h-5 w-5 text-primary" />
                    I. Informasi Kendaraan
                  </SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-500">Jenis Kendaraan</p>
                      <p className="font-medium text-slate-800">{kendaraan.jenisKendaraan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">No. Polisi</p>
                      <p className="font-medium text-slate-800">{kendaraan.noPolisi}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tahun Pengadaan</p>
                      <p className="font-medium text-slate-800">{kendaraan.tahun}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tipe</p>
                      <p className="font-medium text-slate-800">{kendaraan.tipe}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Kilometer (KM)</p>
                      <p className="font-medium text-slate-800">{kendaraan.km}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">BBM</p>
                      <p className="font-medium text-slate-800">{kendaraan.bbm}</p>
                    </div>
                  </div>
                </div>

                {/* Riwayat Penggunaan */}
                <div>
                  <SectionTitle>
                    <FileText className="h-5 w-5 text-primary" />
                    II. Riwayat Penggunaan
                  </SectionTitle>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-8 text-center">No</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Dari</TableHead>
                        <TableHead>Ke</TableHead>
                        <TableHead className="text-center">BBM Sebelum</TableHead>
                        <TableHead className="text-center">BBM Sesudah</TableHead>
                        <TableHead className="text-center">KM Sebelum</TableHead>
                        <TableHead className="text-center">KM Sesudah</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kendaraan.riwayatPenggunaan.map((item) => (
                        <TableRow key={item.no}>
                          <TableCell className="text-center text-slate-500">{item.no}</TableCell>
                          <TableCell className="text-slate-700">{item.tanggal}</TableCell>
                          <TableCell className="text-slate-700">{item.dari}</TableCell>
                          <TableCell className="text-slate-700">{item.ke}</TableCell>
                          <TableCell className="text-center">{item.bbmSebelum}</TableCell>
                          <TableCell className="text-center">{item.bbmSesudah}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{item.kmSebelum}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{item.kmSesudah}</TableCell>
                          <TableCell className="text-slate-600">{item.catatan}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Ceklist Perawatan */}
                <div>
                  <SectionTitle>
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    III. Ceklist Perawatan Kendaraan
                  </SectionTitle>
                  <div className="space-y-4">
                    {kendaraan.pemeriksaanHarian.map((kategori) => (
                      <div key={kategori.kategori}>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">{kategori.kategori}</h3>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead>Item Pemeriksaan</TableHead>
                              <TableHead className="w-24 text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {kategori.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-slate-700">{item.item}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="success" className="text-xs">{item.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}