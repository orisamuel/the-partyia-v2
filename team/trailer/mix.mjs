// mix.mjs: בונה את פס הקול של הטריילר מתוך cues.json -> audio/mix.wav
// הרצה: node team/trailer/mix.mjs   (צריך ffmpeg ב-PATH)
// מעבר אודיו בלבד, בנפרד מהווידאו (מעבר אחד משולב הזיז אפקטים מאוחרים בווינדוס).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(here, 'audio');
const cues = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));

const inputs = [];
const chains = [];
const ms = s => Math.round(s * 1000);

// קריינות -> bus אחד (משמש גם ל-sidechain של המוזיקה)
const voLabels = [];
for (const v of cues.vo) {
    const i = inputs.push(v.file) - 1;
    chains.push(`[${i}:a]aresample=48000,adelay=${ms(v.t)}:all=1[vo${i}]`);
    voLabels.push(`[vo${i}]`);
}
chains.push(`${voLabels.join('')}amix=inputs=${voLabels.length}:normalize=0,apad=whole_dur=${cues.duration}[vobus]`);
chains.push(`[vobus]asplit=2[vomain][vokey]`);

// מוזיקה: נחתכת בחשיפת הלוגו, מונמכת מתחת לקריין
const m = cues.music;
const mi = inputs.push(m.file) - 1;
const cutLocal = m.cutAt - m.t;
chains.push(`[${mi}:a]aresample=48000,atrim=0:${cutLocal},afade=t=out:st=${cutLocal - m.cutFade}:d=${m.cutFade},volume=${m.volume},adelay=${ms(m.t)}:all=1,apad=whole_dur=${cues.duration}[mus]`);
chains.push(`[mus][vokey]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[musduck]`);

// אפקטים
const sfxLabels = [];
for (const s of cues.sfx) {
    const i = inputs.push(s.file) - 1;
    let f = `[${i}:a]aresample=48000`;
    if (s.dur) f += `,atrim=0:${s.dur}`;
    if (s.fadeOut) f += `,afade=t=out:st=${(s.dur || 0) - s.fadeOut}:d=${s.fadeOut}`;
    f += `,volume=${s.v},adelay=${ms(s.t)}:all=1[sfx${i}]`;
    chains.push(f);
    sfxLabels.push(`[sfx${i}]`);
}

chains.push(`[vomain][musduck]${sfxLabels.join('')}amix=inputs=${2 + sfxLabels.length}:normalize=0,` +
    `atrim=0:${cues.duration},alimiter=limit=0.89:level=false,` +
    `loudnorm=I=-15:TP=-1.5:LRA=11[out]`);

const scriptPath = path.join(audioDir, 'mix.filter.txt');
fs.writeFileSync(scriptPath, chains.join(';\n'));

const args = ['-y', '-v', 'error'];
for (const f of inputs) args.push('-i', f);
args.push('-filter_complex_script', 'mix.filter.txt', '-map', '[out]', '-ar', '48000', '-ac', '2', 'mix.wav');
execFileSync('ffmpeg', args, { cwd: audioDir, stdio: 'inherit' });
fs.unlinkSync(scriptPath);
console.log('audio/mix.wav ready');
