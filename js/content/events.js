// Random events at "?" stations. Each choice's run(E) is async and returns a result string.
// E (event context): run, rng, heal(n), hurt(n), gainRub(n), spendRub(n)->bool, gainRelic(rarity|id)->relic|null,
//   gainConsumable(id?)->bool, addMaxHp(n), addXp(n), quiz({count, format, timed})->Promise<correctCount>,
//   review()->Promise (flashcards of missed words), hasRelic(id)

export const EVENTS = [
  {
    id: 'babushka_pies', title: 'Бабушка с пирожками', en: 'Babushka with pirozhki',
    text: 'On the platform a babushka sells hot pirozhki. "Сынок, прочитай-ка мне эту вывеску?" — she can\'t read the sign without her glasses.',
    icon: 'pie',
    choices: [
      { label: 'Buy a pirozhok (15 ₽)', cond: (r) => r.rub >= 15, async run(E) { E.spendRub(15); E.heal(18); return 'Delicious. +18 HP.'; } },
      { label: 'Read the sign for her (1 word)', async run(E) {
        const ok = await E.quiz({ count: 1, format: 'mc' });
        if (ok) { const r = E.gainRelic('pirozhok') || E.gainRelic('common'); return r ? `"Спасибо, милый!" She gives you: ${r.name}.` : '"Спасибо!" +20 HP.'; }
        E.hurt(3); return '"Эх, молодёжь..." She whacks you with her bag. −3 HP.';
      } },
      { label: 'Walk on', async run() { return 'You board the train.'; } },
    ],
  },
  {
    id: 'cards', title: 'Игра в дурака', en: 'A game of Durak',
    text: 'Soldiers in the next compartment are playing дурак and invite you in. "Ставка — двадцать пять рублей!"',
    icon: 'cards',
    choices: [
      { label: 'Play (bet 25 ₽, 3 quick words)', cond: (r) => r.rub >= 25, async run(E) {
        E.spendRub(25);
        const n = await E.quiz({ count: 3, format: 'mc', timed: true });
        if (n >= 2) { E.gainRub(65); return `You won ${n}/3! +65 ₽.`; }
        return `Дурак! Only ${n}/3. Bet lost.`;
      } },
      { label: 'Decline politely', async run() { return '"Как хочешь."'; } },
    ],
  },
  {
    id: 'gadalka', title: 'Гадалка', en: 'Fortune teller',
    text: 'A fortune teller with a deck of worn cards: "Позолоти ручку — всю правду скажу."',
    icon: 'eye',
    choices: [
      { label: 'Pay with blood (−8 max HP): rare relic', async run(E) { E.addMaxHp(-8); const r = E.gainRelic('rare'); return r ? `The cards reveal: ${r.name}.` : 'The cards are blank...'; } },
      { label: 'Cross her palm (30 ₽): a gift', cond: (r) => r.rub >= 30, async run(E) { E.spendRub(30); E.gainConsumable(); return '"Дорога будет долгой." She hands you something.'; } },
      { label: 'Leave', async run() { return 'You feel her eyes on your back.'; } },
    ],
  },
  {
    id: 'provodnik', title: 'Проводник', en: 'The conductor',
    text: 'The conductor comes by with a tray of tea in glass holders. "Чай, кофе?"',
    icon: 'tea',
    choices: [
      { label: 'Tea (free): +10 HP', async run(E) { E.heal(10); return 'Hot and sweet. +10 HP.'; } },
      { label: 'Tea with sugar (15 ₽): +20 HP and Сахар', cond: (r) => r.rub >= 15, async run(E) { E.spendRub(15); E.heal(20); E.gainConsumable('sakhar'); return '+20 HP, and you pocket a sugar cube.'; } },
    ],
  },
  {
    id: 'chess', title: 'Шахматист в вагоне', en: 'Chess in the carriage',
    text: 'An old man sets up a chessboard. "Каждый ход — слово. Напиши правильно — получишь рубль."',
    icon: 'knight',
    choices: [
      { label: 'Play (type 3 words)', async run(E) {
        const n = await E.quiz({ count: 3, format: 'type' });
        E.gainRub(15 * n);
        if (n === 3) { const r = E.gainRelic('chess_clock'); return `Мат! +45 ₽${r ? ' and ' + r.name : ''}.`; }
        return `${n}/3. +${15 * n} ₽.`;
      } },
      { label: 'Watch and sleep', async run(E) { E.heal(6); return 'You doze off. +6 HP.'; } },
    ],
  },
  {
    id: 'passport', title: 'Потерянный паспорт', en: 'A lost passport',
    text: 'You find a passport under your seat. A worried man is searching the corridor.',
    icon: 'passport',
    choices: [
      { label: 'Return it', async run(E) { E.heal(10); E.addXp(30); return '"Большое спасибо!" +10 HP, +30 XP.'; } },
      { label: 'Keep it (sell later)', async run(E) { E.gainRub(45); E.addMaxHp(-4); return '+45 ₽. Your conscience costs you 4 max HP.'; } },
    ],
  },
  {
    id: 'taiga', title: 'Остановка в тайге', en: 'Stop in the taiga',
    text: 'The train halts in the middle of the taiga. Nobody knows why. Berries glint between the pines.',
    icon: 'tree', minLeg: 1,
    choices: [
      { label: 'Forage in the forest', async run(E) {
        if (E.rng.chance(0.55)) { E.gainConsumable('myod'); E.heal(5); return 'You find wild honey! +Мёд.'; }
        E.hurt(10); return 'A bear! You run back. −10 HP.';
      } },
      { label: 'Stay aboard', async run() { return 'After an hour the train moves on.'; } },
    ],
  },
  {
    id: 'banya', title: 'Баня', en: 'The banya',
    text: 'A wooden banya by the lake. Locals beat each other with birch branches, then leap into an ice hole.',
    icon: 'steam', minLeg: 2,
    choices: [
      { label: 'Steam (−6 HP, +10 max HP)', async run(E) { E.hurt(6); E.addMaxHp(10); return 'Reborn. +10 max HP.'; } },
      { label: 'Jump in the ice hole (type 1 word)', async run(E) {
        const ok = await E.quiz({ count: 1, format: 'type' });
        if (ok) { const r = E.gainRelic('baikal_ice') || E.gainRelic('rare'); return `You shout the word and survive! ${r ? r.name : ''}`; }
        E.hurt(12); return 'Брр! −12 HP.';
      } },
      { label: 'Skip', async run() { return 'Maybe next time.'; } },
    ],
  },
  {
    id: 'teacher', title: 'Учительница на пенсии', en: 'Retired teacher',
    text: '"Молодой человек! Давайте повторим слова." A retired teacher pulls out flashcards.',
    icon: 'book',
    choices: [
      { label: 'Review your missed words (+25% HP, XP)', async run(E) { await E.review(); E.heal(Math.round(E.run.maxHp * 0.25)); E.addXp(25); return '"Молодец!" +25% HP, +25 XP.'; } },
      { label: 'Pretend to sleep', async run() { return 'She tuts loudly.'; } },
    ],
  },
  {
    id: 'bazaar', title: 'Рынок', en: 'Station bazaar',
    text: 'Stalls of smoked fish, pine nuts and mysterious boxes.',
    icon: 'box',
    choices: [
      { label: 'Mystery box (40 ₽)', cond: (r) => r.rub >= 40, async run(E) { E.spendRub(40); const r = E.gainRelic(E.rng.chance(0.3) ? 'rare' : 'common'); return r ? `Inside: ${r.name}!` : 'Empty! Обман!'; } },
      { label: 'Smoked omul (10 ₽): +12 HP', cond: (r) => r.rub >= 10, async run(E) { E.spendRub(10); E.heal(12); return 'Salty and good.'; } },
      { label: 'Browse and leave', async run() { return 'Nothing catches your eye.'; } },
    ],
  },
  {
    id: 'poet', title: 'Поэт', en: 'The poet',
    text: 'A poet recites verses in the dining car. "Поймёшь мои слова — станешь сильнее!"',
    icon: 'quill',
    choices: [
      { label: 'Listen closely (2 words)', async run(E) {
        const n = await E.quiz({ count: 2, format: 'mc', dir: 'ru2en' });
        if (n === 2) { E.run.dmgBonus += 2; return 'Inspired! +2 damage this run.'; }
        return `${n}/2. "Вы не поняли поэзию."`;
      } },
      { label: 'Applaud and leave', async run(E) { E.addXp(10); return '+10 XP.'; } },
    ],
  },
  {
    id: 'katyusha', title: '«Катюша»', en: 'Katyusha',
    text: 'Someone pulls out a bayan and the whole carriage sings «Катюша». "Расцветали яблони и груши..."',
    icon: 'accordion',
    choices: [
      { label: 'Sing along', async run(E) { E.heal(8); E.addXp(15); return 'Your spirit lifts. +8 HP, +15 XP.'; } },
      { label: 'Request an encore (10 ₽)', cond: (r) => r.rub >= 10, async run(E) { E.spendRub(10); E.heal(20); return '+20 HP.'; } },
    ],
  },
];
