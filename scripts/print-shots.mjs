/**
 * Screenshot halaman dengan media "print" aktif (Chrome headless + CDP).
 *
 * Dipakai untuk membandingkan tampilan cetak aplikasi dengan template
 * acuan `berita-acara-basarnas-lengkap.html`.
 *
 * Pemakaian:
 *   node scripts/print-shots.mjs <url> <prefix-output> [selector]
 */

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = Number(process.env.CDP_PORT ?? 9334);

const url = process.argv[2];
const prefix = process.argv[3];
const selector = process.argv[4] ?? ".ba-sheet, .sheet";
const media = process.argv[5] ?? "print";
const viewW = Number(process.argv[6] ?? 794);
const viewH = Number(process.argv[7] ?? 1123);

if (!url || !prefix) {
  console.error(
    "Pemakaian: node scripts/print-shots.mjs <url> <prefix-output> [selector]"
  );
  process.exit(1);
}

const profileDir = mkdtempSync(join(tmpdir(), "cdp-shots-"));

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
    "--window-size=794,1123",
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
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewW,
    height: viewH,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const origin = new URL(url).origin;
  if (origin !== "null") {
    await client.send("Page.navigate", { url: `${origin}/login` });
    await sleep(2000);
    await client.send("Runtime.evaluate", {
      expression: `localStorage.setItem('userRole','OPERATOR_LAPANGAN');
                   localStorage.setItem('userNama','Ahmad Fauzi');`,
    });
  }

  await client.send("Page.navigate", { url });
  await sleep(6000);

  // Aktifkan media "print" supaya CSS @media print ikut dipakai.
  await client.send("Emulation.setEmulatedMedia", { media });
  await sleep(1000);

  const { result } = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const nodes = Array.from(document.querySelectorAll(${JSON.stringify(
        selector
      )}));
      return JSON.stringify(nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return {
          x: r.left + window.scrollX,
          y: r.top + window.scrollY,
          width: r.width,
          height: r.height,
        };
      }));
    })()`,
    returnByValue: true,
  });

  const boxes = JSON.parse(result.value);
  console.log(`Ditemukan ${boxes.length} lembar.`);

  for (let i = 0; i < boxes.length; i++) {
    // Gulung elemen ke dalam area tampilan (area konten dashboard yang
    // menjadi scroll container) supaya kontennya benar-benar dirender.
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const n = document.querySelectorAll(${JSON.stringify(selector)})[${i}];
        if (!n) return;
        n.scrollIntoView({ block: 'start', inline: 'nearest' });
        const sc = n.closest('main') || n.closest('div');
        if (sc) sc.scrollTop = sc.scrollTop;
      })()`,
    });
    await sleep(400);

    const { result: boxRes } = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const n = document.querySelectorAll(${JSON.stringify(selector)})[${i}];
        const r = n.getBoundingClientRect();
        return JSON.stringify({
          x: r.left + window.scrollX,
          y: r.top + window.scrollY,
          width: r.width,
          height: r.height,
        });
      })()`,
      returnByValue: true,
    });
    const b = JSON.parse(boxRes.value);

    const { data } = await client.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        scale: 1,
      },
    });
    const file = `${prefix}-${i + 1}.png`;
    writeFileSync(file, Buffer.from(data, "base64"));
    console.log(`Tersimpan: ${file} (${Math.round(b.width)}x${Math.round(b.height)})`);
  }

  client.close();
} finally {
  chrome.kill();
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    /* abaikan */
  }
}
