// XP, levels, word-band unlocks, achievements, SRS grading glue.
import * as save from './save.js';
import { ACHIEVEMENTS } from './content/achievements.js';
import { BANDS, wordPool } from './data.js';
import { grade, isMastered } from './srs.js';
import { CHARACTERS } from './content/characters.js';

export const BAND_LEVELS = [1, 3, 5, 8, 12];

export function xpForLevel(l) {
  const n = l - 1;
  return 60 * n + 15 * n * n;
}

let notify = () => {};
export function onNotify(fn) { notify = fn; }

export function bandsUnlocked(p = save.get()) {
  if (p.settings.allBands) return BANDS.length;
  return BAND_LEVELS.filter((l) => p.level >= l).length;
}

export function currentPool(p = save.get()) {
  return wordPool(bandsUnlocked(p), p.settings.posFilter);
}

export function addXp(n) {
  const p = save.get();
  p.xp += Math.round(n);
  let leveled = false;
  while (p.xp >= xpForLevel(p.level + 1)) {
    p.level++;
    leveled = true;
    const bi = BAND_LEVELS.indexOf(p.level);
    notify({ kind: 'level', title: `Уровень ${p.level}!`, text: bi > 0 ? `New words unlocked: ${BANDS[bi].en}` : 'Level up' });
  }
  if (leveled) check({ type: 'level' });
  save.save();
}

export function masteredCount(p = save.get()) {
  let n = 0;
  for (const id in p.srs) if (isMastered(p.srs[id])) n++;
  return n;
}

export function gradeWord(id, correct, typed = false) {
  const p = save.get();
  const before = isMastered(p.srs[id]);
  p.srs[id] = grade(p.srs[id], correct);
  if (correct) { p.stats.correct++; if (typed) p.stats.typed = (p.stats.typed || 0) + 1; } else p.stats.wrong++;
  if (!before && isMastered(p.srs[id])) check({ type: 'mastered', count: masteredCount(p) });
  save.save();
}

export function check(ev) {
  const p = save.get();
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.check(p, ev); } catch { ok = false; }
    if (ok) {
      p.achievements[a.id] = Date.now();
      notify({ kind: 'ach', title: a.name, text: `${a.en} — ${a.desc}` });
      save.save();
    }
  }
}

export function checkUnlocks(ev) {
  const p = save.get();
  for (const [id, c] of Object.entries(CHARACTERS)) {
    if (p.unlocked[id] || !c.unlock) continue;
    const u = c.unlock;
    const ok = (u.type === 'reach_leg' && ev.type === 'reachLeg' && ev.leg >= u.leg) ||
      (u.type === 'beat_boss' && ev.type === 'bossWon' && ev.boss === u.boss) ||
      (u.type === 'win' && ev.type === 'runEnd' && ev.win);
    if (ok) {
      p.unlocked[id] = true;
      notify({ kind: 'unlock', title: `${c.name} unlocked!`, text: c.en });
      check({ type: 'unlock' });
    }
  }
  save.save();
}
