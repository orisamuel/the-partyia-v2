// render.mjs: מצלם את trailer.html פריים אחרי פריים ומזרים ישר ל-ffmpeg (בלי קבצי פריים בדיסק).
//
// רינדור מלא:      node team/trailer/render.mjs
//   -> team/trailer-1080.mp4 (1080x1920), team/trailer.mp4 (720x1280, מתחת ל-6MB), team/trailer-poster.jpg
// תצוגה חלקית:     node team/trailer/render.mjs --from 10 --to 15 --scale 0.5     (לקובץ בתיקיית scratch)
// פריימים בודדים:  node team/trailer/render.mjs --shots 4.8,8.9,13.9 --scale 0.5   (JPG לכל זמן, לבדיקה)
// אפשרויות: --workers N (ברירת מחדל 3), --url <כתובת>, --poster 48.4, --mb 0 (בלי טשטוש תנועה)
// טשטוש תנועה: בטווחים שהדף מגדיר ב-window.__mb נלקחות 4 דגימות בתוך חצי פריים (תריס 180 מעלות) ו-ffmpeg מערבב אותן (tmix).
//   בשאר הפריימים אותה תמונה נשלחת 4 פעמים, כך שהקצב קבוע והתוצאה זהה לפריים חד.
// דורש: שרת סטטי שמגיש את הריפו על פורט 8765, Chrome מותקן, ffmpeg ב-PATH, puppeteer-core.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const teamDir = path.resolve(here, '..');
const SCRATCH = 'C:/Users/ori/AppData/Local/Temp/claude/C--Users-ori-Desktop------the-partyia-v2/566a0aab-aa47-4bce-8370-a1ba77d3789a/scratchpad/tools';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// התקנה קבועה של puppeteer-core (גיבוי לתיקיית ה-scratch של הסשן, שנמחקת)
const KEEP = 'C:/Users/ori/Desktop/קלוד/my-smart-agent/golan-autonomous/mg';

function loadPuppeteer() {
  const bases = [process.env.PUPPETEER_CORE_DIR && path.join(process.env.PUPPETEER_CORE_DIR, 'x.js'), path.join(SCRATCH, 'package.json'), path.join(KEEP, 'package.json'), path.join(here, 'package.json')].filter(Boolean);
  for (const b of bases) { try { return createRequire(b)('puppeteer-core'); } catch { /* next */ } }
  throw new Error('puppeteer-core not found (set PUPPETEER_CORE_DIR or NODE_PATH)');
}
const puppeteer = loadPuppeteer();

const argv = process.argv.slice(2);
const arg = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : def; };
const cues = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));
const DUR = cues.duration, FPS = 30;
const scale = parseFloat(arg('scale', '1'));
const from = parseFloat(arg('from', '0'));
const to = Math.min(DUR, parseFloat(arg('to', String(DUR))));
const shots = arg('shots', null);
const workers = parseInt(arg('workers', '3'), 10);
const URL = arg('url', 'http://127.0.0.1:8765/team/trailer/trailer.html?render');
const POSTER_T = parseFloat(arg('poster', '50.0'));
const K = Math.max(1, parseInt(arg('mb', '4'), 10)); // דגימות לפריים בטווחי טשטוש התנועה
const full = !shots && from === 0 && to === DUR && scale === 1;
const W = Math.round(1080 * scale / 2) * 2, H = Math.round(1920 * scale / 2) * 2;
const audio = path.join(here, 'audio', 'mix.wav');

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'], ...opts });
    p.on('error', rej); p.on('close', c => c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`)));
  });
}

// כל worker מקבל דפדפן משלו: טאב ברקע ב-headless לא מצייר, ו-captureScreenshot נתקע
const browsers = [];
async function launch() {
  const b = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    protocolTimeout: 120000,
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  browsers.push(b);
  return b;
}
async function openPages(n) {
  return Promise.all(Array.from({ length: n }, async () => {
    const browser = await launch();
    const [page] = await browser.pages();
    page.on('pageerror', e => console.error('[page]', e.message));
    page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('404')) console.error('[console]', m.text()); });
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
    await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 90000 });
    const err = await page.evaluate(() => window.__error);
    if (err) throw new Error(err);
    const cdp = await page.createCDPSession();
    const mb = await page.evaluate(() => window.__mb || []);
    return { page, cdp, mb };
  }));
}
async function grab({ page, cdp }, t) {
  await page.evaluate(tt => window.__seek(tt), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
}

const t0 = Date.now();

try {
  if (shots) {
    const outDir = path.join(SCRATCH, 'shots');
    fs.mkdirSync(outDir, { recursive: true });
    const [pg] = await openPages(1);
    for (const s of shots.split(',').map(Number)) {
      const buf = await grab(pg, s);
      const f = path.join(outDir, `shot_${s.toFixed(2)}.jpg`);
      fs.writeFileSync(f, buf);
      console.log(f);
    }
  } else {
    const out = full ? path.join(teamDir, 'trailer-1080.mp4') : path.join(SCRATCH, `preview_${from}-${to}_${scale}.mp4`);
    const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS), total = n1 - n0;
    const len = (total / FPS).toFixed(4);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS * K), '-c:v', 'mjpeg', '-i', '-',
      '-ss', String(from), '-t', len, '-i', audio,
      '-map', '0:v', '-map', '1:a',
      // JPEG של Chrome הוא BT.601 בטווח מלא: ממירים ל-BT.709 בטווח מוגבל ומסמנים, כדי שהצבעים ייצאו נכון בכל נגן.
      // setparams: בלעדיו ffmpeg 8 משאיר primaries/transfer כ-unknown, למרות -color_primaries/-color_trc
      '-vf', (K > 1 ? `tmix=frames=${K},select=eq(mod(n\\,${K})\\,${K - 1}),setpts=N/(${FPS}*TB),` : '') + 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
      '-c:v', 'libx264', '-preset', full ? 'slow' : 'veryfast', '-crf', full ? '21' : '22', '-pix_fmt', 'yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', len, out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const ffDone = new Promise((res, rej) => { ff.on('error', rej); ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))); });
    const write = buf => new Promise(res => { if (ff.stdin.write(buf)) res(); else ff.stdin.once('drain', res); });

    const pages = await openPages(Math.min(workers, total));
    const mbR = pages[0].mb;
    const inMB = t => K > 1 && mbR.some(([a, b]) => t >= a - 1e-6 && t < b);
    let nMB = 0; for (let i = 0; i < total; i++) if (inMB((n0 + i) / FPS)) nMB++;
    console.log(`rendering ${total} frames ${W}x${H} with ${pages.length} workers, motion blur x${K} on ${nMB} frames -> ${out}`);
    const ready = new Map();
    let next = 0, posterBuf = null;
    const waiters = [];
    const notify = () => { while (waiters.length) waiters.shift()(); };
    const writer = (async () => {
      while (next < total) {
        if (!ready.has(next)) { await new Promise(r => waiters.push(r)); continue; }
        const bufs = ready.get(next); ready.delete(next);
        for (let k = 0; k < K; k++) await write(bufs[Math.min(k, bufs.length - 1)]);
        next++;
        notify();
        if (next % 60 === 0) {
          const el = (Date.now() - t0) / 1000;
          console.log(`  ${next}/${total}  ${(next / el).toFixed(1)} fps`);
        }
      }
    })();
    const posterN = Math.round(POSTER_T * FPS);
    await Promise.all(pages.map(async (pg, k) => {
      for (let i = k; i < total; i += pages.length) {
        while (i - next > pages.length * 6) await new Promise(r => waiters.push(r));
        const n = n0 + i;
        const t = n / FPS;
        const bufs = [await grab(pg, t)];
        // דגימות נוספות בתוך חצי הפריים שאחרי t (תריס 180 מעלות)
        if (inMB(t)) for (let k = 1; k < K; k++) bufs.push(await grab(pg, t + k * (0.5 / FPS) / K));
        if (full && n === posterN) posterBuf = bufs[0];
        ready.set(i, bufs);
        notify();
      }
    }));
    await writer;
    ff.stdin.end();
    await ffDone;
    console.log(`video done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    if (full) {
      // גרסת ווב 720x1280 בשני מעברים, יעד מתחת ל-6MB
      const web = path.join(teamDir, 'trailer.mp4');
      const log = path.join(SCRATCH, 'x264pass');
      const vb = arg('webkbps', '640') + 'k';
      const common = ['-i', out, '-vf', 'scale=720:1280:flags=lanczos,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv', '-c:v', 'libx264', '-preset', 'slow', '-b:v', vb, '-maxrate', '1400k', '-bufsize', '2800k', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-passlogfile', log];
      await run('ffmpeg', ['-y', '-v', 'error', ...common, '-pass', '1', '-an', '-f', 'mp4', 'NUL']);
      await run('ffmpeg', ['-y', '-v', 'error', ...common, '-pass', '2', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', String(DUR), web]);
      // פוסטר 720x1280 מתחת ל-150KB
      if (posterBuf) {
        const tmp = path.join(SCRATCH, 'poster_src.jpg');
        fs.writeFileSync(tmp, posterBuf);
        const poster = path.join(teamDir, 'trailer-poster.jpg');
        for (let q = 3; q <= 12; q++) {
          await run('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-vf', 'scale=720:1280:flags=lanczos', '-q:v', String(q), poster]);
          if (fs.statSync(poster).size < 150 * 1024) break;
        }
      }
      for (const f of ['trailer-1080.mp4', 'trailer.mp4', 'trailer-poster.jpg']) {
        const p = path.join(teamDir, f);
        if (fs.existsSync(p)) console.log(`${f}: ${(fs.statSync(p).size / 1024 / 1024).toFixed(2)} MB`);
      }
    }
  }
} finally {
  await Promise.all(browsers.map(b => b.close()));
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
