// Entry point: title screen and out-of-run menus.
import { loadWords, loadSentences, WORDS, BANDS, POS_GROUPS, hintLine, posGroup } from './data.js';
import * as save from './save.js';
import * as progress from './progress.js';
import * as audio from './audio.js';
import * as run_ from './run.js';
import { showMap, resumeRun, setTitleHandler, modeLabel } from './game.js';
import { flashcards } from './minigames.js';
import { CHARACTERS, CHAR_ORDER } from './content/characters.js';
import { UPGRADES, UPGRADE_IDS } from './content/upgrades.js';
import { ACHIEVEMENTS } from './content/achievements.js';
import { RELICS, RELIC_IDS } from './content/relics.js';
import { LEGS } from './content/route.js';
import { pickWord, isMastered, MASTERED_BOX } from './srs.js';
import { Rng } from './rng.js';
import { portrait, star, badge } from './art.js';
import { show, $, $$, esc, modal, toast } from './ui.js';

progress.onNotify((n) => {
  toast(n.title, n.text, n.kind === 'ach' ? 'ach' : n.kind === 'unlock' || n.kind === 'synergy' ? 'relic' : 'good');
  if (n.kind !== 'level') audio.sfx('relic');
});

setTitleHandler(title);

function title() {
  audio.stopMusic();
  const p = save.get();
  const lvl = p.level;
  const next = progress.xpForLevel(lvl + 1);
  const cur = progress.xpForLevel(lvl);
  const mastered = progress.masteredCount(p);
  const today = todayStr();
  const dailyDone = p.daily.best[today] != null;
  show(`<div class="title">
    <div class="title-poster">
      <div class="poster-rays"></div>
      <div class="title-train"><svg viewBox="0 0 120 120">${star(60, 60, 56, '#141414')}${star(60, 60, 46, '#d9a441')}</svg></div>
      <h1 class="logo">ТРАНС<span>СИБ</span></h1>
      <p class="tagline">Russian vocabulary · 9,289 km · 5,600 words</p>
    </div>
    <div class="title-stats">
      <div><b>${lvl}</b><small>уровень</small><div class="xpbar"><i style="width:${((p.xp - cur) / (next - cur)) * 100}%"></i></div></div>
      <div><b>${mastered}</b><small>words mastered</small></div>
      <div><b>${p.stars} ★</b><small>stars</small></div>
    </div>
    <div class="menu">
      ${p.run ? `<button class="btn btn-big btn-red" data-a="continue">Продолжить <small>continue journey · Этап ${p.run.leg + 1}</small></button>` : ''}
      <button class="btn btn-big ${p.run ? '' : 'btn-red'}" data-a="new">Новая поездка <small>new journey</small></button>
      <button class="btn" data-a="daily">Ежедневный вызов <small>daily challenge${dailyDone ? ' ✓' : ''}${p.daily.streak ? ` · streak ${p.daily.streak}` : ''}</small></button>
      <div class="menu-grid">
        <button class="btn" data-a="depot">Депо <small>upgrades</small></button>
        <button class="btn" data-a="study">Учёба <small>study</small></button>
        <button class="btn" data-a="ach">Награды <small>achievements</small></button>
        <button class="btn" data-a="stats">Статистика <small>stats</small></button>
        <button class="btn" data-a="settings">Настройки <small>settings</small></button>
        <button class="btn" data-a="about">Об игре <small>about</small></button>
      </div>
    </div></div>`, 'screen-title');
  $$('.menu [data-a]').forEach((b) => {
    b.onclick = () => {
      audio.unlockAudio();
      audio.sfx('click');
      ({ continue: () => resumeRun(save.get().run), new: newJourney, daily, depot, study, ach: achievements, stats, settings, about })[b.dataset.a]();
    };
  });
}

function applyTheme() {
  const t = save.get().settings.theme || 'auto';
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function newJourney() {
  const p = save.get();
  if (p.run) {
    const ok = await modal('<h3>Start a new journey?</h3><p>Your current run will be abandoned.</p>', [{ label: 'Start new', value: true, cls: 'btn-danger' }, { label: 'Cancel', value: false, cls: 'btn-ghost' }]);
    if (!ok) return;
    p.run = null;
  }
  if (!p.seenTutorial) await tutorial();
  chooseCharacter();
}

async function tutorial() {
  await modal(`<h3>Как играть <small>How to play</small></h3>
    <ol class="tut">
      <li>Ride the Trans-Siberian from <b>Москва</b> to <b>Владивосток</b>. Pick your path station by station.</li>
      <li>In battle, <b>answer before the enemy's red timer fills</b>. Faster answers hit harder; streaks hit harder still.</li>
      <li>Wrong or too slow? The enemy strikes, and you see the right answer. Missed words come back sooner.</li>
      <li>Ordinary foes ask multiple choice. <b>Elites</b> make you type. <b>Bosses</b> change the question type as they weaken.</li>
      <li>Typing is forgiving: ё = е, small typos are OK, and Latin letters work (<i>khorosho</i> → хорошо).</li>
      <li>Collect <b>значки</b> (relics), earn ★ stars, and unlock new characters and words.</li>
    </ol>`, [{ label: 'Поехали! Let\'s go', value: true }]);
  save.get().seenTutorial = true;
  save.save();
}

function chooseCharacter(opts = {}) {
  const p = save.get();
  show(`<div class="panel">
    <h2>Кто едет? <small>Choose your traveller</small></h2>
    <div class="chars">${CHAR_ORDER.map((id) => {
      const c = CHARACTERS[id];
      const unlocked = p.unlocked[id];
      return `<button class="char-card ${unlocked ? '' : 'locked'}" data-id="${id}">
        ${portrait(c.art, { bg: 'square', bgColor: unlocked ? '#c8102e' : '#777' })}
        <b>${esc(c.name)}</b><small>${esc(c.en)}</small>
        <span class="char-stats">♥ ${c.hp} · ⚔ ${c.dmg}</span>
        <span class="char-desc">${unlocked ? esc(c.desc) : '🔒 ' + esc(c.unlock.text)}</span></button>`;
    }).join('')}</div>
    <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-chars');
  $$('.char-card').forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.id;
      const c = CHARACTERS[id];
      if (!p.unlocked[id]) {
        if (c.unlock.type === 'stars') {
          if (p.stars >= c.unlock.cost) {
            const ok = await modal(`<h3>Unlock ${esc(c.name)}?</h3><p>Costs ${c.unlock.cost} ★ (you have ${p.stars}).</p>`, [{ label: 'Unlock', value: true }, { label: 'Cancel', value: false, cls: 'btn-ghost' }]);
            if (ok) { p.stars -= c.unlock.cost; p.unlocked[id] = true; progress.check({ type: 'unlock' }); save.saveNow(); audio.sfx('relic'); chooseCharacter(opts); }
          } else toast('Недостаточно звёзд', `Need ${c.unlock.cost} ★`, 'bad');
        } else toast('Закрыто', c.unlock.text, 'bad');
        return;
      }
      setupRun(id);
    };
  });
  $('.btn-back').onclick = title;
}

function setupRun(char) {
  const p = save.get();
  const s = p.settings;
  let mode = s.mode;
  let easy = s.easy;
  const draw = () => {
    show(`<div class="panel setup">
      <h2>Режим <small>Language mode</small></h2>
      <div class="modes">
        ${['en2ru', 'ru2en', 'mix'].map((m) => `<button class="mode ${mode === m ? 'sel' : ''}" data-m="${m}"><b>${{ en2ru: 'EN → RU', ru2en: 'RU → EN', mix: 'Смешанный' }[m]}</b><span>${{ en2ru: 'See English, answer in Russian', ru2en: 'See Russian, answer in English', mix: 'Random each question · +25% ★' }[m]}</span></button>`).join('')}
      </div>
      <label class="toggle"><input type="checkbox" class="easy" ${easy ? 'checked' : ''}> <span><b>Лёгкий режим</b> — no timer: enemies only hit when you're wrong. Half ★.</span></label>
      <p class="muted small">Words: ${esc(BANDS.slice(0, progress.bandsUnlocked()).map((b) => b.en).join(', '))} (${progress.currentPool().length} words)</p>
      <button class="btn btn-big btn-red btn-go">Отправление! <small>depart</small></button>
      <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-setup');
    $$('.mode').forEach((b) => { b.onclick = () => { mode = b.dataset.m; audio.sfx('click'); draw(); }; });
    $('.easy').onchange = (e) => { easy = e.target.checked; };
    $('.btn-back').onclick = () => chooseCharacter();
    $('.btn-go').onclick = () => {
      s.mode = mode;
      s.easy = easy;
      const run = run_.newRun({ char, mode, easy });
      audio.sfx('whistle');
      showMap(run);
    };
  };
  draw();
}

async function daily() {
  const p = save.get();
  const date = todayStr();
  const rng = new Rng(`daily:${date}`);
  const char = rng.pick(CHAR_ORDER);
  const relic = rng.pick(RELIC_IDS);
  const best = p.daily.best[date];
  const ok = await modal(`<h3>Ежедневный вызов · ${date}</h3>
    <p>Same route, enemies and starting kit for everyone today. No meta upgrades. Mixed mode.</p>
    <div class="daily-kit">${portrait(CHARACTERS[char].art, { bg: 'square', bgColor: '#c8102e' })}<div><b>${esc(CHARACTERS[char].name)}</b><br>${badge(RELICS[relic].icon, RELICS[relic].rarity, 36)} ${esc(RELICS[relic].name)}</div></div>
    <p>Streak: <b>${p.daily.streak || 0}</b> day(s)${best != null ? ` · today's best: <b>${best}</b>` : ''}</p>
    ${p.run ? '<p class="warn">Starting abandons your current run.</p>' : ''}`, [{ label: 'Start', value: true, cls: 'btn-red' }, { label: 'Cancel', value: false, cls: 'btn-ghost' }]);
  if (!ok) return;
  // Streak: consecutive days
  if (p.daily.last !== date) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    p.daily.streak = p.daily.last === todayStr(y) ? (p.daily.streak || 0) + 1 : 1;
    p.daily.last = date;
    progress.check({ type: 'daily' });
  }
  const run = run_.newRun({ char, mode: 'mix', easy: false, daily: { date, relic }, seed: `daily:${date}` });
  showMap(run);
}

function depot() {
  const p = save.get();
  show(`<div class="panel depot">
    <h2>Депо <small>Permanent upgrades</small></h2>
    <p class="stars-have">${p.stars} ★ <small>available</small></p>
    <div class="upgrades">${UPGRADE_IDS.map((id) => {
      const u = UPGRADES[id];
      const n = p.upgrades[id] || 0;
      const maxed = n >= u.costs.length;
      const cost = u.costs[n];
      return `<div class="upgrade"><div><b>${esc(u.name)}</b> <small>${esc(u.en)}</small><p>${esc(u.desc)}</p>
        <div class="pips">${u.costs.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div></div>
        <button class="btn" data-id="${id}" ${maxed || p.stars < cost ? 'disabled' : ''}>${maxed ? 'MAX' : `${cost} ★`}</button></div>`;
    }).join('')}</div>
    <p class="muted small">Upgrades don't apply to the daily challenge.</p>
    <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-depot');
  $$('.upgrade .btn').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.id;
      const n = p.upgrades[id] || 0;
      const cost = UPGRADES[id].costs[n];
      if (p.stars < cost) return;
      p.stars -= cost;
      p.upgrades[id] = n + 1;
      save.saveNow();
      audio.sfx('relic');
      depot();
    };
  });
  $('.btn-back').onclick = title;
}

function study() {
  const p = save.get();
  const pool = progress.currentPool();
  let filter = 'all';
  let q = '';
  const draw = () => {
    const words = WORDS.filter((w) => {
      if (q && !(w.bare.includes(q.toLowerCase()) || w.gloss.toLowerCase().includes(q.toLowerCase()))) return false;
      const r = p.srs[w.id];
      if (filter === 'unlocked') return pool.includes(w);
      if (filter === 'learning') return r && !isMastered(r);
      if (filter === 'mastered') return isMastered(r);
      if (filter === 'due') return r && r.due <= Date.now();
      return true;
    });
    const due = WORDS.filter((w) => p.srs[w.id] && p.srs[w.id].due <= Date.now()).length;
    show(`<div class="panel study">
      <h2>Учёба <small>Study</small></h2>
      <div class="study-actions">
        <button class="btn btn-red btn-review">Повторить <small>review ${Math.min(20, due || 20)} cards${due ? ` · ${due} due` : ''}</small></button>
      </div>
      <div class="study-filters">
        <input class="search" placeholder="Поиск / search" value="${esc(q)}">
        <select class="filter">${['all', 'unlocked', 'due', 'learning', 'mastered'].map((f) => `<option ${f === filter ? 'selected' : ''}>${f}</option>`).join('')}</select>
      </div>
      <p class="muted small">${words.length} words · tap to hear · box 0–7 (≥${MASTERED_BOX} = mastered)</p>
      <table class="wordtable study-table"><thead><tr><th>#</th><th>Русский</th><th>English</th><th></th></tr></thead><tbody>
      ${words.slice(0, 400).map((w) => {
        const r = p.srs[w.id];
        return `<tr data-id="${w.id}" class="${pool.includes(w) ? '' : 'locked'}"><td class="muted">${w.id}</td><td lang="ru">${esc(w.ru)}</td><td>${esc(w.gloss)}<br><small class="muted">${esc(hintLine(w))}</small></td><td>${r ? `<span class="box b${r.b}">${r.b}</span>` : ''}</td></tr>`;
      }).join('')}</tbody></table>
      ${words.length > 400 ? '<p class="muted small">Showing first 400 — use search.</p>' : ''}
      <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-study');
    $('.search').oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const s = $('.search'); s.focus(); s.setSelectionRange(pos, pos); };
    $('.filter').onchange = (e) => { filter = e.target.value; draw(); };
    $$('.study-table tbody tr').forEach((tr) => { tr.onclick = () => audio.speak(WORDS.find((w) => w.id === +tr.dataset.id).bare, { force: true }); });
    $('.btn-back').onclick = title;
    $('.btn-review').onclick = async () => {
      const rng = new Rng(Date.now());
      const picked = [];
      const recent = new Set();
      for (let i = 0; i < 20; i++) {
        const w = pickWord(pool, p.srs, { rng, recent });
        if (!w) break;
        recent.add(w.id);
        picked.push(w);
      }
      const res = await flashcards(picked, { title: 'Повторение', subtitle: 'Study session', dir: p.settings.mode });
      progress.addXp(res.known * 2);
      await modal(`<h3>${res.known} / ${res.total}</h3><p>+${res.known * 2} XP</p>`);
      draw();
    };
  };
  draw();
}

function achievements() {
  const p = save.get();
  const got = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  show(`<div class="panel">
    <h2>Награды <small>Achievements · ${got}/${ACHIEVEMENTS.length}</small></h2>
    <div class="achs">${ACHIEVEMENTS.map((a) => `<div class="ach ${p.achievements[a.id] ? 'got' : ''}">${badge('medal', p.achievements[a.id] ? 'legendary' : 'common', 44)}<div><b>${esc(a.name)}</b> <small>${esc(a.en)}</small><p>${esc(a.desc)}</p></div></div>`).join('')}</div>
    <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-ach');
  $('.btn-back').onclick = title;
}

function stats() {
  const p = save.get();
  const s = p.stats;
  const seen = Object.keys(p.srs).length;
  const mastered = progress.masteredCount(p);
  const acc = s.correct + s.wrong ? Math.round((s.correct / (s.correct + s.wrong)) * 100) : 0;
  const byBand = BANDS.map((b, i) => {
    const ws = WORDS.filter((w) => w.band === i);
    const m = ws.filter((w) => isMastered(p.srs[w.id])).length;
    const sn = ws.filter((w) => p.srs[w.id]).length;
    return { name: b.en, total: ws.length, m, sn };
  });
  show(`<div class="panel">
    <h2>Статистика <small>Stats</small></h2>
    <div class="summary">
      <div><b>${p.level}</b><small>level</small></div><div><b>${seen}</b><small>words seen</small></div><div><b>${mastered}</b><small>mastered</small></div>
      <div><b>${acc}%</b><small>accuracy</small></div><div><b>${s.runs}</b><small>journeys</small></div><div><b>${s.wins}</b><small>to Vladivostok</small></div>
      <div><b>${s.typed || 0}</b><small>typed</small></div><div><b>${Math.round(s.playMs / 60000)}</b><small>minutes</small></div><div><b>${s.bestLeg ? esc(LEGS[s.bestLeg - 1].to) : '—'}</b><small>furthest</small></div>
    </div>
    <h3>Progress by band</h3>
    <div class="bands">${byBand.map((b, i) => `<div class="band ${i < progress.bandsUnlocked() ? '' : 'locked'}"><span>${esc(b.name)}${i < progress.bandsUnlocked() ? '' : ` 🔒 level ${progress.BAND_LEVELS[i]}`}</span>
      <div class="stack"><i class="m" style="width:${(b.m / b.total) * 100}%"></i><i class="s" style="width:${((b.sn - b.m) / b.total) * 100}%"></i></div><small>${b.m} mastered · ${b.sn} seen · ${b.total}</small></div>`).join('')}</div>
    <h3>Recent journeys</h3>
    ${(p.history || []).length ? `<table class="wordtable history"><tr><th>When</th><th>Who</th><th>Reached</th><th>Acc.</th><th>★</th></tr>${p.history.map((h) => `<tr>
      <td>${new Date(h.date).toLocaleDateString()}</td><td>${esc(CHARACTERS[h.char]?.name || h.char)}${h.daily ? ' · daily' : ''}</td>
      <td>${h.win ? '🏁 Владивосток' : esc(LEGS[Math.min(h.leg, LEGS.length - 1)].to)}</td>
      <td>${h.correct + h.wrong ? Math.round((100 * h.correct) / (h.correct + h.wrong)) : 0}%</td><td>${h.stars}</td></tr>`).join('')}</table>` : '<p class="muted">No finished journeys yet.</p>'}
    <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-stats');
  $('.btn-back').onclick = title;
}

function settings() {
  const p = save.get();
  const s = p.settings;
  const pos = s.posFilter || Object.keys(POS_GROUPS);
  show(`<div class="panel settings">
    <h2>Настройки <small>Settings</small></h2>
    <label class="row">Sound effects <input type="range" min="0" max="1" step="0.1" value="${s.sfx}" data-k="sfx"></label>
    <label class="row">Music (Коробейники) <input type="range" min="0" max="1" step="0.1" value="${s.music}" data-k="music"></label>
    <label class="toggle"><input type="checkbox" data-k="tts" ${s.tts ? 'checked' : ''}> <span>Russian pronunciation (text-to-speech)${audio.hasRussianVoice() ? '' : ' — <i>no Russian voice found on this device</i>'}</span></label>
    <label class="toggle"><input type="checkbox" data-k="autoSpeak" ${s.autoSpeak ? 'checked' : ''}> <span>Speak words automatically</span></label>
    <label class="toggle"><input type="checkbox" data-k="stress" ${s.stress ? 'checked' : ''}> <span>Show stress marks (сло́во)</span></label>
    <label class="row">On-screen ЙЦУКЕН keyboard <select data-k="keyboard">${['auto', 'always', 'never'].map((k) => `<option ${s.keyboard === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label class="row">Theme <select data-k="theme">${['auto', 'light', 'dark'].map((k) => `<option ${(s.theme || 'auto') === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label class="toggle"><input type="checkbox" data-k="reduceMotion" ${s.reduceMotion ? 'checked' : ''}> <span>Reduce motion</span></label>
    <h3>Words</h3>
    <label class="toggle"><input type="checkbox" data-k="allBands" ${s.allBands ? 'checked' : ''}> <span>Unlock all word bands now (I already know some Russian)</span></label>
    <div class="pos-filter">Parts of speech: ${Object.keys(POS_GROUPS).map((g) => `<label><input type="checkbox" data-pos="${g}" ${pos.includes(g) ? 'checked' : ''}> ${g}</label>`).join('')}</div>
    <h3>Save</h3>
    <div class="row-btns"><button class="btn btn-export">Export</button><button class="btn btn-import">Import</button><button class="btn btn-danger btn-reset">Reset progress</button></div>
    <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-settings');
  $$('[data-k]').forEach((inp) => {
    inp.onchange = inp.oninput = () => {
      const k = inp.dataset.k;
      s[k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'range' ? +inp.value : inp.value;
      if (k === 'sfx' || k === 'music') { audio.unlockAudio(); audio.refreshMusic(); }
      if (k === 'theme') applyTheme();
      save.save();
    };
  });
  $$('[data-pos]').forEach((inp) => {
    inp.onchange = () => {
      const on = $$('[data-pos]').filter((x) => x.checked).map((x) => x.dataset.pos);
      if (!on.length) { inp.checked = true; return; }
      s.posFilter = on.length === Object.keys(POS_GROUPS).length ? null : on;
      save.save();
    };
  });
  $('.btn-export').onclick = async () => {
    const data = save.exportSave();
    try { await navigator.clipboard.writeText(data); toast('Copied', 'Save copied to clipboard'); } catch {
      await modal(`<h3>Your save</h3><textarea class="savebox" readonly>${esc(data)}</textarea>`);
    }
  };
  $('.btn-import').onclick = () => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal"><h3>Import save</h3><textarea class="savebox" placeholder="Paste save here"></textarea><div class="modal-btns"><button class="btn ok">Import</button><button class="btn btn-ghost no">Cancel</button></div></div>';
    document.body.appendChild(wrap);
    $('.no', wrap).onclick = () => wrap.remove();
    $('.ok', wrap).onclick = () => {
      try { save.importSave($('textarea', wrap).value); toast('Imported'); wrap.remove(); title(); } catch (e) { toast('Import failed', e.message, 'bad'); }
    };
  };
  $('.btn-reset').onclick = async () => {
    const ok = await modal('<h3>Reset ALL progress?</h3><p>Words, levels, stars, unlocks. This cannot be undone.</p>', [{ label: 'Reset', value: true, cls: 'btn-danger' }, { label: 'Cancel', value: false, cls: 'btn-ghost' }]);
    if (ok) { save.reset(); title(); }
  };
  $('.btn-back').onclick = title;
}

function about() {
  show(`<div class="panel about">
    <h2>Об игре <small>About</small></h2>
    <p><b>Транссиб</b> is a roguelike for learning the ~5,600 most frequent Russian words.</p>
    <h3>Word data</h3>
    <ul>
      <li>Frequency: О. Н. Ляшевская, С. А. Шаров, <i>Частотный словарь современного русского языка</i> (на материалах Национального корпуса русского языка), 2009. Lemmatised, so every word is in its dictionary form.</li>
      <li>Stress, translations, grammar: <a href="https://en.openrussian.org" target="_blank" rel="noopener">OpenRussian.org</a>, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Word list in this game is shared under the same licence.</li>
      <li>Example sentences: <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a>, licensed CC BY 2.0 FR.</li>
      <li>Music: «Коробейники», Russian folk song (public domain), synthesised live.</li>
    </ul>
    <h3>Tips</h3>
    <ul>
      <li>Press <kbd>1</kbd>–<kbd>4</kbd> for multiple choice, <kbd>Enter</kbd> to submit typing.</li>
      <li>Latin transliteration is accepted when typing Russian.</li>
      <li>Your progress lives in this browser. Export it from Settings to move devices.</li>
    </ul>
    <button class="btn btn-ghost btn-back">← Назад</button></div>`, 'screen-about');
  $('.btn-back').onclick = title;
}

async function boot() {
  save.load();
  try {
    await loadWords();
  } catch (e) {
    show(`<div class="panel"><h2>Ошибка</h2><p>Could not load the word list. If you opened index.html directly from disk, serve the folder over HTTP instead (e.g. <code>python3 -m http.server</code>).</p></div>`);
    return;
  }
  loadSentences().catch(() => { /* examples are optional */ });
  document.addEventListener('pointerdown', () => audio.unlockAudio(), { once: true });
  applyTheme();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  title();
}

// Debug hook for automated tests
window.__transsib = { save, progress, run_, WORDS: () => WORDS };

boot();
