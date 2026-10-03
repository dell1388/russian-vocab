// Run state helpers: creation, stats, relic/consumable management.
import { Rng } from './rng.js';
import { generateMap } from './map.js';
import { CHARACTERS } from './content/characters.js';
import { RELICS, RELIC_IDS } from './content/relics.js';
import { CONSUMABLES, CONSUMABLE_IDS } from './content/consumables.js';
import { UPGRADES } from './content/upgrades.js';
import * as save from './save.js';
import * as progress from './progress.js';

let rng = null;
let rngRun = null;

/** Live RNG bound to the run; state persisted in run.rngS. */
export function R(run) {
  if (rngRun !== run || !rng) { rng = new Rng(run.rngS); rngRun = run; }
  return rng;
}
export function persist(run) {
  if (rngRun === run && rng) run.rngS = rng.s;
  const p = save.get();
  p.run = run;
  save.save();
}

export function newRun({ char, mode, easy, daily = null, seed = null }) {
  const p = save.get();
  const c = CHARACTERS[char];
  const s = seed ?? `${Date.now()}-${Math.random()}`;
  const mapRng = new Rng(`${s}:map`);
  const run = {
    seed: s, daily, char, mode, easy: !!easy,
    hp: c.hp, maxHp: c.hp, rub: 40, dmgBonus: 0,
    relics: [], consumables: [], rs: {},
    map: generateMap(mapRng),
    leg: 0, pos: { floor: -1, idx: null }, pending: null,
    missed: [],
    stats: { correct: 0, wrong: 0, typed: 0, fights: 0, elites: 0, bosses: 0, floors: 0, maxStreak: 0, start: Date.now(), words: 0 },
    rngS: new Rng(`${s}:run`).s,
  };
  rngRun = null;
  // Meta upgrades (not in daily challenge, which is a level playing field)
  if (!daily) {
    for (const [id, n] of Object.entries(p.upgrades)) {
      const u = UPGRADES[id];
      if (n && u?.apply) u.apply(run, n, { grantRandomRelic: (rar) => gainRelic(run, randomRelic(run, rar)) });
    }
  } else if (daily.relic) {
    gainRelic(run, daily.relic);
  }
  run.hp = run.maxHp;
  p.stats.runs++;
  p.run = run;
  progress.check({ type: 'runStart' });
  save.saveNow();
  return run;
}

export function runStats(run) {
  const rs = { rubMult: 1, restHealMult: 1, shopMult: 1, slots: 2, restBonus: 0 };
  for (const id of run.relics) RELICS[id]?.runApply?.(rs);
  if (!run.daily) {
    for (const [id, n] of Object.entries(save.get().upgrades)) if (n) UPGRADES[id]?.runStats?.(rs, n);
  }
  return rs;
}

/** Hook providers in order: character, relics. */
export function hookProviders(run) {
  const list = [{ id: '_char', hooks: CHARACTERS[run.char].hooks || {} }];
  for (const id of run.relics) if (RELICS[id]) list.push({ id, hooks: RELICS[id] });
  return list;
}

export function fightStats(run) {
  const c = CHARACTERS[run.char];
  const s = {
    dmg: c.dmg + run.dmgBonus, dmgMult: 1, critChance: 0.05, critMult: 2,
    timerMult: 1, typeTimerMult: 1, matchTimerMult: 1,
    dodge: 0, dmgTakenMult: 1, mcOptions: 4, preview: false, firstLetter: false,
    graceMs: 0, openingFreezeMs: 0, streakRate: 1, startStreak: 0,
  };
  for (const { hooks } of hookProviders(run)) hooks.apply?.(s, run);
  if (!run.daily) {
    for (const [id, n] of Object.entries(save.get().upgrades)) if (n) UPGRADES[id]?.fight?.(s, n);
  }
  return s;
}

export function hasRelic(run, id) { return run.relics.includes(id); }

export function randomRelic(run, rarity, rngOverride) {
  const r = rngOverride || R(run);
  const pool = RELIC_IDS.filter((id) => !run.relics.includes(id) && (!rarity || RELICS[id].rarity === rarity));
  if (!pool.length) {
    const any = RELIC_IDS.filter((id) => !run.relics.includes(id));
    return any.length ? r.pick(any) : null;
  }
  return r.pick(pool);
}

export function relicChoices(run, n, weights = { common: 0.65, rare: 0.3, legendary: 0.05 }) {
  const r = R(run);
  const out = [];
  for (let i = 0; i < n * 4 && out.length < n; i++) {
    const rar = r.weighted(Object.keys(weights), (k) => weights[k]);
    const id = randomRelic(run, rar);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export function gainRelic(run, id) {
  if (!id || run.relics.includes(id) || !RELICS[id]) return null;
  run.relics.push(id);
  RELICS[id].onPickup?.(run);
  progress.check({ type: 'relic', count: run.relics.length });
  return RELICS[id];
}

export function removeRelic(run, id) {
  run.relics = run.relics.filter((x) => x !== id);
}

export function gainConsumable(run, id) {
  if (run.consumables.length >= runStats(run).slots) return false;
  const cid = id || R(run).pick(CONSUMABLE_IDS);
  if (!CONSUMABLES[cid]) return false;
  run.consumables.push(cid);
  return true;
}

export function gainRub(run, n) {
  const amt = Math.round(n * runStats(run).rubMult);
  run.rub += amt;
  progress.check({ type: 'rub', rub: run.rub });
  return amt;
}

export function heal(run, n) {
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + Math.round(n));
  return run.hp - before;
}

export function addMissed(run, id) {
  run.missed = [id, ...run.missed.filter((x) => x !== id)].slice(0, 30);
}

export function starsFor(run, win) {
  const s = run.stats;
  let stars = s.floors + run.leg * 3 + s.bosses * 3 + (win ? 10 : 0);
  if (run.mode === 'mix') stars *= 1.25;
  if (run.easy) stars *= 0.5;
  return Math.max(1, Math.round(stars));
}

export function scoreFor(run, win) {
  const s = run.stats;
  return s.floors * 100 + s.bosses * 500 + s.correct * 10 - s.wrong * 5 + (win ? 1000 + run.hp * 5 : 0);
}
