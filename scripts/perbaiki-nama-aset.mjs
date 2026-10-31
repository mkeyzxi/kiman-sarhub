/**
 * Script: Perbaiki nama/merek/tipe aset
 *
 * LAPARAN BELAKANG:
 *   Kolom `nama` aset menempel merek+tipe ("Out Boat Motor YAMAHA ENDURO")
 *   dan kolom `merk`/`tipe` hasil impor Excel berantakan — merk kadang
 *   berisi nama model penuh, tipe sering duplikat merk. Agar UI dapat
 *   menampilkan nama, merek, dan tipe TERPISAH, data dibersihkan dengan
 *   pemetaan per id aset.
 *
 * APA YANG DILAKUKAN (idempoten, aman dijalankan ulang):
 *   1. asets.nama  := nama jenis tanpa merek & tipe (mis. "Out Boat Motor").
 *   2. asets.merk  := merek bersih (kapitalisasi konsisten, mis. "Yamaha").
 *   3. asets.tipe  := tipe/model bersih (string kosong bila tidak ada).
 *   4. asets.keterangan := segmen "Merk: … · Tipe: …" dibuang karena tetap
 *      salah sumber dan kini redundan (ada kolom khusus).
 *
 * Sumber pemetaan: daftar MAP di bawah (disamakan dengan mock-data.ts).
 * Jalankan:
 *   node scripts/perbaiki-nama-aset.mjs            (dry-run: rencana saja)
 *   node scripts/perbaiki-nama-aset.mjs --apply    (tulis ke database)
 *
 * Kredensial dari `.env`:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";

try {
  loadEnvFile();
} catch {
  // Abaikan — dicek di bawah.
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset."
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
if (!APPLY) {
  console.log("MODE: DRY-RUN (hanya rencana, tidak menulis).\n");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Pemetaan id → [nama, merk, tipe] ──────────────────────────────────────
// (string kosong = tidak tersedia; sinkron dengan mock-data.ts)
const MAP = {
  "ast-001": ["Sedan", "Toyota", "Corolla Altis 1.8 GAT"],
  "ast-002": ["Sepeda Motor", "Kawasaki", "LX 150L"],
  "ast-003": ["Sepeda Motor", "Kawasaki", "KLX 230"],
  "ast-004": ["Sepeda Motor", "Kawasaki", "KLX 230"],
  "ast-005": ["Sepeda Motor", "Kawasaki", "KLX 150 L"],
  "ast-006": ["Mobil Operasional PJR", "Toyota", "TF36"],
  "ast-007": ["Rescue Truck", "Isuzu", ""],
  "ast-008": ["Rescue Truck", "Isuzu", ""],
  "ast-009": ["Rescue Truck", "Isuzu", "NPS 75"],
  "ast-010": ["Rescue Car Type I", "Isuzu", "Dmax Compartemen"],
  "ast-011": ["Rescue Car Type I", "Isuzu", "Dmax Double Cabin"],
  "ast-012": ["Rescue Car Type II", "Isuzu", "Dmax Double Cabin"],
  "ast-013": ["Rescue Car Type II", "Isuzu", "Dmax Double Cabin"],
  "ast-014": ["Rescue Car Type II", "Isuzu", "Dmax Compartemen"],
  "ast-015": ["Rescue Car Type II", "Isuzu", "Dmax Double Cabin"],
  "ast-016": ["Speed Boat / Motor Tempel", "Gemini", "SEA RIDER"],
  "ast-017": ["Speed Boat / Motor Tempel", "Yamaha", "E25BMH"],
  "ast-018": ["Out Boat Motor", "Yamaha", "E40 JMHL"],
  "ast-019": ["Out Boat Motor", "Yamaha", "40 PK ENDURO"],
  "ast-020": ["Out Boat Motor", "Yamaha", "ENDURO"],
  "ast-021": ["Out Boat Motor", "Yamaha", "ENDURO"],
  "ast-022": ["Out Boat Motor", "Yamaha", "25 PK"],
  "ast-023": ["Out Boat Motor", "", ""],
  "ast-024": ["Out Boat Motor", "", ""],
  "ast-025": ["Out Boat Motor", "", ""],
  "ast-026": ["Out Boat Motor", "", ""],
  "ast-027": ["Out Boat Motor", "Yamaha", "E30HMHL"],
  "ast-028": ["Out Boat Motor", "Yamaha", "E30HMHL"],
  "ast-029": ["Out Boat Motor", "Yamaha", "F300 DET"],
  "ast-030": ["Out Boat Motor", "Yamaha", "F300 DET"],
  "ast-031": ["Kapal SAR Kelas II", "", ""],
  "ast-032": ["Rigid Inflatable Boat (RIB) Kelas I", "Vektor", "RIB 1100"],
  "ast-033": ["Rigid Inflatable Boat (RIB) Kelas I", "Sea First", ""],
  "ast-034": ["Rigid Inflatable Boat (RIB) Kelas I", "", ""],
};

/** Buang segmen "Merk: …" dan "Tipe: …" dari keterangan. */
function bersihkanKeterangan(kt) {
  const bagian = (kt ?? "").split("·").map((s) => s.trim()).filter(Boolean);
  return bagian
    .filter((s) => !/^Merk:/i.test(s) && !/^Tipe:/i.test(s))
    .join(" · ");
}

async function main() {
  const { data: asets, error } = await supabase
    .from("asets")
    .select("id, kode, nama, merk, tipe, keterangan");
  if (error || !asets) {
    console.error("Gagal membaca asets:", error?.message ?? "(kosong)");
    process.exit(1);
  }

  const rencana = [];
  for (const a of asets) {
    const target = MAP[a.id];
    if (!target) {
      console.warn(`  ⚠ ${a.id}: tidak ada di pemetaan — dilewati.`);
      continue;
    }
    const [nama, merk, tipe] = target;
    const keterangan = bersihkanKeterangan(a.keterangan);
    const beda =
      a.nama !== nama ||
      a.merk !== merk ||
      a.tipe !== tipe ||
      a.keterangan !== keterangan;
    if (!beda) continue;
    rencana.push({
      id: a.id,
      kode: a.kode,
      dari: [a.nama, a.merk, a.tipe],
      ke: [nama, merk, tipe],
      keteranganBeda: a.keterangan !== keterangan,
      keterangan,
    });
  }

  console.log(`Aset berubah: ${rencana.length} baris\n`);
  for (const r of rencana) {
    console.log(
      `  ${r.id} (${r.kode})\n    nama : ${r.dari[0]} → ${r.ke[0]}\n` +
        `    merk : ${r.dari[1] || "(kosong)"} → ${r.ke[1] || "(kosong)"}\n` +
        `    tipe : ${r.dari[2] || "(kosong)"} → ${r.ke[2] || "(kosong)"}`
    );
    if (r.keteranganBeda) console.log(`    keterangan dibersihkan (Merk/Tipe dibuang)`);
  }

  if (!APPLY) {
    console.log("\nDry-run selesai — jalankan dengan --apply untuk menulis.");
    return;
  }

  let gagal = 0;
  for (const r of rencana) {
    const { error } = await supabase
      .from("asets")
      .update({
        nama: r.ke[0],
        merk: r.ke[1],
        tipe: r.ke[2],
        keterangan: r.keterangan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    if (error) {
      console.error(`  ❌ ${r.id}: ${error.message}`);
      gagal++;
    } else {
      console.log(`  ✔ ${r.id} diperbarui`);
    }
  }
  console.log(`\nSelesai. Gagal: ${gagal}`);
  if (gagal === 0 && rencana.length > 0) {
    console.log("✅ Nama/merek/tipe aset sudah terstruktur — UI menampilkan terpisah.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
