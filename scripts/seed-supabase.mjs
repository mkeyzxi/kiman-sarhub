/**
 * Seed Script: Memindahkan data master dari mock-data.ts ke Supabase.
 *
 * Script ini:
   1. Membaca asetList, users, dan data lain dari mock-data.ts.
   2. Menyaring/memetakan ke tabel Supabase: profiles, asets, checklists, logbooks, notifications, activity_log.
   3. Mapping penanggung jawab (penanggungJawab -> profiles.id) menggunakan konstanta PJ_ASET.
   4. BUKAN menambahkan `kendaraan` ke user_metadata, melainkan dihubungkan melalui NIP di tabel profiles.
 *
 * SEBELUM JALANKAN:
   - Pastikan Supabase URL dan Service Role Key sudah diset di .env.
   - Jalankan terlebih dahulu `node scripts/create-supabase-users-v3.mjs --apply` untuk membuat user auth + profiles.
   - Pastikan tabel-tabel di bawah ini sudah dibuat di Supabase (migrasi SQL).
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://yzswezcgttegsrqisrfq.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "ENV_REPLACE_SECRET";

if (!supabaseKey || supabaseKey === "ENV_REPLACE_SECRET") {
  console.error("⚠️  SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment. Tambahkan ke .env.");
  process.exit(1);
}

const supa = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// -------------------------------------------------------
// 1. BACA MOCK-DATA
// -------------------------------------------------------
const mockPath = path.join(process.cwd(), "src", "components", "shared", "mock-data.ts");
const mockSource = fs.readFileSync(mockPath, "utf8");

// Extract users (only operator lapangan yang berperan sebagai PJ)
const users = [];
const userIdx = mockSource.indexOf("export const users:");
if (userIdx >= 0) {
  const userSection = mockSource.substring(userIdx);
  const userEnd = userSection.indexOf("];", userIdx);
  const userBlock = userSection.substring(0, userEnd + 1);
  // Parse sederhana: ambil baris id, nama, nip, role
  const userLines = userBlock.split("\n").filter(l => l.trim().startsWith("id:") || l.trim().startsWith("nama:") || l.trim().startsWith("nip:") || l.trim().startsWith("role:"));
  let currentUser = {};
  for (const line of userLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("id:")) {
      currentUser.id = trimmed.split(":")[1].trim().replace(/"/g, "").replace(/,/g, "");
    } else if (trimmed.startsWith("nama:")) {
      currentUser.name = trimmed.split(":")[1].trim().replace(/"/g, "").replace(/,/g, "");
    } else if (trimmed.startsWith("nip:")) {
      currentUser.nip = trimmed.split(":")[1].trim().replace(/"/g, "").replace(/,/g, "");
    } else if (trimmed.startsWith("role:")) {
      currentUser.role = trimmed.split(":")[1].trim().replace(/"/g, "").replace(/,/g, "");
      if (currentUser.role === "OPERATOR_LAPANGAN" && currentUser.id && currentUser.nip) {
        users.push({ ...currentUser });
      }
      currentUser = {};
    }
  }
}

console.log(`📦 Total operator lapangan dari mock: ${users.length}`);

// Extract asetList
const asets = [];
const asetIdx = mockSource.indexOf("export const asetList:");
if (asetIdx >= 0) {
  const asetSection = mockSource.substring(asetIdx);
  // Cari hingga berikutnya (banyak fitur setelahnya) - ambil hingga 34 aset atau ditemukan akhirsemicolon besar
  // Kita gunakan regex untuk ekstrak tiap objek aset
  const asetRegex = /id:\s*"(ast-\d+)"[\s\S]{1,2000}penanggungJawab:\s*(PJ_ASET\.\w+|"usr-\d+")/g;
  let match;
  let count = 0;
  while ((match = asetRegex.exec(asetSection)) && count < 34) {
    const id = match[1];
    const pjRef = match[2];
    // Resolve PJ ID
    let pjId = "usr-005"; // default
    if (pjRef.startsWith("PJ_ASET.")) {
      const key = pjRef.split(".")[1];
      // Mapping PJ_ASET key ke usr-id (diambil dari konstanta di mock-data)
      const pjMap = {
        fajar: "usr-005", hasril: "usr-006", ahmadAidid: "usr-007", ardiansyah: "usr-008",
        agustang: "usr-009", abdMalik: "usr-010", adiaksa: "usr-011", agan: "usr-012",
        haerul: "usr-013", abduh: "usr-014", ibnu: "usr-015", calvin: "usr-016",
        wahyudi: "usr-017", fajrin: "usr-018", sulaeman: "usr-019", akmal: "usr-020",
        akbar: "usr-021", andi: "usr-022", andrie: "usr-023"
      };
      pjId = pjMap[key] || "usr-005";
    } else {
      pjId = pjRef.replace(/"/g, "");
    }

    // Ambil nama aset ( Nama Aset di awal blok )
    const namaMatch = asetSection.match(/id:\s*"${id}"[\s\S]{1,500}nama:\s*"([^"]+)"/);
    const nama = namaMatch ? namaMatch[1] : `Aset ${id}`;

    // Ambil noPolisi
    const polMatch = asetSection.match(/noPolisi:\s*"([^"]+)"/);
    const noPolisi = polMatch ? polMatch[1] : "";

    // Ambil kategori
    const katMatch = asetSection.match(/kategori:\s*"([^"]+)"/);
    const kategori = katMatch ? katMatch[1] : "Mobil";

    // Ambil nilai
    const nilaiMatch = asetSection.match(/nilaiBuku:\s*([0-9]+)/);
    const nilaiBuku = nilaiMatch ? parseInt(nilaiMatch[1]) : 0;

    // Ambil kode barang
    const kodeMatch = asetSection.match(/kode:\s*"([^"]+)"/);
    const kode = kodeMatch ? kodeMatch[1] : "";

    asets.push({
      id: id,
      nama: nama,
      noPolisi: noPolisi,
      kategori: kategori,
      nilaiBuku: nilaiBuku,
      kode: kode,
      penanggung_jawab: pjId
    });
    count++;
  }
}

console.log(`🚗 Total aset terextract: ${asets.length}`);

// -------------------------------------------------------
// 2. SIAP KE SUPPABASE
// -------------------------------------------------------
async function run() {
  console.log("🚀 Memulai seeding ke Supabase...");

  // 2a. Pastikan profiles sudah ada (sudah dibuat create-supabase-users-v3.mjs)
  // Cek users yang sudah ada di Supabase
  const { data: existingUsers } = await supabase.from("profiles").select("id, nip").limit(100);
  console.log("👥 Users di Supabase (sample):", existingUsers?.length);

  // 2b. Insert asets
  console.log("📦 Menyisipkan aset ke Supabase...");
  for (const a of asets) {
    // Cek apakah sudah ada (kode unik)
    const { data: existing } = await supabase.from("asets").select("id").eq("kode", a.kode).maybeSingle();
    if (existing) {
      console.log(`  ⏭️  Aset ${a.kode} sudah ada, dilewati.`);
      continue;
    }
    const { error } = await supabase.from("asets").insert({
      kode: a.kode,
      nup: a.kode.split("-")[1] || "",
      kategori: a.kategori,
      no_polisi: a.noPolisi,
      status: a.status || "Standby",
      kondisi: a.kondisi || "Baik",
      nilai_perolehan: 0, // bisa diisi dari data asli jika ada
      nilai_buku: a.nilaiBuku,
      penanggung_jawab: a.penanggung_jawab, // references profiles(id)
      kode_barang: a.kode.split("-")[0] || "",
      merk: "", // bisa diisi dari data asli
      tipe: "", // bisa diisi dari data asli
      no_stnk: "",
      no_ssp: "",
      tanggal_perolehan: null,
      tanggal_ssp: null,
      nilai_penyusutan: 0,
      umur_aset_tahun: 0,
      status_bmn: "Aktif",
      kode_register: "",
      jumlah_foto: 0
    });

    if (error) console.error(`  ❌ Gagal ${a.kode}:`, error.message);
    else console.log(`  ✅ ${a.kode} dimasukkan (PJ: ${a.penanggung_jawab})`);
  }

  console.log("✅ Seeding selesai.");
}

run().catch(err => console.error("❌ Error seeding:", err));