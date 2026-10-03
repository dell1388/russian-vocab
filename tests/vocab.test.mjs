import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkRussian, checkEnglish, translitSkeleton, normRu, levenshtein } from '../js/text.js';
import { grade, pickWord, MASTERED_BOX } from '../js/srs.js';
import { initWords, distractors, acceptedRussian, wordPool, WORDS } from '../js/data.js';
import { Rng } from '../js/rng.js';

const words = initWords(JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url))));
const find = (b) => words.find((w) => w.bare === b);

test('russian normalisation', () => {
  assert.equal(normRu('Ещё́'), 'еще');
  assert.equal(levenshtein('ab', 'ba'), 1);
});

test('russian answers: exact, ё, typo, translit', () => {
  assert.ok(checkRussian('хорошо', ['хорошо']).exact);
  assert.ok(checkRussian('ХОРОШО', ['хорошо']).ok);
  assert.ok(checkRussian('еще', ['ещё']).exact);
  assert.ok(checkRussian('хорощо', ['хорошо']).ok);
  assert.ok(!checkRussian('хорощо', ['хорошо']).exact);
  assert.ok(!checkRussian('кит', ['кот']).ok, 'short words need exact');
  assert.ok(checkRussian('khorosho', ['хорошо']).ok);
  assert.ok(checkRussian('horosho', ['хорошо']).ok);
  assert.ok(checkRussian('spasibo', ['спасибо']).ok);
  assert.ok(checkRussian('zhizn', ['жизнь']).ok);
  assert.ok(checkRussian('rebyonok', ['ребёнок']).ok);
  assert.ok(checkRussian('shchi', ['щи']).ok);
  assert.ok(!checkRussian('', ['да']).ok);
  assert.ok(!checkRussian('собака', ['кошка']).ok);
  assert.equal(translitSkeleton('чай'), 'chai');
});

test('english answers', () => {
  const w = find('говорить');
  assert.ok(checkEnglish('speak', w).ok);
  assert.ok(checkEnglish('to talk', w).ok);
  assert.ok(checkEnglish('Speek', w).ok);
  assert.ok(!checkEnglish('eat', w).ok);
  assert.ok(checkEnglish('turn out', find('оказаться')).ok);
  assert.ok(checkEnglish('thanks', find('спасибо')).ok);
});

test('srs grading', () => {
  let r = grade(null, true, 0);
  assert.equal(r.b, 1);
  for (let i = 0; i < 5; i++) r = grade(r, true, 0);
  assert.ok(r.b >= MASTERED_BOX);
  r = grade(r, false, 0);
  assert.equal(r.b, 1);
});

test('srs picks new words first, then reviews', () => {
  const rng = new Rng(1);
  const pool = wordPool(1, null);
  const srs = {};
  const w = pickWord(pool, srs, { rng, now: 0 });
  assert.ok(w.id <= pool[6].id);
  srs[w.id] = grade(null, false, 0);
  let hits = 0;
  for (let i = 0; i < 50; i++) if (pickWord(pool, srs, { rng, now: 10 * 60000, newRate: 0 }).id === w.id) hits++;
  assert.equal(hits, 50);
  assert.equal(pickWord(pool, {}, { rng, requireSeen: true }), null);
});

test('distractors are distinct and non-overlapping', () => {
  const rng = new Rng(7);
  for (const b of ['говорить', 'сказать', 'большой', 'вода', 'и', 'спасибо']) {
    const w = find(b);
    const d = distractors(w, 3, rng, wordPool(5, null));
    assert.equal(d.length, 3, b);
    const glosses = new Set([w.gloss, ...d.map((x) => x.gloss)]);
    assert.equal(glosses.size, 4, b);
    assert.ok(!d.some((x) => x.bare === w.partner), b);
  }
});

test('accepted russian includes synonyms sharing main gloss', () => {
  const acc = acceptedRussian(find('сказать'));
  assert.ok(acc.includes('сказать'));
});

test('every word has gloss, pos, ru', () => {
  for (const w of WORDS) {
    assert.ok(w.gloss && w.gloss.length < 45, `${w.bare}: ${w.gloss}`);
    assert.ok(w.ru && w.pos && w.bare);
  }
});
