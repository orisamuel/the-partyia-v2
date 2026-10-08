// encode.mjs: מהמאסטר (render.mjs) לקובץ המסירה של הפרסומת, גרסה 2 (team-v3/ad2).
//   node encode.mjs <master.mp4> [--tmp <folder>]
// יוצר ב-team-v3/:
//   ad2-1080.mp4  1080x1920, H.264 yuv420p BT.709, AAC 160k, +faststart, 37.6 שניות, מתחת ל-15MB (הקובץ שמעבירים בוואטסאפ)
// (באתר אין סרטון, אז אין כאן גרסת 720, פוסטר או אריח.)
// הסאונד: audio/mix.wav (שעון האמת, 37.6 שניות). צריך ffmpeg ב-PATH. קבצי pass נשארים בתיקייה הזמנית.
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
const DUR = 37.6;
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit', cwd: tmp });
const tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const scaleTo = (w, h) => `scale=${w}:${h}:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`;

// פריימי מפתח על החיתוכים בלבד (גרעין הנייר סטטי: פריים מפתח באמצע החזקה מרענן אותו ונראה כהבהוב)
const KEYS = '0,2.7,5.35,8.4,10.52,11.74,12.56,13.82,15.1,21.47,27.87,31.92';

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

twoPass(path.join(OUT, 'ad2-1080.mp4'), 1080, 1920, 2600, '4.1');
