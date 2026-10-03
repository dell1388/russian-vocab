// Real-time combat: each question is an exchange against the enemy's attack timer.
import { ENEMIES, TRAIT_INFO } from './content/enemies.js';
import { CHARACTERS } from './content/characters.js';
import { RELICS } from './content/relics.js';
import { CONSUMABLES } from './content/consumables.js';
import { makeQuestion, makeMatch, makeGender, makeAspect, resolveDir, ruLabel } from './questions.js';
import { pickWord } from './srs.js';
import { glossKeys, exampleFor } from './data.js';
import * as run_ from './run.js';
import * as save from './save.js';
import * as progress from './progress.js';
import * as audio from './audio.js';
import { portrait, badge } from './art.js';
import { keyboard } from './kbd.js';
import { show, $, $$, esc, floatText, shake, sleep, isTouch, onLeave, toast } from './ui.js';

const BASE_MS = { mc: 7000, type_ru: 16000, type_en: 12000, match: 28000 };
const MATCH_PAIRS = 5;
// Enemy HP multipliers per tier (tuned so a normal fight is ~4–5 answers, a boss ~12+)
const HP_TIER = { normal: 1.6, elite: 1.45, boss: 1.15 };
const SPEAKER = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M16 8q3 4 0 8M19 5q5 7 0 14" stroke="currentColor" stroke-width="2" fill="none"/></svg>';

export function scaledEnemy(id, leg, easy) {
  const d = ENEMIES[id];
  const hpMult = (1 + 0.22 * leg) * HP_TIER[d.tier];
  const dmgMult = (1 + 0.15 * leg) * (easy ? 0.75 : 1);
  return {
    id, def: d, name: d.name, en: d.en, tier: d.tier,
    maxHp: Math.round(d.hp * hpMult), hp: Math.round(d.hp * hpMult),
    dmg: Math.max(1, Math.round(d.dmg * dmgMult)),
    traits: new Set(d.traits || []),
    phases: d.phases || null, phase: 0, armoredLeft: 2, revived: false,
  };
}

export class Combat {
  constructor(run, enemyId) {
    this.run = run;
    this.rng = run_.R(run);
    this.enemy = scaledEnemy(enemyId, run.leg, run.easy);
    this.stats = run_.fightStats(run);
    this.providers = run_.hookProviders(run);
    this.fs = {};
    this.streak = this.stats.startStreak;
    this.fightCorrect = 0;
    this.fastCount = 0;
    this.tookDamage = false;
    this.exchanges = 0;
    this.enrage = 1;
    this.recent = [];
    this.flipDir = run.mode === 'ru2en' ? 'ru2en' : 'en2ru';
    // "Flip" alternates question direction, which only makes sense in Mixed mode.
    // In a single-language mode those enemies get a shorter timer instead.
    if (run.mode !== 'mix' && this.enemy.traits.delete('flip')) this.enemy.traits.add('fast');
    this.state = 'idle';
    this.pool = progress.currentPool();
    this.queued = null;
  }

  // ---------- hook plumbing ----------
  fire(name, ...args) {
    for (const p of this.providers) {
      const fn = p.hooks[name];
      if (fn) fn.call(p.hooks, this, ...args);
    }
  }
  // Context API used by relics/characters/consumables
  heal(n) {
    const got = run_.heal(this.run, n);
    if (got > 0) { floatText($('.player-art'), `+${got}`, 'heal'); audio.sfx('heal'); }
    this.renderPlayer();
  }
  gainRub(n) {
    const got = run_.gainRub(this.run, n);
    floatText($('.player-art'), `+${got} ₽`, 'rub');
    audio.sfx('coin');
    this.renderPlayer();
  }
  flash(text) { floatText($('.qcard'), text, 'flash'); }
  removeRelic(id) { run_.removeRelic(this.run, id); this.providers = run_.hookProviders(this.run); this.renderPlayer(); }
  damageEnemy(n, label) {
    this.enemy.hp = Math.max(0, this.enemy.hp - Math.round(n));
    floatText($('.enemy-art'), `${label ? label + ' ' : ''}−${Math.round(n)}`, 'dmg');
    shake($('.enemy-art'));
    audio.sfx('hit');
    this.renderEnemy();
    if (this.enemy.hp <= 0) this.checkEnemyDeath();
  }
  autoAnswer() {
    if (this.state !== 'asking') return;
    if (this.q.format === 'match') {
      const left = this.match.left.find((x) => !x.done);
      if (left) this.matchPair(left.id, left.id, true);
      return;
    }
    this.resolveAnswer(true, { forcedCrit: true });
  }

  // ---------- lifecycle ----------
  start() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      window.__combat = this;
      this.render();
      this.fire('fightStart');
      if (this.enemy.tier === 'boss') { audio.sfx('boss'); audio.setTempo(1.15); }
      this.openingFreeze = this.stats.openingFreezeMs;
      this.raf = requestAnimationFrame(this.tick);
      onLeave(() => cancelAnimationFrame(this.raf));
      this.keyHandler = (e) => this.onKey(e);
      window.addEventListener('keydown', this.keyHandler);
      onLeave(() => window.removeEventListener('keydown', this.keyHandler));
      // Pause the clock while the tab is hidden
      this.visHandler = () => {
        if (document.hidden) this.hiddenAt = performance.now();
        else if (this.hiddenAt) { this.qStart += performance.now() - this.hiddenAt; this.hiddenAt = 0; }
      };
      document.addEventListener('visibilitychange', this.visHandler);
      onLeave(() => document.removeEventListener('visibilitychange', this.visHandler));
      setTimeout(() => this.nextQuestion(), 500);
    });
  }

  finish(won) {
    if (this.state === 'done') return;
    this.state = 'done';
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyHandler);
    document.removeEventListener('visibilitychange', this.visHandler);
    audio.setTempo(1);
    if (won) this.fire('fightWon');
    this.renderPlayer();
    setTimeout(() => this.resolve({ won, flawless: !this.tookDamage, enemy: this.enemy }), won ? 700 : 900);
  }

  // ---------- question flow ----------
  currentFormat() {
    const e = this.enemy;
    if (e.phases) return e.phases[e.phase].format;
    return e.def.format;
  }

  nextDir() {
    if (this.run.mode === 'mix' && this.enemy.traits.has('flip')) {
      this.flipDir = this.flipDir === 'en2ru' ? 'ru2en' : 'en2ru';
      return this.flipDir;
    }
    return resolveDir(this.run.mode, this.rng);
  }

  pick(requireSeen = false, exclude = []) {
    const p = save.get();
    const recent = new Set([...this.recent, ...exclude]);
    return pickWord(this.pool, p.srs, { rng: this.rng, recent, requireSeen });
  }

  nextQuestion() {
    if (this.state === 'done') return;
    this.exchanges++;
    const e = this.enemy;
    if (e.traits.has('enrage')) this.enrage = Math.max(0.5, this.enrage * 0.95);
    if (e.traits.has('regen') && this.exchanges > 1 && e.hp < e.maxHp) {
      const h = Math.max(1, Math.round(e.maxHp * 0.04));
      e.hp = Math.min(e.maxHp, e.hp + h);
      floatText($('.enemy-art'), `+${h}`, 'heal');
      this.renderEnemy();
    }
    let format = this.currentFormat();
    const dir = this.nextDir();
    if (format === 'match') return this.startMatch();

    if (format === 'gender') {
      const nouns = this.pool.filter((x) => x.pos === 'noun' && ['m', 'f', 'n'].includes(x.g));
      const w = pickWord(nouns, save.get().srs, { rng: this.rng, recent: new Set(this.recent) });
      if (w) {
        this.q = makeGender(w);
        this.pushRecent(w.id);
        this.q.timeMs = 6500 * this.stats.timerMult * this.enrage * (1 - 0.06 * this.run.leg);
        this.renderQuestion();
        this.beginTimer();
        return;
      }
      format = 'mc';
    }
    if (format === 'aspect') {
      const verbs = this.pool.filter((x) => x.pos === 'verb' && x.partner && x.asp);
      const w = verbs.length >= 4 && pickWord(verbs, save.get().srs, { rng: this.rng, recent: new Set(this.recent) });
      if (w) {
        this.q = makeAspect(w, this.rng, this.pool.filter((x) => x.pos === 'verb'));
        this.pushRecent(w.id);
        this.q.timeMs = 8000 * this.stats.timerMult * this.enrage * (1 - 0.06 * this.run.leg);
        this.renderQuestion();
        this.beginTimer();
        return;
      }
      format = 'mc';
    }
    let w = null;
    if (format === 'type') {
      w = this.pick(true);
      if (!w) format = 'mc';
    }
    if (!w) w = this.queued && !this.recent.includes(this.queued.id) ? this.queued : this.pick();
    this.queued = null;
    this.q = makeQuestion(w, format, dir, this.rng, { options: this.stats.mcOptions, pool: this.pool });
    this.pushRecent(w.id);
    if (this.stats.preview) this.queued = this.pick(false, [w.id]);

    let base = format === 'mc' ? BASE_MS.mc : dir === 'en2ru' ? BASE_MS.type_ru : BASE_MS.type_en;
    let mult = this.stats.timerMult * this.enrage * (1 - 0.06 * this.run.leg);
    if (format === 'type') mult *= this.stats.typeTimerMult;
    if (e.traits.has('fast')) mult *= 0.75;
    if (e.traits.has('slow')) mult *= 1.25;
    // Brand-new words get a "new" tag and extra time
    this.q.isNew = !save.get().srs[w.id];
    if (this.q.isNew) mult *= 1.4;
    this.q.timeMs = base * mult;
    this.renderQuestion();
    this.beginTimer();
  }

  pushRecent(id) {
    this.recent.push(id);
    if (this.recent.length > 8) this.recent.shift();
  }

  beginTimer() {
    const now = performance.now();
    const grace = this.stats.graceMs + (this.openingFreeze || 0);
    this.openingFreeze = 0;
    this.qStart = now + grace;
    this.lastTick = 0;
    this.state = 'asking';
    $('.timer')?.classList.toggle('frozen', grace > 0);
  }

  remainingFrac(now = performance.now()) {
    if (this.run.easy) return 0.5;
    const el_ = Math.max(0, now - this.qStart);
    return Math.max(0, 1 - el_ / this.q.timeMs);
  }

  tick = (now) => {
    this.raf = requestAnimationFrame(this.tick);
    if (this.state !== 'asking' || this.run.easy) return;
    const frac = this.remainingFrac(now);
    const t = $('.timer i');
    if (t) t.style.width = `${(1 - frac) * 100}%`;
    const tm = $('.timer');
    if (tm) {
      tm.classList.toggle('frozen', now < this.qStart);
      tm.classList.toggle('danger', frac < 0.25);
    }
    if (frac < 0.25 && now - this.lastTick > 450) { this.lastTick = now; audio.sfx('tick'); }
    if (frac <= 0) this.timeout();
  };

  timeout() {
    if (this.state !== 'asking') return;
    if (this.q.format === 'match') {
      this.state = 'feedback';
      this.flash('Время!');
      this.enemyAttack().then(() => { if (this.state !== 'done') this.nextQuestion(); });
      return;
    }
    this.resolveAnswer(false, { timeout: true });
  }

  // ---------- answering ----------
  async resolveAnswer(correct, info = {}) {
    if (this.state !== 'asking') return;
    this.state = 'feedback';
    const q = this.q;
    const now = performance.now();
    const frac = this.remainingFrac(now);
    const ms = Math.max(0, now - this.qStart);
    const typed = q.format === 'type';
    // Gender drills test grammar, not meaning: keep them out of the vocab SRS
    if (q.format !== 'gender' && q.format !== 'aspect') progress.gradeWord(q.word.id, correct, typed);
    this.markOptions(info.chosen);

    if (correct) {
      this.run.stats.correct++;
      if (typed) this.run.stats.typed++;
      progress.addXp((typed ? 8 : 4) * (this.run.mode === 'mix' ? 1.25 : 1));
      if (ms < 1500) this.fastCount++;
      this.feedback(true, info);
      audio.sfx('correct');
      this.speakWord(q.word);
      await this.playerHit({ format: q.format, ms, frac, forcedCrit: info.forcedCrit });
      progress.check({ type: 'answer', streak: this.streak, fastInFight: this.fastCount });
      await sleep(info.result && !info.result.exact ? 1100 : 450);
    } else {
      this.run.stats.wrong++;
      if (q.format !== 'gender' && q.format !== 'aspect') run_.addMissed(this.run, q.word.id);
      this.streak = 0;
      this.fire('onWrong');
      this.feedback(false, info);
      audio.sfx('wrong');
      this.speakWord(q.word);
      await this.enemyAttack();
      await sleep(1500);
    }
    if (this.state !== 'done') this.nextQuestion();
  }

  speakWord(w) {
    if (save.get().settings.autoSpeak) audio.speak(w.bare);
  }

  async playerHit({ format, ms, frac, forcedCrit = false }) {
    const s = this.stats;
    const e = this.enemy;
    const hit = { dmg: s.dmg, mult: s.dmgMult, crit: forcedCrit || this.rng.chance(s.critChance), format, ms, frac };
    hit.mult *= 1 + 0.6 * frac; // speed bonus
    hit.mult *= 1 + Math.min(0.5, 0.05 * this.streak * s.streakRate); // streak bonus
    if (format === 'type') hit.mult *= 1.6;
    if (format === 'match') hit.mult *= 0.75;
    this.fire('beforeHit', hit);
    if (hit.crit) hit.mult *= s.critMult;
    if (e.traits.has('armored') && e.armoredLeft > 0) { e.armoredLeft--; hit.mult *= 0.5; }
    const dmg = Math.max(1, Math.round(hit.dmg * hit.mult));
    this.streak++;
    this.fightCorrect++;
    this.run.stats.maxStreak = Math.max(this.run.stats.maxStreak, this.streak);
    e.hp = Math.max(0, e.hp - dmg);
    const art = $('.enemy-art');
    floatText(art, `${hit.crit ? 'КРИТ! ' : ''}−${dmg}`, hit.crit ? 'crit' : 'dmg');
    shake(art);
    $('.player-art')?.classList.add('lunge');
    setTimeout(() => $('.player-art')?.classList.remove('lunge'), 300);
    audio.sfx(hit.crit ? 'crit' : 'hit');
    this.renderEnemy();
    this.renderPlayer();
    this.fire('afterHit', hit);
    if (e.hp <= 0) this.checkEnemyDeath();
    else this.checkPhase();
  }

  checkPhase() {
    const e = this.enemy;
    if (!e.phases) return;
    const frac = e.hp / e.maxHp;
    let idx = 0;
    e.phases.forEach((p, i) => { if (frac <= p.at) idx = i; });
    if (idx > e.phase) {
      e.phase = idx;
      e.armoredLeft = 2;
      const f = e.phases[idx].format;
      const label = { mc: 'Выбор', type: 'Письмо', match: 'Пары' }[f];
      toast(`Фаза ${idx + 1}: ${label}`, { mc: 'Multiple choice', type: 'Typing', match: 'Match the pairs' }[f], 'boss');
      audio.sfx('boss');
      $('.enemy-panel')?.classList.add('phase-change');
      setTimeout(() => $('.enemy-panel')?.classList.remove('phase-change'), 800);
      this.renderEnemy();
    }
  }

  checkEnemyDeath() {
    const e = this.enemy;
    if (e.hp > 0 || this.state === 'done') return;
    if (e.traits.has('undying') && !e.revived) {
      e.revived = true;
      e.hp = Math.round(e.maxHp * 0.35);
      // Final stand: only typed answers can reach the needle in the egg
      e.phases = [{ at: 1, format: 'type' }];
      e.phase = 0;
      toast('Кощей бессмертен!', 'He rises again! Only typed answers can find the needle.', 'boss');
      audio.sfx('boss');
      this.renderEnemy();
      return;
    }
    $('.enemy-art')?.classList.add('defeated');
    audio.sfx('victory');
    this.finish(true);
  }

  async enemyAttack() {
    const e = this.enemy;
    const hits = e.traits.has('double') ? 2 : 1;
    $('.enemy-art')?.classList.add('lunge');
    setTimeout(() => $('.enemy-art')?.classList.remove('lunge'), 300);
    for (let i = 0; i < hits && this.state !== 'done'; i++) {
      if (i > 0) await sleep(280);
      this.hurtPlayer(e.dmg);
    }
    if (e.traits.has('fine') && this.run.rub > 0) {
      const fine = Math.min(this.run.rub, 5 + 2 * this.run.leg);
      this.run.rub -= fine;
      floatText($('.player-art'), `Штраф −${fine} ₽`, 'dmg');
    }
    if (e.traits.has('steal') && this.run.consumables.length) {
      const i = this.rng.int(0, this.run.consumables.length - 1);
      const [lost] = this.run.consumables.splice(i, 1);
      floatText($('.player-art'), `−${CONSUMABLES[lost].name}`, 'dmg');
    }
    this.renderPlayer();
  }

  hurtPlayer(raw) {
    if (this.state === 'done') return;
    const h = { dmg: raw, blocked: false };
    if (this.rng.chance(this.stats.dodge)) {
      floatText($('.player-art'), 'Уклон!', 'heal');
      audio.sfx('block');
      return;
    }
    if (this.fs._mirror) {
      this.fs._mirror = false;
      this.damageEnemy(raw * 2, 'Зеркало!');
      return;
    }
    this.fire('beforeHurt', h);
    if (h.blocked) { audio.sfx('block'); return; }
    const dmg = Math.max(1, Math.round(h.dmg * this.stats.dmgTakenMult));
    this.run.hp = Math.max(0, this.run.hp - dmg);
    this.tookDamage = true;
    floatText($('.player-art'), `−${dmg}`, 'hurt');
    shake($('.combat'), 'shake-hard');
    audio.sfx('hurt');
    this.renderPlayer();
    this.fire('afterHurt');
    if (this.run.hp <= 0) {
      for (const p of this.providers) {
        if (p.hooks.lethal && p.hooks.lethal.call(p.hooks, this)) { this.renderPlayer(); return; }
      }
      this.finish(false);
    }
  }

  feedback(ok, info) {
    const q = this.q;
    const fb = $('.q-feedback');
    if (!fb) return;
    const w = q.word;
    const ruL = ruLabel(w);
    let html;
    if (ok) {
      const r = info.result;
      html = `<div class="fb fb-ok"><b>Правильно!</b>`;
      if (r && r.alt) html += ` <span>Also: <span lang="ru">${esc(ruL)}</span></span>`;
      else if (r && !r.exact && q.format === 'type') html += ` <span>Spelling: <b lang="${q.answerLang}">${esc(q.answerLang === 'ru' ? ruL : w.gloss)}</b></span>`;
      html += `</div>`;
    } else if (q.format === 'aspect') {
      html = `<div class="fb fb-bad"><b>${info.timeout ? 'Время вышло!' : 'Неправильно!'}</b> <span class="fb-ans"><span lang="ru">${esc(ruL)}</span> ↔ <span lang="ru">${esc(q.answerLabel)}</span></span></div>`;
    } else if (q.format === 'gender') {
      html = `<div class="fb fb-bad"><b>${info.timeout ? 'Время вышло!' : 'Неправильно!'}</b> <span class="fb-ans"><span lang="ru">${esc(ruL)}</span> — ${esc(q.answerLabel)} род</span></div>`;
    } else {
      html = `<div class="fb fb-bad"><b>${info.timeout ? 'Время вышло!' : 'Неправильно!'}</b> <span class="fb-ans"><span lang="ru">${esc(ruL)}</span> = ${esc(w.gloss)}</span></div>`;
    }
    fb.innerHTML = html;
    $('.qcard')?.classList.add(ok ? 'ok' : 'bad');
    if (this.enemy.tier === 'boss') this.bossSays(w);
  }

  /** Bosses taunt with a real example sentence using the word just asked. */
  bossSays(w) {
    const ex = exampleFor(w, this.rng);
    const line = $('.enemy-line');
    if (!ex || !line) return;
    const i = ex.ru.indexOf(ex.form);
    const ru = i >= 0 ? `${esc(ex.ru.slice(0, i))}<b>${esc(ex.form)}</b>${esc(ex.ru.slice(i + ex.form.length))}` : esc(ex.ru);
    line.innerHTML = `«<span lang="ru">${ru}</span>» <small>${esc(ex.en)}</small>`;
    line.classList.remove('says');
    void line.offsetWidth;
    line.classList.add('says');
  }

  markOptions(chosen) {
    if (!['mc', 'gender', 'aspect'].includes(this.q.format)) return;
    $$('.opt').forEach((b, i) => {
      const o = this.q.options[i];
      b.disabled = true;
      if (o.correct) b.classList.add('right');
      else if (i === chosen) b.classList.add('wrong');
    });
  }

  // ---------- match pairs ----------
  startMatch() {
    const words = [];
    const ex = [];
    for (let i = 0; i < 12 && words.length < MATCH_PAIRS; i++) {
      const w = this.pick(false, ex);
      if (!w) break;
      ex.push(w.id);
      if (words.some((x) => x.gloss === w.gloss || [...glossKeys(x)].some((k) => glossKeys(w).has(k)))) continue;
      words.push(w);
    }
    words.forEach((w) => this.pushRecent(w.id));
    this.match = makeMatch(words, this.rng);
    this.q = { format: 'match', timeMs: BASE_MS.match * (words.length / MATCH_PAIRS) * this.stats.timerMult * this.stats.matchTimerMult * this.enrage * (1 - 0.06 * this.run.leg) };
    this.sel = null;
    this.renderMatch();
    this.beginTimer();
  }

  matchClick(side, id) {
    if (this.state !== 'asking') return;
    audio.sfx('click');
    if (!this.sel || this.sel.side === side) {
      this.sel = { side, id };
      $$('.mcell').forEach((c) => c.classList.toggle('sel', c.dataset.side === side && +c.dataset.id === id));
      return;
    }
    const leftId = side === 'l' ? id : this.sel.id;
    const rightId = side === 'r' ? id : this.sel.id;
    this.sel = null;
    this.matchPair(leftId, rightId);
  }

  async matchPair(leftId, rightId, forced = false) {
    const ok = leftId === rightId;
    const cells = $$('.mcell').filter((c) => (c.dataset.side === 'l' && +c.dataset.id === leftId) || (c.dataset.side === 'r' && +c.dataset.id === rightId));
    $$('.mcell').forEach((c) => c.classList.remove('sel'));
    const w = this.match.words.find((x) => x.id === leftId);
    if (ok) {
      this.match.left.find((x) => x.id === leftId).done = true;
      cells.forEach((c) => { c.classList.add('done'); c.disabled = true; });
      progress.gradeWord(leftId, true);
      this.run.stats.correct++;
      progress.addXp(3);
      audio.sfx('correct');
      this.speakWord(w);
      const now = performance.now();
      await this.playerHit({ format: 'match', ms: 0, frac: this.remainingFrac(now), forcedCrit: forced });
      if (this.state === 'done') return;
      if (this.match.left.every((x) => x.done)) {
        this.state = 'feedback';
        this.flash('Все пары!');
        await sleep(500);
        if (this.state !== 'done') this.nextQuestion();
      }
    } else {
      cells.forEach((c) => c.classList.add('wrong'));
      setTimeout(() => cells.forEach((c) => c.classList.remove('wrong')), 500);
      progress.gradeWord(leftId, false);
      run_.addMissed(this.run, leftId);
      this.run.stats.wrong++;
      this.streak = 0;
      audio.sfx('wrong');
      // Penalty: lose a chunk of time
      this.qStart -= this.q.timeMs * 0.15;
      this.renderPlayer();
    }
  }

  // ---------- input ----------
  onKey(e) {
    if (this.state !== 'asking') return;
    if ((['mc', 'gender', 'aspect'].includes(this.q.format)) && /^[1-4]$/.test(e.key)) {
      const i = +e.key - 1;
      if (i < this.q.options.length) this.chooseOption(i);
    }
  }

  chooseOption(i) {
    if (this.state !== 'asking') return;
    this.resolveAnswer(this.q.options[i].correct, { chosen: i });
  }

  submitTyped() {
    if (this.state !== 'asking') return;
    const inp = $('.type-input');
    const val = inp.value.trim();
    if (!val) return;
    const r = this.q.check(val);
    inp.disabled = true;
    inp.classList.add(r.ok ? 'ok' : 'bad');
    this.resolveAnswer(r.ok, { result: r });
  }

  useConsumable(i) {
    const id = this.run.consumables[i];
    if (!id || this.state === 'done') return;
    this.run.consumables.splice(i, 1);
    audio.sfx('relic');
    CONSUMABLES[id].use(this);
    this.renderPlayer();
  }

  // ---------- rendering ----------
  render() {
    const e = this.enemy;
    const c = CHARACTERS[this.run.char];
    const bossBg = e.tier === 'boss' ? 'rays' : 'circle';
    const bgColor = e.tier === 'boss' ? '#141414' : e.tier === 'elite' ? '#1d4e89' : '#c8102e';
    const line = e.def.lines ? this.rng.pick(e.def.lines) : null;
    show(`
      <div class="combat tier-${e.tier}">
        <div class="enemy-panel">
          <div class="enemy-info">
            <div class="enemy-name">${esc(e.name)} <small>${esc(e.en)}</small></div>
            <div class="traits">${[...e.traits].map((t) => `<span class="chip" title="${esc(TRAIT_INFO[t][1])}">${esc(TRAIT_INFO[t][0])}</span>`).join('')}
              ${e.tier !== 'normal' ? `<span class="chip chip-tier">${e.tier === 'boss' ? 'БОСС' : 'ЭЛИТА'}</span>` : ''}</div>
            <div class="hp enemy-hp"><i></i><span></span></div>
            <div class="timer ${this.run.easy ? 'easy' : ''}"><i></i><span>${this.run.easy ? 'без таймера' : 'атака'}</span></div>
            ${line ? `<div class="enemy-line">«${esc(line[0])}» <small>${esc(line[1])}</small></div>` : ''}
          </div>
          <div class="enemy-art">${portrait(e.def.art, { bg: bossBg, bgColor })}</div>
        </div>
        <div class="qcard">
          <div class="q-top"><div class="q-prompt"></div><button class="icon-btn speak" title="Listen" aria-label="Listen">${SPEAKER}</button></div>
          <div class="q-sub"></div>
          <div class="q-body"></div>
          <div class="q-feedback"></div>
          <div class="q-preview"></div>
        </div>
        <div class="player-panel">
          <div class="player-art">${portrait(c.art, { bg: 'square', bgColor: '#d9a441', flip: true })}</div>
          <div class="player-info">
            <div class="hp player-hp"><i></i><span></span></div>
            <div class="player-row"><span class="streak"></span><span class="rub"></span></div>
            <div class="consumables"></div>
            <div class="relic-strip"></div>
          </div>
        </div>
      </div>`, 'screen-combat');
    $('.speak').onclick = () => this.speakPrompt();
    this.renderEnemy();
    this.renderPlayer();
  }

  speakPrompt() {
    if (this.q?.format === 'match') return;
    if (this.q?.word) audio.speak(this.q.word.bare, { force: true });
  }

  renderEnemy() {
    const e = this.enemy;
    const hp = $('.enemy-hp');
    if (!hp) return;
    $('i', hp).style.width = `${(e.hp / e.maxHp) * 100}%`;
    $('span', hp).textContent = `${e.hp} / ${e.maxHp}`;
    if (e.phases) {
      hp.dataset.phase = e.phase + 1;
      const head = e.phases[e.phase].head;
      const chip = $('.chip-phase');
      const label = head ? `Голова ${head}/3` : e.revived ? 'Игла!' : `Фаза ${e.phase + 1}/${e.phases.length}`;
      if (chip) chip.textContent = label;
      else $('.traits')?.insertAdjacentHTML('beforeend', `<span class="chip chip-phase">${label}</span>`);
    }
  }

  renderPlayer() {
    const r = this.run;
    const hp = $('.player-hp');
    if (!hp) return;
    $('i', hp).style.width = `${(r.hp / r.maxHp) * 100}%`;
    $('span', hp).textContent = `${r.hp} / ${r.maxHp}`;
    hp.classList.toggle('low', r.hp / r.maxHp < 0.3);
    const st = $('.streak');
    st.innerHTML = this.streak > 1 ? `Серия ×${this.streak}` : '';
    st.classList.toggle('hot', this.streak >= 5);
    $('.rub').textContent = `${r.rub} ₽`;
    const cons = $('.consumables');
    cons.innerHTML = r.consumables.map((id, i) => `<button class="cons" data-i="${i}" title="${esc(CONSUMABLES[id].name + ' — ' + CONSUMABLES[id].desc)}">${badge(CONSUMABLES[id].icon, 'common', 34)}<small>${esc(CONSUMABLES[id].name)}</small></button>`).join('');
    $$('.cons', cons).forEach((b) => { b.onclick = () => this.useConsumable(+b.dataset.i); });
    $('.relic-strip').innerHTML = r.relics.map((id) => `<span title="${esc(RELICS[id].name + ' — ' + RELICS[id].desc)}">${badge(RELICS[id].icon, RELICS[id].rarity, 24)}</span>`).join('');
  }

  renderPromptHead() {
    const q = this.q;
    $('.qcard').classList.remove('ok', 'bad');
    $('.q-feedback').innerHTML = '';
    $('.q-prompt').innerHTML = `<span class="q-main" lang="${q.prompt.lang}">${esc(q.prompt.main)}</span>`;
    const fmt = q.format === 'aspect' ? `Найдите пару — the ${q.want} partner` : q.format === 'gender' ? 'Какой род? Which gender?' : q.format === 'type' ? (q.answerLang === 'ru' ? 'Напишите по-русски' : 'Type in English') : q.dir === 'en2ru' ? 'Выберите русское слово' : 'Choose the meaning';
    $('.q-sub').innerHTML = `${q.isNew ? '<span class="new-tag">новое слово</span>' : ''}${q.prompt.sub ? `<span class="hint">${esc(q.prompt.sub)}</span>` : ''}<span class="fmt">${fmt}</span>`;
    $('.speak').style.visibility = q.dir === 'ru2en' ? 'visible' : 'hidden';
    const pv = $('.q-preview');
    pv.innerHTML = this.queued ? `Следующее: <span lang="ru">${esc(ruLabel(this.queued))}</span>` : '';
    if (q.dir === 'ru2en' && save.get().settings.autoSpeak && q.format !== 'match') audio.speak(q.word.bare);
  }

  renderQuestion() {
    const q = this.q;
    this.renderPromptHead();
    const body = $('.q-body');
    if (['mc', 'gender', 'aspect'].includes(q.format)) {
      body.innerHTML = `<div class="opts ${q.format === 'gender' ? 'opts-3' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}" lang="${o.lang}"><kbd>${i + 1}</kbd>${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`;
      $$('.opt', body).forEach((b) => { b.onclick = () => this.chooseOption(+b.dataset.i); });
    } else {
      const ru = q.answerLang === 'ru';
      const s = save.get().settings;
      const useKbd = ru && (s.keyboard === 'always' || (s.keyboard === 'auto' && isTouch()));
      body.innerHTML = `<form class="type-form" autocomplete="off">
          <input class="type-input" lang="${q.answerLang}" ${useKbd ? 'inputmode="none"' : ''} autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${this.stats.firstLetter ? esc(q.firstLetter) + '…' : ru ? 'по-русски…' : 'in English…'}">
          <button class="btn btn-go" type="submit">⏎</button>
          <button class="btn btn-skip" type="button" title="I don't know">Не знаю</button>
        </form>
        ${ru ? `<div class="kbd-slot"></div><button type="button" class="link kbd-toggle">${useKbd ? 'hide keyboard' : 'show ЙЦУКЕН keyboard'}</button>` : ''}`;
      const inp = $('.type-input', body);
      $('.type-form', body).onsubmit = (ev) => { ev.preventDefault(); this.submitTyped(); };
      $('.btn-skip', body).onclick = () => this.resolveAnswer(false, {});
      if (ru) {
        const slot = $('.kbd-slot', body);
        const setKbd = (on) => {
          slot.innerHTML = '';
          if (on) slot.appendChild(keyboard(inp, () => this.submitTyped()));
          inp.inputMode = on ? 'none' : 'text';
          $('.kbd-toggle', body).textContent = on ? 'hide keyboard' : 'show ЙЦУКЕН keyboard';
          this.kbdOn = on;
        };
        setKbd(this.kbdOn ?? useKbd);
        $('.kbd-toggle', body).onclick = () => { setKbd(!this.kbdOn); inp.focus(); };
      }
      setTimeout(() => inp.focus({ preventScroll: true }), 30);
    }
  }

  renderMatch() {
    const m = this.match;
    $('.qcard').classList.remove('ok', 'bad');
    $('.q-feedback').innerHTML = '';
    $('.q-prompt').innerHTML = `<span class="q-main">Найдите пары</span>`;
    $('.q-sub').innerHTML = `<span class="fmt">Match each Russian word to its meaning</span>`;
    $('.speak').style.visibility = 'hidden';
    $('.q-preview').innerHTML = '';
    const body = $('.q-body');
    body.innerHTML = `<div class="match">
      <div class="mcol">${m.left.map((x) => `<button class="mcell" data-side="l" data-id="${x.id}" lang="ru">${esc(x.label)}</button>`).join('')}</div>
      <div class="mcol">${m.right.map((x) => `<button class="mcell" data-side="r" data-id="${x.id}">${esc(x.label)}</button>`).join('')}</div></div>`;
    $$('.mcell', body).forEach((b) => { b.onclick = () => this.matchClick(b.dataset.side, +b.dataset.id); });
  }
}
