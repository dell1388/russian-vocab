// Relics: passive run items. Hook interface (all optional), shared with characters:
//   apply(s, run)        modify fight stats at fight start (see combat.js baseStats)
//   runApply(rs)         modify run stats {rubMult, restHealMult, shopMult, slots}
//   onPickup(run)        once when gained
//   fightStart(C)        C = combat context
//   beforeHit(C, hit)    hit = {dmg, mult, crit, format, ms, frac}; mutate mult/crit
//   afterHit(C, hit)
//   onWrong(C)
//   beforeHurt(C, h)     h = {dmg, blocked}; mutate
//   fightWon(C)
//   lethal(C) -> bool    return true to survive a killing blow
// Per-fight scratch state: C.fs[relicId]; per-run persistent: run.rs[relicId]
// rarity: common | rare | legendary

export const RELICS = {
  matryoshka: {
    name: 'Матрёшка', en: 'Matryoshka', rarity: 'common', icon: 'matryoshka',
    desc: 'Blocks the first hit of every fight.',
    fightStart(C) { C.fs.matryoshka = true; },
    beforeHurt(C, h) { if (C.fs.matryoshka) { C.fs.matryoshka = false; h.blocked = true; C.flash('Матрёшка!'); } },
  },
  samovar: {
    name: 'Самовар', en: 'Samovar', rarity: 'common', icon: 'samovar',
    desc: 'Heal 5 HP after each won fight.',
    fightWon(C) { C.heal(5); },
  },
  ushanka: {
    name: 'Ушанка', en: 'Ushanka', rarity: 'common', icon: 'ushanka',
    desc: '+15% answer time.',
    apply(s) { s.timerMult *= 1.15; },
  },
  balalaika: {
    name: 'Балалайка', en: 'Balalaika', rarity: 'common', icon: 'balalaika',
    desc: 'Every 5th answer in a streak is a critical hit.',
    beforeHit(C, hit) { if ((C.streak + 1) % 5 === 0) hit.crit = true; },
  },
  red_star: {
    name: 'Красная звезда', en: 'Red Star', rarity: 'rare', icon: 'star',
    desc: '+25% damage.',
    apply(s) { s.dmgMult *= 1.25; },
  },
  valenki: {
    name: 'Валенки', en: 'Felt boots', rarity: 'common', icon: 'valenki',
    desc: 'Take 20% less damage.',
    apply(s) { s.dmgTakenMult *= 0.8; },
  },
  borscht: {
    name: 'Борщ', en: 'Borscht', rarity: 'common', icon: 'bowl',
    desc: '+12 max HP.',
    onPickup(run) { run.maxHp += 12; run.hp += 12; },
  },
  pirozhok: {
    name: 'Пирожок', en: 'Pirozhok', rarity: 'common', icon: 'pie',
    desc: 'Once per fight, when HP drops below 30%, heal 12.',
    fightStart(C) { C.fs.pirozhok = true; },
    afterHurt(C) { if (C.fs.pirozhok && C.run.hp > 0 && C.run.hp < C.run.maxHp * 0.3) { C.fs.pirozhok = false; C.heal(12); C.flash('Пирожок!'); } },
  },
  firebird: {
    name: 'Перо Жар-птицы', en: 'Firebird feather', rarity: 'legendary', icon: 'feather',
    desc: 'Revive once with 50% HP. Consumed on use.',
    lethal(C) {
      C.run.hp = Math.ceil(C.run.maxHp * 0.5);
      C.removeRelic('firebird');
      C.flash('Жар-птица!');
      return true;
    },
  },
  baikal_ice: {
    name: 'Лёд Байкала', en: 'Baikal ice', rarity: 'rare', icon: 'ice',
    desc: 'Enemy timer is frozen for the first 4 seconds of each fight.',
    apply(s) { s.openingFreezeMs += 4000; },
  },
  faberge: {
    name: 'Яйцо Фаберже', en: 'Fabergé egg', rarity: 'rare', icon: 'egg',
    desc: '+50% ₽ from all sources.',
    runApply(rs) { rs.rubMult *= 1.5; },
  },
  podstakannik: {
    name: 'Подстаканник', en: 'Tea glass holder', rarity: 'common', icon: 'tea',
    desc: 'Rest stops heal 50% more.',
    runApply(rs) { rs.restHealMult *= 1.5; },
  },
  typewriter: {
    name: 'Пишущая машинка', en: 'Typewriter', rarity: 'common', icon: 'typewriter',
    desc: 'Typed answers deal +50% damage.',
    beforeHit(C, hit) { if (hit.format === 'type') hit.mult *= 1.5; },
  },
  schyoty: {
    name: 'Счёты', en: 'Abacus', rarity: 'common', icon: 'abacus',
    desc: 'Win a fight without taking damage: +15 ₽.',
    fightWon(C) { if (!C.tookDamage) C.gainRub(15); },
  },
  pointe: {
    name: 'Пуанты', en: 'Pointe shoes', rarity: 'rare', icon: 'shoe',
    desc: '12% chance to dodge attacks.',
    apply(s) { s.dodge += 0.12; },
  },
  gagarin: {
    name: 'Шлем Гагарина', en: "Gagarin's helmet", rarity: 'common', icon: 'helmet',
    desc: '+30% time on typing questions.',
    apply(s) { s.typeTimerMult *= 1.3; },
  },
  pelmeni: {
    name: 'Пельмени', en: 'Pelmeni', rarity: 'common', icon: 'dumpling',
    desc: '+2 max HP after every won fight.',
    fightWon(C) { C.run.maxHp += 2; C.run.hp += 2; },
  },
  dal: {
    name: 'Словарь Даля', en: "Dahl's dictionary", rarity: 'rare', icon: 'book',
    desc: 'Multiple choice shows 3 options instead of 4.',
    apply(s) { s.mcOptions = Math.min(s.mcOptions, 3); },
  },
  bayan: {
    name: 'Баян', en: 'Bayan accordion', rarity: 'common', icon: 'accordion',
    desc: 'Match-pairs hits deal +60% damage and the board gets +20% time.',
    apply(s) { s.matchTimerMult *= 1.2; },
    beforeHit(C, hit) { if (hit.format === 'match') hit.mult *= 1.6; },
  },
  hammer: {
    name: 'Серп и молот', en: 'Hammer & sickle', rarity: 'rare', icon: 'hammer',
    desc: 'Every 8th correct answer deals triple damage.',
    beforeHit(C, hit) { C.run.rs.hammer = (C.run.rs.hammer || 0) + 1; if (C.run.rs.hammer % 8 === 0) { hit.mult *= 3; C.flash('Серп и молот!'); } },
  },
  troika: {
    name: 'Тройка', en: 'Troika', rarity: 'rare', icon: 'horse',
    desc: 'Three fast answers (under 40% of the timer) in a row: a free extra hit.',
    afterHit(C, hit) {
      C.fs.troika = hit.frac > 0.6 ? (C.fs.troika || 0) + 1 : 0;
      if (C.fs.troika >= 3) { C.fs.troika = 0; C.damageEnemy(Math.round(C.stats.dmg * C.stats.dmgMult), 'Тройка!'); }
    },
  },
  kvass: {
    name: 'Квас', en: 'Kvass', rarity: 'common', icon: 'mug',
    desc: 'Heal 1 HP per correct answer.',
    afterHit(C) { C.heal(1); },
  },
  telegram: {
    name: 'Телеграмма', en: 'Telegram', rarity: 'common', icon: 'telegram',
    desc: 'Typing questions show the first letter.',
    apply(s) { s.firstLetter = true; },
  },
  pravda: {
    name: '«Правда»', en: 'Pravda newspaper', rarity: 'common', icon: 'newspaper',
    desc: '+3 ₽ per correct typed answer.',
    afterHit(C, hit) { if (hit.format === 'type') C.gainRub(3); },
  },
  sputnik: {
    name: 'Спутник', en: 'Sputnik', rarity: 'rare', icon: 'sputnik',
    desc: '+12% critical hit chance.',
    apply(s) { s.critChance += 0.12; },
  },
  chess_clock: {
    name: 'Шахматные часы', en: 'Chess clock', rarity: 'common', icon: 'clock',
    desc: 'The timer waits 1 second before starting each question.',
    apply(s) { s.graceMs += 1000; },
  },
  medal: {
    name: 'Медаль «За отвагу»', en: 'Medal for Courage', rarity: 'rare', icon: 'medal',
    desc: '+35% damage against elites and bosses.',
    beforeHit(C, hit) { if (C.enemy.tier !== 'normal') hit.mult *= 1.35; },
  },
  lapti: {
    name: 'Лапти', en: 'Bast shoes', rarity: 'common', icon: 'lapti',
    desc: 'Start each fight with a 3-answer streak.',
    apply(s) { s.startStreak = Math.max(s.startStreak, 3); },
  },
  kokoshnik: {
    name: 'Кокошник', en: 'Kokoshnik', rarity: 'rare', icon: 'crown',
    desc: 'Critical hits heal 3 HP.',
    afterHit(C, hit) { if (hit.crit) C.heal(3); },
  },
  ikra: {
    name: 'Икра', en: 'Caviar', rarity: 'rare', icon: 'caviar',
    desc: '+1 consumable slot.',
    runApply(rs) { rs.slots += 1; },
  },
  parovoz: {
    name: 'Паровоз', en: 'Steam engine', rarity: 'rare', icon: 'train',
    desc: '+8% damage for each leg of the journey completed.',
    apply(s, run) { s.dmgMult *= 1 + 0.08 * run.leg; },
  },
  mishka: {
    name: 'Олимпийский Мишка', en: 'Olympic Misha', rarity: 'legendary', icon: 'bear',
    desc: 'Once per fight, survive a killing blow with 1 HP.',
    fightStart(C) { C.fs.mishka = true; },
    lethal(C) { if (!C.fs.mishka) return false; C.fs.mishka = false; C.run.hp = 1; C.flash('Мишка!'); return true; },
  },
  zolotoy_kluchik: {
    name: 'Золотой ключик', en: 'Golden key', rarity: 'rare', icon: 'key',
    desc: 'Shops are 25% cheaper.',
    runApply(rs) { rs.shopMult *= 0.75; },
  },
  shapka: {
    name: 'Шапка Мономаха', en: 'Cap of Monomakh', rarity: 'legendary', icon: 'crown2',
    desc: '+40% damage, but take 15% more damage.',
    apply(s) { s.dmgMult *= 1.4; s.dmgTakenMult *= 1.15; },
  },
};

export const RELIC_IDS = Object.keys(RELICS);
export const RARITY_PRICE = { common: 70, rare: 120, legendary: 190 };
export const RARITY_LABEL = { common: 'обычная', rare: 'редкая', legendary: 'легендарная' };
