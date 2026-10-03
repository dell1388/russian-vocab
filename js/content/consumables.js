// Consumables: single use. use(C) runs in combat; `outside` items can also be used on the map.

export const CONSUMABLES = {
  chai: {
    name: 'Чай', en: 'Tea', icon: 'tea', price: 30, outside: true,
    desc: 'Heal 20 HP.',
    use(ctx) { ctx.heal(20); },
  },
  myod: {
    name: 'Мёд', en: 'Honey', icon: 'honey', price: 45, outside: true,
    desc: 'Heal 40% of max HP.',
    use(ctx) { ctx.heal(Math.round(ctx.run.maxHp * 0.4)); },
  },
  sakhar: {
    name: 'Сахар', en: 'Sugar', icon: 'sugar', price: 30,
    desc: 'Enemy timer 50% slower for the rest of this fight.',
    use(C) { C.stats.timerMult *= 1.5; C.flash('Сахар!'); },
  },
  shpargalka: {
    name: 'Шпаргалка', en: 'Cheat sheet', icon: 'paper', price: 35,
    desc: 'Instantly answer the current question correctly (critical hit).',
    use(C) { C.autoAnswer(); },
  },
  snezhok: {
    name: 'Снежок', en: 'Snowball', icon: 'snowball', price: 30,
    desc: 'Deal 30 damage.',
    use(C) { C.damageEnemy(30, 'Снежок!'); },
  },
  zerkalo: {
    name: 'Зеркало', en: 'Mirror', icon: 'mirror', price: 35,
    desc: 'The next enemy attack is reflected back.',
    use(C) { C.fs._mirror = true; C.flash('Зеркало!'); },
  },
};
export const CONSUMABLE_IDS = Object.keys(CONSUMABLES);
