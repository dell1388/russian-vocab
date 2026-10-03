// Rough Monte-Carlo balance check: simulates runs with a player of given accuracy/speed.
// Usage: node scripts/balance.mjs [accuracy=0.8] [answerFrac=0.55] [runs=2000]
import { scaledEnemy } from '../js/combat.js';
import { LEGS } from '../js/content/route.js';
import { Rng } from '../js/rng.js';

const acc = +(process.argv[2] ?? 0.8);
const frac = +(process.argv[3] ?? 0.55); // fraction of timer remaining when answering
const N = +(process.argv[4] ?? 2000);
const rng = new Rng(42);

function fight(p, id, leg) {
  const e = scaledEnemy(id, leg, false);
  let streak = 0, q = 0, armored = 2, revived = false;
  while (e.hp > 0 && p.hp > 0 && q < 200) {
    q++;
    const phaseFmt = e.phases ? e.phases.filter((ph) => e.hp / e.maxHp <= ph.at).pop()?.format ?? e.phases[0].format : e.def.format;
    const a = phaseFmt === 'type' ? acc - 0.1 : acc;
    if (rng.chance(a)) {
      let m = (1 + 0.6 * frac) * (1 + Math.min(0.5, 0.05 * streak)) * p.mult;
      if (phaseFmt === 'type') m *= 1.6;
      if (phaseFmt === 'match') m *= 0.75;
      if (rng.chance(0.05)) m *= 2;
      if (e.traits.has('armored') && armored-- > 0) m *= 0.5;
      e.hp -= Math.round(p.dmg * m);
      streak++;
      if (e.hp <= 0 && e.traits.has('undying') && !revived) { revived = true; e.hp = Math.round(e.maxHp * 0.35); }
    } else {
      streak = 0;
      p.hp -= e.dmg * (e.traits.has('double') ? 2 : 1);
    }
    if (e.traits.has('regen')) e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.04));
  }
  return q;
}

let wins = 0; const reached = [0, 0, 0, 0, 0, 0]; let totalQ = 0;
for (let r = 0; r < N; r++) {
  const p = { hp: 60, maxHp: 60, dmg: 10, mult: 1 };
  let leg = 0, alive = true;
  for (; leg < LEGS.length && alive; leg++) {
    const L = LEGS[leg];
    const nodes = ['fight', rng.chance(0.4) ? 'elite' : 'fight', 'rest', 'boss'];
    for (const n of nodes) {
      if (n === 'rest') { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.35); continue; }
      const id = n === 'boss' ? L.boss : rng.pick(n === 'elite' ? L.elites : L.enemies);
      totalQ += fight(p, id, leg);
      if (p.hp <= 0) { alive = false; break; }
      if (n === 'elite' || n === 'boss') { p.mult *= 1.12; p.maxHp += 4; } // relic power creep
      p.hp = Math.min(p.maxHp, p.hp + 3);
    }
    if (alive) { reached[leg + 1]++; p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4); }
  }
  if (alive) wins++;
}
console.log(`acc ${acc}, speed ${frac}: win ${(100 * wins / N).toFixed(1)}%  reach legs ${reached.slice(1).map((x) => (100 * x / N).toFixed(0) + '%').join(' ')}  avg questions/run ${(totalQ / N).toFixed(0)}`);
