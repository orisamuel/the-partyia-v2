// mix.mjs: פס הקול של הסרטון מתוך cues.json -> audio/mix.wav (קריינות + מוזיקה מונמכת מתחת לקריין)
// הרצה: node team-v2/video/mix.mjs   (צריך ffmpeg ב-PATH)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(here, 'audio');
const cues = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));
const ms = s => Math.round(s * 1000);
const D = cues.duration;

const inputs = [];
const chains = [];
const voLabels = [];
for (const v of cues.vo) {
    const i = inputs.push(v.file) - 1;
    chains.push(`[${i}:a]aresample=48000,adelay=${ms(v.t)}:all=1[vo${i}]`);
    voLabels.push(`[vo${i}]`);
}
chains.push(`${voLabels.join('')}amix=inputs=${voLabels.length}:normalize=0,apad=whole_dur=${D}[vobus]`);
chains.push(`[vobus]asplit=2[vomain][vokey]`);

const m = cues.music;
const mi = inputs.push(m.file) - 1;
chains.push(`[${mi}:a]aresample=48000,volume=${m.volume},afade=t=out:st=${m.fadeOutAt}:d=${m.fadeOut},adelay=${ms(m.t)}:all=1,apad=whole_dur=${D}[mus]`);
chains.push(`[mus][vokey]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=400[musduck]`);
chains.push(`[vomain][musduck]amix=inputs=2:normalize=0,atrim=0:${D},alimiter=limit=0.89:level=false,loudnorm=I=-15:TP=-1.5:LRA=11[out]`);

fs.writeFileSync(path.join(audioDir, 'mix.filter.txt'), chains.join(';\n'));
const args = ['-y', '-v', 'error'];
for (const f of inputs) args.push('-i', f);
args.push('-filter_complex_script', 'mix.filter.txt', '-map', '[out]', '-ar', '48000', '-ac', '2', 'mix.wav');
execFileSync('ffmpeg', args, { cwd: audioDir, stdio: 'inherit' });
fs.unlinkSync(path.join(audioDir, 'mix.filter.txt'));
console.log('audio/mix.wav ready');
