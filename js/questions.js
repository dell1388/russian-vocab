// Build question objects from words.
import { distractors, acceptedRussian, hintLine } from './data.js';
import { checkRussian, checkEnglish, stripStress } from './text.js';
import * as save from './save.js';

export function ruLabel(w) {
  return save.get().settings.stress ? w.ru : stripStress(w.ru);
}

export function resolveDir(mode, rng) {
  if (mode === 'mix') return rng.chance(0.5) ? 'en2ru' : 'ru2en';
  return mode;
}

/** Multiple choice or typing question for word w. */
export function makeQuestion(w, format, dir, rng, { options = 4, pool } = {}) {
  const q = { word: w, format, dir };
  if (dir === 'en2ru') {
    q.prompt = { main: w.gloss, sub: hintLine(w), lang: 'en' };
    q.answerLabel = ruLabel(w);
  } else {
    q.prompt = { main: ruLabel(w), sub: '', lang: 'ru', speak: w.bare };
    q.answerLabel = w.gloss;
  }
  if (format === 'mc') {
    const ds = distractors(w, options - 1, rng, pool);
    const opts = [w, ...ds].map((x) => ({
      word: x,
      correct: x === w,
      label: dir === 'en2ru' ? ruLabel(x) : x.gloss,
      lang: dir === 'en2ru' ? 'ru' : 'en',
    }));
    q.options = rng.shuffle(opts);
  } else if (format === 'type') {
    q.answerLang = dir === 'en2ru' ? 'ru' : 'en';
    const accepted = dir === 'en2ru' ? acceptedRussian(w) : null;
    q.check = (input) => {
      if (dir === 'en2ru') {
        const r = checkRussian(input, accepted);
        if (r.ok && stripStress(r.match) !== w.bare) r.alt = true;
        return r;
      }
      return checkEnglish(input, w);
    };
    q.firstLetter = dir === 'en2ru' ? w.bare[0] : w.gloss[0];
  }
  return q;
}

/** Match-pairs board: n words; left column Russian, right column English, both shuffled. */
export function makeMatch(words, rng) {
  return {
    format: 'match',
    words,
    left: rng.shuffle(words.map((w) => ({ id: w.id, label: ruLabel(w), lang: 'ru' }))),
    right: rng.shuffle(words.map((w) => ({ id: w.id, label: w.gloss, lang: 'en' }))),
  };
}
