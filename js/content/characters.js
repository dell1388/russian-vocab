// Playable characters. `hooks` use the same interface as relics (see relics.js header).

export const CHARACTERS = {
  komsomolets: {
    name: 'Комсомолец', en: 'Komsomol Youth', hp: 60, dmg: 10,
    desc: 'Balanced. Every 4th correct answer in a row grants +2 ₽.',
    art: { kind: 'human', coat: '#c8102e', hat: 'budenovka', acc: 'none', skin: '#efc6a0' },
    unlock: null,
    hooks: {
      afterHit(C) { if (C.streak > 0 && C.streak % 4 === 0) C.gainRub(2); },
    },
  },
  kosmonavt: {
    name: 'Космонавт', en: 'Cosmonaut', hp: 48, dmg: 10,
    desc: '+30% answer time. Low HP.',
    art: { kind: 'human', coat: '#f0f0f0', hat: 'helmet', acc: 'cccp', skin: '#efc6a0' },
    unlock: null,
    hooks: { apply(s) { s.timerMult *= 1.3; } },
  },
  babushka: {
    name: 'Бабушка', en: 'Babushka', hp: 70, dmg: 8,
    desc: 'Heals 3 HP on every 3-answer streak. Lower damage.',
    art: { kind: 'human', coat: '#7a2e3a', hat: 'kerchief', acc: 'glasses', skin: '#e6c3a3', hair: '#cfcfcf' },
    unlock: { type: 'reach_leg', leg: 2, text: 'Reach Екатеринбург' },
    hooks: { afterHit(C) { if (C.streak > 0 && C.streak % 3 === 0) C.heal(3); } },
  },
  shakhmatist: {
    name: 'Шахматист', en: 'Chess Master', hp: 55, dmg: 10,
    desc: 'First correct answer each fight is a critical hit. Sees the next word.',
    art: { kind: 'human', coat: '#2b2b2b', hat: 'beret', acc: 'glasses', skin: '#efc6a0' },
    unlock: { type: 'beat_boss', boss: 'koshchey', text: 'Defeat Кощей' },
    hooks: {
      apply(s) { s.preview = true; },
      beforeHit(C, hit) { if (C.fightCorrect === 0) hit.crit = true; },
    },
  },
  balerina: {
    name: 'Балерина', en: 'Ballerina', hp: 52, dmg: 10,
    desc: '15% chance to dodge. Streak bonus grows twice as fast.',
    art: { kind: 'human', coat: '#e7a6b8', hat: 'bun', acc: 'none', skin: '#f1cfb0', hair: '#3a2416' },
    unlock: { type: 'stars', cost: 60, text: 'Buy for 60 ★' },
    hooks: { apply(s) { s.dodge += 0.15; s.streakRate *= 2; } },
  },
  hokkeist: {
    name: 'Хоккеист', en: 'Hockey Player', hp: 65, dmg: 14,
    desc: 'Hits hard. 20% less answer time.',
    art: { kind: 'human', coat: '#c8102e', hat: 'hockey', acc: 'cccp', skin: '#efc6a0' },
    unlock: { type: 'win', text: 'Reach Владивосток' },
    hooks: { apply(s) { s.timerMult *= 0.8; } },
  },
};

export const CHAR_ORDER = ['komsomolets', 'kosmonavt', 'babushka', 'shakhmatist', 'balerina', 'hokkeist'];
