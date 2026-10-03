// Permanent meta upgrades bought with ★ between runs.

export const UPGRADES = {
  hp: { name: 'Закалка', en: 'Toughening', desc: '+6 max HP', costs: [8, 16, 26, 38, 52], apply(run, n) { run.maxHp += 6 * n; run.hp += 6 * n; } },
  rub: { name: 'Сбережения', en: 'Savings', desc: '+25 starting ₽', costs: [10, 20, 35], apply(run, n) { run.rub += 25 * n; } },
  time: { name: 'Выдержка', en: 'Composure', desc: '+5% answer time', costs: [12, 25, 40], fight(s, n) { s.timerMult *= 1 + 0.05 * n; } },
  dmg: { name: 'Сила воли', en: 'Willpower', desc: '+1 base damage', costs: [15, 30, 50], fight(s, n) { s.dmg += n; } },
  slot: { name: 'Рюкзак', en: 'Backpack', desc: '+1 consumable slot', costs: [30], runStats(rs, n) { rs.slots += n; } },
  supply: { name: 'Паёк', en: 'Rations', desc: 'Start with a Чай', costs: [15], apply(run) { run.consumables.push('chai'); } },
  relic: { name: 'Наследство', en: 'Heirloom', desc: 'Start with a random common relic', costs: [45], apply(run, n, ctx) { ctx.grantRandomRelic('common'); } },
  rest: { name: 'Крепкий сон', en: 'Deep sleep', desc: 'Rest stops heal +15%', costs: [12, 24], runStats(rs, n) { rs.restBonus += 0.15 * n; } },
};

export const UPGRADE_IDS = Object.keys(UPGRADES);
