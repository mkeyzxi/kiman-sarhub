/**
 * Generator `asetList` dari register BMN.
 *
 * Jalankan dari root repo:
 *   node scripts/generate-aset.mjs
 *
 * Skrip membaca `ALAT ANGKUTAN BERMOTOR (2026).xlsx` (lembar pertama), lalu
 * mengganti blok `export const asetList` di `src/components/shared/mock-data.ts`.
 * Jalankan `pnpm exec tsc --noEmit` setelahnya. Data non-aset (EWS, checklist,
 * logbook) tidak disentuh skrip ini.
 */
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const ROOT = process.cwd();
const EXCEL = path.join(ROOT, "ALAT ANGKUTAN BERMOTOR (2026).xlsx");
const TARGET = path.join(ROOT, "src", "components", "shared", "mock-data.ts");

/** Konversi serial date Excel -> YYYY-MM-DD (abaikan nilai sentinel 2958465). */
function excelDate(serial) {
  if (!serial || typeof serial !== "number") return undefined;
  if (serial >= 2958465) return undefined; // 9999-12-31 = belum dihapus
  const ms = Math.round((serial - 25569) * 86400000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getUTCFullYear();
  if (y < 1900 || y > 2100) return undefined;
  return d.toISOString().slice(0, 10);
}

const KATEGORI = {
  "3020101001": "Mobil",       // Sedan
  "3020104001": "Motor",       // Sepeda Motor
  "3020105058": "Mobil",       // Mobil Operasional
  "3020105062": "Mobil",       // Rescue Truck
  "3020105128": "Mobil",       // Rescue Car Type I
  "3020105129": "Mobil",       // Rescue Car Type II
  "3020302001": "Kapal",       // Speed Boat
  "3020303004": "Kapal",       // Out Boat Motor (mesin tempel)
  "3020303037": "Kapal",       // Kapal SAR
  "3020303040": "Kapal",       // RIB
};

const LOKASI = {
  Mobil: "Gudang Kendaraan",
  Motor: "Gudang Kendaraan",
  Kapal: "Dermaga / Gudang Perahu",
};

/** Nama tampilan: gabungkan nama barang + merk + tipe tanpa duplikasi. */
function namaTampil(row) {
  const nama = String(row["Nama Barang"] ?? "").trim();
  const merk = String(row["Merk"] ?? "").trim();
  const tipe = String(row["Tipe"] ?? "").trim();
  const valid = (v) => v && v !== "-" && v.toLowerCase() !== "custom";

  const parts = [nama];
  const push = (v) => {
    if (!valid(v)) return;
    const lower = v.toLowerCase();
    if (parts.some((p) => p.toLowerCase().includes(lower))) return;
    if (parts.some((p) => lower.includes(p.toLowerCase()))) {
      // tipe lebih lengkap dari yang sudah ada -> ganti entri yang lebih pendek
      const idx = parts.findIndex((p) => lower.includes(p.toLowerCase()));
      if (idx > 0) parts[idx] = v;
      return;
    }
    parts.push(v);
  };
  push(merk);
  push(tipe);
  return parts.join(" ");
}

function esc(s) {
  return JSON.stringify(String(s)).slice(1, -1);
}

/** Nilai yang ditulis apa adanya, mis. referensi `PJ_ASET.abdMalik`. */
function ref(expr) {
  return { __raw: expr };
}

const wb = XLSX.readFile(EXCEL);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
rows.sort((a, b) => Number(a["No"]) - Number(b["No"]));

// Penanggung jawab aset adalah operator lapangan — hanya mereka yang boleh
// mengisi checklist perawatan unit yang menjadi tanggung jawabnya.
//
// Pemetaan per kode register (kodeBarang-NUP) agar tidak bergeser saat urutan
// baris Excel berubah. Nilainya harus sama dengan konstanta `PJ_ASET` di
// `src/components/shared/mock-data.ts` dan penugasan `kendaraan` pada
// `scripts/create-supabase-users-v3.mjs`.
const PJ_BY_KODE = {
  "3020101001-000001": "abdMalik", // ast-001 -> Abd. Malik (Kendaraan Umum)
  "3020104001-000003": "akmal", // ast-002 -> Akmal Suryadil (Motor Trail 01)
  "3020104001-000005": "sulaeman", // ast-003 -> Sulaeman Mustamin (Motor Trail 02)
  "3020104001-000006": "akbar", // ast-004 -> Muhammad Akbar (Motor Trail 03)
  "3020104001-000007": "calvin", // ast-005 -> Calvin Datundelang (Motor Trail 04)
  "3020105058-000001": "fajrin", // ast-006 -> Muhammad Fajrin S.Y. (Rescue Car Carier)
  "3020105062-000004": "adiaksa", // ast-007 -> Muhammad Adiaksa (Rescue Truck 01)
  "3020105062-000005": "wahyudi", // ast-008 -> Wahyudi (Rescue Truck 02)
  "3020105062-000006": "abduh", // ast-009 -> Muh. Abduh Yanis (Truck Compartement)
  "3020105128-000003": "hasril", // ast-010 -> Hasril (Rescue Car Compartment)
  "3020105128-000006": "ibnu", // ast-011 -> Ibnu Anjaya (D-Max 01)
  "3020105129-000005": "haerul", // ast-012 -> Haerul Vikra (D-Max Double Cabin 02)
  "3020105129-000006": "akmal", // ast-013 -> Akmal Suryadil (Dmax Double Cabin 03)
  "3020105129-000008": "agustang", // ast-014 -> Agustang (D-Max Compartement 02)
  "3020105129-000009": "akbar", // ast-015 -> Muhammad Akbar (Rescue Car Dmax 01)
  "3020302001-000001": "fajar", // ast-016 -> Fajar Farial
  "3020302001-000002": "ardiansyah", // ast-017 -> Ardiansyah
  "3020303004-000001": "hasril", // ast-018 -> Hasril
  "3020303004-000002": "ahmadAidid", // ast-019 -> Ahmad Aidid
  "3020303004-000003": "fajar", // ast-020 -> Fajar Farial
  "3020303004-000004": "ardiansyah", // ast-021 -> Ardiansyah
  "3020303004-000005": "hasril", // ast-022 -> Hasril
  "3020303004-000006": "ahmadAidid", // ast-023 -> Ahmad Aidid
  "3020303004-000007": "fajar", // ast-024 -> Fajar Farial
  "3020303004-000008": "ardiansyah", // ast-025 -> Ardiansyah
  "3020303004-000009": "hasril", // ast-026 -> Hasril
  "3020303004-000010": "ahmadAidid", // ast-027 -> Ahmad Aidid
  "3020303004-000011": "fajar", // ast-028 -> Fajar Farial
  "3020303004-000012": "ardiansyah", // ast-029 -> Ardiansyah
  "3020303004-000013": "hasril", // ast-030 -> Hasril
  "3020303037-000001": "fajar", // ast-031 -> Fajar Farial (KN SAR Parikesit)
  "3020303040-000002": "hasril", // ast-032 -> Hasril (RIB 02 - 12 M)
  "3020303040-000006": "ahmadAidid", // ast-033 -> Ahmad Aidid (RIB 01 - 9 M)
  "3020303040-000007": "ardiansyah", // ast-034 -> Ardiansyah (RBB)
};
// Pencatatan perolehan/PSP dilakukan oleh Pengelola BMN.
const PENGELOLA = ["usr-001", "usr-002"];

const missingPj = [];

const assets = rows.map((row, i) => {
  const kodeBarang = String(row["Kode Barang"] ?? "").trim();
  const nup = String(row["NUP"] ?? "").padStart(6, "0");
  const kategori = KATEGORI[kodeBarang] ?? "Peralatan SAR";
  const tanggalPerolehan = excelDate(row["Tanggal Perolehan"]);
  const tanggalPsp = excelDate(row["Tanggal PSP"]);
  const umur = Number(row["Umur Aset"] ?? 0) || 0;
  const statusPenggunaan = String(row["Status Penggunaan"] ?? "").trim();
  const nilaiPerolehan = Number(row["Nilai Perolehan"] ?? 0) || 0;
  const nilaiPenyusutan = Number(row["Nilai Penyusutan"] ?? 0) || 0;
  const nilaiBuku = Number(row["Nilai Buku"] ?? 0) || 0;
  const noStnk = String(row["No STNK"] ?? "").trim();
  const noPolisi = String(row["No Polisi"] ?? "").trim();
  // Perbaiki typo sumber: Merk RIB Vektor tertulis "igid Inflatable Boat..."
  // (huruf R hilang). Tanpa perbaikan ini pencocokan unit dapat salah aset.
  const merk = String(row["Merk"] ?? "")
    .trim()
    .replace(/^igid Inflatable Boat/i, "Rigid Inflatable Boat");
  const tipe = String(row["Tipe"] ?? "").trim();
  const merkValid = merk !== "" && merk !== "-" && merk.toLowerCase() !== "custom";
  const tipeValid = tipe !== "" && tipe !== "-" && tipe.toLowerCase() !== "custom";
  const kondisi =
    row["Kondisi"] === "Rusak Ringan"
      ? "Rusak Ringan"
      : row["Kondisi"] === "Rusak Berat"
        ? "Rusak Berat"
        : "Baik";
  // "Status Penggunaan" pada register BMN (digunakan sendiri untuk operasional
  // / dinas jabatan / fungsional) BUKAN status kesiapan operasional. Aset yang
  // kondisinya baik dianggap siap pakai (Standby); klasifikasi BMN tetap
  // disimpan pada field `statusPenggunaan`.
  const status = kondisi === "Baik" ? "Standby" : kondisi;
  const kode = `${kodeBarang}-${nup}`;
  const pjKey = PJ_BY_KODE[kode] ?? "fajar";
  if (!PJ_BY_KODE[kode]) missingPj.push(kode);

  const riwayat = [];
  if (tanggalPerolehan) {
    riwayat.push({
      tanggal: tanggalPerolehan,
      aksi: "Perolehan BMN",
      keterangan: `Aset diperoleh dan tercatat dalam register BMN${row["No PSP"] ? ` (PSP: ${String(row["No PSP"]).trim()})` : ""}.`,
      userId: PENGELOLA[i % PENGELOLA.length],
    });
  }
  if (tanggalPsp) {
    riwayat.push({
      tanggal: tanggalPsp,
      aksi: "Penetapan Status Penggunaan",
      keterangan: `Ditetapkan penggunaannya melalui PSP${row["No PSP"] ? ` nomor ${String(row["No PSP"]).trim()}` : ""}.`,
      userId: PENGELOLA[i % PENGELOLA.length],
    });
  }

  return {
    id: `ast-${String(i + 1).padStart(3, "0")}`,
    nama: namaTampil(row),
    kode,
    nup,
    kategori,
    status,
    lokasi: LOKASI[kategori] ?? "Gudang BMN",
    tanggalPenetapan: tanggalPsp ?? tanggalPerolehan ?? "2026-01-01",
    gambar: `/asets/${kodeBarang}-${nup}.jpg`,
    kondisi,
    penanggungJawab: ref(`PJ_ASET.${pjKey}`),
    keterangan: [
      statusPenggunaan,
      merkValid ? `Merk: ${merk}` : "",
      tipeValid ? `Tipe: ${tipe}` : "",
      noPolisi && noPolisi !== "-" ? `No. Polisi: ${noPolisi}` : "",
    ].filter(Boolean).join(" · "),
    riwayat,
    kodeBarang,
    merk: merkValid ? merk : undefined,
    tipe: tipeValid ? tipe : undefined,
    noStnk: noStnk || undefined,
    noPolisi: noPolisi && noPolisi !== "-" ? noPolisi : undefined,
    tanggalPerolehan,
    noPsp: String(row["No PSP"] ?? "").trim() || undefined,
    tanggalPsp,
    nilaiPerolehan,
    nilaiPenyusutan,
    nilaiBuku,
    umurAsetTahun: umur || undefined,
    jumlahFoto: Number(row["Jumlah Foto"] ?? 0) || undefined,
    statusPenggunaan: statusPenggunaan || undefined,
    kodeRegister: String(row["Kode Register"] ?? "").trim() || undefined,
    statusBmn: row["Status BMN"] === "Aktif" ? "Aktif" : "Tidak Aktif",
  };
});

/** Serialisasi objek -> literal TS dengan gaya prettier (indent 2). */
function literal(value, indent = 2) {
  if (value && typeof value === "object" && typeof value.__raw === "string") {
    return value.__raw;
  }
  const pad = " ".repeat(indent);
  const padIn = " ".repeat(indent + 2);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return "[\n" + value.map((v) => padIn + literal(v, indent + 2) + ",").join("\n") + "\n" + pad + "]";
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined);
    if (keys.length === 0) return "{}";
    return (
      "{\n" +
      keys.map((k) => `${padIn}${k}: ${literal(value[k], indent + 2)},`).join("\n") +
      "\n" + pad + "}"
    );
  }
  if (typeof value === "string") return `"${esc(value)}"`;
  return String(value);
}

const body = assets.map((a) => "  " + literal(a, 2)).join(",\n");
const generated = `export const asetList: Aset[] = [\n${body},\n];`;

const source = fs.readFileSync(TARGET, "utf8");
const startMarker = "export const asetList: Aset[] = [";
const start = source.indexOf(startMarker);
if (start < 0) throw new Error("asetList tidak ditemukan");
const end = source.indexOf("\n];", start);
if (end < 0) throw new Error("akhir asetList tidak ditemukan");
const after = source.slice(end + 3); // pertahankan newline setelah "];"
const before = source.slice(0, start);
const updated = before + generated + after;
fs.writeFileSync(TARGET, updated, "utf8");

console.log(`OK: ${assets.length} aset ditulis ke mock-data.ts`);
if (missingPj.length > 0) {
  console.warn(
    `PERINGATAN: ${missingPj.length} kode belum punya pemetaan PJ, memakai fallback PJ_ASET.fajar (usr-005): ${missingPj.join(", ")}`
  );
}
const kat = {};
for (const a of assets) kat[a.kategori] = (kat[a.kategori] ?? 0) + 1;
console.log("Kategori:", kat);
console.log("Status:", assets.reduce((m, a) => ((m[a.status] = (m[a.status] ?? 0) + 1), m), {}));
