// render.mjs: card.html -> the "חבר מביא חבר" images (team-refer/)
//   refer.jpg      1122x1402  to send in a chat, and the WhatsApp preview of refer.html (keep it under ~200KB)
//   refer-916.jpg  1080x1920  for WhatsApp status
// usage (from the repo root): node team-refer/render.mjs   (puppeteer-core via MG_MODULES, ffmpeg in PATH)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let puppeteer;
try { puppeteer = (await import('puppeteer-core')).default; }
catch { puppeteer = createRequire(path.join(process.env.MG_MODULES || '', 'x.js'))('puppeteer-core'); }

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files', '--force-color-profile=srgb'] });
for (const [r, w, h, out, maxKB] of [['45', 1122, 1402, 'refer.jpg', 200], ['916', 1080, 1920, 'refer-916.jpg', 320]]) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(HERE, 'card.html')).href + '?r=' + r, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.body.dataset.fitted === '1');
  await new Promise((res) => setTimeout(res, 300));
  const png = path.join(os.tmpdir(), `refer-${r}.png`);
  // element screenshot: in an RTL page a fixed clip at x=0 can land outside the card (came out blank)
  await (await page.$('.card')).screenshot({ path: png });
  const dst = path.join(HERE, out);
  for (let q = 2; q <= 12; q++) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', String(q), dst]);
    if (fs.statSync(dst).size <= maxKB * 1024) break;
  }
  console.log(out, Math.round(fs.statSync(dst).size / 1024) + 'KB');
  await page.close();
}
await browser.close();
