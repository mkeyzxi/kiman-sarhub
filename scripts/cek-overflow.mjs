/**
 * Mengukur scrollWidth dokumen pada beberapa lebar viewport memakai Chrome
 * headless via Chrome DevTools Protocol (Node built-in WebSocket, tanpa dependency).
 *
 * Jalankan:  node scripts/cek-overflow.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;

const WIDTHS = [360, 390, 430, 768, 820, 1024, 1280];
const PATHS = [
  "/operator",
  "/operator/logbook",
  "/bmn/maintenance",
  "/pimpinan",
  "/operator/checklist",
  "/bmn",
];

const profileDir = mkdtempSync(join(tmpdir(), "cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--hide-scrollbars=false",
  "about:blank",
]);
chrome.stderr.on("data", () => {});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpTargets() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  return res.json();
}

/** Klien CDP minimal di atas WebSocket bawaan Node. */
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
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
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
      throw new Error(r.exceptionDetails.exception?.description ?? "eval error");
    }
    return r.result.value;
  }
}

async function main() {
  // Tunggu Chrome siap.
  let target;
  for (let i = 0; i < 40; i++) {
    try {
      const list = await cdpTargets();
      target = list.find((t) => t.type === "page");
      if (target) break;
    } catch {}
    await sleep(250);
  }
  if (!target) throw new Error("Chrome tidak merespons");

  const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // Set localStorage agar dashboard tidak redirect ke /login.
  await cdp.send("Page.navigate", { url: `${BASE}/login` });
  await sleep(2500);
  await cdp.eval(`localStorage.setItem("userRole", "ADMIN_IT")`);

  const results = [];

  for (const path of PATHS) {
    for (const width of WIDTHS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await cdp.send("Page.navigate", { url: BASE + path });
      await sleep(2200);

      const data = await cdp.eval(`(() => {
        const doc = document.documentElement;
        const vw = doc.clientWidth;
        const offenders = [];
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          // Only report if this element itself sticks out past the viewport.
          if (r.right > vw + 1 || r.left < -1) {
            // Skip if an ancestor already clips it (overflow hidden/clip/auto/scroll).
            let clipped = false;
            for (let p = el.parentElement; p; p = p.parentElement) {
              const pcs = getComputedStyle(p);
              if (/hidden|clip|auto|scroll/.test(pcs.overflowX)) { clipped = true; break; }
            }
            if (!clipped) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || "").toString().slice(0, 90),
                right: Math.round(r.right),
                left: Math.round(r.left),
                text: (el.textContent || "").trim().slice(0, 40),
              });
            }
          }
        }
        // Sanity: pastikan halaman benar-benar ter-render (bukan spinner login).
        const main = document.querySelector("main");
        // offsetParent === null berarti disembunyikan oleh display:none di ancestor.
        const laidOut = (el) => el.offsetParent !== null || el === document.body;
        const tables = [...document.querySelectorAll("table")].filter(laidOut).length;
        const cards = [...document.querySelectorAll("ul.lg\\\\:hidden > li")].filter(laidOut).length;

        // Elemen yang bisa digeser sendiri (nested horizontal scroller).
        const scrollers = [];
        for (const el of document.querySelectorAll("body *")) {
          if (!laidOut(el)) continue;
          if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
            const cs = getComputedStyle(el);
            if (/auto|scroll/.test(cs.overflowX)) {
              scrollers.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || "").toString().slice(0, 70),
                scrollW: el.scrollWidth,
                clientW: el.clientWidth,
              });
            }
          }
        }

        return {
          vw,
          scrollW: doc.scrollWidth,
          overflow: doc.scrollWidth > vw,
          mainH: main ? Math.round(main.getBoundingClientRect().height) : 0,
          tables,
          cards,
          scrollers: scrollers.slice(0, 3),
          heading: (document.querySelector("h1")?.textContent || "").trim(),
          offenders: offenders.slice(0, 4),
        };
      })()`);

      results.push({ path, width, ...data });
    }
  }

  // Laporan ringkas.
  let bad = 0;
  let empty = 0;
  for (const r of results) {
    const rendered = r.mainH > 200;
    if (!rendered) empty++;
    const flag = r.overflow ? "OVERFLOW" : rendered ? "ok" : "NO-RENDER";
    if (r.overflow) bad++;
    console.log(
      `${flag.padEnd(9)} ${r.path.padEnd(22)} w=${String(r.width).padEnd(5)} ` +
        `scrollW=${r.scrollW} mainH=${r.mainH} tabel=${r.tables} kartu=${r.cards} geser=${r.scrollers.length}`
    );
    for (const o of r.offenders) {
      console.log(`            └─ <${o.tag}> right=${o.right} left=${o.left} "${o.text}" .${o.cls}`);
    }
    for (const s of r.scrollers) {
      console.log(`            ⇄ <${s.tag}> bisa digeser: ${s.scrollW}>${s.clientW} .${s.cls}`);
    }
  }
  console.log(
    `\nTotal: ${bad} overflow dari ${results.length} kombinasi; ${empty} gagal render.`
  );

  chrome.kill();
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }); } catch {}
}

main().catch((e) => {
  console.error("GAGAL:", e.message);
  chrome.kill();
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }); } catch {}
  process.exit(1);
});