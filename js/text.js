// Answer normalisation and lenient matching (Russian + English).

const STRESS = /[̀́]/g;

export function stripStress(s) {
  return s.normalize('NFD').replace(STRESS, '').normalize('NFC');
}

export function isCyrillic(s) {
  return /[Ѐ-ӿ]/.test(s);
}

// Lowercase, strip stress, ё→е, collapse spaces, drop punctuation.
export function normRu(s) {
  return stripStress(String(s)).toLowerCase().replace(/ё/g, 'е')
    .replace(/[^\p{L}\s-]/gu, '').replace(/\s+/g, ' ').trim();
}

const CYR2LAT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

// Reduce Latin spellings to a loose skeleton so "khorosho", "horosho", "xorosho" all match.
function latinSkeleton(s) {
  return s.toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/shch|sch|ssh/g, 'sh')
    .replace(/kh|x/g, 'h')
    .replace(/w/g, 'v')
    .replace(/q/g, 'k')
    .replace(/j/g, 'y')
    .replace(/tz|tc|c(?!h)/g, 'ts')
    .replace(/ye|yo|jo|je/g, 'e')
    .replace(/iu/g, 'yu').replace(/ia/g, 'ya')
    .replace(/y(?![au])/g, 'i')
    .replace(/ii+/g, 'i')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, ' ').trim();
}

export function translitSkeleton(s) {
  const r = normRu(s);
  let out = '';
  for (const ch of r) out += CYR2LAT[ch] ?? ch;
  return latinSkeleton(out);
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // Optimal string alignment distance (Levenshtein + adjacent transpositions)
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

export function typoAllowance(len) {
  if (len <= 3) return 0;
  if (len <= 7) return 1;
  return 2;
}

/**
 * Check a typed Russian answer against accepted lemmas.
 * Returns {ok, exact, match} where match is the accepted form that matched.
 */
export function checkRussian(input, accepted) {
  const raw = String(input).trim();
  if (!raw) return { ok: false };
  const cyr = isCyrillic(raw);
  let best = null;
  for (const target of accepted) {
    const t = normRu(target);
    if (cyr) {
      const u = normRu(raw);
      if (u === t) return { ok: true, exact: true, match: target };
      const d = levenshtein(u, t);
      if (d <= typoAllowance(t.length) && (!best || d < best.d)) best = { d, target };
    } else {
      const u = latinSkeleton(raw);
      const ts = translitSkeleton(t);
      if (u === ts) { best = { d: 0, target, translit: true }; continue; }
      const d = levenshtein(u, ts);
      if (d <= typoAllowance(ts.length) && (!best || d < best.d)) best = { d, target, translit: true };
    }
  }
  if (best) return { ok: true, exact: best.d === 0 && !best.translit, match: best.target, translit: !!best.translit };
  return { ok: false };
}

const EN_DROP = /\b(sth|smth|smb|sb|something|someone|somebody|one's|oneself)\b/g;

export function normEn(s) {
  return String(s).toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[’`]/g, "'")
    .replace(EN_DROP, ' ')
    .replace(/^\s*(to|a|an|the)\s+/, '')
    .replace(/[^a-z'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

// All acceptable English answers for a word entry.
export function englishAnswers(word) {
  const set = new Set();
  const add = (s) => {
    for (const piece of String(s).split(/[,;/]/)) {
      const n = normEn(piece);
      if (n) set.add(n);
      // "turn out (to be)" → also accept the bracketed-inclusive form
      const full = normEn(piece.replace(/[()]/g, ''));
      if (full) set.add(full);
    }
  };
  if (word.gloss) add(word.gloss);
  for (const sense of word.en || []) for (const it of sense) add(it);
  return [...set];
}

export function checkEnglish(input, word) {
  const u = normEn(input);
  if (!u) return { ok: false };
  const answers = englishAnswers(word);
  if (answers.includes(u)) return { ok: true, exact: true, match: u };
  let best = null;
  for (const a of answers) {
    const d = levenshtein(u, a);
    if (d <= typoAllowance(a.length) && (!best || d < best.d)) best = { d, a };
  }
  if (best) return { ok: true, exact: false, match: best.a };
  return { ok: false };
}
