// render.mjs: renders scene.html (window.seek(t)) to video, 1080x1920 portrait.
// Adapted from the motion-graphics skill template. Each output frame = mix of 4 sub-frame
// screenshots over half a frame (180-degree shutter), piped to ffmpeg (tmix -> select).
//
// usage (from this folder):
//   node render.mjs scene.html --dur 50 [--fps 30] [--sub 4] [--jobs 5] [--out <file.mp4>] [--t0 0]
//   node render.mjs scene.html --stills 1.7,2.7 --outdir <folder>    -> PNG test frames
//   --half : half size (quick preview)   --size 1080x680 : other viewport (tile.html)   --q x : passes ?x to the page
//
// puppeteer-core is NOT installed in the repo. Install it somewhere outside
// (npm install puppeteer-core@23) and point MG_MODULES at that node_modules folder.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let puppeteer;
try { puppeteer = (await import('puppeteer-core')).default; }
catch {
  const mods = process.env.MG_MODULES;
  if (!mods) { console.error('puppeteer-core not found: set MG_MODULES to a node_modules folder that has it'); process.exit(1); }
  puppeteer = createRequire(path.join(mods, 'x.js'))('puppeteer-core');
}

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const argv = process.argv.slice(2);
const scene = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);
const fps = Number(opt('fps', 30));
const sub = Number(opt('sub', 4));
const dur = Number(opt('dur', 0));
const t0 = Number(opt('t0', 0));
const jobs = Number(opt('jobs', 1));
const half = flag('half');
const stills = opt('stills', null);
const query = opt('q', '');
const [W, H] = opt('size', '1080x1920').split('x').map(Number);
const outPath = path.resolve(opt('out', path.join(os.tmpdir(), path.basename(scene, '.html') + '.mp4')));

// ---------- parallel: split into segments, render each in its own process, concat ----------
if (jobs > 1 && !stills) {
  const N = Math.round(dur * fps);
  const per = Math.ceil(N / jobs);
  const segs = [];
  for (let s = 0; s * per < N; s++) {
    const a = s * per, n = Math.min(per, N - a);
    segs.push({ t0: t0 + a / fps, dur: n / fps, n, out: outPath.replace(/\.mp4$/, `.seg${s}.mp4`) });
  }
  const tStart = Date.now();
  await Promise.all(segs.map((g) => new Promise((res, rej) => {
    const args = [fileURLToPath(import.meta.url), scene, '--dur', String(g.dur), '--t0', String(g.t0), '--fps', String(fps), '--sub', String(sub), '--out', g.out];
    if (half) args.push('--half');
    args.push('--size', `${W}x${H}`);
    if (query) args.push('--q', query);
    const p = spawn(process.execPath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('segment failed ' + g.out))));
  })));
  const list = outPath.replace(/\.mp4$/, '.concat.txt');
  fs.writeFileSync(list, segs.map((g) => `file '${g.out.replace(/\\/g, '/')}'`).join('\n'));
  await new Promise((res) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', outPath], { stdio: 'inherit' }).on('close', res));
  for (const g of segs) fs.unlinkSync(g.out);
  fs.unlinkSync(list);
  console.log(`\nall segments: ${N} frames in ${((Date.now() - tStart) / 1000).toFixed(0)}s -> ${outPath}`);
  process.exit(0);
}

// ---------- single process ----------
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--allow-file-access-from-files', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: half ? 0.5 : 1 },
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
const url = pathToFileURL(path.resolve(HERE, scene)).href + (query ? '?' + query : '');
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const cdp = await page.createCDPSession();

async function shot(t) {
  await page.evaluate((tt) => window.seek(tt), t);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
  return Buffer.from(r.data, 'base64');
}

if (stills) {
  const dir = path.resolve(opt('outdir', path.join(os.tmpdir(), 'mg-stills')));
  fs.mkdirSync(dir, { recursive: true });
  const base = path.basename(scene, '.html') + (query ? '_' + query : '');
  for (const s of stills.split(',').map(Number)) {
    const out = path.join(dir, `${base}_${s.toFixed(2)}.png`);
    fs.writeFileSync(out, await shot(s));
    console.log(out);
  }
  await browser.close();
  process.exit(0);
}

const N = Math.round(dur * fps);
const offs = Array.from({ length: sub }, (_, k) => (sub === 1 ? 0 : ((k - (sub - 1) / 2) / sub) * (0.5 / fps)));
const vf = [];
if (sub > 1) vf.push('format=gbrp', `tmix=frames=${sub}`, `select='eq(mod(n\\,${sub})\\,${sub - 1})'`);
vf.push(`setpts=N/(${fps}*TB)`, 'scale=out_color_matrix=bt709:out_range=tv', 'format=yuv444p', 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv');
// master: near-lossless 4:4:4, BT.709 tagged; delivery encodes are made from it
const enc = ['-c:v', 'libx264', '-crf', '10', '-preset', 'medium', '-pix_fmt', 'yuv444p',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', 'png', '-i', '-',
  '-vf', vf.join(','), '-r', String(fps), ...enc, outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res) => ff.on('close', res));

const tStart = Date.now();
for (let n = 0; n < N; n++) {
  for (const o of offs) {
    const buf = await shot(t0 + n / fps + o);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  if (n % 30 === 0) process.stderr.write(`\r${path.basename(outPath)} ${n}/${N}`);
}
ff.stdin.end();
const code = await done;
await browser.close();
console.log(`\n${path.basename(outPath)}: ${N} frames x${sub} in ${((Date.now() - tStart) / 1000).toFixed(0)}s (ffmpeg ${code})`);
process.exit(code === 0 ? 0 : 1);
