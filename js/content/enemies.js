// Enemy roster. Stats are for leg 0; run.js scales by leg.
// format: 'mc' | 'type' | 'match'. Bosses use phases (by HP fraction remaining).
// traits:
//   fine     – miss/timeout steals ₽
//   double   – attacks twice (dmg is per hit)
//   flip     – question direction alternates every turn
//   fast     – timer ×0.75
//   slow     – timer ×1.25
//   armored  – first 2 hits each phase deal half damage
//   regen    – heals 4% max HP per exchange
//   enrage   – timer shrinks 5% each exchange (min 50%)
//   undying  – revives once at 35% HP
//   steal    – a hit steals a random consumable

export const ENEMIES = {
  gopnik: {
    name: 'Гопник', en: 'Street tough', tier: 'normal', hp: 34, dmg: 6, format: 'mc', traits: ['fast'],
    art: { kind: 'human', coat: '#1c1c1c', hat: 'cap', acc: 'stripes', skin: '#e8c39e' },
    lines: [['Есть закурить?', 'Got a smoke?'], ['Ты откуда?', 'Where are you from?']],
  },
  kontroler: {
    name: 'Контролёр', en: 'Ticket inspector', tier: 'normal', hp: 40, dmg: 6, format: 'mc', traits: ['fine'],
    art: { kind: 'human', coat: '#24324a', hat: 'peaked', acc: 'badge', skin: '#e3b897' },
    lines: [['Ваш билет!', 'Your ticket!'], ['Штраф!', 'Fine!']],
  },
  domovoi: {
    name: 'Домовой', en: 'House spirit', tier: 'normal', hp: 38, dmg: 5, format: 'mc', traits: ['regen'],
    art: { kind: 'spirit', coat: '#7a4a2a', hat: 'none', acc: 'beard', skin: '#c99a6b' },
    lines: [['Кто тут шумит?', "Who's making noise?"]],
  },
  komar: {
    name: 'Комар', en: 'Mosquito', tier: 'normal', hp: 22, dmg: 4, format: 'mc', traits: ['fast', 'double'],
    art: { kind: 'insect', coat: '#3b3b3b', hat: 'none', acc: 'none', skin: '#6b6b6b' },
    lines: [['Ззззз!', 'Bzzzz!']],
  },
  volk: {
    name: 'Волк', en: 'Wolf', tier: 'normal', hp: 40, dmg: 4, format: 'mc', traits: ['double'],
    art: { kind: 'beast', coat: '#6d6d72', hat: 'ears', acc: 'none', skin: '#8a8a90', snout: 'wolf' },
    lines: [['Ау-у-у!', 'Awoooo!']],
  },
  leshiy: {
    name: 'Леший', en: 'Forest spirit', tier: 'normal', hp: 42, dmg: 6, format: 'mc', traits: ['flip'],
    art: { kind: 'spirit', coat: '#2e5a2e', hat: 'antlers', acc: 'beard', skin: '#8fa36b' },
    lines: [['Заблудился?', 'Lost your way?']],
  },
  medved: {
    name: 'Медведь', en: 'Bear', tier: 'normal', hp: 62, dmg: 9, format: 'mc', traits: ['slow'],
    art: { kind: 'beast', coat: '#5a3a22', hat: 'ears', acc: 'none', skin: '#6e4a2e', snout: 'bear' },
    lines: [['Р-р-р!', 'Grrr!']],
  },
  snegovik: {
    name: 'Снеговик', en: 'Snowman', tier: 'normal', hp: 46, dmg: 6, format: 'mc', traits: ['armored'],
    art: { kind: 'snow', coat: '#f4f1ea', hat: 'bucket', acc: 'carrot', skin: '#ffffff' },
    lines: [['Холодно?', 'Cold?']],
  },
  nerpa: {
    name: 'Нерпа', en: 'Baikal seal', tier: 'normal', hp: 36, dmg: 5, format: 'mc', traits: ['regen', 'fast'],
    art: { kind: 'seal', coat: '#7d8792', hat: 'none', acc: 'none', skin: '#8e98a3' },
    lines: [['Буль!', 'Splash!']],
  },
  tigr_cub: {
    name: 'Тигрёнок', en: 'Tiger cub', tier: 'normal', hp: 40, dmg: 5, format: 'mc', traits: ['fast', 'double'],
    art: { kind: 'beast', coat: '#d9822b', hat: 'ears', acc: 'tigerstripes', skin: '#e89a45', snout: 'cat' },
    lines: [['Мяу!', 'Meow!']],
  },
  metel: {
    name: 'Метель', en: 'Blizzard', tier: 'normal', hp: 44, dmg: 6, format: 'mc', traits: ['enrage', 'flip'],
    art: { kind: 'storm', coat: '#c9d6e3', hat: 'none', acc: 'none', skin: '#e6eef5' },
    lines: [['Ууууу...', 'Whooo...']],
  },

  kot: {
    name: 'Кот учёный', en: 'The Learned Cat', tier: 'normal', hp: 40, dmg: 6, format: 'gender', traits: [],
    art: { kind: 'beast', coat: '#3a3a3a', hat: 'ears', acc: 'glasses', skin: '#4a4a4a', snout: 'cat' },
    lines: [['Идёт направо — песнь заводит…', 'Walking right, he starts a song…'], ['Он, она или оно?', 'He, she or it?']],
  },

  // Elites: typing
  byurokrat: {
    name: 'Бюрократ', en: 'Bureaucrat', tier: 'elite', hp: 70, dmg: 9, format: 'type', traits: ['armored', 'fine'],
    art: { kind: 'human', coat: '#3a3a3a', hat: 'none', acc: 'glasses', skin: '#e0b48f' },
    lines: [['Заполните форму!', 'Fill in the form!'], ['В трёх экземплярах.', 'In triplicate.']],
  },
  provodnitsa: {
    name: 'Проводница', en: 'Train attendant', tier: 'elite', hp: 72, dmg: 9, format: 'type', traits: ['enrage'],
    art: { kind: 'human', coat: '#1f3d6b', hat: 'pilotka', acc: 'scarf', skin: '#efc8a4', hair: '#8b3a1a' },
    lines: [['Чай будете?', 'Will you have tea?'], ['Бельё сдаём!', 'Hand in your bedding!']],
  },
  kikimora: {
    name: 'Кикимора', en: 'Swamp hag', tier: 'elite', hp: 68, dmg: 8, format: 'type', traits: ['flip', 'steal'],
    art: { kind: 'spirit', coat: '#4d5e2a', hat: 'kerchief', acc: 'none', skin: '#9bae74', hair: '#3c4a1e' },
    lines: [['Хи-хи-хи!', 'Hee-hee-hee!']],
  },
  dvoynik: {
    name: 'Двойник', en: 'The Double', tier: 'elite', hp: 64, dmg: 8, format: 'aspect', traits: ['fast'],
    art: { kind: 'human', coat: '#4b2e83', hat: 'cap', acc: 'glasses', skin: '#d8c3e6' },
    lines: [['Делать или сделать?', 'To do, or to get it done?'], ['У каждого глагола есть пара.', 'Every verb has a twin.']],
  },
  tigr: {
    name: 'Амурский тигр', en: 'Amur tiger', tier: 'elite', hp: 80, dmg: 7, format: 'type', traits: ['double'],
    art: { kind: 'beast', coat: '#d9741b', hat: 'ears', acc: 'tigerstripes', skin: '#e8892e', snout: 'cat' },
    lines: [['Р-р-ра-а!', 'Rrraaah!']],
  },

  // Bosses
  baba_yaga: {
    name: 'Баба Яга', en: 'Baba Yaga', tier: 'boss', hp: 150, dmg: 9, traits: [],
    phases: [{ at: 1, format: 'mc' }, { at: 0.66, format: 'match' }, { at: 0.33, format: 'type' }],
    art: { kind: 'human', coat: '#3d2b4f', hat: 'kerchief', acc: 'nose', skin: '#cfb08f', hair: '#9a9a9a' },
    lines: [['Фу-фу, русским духом пахнет!', 'Phew, I smell a Russian soul!'], ['Я тебя съем!', "I'll eat you!"]],
  },
  mednaya: {
    name: 'Хозяйка Медной горы', en: 'Mistress of the Copper Mountain', tier: 'boss', hp: 170, dmg: 10, traits: ['armored'],
    phases: [{ at: 1, format: 'mc' }, { at: 0.66, format: 'match' }, { at: 0.33, format: 'type' }],
    art: { kind: 'human', coat: '#1f7a5a', hat: 'kokoshnik', acc: 'gems', skin: '#e7c9a9', hair: '#5a2d0c' },
    lines: [['Каменный цветок не для всех.', 'The stone flower is not for everyone.']],
  },
  koshchey: {
    name: 'Кощей Бессмертный', en: 'Koschei the Deathless', tier: 'boss', hp: 170, dmg: 11, traits: ['undying'],
    phases: [{ at: 1, format: 'mc' }, { at: 0.6, format: 'type' }, { at: 0.3, format: 'match' }],
    art: { kind: 'skeleton', coat: '#1a1a1a', hat: 'crown', acc: 'none', skin: '#e9e4d4' },
    lines: [['Смерть моя на конце иглы...', 'My death is at the tip of a needle...'], ['Я бессмертен!', 'I am deathless!']],
  },
  gorynych: {
    name: 'Змей Горыныч', en: 'Zmey Gorynych', tier: 'boss', hp: 200, dmg: 7, traits: ['double'],
    phases: [{ at: 1, format: 'mc', head: 1 }, { at: 0.66, format: 'match', head: 2 }, { at: 0.33, format: 'type', head: 3 }],
    art: { kind: 'dragon', coat: '#2f6b2f', hat: 'none', acc: 'none', skin: '#3f8a3f' },
    lines: [['Три головы лучше, чем одна!', 'Three heads are better than one!']],
  },
  moroz: {
    name: 'Генерал Мороз', en: 'General Frost', tier: 'boss', hp: 200, dmg: 11, traits: ['enrage', 'regen'],
    phases: [{ at: 1, format: 'type' }, { at: 0.7, format: 'match' }, { at: 0.4, format: 'mc' }, { at: 0.2, format: 'type' }],
    art: { kind: 'human', coat: '#e8eef5', hat: 'ushanka', acc: 'beardwhite', skin: '#d6e4f0', medals: true },
    lines: [['Никто не проходит зиму!', 'No one gets through winter!'], ['Холод — моя армия.', 'The cold is my army.']],
  },
};

export const TRAIT_INFO = {
  fine: ['Штраф', 'Misses cost you ₽'],
  double: ['Двойной удар', 'Attacks twice'],
  flip: ['Путаница', 'Question direction flips each turn (Mixed mode)'],
  fast: ['Быстрый', 'Shorter timer'],
  slow: ['Медленный', 'Longer timer, hits hard'],
  armored: ['Броня', 'First 2 hits each phase deal half damage'],
  regen: ['Регенерация', 'Heals each turn'],
  enrage: ['Ярость', 'Timer shrinks every turn'],
  undying: ['Бессмертный', 'Revives once'],
  steal: ['Воровка', 'Hits steal a consumable'],
};
