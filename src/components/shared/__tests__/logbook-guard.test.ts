import {
  alasanUnitDipakai,
  checkAsetRusakBerat,
} from "../logbook-guard";
import type { Aset, LogbookPerjalanan, KategoriAset } from "../mock-data";

function aset(over: Partial<Aset> = {}): Aset {
  return {
    id: "ast-032",
    nama: "Rigid Inflatable Boat (RIB) Kelas I",
    kode: "3020303040-000002",
    nup: "000002",
    kategori: "Kapal" as KategoriAset,
    status: "Standby",
    lokasi: "Pos SAR Majene",
    tanggalPenetapan: "2024-01-01",
    gambar: "",
    kondisi: "Baik",
    penanggungJawab: "198212022007121002",
    riwayat: [],
    ...over,
  };
}

function logbook(over: Partial<LogbookPerjalanan> = {}): LogbookPerjalanan {
  return {
    id: "lp-1",
    tanggal: "2026-11-20",
    jamBerangkat: "07:00",
    jamKembali: "12:00",
    rute: "Mamuju",
    tujuan: "Patroli",
    jenisUnit: "3020303040-000002",
    nahkoda: "Operator",
    jumlahPersonel: 2,
    bbmSebelum: "100%",
    bbmSesudah: "50%",
    status: "Selesai",
    catatan: "",
    ...over,
  };
}

describe("alasanUnitDipakai — guard hasil pindai QR logbook", () => {
  it("memblokir unit ber-kondisi Rusak Ringan (kasus ast-032)", () => {
    const asets = [aset({ kondisi: "Rusak Ringan", status: "Rusak Ringan" })];
    const pesan = alasanUnitDipakai("3020303040-000002", asets, []);
    expect(pesan).toContain("Rusak Ringan");
  });

  it("memblokir unit ber-kondisi Rusak Berat", () => {
    const asets = [aset({ kondisi: "Rusak Berat", status: "Rusak Berat" })];
    expect(alasanUnitDipakai("3020303040-000002", asets, [])).toContain(
      "Rusak Berat"
    );
  });

  it("memblokir lewat status meski kondisi masih Baik", () => {
    const asets = [aset({ kondisi: "Baik", status: "Rusak Ringan" })];
    expect(alasanUnitDipakai("3020303040-000002", asets, [])).not.toBeNull();
  });

  it("mengizinkan unit baik yang belum dipakai", () => {
    expect(alasanUnitDipakai("3020303040-000002", [aset()], [])).toBeNull();
  });

  it("memblokir unit yang punya logbook berstatus Sedang Digunakan", () => {
    const logbooks = [logbook({ status: "Sedang Digunakan" })];
    expect(alasanUnitDipakai("3020303040-000002", [aset()], logbooks)).toContain(
      "dipakai"
    );
  });

  it("memblokir unit ber-status Menunggu Penggunaan", () => {
    const logbooks = [logbook({ status: "Menunggu Penggunaan" })];
    expect(alasanUnitDipakai("3020303040-000002", [aset()], logbooks)).toContain(
      "dipakai"
    );
  });

  it("mengizinkan unit yang logbook terakhirnya sudah Selesai", () => {
    const logbooks = [logbook({ status: "Selesai" })];
    expect(alasanUnitDipakai("3020303040-000002", [aset()], logbooks)).toBeNull();
  });

  it("tidak terkecoh logbook milik unit lain", () => {
    const lain = aset({
      id: "ast-099",
      kode: "9999999999-000001",
      nama: "Kapal Patrol",
    });
    const logbooks = [
      logbook({ status: "Sedang Digunakan", jenisUnit: lain.kode }),
    ];
    expect(
      alasanUnitDipakai("3020303040-000002", [aset(), lain], logbooks)
    ).toBeNull();
    // Sebaliknya, unit pemilik logbook itu sendiri tetap diblokir.
    expect(
      alasanUnitDipakai(lain.kode, [aset(), lain], logbooks)
    ).toContain("dipakai");
  });

  it("menerima nama unit sebagai alternatif kode (sesuai bacaan query QR)", () => {
    const asets = [aset({ kondisi: "Rusak Ringan" })];
    expect(
      alasanUnitDipakai("Rigid Inflatable Boat (RIB) Kelas I", asets, [])
    ).toContain("Rusak Ringan");
  });

  it("memblokir unit yang tidak dikenal, bukan membiarkan form kosong terbuka", () => {
    const pesan = alasanUnitDipakai("kode-tidak-ada", [aset()], []);
    expect(pesan).toContain("tidak ditemukan");
  });
});

describe("checkAsetRusakBerat", () => {
  it("null untuk unit tidak dikenal", () => {
    expect(checkAsetRusakBerat("kode-tidak-ada", [aset()])).toBeNull();
  });

  it("null untuk unit baik", () => {
    expect(checkAsetRusakBerat("3020303040-000002", [aset()])).toBeNull();
  });

  it("pesan untuk unit rusak", () => {
    const asets = [aset({ kondisi: "Rusak Berat", status: "Rusak Berat" })];
    expect(checkAsetRusakBerat("3020303040-000002", asets)).toContain(
      "Tidak dapat meminjam"
    );
  });
});
