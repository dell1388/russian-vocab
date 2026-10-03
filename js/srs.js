// Leitner-style spaced repetition. A record per word id:
// { b: box 0..7, due: epoch ms, n: times seen, c: correct, w: wrong, t: last seen ms }

export const INTERVALS_MIN = [0, 4, 20, 120, 720, 2880, 10080, 30240];
export const MAX_BOX = INTERVALS_MIN.length - 1;
export const MASTERED_BOX = 5;

export function grade(rec, correct, now = Date.now()) {
  const r = rec ? { ...rec } : { b: 0, due: 0, n: 0, c: 0, w: 0, t: 0 };
  r.n++;
  r.t = now;
  if (correct) {
    r.c++;
    r.b = Math.min(MAX_BOX, r.b + 1);
  } else {
    r.w++;
    // Drop back to box 1 (or 0 if it was never learned) so it returns soon
    r.b = r.b > 1 ? 1 : 0;
  }
  r.due = now + INTERVALS_MIN[r.b] * 60000;
  return r;
}

export function isMastered(rec) {
  return !!rec && rec.b >= MASTERED_BOX;
}

/**
 * Choose the next word.
 * pool: array of word objects (sorted by frequency rank / id)
 * srs: { [id]: rec }
 * opts: { rng, now, recent: Set<id>, newRate, requireSeen }
 */
export function pickWord(pool, srs, opts) {
  const { rng, now = Date.now(), recent = new Set(), requireSeen = false } = opts;
  const seen = [];
  const fresh = [];
  for (const w of pool) {
    if (recent.has(w.id)) continue;
    (srs[w.id] ? seen : fresh).push(w);
  }
  const due = seen.filter((w) => srs[w.id].due <= now);
  let newRate = opts.newRate ?? (due.length > 6 ? 0.12 : due.length > 2 ? 0.3 : 0.5);
  if (requireSeen) newRate = 0;
  if (!seen.length && !requireSeen) newRate = 1;

  if (fresh.length && rng.next() < newRate) {
    // Introduce in frequency order with a bit of randomness among the next few
    const window = fresh.slice(0, 6);
    return rng.weighted(window, (w) => window.length - window.indexOf(w));
  }
  const candidates = requireSeen ? seen.filter((w) => srs[w.id].c > 0) : seen;
  if (!candidates.length) {
    if (requireSeen) return null;
    return fresh.length ? fresh[0] : rng.pick(pool);
  }
  return rng.weighted(candidates, (w) => {
    const r = srs[w.id];
    if (r.due <= now) {
      const overdueMin = (now - r.due) / 60000;
      return 4 + (MAX_BOX - r.b) * 1.5 + Math.min(4, overdueMin / 60);
    }
    return 0.5 / (1 + r.b);
  });
}
