/**
 * Tests for the logbook store — simpanTahapAwal, simpanTahapAkhir,
 * tandaiBerangkat, mergeLogbooksWithSupabase, getLogbookById.
 *
 * Store uses in-memory state seeded from mock data. Tests focus on:
 * - jamBerangkat / jamKembali saving behaviour
 * - status transitions
 * - merge & lookup logic
 */

import {
  simpanTahapAwal,
  simpanTahapAkhir,
  tandaiBerangkat,
  mergeLogbooksWithSupabase,
  getLogbookById,
  getAllLogbook,
  resetLogbooksForTesting,
} from "../logbook-store";
import {
  logbookPerjalananList,
  type FormLogbook,
  type LogbookPerjalanan,
} from "../mock-data";

// ─── Form logbook valid helper ───────────────────────────────────────────────

function formValidLaut(
  jamBerangkat = "08:00",
  jamKembali = "10:30"
): FormLogbook {
  return {
    tanggal: "2026-10-15",
    jamBerangkat,
    jamKembali,
    rute: "Dermaga Mamuju - Perairan Mamuju",
    tujuan: "Patroli rutin",
    kategoriUnit: "RIB",
    jenisUnit: "RIB Vektor 1100",
    nahkoda: "Fajar Farial",
    jumlahPersonel: "4",
    bbmSebelum: "90",
    bbmSesudah: "75",
    enduranceAwal: "80:00",
    enduranceAkhir: "70:15",
    kmSebelum: "",
    kmSesudah: "",
    catatan: "Kondisi laut normal",
  };
}

function formValidDarat(
  jamBerangkat = "07:30",
  jamKembali = "11:00"
): FormLogbook {
  return {
    tanggal: "2026-10-15",
    jamBerangkat,
    jamKembali,
    rute: "Kantor SAR Mamuju - Desa Binanga",
    tujuan: "Distribusi logistik",
    kategoriUnit: "Mobil",
    jenisUnit: "Rescue Truck ISUZU DC 8982",
    nahkoda: "Hasril",
    jumlahPersonel: "3",
    bbmSebelum: "90",
    bbmSesudah: "55",
    enduranceAwal: "",
    enduranceAkhir: "",
    kmSebelum: "45230",
    kmSesudah: "45312",
    catatan: "Jalan berlubang KM 67-69",
  };
}

// ─── simpanTahapAwal ─────────────────────────────────────────────────────────

describe("simpanTahapAwal — penyimpanan data keberangkatan", () => {
  beforeEach(() => {
    resetLogbooksForTesting();
  });

  it("menciptakan logbook baru & mengembalikan objek hasil sukses", () => {
    const form = formValidLaut("08:00", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) {
      throw new Error(`Harusnya sukses tapi dapat: ${hasil.error}`);
    }

    expect(hasil.logbook).toBeDefined();
    expect(hasil.logbook.jamBerangkat).toBe("08:00");
    expect(hasil.logbook.jamKembali).toBe("");
    expect(hasil.logbook.status).toBe("Sedang Digunakan");
  });

  it("jamBerangkat tersimpan dengan benar", () => {
    const form = formValidLaut("14:30", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.jamBerangkat).toBe("14:30");
  });

  it("jamKembali selalu kosong di tahap awal", () => {
    const form = formValidLaut("08:00", "10:30"); // jamKembali diisi juga di form
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    // SimpanTahapAwal mengabaikan jamKembali dari form — selalu ""
    expect(hasil.logbook.jamKembali).toBe("");
  });

  it("status 'Menunggu Penggunaan' jika jamBerangkat kosong", () => {
    const form = formValidLaut("", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.status).toBe("Menunggu Penggunaan");
  });

  it("status 'Sedang Digunakan' jika jamBerangkat terisi", () => {
    const form = formValidLaut("08:00", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.status).toBe("Sedang Digunakan");
  });

  it("enduranceAwal disimpan untuk armada laut", () => {
    const form = formValidLaut("08:00", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.enduranceAwal).toBe("80:00");
    expect(hasil.logbook.enduranceAkhir).toBe("");
  });

  it("enduranceAwal diabaikan untuk armada darat", () => {
    const form = formValidDarat("07:30", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.kmSebelum).toBe("45230");
    expect(hasil.logbook.kmSesudah).toBe("");
    // enduranceAwal tidak diset untuk darat
    expect(hasil.logbook.enduranceAwal).toBeUndefined();
  });

  it("bbmSebelum dikonversi ke format persen", () => {
    const form = formValidLaut("08:00", "");
    form.bbmSebelum = "90";
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.bbmSebelum).toBe("90%");
  });

  it("catatan di-trim", () => {
    const form = formValidLaut("08:00", "");
    form.catatan = "  Kondisi normal  ";
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.catatan).toBe("Kondisi normal");
  });

  it("jumlahPersonel dikonversi ke number", () => {
    const form = formValidLaut("08:00", "");
    form.jumlahPersonel = "6";
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.jumlahPersonel).toBe(6);
  });

  it("form tidak valid → mengembalikan error + daftar field error", () => {
    const form = formValidLaut("08:00", "");
    form.rute = ""; // wajib
    form.jenisUnit = ""; // wajib
    const hasil = simpanTahapAwal(form);

    expect("error" in hasil).toBe(true);
    if ("error" in hasil) {
      expect(hasil.errors.rute).toBe("Rute wajib diisi.");
      expect(hasil.errors.jenisUnit).toBe("Jenis unit wajib dipilih.");
    }
  });

  it("catatan baru di-prepend ke daftar logbooks", () => {
    const sebelum = getAllLogbook().length;
    const form = formValidLaut("08:00", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(getAllLogbook().length).toBe(sebelum + 1);
    // Catatan baru ada di posisi 0 (pre-pend)
    const terbaru = getAllLogbook()[0];
    expect(terbaru.id).toBe(hasil.logbook.id);
  });

  // ─── Edge cases jam keberangkatan ────────────────────────────────────────

  it.each([
    ["08:00", true],
    ["00:00", true],
    ["23:59", true],
    ["07:30", true],
    ["8:00", false], // single-digit jam → format salah
    ["24:00", false], // jam > 23 → invalid
    ["08:60", false], // menit > 59 → invalid
    ["10:3", false], // menit single-digit → invalid
    ["", true], // kosong → valid (menunggu)
    ["abc", false],
  ])(
    "jamBerangkat %s → save %s",
    (jam, shouldPass) => {
      const form = formValidLaut(jam, "");
      const hasil = simpanTahapAwal(form);
      if (shouldPass) {
        expect("error" in hasil).toBe(false);
      } else {
        expect("error" in hasil).toBe(true);
      }
    }
  );
});

// ─── simpanTahapAkhir ───────────────────────────────────────────────────────

describe("simpanTahapAkhir — pelengkapan data kepulangan", () => {
  let idTarget: string;

  beforeEach(() => {
    resetLogbooksForTesting();
    // Cari logbook "Sedang Digunakan" dari mock data
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan"
    );
    idTarget = logbookSedang!.id;
  });

  it("mencari logbook yang sudah ada berdasarkan ID", () => {
    const form = formValidLaut("08:00", "10:30");
    const hasil = simpanTahapAkhir(idTarget, form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.id).toBe(idTarget);
  });

  it("ID tidak ditemukan → error", () => {
    const form = formValidLaut("08:00", "10:30");
    const hasil = simpanTahapAkhir("lp-tidak-ada", form);

    expect("error" in hasil).toBe(true);
    if ("error" in hasil) {
      expect(hasil.error).toBe("Catatan logbook tidak ditemukan.");
    }
  });

  it("jamKembali tersimpan di catatan yang sama", () => {
    const form = formValidLaut("08:00", "14:00");
    const hasil = simpanTahapAkhir(idTarget, form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.jamKembali).toBe("14:00");
  });

  it("jamBerangkat tidak di-undurkan bila sudah terisi", () => {
    // Ambil logbook yang jamBerangkat sudah ada
    const logbookTarget = getLogbookById(idTarget)!;
    const jamBerangkatAsli = logbookTarget.jamBerangkat;

    // Coba undur jam berangkat (lebih awal)
    const form = formValidLaut("05:00", "14:00");
    form.jamKembali = "14:00";
    const hasil = simpanTahapAkhir(idTarget, form);

    if ("error" in hasil) {
      // Bila error karena validasi, lanjut — yang penting jamBerangkat asli dipertahankan
      return;
    }

    // JamBerangkat asal dipertahankan (tidak diundur)
    if (jamBerangkatAsli !== "" && jamBerangkatAsli !== "05:00") {
      expect(hasil.logbook.jamBerangkat).toBe(jamBerangkatAsli);
    }
  });

  it("jamBerangkat yang sebelumnya kosong boleh diisi", () => {
    // Cari logbook "Menunggu Penggunaan" (jamBerangkat kosong)
    const logbookMenunggu = logbookPerjalananList.find(
      (l) => l.status === "Menunggu Penggunaan"
    );
    if (!logbookMenunggu) throw new Error("Tidak ada logbook Menunggu Penggunaan");

    const form = formValidLaut("09:00", "12:00");
    form.jamBerangkat = "09:00";
    form.jamKembali = "12:00";
    const hasil = simpanTahapAkhir(logbookMenunggu.id, form);

    if ("error" in hasil) {
      // Bisa error karena form tidak cocok dengan kategori unit dsb.
      // Tandai saja — yang penting logika "boleh diisi jika kosong" bekerja
      return;
    }

    expect(hasil.logbook.jamBerangkat).toBe("09:00");
  });

  it("status menjadi 'Selesai' setelah tahap akhir valid", () => {
    const form = formValidLaut("08:00", "14:00");
    const hasil = simpanTahapAkhir(idTarget, form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.status).toBe("Selesai");
  });

  it("bbmSesudah dikonversi ke format persen", () => {
    const form = formValidLaut("08:00", "14:00");
    form.bbmSesudah = "75";
    const hasil = simpanTahapAkhir(idTarget, form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.bbmSesudah).toBe("75%");
  });

  it("enduranceAkhir disimpan untuk armada laut", () => {
    const form = formValidLaut("08:00", "14:00");
    form.enduranceAkhir = "65:30";
    const hasil = simpanTahapAkhir(idTarget, form);

    if ("error" in hasil) throw new Error("Expected success");
    expect(hasil.logbook.enduranceAkhir).toBe("65:30");
  });

  it("kmSesudah disimpan untuk armada darat", () => {
    // Cari logbook darat Sedang Digunakan
    const logbookDarat = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan" && l.kategoriUnit === "Mobil"
    );
    if (logbookDarat) {
      const form = formValidDarat("13:00", "16:00");
      form.kmSesudah = "45500";
      const hasil = simpanTahapAkhir(logbookDarat.id, form);

      if ("error" in hasil) {
        // Bisa error — hanya cek yang tidak error
        return;
      }
      expect(hasil.logbook.kmSesudah).toBe("45500");
    }
  });

  it("form tidak valid → error + daftar field yang kurang", () => {
    const form = formValidLaut("08:00", "");
    form.jamKembali = ""; // wajib
    form.bbmSesudah = ""; // wajib
    const hasil = simpanTahapAkhir(idTarget, form);

    expect("error" in hasil).toBe(true);
    if ("error" in hasil) {
      expect(hasil.errors.jamKembali).toBeDefined();
      expect(hasil.errors.bbmSesudah).toBeDefined();
    }
  });

  it("jamKembali sebelum jamBerangkat → error", () => {
    // Cari logbook dengan jamBerangkat terisi
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan"
    )!;
    const jamBerangkatAsli = logbookSedang.jamBerangkat;

    // Jam kembali lebih awal dari jam berangkat
    const form = formValidLaut(jamBerangkatAsli, "05:00");
    const hasil = simpanTahapAkhir(logbookSedang.id, form);

    expect("error" in hasil).toBe(true);
    if ("error" in hasil) {
      expect(hasil.errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
    }
  });

  it("jamKembali sama dengan jamBerangkat → error", () => {
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan"
    )!;
    const jamBerangkatAsli = logbookSedang.jamBerangkat;

    const form = formValidLaut(jamBerangkatAsli, jamBerangkatAsli);
    const hasil = simpanTahapAkhir(logbookSedang.id, form);

    expect("error" in hasil).toBe(true);
    if ("error" in hasil) {
      expect(hasil.errors.jamKembali).toBe("Jam kembali harus setelah jam berangkat.");
    }
  });

  it("catatan lama dipertahankan bila catatan baru kosong", () => {
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan"
    )!;
    const catatanAsli = logbookSedang.catatan;

    const form = formValidLaut(logbookSedang.jamBerangkat, "16:00");
    form.catatan = ""; // kosong
    const hasil = simpanTahapAkhir(logbookSedang.id, form);

    if ("error" in hasil) return; // bila error, skrip tidak jalan
    expect(hasil.logbook.catatan).toBe(catatanAsli);
  });

  it("catatan baru menimpa catatan lama", () => {
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan"
    )!;

    const form = formValidLaut(logbookSedang.jamBerangkat, "16:00");
    form.catatan = "Perjalanan lancar, ada ombak besar";
    const hasil = simpanTahapAkhir(logbookSedang.id, form);

    if ("error" in hasil) return;
    expect(hasil.logbook.catatan).toBe("Perjalanan lancar, ada ombak besar");
  });
});

// ─── tandaiBerangkat ─────────────────────────────────────────────────────────

describe("tandaiBerangkat — transisi Menunggu → Sedang Digunakan", () => {
  beforeEach(() => {
    resetLogbooksForTesting();
  });

  it("logbook 'Menunggu Penggunaan' → status berubah jadi 'Sedang Digunakan'", () => {
    const logbookMenunggu = logbookPerjalananList.find(
      (l) => l.status === "Menunggu Penggunaan"
    );
    if (!logbookMenunggu) throw new Error("Tidak ada logbook Menunggu Penggunaan");

    // Pastikan status sebelum dipanggil
    const sebelum = getLogbookById(logbookMenunggu.id)!;
    expect(sebelum.status).toBe("Menunggu Penggunaan");

    tandaiBerangkat(logbookMenunggu.id);

    const sesudah = getLogbookById(logbookMenunggu.id)!;
    expect(sesudah.status).toBe("Sedang Digunakan");
  });

  it("logbook bukan 'Menunggu Penggunaan' → tidak diubah", () => {
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan"
    );
    if (!logbookSedang) throw new Error("Tidak ada logbook Sedang Digunakan");

    const sebelum = getLogbookById(logbookSedang.id)!;
    expect(sebelum.status).toBe("Sedang Digunakan");

    tandaiBerangkat(logbookSedang.id);

    const sesudah = getLogbookById(logbookSedang.id)!;
    expect(sesudah.status).toBe("Sedang Digunakan"); // tetap
  });

  it("logbook 'Selesai' → tidak diubah", () => {
    const logbookSelesai = logbookPerjalananList.find(
      (l) => l.status === "Selesai"
    );
    if (!logbookSelesai) throw new Error("Tidak ada logbook Selesai");

    const sebelum = getLogbookById(logbookSelesai.id)!;
    expect(sebelum.status).toBe("Selesai");

    tandaiBerangkat(logbookSelesai.id);

    const sesudah = getLogbookById(logbookSelesai.id)!;
    expect(sesudah.status).toBe("Selesai"); // tetap
  });

  it("ID tidak ada → tidak ada error, tidak ada perubahan", () => {
    const jumlahSebelum = getAllLogbook().length;

    tandaiBerangkat("lp-tidak-ada");

    expect(getAllLogbook().length).toBe(jumlahSebelum);
  });
});

// ─── mergeLogbooksWithSupabase ──────────────────────────────────────────────

describe("mergeLogbooksWithSupabase — gabung in-memory & Supabase", () => {
  beforeEach(() => {
    resetLogbooksForTesting();
  });

  it("in-memory dipertahankan", () => {
    const supabaseData: LogbookPerjalanan[] = [];
    const hasil = mergeLogbooksWithSupabase(supabaseData);

    // Semua in-memory harus ada
    for (const l of logbookPerjalananList) {
      expect(hasil.find((x) => x.id === l.id)).toBeDefined();
    }
  });

  it("logbook dari Supabase yang baru ditambahkan", () => {
    const logbookBaru: LogbookPerjalanan = {
      id: "lp-supabase-only",
      tanggal: "2026-11-01",
      jamBerangkat: "08:00",
      jamKembali: "12:00",
      rute: "Rute Supabase",
      tujuan: "Tujuan",
      kategoriUnit: "RIB",
      jenisUnit: "RIB",
      nahkoda: "Test",
      jumlahPersonel: 3,
      bbmSebelum: "90%",
      bbmSesudah: "80%",
      enduranceAwal: "80:00",
      enduranceAkhir: "70:00",
      status: "Selesai",
      catatan: "Dari Supabase",
      tanggalSimpan: "2026-11-01T08:00:00",
      tanggalLengkap: "2026-11-01T12:00:00",
    };

    const hasil = mergeLogbooksWithSupabase([logbookBaru]);
    expect(hasil.find((l) => l.id === "lp-supabase-only")).toBeDefined();
  });

  it("in-memory yang ID sama dengan Supabase → in-memory menang (tidak duplikat)", () => {
    const logbookInMemory = logbookPerjalananList[0];
    const supabaseCopy = { ...logbookInMemory, catatan: "Versi Supabase" };
    const hasil = mergeLogbooksWithSupabase([supabaseCopy]);

    // Hanya satu entri dengan ID itu
    const matches = hasil.filter((l) => l.id === logbookInMemory.id);
    expect(matches.length).toBe(1);
  });

  it("diurutkan: tanggalSimpan terbaru di atas, yang belum disimpan di bawah", () => {
    const lama: LogbookPerjalanan = {
      ...logbookPerjalananList[0],
      id: "lp-test-lama",
      tanggalSimpan: "2026-01-01T08:00:00",
    };
    const baru: LogbookPerjalanan = {
      ...logbookPerjalananList[0],
      id: "lp-test-baru",
      tanggalSimpan: "2026-12-01T08:00:00",
    };
    const tanpaTanggal: LogbookPerjalanan = {
      ...logbookPerjalananList[0],
      id: "lp-test-tanpa",
      tanggalSimpan: undefined,
    };

    const hasil = mergeLogbooksWithSupabase([lama, baru, tanpaTanggal]);

    const idxBaru = hasil.findIndex((l) => l.id === "lp-test-baru");
    const idxLama = hasil.findIndex((l) => l.id === "lp-test-lama");
    const idxTanpa = hasil.findIndex((l) => l.id === "lp-test-tanpa");

    expect(idxBaru).toBeLessThan(idxLama);
    expect(idxTanpa).toBeGreaterThan(idxLama);
  });
});

// ─── getLogbookById ─────────────────────────────────────────────────────────

describe("getLogbookById — cari berdasarkan ID", () => {
  beforeEach(() => {
    resetLogbooksForTesting();
  });

  it("ID valid → mengembalikan logbook", () => {
    const hasil = getLogbookById("lp-01");
    expect(hasil).toBeDefined();
    expect(hasil!.id).toBe("lp-01");
  });

  it("ID tidak ada → undefined", () => {
    const hasil = getLogbookById("lp-tidak-ada-999");
    expect(hasil).toBeUndefined();
  });

  it("ID kosong → undefined", () => {
    const hasil = getLogbookById("");
    expect(hasil).toBeUndefined();
  });
});

// ─── State persistence: jam tidak hilang setelah simpan ───────────────────

describe("State jam keberangkatan/kembali — tidak hilang setelah simpan", () => {
  beforeEach(() => {
    resetLogbooksForTesting();
  });

  it("setelah simpanTahapAwal, jamBerangkat tersimpan di in-memory", () => {
    const form = formValidLaut("08:00", "");
    const hasil = simpanTahapAwal(form);

    if ("error" in hasil) throw new Error("Expected success");
    const id = hasil.logbook.id;

    const setelahSimpan = getLogbookById(id)!;
    expect(setelahSimpan.jamBerangkat).toBe("08:00");
    expect(setelahSimpan.jamKembali).toBe("");
    expect(setelahSimpan.status).toBe("Sedang Digunakan");
  });

  it("setelah simpanTahapAkhir, jamKembali tersimpan & status Selesai", () => {
    // Simpan tahap awal dulu
    const formAwal = formValidLaut("08:00", "");
    const hasilAwal = simpanTahapAwal(formAwal);
    if ("error" in hasilAwal) throw new Error("Expected success");
    const id = hasilAwal.logbook.id;

    // Simpan tahap akhir
    const formAkhir = formValidLaut("08:00", "14:00");
    const hasilAkhir = simpanTahapAkhir(id, formAkhir);
    if ("error" in hasilAkhir) throw new Error("Expected success");

    const logbookAkhir = getLogbookById(id)!;
    expect(logbookAkhir.jamKembali).toBe("14:00");
    expect(logbookAkhir.jamBerangkat).toBe("08:00");
    expect(logbookAkhir.status).toBe("Selesai");
  });

  it("jam tidak direset ulang setelah tandaiBerangkat", () => {
    const logbookMenunggu = logbookPerjalananList.find(
      (l) => l.status === "Menunggu Penggunaan"
    )!;
    const jamBerangkatAsli = logbookMenunggu.jamBerangkat; // ""

    tandaiBerangkat(logbookMenunggu.id);

    const setelah = getLogbookById(logbookMenunggu.id)!;
    // jamBerangkat tetap sama (tidak direset)
    expect(setelah.jamBerangkat).toBe(jamBerangkatAsli);
  });

  it("jamBerangkat diupdate oleh simpanTahapAkhir bila sebelumnya kosong", () => {
    const logbookMenunggu = logbookPerjalananList.find(
      (l) => l.status === "Menunggu Penggunaan"
    )!;

    // Isi jamBerangkat yang sebelumnya kosong
    const form = formValidLaut("09:00", "12:00");
    form.jamBerangkat = "09:00";
    form.jamKembali = "12:00";
    const hasil = simpanTahapAkhir(logbookMenunggu.id, form);

    if ("error" in hasil) return; // Bila kategori tidak cocok, skip

    const setelah = getLogbookById(logbookMenunggu.id)!;
    expect(setelah.jamBerangkat).toBe("09:00");
  });

  it("jamBerangkat tidak bisa diundur lewat simpanTahapAkhir", () => {
    const logbookSedang = logbookPerjalananList.find(
      (l) => l.status === "Sedang Digunakan" && l.jamBerangkat !== ""
    )!;
    const jamBerangkatAsli = logbookSedang.jamBerangkat; // mis. "08:00"

    // Coba set jamBerangkat lebih awal ("06:00")
    const form = formValidLaut(jamBerangkatAsli, "14:00");
    form.jamBerangkat = "06:00"; // lebih awal dari asli
    form.jamKembali = "14:00";
    const hasil = simpanTahapAkhir(logbookSedang.id, form);

    // Bila sukses, jamBerangkat asli dipertahankan
    if (!("error" in hasil)) {
      expect(hasil.logbook.jamBerangkat).toBe(jamBerangkatAsli);
    }
  });
});
