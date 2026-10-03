// Map generation: per leg, FLOORS_PER_LEG floors of 2–3 branching nodes, then the boss city.
import { LEGS, FLOORS_PER_LEG } from './content/route.js';

const FLOOR_WEIGHTS = [
  { fight: 5, event: 2, elite: 0.5 },
  { fight: 3, event: 2, elite: 1.5, shop: 1.2, treasure: 0.5 },
  { rest: 2, shop: 1.5, elite: 1.3, event: 1, fight: 1, treasure: 0.8 },
];

export function generateMap(rng) {
  return LEGS.map((leg, li) => generateLeg(rng, li));
}

function generateLeg(rng, li) {
  const names = rng.shuffle(LEGS[li].stations);
  let n = 0;
  const floors = [];
  for (let f = 0; f < FLOORS_PER_LEG; f++) {
    const count = f === 0 ? rng.int(2, 3) : rng.int(2, 3);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      let type;
      if (li === 0 && f === 0) type = 'fight';
      else type = rng.weighted(Object.keys(FLOOR_WEIGHTS[f]), (k) => FLOOR_WEIGHTS[f][k]);
      nodes.push({ type, station: names[n++ % names.length], x: (i + 1) / (count + 1), next: [] });
    }
    floors.push(nodes);
  }
  // Guarantees: last floor has a rest; leg has a shop somewhere after floor 0
  const last = floors[FLOORS_PER_LEG - 1];
  if (!last.some((x) => x.type === 'rest')) rng.pick(last).type = 'rest';
  const mid = floors.slice(1).flat();
  if (!mid.some((x) => x.type === 'shop')) {
    const c = floors[1].filter((x) => x.type !== 'rest');
    (c.length ? rng.pick(c) : floors[1][0]).type = 'shop';
  }
  // No two elites side by side on the same floor
  for (const fl of floors) {
    let elites = fl.filter((x) => x.type === 'elite');
    while (elites.length > 1) { elites.pop().type = 'fight'; }
  }
  // Edges: each node links to the nearest 1–2 nodes on the next floor; every next node reachable
  for (let f = 0; f < FLOORS_PER_LEG - 1; f++) {
    const cur = floors[f];
    const nxt = floors[f + 1];
    for (const node of cur) {
      const sorted = nxt.map((m, j) => ({ j, d: Math.abs(m.x - node.x) })).sort((a, b) => a.d - b.d);
      node.next.push(sorted[0].j);
      if (sorted[1] && rng.chance(0.55)) node.next.push(sorted[1].j);
    }
    nxt.forEach((m, j) => {
      if (!cur.some((c) => c.next.includes(j))) {
        const nearest = cur.map((c, i) => ({ i, d: Math.abs(c.x - m.x) })).sort((a, b) => a.d - b.d)[0].i;
        cur[nearest].next.push(j);
      }
    });
    for (const node of cur) node.next = [...new Set(node.next)].sort();
  }
  return { floors, boss: { type: 'boss', station: LEGS[li].to } };
}

/** Indices of nodes selectable from position pos = {leg, floor, idx} (floor -1 = leg start). */
export function choicesFrom(map, pos) {
  const leg = map[pos.leg];
  if (pos.floor === -1) return leg.floors[0].map((_, i) => i);
  if (pos.floor >= FLOORS_PER_LEG - 1) return ['boss'];
  return leg.floors[pos.floor][pos.idx].next;
}
