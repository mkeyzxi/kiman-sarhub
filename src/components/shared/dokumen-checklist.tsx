"use client";

/**
 * Komponen dokumen "Laporan Hasil Checklist Perawatan"
 * 
 * Ditempel di bawah halaman detail checklist (`/operator/checklist/[id]`)
 * lalu dicetak lewat `window.print()` — pola yang sama dengan dokumen
 * Berita Acara. Struktur & gaya sesuai template acuan
 * `checklist perawatan kendaraan trail` (index.html + style.css).
 * 
 * Dokumen ditata oleh refleksi data checklist yang sudah tersimpan — tidak
 * ada nilai yang dihitung ulang di luar penghitungan jumlah kondisi item.
 */

import { KOP_SURAT } from "@/config/kop-surat";
import {
  tanggalTeks,
  type ChecklistHarian,
} from "@/components/shared/mock-data";

/** Info unit (aset BMN) yang opsional tampil pada dokumen. */
export interface InfoUnitDokumen {
  nama?: string;
  namaReferensi?: string;
  kode?: string;
  nup?: string;
  merk?: string;
  tipe?: string;
  lokasi?: string;
  penanggungJawab?: string;
}

export interface DokumenChecklistProps {
  checklist: ChecklistHarian;
  /** Nama template checklist asal daftar item (opsional). */
  templateNama?: string;
  /** Data unit dari master BMN (opsional — baris kosong dilewati). */
  unit?: InfoUnitDokumen | null;
  /** Nama penanggung jawab aset — dipakai di blok tanda tangan. */
  penanggungJawab?: string | null;
}

/** Satu baris tabel label : nilai. Baris tanpa isi dilewati. */
function BarisInfo({
  label,
  nilai,
}: {
  label: string;
  nilai?: string | number | null;
}) {
  const tampil = (nilai ?? "").toString().trim();
  if (!tampil) return null;
  return (
    <tr>
      <td className="dc-label">{label}</td>
      <td>{tampil}</td>
    </tr>
  );
}

/**
 * Format tanggal dalam hari/tanggal/bulan/tahun.
 * Dipakai dari mock-data agar konsisten dengan berita acara.
 */
function useTanggalDoc(tanggal: string) {
  const tanggalTeks = {
    hari: "Senin",
    tanggal: "15",
    bulan: "Mei",
    tahunKata: "2024",
  };
  // Parsing sederhana dari format tanggal checklist
  const dateObj = new Date(tanggal);
  if (!dateObj) return tanggalTeks;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return {
    hari: days[dateObj.getDay()],
    tanggal: String(dateObj.getDate()).padStart(2, "0"),
    bulan: [
      "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ][dateObj.getMonth()],
    tahunKata: dateObj.getFullYear().toString(),
  };
}

export function DokumenChecklist({
  checklist,
  templateNama,
  unit,
  penanggungJawab,
}: DokumenChecklistProps) {
  const tanggalDoc = useTanggalDoc(checklist.tanggal);

  const semuaItem = checklist.items;
  const baik = semuaItem.filter((i) => i.kondisi === "Baik").length;
  const rusakRingan = semuaItem.filter(
    (i) => i.kondisi === "Rusak Ringan"
  ).length;
  const rusakBerat = semuaItem.filter((i) => i.kondisi === "Rusak Berat").length;
  const belum = semuaItem.filter((i) => i.kondisi === "Belum Diperiksa").length;
  const adaRusak = rusakRingan > 0 || rusakBerat > 0;

  // Split item menjadi dua: kolom kiri (separuh pertama) dan kolom kanan
  // (separuh kedua) — agar tinggi tabel tidak meledak dan bertabrakan.
  const midPoint = Math.ceil(semuaItem.length / 2);
  const itemsKiri = semuaItem.slice(0, midPoint);
  const itemsKanan = semuaItem.slice(midPoint);

  // Item Tambahan: minimal 3 baris kosong. Jika ada item dengan catatan
  // (keterangan terisi), tampilkan di sini — baris tambahan mengikuti.
  const itemsCatatan = semuaItem.filter(
    (i) => i.keterangan && i.keterangan.trim() !== ""
  );
  const barisTambahan = Math.max(3, itemsCatatan.length);

  // Bangun baris info unit untuk vehicle-info section
  const infoRows = [
    { label: "Jenis Kendaraan", nilai: unit?.tipe || "-" },
    {
      label: "Tanggal Pemeriksaan",
      nilai:
        tanggalDoc.tanggal +
        " " +
        tanggalDoc.bulan +
        " " +
        tanggalDoc.tahunKata,
    },
    { label: "Tipe Kendaraan", nilai: unit?.merk || unit?.tipe || "-" },
  ];

  // Judul dokumen dinamis berdasarkan jenis unit.
  const judulDokumen = (() => {
    switch (checklist.jenisUnit) {
      case "Motor":
        return "CEKLIST PERAWATAN KENDARAAN MOTOR";
      case "Mobil":
        return "CEKLIST PERAWATAN KENDARAAN MOBIL";
      case "Kapal":
        return "CEKLIST PERAWATAN KAPAL SAR";
      case "Perahu":
        return "CEKLIST PERAWATAN PERAHU RIB";
      default:
        return "CEKLIST PERAWATAN KENDARAAN";
    }
  })();

  return (
    <div className="ba-doc">
      <section
        className="ba-sheet"
        aria-label="Laporan Hasil Checklist Perawatan"
      >
        {/* Header dokumental — mirip template reference: judul + info kendaraan */}
        <header className="document-header">
          <h1>{judulDokumen}</h1>
          <section className="vehicle-info">
            <div className="info-column">
              {infoRows.map((row, idx) => (
                <div key={idx} className="info-row">
                  <span>{row.label}</span>
                  <span>:</span>
                  <span>{row.nilai}</span>
                </div>
              ))}
            </div>
            <div className="info-column right-info">
              <div className="info-row">
                <span><strong>Nomor Polisi</strong></span>
                <span>:</span>
                <span>{unit?.kode || "-"}</span>
              </div>
              <div className="info-row">
                <span>Tahun Pengadaan</span>
                <span>:</span>
                <span className="blank"></span>
              </div>
              <div className="info-row">
                <span>KM</span>
                <span>:</span>
                <span className="blank"></span>
              </div>
            </div>
          </section>
          <h2 className="routine-title">PEMERIKSAAN RUTIN</h2>
        </header>

        <section className="inspection-grid">
          <table className="inspection-table left-table">
            <thead>
              <tr>
                <th className="item-head">ITEM PEMERIKSAAN</th>
                <th className="good-head">Baik</th>
                <th className="bad-head">Rusak /<br />Tidak sesuai<br />standart</th>
                <th className="note-head">Ket</th>
              </tr>
            </thead>
            <tbody>
              {itemsKiri.map((item, idx) => (
                <tr key={`kiri-${item.label}-${idx}`}>
                  <td className="item-name">{item.label}</td>
                  <td className="check">{item.kondisi === "Baik" ? "✓" : ""}</td>
                  <td>{item.kondisi === "Rusak Ringan" || item.kondisi === "Rusak Berat" ? "✓" : ""}</td>
                  <td>{item.keterangan || ""}</td>
                </tr>
              ))}
              {itemsKiri.length === 0 && semuaItem.length === 0 && (
                <tr>
                  <td className="item-name" colSpan={4}>
                    Belum ada item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="right-tables">
            <table className="inspection-table lights-table">
              <thead>
                <tr>
                  <th className="item-head">ITEM PEMERIKSAAN</th>
                  <th className="good-head">Baik</th>
                  <th className="bad-head">Rusak / Tidak<br />sesuai standart</th>
                  <th className="note-head">Ket</th>
                </tr>
              </thead>
              <tbody>
                {itemsKanan.map((item, idx) => (
                  <tr key={`kanan-${item.label}-${idx}`}>
                    <td className="item-name">{item.label}</td>
                    <td className="check">{item.kondisi === "Baik" ? "✓" : ""}</td>
                    <td>{item.kondisi === "Rusak Ringan" || item.kondisi === "Rusak Berat" ? "✓" : ""}</td>
                    <td>{item.keterangan || ""}</td>
                  </tr>
                ))}
                {itemsKanan.length === 0 && semuaItem.length === 0 && (
                  <tr>
                    <td className="item-name" colSpan={4}>
                      Belum ada item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <h3 className="additional-title">Item Tambahan</h3>
            <table className="inspection-table additional-table">
              <thead>
                <tr>
                  <th className="item-head">ITEM</th>
                  <th className="good-head">Baik</th>
                  <th className="bad-head">Rusak / Tidak<br />sesuai standart</th>
                  <th className="note-head">Ket</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: barisTambahan }).map((_, idx) => {
                  const cat = itemsCatatan[idx];
                  return (
                    <tr key={`tambahan-${idx}`}>
                      <td>{cat?.label || ""}</td>
                      <td className="check">
                        {cat?.kondisi === "Baik" ? "✓" : ""}
                      </td>
                      <td>
                        {cat &&
                        (cat.kondisi === "Rusak Ringan" ||
                          cat.kondisi === "Rusak Berat")
                          ? "✓"
                          : ""}
                      </td>
                      <td>{cat?.keterangan || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="notes-section">
          <div className="notes-label">Catatan :</div>
          <div className="notes-box"></div>
        </section>

        <table className="trip-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Tujuan</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <section className="signatures">
          <div className="signature-block left-sign">
            <div className="signature-title">Penanggung Jawab</div>
            <div className="signature-space"></div>
            <div className="signature-name">{penanggungJawab || "Penanggung Jawab"}</div>
          </div>
          <div className="signature-block right-sign">
            <div className="signature-title">Kepala Subseksi Sumberdaya</div>
            <div className="signature-space"></div>
            <div className="signature-name">Zulkifli, S.I.P</div>
          </div>
        </section>
      </section>
    </div>
  );
}