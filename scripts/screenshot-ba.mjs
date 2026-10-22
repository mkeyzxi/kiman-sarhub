/**
 * Screenshot halaman Berita Acara (Chrome headless via CDP).
 * Jalankan: node scripts/screenshot-ba.mjs [width] [out.png]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9377;

const width = Number(process.argv[2] ?? 1280);
const out = process.argv[3] ?? "shot-ba.png";
const path = process.argv[4] ?? "/operator/checklist/arm-001/berita-acara";
const fullPage = process.argv[5] === "full";

const profileDir = mkdtempSync(join(tmpdir(), "cdp-shot-"));
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
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
}

let target;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch {}
  await sleep(250);
}
console.log("TARGET:", JSON.stringify(target));
const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

console.log("NAV:", `${BASE}/login`); try { await cdp.send("Page.navigate", { url: `${BASE}/login` }); console.log("nav1 ok"); } catch(e) { console.log("nav1 FAIL", e.message); }
await sleep(2500);
await cdp.eval(`
  localStorage.setItem("userNama", "Medlyn R. Pagali");
  localStorage.setItem("userRole", "ADMIN_IT");
  true;
`);
console.log("NAV2:", JSON.stringify(BASE + path)); await cdp.send("Page.navigate", { url: BASE + path });
await sleep(4000);

const shot = await cdp.send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: fullPage,
});
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log("tersimpan:", out);

// Versi cetak (meniru Ctrl+P) — dipakai untuk memeriksa @media print.
if (process.env.PDF_OUT) {
  const pdf = await cdp.send("Page.printToPDF", {
    printBackground: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0.7,
    marginBottom: 0.7,
    marginLeft: 0.6,
    marginRight: 0.6,
  });
  writeFileSync(process.env.PDF_OUT, Buffer.from(pdf.data, "base64"));
  console.log("pdf:", process.env.PDF_OUT);
}

// Pratinjau media "print" — elemen UI disembunyikan, hanya lembar dokumen.
if (process.env.PREVIEW_PRINT) {
  await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
  await sleep(500);
  const shotPrint = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  writeFileSync(process.env.PREVIEW_PRINT, Buffer.from(shotPrint.data, "base64"));
  console.log("pratinjau print:", process.env.PREVIEW_PRINT);
  await cdp.send("Emulation.setEmulatedMedia", { media: "" });
}

chrome.kill();
try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }); } catch {}
