"use client";

/**
 * Komponen dokumen Berita Acara (pratinjau + hasil cetak).
 *
 * Struktur, tipografi, dan tata letak komponen ini merupakan padanan 1:1
 * dari template acuan `berita-acara-basarnas-lengkap.html`:
 *
 * - Lembar surat : kop surat, judul, nomor, paragraf pembuka, tabel
 *                  "Informasi Kendala", hasil pemeriksaan / analisa,
 *                  paragraf penutup, dan blok tanda tangan.
 * - Lembar dokumentasi : foto-foto bukti pemeriksaan.
 *
 * Isi surat mengalir sebagai satu kesatuan: butir analisa, paragraf
 * penutup, dan tanda tangan tidak dipisahkan oleh pemenggalan halaman.
 * Halaman baru hanya muncul bila isi benar-benar tidak muat (dicetak oleh
 * browser), dan halaman dokumentasi selalu dimulai di halaman baru.
 *
 * Seluruh gaya diambil dari `berita-acara-print.css` (satuan mm/pt) sehingga
 * hasil cetak di browser identik dengan hasil cetak template acuan.
 */

import { KOP_SURAT } from "@/config/kop-surat";
import type { BarisKendala } from "@/components/shared/mock-data";

export interface DokumenBeritaAcaraProps {
  /** Nama aset yang diperiksa (dipakai di judul & paragraf pembuka). */
  namaAset: string;
  /** Nomor berita acara; bila kosong dipakai garis isian. */
  nomor: string;
  /** Tanggal dalam bahasa Indonesia (hasil `tanggalTeks`). */
  tanggal: {
    hari: string;
    tanggal: string;
    bulan: string;
    tahunKata: string;
  } | null;
  /** Baris tabel "Informasi Kendala". */
  kendala: BarisKendala[];
  /** Butir hasil pemeriksaan / analisa (sudah dalam bentuk kalimat). */
  butirAnalisa: string[];
  /** Foto bukti (base64 / URL) untuk halaman dokumentasi. */
  fotoBukti: string[];
  /** Nama & jabatan penanda tangan kiri ("Mengajukan"). */
  pengajuNama: string;
  pengajuJabatan: string;
  /** Nama & jabatan penanda tangan kanan ("Yang Melaporkan"). */
  pelaporNama: string;
  pelaporJabatan: string;
}

/** Buang frasa penutup yang/redundan dari kolom "Keterangan". */
function ringkasKeterangan(keterangan: string): string {
  return keterangan
    .replace(
      /\s*[,.]\s*perlu\s+(di\s*ganti|di\s*servis|di\s*service|ganti|servis|service|diperbaiki|di\s*perbaiki|perbaikan)\s*[.]?\s*$/i,
      ""
    )
    .replace(/\s*[.]\s*$/, "")
    .trim();
}

/** Huruf pertama lowered-case, kecuali bila kata pertama berupa akronim. */
function hurufAwalKecil(teks: string): string {
  const kataAwal = teks.split(/\s+/)[0] ?? "";
  if (kataAwal.length > 1 && kataAwal === kataAwal.toUpperCase()) return teks;
  return teks.charAt(0).toLowerCase() + teks.slice(1);
}

/**
 * Susun kalimat analisa untuk satu baris kendala.
 *
 * Mengikuti gaya template acuan, contoh:
 * "Mesin perlu di service karena di temukan beberapa kebocoran oli ...".
 * Bila keterangan tidak menyebut tindakan, dipakai kata "diperbaiki".
 */
export function kalimatAnalisa(k: BarisKendala): string {
  const label = k.label.trim();
  const asli = (k.keterangan ?? "").trim();
  const ringkas = hurufAwalKecil(ringkasKeterangan(asli));

  if (/ganti/i.test(asli)) {
    return ringkas ? `${label} perlu di ganti, ${ringkas}` : `${label} perlu di ganti`;
  }
  if (/servis|service/i.test(asli)) {
    return ringkas ? `${label} perlu di service, ${ringkas}` : `${label} perlu di service`;
  }
  return ringkas ? `${label} perlu diperbaiki, ${ringkas}` : `${label} perlu diperbaiki`;
}

/**
 * Butir hasil pemeriksaan / analisa.
 *
 * Bila operator sudah mengisi uraian manual (satu baris = satu butir),
 * uraian manual yang dipakai. Bila belum, butir dibuat otomatis dari
 * baris tabel "Informasi Kendala" supaya dokumen tetap utuh.
 */
export function susunButirAnalisa(
  uraian: string,
  kendala: BarisKendala[]
): string[] {
  const manual = (uraian ?? "")
    .split(/\r?\n/)
    .map((baris) => baris.trim())
    .filter((baris) => baris.length > 0);

  if (manual.length > 0) return manual;
  return kendala.map(kalimatAnalisa);
}

export function DokumenBeritaAcara({
  namaAset,
  nomor,
  tanggal,
  kendala,
  butirAnalisa,
  fotoBukti,
  pengajuNama,
  pengajuJabatan,
  pelaporNama,
  pelaporJabatan,
}: DokumenBeritaAcaraProps) {
  const nomorTampil = nomor.trim() || "...............................................";

  return (
    <div className="ba-doc">
      {/* ── SURAT: KOP, IDENTITAS BERITA ACARA, TABEL, ANALISA, PENUTUP ──── */}
      <section className="ba-sheet ba-letter" aria-label="Berita Acara">
        <header className="ba-kop">
          <div className="ba-kop-brand" aria-label="Logo BASARNAS">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="ba-kop-logo"
              src="/Logo_Basarnas.png"
              alt="Logo BASARNAS"
            />
            <div className="ba-kop-brand-name">BASARNAS</div>
          </div>

          <div className="ba-kop-main">
            <div className="ba-instansi-utama">{KOP_SURAT.instansiUtama}</div>
            <div className="ba-instansi-daerah">{KOP_SURAT.instansiDaerah}</div>

            <div className="ba-kop-info">
              <div className="ba-kop-address">
                {KOP_SURAT.alamat.map((baris) => (
                  <p key={baris}>{baris}</p>
                ))}
                <p>
                  http&nbsp;&nbsp;&nbsp;:{" "}
                  <a
                    href="https://www.basarnas.go.id"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {KOP_SURAT.situs}
                  </a>
                </p>
                <p>
                  E-Mail :{" "}
                  <a href={`mailto:${KOP_SURAT.surel}`}>{KOP_SURAT.surel}</a>
                </p>
              </div>
              <div className="ba-kop-contact">
                <p className="ba-contact-line">
                  <span>Tlp</span>
                  <span className="ba-colon">:</span>
                  <span>{KOP_SURAT.telepon}</span>
                </p>
                <p className="ba-contact-line">
                  <span>Fax</span>
                  <span className="ba-colon">:</span>
                  <span>{KOP_SURAT.faks}</span>
                </p>
                <p className="ba-contact-line">
                  <span>Emergency</span>
                  <span className="ba-colon">:</span>
                  <span>{KOP_SURAT.emergency}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <main>
          <h1 className="ba-doc-title">
            Berita Acara Perbaikkan {namaAset}
          </h1>
          <p className="ba-doc-number">Nomor: {nomorTampil}</p>

          <p className="ba-intro">
            Pada hari ini, <strong><em>{tanggal?.hari}</em></strong> Tanggal{" "}
            <strong><em>{tanggal?.tanggal}</em></strong> Bulan{" "}
            <strong><em>{tanggal?.bulan}</em></strong> Tahun{" "}
            <strong><em>{tanggal?.tahunKata}</em></strong>, telah dilakukan
            Pemeriksaan/pengecekan oleh Penanggung jawab{" "}
            <strong>{namaAset}</strong>. Hasil pengecekan sebagai berikut :
          </p>

          <p className="ba-section-heading">1.&nbsp;&nbsp;Informasi kendala</p>

          <table className="ba-data-table" aria-label="Informasi kendala kendaraan">
            <colgroup>
              <col style={{ width: "6.5%" }} />
              <col style={{ width: "34.3%" }} />
              <col style={{ width: "17.8%" }} />
              <col style={{ width: "16.6%" }} />
              <col style={{ width: "24.8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>NO</th>
                <th>Nama Barang</th>
                <th>Merk/Type</th>
                <th>Jumlah</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {kendala.map((k, idx) => (
                <tr key={idx}>
                  <td className="ba-center">{idx + 1}</td>
                  <td className="ba-item-name">{k.label}</td>
                  <td className="ba-center">{k.merk}</td>
                  <td className="ba-center">{k.jumlah}</td>
                  <td className="ba-center">{k.keterangan}</td>
                </tr>
              ))}
              {kendala.length === 0 && (
                <tr>
                  <td className="ba-center" colSpan={5}>
                    Tidak ada kendala.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <h2 className="ba-analysis-heading">
            2.&nbsp; Hasil pemeriksaan / Analisa :
          </h2>
          <ol className="ba-analysis-list" type="a">
            {butirAnalisa.map((butir, idx) => (
              <li key={idx}>{butir}</li>
            ))}
          </ol>

          <p className="ba-closing">
            Dengan ini Kami mengajukan Berita Acara Perbaikan Kendaraan{" "}
            {namaAset} dimana pada saat ini Kendaraan Tersebut perlu perbaikan.
            Demikian surat permohonan kami, atas bantuan dan dukungannya kami
            ucapkan terima kasih.
          </p>

          <div className="ba-signature">
            <div className="ba-signature-box">
              <p>Mengajukan,</p>
              <p className="ba-signature-role">{pengajuJabatan}</p>
              <div className="ba-signature-space" aria-hidden="true" />
              <p className="ba-signature-name">{pengajuNama}</p>
              <p>{pengajuJabatan}</p>
            </div>
            <div className="ba-signature-box">
              <p>Yang Melaporkan,</p>
              <p className="ba-signature-role">Penanggung Jawab Kendaraan</p>
              <div className="ba-signature-space" aria-hidden="true" />
              <p className="ba-signature-name">{pelaporNama}</p>
              <p>{pelaporJabatan}</p>
            </div>
          </div>
        </main>
      </section>

      {/* ── DOKUMENTASI (dimulai di halaman baru) ───────────────────────── */}
      <section className="ba-sheet ba-doc-page" aria-label="Dokumentasi">
        <h2 className="ba-documentation-title">DOKUMENTASI</h2>
        <p className="ba-documentation-note">
          Foto di bawah merupakan dokumentasi kondisi kendaraan yang diperiksa.
        </p>
        <div className="ba-doc-grid">
          {fotoBukti.map((foto, idx) => (
            <figure className="ba-doc-item" key={idx}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt={kendala[idx]?.label ?? `Bukti ${idx + 1}`} />
              <figcaption>
                {kendala[idx]?.label ?? `Dokumentasi ${idx + 1}`}
              </figcaption>
            </figure>
          ))}
        </div>
        {fotoBukti.length === 0 && (
          <p className="ba-documentation-note">Belum ada dokumentasi foto.</p>
        )}
      </section>
    </div>
  );
}
