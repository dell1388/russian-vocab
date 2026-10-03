// WebAudio synth SFX, a procedural march loop (Коробейники, public domain), and ru-RU TTS.
import * as save from './save.js';

let ctx = null;
let sfxGain = null;
let musicGain = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    musicGain.connect(ctx.destination);
    applyVolumes();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function applyVolumes() {
  if (!ctx) return;
  const s = save.get().settings;
  sfxGain.gain.value = s.sfx * 0.5;
  musicGain.gain.value = s.music * 0.18;
}

function tone(freq, start, dur, { type = 'square', vol = 0.3, slide = 0, out = sfxGain, attack = 0.005 } = {}) {
  const c = ctx;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(start, dur, { vol = 0.3, freq = 1200, out = sfxGain } = {}) {
  const c = ctx;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(out);
  src.start(start);
}

const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi → Hz

const SFX = {
  click(t) { tone(880, t, 0.04, { vol: 0.12 }); },
  correct(t) { tone(N(76), t, 0.08, { type: 'triangle', vol: 0.35 }); tone(N(83), t + 0.07, 0.12, { type: 'triangle', vol: 0.35 }); },
  hit(t) { noise(t, 0.12, { vol: 0.5, freq: 2500 }); tone(140, t, 0.15, { type: 'sine', vol: 0.5, slide: -80 }); },
  crit(t) { noise(t, 0.2, { vol: 0.6, freq: 4000 }); tone(N(88), t, 0.08, { vol: 0.25 }); tone(N(95), t + 0.06, 0.15, { vol: 0.25 }); tone(110, t, 0.25, { type: 'sine', vol: 0.6, slide: -60 }); },
  wrong(t) { tone(N(58), t, 0.12, { type: 'sawtooth', vol: 0.2 }); tone(N(52), t + 0.1, 0.2, { type: 'sawtooth', vol: 0.2 }); },
  hurt(t) { noise(t, 0.18, { vol: 0.5, freq: 900 }); tone(220, t, 0.25, { type: 'sawtooth', vol: 0.25, slide: -150 }); },
  block(t) { tone(N(84), t, 0.05, { vol: 0.2 }); tone(N(91), t + 0.03, 0.2, { type: 'triangle', vol: 0.3 }); },
  coin(t) { tone(N(88), t, 0.06, { vol: 0.18 }); tone(N(93), t + 0.06, 0.16, { vol: 0.18 }); },
  heal(t) { [72, 76, 79].forEach((n, i) => tone(N(n), t + i * 0.06, 0.12, { type: 'sine', vol: 0.3 })); },
  tick(t) { tone(1600, t, 0.03, { vol: 0.08, type: 'sine' }); },
  whistle(t) {
    for (const [f, d] of [[N(79), 0], [N(83), 0]]) {
      const o = ctx.createOscillator(); const g = ctx.createGain(); const l = ctx.createOscillator(); const lg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; l.frequency.value = 6; lg.gain.value = 6;
      l.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.15, t + 0.08); g.gain.setValueAtTime(0.15, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g).connect(sfxGain); o.start(t); l.start(t); o.stop(t + 0.85); l.stop(t + 0.85);
    }
    noise(t, 0.6, { vol: 0.08, freq: 6000 });
  },
  victory(t) { [67, 72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.09, i === 4 ? 0.5 : 0.12, { vol: 0.22 })); },
  defeat(t) { [69, 65, 62, 57].forEach((n, i) => tone(N(n), t + i * 0.18, 0.3, { type: 'triangle', vol: 0.3 })); },
  relic(t) { [72, 79, 84, 88].forEach((n, i) => tone(N(n), t + i * 0.07, 0.25, { type: 'triangle', vol: 0.25 })); },
  boss(t) { tone(N(45), t, 0.6, { type: 'sawtooth', vol: 0.3 }); tone(N(46), t + 0.3, 0.8, { type: 'sawtooth', vol: 0.3 }); noise(t, 0.4, { vol: 0.3, freq: 300 }); },
};

export function sfx(name) {
  if (!save.get().settings.sfx) return;
  if (!ac()) return;
  try { SFX[name]?.(ctx.currentTime + 0.01); } catch { /* ignore audio errors */ }
}

// ---- Music: Коробейники, A minor, oom-pah bass ----
const MEL_A = [[76, 2], [71, 1], [72, 1], [74, 2], [72, 1], [71, 1], [69, 2], [69, 1], [72, 1], [76, 2], [74, 1], [72, 1], [71, 3], [72, 1], [74, 2], [76, 2], [72, 2], [69, 2], [69, 4]];
const MEL_B = [[0, 1], [74, 2], [77, 1], [81, 2], [79, 1], [77, 1], [76, 3], [72, 1], [76, 2], [74, 1], [72, 1], [71, 2], [71, 1], [72, 1], [74, 2], [76, 2], [72, 2], [69, 2], [69, 4]];
// Chord roots per bar (8 eighths per bar)
const BASS_A = [[45, 52], [40, 47], [45, 52], [40, 45]];
const BASS_B = [[38, 45], [45, 52], [40, 47], [45, 45]];

let musicOn = false;
let nextBarTime = 0;
let section = 0;
let timer = null;
let tempo = 1;

function scheduleSection() {
  const eighth = 0.19 / tempo;
  const mel = section % 2 === 0 ? MEL_A : MEL_B;
  const bass = section % 2 === 0 ? BASS_A : BASS_B;
  let t = nextBarTime;
  for (const [n, d] of mel) {
    if (n) tone(N(n), t, d * eighth * 0.9, { type: 'square', vol: 0.12, out: musicGain, attack: 0.01 });
    t += d * eighth;
  }
  bass.forEach(([root, fifth], bar) => {
    for (let q = 0; q < 4; q++) {
      const bt = nextBarTime + (bar * 8 + q * 2) * eighth;
      const note = q % 2 === 0 ? root : fifth;
      tone(N(note), bt, eighth * 0.8, { type: 'triangle', vol: 0.3, out: musicGain });
      if (q % 2 === 1) noise(bt, 0.05, { vol: 0.05, freq: 5000, out: musicGain });
    }
  });
  nextBarTime += 32 * eighth;
  section++;
}

export function startMusic(speed = 1) {
  tempo = speed;
  if (musicOn || !save.get().settings.music) return;
  if (!ac()) return;
  musicOn = true;
  nextBarTime = ctx.currentTime + 0.1;
  section = 0;
  const loop = () => {
    if (!musicOn) return;
    while (nextBarTime < ctx.currentTime + 1.5) scheduleSection();
    timer = setTimeout(loop, 400);
  };
  loop();
}
export function setTempo(speed) { tempo = speed; }
export function stopMusic() {
  musicOn = false;
  clearTimeout(timer);
}
export function refreshMusic() {
  applyVolumes();
  if (!save.get().settings.music) stopMusic();
}

// ---- TTS ----
let ruVoice = null;
function findVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  ruVoice = vs.find((v) => v.lang === 'ru-RU' && /google|милена|milena|yuri/i.test(v.name)) || vs.find((v) => v.lang?.startsWith('ru')) || null;
  return ruVoice;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  findVoice();
  speechSynthesis.onvoiceschanged = findVoice;
}
export function hasRussianVoice() { return !!(ruVoice || findVoice()); }

export function speak(text, { force = false } = {}) {
  const s = save.get().settings;
  if (!s.tts && !force) return;
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    if (ruVoice || findVoice()) u.voice = ruVoice;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function unlockAudio() { ac(); }
