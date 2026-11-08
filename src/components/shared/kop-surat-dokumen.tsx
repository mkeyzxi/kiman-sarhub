"use client";

/**
 * Kop surat BASARNAS Kantor SAR Mamuju — komponen bersama untuk semua dokumen
 * cetak (berita acara, laporan checklist, logbook).
 *
 * Struktur dan gaya memakai kelas `ba-` dari `berita-acara-print.css`
 * (satuan mm/pt) sehingga hasil cetak setiap dokumen identik satu sama lain.
 */

import { KOP_SURAT } from "@/config/kop-surat";

export function KopSuratDokumen() {
  return (
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
  );
}
