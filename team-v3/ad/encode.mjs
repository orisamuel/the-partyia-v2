// encode.mjs: מהמאסטר (render.mjs) לקבצי המסירה של הפרסומת (team-v3).
//   node encode.mjs <master.mp4> --poster <frame0.png> --tile <tile.png> [--tmp <folder>]
// יוצר ב-team-v3/:
//   ad-1080.mp4  1080x1920, H.264 yuv420p BT.709, AAC 160k, +faststart, 37.0 שניות, מתחת ל-15MB (הקובץ שמעבירים בוואטסאפ)
//   ad.mp4       720x1280 לאתר, מתחת ל-5MB
//   ad-poster.jpg 720x1280 (פריים 0), מתחת ל-150KB
//   ad-tile.jpg   1080x680, מתחת ל-120KB
// הסאונד: audio/mix.wav (שעון האמת, 37.0 שניות). צריך ffmpeg ב-PATH. קבצי pass נשארים בתיקייה הזמנית.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const master = path.resolve(argv[0]);
const tmp = path.resolve(opt('tmp', fs.mkdtempSync(path.join(os.tmpdir(), 'partyia-ad-'))));
fs.mkdirSync(tmp, { recursive: true });
const audio = path.join(HERE, 'audio', 'mix.wav');
const DUR = 37;
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit', cwd: tmp });
const tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const scaleTo = (w, h) => `scale=${w}:${h}:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`;

// פריימי מפתח על החיתוכים בלבד (גרעין הנייר סטטי: פריים מפתח באמצע החזקה מרענן אותו ונראה כהבהוב)
const KEYS = '0,2.7,5.35,8.5,10.72,11.9,12.66,13.74,15,20.35,26.75,30.8';

function twoPass(out, w, h, kbps, level) {
  const v = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', `${kbps}k`, '-maxrate', `${Math.round(kbps * 1.8)}k`, '-bufsize', `${kbps * 4}k`,
    '-profile:v', 'high', '-level', level, '-g', '300', '-sc_threshold', '0', '-force_key_frames', KEYS,
    ...tags, '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709'];
  const log = path.join(tmp, 'pass_' + w);
  ff(['-i', master, '-vf', scaleTo(w, h), ...v, '-pass', '1', '-passlogfile', log, '-an', '-t', String(DUR), '-f', 'mp4', os.platform() === 'win32' ? 'NUL' : '/dev/null']);
  ff(['-i', master, '-i', audio, '-map', '0:v', '-map', '1:a', '-vf', scaleTo(w, h), ...v, '-pass', '2', '-passlogfile', log,
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', out]);
  console.log(path.basename(out), (fs.statSync(out).size / 1e6).toFixed(2) + 'MB');
}

// JPEG מתחת לגבול, באיכות הגבוהה ביותר שנכנסת
function jpegUnder(src, out, maxBytes, vf) {
  for (let q = 2; q <= 14; q++) {
    ff(['-i', src, ...(vf ? ['-vf', vf] : []), '-q:v', String(q), out]);
    if (fs.statSync(out).size <= maxBytes) { console.log(path.basename(out), Math.round(fs.statSync(out).size / 1024) + 'KB (q ' + q + ')'); return; }
  }
  throw new Error('could not fit ' + out);
}

twoPass(path.join(OUT, 'ad-1080.mp4'), 1080, 1920, 2600, '4.1');
twoPass(path.join(OUT, 'ad.mp4'), 720, 1280, 780, '4.0');

const poster = opt('poster', null);
if (poster) jpegUnder(path.resolve(poster), path.join(OUT, 'ad-poster.jpg'), 150 * 1024, 'scale=720:1280:flags=lanczos');
const tile = opt('tile', null);
if (tile) jpegUnder(path.resolve(tile), path.join(OUT, 'ad-tile.jpg'), 120 * 1024, null);
