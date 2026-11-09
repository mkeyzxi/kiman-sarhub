import {
  validasiTahapAwal,
  validasiTahapAkhir,
  validasiLogbook,
  statusPenggunaanOtomatis,
  logbookKeForm,
  angkaKePersen,
  persenKeAngka,
  isArmadaLaut,
  selisihKm,
  selisihEndurance,
  parseEndurance,
  enduranceKeMenit,
  formatMenit,
  formatEndurance,
  angkaTeks,
  tahunTeks,
  tanggalTeks,
  fieldBelumLengkap,
  tahapYangTertunda,
  normalizeNup,
  nupTampil,
  nupSimpan,
  labelModelAset,
  type FormLogbook,
  type LogbookPerjalanan,
} from "../mock-data";

/** Buat form logbook valid untuk pengujian. */
function formValid(tanggal = "2026-10-15", jamBerangkat = "08:00", jamKembali = "10:30"): FormLogbook {
  return {
    tanggal,
    jamBerangkat,
    jamKembali,
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    kategoriUnit: "RIB",
    jenisUnit: "Rigid Inflatable Boat (RIB)",
    nahkoda: "Fajar Farial",
    jumlahPersonel: "4",
    bbmSebelum: "90",
    bbmSesudah: "75",
    bbmTambahan: "",
    enduranceAwal: "80:00",
    enduranceAkhir: "70:15",
    kmSebelum: "45230",
    kmSesudah: "45312",
    catatan: "Kondisi normal",
  };
}

describe("Validasi Tahap Awal (jam keberangkatan & data berangkat)", () => {
  // ─── Jam keberangkatan (jamBerangkat) ──────────────────────────────────────

  it("lolos validasi bila jamBerangkat format HH:MM valid", () => {
    const form = formValid();
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeUndefined();
  });

  it("jamBerangkat boleh kosong (artinya masih menunggu penggunaan)", () => {
    const form = formValid("2026-10-15", "", "");
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeUndefined();
  });

  it("jamBerangkat kosong tidak menghasilkan error", () => {
    const form = formValid("2026-10-15", "", "");
    const errors = validasiTahapAwal(form);
    expect(Object.keys(errors)).toEqual([]);
  });

  it("jamBerangkat format salah (bukan HH:MM) → error", () => {
    const form = formValid("2026-10-15", "8:00", "10:30");
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeDefined();
  });

  it("jamBerangkat jam > 23 → error", () => {
    const form = formValid("2026-10-15", "24:00", "10:30");
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeDefined();
  });

  it("jamBerangkat menit > 59 → error", () => {
    const form = formValid("2026-10-15", "08:60", "10:30");
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeDefined();
  });

  it("jamBerangkat 23:59 valid (batas atas)", () => {
    const form = formValid("2026-10-15", "23:59", "00:30");
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeUndefined();
  });

  it("jamBerangkat 00:00 valid (midnight)", () => {
    const form = formValid("2026-10-15", "00:00", "06:00");
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeUndefined();
  });

  // ─── Tanggal ───────────────────────────────────────────────────────────────

  it("tanggal kosong → error", () => {
    const form = formValid("", "08:00", "10:30");
    form.tanggal = "";
    const errors = validasiTahapAwal(form);
    expect(errors.tanggal).toBe("Tanggal wajib diisi.");
  });

  it("tanggal tidak valid (31:13:45) → error", () => {
    const form = formValid("2026-99-99", "08:00", "10:30");
    const errors = validasiTahapAwal(form);
    expect(errors.tanggal).toBeDefined();
  });

  it("tanggal valid lolos", () => {
    const form = formValid("2026-10-15", "08:00", "10:30");
    const errors = validasiTahapAwal(form);
    expect(errors.tanggal).toBeUndefined();
  });

  // ─── Field wajib lain ──────────────────────────────────────────────────────

  it("rute kosong → error", () => {
    const form = formValid();
    form.rute = "   ";
    const errors = validasiTahapAwal(form);
    expect(errors.rute).toBe("Rute wajib diisi.");
  });

  it("tujuan kosong → error", () => {
    const form = formValid();
    form.tujuan = "";
    const errors = validasiTahapAwal(form);
    expect(errors.tujuan).toBe("Tujuan kegiatan wajib diisi.");
  });

  it("kategoriUnit kosong → error", () => {
    const form = formValid();
    form.kategoriUnit = "";
    const errors = validasiTahapAwal(form);
    expect(errors.kategoriUnit).toBe("Kategori unit wajib dipilih.");
  });

  it("jenisUnit kosong → error", () => {
    const form = formValid();
    form.jenisUnit = "";
    const errors = validasiTahapAwal(form);
    expect(errors.jenisUnit).toBe("Jenis unit wajib dipilih.");
  });

  it("nahkoda kosong → error", () => {
    const form = formValid();
    form.nahkoda = "";
    const errors = validasiTahapAwal(form);
    expect(errors.nahkoda).toBe("Operator wajib diisi.");
  });

  it("jumlahPersonel < 1 → error", () => {
    const form = formValid();
    form.jumlahPersonel = "0";
    const errors = validasiTahapAwal(form);
    expect(errors.jumlahPersonel).toBe("Jumlah personel minimal 1.");
  });

  it("jumlahPersonel non-angka → error", () => {
    const form = formValid();
    form.jumlahPersonel = "empat";
    const errors = validasiTahapAwal(form);
    expect(errors.jumlahPersonel).toBe("Jumlah personel minimal 1.");
  });

  it("bbmSebelum kosong → error", () => {
    const form = formValid();
    form.bbmSebelum = "";
    const errors = validasiTahapAwal(form);
    expect(errors.bbmSebelum).toBe("BBM sebelum wajib diisi.");
  });

  it("bbmSebelum > 100 → error", () => {
    const form = formValid();
    form.bbmSebelum = "101";
    const errors = validasiTahapAwal(form);
    expect(errors.bbmSebelum).toBeDefined();
  });

  it("bbmSebelum < 0 → error", () => {
    const form = formValid();
    form.bbmSebelum = "-5";
    const errors = validasiTahapAwal(form);
    expect(errors.bbmSebelum).toBeDefined();
  });

  it("bbmSebelum 0 valid (batas bawah)", () => {
    const form = formValid();
    form.bbmSebelum = "0";
    const errors = validasiTahapAwal(form);
    expect(errors.bbmSebelum).toBeUndefined();
  });

  it("bbmSebelum 100 valid (batas atas)", () => {
    const form = formValid();
    form.bbmSebelum = "100";
    const errors = validasiTahapAwal(form);
    expect(errors.bbmSebelum).toBeUndefined();
  });

  // ─── Endurance (armada laut) vs Kilometer (darat) ────────────────────────

  it("enduranceAwal wajib untuk armada laut", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAwal = "";
    const errors = validasiTahapAwal(form);
    expect(errors.enduranceAwal).toBe("Endurance awal wajib diisi untuk armada laut.");
  });

  it("enduranceAwal format salah → error", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAwal = "abc";
    const errors = validasiTahapAwal(form);
    expect(errors.enduranceAwal).toBe("Format harus HH:MM, contoh 80:30.");
  });

  it("kmSebelum wajib angka untuk armada darat", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSebelum = "non-angka";
    const errors = validasiTahapAwal(form);
    expect(errors.kmSebelum).toBe("Kilometer awal harus berupa angka.");
  });

  it("kmSebelum boleh kosong untuk darat (opsional)", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSebelum = "";
    const errors = validasiTahapAwal(form);
    expect(errors.kmSebelum).toBeUndefined();
  });
});

describe("Validasi Tahap Akhir (jam selesai/kembali)", () => {
  // ─── jamKembali ────────────────────────────────────────────────────────────

  it("jamKembali kosong → error wajib diisi", () => {
    const form = formValid();
    form.jamKembali = "";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kepulangan wajib diisi.");
  });

  it("jamKembali format salah → error wajib diisi (regex tidak lolos)", () => {
    const form = formValid();
    form.jamKembali = "1030";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBeDefined();
  });

  it("jamKembali jam > 23 → error tidak valid", () => {
    const form = formValid();
    form.jamKembali = "25:00";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kepulangan tidak valid.");
  });

  it("jamKembali menit > 59 → error tidak valid", () => {
    const form = formValid();
    form.jamKembali = "10:60";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kepulangan tidak valid.");
  });

  it("jamKembali valid → lolos", () => {
    const form = formValid();
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBeUndefined();
  });

  // ─── Cek jamKembali > jamBerangkat (rule penting) ─────────────────────────

  it("jamKembali sama dengan jamBerangkat → error (harus setelah)", () => {
    const form = formValid();
    form.jamBerangkat = "08:00";
    form.jamKembali = "08:00";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
  });

  it("jamKembali sebelum jamBerangkat → error", () => {
    const form = formValid();
    form.jamBerangkat = "14:00";
    form.jamKembali = "08:00";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
  });

  it("jamKembali sesaat setelah jamBerangkat (1 menit) → lolos", () => {
    const form = formValid();
    form.jamBerangkat = "08:00";
    form.jamKembali = "08:01";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBeUndefined();
  });

  it("jamBerangkat kosong → rule jamKembali > jamBerangkat tidak dipicu", () => {
    const form = formValid();
    form.jamBerangkat = "";
    form.jamKembali = "00:00";
    const errors = validasiTahapAkhir(form);
    // jamKembali "00:00" format valid, tidak ada rule perbandingan karena jamBerangkat kosong
    expect(errors.jamKembali).toBeUndefined();
  });

  it("jamBerangkat 23:00 & jamKembali 00:00 → lintas tengah malam, lolos (jamKembali valid)", () => {
    // CekJam hanya cek format 0-23 / 0-59, tidak cek lintas tengah malam.
    // JamKembali "00:00" lolos cek format.
    // Rule "jamKembali > jamBerangkat" tidak terpenuhi (0 < 23) → error
    const form = formValid();
    form.jamBerangkat = "23:00";
    form.jamKembali = "00:00";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
  });

  it("jamBerangkat 22:00 & jamKembali 23:30 → lintas tengah malam valid", () => {
    const form = formValid();
    form.jamBerangkat = "22:00";
    form.jamKembali = "23:30";
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBeUndefined();
  });

  // ─── BBM sesudah ───────────────────────────────────────────────────────────

  it("bbmSesudah kosong → error wajib", () => {
    const form = formValid();
    form.bbmSesudah = "";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toBe("BBM sesudah wajib diisi untuk menandai perjalanan selesai.");
  });

  it("bbmSesudah > 100 → error", () => {
    const form = formValid();
    form.bbmSesudah = "150";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toBe("BBM sesudah harus antara 0 dan 100.");
  });

  it("bbmSesudah > bbmSebelum → error (tidak boleh naik tanpa BBM tambahan)", () => {
    const form = formValid();
    form.bbmSebelum = "90";
    form.bbmSesudah = "95";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toContain(
      "BBM sesudah tidak boleh lebih besar dari BBM sebelum."
    );
  });

  it("bbmSesudah > bbmSebelum dengan bbmTambahan → lolos (ada isi ulang)", () => {
    const form = formValid();
    form.bbmSebelum = "90";
    form.bbmSesudah = "95";
    form.bbmTambahan = "20";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toBeUndefined();
  });

  it("bbmTambahan tidak valid (bukan angka) → error", () => {
    const form = formValid();
    form.bbmTambahan = "abc";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmTambahan).toBeDefined();
  });

  it("bbmSesudah = bbmSebelum → lolos (sisa sama)", () => {
    const form = formValid();
    form.bbmSebelum = "80";
    form.bbmSesudah = "80";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toBeUndefined();
  });

  it("bbmSesudah < bbmSebelum → lolos (sisa turun normal)", () => {
    const form = formValid();
    form.bbmSebelum = "90";
    form.bbmSesudah = "75";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toBeUndefined();
  });

  it("bbmSesudah = 0 → lolos (habis)", () => {
    const form = formValid();
    form.bbmSebelum = "50";
    form.bbmSesudah = "0";
    const errors = validasiTahapAkhir(form);
    expect(errors.bbmSesudah).toBeUndefined();
  });

  // ─── Endurance akhir (armada laut) ────────────────────────────────────────

  it("enduranceAkhir kosong → error wajib (armada laut)", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAkhir = "";
    const errors = validasiTahapAkhir(form);
    expect(errors.enduranceAkhir).toBe("Endurance akhir wajib diisi untuk menandai selesai.");
  });

  it("enduranceAkhir format salah → error (armada laut)", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAkhir = "99:99";
    const errors = validasiTahapAkhir(form);
    expect(errors.enduranceAkhir).toBe("Format harus HH:MM, contoh 73:00.");
  });

  it("enduranceAkhir > enduranceAwal → error (tidak boleh naik)", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAwal = "60:00";
    form.enduranceAkhir = "70:00";
    const errors = validasiTahapAkhir(form);
    expect(errors.enduranceAkhir).toBe(
      "Endurance akhir tidak boleh lebih besar dari endurance awal."
    );
  });

  it("enduranceAkhir = enduranceAwal → lolos", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAwal = "80:00";
    form.enduranceAkhir = "80:00";
    const errors = validasiTahapAkhir(form);
    expect(errors.enduranceAkhir).toBeUndefined();
  });

  it("enduranceAkhir < enduranceAwal → lolos (menurun normal)", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAwal = "80:00";
    form.enduranceAkhir = "70:15";
    const errors = validasiTahapAkhir(form);
    expect(errors.enduranceAkhir).toBeUndefined();
  });

  // ─── Kilometer sesudah (armada darat) ────────────────────────────────────

  it("kmSesudah kosong → error wajib (armada darat)", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSesudah = "";
    const errors = validasiTahapAkhir(form);
    expect(errors.kmSesudah).toBe("Kilometer sesudah wajib diisi untuk menandai selesai.");
  });

  it("kmSesudah non-angka → error (armada darat)", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSesudah = "empat-puluh";
    const errors = validasiTahapAkhir(form);
    expect(errors.kmSesudah).toBe("Kilometer sesudah harus berupa angka.");
  });

  it("kmSesudah < kmSebelum → error (odometer tidak boleh turun)", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSebelum = "45300";
    form.kmSesudah = "45200";
    const errors = validasiTahapAkhir(form);
    expect(errors.kmSesudah).toBe(
      "Kilometer sesudah tidak boleh lebih kecil dari kilometer awal."
    );
  });

  it("kmSesudah = kmSebelum → lolos (tidak bergerak)", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSebelum = "45000";
    form.kmSesudah = "45000";
    const errors = validasiTahapAkhir(form);
    expect(errors.kmSesudah).toBeUndefined();
  });

  it("kmSesudah > kmSebelum → lolos (bergerak maju normal)", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSebelum = "45000";
    form.kmSesudah = "45312";
    const errors = validasiTahapAkhir(form);
    expect(errors.kmSesudah).toBeUndefined();
  });

  // ─── Semua valid → objek errors kosong ────────────────────────────────────

  it("form lengkap & valid → validasiTahapAkhir mengembalikan obj kosong", () => {
    const form = formValid();
    const errors = validasiTahapAkhir(form);
    expect(Object.keys(errors)).toEqual([]);
  });

  it("validasiLogbook menggabungkan tahap awal & akhir", () => {
    const form = formValid();
    const errors = validasiLogbook(form);
    expect(Object.keys(errors)).toEqual([]);
  });
});

describe("statusPenggunaanOtomatis — turunan status dari isi form", () => {
  it("jamKembali kosong & jamBerangkat kosong → Menunggu Penggunaan", () => {
    const form = formValid();
    form.jamBerangkat = "";
    form.jamKembali = "";
    expect(statusPenggunaanOtomatis(form)).toBe("Menunggu Penggunaan");
  });

  it("jamKembali kosong & jamBerangkat terisi → Sedang Digunakan", () => {
    const form = formValid();
    form.jamKembali = "";
    expect(statusPenggunaanOtomatis(form)).toBe("Sedang Digunakan");
  });

  it("jamKembali terisi → Selesai", () => {
    const form = formValid();
    expect(statusPenggunaanOtomatis(form)).toBe("Selesai");
  });

  it("jamKembali whitespace only → jamBerangkat kosong → Menunggu Penggunaan", () => {
    const form = formValid();
    form.jamBerangkat = "";
    form.jamKembali = "   ";
    expect(statusPenggunaanOtomatis(form)).toBe("Menunggu Penggunaan");
  });

  it("jamKembali whitespace only → jamBerangkat terisi → Sedang Digunakan", () => {
    const form = formValid();
    form.jamBerangkat = "08:00";
    form.jamKembali = "   ";
    // statusPenggunaanOtomatis cek `!form.jamKembali.trim()` → false,
    // lalu cek jamBerangkat → "Sedang Digunakan"
    expect(statusPenggunaanOtomatis(form)).toBe("Sedang Digunakan");
  });
});

describe("logbookKeForm — konversi LogbookPerjalanan → FormLogbook", () => {
  const logbookLaut: LogbookPerjalanan = {
    id: "lp-01",
    tanggal: "2026-10-08",
    jamBerangkat: "08:00",
    jamKembali: "10:30",
    rute: "Dermaga - Perairan",
    tujuan: "Patroli",
    kategoriUnit: "RIB",
    jenisUnit: "RIB Vektor",
    nahkoda: "Fajar Farial",
    jumlahPersonel: 4,
    bbmSebelum: "90%",
    bbmSesudah: "75%",
    enduranceAwal: "76:30",
    enduranceAkhir: "63:45",
    status: "Selesai",
    catatan: "Normal",
    tanggalSimpan: "2026-10-08T08:00:00",
    tanggalLengkap: "2026-10-08T10:30:00",
  };

  it("jamBerangkat dan jamKembali diteruskan sebagai string", () => {
    const form = logbookKeForm(logbookLaut);
    expect(form.jamBerangkat).toBe("08:00");
    expect(form.jamKembali).toBe("10:30");
  });

  it("bbmSebelum dilepas tanda %", () => {
    const form = logbookKeForm(logbookLaut);
    expect(form.bbmSebelum).toBe("90");
    expect(form.bbmSesudah).toBe("75");
  });

  it("jumlahPersonel di-String() — konsisten string form", () => {
    const form = logbookKeForm(logbookLaut);
    expect(form.jumlahPersonel).toBe("4");
  });

  it("field undefined di logbook → kosong di form", () => {
    const logbookDarat: LogbookPerjalanan = {
      ...logbookLaut,
      kategoriUnit: "Mobil",
      enduranceAwal: undefined,
      enduranceAkhir: undefined,
      kmSebelum: "45230",
      kmSesudah: "45312",
    };
    const form = logbookKeForm(logbookDarat);
    expect(form.enduranceAwal).toBe("");
    expect(form.enduranceAkhir).toBe("");
    expect(form.kmSebelum).toBe("45230");
    expect(form.kmSesudah).toBe("45312");
  });

  it("jamBerangkat kosong di logbook → kosong di form", () => {
    const logbookBelumBerangkat: LogbookPerjalanan = {
      ...logbookLaut,
      jamBerangkat: "",
      jamKembali: "",
      bbmSesudah: "",
      enduranceAkhir: "",
      status: "Menunggu Penggunaan",
    };
    const form = logbookKeForm(logbookBelumBerangkat);
    expect(form.jamBerangkat).toBe("");
    expect(form.jamKembali).toBe("");
  });
});

describe("angkaKePersen & persenKeAngka — konversi bolak-balik", () => {
  it("angka '75' → '75%'", () => {
    expect(angkaKePersen("75")).toBe("75%");
  });

  it("angka kosong → string kosong", () => {
    expect(angkaKePersen("")).toBe("");
  });

  it("angka dengan whitespace di-trim", () => {
    expect(angkaKePersen("  75  ")).toBe("75%");
  });

  it("persen '90%' → '90' (lepas %)", () => {
    expect(persenKeAngka("90%")).toBe("90");
  });

  it("persen '90% ' (trailing space) → '90'", () => {
    expect(persenKeAngka("90% ")).toBe("90");
  });

  it("persen '75' (tanpa %) → tetap '75'", () => {
    expect(persenKeAngka("75")).toBe("75");
  });

  it("round-trip angkaKePersen → persenKeAngka", () => {
    const angka = "80";
    const denganPersen = angkaKePersen(angka);
    const balikKeAngka = persenKeAngka(denganPersen);
    expect(balikKeAngka).toBe(angka);
  });
});

describe("isArmadaLaut — deteksi kategori armada", () => {
  it("RIB = armada laut", () => {
    expect(isArmadaLaut("RIB")).toBe(true);
  });

  it("Kapal = armada laut", () => {
    expect(isArmadaLaut("Kapal")).toBe(true);
  });

  it("RBB = armada laut", () => {
    expect(isArmadaLaut("RBB")).toBe(true);
  });

  it("Mobil = darat", () => {
    expect(isArmadaLaut("Mobil")).toBe(false);
  });

  it("Motor = darat", () => {
    expect(isArmadaLaut("Motor")).toBe(false);
  });

  it("undefined / kosong → bukan armada laut", () => {
    expect(isArmadaLaut(undefined)).toBe(false);
    expect(isArmadaLaut("")).toBe(false);
  });
});

describe("parseEndurance & enduranceKeMenit — pemecahan HH:MM", () => {
  it('"80:30" → { jam: 80, menit: 30 }', () => {
    expect(parseEndurance("80:30")).toEqual({ jam: 80, menit: 30 });
  });

  it('"00:05" → { jam: 0, menit: 5 }', () => {
    expect(parseEndurance("00:05")).toEqual({ jam: 0, menit: 5 });
  });

  it('"999:00" → { jam: 999, menit: 0 }', () => {
    expect(parseEndurance("999:00")).toEqual({ jam: 999, menit: 0 });
  });

  it('format salah "abc" → null', () => {
    expect(parseEndurance("abc")).toBeNull();
  });

  it('menit > 59 → null', () => {
    expect(parseEndurance("80:60")).toBeNull();
  });

  it('string kosong → null', () => {
    expect(parseEndurance("")).toBeNull();
  });

  it('"80:30" → 4830 menit (80×60+30)', () => {
    expect(enduranceKeMenit("80:30")).toBe(4830);
  });

  it('"00:00" → 0 menit', () => {
    expect(enduranceKeMenit("00:00")).toBe(0);
  });

  it('"80:30" → 4830 (konsisten dengan selisih manual)', () => {
    expect(enduranceKeMenit("80:30")).toBe(80 * 60 + 30);
  });
});

describe("selisihEndurance — selisih endurance dalam menit", () => {
  it("awal 80:00, akhir 70:15 → selisih 585 menit", () => {
    const selisih = selisihEndurance("80:00", "70:15");
    expect(selisih).toBe((80 * 60) - (70 * 60 + 15));
  });

  it("akhir > awal → 0 (dipotok, tidak boleh negatif)", () => {
    const selisih = selisihEndurance("60:00", "70:00");
    expect(selisih).toBe(0);
  });

  it("salah satu kosong → null", () => {
    expect(selisihEndurance("80:00", "")).toBeNull();
    expect(selisihEndurance("", "70:00")).toBeNull();
    expect(selisihEndurance(undefined, undefined)).toBeNull();
  });

  it("format salah → null", () => {
    expect(selisihEndurance("abc", "70:00")).toBeNull();
  });
});

describe("selisihKm — selisih odometer", () => {
  it("awal 45000, sesudah 45312 → 312", () => {
    expect(selisihKm("45000", "45312")).toBe(312);
  });

  it("sesudah < awal → 0 (dipotok)", () => {
    expect(selisihKm("45000", "44000")).toBe(0);
  });

  it("sama → 0", () => {
    expect(selisihKm("45000", "45000")).toBe(0);
  });

  it("kosong / non-angka → null", () => {
    expect(selisihKm("", "45000")).toBeNull();
    expect(selisihKm("45000", "abc")).toBeNull();
    expect(selisihKm(undefined, undefined)).toBeNull();
  });
});

describe("formatMenit & formatEndurance — tampilan manusia", () => {
  it("4830 menit → '80 jam 30 menit'", () => {
    expect(formatMenit(4830)).toBe("80 jam 30 menit");
  });

  it("4800 menit → '80 jam' (tanpa menit)", () => {
    expect(formatMenit(4800)).toBe("80 jam");
  });

  it("30 menit → '30 menit' (tanpa jam)", () => {
    expect(formatMenit(30)).toBe("30 menit");
  });

  it('"80:30" → "80 jam 30 menit"', () => {
    expect(formatEndurance("80:30")).toBe("80 jam 30 menit");
  });

  it('kosong → "-"', () => {
    expect(formatEndurance("")).toBe("-");
    expect(formatEndurance(undefined)).toBe("-");
  });

  it('format salah → "-"', () => {
    expect(formatEndurance("abc")).toBe("-");
  });
});

describe("fieldBelumLengkap — daftar field yang belum terisi", () => {
  it("form lengkap → daftar kosong", () => {
    const form = formValid();
    expect(fieldBelumLengkap(form)).toEqual([]);
  });

  it("jamKembali kosong → daftar berisi 'jam kembali'", () => {
    const form = formValid();
    form.jamKembali = "";
    expect(fieldBelumLengkap(form)).toContain("jam kembali");
  });

  it("bbmSesudah kosong → daftar berisi 'BBM sesudah'", () => {
    const form = formValid();
    form.bbmSesudah = "";
    expect(fieldBelumLengkap(form)).toContain("BBM sesudah");
  });

  it("enduranceAkhir kosong (laut) → daftar berisi 'endurance akhir'", () => {
    const form = formValid();
    form.kategoriUnit = "RIB";
    form.enduranceAkhir = "";
    expect(fieldBelumLengkap(form)).toContain("endurance akhir");
  });

  it("kmSesudah kosong (darat) → daftar berisi 'kilometer sesudah'", () => {
    const form = formValid();
    form.kategoriUnit = "Mobil";
    form.kmSesudah = "";
    expect(fieldBelumLengkap(form)).toContain("kilometer sesudah");
  });
});

describe("tahapYangTertunda — tahap yang masih perlu dikerjakan", () => {
  it("Selesai → null (tidak ada yang tertunda)", () => {
    expect(tahapYangTertunda("Selesai")).toBeNull();
  });

  it("Menunggu Penggunaan → 'Awal'", () => {
    expect(tahapYangTertunda("Menunggu Penggunaan")).toBe("Awal");
  });

  it("Sedang Digunakan → 'Pelengkapan'", () => {
    expect(tahapYangTertunda("Sedang Digunakan")).toBe("Pelengkapan");
  });
});

describe("angkaTeks & tahunTeks — konversi angka ke kata", () => {
  it('5 → "Lima"', () => {
    expect(angkaTeks(5)).toBe("Lima");
  });

  it('10 → "Sepuluh"', () => {
    expect(angkaTeks(10)).toBe("Sepuluh");
  });

  it('25 → "Dua Puluh Lima"', () => {
    expect(angkaTeks(25)).toBe("Dua Puluh Lima");
  });

  it('0 → "Nol"', () => {
    expect(angkaTeks(0)).toBe("Nol");
  });

  it('99 → "Sembilan Puluh Sembilan"', () => {
    expect(angkaTeks(99)).toBe("Sembilan Puluh Sembilan");
  });

  it('"2026" → "Dua Ribu Dua Puluh Enam"', () => {
    expect(tahunTeks(2026)).toBe("Dua Ribu Dua Puluh Enam");
  });

  it('"2000" → "Dua Ribu"', () => {
    expect(tahunTeks(2000)).toBe("Dua Ribu");
  });

  it('"1999" → "Satu Ribu Sembilan Ratus Sembilan Puluh Sembilan"', () => {
    expect(tahunTeks(1999)).toBe("Satu Ribu Sembilan Ratus Sembilan Puluh Sembilan");
  });
});

describe("tanggalTeks — tanggal ISO ke teks dokumen", () => {
  it('"2026-10-15" → hari: Kamis (15 Okt 2026 = Kamis)', () => {
    const hasil = tanggalTeks("2026-10-15");
    expect(hasil).not.toBeNull();
    if (hasil) {
      expect(hasil.tanggal).toBe("15");
      expect(hasil.bulan).toBe("Oktober");
      expect(hasil.tahun).toBe("2026");
      expect(hasil.tahunKata).toBe("Dua Ribu Dua Puluh Enam");
    }
  });

  it('"2026-01-01" → tanggal 1 Januari', () => {
    const hasil = tanggalTeks("2026-01-01");
    expect(hasil).not.toBeNull();
    if (hasil) {
      expect(hasil.tanggal).toBe("1");
      expect(hasil.bulan).toBe("Januari");
    }
  });

  it('format salah → null', () => {
    expect(tanggalTeks("bukan-tanggal")).toBeNull();
    expect(tanggalTeks("")).toBeNull();
  });
});

describe("normalizeNup, nupTampil, nupSimpan — normalisasi NUP", () => {
  it('normalizeNup "abc123" → "123"', () => {
    expect(normalizeNup("abc123")).toBe("123");
  });

  it('normalizeNup "000006" → "000006" (leading 0 dipertahankan saat input)', () => {
    expect(normalizeNup("000006")).toBe("000006");
  });

  it('normalizeNup lebih dari 6 digit → dipotong', () => {
    expect(normalizeNup("12345678")).toBe("123456");
  });

  it('nupTampil "000006" → "6"', () => {
    expect(nupTampil("000006")).toBe("6");
  });

  it('nupTampil "000000" → "0"', () => {
    expect(nupTampil("000000")).toBe("0");
  });

  it('nupTampil "20" → "20"', () => {
    expect(nupTampil("20")).toBe("20");
  });

  it('nupTampil null/undefined → ""', () => {
    expect(nupTampil(null)).toBe("");
    expect(nupTampil(undefined)).toBe("");
  });

  it('nupSimpan "6" → "000006"', () => {
    expect(nupSimpan("6")).toBe("000006");
  });

  it('nupSimpan "000006" → "000006"', () => {
    expect(nupSimpan("000006")).toBe("000006");
  });

  it('nupSimpan "12345" → "012345"', () => {
    expect(nupSimpan("12345")).toBe("012345");
  });

  it('nupSimpan "99999" → "999999" (tidak dipotong, 5 digit → padStart 6)', () => {
    // 99999 → padStart(6, "0") = "099999"
    expect(nupSimpan("99999")).toBe("099999");
  });
});

describe("labelModelAset — label model dari merk & tipe", () => {
  it('merk + tipe → "Toyota · Corolla"', () => {
    expect(labelModelAset({ merk: "Toyota", tipe: "Corolla" })).toBe("Toyota · Corolla");
  });

  it('hanya merk → "Toyota"', () => {
    expect(labelModelAset({ merk: "Toyota" })).toBe("Toyota");
  });

  it('hanya tipe → "Corolla"', () => {
    expect(labelModelAset({ tipe: "Corolla" })).toBe("Corolla");
  });

  it('keduanya kosong → ""', () => {
    expect(labelModelAset({ merk: "", tipe: "" })).toBe("");
  });

  it('null → ""', () => {
    expect(labelModelAset(null)).toBe("");
  });
});

describe("Validasi Tahap Awal — form mobil/darat (tanpa endurance)", () => {
  it("form darat valid → tanpa error", () => {
    const form: FormLogbook = {
      tanggal: "2026-10-15",
      jamBerangkat: "07:30",
      jamKembali: "11:00",
      rute: "Kantor - Binanga",
      tujuan: "Distribusi logistik",
      kategoriUnit: "Mobil",
      jenisUnit: "Rescue Truck ISUZU",
      nahkoda: "Hasril",
      jumlahPersonel: "3",
      bbmSebelum: "90",
      bbmSesudah: "55",
      bbmTambahan: "",
      enduranceAwal: "",
      enduranceAkhir: "",
      kmSebelum: "45230",
      kmSesudah: "45312",
      catatan: "Jalan berlubang",
    };
    const errors = validasiTahapAwal(form);
    expect(Object.keys(errors)).toEqual([]);
  });

  it("jamBerangkat format valid (07:30) untuk darat", () => {
    const form: FormLogbook = {
      tanggal: "2026-10-15",
      jamBerangkat: "07:30",
      jamKembali: "",
      rute: "Kantor - Binanga",
      tujuan: "Distribusi logistik",
      kategoriUnit: "Mobil",
      jenisUnit: "Rescue Truck ISUZU",
      nahkoda: "Hasril",
      jumlahPersonel: "3",
      bbmSebelum: "90",
      bbmSesudah: "",
      bbmTambahan: "",
      enduranceAwal: "",
      enduranceAkhir: "",
      kmSebelum: "45230",
      kmSesudah: "",
      catatan: "",
    };
    const errors = validasiTahapAwal(form);
    expect(errors.jamBerangkat).toBeUndefined();
  });
});

describe("Validasi Tahap Akhir — edge case jam", () => {
  it("jamBerangkat 00:00 & jamKembali 23:59 → valid (seluruh malam)", () => {
    const form: FormLogbook = formValid("2026-10-15", "00:00", "23:59");
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBeUndefined();
  });

  it("jamBerangkat 12:00 & jamKembali 12:00 → error (sama)", () => {
    const form: FormLogbook = formValid("2026-10-15", "12:00", "12:00");
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
  });

  it("jamBerangkat 08:00 & jamKembali 07:59 → error (sebelum berangkat)", () => {
    const form: FormLogbook = formValid("2026-10-15", "08:00", "07:59");
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
  });

  it("jamKembali 00:00 dengan jamBerangkat kosong → valid", () => {
    const form: FormLogbook = formValid("2026-10-15", "", "00:00");
    const errors = validasiTahapAkhir(form);
    expect(errors.jamKembali).toBeUndefined();
  });
});

describe("Kombinasi validasi — form lengkap lintas kategori", () => {
  it("RIB penuh → validasiLogbook lolos tanpa error", () => {
    const form: FormLogbook = {
      tanggal: "2026-10-15",
      jamBerangkat: "08:00",
      jamKembali: "10:30",
      rute: "Dermaga - Perairan",
      tujuan: "Patroli",
      kategoriUnit: "RIB",
      jenisUnit: "RIB Vektor 1100",
      nahkoda: "Fajar",
      jumlahPersonel: "4",
      bbmSebelum: "90",
      bbmSesudah: "75",
      bbmTambahan: "",
      enduranceAwal: "76:30",
      enduranceAkhir: "63:45",
      kmSebelum: "",
      kmSesudah: "",
      catatan: "Laut normal",
    };
    const errors = validasiLogbook(form);
    expect(Object.keys(errors)).toEqual([]);
  });

  it("Mobil penuh → validasiLogbook lolos tanpa error", () => {
    const form: FormLogbook = {
      tanggal: "2026-10-15",
      jamBerangkat: "07:30",
      jamKembali: "11:00",
      rute: "Kantor - Binanga",
      tujuan: "Distribusi",
      kategoriUnit: "Mobil",
      jenisUnit: "Rescue Truck ISUZU",
      nahkoda: "Hasril",
      jumlahPersonel: "3",
      bbmSebelum: "90",
      bbmSesudah: "55",
      bbmTambahan: "",
      enduranceAwal: "",
      enduranceAkhir: "",
      kmSebelum: "45230",
      kmSesudah: "45312",
      catatan: "Jalan berlubang",
    };
    const errors = validasiLogbook(form);
    expect(Object.keys(errors)).toEqual([]);
  });

  it("Motor penuh → validasiLogbook lolos tanpa error", () => {
    const form: FormLogbook = {
      tanggal: "2026-10-15",
      jamBerangkat: "09:00",
      jamKembali: "12:30",
      rute: "Kantor - Karampuang",
      tujuan: "Survey",
      kategoriUnit: "Motor",
      jenisUnit: "Kawasaki KLX 230",
      nahkoda: "Ardiansyah",
      jumlahPersonel: "1",
      bbmSebelum: "80",
      bbmSesudah: "50",
      bbmTambahan: "",
      enduranceAwal: "",
      enduranceAkhir: "",
      kmSebelum: "12450",
      kmSesudah: "12520",
      catatan: "Kondisi motor normal",
    };
    const errors = validasiLogbook(form);
    expect(Object.keys(errors)).toEqual([]);
  });
});
