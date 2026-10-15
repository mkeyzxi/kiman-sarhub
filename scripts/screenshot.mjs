/**
 * Ambil screenshot halaman pada lebar tertentu (Chrome headless via CDP).
 * Jalankan: node scripts/screenshot.mjs <path> <width> <out.png>
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9334;

const path = process.argv[2] ?? "/operator";
const width = Number(process.argv[3] ?? 390);
const out = process.argv[4] ?? "shot.png";
const height = Number(process.argv[5] ?? 900);
const scrollTo = Number(process.argv[6] ?? 0);

const profileDir = mkdtempSync(join(tmpdir(), "cdpshot-"));
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
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
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
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`timeout ${method}`)); }
      }, 30000);
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval error");
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

const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width, height, deviceScaleFactor: 2, mobile: width < 768,
});
await cdp.send("Page.navigate", { url: `${BASE}/login` });
await sleep(2200);
await cdp.eval(`localStorage.setItem("userRole","ADMIN_IT")`);
await cdp.send("Page.navigate", { url: BASE + path });
await sleep(2500);
if (scrollTo > 0) {
  await cdp.eval(`document.querySelector("main").scrollTop = ${scrollTo}`);
  await sleep(600);
}

const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(data, "base64"));
console.log("tersimpan:", out);

chrome.kill();
try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }); } catch {}