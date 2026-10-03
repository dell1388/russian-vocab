// Profile persistence (localStorage). Everything the game remembers lives here.

const KEY = 'transsib.profile.v1';

export function defaultProfile() {
  return {
    v: 1,
    xp: 0,
    level: 1,
    stars: 0,
    starsTotal: 0,
    upgrades: {},
    unlocked: { komsomolets: true, kosmonavt: true },
    achievements: {},
    srs: {},
    stats: { runs: 0, wins: 0, correct: 0, wrong: 0, typed: 0, bestLeg: 0, bossesBeaten: {}, playMs: 0 },
    daily: { last: null, streak: 0, best: {} },
    settings: {
      mode: 'en2ru', easy: false, sfx: 0.6, music: 0.3, tts: true, autoSpeak: true,
      stress: true, posFilter: null, allBands: false, keyboard: 'auto', reduceMotion: false,
    },
    seenTutorial: false,
    run: null,
  };
}

let profile = null;

function storage() {
  try { return window.localStorage; } catch { return null; }
}

export function load() {
  const s = storage();
  let p = null;
  try { p = s && JSON.parse(s.getItem(KEY)); } catch { p = null; }
  const d = defaultProfile();
  profile = p ? { ...d, ...p, settings: { ...d.settings, ...p.settings }, stats: { ...d.stats, ...p.stats }, daily: { ...d.daily, ...p.daily } } : d;
  return profile;
}

export function get() { return profile || load(); }

let pending = null;
export function save() {
  // Coalesce bursts of saves (every answer grades SRS)
  if (pending) return;
  pending = setTimeout(saveNow, 250);
}
export function saveNow() {
  clearTimeout(pending);
  pending = null;
  const s = storage();
  try { s && s.setItem(KEY, JSON.stringify(profile)); } catch { /* storage full or blocked */ }
}

export function reset() {
  profile = defaultProfile();
  saveNow();
  return profile;
}

export function exportSave() { return JSON.stringify(profile); }
export function importSave(json) {
  const p = JSON.parse(json);
  if (!p || p.v !== 1) throw new Error('Not a Транссиб save');
  const s = storage();
  s && s.setItem(KEY, JSON.stringify(p));
  return load();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => profile && saveNow());
}
