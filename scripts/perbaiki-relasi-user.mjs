/**
 * Script: Perbaiki relasi user (NIP) yang terkosongkan oleh cleanup
 *
 * LXARAN BELAKANG:
 *   `create-supabase-users-v3.mjs --apply` menghapus SEMUA baris
 *   `public.users` (STEP 1 cleanup). Kolom referensi user di tabel lain
 *   bertipe FK `ON DELETE SET NULL`, sehingga sekali jalan kolom-kolom
 *   berikut kosong:
 *     - asets.penanggung_jawab      → kartu PJ operator hilang
 *     - ews_tickets.assigned_to     → operator kehilangan hak
 *                                     membuka/menandai selesai tiketnya
 *       (RLS `tickets_update_bmn`: `assigned_to = nip_jwt()`)
 *     - berita_acara.pengaju_id     → "Diserahkan oleh" kosong
 *     - checklist_harian.pemeriksa_id → draft ceklist operator terlepas
 *   User dibuat ulang oleh script, tetapi relasi lama TIDAK menari sendiri.
 *
 * APA YANG DIPERBAIKI (idempoten, aman dijalankan ulang):
 *   1. asets.penanggung_jawab       := NIP PJ (sumber: mock-data.ts,
 *      dmap per KODE aset, fallback per NAMA aset — PJ_ASET sudah berisi
 *      NIP, bukan "usr-XXX").
 *   2. ews_tickets.assigned_to      := NIP PJ aset terkait — WAJIB
 *      mengikuti PJ (seed lama menugaskan tiket ke akun nonaktif
 *      1111… / Medline / Oky, bukan operator pelaksana). Baris tanpa
 *      aset/aset tanpa petakan dilewati dengan peringatan.
 *   3. berita_acara.pengaju_id      := NIP PJ aset, bila NULL/tak dikenal.
 *   4. checklist_harian.pemeriksa_id := NIP PJ aset, bila NULL/tak dikenal.
 *   5. asets.status                 := 'Maintenance' bila aset masih punya
 *      tiket terbuka (Menunggu/Diproses) tetapi statusnya belum
 *      Maintenance/Rusak* (mis. ews-003), atau 'Standby'+'Baik' bila semua
 *      tiketnya Selesai (mis. ews-004 yang basi masih 'Maintenance') —
 *      mengikuti hasil RPC putuskan_berita_acara / putuskan_tiket_maintenance,
 *      plus baris riwayat_aset untuk audit.
 *
 * Jalankan:
 *   node scripts/perbaiki-relasi-user.mjs            (dry-run: rencana saja)
 *   node scripts/perbaiki-relasi-user.mjs --apply    (tulis ke database)
 *
 * Kredensial dari `.env`:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { loadEnvFile } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
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
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset. " +
      "Isi .env atau jalankan dengan --env-file=.env"
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;
if (DRY_RUN) {
  console.log("MODE: DRY-RUN (hanya rencana, tidak menulis).\n");
  console.log("Jalankan dengan --apply untuk eksekusi.\n");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Muat mock-data.ts (jiti, pola seperti generate-seed-sql.mjs) ────────────

function muatMockData() {
  const cwd = process.cwd();
  const require2 = createRequire(path.join(cwd, "package.json"));
  let jitiPath;
  try {
    jitiPath = require2.resolve("jiti");
  } catch {
    // jiti bukan dependency langsung — cari di store pnpm (versi fleksibel).
    const pnpmDir = path.join(cwd, "node_modules/.pnpm");
    const dir = fs
      .readdirSync(pnpmDir)
      .find((d) => d.startsWith("jiti@"))
      ?.split("_")[0];
    if (!dir) throw new Error("jiti tidak ditemukan");
    jitiPath = path.join(pnpmDir, dir, "node_modules/jiti/lib/jiti.cjs");
  }
  const jiti = require2(jitiPath);
  const run = jiti(path.join(cwd, "scripts/perbaiki-relasi-user.mjs"), {
    interopDefault: true,
    cache: false,
    moduleCache: false,
  });
  const mock = run(path.join(cwd, "src/components/shared/mock-data.ts"));
  return mock;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const bars = "-".repeat(64);
const nipValid = (v) => typeof v === "string" && /^\d{16,18}$/.test(v);

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== PERBAIKI RELASI USER (NIP) + STATUS ASET ===\n");

  // 1. Mapping kode/nama aset → NIP PJ dari mock-data (source of truth).
  const mock = muatMockData();
  const pjByKode = new Map();
  const pjByNama = new Map();
  for (const a of mock.asetList ?? []) {
    if (!nipValid(a.penanggungJawab)) continue;
    if (!pjByKode.has(a.kode)) pjByKode.set(a.kode, a.penanggungJawab);
    if (!pjByNama.has(a.nama)) pjByNama.set(a.nama, a.penanggungJawab);
  }
  console.log(
    `Mapping aset → NIP PJ (mock-data): ${pjByKode.size} entri kode, ${pjByNama.size} entri nama.\n`
  );

  // 2. Ambil data DB.
  const [{ data: users }, { data: asets }, { data: tikets }, { data: bas }, { data: ceklists }] =
    await Promise.all([
      supabase.from("users").select("id, nip, nama, role, aktif"),
      supabase.from("asets").select("id, kode, nama, nup, penanggung_jawab, status, kondisi"),
      supabase.from("ews_tickets").select("id, aset_id, judul, assigned_to, status"),
      supabase.from("berita_acara").select("id, aset_id, nomor, pengaju_id"),
      supabase.from("checklist_harian").select("id, aset_id, pemeriksa_id"),
    ]);
  if (!users || !asets) {
    console.error("Gagal membaca users/asets:", users ? "(asets kosong?)" : users?.error ?? "");
    process.exit(1);
  }

  const nipTerdaftar = new Set(users.map((u) => u.nip).filter(nipValid));
  console.log(`users: ${users.length} baris (${nipTerdaftar.size} NIP valid).\n`);

  const relokasi = new Map([
    ["asets", []],
    ["ews_tickets", []],
    ["berita_acara", []],
    ["checklist_harian", []],
  ]);
  let asetTerlewati = 0;

  // 3. Susun PJ final per aset (dipakai tabel lain).
  const pjAset = new Map(); // aset_id → NIP PJ target
  for (const a of asets ?? []) {
    let target = pjByKode.get(a.kode) ?? null;
    if (!target) target = pjByNama.get(a.nama) ?? null;
    if (!target || !nipTerdaftar.has(target)) {
      console.warn(
        `  ⚠ aset ${a.kode} ${a.nama}: tidak ada petakan PJ yang valid — dilewati.`
      );
      asetTerlewati++;
      continue;
    }
    if (a.penanggung_jawab !== target) {
      relokasi.get("asets").push({
        id: a.id,
        label: `${a.kode} ${a.nama}`,
        dari: a.penanggung_jawab ?? "(null)",
        ke: target,
      });
    }
    pjAset.set(a.id, target);
  }

  // 4. Tiket ditugaskan WAJIB mengikuti PJ asetnya — operator lapangan
  //    penanggung jawab kendaraan adalah pelaksana perbaikan (RLS
  //    `tickets_update_bmn` + RPC putuskan mengenali PJ via assigned_to).
  //    Nilai yang sudah = PJ tidak diubah.
  const daftarTiket = tikets ?? [];
  for (const t of daftarTiket) {
    const pj = t.aset_id ? pjAset.get(t.aset_id) : null;
    if (!pj) {
      console.warn(
        `  ⚠ ews_tickets ${t.id} (aset=${t.aset_id ?? "-"}): tanpa petakan PJ — dilewati.`
      );
      continue;
    }
    if (t.assigned_to === pj) continue;
    relokasi.get("ews_tickets").push({ id: t.id, dari: t.assigned_to ?? "(null)", ke: pj });
  }

  //    BA dan ceklist hanya diisi bila NULL/tak dikenal (histori tetap
  //    dihormati; identitas penyerah/pemeriksa lama tidak ditimpa).
  const petaLepas = [
    { tabel: "berita_acara", kolom: "pengaju_id", baris: bas ?? [] },
    { tabel: "checklist_harian", kolom: "pemeriksa_id", baris: ceklists ?? [] },
  ];
  for (const { tabel, kolom, baris: daftar } of petaLepas) {
    for (const r of daftar) {
      const nilai = r[kolom];
      if (nipValid(nilai) && nipTerdaftar.has(nilai)) continue; // sudah baik
      const pj = r.aset_id ? pjAset.get(r.aset_id) : null;
      if (!pj) {
        console.warn(
          `  ⚠ ${tabel} ${r.id} (aset=${r.aset_id ?? "-"}): tanpa petakan PJ — dilewati.`
        );
        continue;
      }
      relokasi.get(tabel).push({ id: r.id, dari: nilai ?? "(null)", ke: pj });
    }
  }

  // 5. Status aset vs tiket — dua arah, sama seperti perilaku RPC:
  //    a) Tiket terbuka (Menunggu/Diproses) + aset belum berstatus
  //       Maintenance/Rusak* → aset := 'Maintenance' (hasil
  //       putuskan_berita_acara). Seed lama bisa timpang — mis. ews-003
  //       Menunggu tetapi asetnya masih Standby.
  //    b) Semua tiket Selesai (tidak ada terbuka) + aset bukan
  //       'Standby'/'Baik' → aset := 'Standby' + 'Baik' (hasil
  //       putuskan_tiket_maintenance) — mis. ews-004 Selesai tetapi
  //       asetnya masih 'Maintenance'.
  const tiketPerAset = new Map(); // aset_id → { selesai: bool, terbuka: bool, ids: [] }
  for (const t of tikets ?? []) {
    if (!t.aset_id) continue;
    const st = tiketPerAset.get(t.aset_id) ?? { selesai: false, terbuka: false, ids: [] };
    if (t.status === "Selesai") st.selesai = true;
    if (t.status === "Menunggu" || t.status === "Diproses") st.terbuka = true;
    st.ids.push(t.id);
    tiketPerAset.set(t.aset_id, st);
  }
  const statusRusak = new Set(["Maintenance", "Rusak Ringan", "Rusak Berat"]);
  const daftarAsetStatus = []; // { aset, dari, ke, aksi, keterangan }
  for (const a of asets ?? []) {
    const st = tiketPerAset.get(a.id);
    if (!st) continue;
    const dari = `${a.status ?? "(null)"} · ${a.kondisi ?? "(null)"}`;
    const daftarTiketTxt = st.ids.join(", ") || "-";
    if (st.terbuka) {
      if (statusRusak.has(a.status ?? "")) continue; // sudah berstatus rusak/maintenance
      daftarAsetStatus.push({
        aset: a,
        dari,
        ke: "Maintenance",
        aksi: "Masuk Antrian Maintenance",
        keterangan: `Aset masuk antrian maintenance — tiket ${daftarTiketTxt} masih berjalan (perbaikan data).`,
      });
    } else if (st.selesai) {
      if (a.status === "Standby" && a.kondisi === "Baik") continue;
      daftarAsetStatus.push({
        aset: a,
        dari,
        ke: "Standby · Baik",
        aksi: "Maintenance Selesai",
        keterangan: `Perbaikan selesai — aset kembali standby dan siap operasional (tiket ${daftarTiketTxt}; perbaikan data).`,
      });
    }
  }
  //    Riwayat_aset ikut diisi agar audit trail ada (pola seperti di RPC).

  // 6. Tampilkan rencana.
  console.log("\n=== RENCANA PERUBAHAN ===");
  console.log(bars);
  for (const [tabel, barisan] of relokasi) {
    console.log(`\n${tabel}: ${barisan.length} baris`);
    for (const b of barisan) {
      console.log(`  ${b.id}: ${b.dari} → ${b.ke}${b.label ? ` (${b.label})` : ""}`);
    }
  }
  console.log(`\nasets (status vs tiket): ${daftarAsetStatus.length} baris`);
  for (const b of daftarAsetStatus) {
    console.log(`  ${b.aset.id} ${b.aset.kode}: ${b.dari} → ${b.ke} (${b.aksi})`);
  }
  if (asetTerlewati > 0) console.warn(`\n(${asetTerlewati} aset tanpa petakan dilewati)`);

  if (DRY_RUN) {
    console.log("\nDry-run selesai — jalankan dengan --apply untuk menulis.\n");
    return;
  }

  console.log("\n=== MENULIS ===");
  const kolomDariTabel = {
    asets: "penanggung_jawab",
    ews_tickets: "assigned_to",
    berita_acara: "pengaju_id",
    checklist_harian: "pemeriksa_id",
  };
  let gagal = 0;
  for (const [tabel, barisan] of relokasi) {
    const kolom = kolomDariTabel[tabel];
    for (const b of barisan) {
      const { error } = await supabase.from(tabel).update({ [kolom]: b.ke }).eq("id", b.id);
      if (error) {
        console.error(`  ❌ ${tabel} ${b.id}: ${error.message}`);
        gagal++;
      } else {
        console.log(`  ✔ ${tabel} ${b.id} ${kolom} = ${b.ke}`);
      }
    }
  }

  // 7. Tulis status aset + riwayat audit.
  for (const b of daftarAsetStatus) {
    const [keStatus, keKondisi] =
      b.ke === "Standby · Baik" ? ["Standby", "Baik"] : ["Maintenance", null];
    const patch = { status: keStatus, updated_at: new Date().toISOString() };
    if (keKondisi) patch.kondisi = keKondisi;
    const { error } = await supabase.from("asets").update(patch).eq("id", b.aset.id);
    if (error) {
      console.error(`  ❌ asets ${b.aset.id} status: ${error.message}`);
      gagal++;
      continue;
    }
    console.log(`  ✔ asets ${b.aset.id} status = ${b.ke}`);
    const { error: errRiw } = await supabase.from("riwayat_aset").insert({
      aset_id: b.aset.id,
      tanggal: new Date().toISOString().slice(0, 10),
      aksi: b.aksi,
      keterangan: b.keterangan,
      user_id: b.aset.penanggung_jawab ?? null,
    });
    if (errRiw) {
      console.error(`  ⚠ riwayat_aset ${b.aset.id}: ${errRiw.message}`);
    } else {
      console.log(`    riwayat_aset dicatat`);
    }
  }

  // 6. Sisa tak berrelasi (harus 0 kolom assigned_to/pengaju_id/pemeriksa_id
  //    yang masih lepas, kecuali baris tanpa aset).
  const { data: verif } = await supabase.from("ews_tickets").select("id, assigned_to");
  const sisaLepas = (verif ?? []).filter(
    (t) => !(nipValid(t.assigned_to) && nipTerdaftar.has(t.assigned_to))
  );
  console.log(`\n=== SELESAI ===\n`);
  console.log(
    `ews_tickets tanpa relasi: ${sisaLepas.length}` +
      (sisaLepas.length ? ` → ${sisaLepas.map((t) => t.id).join(", ")}` : "")
  );
  console.log(`Gagal ditulis: ${gagal}`);
  if (gagal === 0) {
    console.log(
      "\n✅ Relasi menari. Coba login di operator PJ — kartu alur, tiket," +
        " dan tombol tandai selesai harusnya kembali berfungsi."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
