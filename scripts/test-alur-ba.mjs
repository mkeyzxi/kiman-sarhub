/**
 * Uji alur end-to-end Berita Acara (headless Chrome via CDP).
 *
 * Skenario:
 *  1. Sesi login (role ADMIN_IT — punya akses /operator dan /bmn).
 *  2. Buat checklist manual dengan 1 item "Rusak Ringan".
 *  3. Pastikan tombol "Pengisian Berita Acara" muncul, lalu form BA terisi
 *     otomatis (nama aset, kode, tanggal dalam kata, tabel kendala).
 *  4. Serahkan ke BMN → tiket EWS dibuat, BA berstatus "Diserahkan".
 *  5. BMN menyetujui → status aset jadi "Dipindahkan".
 *  6. Dashboard operasional menampilkan aset tersebut di "Perlu Perawatan".
 *
 * Navigasi memakai klik link (client-side routing) supaya state in-memory
 * (tiket & berita acara) tidak hilang saat pindah halaman.
 *
 * Jalankan: node scripts/test-alur-ba.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9344;

const profileDir = mkdtempSync(join(tmpdir(), "cdp-ba-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "about:blank",
]);
chrome.stderr.on("data", () => {});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res, { once: true });
      ws.addEventListener("error", rej, { once: true });
    });
    return new Cdp(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 30000);
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(
        r.exceptionDetails.exception?.description ??
          JSON.stringify(r.exceptionDetails)
      );
    }
    return r.result.value;
  }
}

const HELPERS = `
  window.__setValue = (el, value) => {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  window.__byText = (selector, text) =>
    [...document.querySelectorAll(selector)].find((el) =>
      (el.textContent || "").trim().toLowerCase().includes(text.toLowerCase())
    );
`;

let cdp;
const log = (...a) => console.log(...a);

async function reload(wait = 2500) {
  await cdp.send("Page.navigate", { url: BASE + cdp.lastUrl });
  await sleep(wait);
  await cdp.eval(HELPERS);
}

async function clickByText(selector, text) {
  const ok = await cdp.eval(`(() => {
    const el = window.__byText(${JSON.stringify(selector)}, ${JSON.stringify(text)});
    if (!el) return false;
    el.click();
    return true;
  })()`);
  if (!ok) throw new Error(`Elemen "${text}" (${selector}) tidak ditemukan`);
  await sleep(600);
  return ok;
}

async function setValue(selector, value, index = 0) {
  const ok = await cdp.eval(`(() => {
    const els = document.querySelectorAll(${JSON.stringify(selector)});
    const el = els[${index}];
    if (!el) return false;
    window.__setValue(el, ${JSON.stringify(value)});
    return true;
  })()`);
  if (!ok) throw new Error(`Input ${selector}[${index}] tidak ditemukan`);
  await sleep(400);
  return ok;
}

async function path() {
  return cdp.eval("location.pathname");
}

/** Navigasi client-side lewat link sidebar (mempertahankan state in-memory). */
async function navTo(href, timeout = 8000) {
  const res = await cdp.eval(`(() => {
    const links = [...document.querySelectorAll('a[href="${href}"]')];
    if (!links.length) return { ok: false, jumlah: 0 };
    const link = links.find(a => a.offsetParent !== null) || links[0];
    link.click();
    return { ok: true, jumlah: links.length, teks: (link.textContent || "").trim().slice(0, 40) };
  })()`);
  if (!res.ok) throw new Error(`Link ${href} tidak ditemukan`);
  const mulai = Date.now();
  while (Date.now() - mulai < timeout) {
    if ((await path()) === href) return res;
    await sleep(300);
  }
  throw new Error(`Gagal pindah ke ${href} (terkini: ${await path()})`);
}

async function main() {
  let target;
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (
        await fetch(`http://127.0.0.1:${PORT}/json/list`)
      ).json();
      target = list.find((t) => t.type === "page");
      if (target) break;
    } catch {}
    await sleep(250);
  }
  if (!target) throw new Error("Chrome tidak merespons");

  cdp = await Cdp.connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // ── 1. Sesi login ────────────────────────────────────────────────────────
  await cdp.send("Page.navigate", { url: `${BASE}/login` });
  await sleep(3000);
  await cdp.eval(`
    localStorage.setItem("userNama", "Medlyn R. Pagali");
    localStorage.setItem("userRole", "ADMIN_IT");
    localStorage.setItem("userNip", "198503122010012001");
    true;
  `);
  log("✓ 1. Sesi login diset (ADMIN_IT)");

  // ── 2. Buat checklist manual dengan item rusak ───────────────────────────
  await cdp.send("Page.navigate", { url: `${BASE}/operator/checklist/buat` });
  await sleep(4000);
  await cdp.eval(HELPERS);

  await setValue("#tanggal", "2026-10-21");
  await clickByText("button", "Peralatan Lainnya");
  await sleep(600);
  await setValue("#unit", "Tenda Medis Emergency 6x4");
  await sleep(400);

  await clickByText("button", "Tambah Item");
  await setValue('input[aria-label="Item pemeriksaan 1"]', "Pin Tiang Tenda");
  await clickByText("button", "Ringan");
  await sleep(400);
  await setValue(
    'input[placeholder^="Keterangan wajib diisi"]',
    "Pin patah sebelah kiri, perlu diganti"
  );
  await sleep(400);

  const siapSimpan = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll("button")].find(b => b.textContent.includes("Simpan Checklist"));
    return btn ? !btn.disabled : null;
  })()`);
  if (siapSimpan !== true) throw new Error("Tombol Simpan Checklist masih disabled");
  log("✓ 2a. Form checklist terisi (item Rusak Ringan)");

  await clickByText("button", "Simpan Checklist");
  await sleep(1500);

  // ── 3. Tombol Pengisian Berita Acara muncul ─────────────────────────────
  const adaTombolBA = await cdp.eval(`(() => {
    const el = window.__byText("a,button", "Pengisian Berita Acara");
    if (!el) return null;
    return { teks: el.textContent.trim(), href: el.getAttribute("href") || "" };
  })()`);
  if (!adaTombolBA) throw new Error("Tombol 'Pengisian Berita Acara' tidak muncul");
  log("✓ 3. Tombol Pengisian Berita Acara muncul →", adaTombolBA.href);

  // ── 4. Form BA terisi otomatis ───────────────────────────────────────────
  // Navigasi client-side (klik link) supaya checklist in-memory tetap ada.
  await cdp.eval(`(() => {
    const link = document.querySelector('a[href="${adaTombolBA.href}"]');
    if (!link) return false;
    link.click();
    return true;
  })()`);
  await sleep(3000);
  await cdp.eval(HELPERS);
  if (!(await path()).includes("/berita-acara"))
    throw new Error("Gagal membuka form BA: " + (await path()));

  const isiBA = await cdp.eval(`(() => {
    const ambil = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.value : null;
    };
    const baris = [...document.querySelectorAll("table tbody tr")].map(tr =>
      [...tr.querySelectorAll("td")].map(td => td.textContent.trim())
    );
    return {
      namaAset: ambil("#namaAset"),
      kodeAset: ambil("#kodeAset"),
      nomor: ambil("#nomor"),
      tanggalTeks: (document.body.innerText.match(/Pada hari ini[^\\n]*/) || [""])[0],
      barisKendala: baris,
      adaTombolSerah: !![...document.querySelectorAll("button")].find(b => b.textContent.includes("Serahkan ke BMN")),
    };
  })()`);

  if (isiBA.namaAset !== "Tenda Medis Emergency 6x4")
    throw new Error("Nama aset tidak terisi otomatis: " + isiBA.namaAset);
  if (isiBA.kodeAset !== "BMN-MED-001")
    throw new Error("Kode aset tidak sesuai: " + isiBA.kodeAset);
  if (isiBA.nomor !== "") throw new Error("Nomor BA harus kosong");
  if (!/Pada hari ini/.test(isiBA.tanggalTeks))
    throw new Error("Teks tanggal tidak terisi: " + isiBA.tanggalTeks);
  if (isiBA.barisKendala.length < 1)
    throw new Error("Tabel Informasi Kendala kosong");
  if (!isiBA.adaTombolSerah) throw new Error("Tombol 'Serahkan ke BMN' tidak ada");
  log("✓ 4. Form BA terisi otomatis:", JSON.stringify(isiBA));

  // Isi uraian lalu serahkan
  await setValue("#uraian", "Pin tiang patah sebelah kiri sehingga tenda tidak layak didirikan.");
  await clickByText("button", "Serahkan ke BMN");
  await sleep(2500);

  const urlSetelahSerah = await path();
  if (!urlSetelahSerah.startsWith("/operator/checklist/"))
    throw new Error("Tidak kembali ke detail checklist: " + urlSetelahSerah);
  const badgeBA = await cdp.eval(`(() => {
    const el = window.__byText("span,div", "Berita Acara:");
    return el ? el.textContent.trim() : null;
  })()`);
  if (!badgeBA || !badgeBA.includes("Diserahkan"))
    throw new Error("Status BA setelah serah bukan Diserahk: " + badgeBA);
  log("✓ 5. Serah → kembali ke checklist, badge:", badgeBA);

  // ── 6. Tiket masuk antrean BMN (client-side navigation) ──────────────────
  await navTo("/bmn/maintenance");

  const hrefTiket = await cdp.eval(`(() => {
    const links = [...document.querySelectorAll('a[href^="/bmn/maintenance/ews-"]')];
    const cocok = links.find(a => {
      const row = a.closest("tr,li");
      return row && row.textContent.includes("Kerusakan Tenda Medis");
    });
    return cocok ? cocok.getAttribute("href") : null;
  })()`);
  if (!hrefTiket) throw new Error("Tiket baru tidak muncul di daftar tiket BMN");
  log("✓ 6. Tiket masuk antrean BMN:", hrefTiket);

  // ── 7. Panel BA di sisi BMN + Setujui ────────────────────────────────────
  await cdp.eval(`(() => {
    const link = document.querySelector('a[href="${hrefTiket}"]');
    if (!link) return false;
    link.click();
    return true;
  })()`);
  await sleep(2500);

  const panelBA = await cdp.eval(`(() => {
    const body = document.body.innerText;
    return {
      adaPanelBA: body.includes("Berita Acara Kerusakan"),
      adaTabel: document.querySelectorAll("table").length,
      adaSetujui: !![...document.querySelectorAll("button")].find(b => b.textContent.includes("Setujui")),
      adaTolak: !![...document.querySelectorAll("button")].find(b => b.textContent.includes("Tolak Berita Acara")),
      namaBarang: (body.match(/Pin Tiang Tenda/) || [""])[0],
    };
  })()`);
  if (!panelBA.adaPanelBA) throw new Error("Panel Berita Acara tidak tampil di BMN");
  if (!panelBA.adaSetujui || !panelBA.adaTolak)
    throw new Error("Tombol Setujui/Tolak tidak ada: " + JSON.stringify(panelBA));
  if (!panelBA.namaBarang) throw new Error("Item rusak tidak tampil di panel BA");
  log("✓ 7. Panel BA tampil di BMN:", JSON.stringify(panelBA));

  await clickByText("button", "Setujui");
  await sleep(1500);

  const setelahSetujui = await cdp.eval(`(() => {
    const body = document.body.innerText;
    return {
      adaPesan: body.includes("disetujui"),
      badge: (body.match(/Berita Acara:\\s*\\n?\\s*(Disetujui|Ditolak|Diserahkan|Draf)/) || [""])[0].replace(/\\s+/g, " "),
    };
  })()`);
  log("✓ 8. BMN menyetujui:", JSON.stringify(setelahSetujui));

  // ── 9. Dashboard operasional sinkron ─────────────────────────────────────
  await navTo("/operator");
  await sleep(1200);

  const dashboard = await cdp.eval(`(() => {
    const main = document.querySelector("main");
    const teks = main ? main.innerText : document.body.innerText;
    const i = teks.indexOf("Perlu Perawatan");
    const bagian = i >= 0 ? teks.slice(i, i + 700) : "";
    return {
      adaTenda: bagian.includes("Tenda Medis"),
      adaDipindahkan: /Tenda Medis[\\s\\S]{0,200}Dipindahkan/.test(bagian),
      bagian: bagian.replace(/\\n+/g, " | ").slice(0, 400),
      jumlahUnit: (teks.match(/Perlu Perawatan\\s*\\n?\\s*(\\d+) unit/) || [])[1] || null,
    };
  })()`);
  log("✓ 9. Dashboard operator:", JSON.stringify(dashboard));

  if (!dashboard.adaTenda)
    throw new Error("Tenda Medis tidak muncul di panel Perlu Perawatan");
  if (!dashboard.adaDipindahkan)
    throw new Error("Status 'Dipindahkan' tidak tercermin di dashboard: " + dashboard.bagian);

  console.log("\nSELURUH ALUR BERITA ACARA LOLOS ✅");
  chrome.kill();
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }); } catch {}
}

main().catch(async (e) => {
  console.error("\nGAGAL:", e.message);
  try {
    const info = await cdp.eval(`(() => ({
      url: location.href,
      h1: document.querySelector("h1")?.textContent || null,
      body: document.body.innerText.slice(0, 700),
    }))()`);
    console.error("DUMP:", JSON.stringify(info, null, 2));
  } catch {}
  try {
    chrome.kill();
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 });
  } catch {}
  process.exit(1);
});
