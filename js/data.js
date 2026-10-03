// Word list access, bands, distractors.
import { englishAnswers, normEn } from './text.js';

export const BANDS = [
  { max: 100, name: 'Топ 100', en: 'Top 100 + essentials' },
  { max: 250, name: 'Топ 250', en: 'Words 101–250' },
  { max: 500, name: 'Топ 500', en: 'Words 251–500' },
  { max: 750, name: 'Топ 750', en: 'Words 501–750' },
  { max: 1000, name: 'Топ 1000', en: 'Words 751–1000' },
  { max: 1500, name: 'Топ 1500', en: 'Words 1001–1500' },
  { max: 2000, name: 'Топ 2000', en: 'Words 1501–2000' },
  { max: 3000, name: 'Топ 3000', en: 'Words 2001–3000' },
  { max: 4000, name: 'Топ 4000', en: 'Words 3001–4000' },
  { max: Infinity, name: 'Все', en: 'Words 4001+' },
];

export const POS_LABEL = {
  noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb', pron: 'pronoun',
  prep: 'preposition', conj: 'conjunction', part: 'particle', num: 'number',
};
export const POS_GROUPS = {
  noun: ['noun'], verb: ['verb'], adj: ['adj'], adv: ['adv'],
  other: ['pron', 'prep', 'conj', 'part', 'num'],
};

export let WORDS = [];
export const byId = new Map();
const keyCache = new Map();

export function initWords(list) {
  WORDS = list;
  byId.clear();
  keyCache.clear();
  let e = 0;
  for (const w of list) {
    w.band = w.ess ? 0 : BANDS.findIndex((b) => w.id <= b.max);
    // Everyday essentials are rare in written text; interleave them early in the learning order
    // Function words (prepositions, particles, conjunctions) are frequent but dull first words: push them later
    w.intro = w.ess ? 4 + 1.4 * e++ : ['prep', 'part', 'conj'].includes(w.pos) ? w.id * 2.5 + 15 : w.id;
    byId.set(w.id, w);
  }
  return WORDS;
}

export async function loadWords(url = 'data/words.json') {
  const res = await fetch(url);
  return initWords(await res.json());
}

export function glossKeys(w) {
  let k = keyCache.get(w.id);
  if (!k) {
    k = new Set(englishAnswers(w));
    keyCache.set(w.id, k);
  }
  return k;
}

function overlaps(a, b) {
  const ka = glossKeys(a);
  for (const x of glossKeys(b)) if (ka.has(x)) return true;
  return false;
}

export function posGroup(pos) {
  for (const [g, list] of Object.entries(POS_GROUPS)) if (list.includes(pos)) return g;
  return 'other';
}

/** Words available given unlocked band count and POS filter (array of group keys or null). */
export function wordPool(bandsUnlocked, posFilter) {
  return WORDS.filter((w) => w.band < bandsUnlocked && (!posFilter || posFilter.includes(posGroup(w.pos))))
    .sort((a, b) => a.intro - b.intro);
}

/** n distinct distractor words for w, same POS where possible, close in frequency. */
export function distractors(w, n, rng, pool = WORDS) {
  const ok = (x) => x.id !== w.id && x.bare !== w.bare && x.bare !== w.partner && x.partner !== w.bare &&
    x.gloss !== w.gloss && !overlaps(w, x);
  let cands = pool.filter((x) => x.pos === w.pos && ok(x));
  if (cands.length < n) cands = cands.concat(WORDS.filter((x) => x.pos === w.pos && ok(x) && !cands.includes(x)));
  if (cands.length < n) cands = cands.concat(WORDS.filter((x) => ok(x) && !cands.includes(x)));
  // Prefer words of similar frequency: weight by closeness of id
  const chosen = [];
  const used = new Set([w.gloss]);
  while (chosen.length < n && cands.length) {
    const c = rng.weighted(cands, (x) => 1 / (1 + Math.abs(x.id - w.id) / 150));
    cands = cands.filter((x) => x !== c);
    if (used.has(c.gloss) || chosen.some((y) => overlaps(y, c))) continue;
    used.add(c.gloss);
    chosen.push(c);
  }
  return chosen;
}

/** Russian forms accepted when prompting with w's English gloss. */
export function acceptedRussian(w) {
  const out = [w.bare];
  const main = normEn(w.gloss.split(/[,;]/)[0]);
  for (const x of WORDS) {
    if (x.id === w.id || x.pos !== w.pos) continue;
    if (glossKeys(x).has(main)) out.push(x.bare);
  }
  return out;
}

export function hintLine(w) {
  const bits = [POS_LABEL[w.pos] || w.pos];
  if (w.g) bits.push({ m: 'masc.', f: 'fem.', n: 'neut.', pl: 'plural' }[w.g] || w.g);
  if (w.asp) bits.push(w.asp === 'pf' ? 'perfective' : 'imperfective');
  return bits.join(' · ');
}
