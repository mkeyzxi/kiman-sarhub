/**
 * Data kop surat BASARNAS Kantor Pencarian dan Pertolongan Mamuju.
 *
 * Nilai diambil apa adanya dari template acuan
 * `berita-acara-basarnas-lengkap.html` supaya hasil cetak berita acara
 * identik dengan template tersebut.
 */

export const KOP_SURAT = {
  /** Nama badan/instansi (baris 1 kop surat). */
  instansiUtama: "BADAN NASIONAL PENCARIAN DAN PERTOLONGAN",
  /** Nama kantor/unit (baris 2 kop surat). */
  instansiDaerah: "KANTOR PENCARIAN DAN PERTOLONGAN MAMUJU",
  /** Nama instansi untuk judul dokumen (digabung ke judul berita acara). */
  namaInstansi: "Kantor Pencarian dan Pertolongan Mamuju",
  /** Alamat kantor (baris-baris di kop surat). */
  alamat: [
    "Jl. Poros Trans Sulawesi Barat Lingkar",
    "Dua Bandara Tampa Padang mamuju",
    "Mamuju, sulawesi Barat 91561 Indonesia",
  ],
  /** Alamat situs resmi (dengan label "http"). */
  situs: "www.basarnas.go.id",
  /** Surel resmi kantor. */
  surel: "kansar.mamuju@gmail.com",
  /** Nomor telepon / faks / emergency call. */
  telepon: "(0426)2332181",
  faks: "(0426)2332181",
  emergency: "(0426)2332181, 115",
} as const;
