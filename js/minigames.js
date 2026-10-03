// Non-combat vocab UIs: flashcards (self-graded) and short quizzes for events.
import { makeQuestion, ruLabel, resolveDir } from './questions.js';
import { hintLine } from './data.js';
import { pickWord } from './srs.js';
import * as progress from './progress.js';
import * as save from './save.js';
import * as audio from './audio.js';
import { keyboard } from './kbd.js';
import { show, $, $$, esc, sleep, isTouch } from './ui.js';

/**
 * Flashcards. Resolves with {known, total}. Grades feed SRS.
 * opts: {title, subtitle, onDone label}
 */
export function flashcards(words, { title = 'Повторение', subtitle = 'Review', dir = 'ru2en', doneLabel = 'Готово' } = {}) {
  return new Promise((resolve) => {
    let i = 0;
    let known = 0;
    if (!words.length) { resolve({ known: 0, total: 0 }); return; }
    const root = show(`<div class="panel flash-screen">
      <h2>${esc(title)} <small>${esc(subtitle)}</small></h2>
      <div class="flash-count"></div>
      <div class="flashcard" tabindex="0"><div class="fc-inner"><div class="fc-front"></div><div class="fc-back"></div></div></div>
      <div class="flash-btns">
        <button class="btn btn-flip">Перевернуть <small>flip</small></button>
        <button class="btn btn-bad" hidden>Не знал <small>didn't know</small></button>
        <button class="btn btn-good" hidden>Знал <small>knew it</small></button>
      </div>
      <p class="muted small">Grade yourself honestly — it only affects which words come back, not your rewards.</p>
    </div>`, 'screen-flash');
    const card = $('.flashcard', root);
    const draw = () => {
      const w = words[i];
      const d = dir === 'mix' ? (i % 2 ? 'en2ru' : 'ru2en') : dir;
      const ru = `<div class="fc-ru" lang="ru">${esc(ruLabel(w))}</div>`;
      const en = `<div class="fc-en">${esc(w.gloss)}</div><div class="fc-hint">${esc(hintLine(w))}</div>`;
      $('.fc-front', card).innerHTML = d === 'ru2en' ? ru : en;
      $('.fc-back', card).innerHTML = d === 'ru2en' ? en + ru : ru + en;
      card.classList.remove('flipped');
      $('.flash-count', root).textContent = `${i + 1} / ${words.length}`;
      $('.btn-flip', root).hidden = false;
      $('.btn-good', root).hidden = true;
      $('.btn-bad', root).hidden = true;
      if (d === 'ru2en') audio.speak(w.bare);
    };
    const flip = () => {
      card.classList.add('flipped');
      $('.btn-flip', root).hidden = true;
      $('.btn-good', root).hidden = false;
      $('.btn-bad', root).hidden = false;
      audio.speak(words[i].bare);
    };
    const grade = (ok) => {
      progress.gradeWord(words[i].id, ok);
      if (ok) known++;
      audio.sfx(ok ? 'correct' : 'click');
      i++;
      if (i >= words.length) resolve({ known, total: words.length });
      else draw();
    };
    card.onclick = () => { if (!card.classList.contains('flipped')) flip(); };
    $('.btn-flip', root).onclick = flip;
    $('.btn-good', root).onclick = () => grade(true);
    $('.btn-bad', root).onclick = () => grade(false);
    draw();
  });
}

/**
 * Quick quiz for events. Resolves with number correct.
 * opts: {count, format:'mc'|'type', dir?, timed?, rng, mode, title}
 */
export function quiz({ count = 1, format = 'mc', dir = null, timed = false, rng, mode = 'en2ru', title = 'Проверка', requireSeen = false }) {
  return new Promise((resolve) => {
    const pool = progress.currentPool();
    const recent = new Set();
    let n = 0;
    let correct = 0;
    let timer = null;
    const root = show(`<div class="panel quiz-screen"><h2>${esc(title)}</h2><div class="quiz-count"></div>
      ${timed ? '<div class="timer"><i></i></div>' : ''}
      <div class="qcard"><div class="q-top"><div class="q-prompt"></div></div><div class="q-sub"></div><div class="q-body"></div><div class="q-feedback"></div></div></div>`, 'screen-quiz');
    const next = () => {
      if (n >= count) { resolve(correct); return; }
      n++;
      $('.quiz-count', root).textContent = `${n} / ${count}`;
      let fmt = format;
      let w = pickWord(pool, save.get().srs, { rng, recent, requireSeen: fmt === 'type' });
      if (!w) { fmt = 'mc'; w = pickWord(pool, save.get().srs, { rng, recent }); }
      recent.add(w.id);
      const d = resolveDir(mode, rng, dir);
      const q = makeQuestion(w, fmt, d, rng, { pool });
      $('.q-prompt', root).innerHTML = `<span class="q-main" lang="${q.prompt.lang}">${esc(q.prompt.main)}</span>`;
      $('.q-sub', root).innerHTML = q.prompt.sub ? `<span class="hint">${esc(q.prompt.sub)}</span>` : '';
      $('.q-feedback', root).innerHTML = '';
      const body = $('.q-body', root);
      let done = false;
      const finish = async (ok) => {
        if (done) return;
        done = true;
        clearInterval(timer);
        progress.gradeWord(w.id, ok, fmt === 'type');
        if (ok) correct++;
        audio.sfx(ok ? 'correct' : 'wrong');
        audio.speak(w.bare);
        $('.q-feedback', root).innerHTML = ok
          ? '<div class="fb fb-ok"><b>Правильно!</b></div>'
          : `<div class="fb fb-bad"><b>Неправильно!</b> <span lang="ru">${esc(ruLabel(w))}</span> = ${esc(w.gloss)}</div>`;
        await sleep(ok ? 700 : 1600);
        next();
      };
      if (fmt === 'mc') {
        body.innerHTML = `<div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}" lang="${o.lang}">${esc(o.label)}</button>`).join('')}</div>`;
        $$('.opt', body).forEach((b) => {
          b.onclick = () => {
            const o = q.options[+b.dataset.i];
            $$('.opt', body).forEach((x, i) => { x.disabled = true; if (q.options[i].correct) x.classList.add('right'); });
            if (!o.correct) b.classList.add('wrong');
            finish(o.correct);
          };
        });
      } else {
        const ru = q.answerLang === 'ru';
        body.innerHTML = `<form class="type-form" autocomplete="off"><input class="type-input" lang="${q.answerLang}" autocapitalize="off" spellcheck="false" placeholder="${ru ? 'по-русски…' : 'in English…'}"><button class="btn btn-go">⏎</button></form>${ru && isTouch() ? '<div class="kbd-slot"></div>' : ''}`;
        const inp = $('.type-input', body);
        const submit = () => { if (inp.value.trim()) finish(q.check(inp.value).ok); };
        $('.type-form', body).onsubmit = (e) => { e.preventDefault(); submit(); };
        const slot = $('.kbd-slot', body);
        if (slot) { slot.appendChild(keyboard(inp, submit)); inp.inputMode = 'none'; }
        setTimeout(() => inp.focus({ preventScroll: true }), 30);
      }
      if (timed) {
        const total = fmt === 'mc' ? 6000 : 14000;
        const t0 = Date.now();
        const bar = $('.timer i', root);
        timer = setInterval(() => {
          const f = (Date.now() - t0) / total;
          bar.style.width = `${Math.min(1, f) * 100}%`;
          if (f >= 1) finish(false);
        }, 50);
      }
    };
    next();
  });
}
