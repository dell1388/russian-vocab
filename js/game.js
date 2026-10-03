// Run flow: map, node screens, rewards, leg transitions, end of run.
import { LEGS, FLOORS_PER_LEG } from './content/route.js';
import { ENEMIES } from './content/enemies.js';
import { RELICS, RARITY_PRICE, RARITY_LABEL } from './content/relics.js';
import { CONSUMABLES, CONSUMABLE_IDS } from './content/consumables.js';
import { EVENTS } from './content/events.js';
import { CHARACTERS } from './content/characters.js';
import { choicesFrom } from './map.js';
import { Combat } from './combat.js';
import { flashcards, quiz } from './minigames.js';
import { byId } from './data.js';
import { pickWord } from './srs.js';
import * as run_ from './run.js';
import * as save from './save.js';
import * as progress from './progress.js';
import * as audio from './audio.js';
import { portrait, badge, icon, star } from './art.js';
import { show, $, $$, esc, modal, sleep, toast, floatText } from './ui.js';

const NODE_INFO = {
  fight: { icon: 'fist', ru: 'Бой', en: 'Fight' },
  elite: { icon: 'skull', ru: 'Элита', en: 'Elite (typing)' },
  shop: { icon: 'rouble', ru: 'Магазин', en: 'Shop' },
  rest: { icon: 'samovar', ru: 'Привал', en: 'Rest stop' },
  event: { icon: 'question', ru: 'Событие', en: 'Event' },
  treasure: { icon: 'chest', ru: 'Сундук', en: 'Treasure' },
  boss: { icon: 'star', ru: 'Босс', en: 'Boss' },
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

let goTitle = () => {};
export function setTitleHandler(fn) { goTitle = fn; }

// ---------------- HUD ----------------
function hud(run) {
  const c = CHARACTERS[run.char];
  const rs = run_.runStats(run);
  return `<div class="hud">
    <div class="hud-char">${portrait(c.art, { bg: 'square', bgColor: '#d9a441' })}</div>
    <div class="hud-main">
      <div class="hud-row"><div class="hp hud-hp ${run.hp / run.maxHp < 0.3 ? 'low' : ''}"><i style="width:${(run.hp / run.maxHp) * 100}%"></i><span>${run.hp} / ${run.maxHp}</span></div>
        <span class="hud-rub">${run.rub} ₽</span></div>
      <div class="hud-row hud-items">
        <div class="hud-relics">${run.relics.map((id) => `<button class="relic-btn" data-relic="${id}" title="${esc(RELICS[id].name)}">${badge(RELICS[id].icon, RELICS[id].rarity, 28)}</button>`).join('') || '<span class="muted small">no relics yet</span>'}</div>
        <div class="hud-cons">${Array.from({ length: rs.slots }, (_, i) => {
          const id = run.consumables[i];
          return id ? `<button class="cons-btn" data-i="${i}" title="${esc(CONSUMABLES[id].name)}">${badge(CONSUMABLES[id].icon, 'common', 28)}</button>` : '<span class="cons-empty"></span>';
        }).join('')}</div>
      </div>
    </div>
    <button class="icon-btn menu-btn" aria-label="Menu">☰</button>
  </div>`;
}

function bindHud(run, refresh) {
  $$('.relic-btn').forEach((b) => {
    b.onclick = () => {
      const r = RELICS[b.dataset.relic];
      modal(`<div class="relic-detail">${badge(r.icon, r.rarity, 72)}<h3>${esc(r.name)}</h3><p class="muted">${esc(r.en)} · ${RARITY_LABEL[r.rarity]}</p><p>${esc(r.desc)}</p></div>`);
    };
  });
  $$('.cons-btn').forEach((b) => {
    b.onclick = async () => {
      const i = +b.dataset.i;
      const c = CONSUMABLES[run.consumables[i]];
      const canUse = c.outside;
      const v = await modal(`<div class="relic-detail">${badge(c.icon, 'common', 72)}<h3>${esc(c.name)}</h3><p class="muted">${esc(c.en)}</p><p>${esc(c.desc)}</p>${canUse ? '' : '<p class="muted small">Usable in battle.</p>'}</div>`,
        canUse ? [{ label: 'Use', value: 'use' }, { label: 'Close', value: null, cls: 'btn-ghost' }] : [{ label: 'Close', value: null }]);
      if (v === 'use') {
        run.consumables.splice(i, 1);
        c.use({ run, heal: (n) => run_.heal(run, n) });
        audio.sfx('heal');
        run_.persist(run);
        refresh();
      }
    };
  });
  $('.menu-btn').onclick = () => runMenu(run, refresh);
}

async function runMenu(run, refresh) {
  const v = await modal(`<h3>Меню</h3><p class="muted">The run is saved automatically after every station.</p>`, [
    { label: 'Continue', value: null },
    { label: 'Words missed this run', value: 'missed', cls: 'btn-ghost' },
    { label: 'Save & quit to title', value: 'quit', cls: 'btn-ghost' },
    { label: 'Abandon run', value: 'abandon', cls: 'btn-danger' },
  ]);
  if (v === 'quit') { run_.persist(run); save.saveNow(); audio.stopMusic(); goTitle(); }
  if (v === 'missed') {
    const list = run.missed.map((id) => byId.get(id)).filter(Boolean);
    await modal(`<h3>Пропущенные слова</h3>${list.length ? `<table class="wordtable">${list.map((w) => `<tr><td lang="ru">${esc(w.ru)}</td><td>${esc(w.gloss)}</td></tr>`).join('')}</table>` : '<p class="muted">None yet. Отлично!</p>'}`);
  }
  if (v === 'abandon') {
    const sure = await modal('<h3>Abandon this run?</h3><p>You still earn ★ for progress so far.</p>', [{ label: 'Abandon', value: true, cls: 'btn-danger' }, { label: 'Cancel', value: false, cls: 'btn-ghost' }]);
    if (sure) endRun(run, false, 'abandon');
  }
}

// ---------------- Map ----------------
export function showMap(run) {
  audio.startMusic();
  const leg = run.map[run.leg];
  const L = LEGS[run.leg];
  const avail = choicesFrom(run.map, { leg: run.leg, ...run.pos });
  const rows = [];
  const H = 104;
  const nodePos = (f, i) => ({ x: leg.floors[f][i].x * 100, y: (f + 1) * H + H / 2 });
  const total = (FLOORS_PER_LEG + 2) * H;
  let lines = '';
  // start → floor 0
  leg.floors[0].forEach((n, i) => {
    const p = nodePos(0, i);
    const active = run.pos.floor === -1;
    lines += `<line x1="50" y1="${H / 2}" x2="${p.x}" y2="${p.y}" class="${active ? 'live' : n.done ? 'trod' : ''}"/>`;
  });
  for (let f = 0; f < FLOORS_PER_LEG; f++) {
    leg.floors[f].forEach((n, i) => {
      const p = nodePos(f, i);
      const targets = f === FLOORS_PER_LEG - 1 ? [{ x: 50, y: (FLOORS_PER_LEG + 1) * H + H / 2, done: false, j: 'boss' }] : n.next.map((j) => ({ ...nodePos(f + 1, j), done: leg.floors[f + 1][j].done, j }));
      for (const t of targets) {
        const fromHere = run.pos.floor === f && run.pos.idx === i;
        lines += `<line x1="${p.x}" y1="${p.y}" x2="${t.x}" y2="${t.y}" class="${fromHere ? 'live' : n.done && t.done ? 'trod' : ''}"/>`;
      }
    });
  }
  const nodeBtn = (n, f, i, x, y) => {
    const info = NODE_INFO[n.type];
    const isAvail = f === 'boss' ? avail.includes('boss') : run.pos.floor === f - 1 || (run.pos.floor === -1 && f === 0) ? avail.includes(i) : false;
    const cls = ['node', `node-${n.type}`, n.done ? 'done' : '', isAvail ? 'avail' : '', run.pos.floor === f && run.pos.idx === i ? 'here' : ''].join(' ');
    const art = n.type === 'boss' ? portrait(ENEMIES[L.boss].art, { bg: 'circle', bgColor: '#141414' }) : icon(info.icon, n.done ? '#f3e9d2' : '#141414', 30);
    return `<button class="${cls}" style="left:${x}%;top:${y}px" data-f="${f}" data-i="${i}" ${isAvail ? '' : 'disabled'} aria-label="${info.en} — ${esc(n.station)}">
      <span class="node-ic">${art}</span><span class="node-name">${esc(n.station)}</span><span class="node-type">${info.ru}</span></button>`;
  };
  rows.push(`<div class="node node-city ${run.pos.floor === -1 ? 'here' : 'done'}" style="left:50%;top:${H / 2}px"><span class="node-ic">${icon('city', '#f3e9d2', 30)}</span><span class="node-name">${esc(L.from)}</span></div>`);
  for (let f = 0; f < FLOORS_PER_LEG; f++) leg.floors[f].forEach((n, i) => { const p = nodePos(f, i); rows.push(nodeBtn(n, f, i, p.x, p.y)); });
  rows.push(nodeBtn(leg.boss, 'boss', 0, 50, (FLOORS_PER_LEG + 1) * H + H / 2));

  const route = ['Москва', 'Казань', 'Екб', 'Новосиб', 'Иркутск', 'Владик'];
  show(`${hud(run)}
    <div class="route">${route.map((c, i) => `<div class="stop ${i < run.leg + 1 ? 'past' : ''} ${i === run.leg ? 'cur' : ''}"><i></i><span>${esc(c)}</span></div>`).join('')}
      <div class="route-line"><b style="width:${(run.leg / LEGS.length) * 100 + ((run.pos.floor + 1) / (FLOORS_PER_LEG + 1)) * (100 / LEGS.length)}%"></b></div></div>
    <div class="leg-title" style="--leg:${L.color}"><span class="leg-num">Этап ${ROMAN[run.leg]}</span><h2>${esc(L.from)} → ${esc(L.to)}</h2><small>${esc(L.fromEn)} → ${esc(L.toEn)} · boss: ${esc(ENEMIES[L.boss].name)}</small></div>
    <div class="map" style="height:${total}px"><svg class="map-lines" viewBox="0 0 100 ${total}" preserveAspectRatio="none">${lines}</svg>${rows.join('')}</div>
    <div class="legend">${Object.entries(NODE_INFO).map(([k, v]) => `<span>${icon(v.icon, '#141414', 16)} ${v.ru} <small>${v.en}</small></span>`).join('')}</div>
    <p class="muted small center">Mode: ${modeLabel(run.mode)}${run.easy ? ' · Easy (no timer)' : ''}${run.daily ? ' · Daily challenge ' + esc(run.daily.date) : ''}</p>`, 'screen-map');
  bindHud(run, () => showMap(run));
  $$('.node.avail').forEach((b) => {
    b.onclick = () => {
      const f = b.dataset.f === 'boss' ? 'boss' : +b.dataset.f;
      travel(run, f, +b.dataset.i);
    };
  });
  const here = $('.node.avail');
  if (here) setTimeout(() => here.scrollIntoView({ block: 'center', behavior: save.get().settings.reduceMotion ? 'auto' : 'smooth' }), 80);
}

export function modeLabel(m) {
  return { en2ru: 'English → Russian', ru2en: 'Russian → English', mix: 'Mixed' }[m];
}

async function travel(run, f, i) {
  const leg = run.map[run.leg];
  const node = f === 'boss' ? leg.boss : leg.floors[f][i];
  audio.sfx('whistle');
  if (!save.get().settings.reduceMotion) {
    show(`<div class="travel"><div class="travel-sky"></div><div class="travel-train">${trainSvg()}</div><div class="travel-rail"></div>
      <h2>Следующая станция: ${esc(node.station)}</h2><p class="muted">${esc(NODE_INFO[node.type].en)}</p></div>`, 'screen-travel');
    await sleep(1100);
  }
  run.pending = { floor: f, idx: i };
  run_.persist(run);
  await enterNode(run, f, i);
}

function trainSvg() {
  return `<svg viewBox="0 0 220 70" width="220" height="70"><rect x="0" y="20" width="60" height="34" fill="#141414"/><rect x="62" y="20" width="60" height="34" fill="#c8102e"/><rect x="124" y="14" width="64" height="40" fill="#141414"/><rect x="176" y="2" width="12" height="16" fill="#141414"/><path d="M188 54 L212 54 L200 36 L188 36 Z" fill="#c8102e"/>${star(156, 34, 9, '#d9a441')}
    ${[12, 46, 74, 108, 136, 172].map((x) => `<circle cx="${x}" cy="58" r="8" fill="#3a3a3a" stroke="#f3e9d2" stroke-width="2"/>`).join('')}
    <rect x="8" y="26" width="14" height="10" fill="#f3e9d2"/><rect x="30" y="26" width="14" height="10" fill="#f3e9d2"/><rect x="70" y="26" width="14" height="10" fill="#f3e9d2"/><rect x="92" y="26" width="14" height="10" fill="#f3e9d2"/></svg>`;
}

export async function resumeRun(run) {
  if (run.pending) await enterNode(run, run.pending.floor, run.pending.idx);
  else showMap(run);
}

async function enterNode(run, f, i) {
  const leg = run.map[run.leg];
  const node = f === 'boss' ? leg.boss : leg.floors[f][i];
  const L = LEGS[run.leg];
  const rng = run_.R(run);
  let result = null;
  if (node.type === 'fight' || node.type === 'elite' || node.type === 'boss') {
    let enemyId;
    if (node.type === 'boss') enemyId = L.boss;
    else {
      const list = (node.type === 'elite' ? L.elites : L.enemies).filter((e) => e !== run.lastEnemy);
      enemyId = node.enemy || rng.pick(list);
    }
    node.enemy = enemyId;
    run.lastEnemy = enemyId;
    run_.persist(run);
    if (node.type !== 'fight') await enemyIntro(enemyId, node.type);
    result = await new Combat(run, enemyId).start();
    if (!result.won) return endRun(run, false, 'dead', enemyId);
    run.stats.fights++;
    if (node.type === 'elite') run.stats.elites++;
    if (node.type === 'boss') run.stats.bosses++;
    const ev = { type: node.type === 'boss' ? 'bossWon' : 'fightWon', boss: enemyId, flawless: result.flawless, hp: run.hp };
    progress.check({ type: 'fightWon', hp: run.hp });
    if (node.type === 'boss') {
      const p = save.get();
      p.stats.bossesBeaten[enemyId] = (p.stats.bossesBeaten[enemyId] || 0) + 1;
      progress.check(ev);
      progress.checkUnlocks(ev);
    }
    progress.addXp(node.type === 'boss' ? 40 : node.type === 'elite' ? 15 : 5);
    await rewards(run, node.type);
  } else if (node.type === 'shop') await shop(run, node);
  else if (node.type === 'rest') await rest(run);
  else if (node.type === 'event') await eventNode(run, node);
  else if (node.type === 'treasure') await treasure(run);

  node.done = true;
  run.pending = null;
  run.stats.floors++;
  if (f === 'boss') {
    run_.persist(run);
    return legComplete(run);
  }
  run.pos = { floor: f, idx: i };
  run_.persist(run);
  showMap(run);
}

async function enemyIntro(id, type) {
  const e = ENEMIES[id];
  const boss = type === 'boss';
  show(`<div class="intro ${boss ? 'intro-boss' : 'intro-elite'}">
    <div class="intro-art">${portrait(e.art, { bg: 'rays', bgColor: boss ? '#141414' : '#1d4e89' })}</div>
    <div class="intro-text"><span class="intro-kicker">${boss ? 'БОСС' : 'ЭЛИТА'}</span><h1>${esc(e.name)}</h1><p>${esc(e.en)}</p>
    ${e.lines ? `<blockquote lang="ru">«${esc(e.lines[0][0])}»<small>${esc(e.lines[0][1])}</small></blockquote>` : ''}
    <p class="muted small">${boss ? 'Phases change the question type as its health drops.' : 'Elites demand typed answers.'}</p>
    <button class="btn btn-big btn-fight">В бой! <small>Fight!</small></button></div></div>`, 'screen-intro');
  audio.sfx('boss');
  await new Promise((r) => { $('.btn-fight').onclick = r; });
}

// ---------------- Rewards ----------------
async function rewards(run, type) {
  const rng = run_.R(run);
  const leg = run.leg;
  const base = type === 'boss' ? 55 + 10 * leg : type === 'elite' ? 28 + 4 * leg : rng.int(10, 16) + 2 * leg;
  const rub = run_.gainRub(run, base);
  let cons = null;
  if (type !== 'fight' || rng.chance(0.35)) {
    const id = rng.pick(CONSUMABLE_IDS);
    if (run_.gainConsumable(run, id)) cons = id;
  }
  let choices = [];
  if (type === 'elite') choices = run_.relicChoices(run, 3);
  if (type === 'boss') choices = run_.relicChoices(run, 3, { common: 0.2, rare: 0.55, legendary: 0.25 });
  run_.persist(run);
  audio.sfx('coin');
  const root = show(`${hud(run)}<div class="panel reward">
    <h2>${type === 'boss' ? 'Победа над боссом!' : 'Победа!'} <small>Victory</small></h2>
    <div class="loot"><div class="loot-item">${icon('rouble', '#c8102e', 40)}<b>+${rub} ₽</b></div>
    ${cons ? `<div class="loot-item">${badge(CONSUMABLES[cons].icon, 'common', 40)}<b>${esc(CONSUMABLES[cons].name)}</b><small>${esc(CONSUMABLES[cons].desc)}</small></div>` : ''}</div>
    ${choices.length ? `<h3>Выберите значок <small>Choose a relic</small></h3><div class="relic-choices">${choices.map((id) => relicCard(id)).join('')}</div>` : ''}
    <button class="btn btn-big btn-continue">${choices.length ? 'Skip' : 'Дальше'} <small>${choices.length ? 'take nothing' : 'continue'}</small></button></div>`, 'screen-reward');
  bindHud(run, () => {});
  await new Promise((resolve) => {
    $$('.relic-card', root).forEach((b) => {
      b.onclick = () => {
        const r = run_.gainRelic(run, b.dataset.id);
        audio.sfx('relic');
        toast(`${r.name}`, r.desc, 'relic');
        run_.persist(run);
        resolve();
      };
    });
    $('.btn-continue', root).onclick = resolve;
  });
}

function relicCard(id, price = null, sold = false) {
  const r = RELICS[id];
  return `<button class="relic-card rar-${r.rarity}" data-id="${id}" ${sold ? 'disabled' : ''}>${badge(r.icon, r.rarity, 64)}<b>${esc(r.name)}</b><small class="muted">${esc(r.en)} · ${RARITY_LABEL[r.rarity]}</small><span>${esc(r.desc)}</span>${price != null ? `<em class="price">${sold ? 'продано' : price + ' ₽'}</em>` : ''}</button>`;
}

// ---------------- Shop ----------------
async function shop(run, node) {
  const rng = run_.R(run);
  if (!node.stock) {
    node.stock = {
      relics: run_.relicChoices(run, 3, { common: 0.6, rare: 0.32, legendary: 0.08 }).map((id) => ({ id, sold: false })),
      cons: rng.sample(CONSUMABLE_IDS, 3).map((id) => ({ id, sold: false })),
      healUsed: false,
    };
    run_.persist(run);
  }
  return new Promise((resolve) => {
    const draw = () => {
      const rs = run_.runStats(run);
      const price = (p) => Math.round(p * rs.shopMult * (1 + 0.1 * run.leg));
      const st = node.stock;
      const healPrice = price(25);
      const root = show(`${hud(run)}<div class="panel shop">
        <h2>Магазин «${esc(node.station)}» <small>Shop</small></h2>
        <p class="shop-keeper">«Заходите, заходите! Всё по-честному.» <small>Come in, everything's fair.</small></p>
        <h3>Значки <small>Relics</small></h3>
        <div class="relic-choices">${st.relics.map((x) => relicCard(x.id, price(RARITY_PRICE[RELICS[x.id].rarity]), x.sold)).join('')}</div>
        <h3>Припасы <small>Supplies</small></h3>
        <div class="shop-cons">${st.cons.map((x, i) => {
          const c = CONSUMABLES[x.id];
          return `<button class="cons-card" data-i="${i}" ${x.sold ? 'disabled' : ''}>${badge(c.icon, 'common', 44)}<b>${esc(c.name)}</b><span>${esc(c.desc)}</span><em class="price">${x.sold ? 'продано' : price(c.price) + ' ₽'}</em></button>`;
        }).join('')}
          <button class="cons-card heal-card" ${st.healUsed ? 'disabled' : ''}>${icon('tea', '#c8102e', 44)}<b>Врач</b><span>Heal 35% HP</span><em class="price">${st.healUsed ? 'продано' : healPrice + ' ₽'}</em></button></div>
        <button class="btn btn-big btn-leave">Уйти <small>leave</small></button></div>`, 'screen-shop');
      bindHud(run, draw);
      const buy = (cost, fn) => {
        if (run.rub < cost) { toast('Не хватает денег', 'Not enough ₽', 'bad'); audio.sfx('wrong'); return; }
        if (fn() === false) return;
        run.rub -= cost;
        audio.sfx('coin');
        run_.persist(run);
        draw();
      };
      $$('.relic-card', root).forEach((b) => {
        b.onclick = () => {
          const x = st.relics.find((r) => r.id === b.dataset.id);
          buy(price(RARITY_PRICE[RELICS[x.id].rarity]), () => { run_.gainRelic(run, x.id); x.sold = true; audio.sfx('relic'); });
        };
      });
      $$('.cons-card:not(.heal-card)', root).forEach((b) => {
        b.onclick = () => {
          const x = st.cons[+b.dataset.i];
          buy(price(CONSUMABLES[x.id].price), () => {
            if (!run_.gainConsumable(run, x.id)) { toast('Нет места', 'Consumable slots full', 'bad'); return false; }
            x.sold = true;
          });
        };
      });
      $('.heal-card', root).onclick = () => buy(healPrice, () => { run_.heal(run, run.maxHp * 0.35); st.healUsed = true; audio.sfx('heal'); });
      $('.btn-leave', root).onclick = resolve;
    };
    draw();
  });
}

// ---------------- Rest ----------------
async function rest(run) {
  const rs = run_.runStats(run);
  const healAmt = Math.round(run.maxHp * (0.35 + rs.restBonus) * rs.restHealMult);
  const choice = await new Promise((resolve) => {
    const root = show(`${hud(run)}<div class="panel rest">
      <div class="rest-art">${badge('samovar', 'common', 96)}</div>
      <h2>Привал <small>Rest stop</small></h2>
      <p>The train stops for an hour. The samovar is hot.</p>
      <div class="rest-choices">
        <button class="choice" data-c="review"><b>Отдых и повторение</b><span>Review ${Math.min(10, Math.max(5, run.missed.length))} flashcards of words you've struggled with, then rest: <b>+${healAmt} HP</b>.</span></button>
        <button class="choice" data-c="drill"><b>Тренировка</b><span>Type 5 words. 3+ correct: <b>+1 damage</b> for the run; 5/5: <b>+2</b>.</span></button>
      </div></div>`, 'screen-rest');
    bindHud(run, () => {});
    $$('.choice', root).forEach((b) => { b.onclick = () => resolve(b.dataset.c); });
  });
  if (choice === 'review') {
    await reviewMissed(run, 'Повторение у самовара');
    const got = run_.heal(run, healAmt);
    audio.sfx('heal');
    toast(`+${got} HP`, 'Отдохнули', 'good');
  } else {
    const n = await quiz({ count: 5, format: 'type', rng: run_.R(run), mode: run.mode, title: 'Тренировка' });
    const bonus = n === 5 ? 2 : n >= 3 ? 1 : 0;
    run.dmgBonus += bonus;
    await modal(`<h3>${n}/5</h3><p>${bonus ? `+${bonus} damage for the rest of the run.` : 'No bonus this time. Keep at it!'}</p>`);
  }
  run_.persist(run);
}

export async function reviewMissed(run, title) {
  const p = save.get();
  let words = run.missed.map((id) => byId.get(id)).filter(Boolean).slice(0, 10);
  if (words.length < 5) {
    const pool = progress.currentPool();
    const recent = new Set(words.map((w) => w.id));
    while (words.length < 5) {
      const w = pickWord(pool, p.srs, { rng: run_.R(run), recent, newRate: 0 });
      if (!w || recent.has(w.id)) break;
      recent.add(w.id);
      words.push(w);
    }
  }
  const dir = run.mode === 'en2ru' ? 'en2ru' : run.mode === 'ru2en' ? 'ru2en' : 'mix';
  const res = await flashcards(words, { title, subtitle: 'Words you missed', dir });
  for (const w of words) if (p.srs[w.id]?.b > 1) run.missed = run.missed.filter((x) => x !== w.id);
  return res;
}

// ---------------- Event ----------------
async function eventNode(run, node) {
  const rng = run_.R(run);
  run.seenEvents = run.seenEvents || [];
  let ev = node.event && EVENTS.find((e) => e.id === node.event);
  if (!ev) {
    const pool = EVENTS.filter((e) => !run.seenEvents.includes(e.id) && (e.minLeg ?? 0) <= run.leg);
    ev = rng.pick(pool.length ? pool : EVENTS);
    node.event = ev.id;
    run.seenEvents.push(ev.id);
    run_.persist(run);
  }
  const choice = await new Promise((resolve) => {
    const root = show(`${hud(run)}<div class="panel event">
      <div class="event-art">${badge(ev.icon, 'rare', 96)}</div>
      <h2>${esc(ev.title)} <small>${esc(ev.en)}</small></h2>
      <p class="event-text">${esc(ev.text)}</p>
      <div class="rest-choices">${ev.choices.map((c, i) => {
        const ok = !c.cond || c.cond(run);
        return `<button class="choice" data-i="${i}" ${ok ? '' : 'disabled'}><b>${esc(c.label)}</b></button>`;
      }).join('')}</div></div>`, 'screen-event');
    bindHud(run, () => {});
    $$('.choice', root).forEach((b) => { b.onclick = () => resolve(ev.choices[+b.dataset.i]); });
  });
  const E = {
    run, rng,
    heal: (n) => run_.heal(run, n),
    hurt: (n) => { run.hp = Math.max(1, run.hp - n); },
    gainRub: (n) => run_.gainRub(run, n),
    spendRub: (n) => { if (run.rub < n) return false; run.rub -= n; return true; },
    gainRelic: (x) => run_.gainRelic(run, RELICS[x] ? x : run_.randomRelic(run, x)),
    gainConsumable: (id) => run_.gainConsumable(run, id),
    addMaxHp: (n) => { run.maxHp = Math.max(10, run.maxHp + n); run.hp = Math.min(run.maxHp, Math.max(1, run.hp + Math.max(0, n))); },
    addXp: (n) => progress.addXp(n),
    hasRelic: (id) => run.relics.includes(id),
    quiz: (o) => quiz({ ...o, rng, mode: run.mode, title: ev.title }),
    review: () => reviewMissed(run, ev.title),
  };
  const text = await choice.run(E);
  run_.persist(run);
  await new Promise((resolve) => {
    show(`${hud(run)}<div class="panel event"><div class="event-art">${badge(ev.icon, 'rare', 72)}</div><h2>${esc(ev.title)}</h2><p class="event-text">${esc(text)}</p><button class="btn btn-big btn-continue">Дальше <small>continue</small></button></div>`, 'screen-event');
    bindHud(run, () => {});
    $('.btn-continue').onclick = resolve;
  });
}

// ---------------- Treasure ----------------
async function treasure(run) {
  const rng = run_.R(run);
  const id = run_.randomRelic(run, rng.chance(0.3) ? 'rare' : 'common');
  const rub = run_.gainRub(run, rng.int(15, 25));
  const r = run_.gainRelic(run, id);
  run_.persist(run);
  audio.sfx('relic');
  await new Promise((resolve) => {
    show(`${hud(run)}<div class="panel reward"><h2>Сундук! <small>Treasure</small></h2>
      <div class="loot"><div class="loot-item">${icon('rouble', '#c8102e', 40)}<b>+${rub} ₽</b></div></div>
      ${r ? `<div class="relic-choices">${relicCard(id)}</div>` : ''}
      <button class="btn btn-big btn-continue">Дальше <small>continue</small></button></div>`, 'screen-reward');
    bindHud(run, () => {});
    $('.btn-continue').onclick = resolve;
    $$('.relic-card').forEach((b) => { b.disabled = true; });
  });
}

// ---------------- Leg complete / end ----------------
async function legComplete(run) {
  const L = LEGS[run.leg];
  progress.checkUnlocks({ type: 'reachLeg', leg: run.leg + 1 });
  const p = save.get();
  p.stats.bestLeg = Math.max(p.stats.bestLeg, run.leg + 1);
  if (run.leg + 1 >= LEGS.length) return endRun(run, true);
  const healed = run_.heal(run, run.maxHp * 0.4);
  audio.sfx('victory');
  await new Promise((resolve) => {
    show(`<div class="poster" style="--leg:${L.color}">
      <div class="poster-rays"></div>
      <div class="poster-body"><span class="kicker">Этап ${ROMAN[run.leg]} пройден</span><h1>${esc(L.to)}!</h1><p>${esc(L.toEn)} reached. The city cheers.</p>
      <p><b>+${healed} HP</b> — a night in a real bed.</p>
      <p class="muted">Next: ${esc(LEGS[run.leg + 1].from)} → ${esc(LEGS[run.leg + 1].to)}</p>
      <button class="btn btn-big btn-continue">Вперёд! <small>onward</small></button></div></div>`, 'screen-poster');
    $('.btn-continue').onclick = resolve;
  });
  run.leg++;
  run.pos = { floor: -1, idx: null };
  run_.persist(run);
  showMap(run);
}

export async function endRun(run, win, reason = 'dead', killer = null) {
  audio.stopMusic();
  const p = save.get();
  const stars = run_.starsFor(run, win);
  p.stars += stars;
  p.starsTotal += stars;
  if (win) p.stats.wins++;
  p.stats.playMs += Date.now() - run.stats.start;
  let dailyLine = '';
  if (run.daily) {
    const score = run_.scoreFor(run, win);
    const prev = p.daily.best[run.daily.date] || 0;
    p.daily.best[run.daily.date] = Math.max(prev, score);
    dailyLine = `<p class="daily-score">Daily score: <b>${score}</b>${score > prev ? ' — new best!' : ` (best ${prev})`}</p>`;
  }
  p.run = null;
  progress.check({ type: 'runEnd', win, mode: run.mode, easy: run.easy });
  progress.checkUnlocks({ type: 'runEnd', win });
  save.saveNow();
  audio.sfx(win ? 'victory' : 'defeat');
  const s = run.stats;
  const acc = s.correct + s.wrong ? Math.round((s.correct / (s.correct + s.wrong)) * 100) : 0;
  const L = LEGS[Math.min(run.leg, LEGS.length - 1)];
  show(`<div class="poster ${win ? 'poster-win' : 'poster-lose'}" style="--leg:${win ? '#c8102e' : '#141414'}">
    <div class="poster-rays"></div>
    <div class="poster-body">
      <span class="kicker">${win ? 'Транссибирская магистраль пройдена' : reason === 'abandon' ? 'Поездка прервана' : 'Конец пути'}</span>
      <h1>${win ? 'Владивосток!' : reason === 'abandon' ? 'Стоп-кран' : 'Поражение'}</h1>
      <p>${win ? 'You crossed all of Russia — 9,289 km of words.' : killer ? `Defeated by ${esc(ENEMIES[killer].name)} near ${esc(L.to)}.` : `Stopped on the way to ${esc(L.to)}.`}</p>
      <div class="summary">
        <div><b>${s.floors}</b><small>stations</small></div>
        <div><b>${s.correct}</b><small>correct</small></div>
        <div><b>${acc}%</b><small>accuracy</small></div>
        <div><b>${s.maxStreak}</b><small>best streak</small></div>
        <div><b>${s.bosses}</b><small>bosses</small></div>
        <div><b>+${stars} ★</b><small>stars</small></div>
      </div>
      ${dailyLine}
      ${run.missed.length ? `<details><summary>Words to practise (${run.missed.length})</summary><table class="wordtable">${run.missed.map((id) => byId.get(id)).filter(Boolean).map((w) => `<tr><td lang="ru">${esc(w.ru)}</td><td>${esc(w.gloss)}</td></tr>`).join('')}</table></details>` : ''}
      <button class="btn btn-big btn-continue">В депо <small>back to the depot</small></button></div></div>`, 'screen-poster');
  $('.btn-continue').onclick = () => goTitle();
}
