"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ship,
  FileText,
  ClipboardCheck,
  Package,
  CheckCircle2,
  Clock,
  Fuel,
  Users,
  ChevronRight,
  Wrench,
  Bike,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { catatanPerbaikanDarat, pengisianBBM_RIB02 } from "@/components/shared/mock-data";
import {
  ResponsiveTable,
  type ResponsiveField,
} from "@/components/shared/responsive-table";

// ─── Data Jurnal Siaga Rutin ─────────────────────────────────────────────────
const jurnalSiagaRutinMobil = [
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

const jurnalSiagaRutinMotor = [
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
    uraian: "Pengecekan kelengkapan motor trail dan perahu karet",
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
    uraian: "Patroli jalur trail sekitar Perairan Mamuju",
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
    uraian: "Maintenance ringan motor trail",
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

const jurnalSiagaRutinKapal = [
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
    uraian: "Pengecekan kelengkapan kapal dan perahu karet",
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
    uraian: "Patroli perairan sekitar Perairan Mamuju",
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
    uraian: "Maintenance ringan mesin kapal",
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
  { no: 1, nama: "Siti Nurhaliza", ket: "Siaga" },
  { no: 2, nama: "Ahmad Fauzi", ket: "Hadir" },
  { no: 3, nama: "Dewi Lestari", ket: "Tidak Hadir" },
  { no: 4, nama: "Budi Santoso", ket: "Siaga" },
  { no: 5, nama: "Medlyn R. Pagali", ket: "Hadir" },
];

const absensiShiftII = [
  { no: 1, nama: "Kauluddin", ket: "Siaga" },
  { no: 2, nama: "Rizky Pratama", ket: "Tidak Hadir" },
  { no: 3, nama: "Ansaruddin", ket: "Siaga" },
  { no: 4, nama: "Dewi Lestari", ket: "Hadir" },
  { no: 5, nama: "Budi Santoso", ket: "Cuti" },
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
      { no: 1, kegiatan: "Pemanasan mesin", waktu: "15 menit", rute: "Dermaga - Perairan Mamuju", berangkat: "08:00", kembali: "08:15", keterangan: "" },
      { no: 2, kegiatan: "Uji fungsi mesin", waktu: "10 menit", rute: "Perairan Mamuju", berangkat: "08:20", kembali: "08:30", keterangan: "" },
    ],
    pengecekan: [
      { no: 1, item: "Tali Tros", status: "Baik", keterangan: "" },
      { no: 2, item: "Lunas", status: "Baik", keterangan: "" },
      { no: 3, item: "Ban Pelampung", status: "Baik", keterangan: "" },
      { no: 4, item: "Deck", status: "Baik", keterangan: "" },
      { no: 5, item: "Transom (Stand Mesin)", status: "Baik", keterangan: "" },
      { no: 6, item: "Starting Engine", status: "Baik", keterangan: "" },
      { no: 7, item: "Kap Mesin Kanan", status: "Baik", keterangan: "" },
      { no: 8, item: "Kap Mesin Kiri", status: "Baik", keterangan: "" },
      { no: 9, item: "Kaburator", status: "Baik", keterangan: "" },
      { no: 10, item: "Selang BBM", status: "Baik", keterangan: "" },
      { no: 11, item: "Busi", status: "Baik", keterangan: "" },
      { no: 12, item: "Dinamo Stater", status: "Baik", keterangan: "" },
      { no: 13, item: "Dinamo Strom", status: "Baik", keterangan: "" },
      { no: 14, item: "Hydraulic Mesin", status: "Baik", keterangan: "" },
      { no: 15, item: "Aki/Baterai", status: "Baik", keterangan: "" },
      { no: 16, item: "GPS Furuno", status: "Baik", keterangan: "" },
      { no: 17, item: "GPS Tracking", status: "Baik", keterangan: "" },
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
      { no: 1, kegiatan: "Pemanasan mesin", waktu: "20 menit", rute: "Dermaga - Perairan Mamuju", berangkat: "08:00", kembali: "08:20", keterangan: "" },
      { no: 2, kegiatan: "Uji fungsi mesin", waktu: "15 menit", rute: "Perairan Mamuju", berangkat: "08:25", kembali: "08:40", keterangan: "" },
    ],
    pengecekan: [
      { no: 1, item: "Tali Tros", status: "Baik", keterangan: "" },
      { no: 2, item: "Lunas", status: "Baik", keterangan: "" },
      { no: 3, item: "Ban Pelampung", status: "Baik", keterangan: "" },
      { no: 4, item: "Deck", status: "Baik", keterangan: "" },
      { no: 5, item: "Transom (Stand Mesin)", status: "Baik", keterangan: "" },
      { no: 6, item: "Starting Engine", status: "Baik", keterangan: "" },
      { no: 7, item: "Kap Mesin Kanan", status: "Baik", keterangan: "" },
      { no: 8, item: "Kap Mesin Kiri", status: "Baik", keterangan: "" },
      { no: 9, item: "Kaburator", status: "Baik", keterangan: "" },
      { no: 10, item: "Selang BBM", status: "Baik", keterangan: "" },
      { no: 11, item: "Busi", status: "Baik", keterangan: "" },
      { no: 12, item: "Dinamo Stater", status: "Baik", keterangan: "" },
      { no: 13, item: "Dinamo Strom", status: "Baik", keterangan: "" },
      { no: 14, item: "Hydraulic Mesin", status: "Baik", keterangan: "" },
      { no: 15, item: "Aki/Baterai", status: "Baik", keterangan: "" },
      { no: 16, item: "GPS Furuno", status: "Baik", keterangan: "" },
      { no: 17, item: "GPS Tracking", status: "Baik", keterangan: "" },
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
    ceklist: [
      { no: 1, item: "Alat Navigasi", status: "Baik", keterangan: "Radar, GPS, AIS, Kompas Magnet, Echo Sounder" },
      { no: 2, item: "Alat Komunikasi", status: "Baik", keterangan: "Radio VHF/HF dan seluruh perangkat komunikasi berfungsi normal" },
      { no: 3, item: "Persentase BBM", status: "Baik", keterangan: "Sisa bahan bakar 82.64% (Standar minimum 30%)" },
      { no: 4, item: "Endurance", status: "Baik", keterangan: "Sisa endurance 76 jam (Standar minimum 24 jam)" },
      { no: 5, item: "Kecepatan Rata", status: "Baik", keterangan: "Kecepatan rata-rata 12 knot" },
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
    jenisUnit: "Mobil",
    periode: "Mingguan",  // Ubah dari Harian ke Mingguan
    riwayatPenggunaan: [
      { no: 1, tanggal: "Minggu ke-40 (01-07 Oct 2026)", dari: "Kantor", ke: "Desa Binanga", bbmSebelum: "80%", bbmSesudah: "65%", kmSebelum: "45.200", kmSesudah: "45.230", catatan: "Operasi evakuasi pasca banjir" },
      { no: 2, tanggal: "Minggu ke-39 (23-29 Sep 2026)", dari: "Kantor", ke: "Bandara", bbmSebelum: "90%", bbmSesudah: "80%", kmSebelum: "45.150", kmSesudah: "45.200", catatan: "Antar jemput tim SAR" },
      { no: 3, tanggal: "Minggu ke-38 (16-22 Sep 2026)", dari: "Kantor", ke: "Pelabuhan", bbmSebelum: "85%", bbmSesudah: "70%", kmSebelum: "45.100", kmSesudah: "45.150", catatan: "Patroli pantai" },
    ],
    pemeriksaanHarian: [
      { kategori: "A. Menjungkitkan Kabin", items: [
        { item: "Oli Mesin", status: "Baik", keterangan: "" },
        { item: "Oli Power Steering", status: "Baik", keterangan: "" },
        { item: "Fan Belt", status: "Baik", keterangan: "" },
        { item: "Tutup Radiator", status: "Baik", keterangan: "" },
      ]},
      { kategori: "B. Dalam Kabin", items: [
        { item: "Level Minyak Rem / Kopling", status: "Baik", keterangan: "" },
        { item: "Radio Komunikasi", status: "Baik", keterangan: "" },
        { item: "Seat Belt (Sabuk Pengaman)", status: "Baik", keterangan: "" },
        { item: "Sirine & Lightbar", status: "Baik", keterangan: "" },
        { item: "Gerak Bebas Pedal Rem", status: "Baik", keterangan: "" },
        { item: "Gerak Bebas Kopling", status: "Baik", keterangan: "" },
        { item: "Gerak Bebas Pedal Gas", status: "Baik", keterangan: "" },
        { item: "Instrumen Indikator", status: "Baik", keterangan: "" },
        { item: "Kemudahan Start Engine", status: "Baik", keterangan: "" },
        { item: "Langkah Tuas Rem Parkir", status: "Baik", keterangan: "" },
        { item: "Sapuan Wiper", status: "Baik", keterangan: "" },
        { item: "Kaca Spion Dalam", status: "Baik", keterangan: "" },
        { item: "Level Cairan Washer", status: "Baik", keterangan: "" },
        { item: "Gerak Bebas Kemudi", status: "Baik", keterangan: "" },
        { item: "Klakson", status: "Baik", keterangan: "" },
        { item: "Level Bahan Bakar", status: "Baik", keterangan: "" },
        { item: "Power Window / Door Lock", status: "Baik", keterangan: "" },
        { item: "Kunci Roda & Toolkit", status: "Baik", keterangan: "" },
      ]},
      { kategori: "C. Keliling Kendaraan", items: [
        { item: "Lampu-Lampu", status: "Baik", keterangan: "" },
        { item: "Pegas Suspensi / Kaki-Kaki / Per Daun", status: "Baik", keterangan: "" },
        { item: "Kebocoran / Tetesan Fluid", status: "Baik", keterangan: "" },
        { item: "Kondisi Kaca-Kaca", status: "Baik", keterangan: "" },
        { item: "Wiper", status: "Baik", keterangan: "" },
        { item: "Saringan Bahan Bakar", status: "Baik", keterangan: "" },
        { item: "Rolling Door Compartment", status: "Baik", keterangan: "" },
        { item: "Engsel Pintu-Pintu", status: "Baik", keterangan: "" },
        { item: "Kunci Pintu-Pintu", status: "Baik", keterangan: "" },
        { item: "Towing", status: "Baik", keterangan: "" },
      ]},
      { kategori: "D. Roda dan Ban", items: [
        { item: "Tekanan Ban", status: "Baik", keterangan: "" },
        { item: "Tapak dan Dinding Ban", status: "Baik", keterangan: "" },
        { item: "Keausan Ban", status: "Baik", keterangan: "" },
        { item: "Pemasangan Velg", status: "Baik", keterangan: "" },
      ]},
    ],
    pemeriksaanMingguan: [
      { kategori: "1. Performa / Fungsi Sistem", items: [
        { item: "Kerja AC", status: "Baik", keterangan: "" },
        { item: "Kerja Rem", status: "Baik", keterangan: "" },
        { item: "Kerja Kopling", status: "Baik", keterangan: "" },
        { item: "Kerja Pedal Gas", status: "Baik", keterangan: "" },
        { item: "Kerja Kaki-Kaki", status: "Baik", keterangan: "" },
        { item: "Kerja Sistem 4WD", status: "Baik", keterangan: "" },
      ]},
      { kategori: "2. Keliling Kendaraan (Mingguan)", items: [
        { item: "Kaca Depan", status: "Baik", keterangan: "" },
        { item: "Spion Luar", status: "Baik", keterangan: "" },
        { item: "Flooding Light System", status: "Baik", keterangan: "" },
        { item: "Lampu-Lampu", status: "Baik", keterangan: "" },
        { item: "Level Cairan Pendingin", status: "Baik", keterangan: "" },
        { item: "APAR", status: "Baik", keterangan: "" },
        { item: "Plat Nopol", status: "Baik", keterangan: "" },
        { item: "Ban Cadangan", status: "Baik", keterangan: "" },
        { item: "Kebersihan Kendaraan", status: "Baik", keterangan: "" },
        { item: "Jok / Tempat Duduk", status: "Baik", keterangan: "" },
        { item: "Kaca Film", status: "Baik", keterangan: "" },
      ]},
    ],
    pemeriksaanBulanan: [
      { kategori: "C. Pemeriksaan Bulanan", items: [
        { item: "Winch", status: "Baik", keterangan: "" },
      ]},
    ],
    itemTambahan: [
      { item: "PengecekanWAP radio HT regu lapangan", status: "Baik", keterangan: "" },
    ],
  },
  {
    id: "dar-02",
    jenisKendaraan: "RESCUE MOTORCYCLE",
    noPolisi: "B 3184 PKQ",
    tahun: "-",
    tipe: "Trail",
    km: "-",
    bbm: "85%",
    jenisUnit: "Motor",
    riwayatPenggunaan: [
      { no: 1, tanggal: "2026-10-07", dari: "Kantor", ke: "Desa Binanga", bbmSebelum: "70%", bbmSesudah: "60%", kmSebelum: "15.300", kmSesudah: "15.400", catatan: "Patroli pantai koordinat dengan tim darat" },
      { no: 2, tanggal: "2026-10-06", dari: "Kantor", ke: "Bandara", bbmSebelum: "80%", bbmSesudah: "75%", kmSebelum: "15.200", kmSesudah: "15.300", catatan: "Diterima tugas evakuasi ringan" },
    ],
    pemeriksaanHarian: [
      { kategori: "Bagian 1", items: [
        { item: "Level Bahan Bakar", status: "Baik", keterangan: "" },
        { item: "Level Oli Mesin", status: "Rusak Ringan", keterangan: "" },
        { item: "Kondisi Ban", status: "Baik", keterangan: "" },
        { item: "Tekanan Ban", status: "Baik", keterangan: "" },
        { item: "Keausan", status: "Baik", keterangan: "" },
        { item: "Rantai Penggerak", status: "Baik", keterangan: "" },
        { item: "Baut Mur dan Pengencangan", status: "Baik", keterangan: "" },
        { item: "Stang (Bergerak Lancar)", status: "Baik", keterangan: "" },
        { item: "Level Minyak Rem", status: "Baik", keterangan: "" },
        { item: "Kampas Rem", status: "Baik", keterangan: "" },
        { item: "Kerja Gas", status: "Baik", keterangan: "" },
        { item: "Tuas Kopling", status: "Baik", keterangan: "" },
        { item: "Klakson", status: "Baik", keterangan: "" },
      ]},
      { kategori: "Bagian 2", items: [
        { item: "Lampu Depan", status: "Baik", keterangan: "" },
        { item: "Lampu Belakang/Rem", status: "Baik", keterangan: "" },
        { item: "Lampu Sein", status: "Rusak Ringan", keterangan: "" },
        { item: "Engine Stop Switch", status: "Baik", keterangan: "" },
        { item: "Standar Samping", status: "Baik", keterangan: "" },
        { item: "Indikator Spedometer", status: "Baik", keterangan: "" },
        { item: "Kaca Spion", status: "Baik", keterangan: "" },
      ]},
    ],
    pemeriksaanMingguan: [
      { kategori: "Pemeriksaan Mingguan", items: [
        { item: "Level Oli Mesin", status: "Baik", keterangan: "" },
        { item: "Rantai Penggerak", status: "Baik", keterangan: "" },
        { item: "Kampas Rem", status: "Baik", keterangan: "" },
        { item: "Tekanan Ban", status: "Baik", keterangan: "" },
        { item: "Lampu-Lampu", status: "Baik", keterangan: "" },
        { item: "Klakson", status: "Baik", keterangan: "" },
        { item: "Kerja Gas", status: "Baik", keterangan: "" },
      ]},
    ],
    pemeriksaanBulanan: [
      { kategori: "Pemeriksaan Bulanan", items: [
        { item: "Baut Mur dan Pengencangan", status: "Baik", keterangan: "" },
        { item: "Kondisi Rantai", status: "Baik", keterangan: "" },
        { item: "Kampas Rem", status: "Baik", keterangan: "" },
      ]},
    ],
    itemTambahan: [
      { item: "Engine Stop Switch", status: "Baik", keterangan: "" },
      { item: "Standar Samping", status: "Baik", keterangan: "" },
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

/** Badge kondisi untuk item ceklist: Baik / Rusak Ringan / Rusak Berat. */
function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "Baik" ? "success" : status === "Rusak Ringan" ? "warning" : status === "Rusak Berat" ? "danger" : "outline";
  return (
    <Badge variant={variant} className="text-xs">
      {status}
    </Badge>
  );
}

/** Badge keterangan absensi personel. */
function KetBadge({ ket }: { ket: string }) {
  const variant =
    ket === "Siaga" ? "warning" : ket === "Hadir" ? "success" : ket === "Tidak Hadir" ? "danger" : "outline";
  return (
    <Badge variant={variant} className="text-xs">
      {ket}
    </Badge>
  );
}

/** Baris item ceklist generik: dipakai Kapal, RIB, Mobil, dan Motor. */
type ItemCeklist = { item: string; status: string; keterangan?: string };

const CEKLIST_FIELDS: ResponsiveField<ItemCeklist>[] = [
  {
    key: "item",
    header: "Item Pemeriksaan",
    render: (row) => row.item,
    cellClassName: "text-slate-700",
    hideOnCard: true,
  },
  {
    key: "status",
    header: "Kondisi",
    render: (row) => <StatusBadge status={row.status} />,
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

/** Baris absensi personel. */
type BarisAbsensi = { no: number; nama: string; ket: string };

const ABSENSI_FIELDS: ResponsiveField<BarisAbsensi>[] = [
  {
    key: "no",
    header: "No",
    render: (row) => row.no,
    headClassName: "w-10 text-center",
    cellClassName: "text-center text-slate-500",
  },
  {
    key: "nama",
    header: "Nama",
    render: (row) => row.nama,
    cellClassName: "font-medium text-slate-800",
  },
  {
    key: "ket",
    header: "Ket",
    render: (row) => <KetBadge ket={row.ket} />,
    headClassName: "w-20 text-center",
    cellClassName: "text-center",
  },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OperatorPage() {
  const [activeTab, setActiveTab] = useState<"siaga" | "rib" | "kapal" | "mobil" | "motor">("siaga");
  const [armadaFilter, setArmadaFilter] = useState<"Semua" | "Mobil" | "Motor" | "Kapal">("Semua");

  // `armada` menentukan journal mana yang terlihat untuk tiap jenis armada
  const tabs = [
    { id: "siaga" as const, label: "Jurnal Siaga Rutin", icon: FileText, armada: ["Mobil", "Motor", "Kapal"] },
    { id: "rib" as const, label: "Jurnal RIB", icon: Ship, armada: ["Kapal"] },
    { id: "kapal" as const, label: "Logbook Kapal", icon: ClipboardCheck, armada: ["Kapal"] },
    { id: "mobil" as const, label: "Logbook Mobil", icon: Car, armada: ["Mobil"] },
    { id: "motor" as const, label: "Logbook Motor", icon: Bike, armada: ["Motor"] },
  ];

  const visibleTabs = tabs.filter(
    (tab) => armadaFilter === "Semua" || tab.armada.includes(armadaFilter)
  );

  // Auto-pindah ke tab pertama yang valid saat filter armada berubah
  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "siaga");
    }
  }, [armadaFilter, activeTab]);

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
          label={armadaFilter === "Motor" ? "Motor Siaga" : "Kendaraan Siaga"}
          value={armadaFilter === "Motor" ? 1 : 8}
          icon={armadaFilter === "Motor" ? Bike : Package}
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

      {/* Tabs — difilter berdasarkan armada yang dipilih.
          `flex-wrap` supaya semua tab terlihat tanpa perlu digeser
          horizontal di layar sempit. */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-1">
          {visibleTabs.map((tab) => (
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

      {/* Empty state — armada tidak punya jurnal */}
      {visibleTabs.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500">
            Belum ada jurnal/logbook untuk armada {armadaFilter}.
          </p>
        </Card>
      )}

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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
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
                  <div>
                    <span className="text-slate-500">Endurance Awal:</span>
                    <p className="font-medium text-slate-800">85%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Pemakaian:</span>
                    <p className="font-medium text-slate-800">Patroli & Koordinasi</p>
                  </div>
                  <div>
                    <span className="text-slate-500">BBM Akhir:</span>
                    <p className="font-medium text-slate-800">78%</p>
                  </div>
                </div>
              </div>
              <ResponsiveTable
                data={
                  armadaFilter === "Kapal"
                    ? jurnalSiagaRutinKapal
                    : armadaFilter === "Motor"
                      ? jurnalSiagaRutinMotor
                      : jurnalSiagaRutinMobil
                }
                getKey={(item) => item.no}
                cardTitle={(item) => item.uraian}
                cardSubtitle={(row) => `Jam ${row.jam}`}
                cardBadge={(item) => <Badge variant="outline" className="text-xs">{item.ket}</Badge>}
                cardPreviewCount={0}
                detailLabel="Lihat detail kegiatan"
                emptyMessage="Belum ada kegiatan pada jurnal siaga."
                fields={[
                  {
                    key: "no",
                    header: "No",
                    render: (item) => item.no,
                    headClassName: "w-12 text-center",
                    cellClassName: "text-center text-slate-500",
                    hideOnCard: true,
                  },
                  {
                    key: "jam",
                    header: "Jam",
                    render: (item) => item.jam,
                    headClassName: "w-20",
                    cellClassName: "font-mono text-sm",
                    hideOnCard: true,
                  },
                  {
                    key: "uraian",
                    header: "Uraian Kegiatan",
                    render: (item) => item.uraian,
                    cellClassName: "text-slate-700",
                    hideOnCard: true,
                  },
                  {
                    key: "ket",
                    header: "Keterangan",
                    render: (item) => (
                      <Badge variant="outline" className="text-xs">
                        {item.ket}
                      </Badge>
                    ),
                    headClassName: "w-32",
                    hideBelowLg: true,
                    hideOnCard: true,
                  },
                ]}
              />
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
                <ResponsiveTable
                  data={absensiShiftI}
                  getKey={(item) => item.no}
                  cardTitle={(item) => item.nama}
                  cardBadge={(item) => <KetBadge ket={item.ket} />}
                  cardPreviewCount={0}
                  detailLabel="Lihat detail personel"
                  emptyMessage="Belum ada data absensi."
                  fields={ABSENSI_FIELDS}
                />
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
                <ResponsiveTable
                  data={absensiShiftII}
                  getKey={(item) => item.no}
                  cardTitle={(item) => item.nama}
                  cardBadge={(item) => <KetBadge ket={item.ket} />}
                  cardPreviewCount={0}
                  detailLabel="Lihat detail personel"
                  emptyMessage="Belum ada data absensi."
                  fields={ABSENSI_FIELDS}
                />
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

                {/* Tabel Pengecekan dengan Gradasi Kerusakan */}
                <div>
                  <SectionTitle>
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    A. Pemeliharaan
                  </SectionTitle>
                  <ResponsiveTable
                    data={rib.pengecekan}
                    getKey={(item) => item.no}
                    cardTitle={(item) => item.item}
                    cardBadge={(item) => <StatusBadge status={item.status} />}
                    cardPreviewCount={0}
                    detailLabel="Lihat detail pengecekan"
                    emptyMessage="Belum ada data pengecekan."
                    fields={CEKLIST_FIELDS}
                  />
                </div>

                {/* Tabel Pemanasan */}
                <div>
                  <SectionTitle>
                    <Clock className="h-5 w-5 text-primary" />
                    B. Pemanasan Mesin dan Pengoperasian Alut
                  </SectionTitle>
                  <ResponsiveTable
                    data={rib.pemanasan}
                    getKey={(item) => item.no}
                    cardTitle={(item) => item.kegiatan}
                    cardSubtitle={(row) => `${row.berangkat} - ${row.kembali}`}
                    cardPreviewCount={2}
                    detailLabel="Lihat detail pemanasan"
                    emptyMessage="Belum ada data pemanasan."
                    fields={[
                      {
                        key: "no",
                        header: "No",
                        render: (item) => item.no,
                        headClassName: "w-10 text-center",
                        cellClassName: "text-center text-slate-500",
                        hideBelowXl: true,
                        hideOnCard: true,
                      },
                      {
                        key: "kegiatan",
                        header: "Kegiatan Pemanasan",
                        render: (item) => item.kegiatan,
                        cellClassName: "text-slate-700",
                        hideOnCard: true,
                      },
                      {
                        key: "waktu",
                        header: "Waktu",
                        render: (item) => item.waktu,
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
                        render: (item) => item.berangkat,
                        headClassName: "w-20",
                        cellClassName: "font-mono text-sm",
                      },
                      {
                        key: "kembali",
                        header: "Kembali",
                        render: (item) => item.kembali,
                        headClassName: "w-20",
                        cellClassName: "font-mono text-sm",
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

                {/* Tabel Pengisian BBM (RIB 02) */}
                {rib.id === "rib-02" && (
                  <div>
                    <SectionTitle>
                      <Fuel className="h-5 w-5 text-primary" />
                      C. Pengisian BBM
                    </SectionTitle>
                    <ResponsiveTable
                      data={[
                        { no: 1, label: "Sisa Kemarin", liter: "-", persen: "45%" },
                        { no: 2, label: "Penambahan", liter: "30 Liter", persen: "-" },
                        { no: 3, label: "Saldo Akhir", liter: "-", persen: "75%" },
                      ]}
                      getKey={(item) => item.no}
                      cardTitle={(item) => item.label}
                      cardBadge={(item) => (
                        <Badge variant={item.label === "Saldo Akhir" ? "primary" : "outline"} className="text-xs">
                          {item.persen}
                        </Badge>
                      )}
                      cardPreviewCount={1}
                      detailLabel="Lihat detail pengisian"
                      fields={[
                        {
                          key: "no",
                          header: "No",
                          render: (item) => item.no,
                          headClassName: "w-8 text-center",
                          cellClassName: "text-center text-slate-500",
                          hideOnCard: true,
                        },
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
                  </div>
                )}

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

                {/* Ceklist Harian Kapal — otomatis jadi kartu di layar kecil */}
                <div>
                  <SectionTitle>
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    II. Ceklist Harian Kapal
                  </SectionTitle>
                  <ResponsiveTable
                    data={kapal.ceklist}
                    getKey={(item) => item.no}
                    cardTitle={(item) => item.item}
                    cardSubtitle={(item) => item.keterangan || "-"}
                    cardBadge={(item) => <StatusBadge status={item.status} />}
                    cardPreviewCount={0}
                    detailLabel="Lihat detail ceklist"
                    emptyMessage="Belum ada ceklist kapal."
                    fields={[
                      {
                        key: "no",
                        header: "No",
                        render: (item) => item.no,
                        headClassName: "w-10 text-center",
                        cellClassName: "text-center text-slate-500",
                        hideOnCard: true,
                      },
                      {
                        key: "item",
                        header: "Item Pemeriksaan",
                        render: (item) => item.item,
                        cellClassName: "text-slate-700",
                      },
                      {
                        key: "status",
                        header: "Kondisi",
                        render: (item) => <StatusBadge status={item.status} />,
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

                {/* Jurnal Olah Gerak — otomatis jadi kartu di layar kecil */}
                <div>
                  <SectionTitle>
                    <FileText className="h-5 w-5 text-primary" />
                    III. Jurnal Olah Gerak Harian
                  </SectionTitle>
                  <ResponsiveTable
                    data={kapal.jurnalOlahGerak}
                    getKey={(item) => item.jamStart}
                    cardTitle={(item) => item.rute}
                    cardSubtitle={(row) => `${row.jamStart} - ${row.jamStop}`}
                    cardPreviewCount={4}
                    detailLabel="Lihat detail perjalanan"
                    emptyMessage="Belum ada jurnal olah gerak."
                    fields={[
                      {
                        key: "jamStart",
                        header: "Jam Start",
                        render: (item) => item.jamStart,
                        cellClassName: "font-mono text-sm",
                        hideOnCard: true,
                      },
                      {
                        key: "jamStop",
                        header: "Jam Stop",
                        render: (item) => item.jamStop,
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
                        render: (item) => item.kecepatan,
                        headClassName: "text-center",
                        cellClassName: "text-center",
                      },
                      {
                        key: "endurance",
                        header: "Sisa Endurance",
                        render: (item) => item.endurance,
                        headClassName: "text-center",
                        cellClassName: "text-center",
                      },
                      {
                        key: "bbm",
                        header: "Sisa BBM",
                        render: (item) => item.bbm,
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
          ))}
        </div>
      )}

      {(activeTab === "mobil" || activeTab === "motor") && (
        <div className="space-y-6">
          {logbookDarat
            .filter((kendaraan) => kendaraan.jenisUnit === (activeTab === "mobil" ? "Mobil" : "Motor"))
            .map((kendaraan) => (
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

                {/* Riwayat Penggunaan — otomatis jadi kartu di layar kecil */}
                <div>
                  <SectionTitle>
                    <FileText className="h-5 w-5 text-primary" />
                    II. Riwayat Penggunaan
                  </SectionTitle>
                  <ResponsiveTable
                    data={kendaraan.riwayatPenggunaan}
                    getKey={(item) => item.no}
                    cardTitle={(item) => `${item.dari} \u2192 ${item.ke}`}
                    cardSubtitle={(item) => item.tanggal}
                    cardPreviewCount={4}
                    detailLabel="Lihat detail perjalanan"
                    emptyMessage="Belum ada riwayat penggunaan."
                    fields={[
                      {
                        key: "no",
                        header: "No",
                        render: (item) => item.no,
                        headClassName: "w-8 text-center",
                        cellClassName: "text-center text-slate-500",
                        hideBelowXl: true,
                        hideOnCard: true,
                      },
                      {
                        key: "tanggal",
                        header: "Tanggal",
                        render: (item) => item.tanggal,
                        cellClassName: "text-slate-700",
                        hideOnCard: true,
                      },
                      {
                        key: "dari",
                        header: "Dari",
                        render: (item) => item.dari,
                        cellClassName: "text-slate-700",
                        hideOnCard: true,
                      },
                      {
                        key: "ke",
                        header: "Ke",
                        render: (item) => item.ke,
                        cellClassName: "text-slate-700",
                        hideOnCard: true,
                      },
                      {
                        key: "bbmSebelum",
                        header: "BBM Sebelum",
                        render: (item) => item.bbmSebelum,
                        headClassName: "text-center",
                        cellClassName: "text-center",
                      },
                      {
                        key: "bbmSesudah",
                        header: "BBM Sesudah",
                        render: (item) => item.bbmSesudah,
                        headClassName: "text-center",
                        cellClassName: "text-center",
                      },
                      {
                        key: "kmSebelum",
                        header: "KM Sebelum",
                        render: (item) => item.kmSebelum,
                        headClassName: "text-center",
                        cellClassName: "text-center font-mono text-sm",
                      },
                      {
                        key: "kmSesudah",
                        header: "KM Sesudah",
                        render: (item) => item.kmSesudah,
                        headClassName: "text-center",
                        cellClassName: "text-center font-mono text-sm",
                      },
                      {
                        key: "catatan",
                        header: "Catatan",
                        render: (item) => item.catatan,
                        cellClassName: "text-slate-600",
                        hideBelowLg: true,
                      },
                    ]}
                  />
                </div>

                {/* Catatan Penggantian/Perbaikan — otomatis jadi kartu di layar kecil */}
                <div>
                  <SectionTitle>
                    <Wrench className="h-5 w-5 text-primary" />
                    III. Catatan Penggantian, Perbaikan, dan Overhaul
                  </SectionTitle>
                  <ResponsiveTable
                    data={catatanPerbaikanDarat}
                    getKey={(item) => `${item.tanggal}-${item.pelaksana}`}
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
                        render: (item) => item.pelaksana,
                        cellClassName: "text-slate-600",
                      },
                    ]}
                  />
                </div>

                {/* Ceklist Perawatan - Harian */}
                <div>
                  <SectionTitle>
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    IV. Ceklist Perawatan Harian
                  </SectionTitle>
                  <div className="space-y-4">
                    {kendaraan.pemeriksaanHarian.map((kategori) => (
                      <div key={kategori.kategori}>
                        <h3 className="mb-2 text-sm font-semibold text-slate-700">
                          {kategori.kategori}
                        </h3>
                        <ResponsiveTable
                          data={kategori.items}
                          getKey={(item) => `${kategori.kategori}-${item.item}`}
                          cardTitle={(item) => item.item}
                          cardBadge={(item) => <StatusBadge status={item.status} />}
                          cardPreviewCount={0}
                          detailLabel="Lihat detail item"
                          emptyMessage="Belum ada item pemeriksaan."
                          fields={CEKLIST_FIELDS}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ceklist Perawatan - Mingguan & Bulanan */}
                <div>
                  <SectionTitle>
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    V. Ceklist Perawatan Mingguan & Bulanan
                  </SectionTitle>
                  <div className="space-y-4">
                    {[
                      ...kendaraan.pemeriksaanMingguan,
                      ...kendaraan.pemeriksaanBulanan,
                    ].map((kategori) => (
                      <div key={kategori.kategori}>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">
                          {kategori.kategori}
                        </h3>
                        <ResponsiveTable
                          data={kategori.items}
                          getKey={(item) => `${kategori.kategori}-${item.item}`}
                          cardTitle={(item) => item.item}
                          cardBadge={(item) => <StatusBadge status={item.status} />}
                          cardPreviewCount={0}
                          detailLabel="Lihat detail item"
                          emptyMessage="Belum ada item pemeriksaan."
                          fields={CEKLIST_FIELDS}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Item Tambahan — otomatis jadi kartu di layar kecil */}
                <div>
                  <SectionTitle>
                    <Wrench className="h-5 w-5 text-primary" />
                    VI. Item Tambahan (Jika Ada)
                  </SectionTitle>
                  <ResponsiveTable
                    data={kendaraan.itemTambahan}
                    getKey={(item) => item.item}
                    cardTitle={(item) => item.item}
                    cardBadge={(item) => <StatusBadge status={item.status} />}
                    cardPreviewCount={0}
                    detailLabel="Lihat detail item"
                    emptyMessage="Tidak ada item tambahan."
                    fields={CEKLIST_FIELDS}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}