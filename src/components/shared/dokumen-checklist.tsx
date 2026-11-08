"use client";

/**
 * Komponen dokumen "Laporan Hasil Checklist Perawatan" (pratinjau + cetak).
 *
 * Ditempel di bawah halaman detail checklist (`/operator/checklist/[id]`)
 * lalu dicetak lewat `window.print()` — pola yang sama dengan dokumen
 * Berita Acara. Struktur & gaya memakai kelas `ba-` dari
 * `berita-acara-print.css` (lembar A4, kop surat, tabel data, tanda tangan)
 * ditambah kelas `dc-` dari `dokumen-cetak-print.css`.
 *
 * Dokumen ditata oleh refleksi data checklist yang sudah tersimpan — tidak
 * ada nilai yang dihitung ulang di luar penghitungan jumlah kondisi item.
 */

import { KOP_SURAT } from "@/config/kop-surat";
import {
  tanggalTeks,
  type ChecklistHarian,
} from "@/components/shared/mock-data";
import { KopSuratDokumen } from "@/components/shared/kop-surat-dokumen";

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

export function DokumenChecklist({
  checklist,
  templateNama,
  unit,
}: DokumenChecklistProps) {
  const tanggalDoc = tanggalTeks(checklist.tanggal);

  const semuaItem = checklist.items;
  const baik = semuaItem.filter((i) => i.kondisi === "Baik").length;
  const rusakRingan = semuaItem.filter(
    (i) => i.kondisi === "Rusak Ringan"
  ).length;
  const rusakBerat = semuaItem.filter((i) => i.kondisi === "Rusak Berat").length;
  const belum = semuaItem.filter((i) => i.kondisi === "Belum Diperiksa").length;
  const adaRusak = rusakRingan > 0 || rusakBerat > 0;

  return (
    <div className="ba-doc">
      <section
        className="ba-sheet"
        aria-label="Laporan Hasil Checklist Perawatan"
      >
        <KopSuratDokumen />

        <main>
          <h1 className="ba-doc-title">Laporan Hasil Checklist Perawatan</h1>
          <p className="ba-doc-number">Unit : {checklist.unit}</p>

          <p className="ba-intro">
            Pada hari ini, <strong><em>{tanggalDoc?.hari}</em></strong> Tanggal{" "}
            <strong><em>{tanggalDoc?.tanggal}</em></strong> Bulan{" "}
            <strong><em>{tanggalDoc?.bulan}</em></strong> Tahun{" "}
            <strong><em>{tanggalDoc?.tahunKata}</em></strong>, telah dilakukan
            pemeriksaan checklist perawatan terhadap{" "}
            <strong>{checklist.unit}</strong>. Hasil pemeriksaan sebagai
            berikut :
          </p>

          <p className="ba-section-heading">1.&nbsp;&nbsp;Informasi unit</p>

          <table className="dc-info-table" aria-label="Informasi unit">
            <tbody>
              <BarisInfo label="Nama Unit" nilai={checklist.unit} />
              <BarisInfo
                label="Nama Referensi"
                nilai={unit?.namaReferensi ?? unit?.nama}
              />
              <BarisInfo
                label="Merk / Tipe"
                nilai={
                  unit?.merk || unit?.tipe
                    ? [unit?.merk, unit?.tipe].filter(Boolean).join(" / ")
                    : undefined
                }
              />
              <BarisInfo label="Kode Barang" nilai={unit?.kode} />
              <BarisInfo label="NUP" nilai={unit?.nup} />
              <BarisInfo label="Lokasi" nilai={unit?.lokasi} />
              <BarisInfo label="Template Checklist" nilai={templateNama} />
              <BarisInfo label="Pemeriksa" nilai={checklist.pemeriksa} />
              <BarisInfo label="Status Pengisian" nilai={checklist.status} />
            </tbody>
          </table>

          <h2 className="ba-analysis-heading">2.&nbsp; Ringkasan hasil :</h2>
          <ol className="ba-analysis-list" type="a">
            <li>
              Item yang diperiksa {checklist.itemChecked} dari{" "}
              {checklist.itemTotal} ({belum === 0 ? "lengkap" : "belum lengkap"}
              ).
            </li>
            <li>
              Kondisi baik : {baik} item.
              {adaRusak && (
                <>
                  {" "}
                  Rusak ringan {rusakRingan} item, rusak berat {rusakBerat}{" "}
                  item.
                </>
              )}
            </li>
            {belum > 0 && <li>Item yang belum diperiksa : {belum} item.</li>}
            {checklist.catatan.trim() !== "" && (
              <li>Catatan pemeriksa : {checklist.catatan}</li>
            )}
          </ol>

          <p className="ba-section-heading">
            3.&nbsp;&nbsp;Rincian item pemeriksaan
          </p>

          <table className="ba-data-table" aria-label="Rincian item pemeriksaan">
            <colgroup>
              <col style={{ width: "6.5%" }} />
              <col style={{ width: "42.5%" }} />
              <col style={{ width: "13.5%" }} />
              <col style={{ width: "15.5%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>NO</th>
                <th>Item Pemeriksaan</th>
                <th>Status</th>
                <th>Kondisi</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {semuaItem.map((item, idx) => (
                <tr key={`${item.label}-${idx}`}>
                  <td className="ba-center">{idx + 1}</td>
                  <td className="ba-item-name">{item.label}</td>
                  <td className="ba-center">
                    {item.wajib ? "Wajib" : "Opsional"}
                  </td>
                  <td className="ba-center">{item.kondisi}</td>
                  <td className="ba-center">{item.keterangan || "-"}</td>
                </tr>
              ))}
              {semuaItem.length === 0 && (
                <tr>
                  <td className="ba-center" colSpan={5}>
                    Belum ada item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="ba-closing">
            Demikian laporan hasil checklist perawatan unit {checklist.unit}{" "}
            ini dibuat dengan sebenar-benarnya sebagai dokumentasi kondisi unit{" "}
            untuk menjaga kesiapsiagaan armada{" "}
            {KOP_SURAT.namaInstansi}.{" "}
            {(rusakRingan > 0 || rusakBerat > 0) && (
              <>
                Untuk item yang rusak, telah dibuat Berita Acara Perbaikan
                sebagai kelanjutan proses perawatan.{" "}
              </>
            )}
            Atas perhatian dan kerja samanya kami ucapkan terima kasih.
          </p>

          <div className="ba-signature">
            <div className="ba-signature-box">
              <p>Yang Melaporkan,</p>
              <p className="ba-signature-role">Penanggung Jawab Unit</p>
              <div className="ba-signature-space" aria-hidden="true" />
              <p className="ba-signature-name">{checklist.pemeriksa}</p>
            </div>
            <div className="ba-signature-box">
              <p>Mengetahui,</p>
              <p className="ba-signature-role">Kepala Subseksi Sumber Daya</p>
              <div className="ba-signature-space" aria-hidden="true" />
              <p className="ba-signature-name">Zulkfli S.I.P</p>
              <p>Penata Muda Tk.I (III/b)</p>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
