import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, choicesFrom } from '../js/map.js';
import { LEGS, FLOORS_PER_LEG } from '../js/content/route.js';
import { ENEMIES } from '../js/content/enemies.js';
import { RELICS } from '../js/content/relics.js';
import { EVENTS } from '../js/content/events.js';
import { CHARACTERS } from '../js/content/characters.js';
import { Rng } from '../js/rng.js';

test('maps: every node reachable, rest on last floor, shop in leg', () => {
  for (let seed = 0; seed < 200; seed++) {
    const map = generateMap(new Rng(seed));
    assert.equal(map.length, LEGS.length);
    map.forEach((leg, li) => {
      assert.equal(leg.floors.length, FLOORS_PER_LEG);
      for (let f = 1; f < FLOORS_PER_LEG; f++) {
        leg.floors[f].forEach((_, j) => assert.ok(leg.floors[f - 1].some((n) => n.next.includes(j)), `seed ${seed} leg ${li} f${f} n${j} unreachable`));
      }
      for (let f = 0; f < FLOORS_PER_LEG - 1; f++) leg.floors[f].forEach((n) => assert.ok(n.next.length >= 1));
      assert.ok(leg.floors[FLOORS_PER_LEG - 1].some((n) => n.type === 'rest'));
      assert.ok(leg.floors.slice(1).flat().some((n) => n.type === 'shop'));
      if (li === 0) assert.ok(leg.floors[0].every((n) => n.type === 'fight'));
      assert.deepEqual(choicesFrom(map, { leg: li, floor: FLOORS_PER_LEG - 1, idx: 0 }), ['boss']);
    });
  }
});

test('content references are valid', () => {
  for (const L of LEGS) {
    assert.ok(ENEMIES[L.boss], L.boss);
    for (const e of [...L.enemies, ...L.elites]) assert.ok(ENEMIES[e], e);
    for (const e of L.elites) assert.equal(ENEMIES[e].tier, 'elite');
  }
  for (const [id, r] of Object.entries(RELICS)) assert.ok(r.name && r.desc && r.rarity && r.icon, id);
  for (const e of EVENTS) assert.ok(e.choices.length >= 2, e.id);
  for (const c of Object.values(CHARACTERS)) assert.ok(c.hp > 0 && c.dmg > 0);
});

test('synergies reference real relics', async () => {
  const { SYNERGIES, activeSynergies } = await import('../js/content/relics.js');
  for (const [id, s] of Object.entries(SYNERGIES)) {
    assert.ok(s.relics.length >= 2, id);
    for (const r of s.relics) assert.ok(RELICS[r], `${id}: ${r}`);
  }
  assert.deepEqual(activeSynergies(['samovar', 'podstakannik', 'borscht']), ['tea']);
});
