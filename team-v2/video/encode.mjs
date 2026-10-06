// encode.mjs: מהמאסטר (render.mjs) לקבצים שהעמוד משתמש בהם.
//   node encode.mjs <master.mp4> [--tile <tile.png>] [--tmp <folder>]
// יוצר ב-team-v2/: video.mp4 (720x1280, מתחת ל-6MB), video-1080.mp4 (1080x1920, מתחת ל-16MB),
// poster.jpg (720x1280, פריים 5.9 שניות, מתחת ל-150KB), ו-tile.jpg (1080x680, מתחת ל-120KB) אם ניתן --tile.
// הסאונד: audio/mix.wav (שעון האמת, 50.0 שניות). צריך ffmpeg ב-PATH.
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
const tmp = path.resolve(opt('tmp', fs.mkdtempSync(path.join(os.tmpdir(), 'partyia-enc-'))));
fs.mkdirSync(tmp, { recursive: true });
const audio = path.join(HERE, 'audio', 'mix.wav');
const DUR = 50;
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit', cwd: tmp });
const tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const scaleTo = (w, h) => `scale=${w}:${h}:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`;

// פריימי מפתח: רק ברגעים שבהם סצנה יוצאת (הרבה תנועה על המסך), ולא כל 5 שניות.
// פריים מפתח בתוך החזקה סטטית מרענן את גרעין הנייר ונראה כ"הבהוב" קטן של המרקם (נמדד ב-QA: 1.2 רמות בממוצע לפיקסל).
// הפער הגדול ביותר בין שני פריימי מפתח הוא 8.4 שניות, ולכן -g 300 (10 שניות) לא מוסיף פריים מפתח באמצע החזקה.
const KEYS = '0,6.1,12.07,14.3,17.67,23.0,28.17,36.53,41.6';

function twoPass(out, w, h, kbps, level) {
  const v = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', `${kbps}k`, '-maxrate', `${kbps * 2}k`, '-bufsize', `${kbps * 4}k`,
    '-profile:v', 'high', '-level', level, '-g', '300', '-sc_threshold', '0', '-force_key_frames', KEYS,
    ...tags, '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709'];
  const log = path.join(tmp, 'pass_' + w); // נשאר בתיקייה הזמנית, לא בריפו
  ff(['-i', master, '-vf', scaleTo(w, h), ...v, '-pass', '1', '-passlogfile', log, '-an', '-t', String(DUR), '-f', 'mp4', os.platform() === 'win32' ? 'NUL' : '/dev/null']);
  ff(['-i', master, '-i', audio, '-map', '0:v', '-map', '1:a', '-vf', scaleTo(w, h), ...v, '-pass', '2', '-passlogfile', log,
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', out]);
  console.log(path.basename(out), (fs.statSync(out).size / 1e6).toFixed(2) + 'MB');
}

// JPEG מתחת לגבול, באיכות הגבוהה ביותר שנכנסת
function jpegUnder(png, out, maxBytes) {
  for (let q = 2; q <= 12; q++) {
    ff(['-i', png, '-q:v', String(q), out]);
    if (fs.statSync(out).size <= maxBytes) { console.log(path.basename(out), Math.round(fs.statSync(out).size / 1024) + 'KB (q ' + q + ')'); return; }
  }
  throw new Error('could not fit ' + out);
}

twoPass(path.join(OUT, 'video.mp4'), 720, 1280, 740, '4.0');
twoPass(path.join(OUT, 'video-1080.mp4'), 1080, 1920, 2100, '4.1');

const posterPng = path.join(tmp, 'poster.png');
ff(['-ss', '5.9', '-i', master, '-frames:v', '1', '-vf', 'scale=720:1280:flags=lanczos:in_color_matrix=bt709:in_range=tv,format=rgb24', posterPng]);
jpegUnder(posterPng, path.join(OUT, 'poster.jpg'), 150 * 1024);

const tile = opt('tile', null);
if (tile) jpegUnder(path.resolve(tile), path.join(OUT, 'tile.jpg'), 120 * 1024);
