/**
 * Cetak halaman aplikasi (berita acara) menjadi PDF memakai Chrome headless
 * lewat Chrome DevTools Protocol.
 *
 * Dipakai untuk membandingkan hasil cetak aplikasi dengan template acuan
 * `berita-acara-basarnas-lengkap.html`.
 *
 * Pemakaian:
 *   node scripts/print-to-pdf.mjs <url> <output.pdf> [role] [nama]
 */

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = Number(process.env.CDP_PORT ?? 9333);

const url = process.argv[2];
const output = process.argv[3];
const role = process.argv[4] ?? "OPERATOR_LAPANGAN";
const nama = process.argv[5] ?? "Ahmad Fauzi";

if (!url || !output) {
  console.error("Pemakaian: node scripts/print-to-pdf.mjs <url> <output.pdf>");
  process.exit(1);
}

const profileDir = mkdtempSync(join(tmpdir(), "cdp-profile-"));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(path, method = "GET") {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, { method });
  return res.json();
}

async function waitForChrome() {
  for (let i = 0; i < 100; i++) {
    try {
      await json("/json/version");
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome DevTools tidak merespons.");
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();

    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      resolve({
        send(method, params = {}) {
          id += 1;
          const msgId = id;
          return new Promise((res, rej) => {
            pending.set(msgId, { resolve: res, reject: rej });
            ws.send(JSON.stringify({ id: msgId, method, params }));
          });
        },
        close: () => ws.close(),
      })
    );
  });
}

try {
  await waitForChrome();

  const target = await json(`/json/new?about:blank`, "PUT");
  const client = await connect(target.webSocketDebuggerUrl);

  await client.send("Page.enable");
  await client.send("Runtime.enable");

  // 1. Buka origin dulu agar localStorage bisa ditulis.
  const origin = new URL(url).origin;
  await client.send("Page.navigate", { url: `${origin}/login` });
  await sleep(2500);

  // 2. Simulasikan sesi login (dashboard layout butuh role di localStorage).
  await client.send("Runtime.evaluate", {
    expression: `localStorage.setItem('userRole', ${JSON.stringify(role)});
                 localStorage.setItem('userNama', ${JSON.stringify(nama)});`,
  });

  // 3. Buka halaman tujuan.
  await client.send("Page.navigate", { url });
  await sleep(6000);

  // 4. Cetak ke PDF.
  const { data } = await client.send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  });
  writeFileSync(output, Buffer.from(data, "base64"));
  console.log(`PDF tersimpan: ${output}`);

  client.close();
} finally {
  chrome.kill();
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    /* abaikan */
  }
}
