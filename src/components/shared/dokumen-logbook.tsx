"use client";

/**
 * Komponen dokumen "Logbook Perjalanan Dinas" (pratinjau + cetak).
 *
 * Ditempel di bawah halaman detail logbook (`/operator/logbook/[id]`) lalu
 * dicetak lewat `window.print()` — pola yang sama dengan dokumen Berita
 * Acara dan Laporan Checklist. Inti dokumen: ringkasan perjalanan serta
 * kondisi unit **sebelum dan sesudah** perjalanan (BBM, endurance untuk
 * armada laut, kilometer untuk armada darat).
 *
 * Struktur & gaya memakai kelas `ba-` dari `berita-acara-print.css`
 * ditambah kelas `dc-` dari `dokumen-cetak-print.css`.
 */

import { KOP_SURAT } from "@/config/kop-surat";
import {
  isArmadaLaut,
  formatEndurance,
  formatMenit,
  formatTanggal,
  selisihEndurance,
  selisihKm,
  tanggalTeks,
  type LogbookPerjalanan,
} from "@/components/shared/mock-data";
import { KopSuratDokumen } from "@/components/shared/kop-surat-dokumen";
import type { InfoUnitDokumen } from "@/components/shared/dokumen-checklist";

export interface DokumenLogbookProps {
  log: LogbookPerjalanan;
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

/** Sel tabel kondisi — tampilkan "-" bila kosong. */
function SelNilai({ nilai }: { nilai?: string }) {
  const tampil = (nilai ?? "").trim();
  return <td className="ba-center">{tampil || "-"}</td>;
}

export function DokumenLogbook({ log, unit }: DokumenLogbookProps) {
  const tanggalDoc = tanggalTeks(log.tanggal);
  const laut = isArmadaLaut(log.kategoriUnit);

  // Durasi perjalanan (jam dinding) bila jam berangkat & kembali terisi.
  let durasi = "-";
  if (log.jamBerangkat && log.jamKembali) {
    const [jh, jm] = log.jamBerangkat.split(":").map(Number);
    const [kh, km] = log.jamKembali.split(":").map(Number);
    const selisih = kh * 60 + km - (jh * 60 + jm);
    durasi = formatMenit(selisih > 0 ? selisih : 0);
  }

  const terpakaiEndurance = selisihEndurance(
    log.enduranceAwal,
    log.enduranceAkhir
  );
  const jarakKm = selisihKm(log.kmSebelum, log.kmSesudah);

  // BBM terpakai bila sebelum & sesudah terisi (format teks persen).
  let bbmTerpakai = "";
  if (log.bbmSebelum && log.bbmSesudah) {
    const sebelum = parseInt(log.bbmSebelum);
    const sesudah = parseInt(log.bbmSesudah);
    const diff = sebelum - sesudah;
    if (diff > 0) bbmTerpakai = `${diff}% terpakai`;
  }

  return (
    <div className="ba-doc">
      <section className="ba-sheet" aria-label="Logbook Perjalanan Dinas">
        <KopSuratDokumen />

        <main>
          <h1 className="ba-doc-title">Logbook Perjalanan Dinas</h1>
          <p className="ba-doc-number">Unit : {log.jenisUnit}</p>

          <p className="ba-intro">
            Pada hari ini, <strong><em>{tanggalDoc?.hari}</em></strong> Tanggal{" "}
            <strong><em>{tanggalDoc?.tanggal}</em></strong> Bulan{" "}
            <strong><em>{tanggalDoc?.bulan}</em></strong> Tahun{" "}
            <strong><em>{tanggalDoc?.tahunKata}</em></strong>, telah dilakukan
            perjalanan dinas menggunakan <strong>{log.jenisUnit}</strong> dengan
            rute <strong>{log.rute || "-"}</strong> menuju{" "}
            <strong>{log.tujuan || "-"}</strong>. Pencatatan logbook sebagai
            berikut :
          </p>

          <p className="ba-section-heading">
            1.&nbsp;&nbsp;Informasi perjalanan
          </p>

          <table className="dc-info-table" aria-label="Informasi perjalanan">
            <tbody>
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
              <BarisInfo label="Tanggal" nilai={formatTanggal(log.tanggal)} />
              <BarisInfo label="Jam Berangkat" nilai={log.jamBerangkat} />
              <BarisInfo label="Jam Kembali" nilai={log.jamKembali} />
              <BarisInfo label="Durasi" nilai={durasi !== "-" ? durasi : ""} />
              <BarisInfo label="Rute" nilai={log.rute} />
              <BarisInfo label="Tujuan" nilai={log.tujuan} />
              <BarisInfo
                label={laut ? "Nahkoda" : "Pengemudi"}
                nilai={log.nahkoda}
              />
              <BarisInfo
                label="Jumlah Personel"
                nilai={`${log.jumlahPersonel} orang`}
              />
              <BarisInfo label="Status Penggunaan" nilai={log.status} />
              {log.catatan.trim() !== "" && (
                <BarisInfo label="Catatan" nilai={log.catatan} />
              )}
            </tbody>
          </table>

          <h2 className="ba-analysis-heading">
            2.&nbsp; Kondisi unit sebelum dan sesudah perjalanan :
          </h2>

          <table
            className="ba-data-table"
            aria-label="Kondisi unit sebelum dan sesudah perjalanan"
          >
            <colgroup>
              <col style={{ width: "31%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "23%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Uraian</th>
                <th>Sebelum</th>
                <th>Sesudah</th>
                <th>Selisih</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ba-item-name">Tinggi BBM</td>
                <SelNilai nilai={log.bbmSebelum} />
                <SelNilai nilai={log.bbmSesudah} />
                <SelNilai nilai={bbmTerpakai} />
              </tr>
              {laut && (
                <tr>
                  <td className="ba-item-name">Endurance (jam operasi)</td>
                  <SelNilai
                    nilai={
                      log.enduranceAwal
                        ? formatEndurance(log.enduranceAwal)
                        : ""
                    }
                  />
                  <SelNilai
                    nilai={
                      log.enduranceAkhir
                        ? formatEndurance(log.enduranceAkhir)
                        : ""
                    }
                  />
                  <SelNilai
                    nilai={
                      terpakaiEndurance !== null
                        ? `${formatMenit(terpakaiEndurance)} terpakai`
                        : ""
                    }
                  />
                </tr>
              )}
              {!laut && (
                <tr>
                  <td className="ba-item-name">Kilometer (odometer)</td>
                  <SelNilai
                    nilai={log.kmSebelum ? `${log.kmSebelum} km` : ""}
                  />
                  <SelNilai
                    nilai={log.kmSesudah ? `${log.kmSesudah} km` : ""}
                  />
                  <SelNilai
                    nilai={jarakKm !== null ? `${jarakKm} km jarak tempuh` : ""}
                  />
                </tr>
              )}
            </tbody>
          </table>

          <p className="ba-closing">
            Demikian logbook perjalanan ini dicatat dengan sebenar-benarnya
            sebagai dokumentasi penggunaan armada {KOP_SURAT.namaInstansi}.{" "}
            {log.status !== "Selesai" && (
              <>
                Pencatatan belum selesai — kondisi akhir akan dilengkapi saat
                armada kembali.{" "}
              </>
            )}
            Atas perhatian dan kerja samanya kami ucapkan terima kasih.
          </p>

          <div className="ba-signature">
            <div className="ba-signature-box">
              <p>Dibuat oleh,</p>
              <p className="ba-signature-role">
                {laut ? "Nahkoda" : "Pengemudi"}
              </p>
              <div className="ba-signature-space" aria-hidden="true" />
              <p className="ba-signature-name">{log.nahkoda}</p>
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
