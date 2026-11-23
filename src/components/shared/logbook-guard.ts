import {
  cariAsetDariJenisUnit,
  type Aset,
  type LogbookPerjalanan,
} from "@/components/shared/mock-data";

/**
 * Aturan kelayakan unit untuk logbook keberangkatan BARU.
 *
 * Sumber kebenaran tunggal untuk tiga titik pemeriksaan:
 * dropdown unit, layar blokir hasil pindai QR, dan `handleSubmit` — supaya
 * ketiganya tidak bisa lagi memberi hasil berbeda.
 */

/**
 * Cek apakah aset memiliki status "Rusak Berat" — jika ya, tidak boleh
 * dipinjam. Mengembalikan string pesan warning atau null jika bisa dipinjam.
 */
export function checkAsetRusakBerat(
  asetKode: string,
  asets: Aset[]
): string | null {
  const aset = asets.find((a) => a.kode === asetKode);
  if (!aset) return null;
  if (
    aset.kondisi !== "Baik" ||
    aset.status === "Rusak Berat" ||
    aset.status === "Rusak Ringan"
  ) {
    return `Tidak dapat meminjam: ${aset.nama} sedang dalam kondisi "${aset.kondisi}" (${aset.status})`;
  }
  return null;
}

/**
 * Alasan sebuah unit TIDAK boleh dipakai untuk logbook baru, atau `null` bila
 * boleh.
 *
 * Menyatukan dua aturan yang sebelumnya hanya berlaku di dropdown sehingga
 * jalur pindai QR ikut tercakup:
 *
 * 1. kondisi aset bukan "Baik" (Rusak Ringan / Rusak Berat), dan
 * 2. unit sudah punya catatan berjalan ("Sedang Digunakan" /
 *    "Menunggu Penggunaan") — auto-fill QR sebelumnya melewati cek ini sehingga
 *    memungkinkan logbook ganda untuk satu unit.
 *
 * Pencocokan menerima kode maupun nama unit, mengikuti cara query
 * `?unit=` dari QR dibaca di halaman tambah logbook.
 */
export function alasanUnitDipakai(
  unitScan: string,
  asets: Aset[],
  logbooks: LogbookPerjalanan[]
): string | null {
  const aset = asets.find((a) => a.kode === unitScan || a.nama === unitScan);
  if (!aset) {
    // Scan menunjuk unit yang tak dikenal / tak terlihat peran ini → tetap
    // blokir, agar form kosong yang bisa diisi sembarangan tidak terbuka.
    return `Unit "${unitScan}" tidak ditemukan pada master data atau tidak dapat diakses dengan akun Anda.`;
  }

  const rusak = checkAsetRusakBerat(aset.kode, asets);
  if (rusak) return rusak;

  const dipakai = logbooks.some(
    (l) =>
      (l.status === "Sedang Digunakan" || l.status === "Menunggu Penggunaan") &&
      cariAsetDariJenisUnit(l.jenisUnit, asets)?.id === aset.id
  );
  if (dipakai) {
    return `Tidak dapat meminjam: ${aset.nama} sedang dipakai atau sudah dijadwalkan untuk perjalanan lain`;
  }
  return null;
}
