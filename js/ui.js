// DOM helpers: screens, toasts, modals, floating text.
import * as save from './save.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

let cleanup = [];
/** Replace the main screen. Returns the screen root. */
export function show(html, cls = '') {
  for (const fn of cleanup) { try { fn(); } catch { /* ignore */ } }
  cleanup = [];
  const root = $('#screen');
  root.className = `screen ${cls}`;
  root.innerHTML = html;
  root.scrollTop = 0;
  window.scrollTo(0, 0);
  return root;
}
export function onLeave(fn) { cleanup.push(fn); }

export function toast(title, text = '', kind = 'info') {
  const box = $('#toasts');
  const t = el(`<div class="toast toast-${kind}"><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`);
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 3200);
  setTimeout(() => t.remove(), 3800);
}

/** Modal with buttons; resolves with the clicked button's value. */
export function modal(html, buttons = [{ label: 'OK', value: true }], { cls = '' } = {}) {
  return new Promise((resolve) => {
    const m = el(`<div class="modal-wrap"><div class="modal ${cls}">${html}<div class="modal-btns"></div></div></div>`);
    const bb = $('.modal-btns', m);
    for (const b of buttons) {
      const btn = el(`<button class="btn ${b.cls || ''}">${esc(b.label)}</button>`);
      btn.onclick = () => { m.remove(); resolve(b.value); };
      bb.appendChild(btn);
    }
    document.body.appendChild(m);
    $('button', bb)?.focus();
  });
}

export function floatText(anchor, text, cls = '') {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const f = el(`<div class="float ${cls}">${esc(text)}</div>`);
  f.style.left = `${r.left + r.width / 2 + (Math.random() * 40 - 20)}px`;
  f.style.top = `${r.top + r.height * 0.35}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

export function shake(node, cls = 'shake') {
  if (!node || save.get().settings.reduceMotion) return;
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

export function bar(frac, cls = '') {
  return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(1, frac)) * 100}%"></i></div>`;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function isTouch() {
  return window.matchMedia?.('(pointer: coarse)').matches;
}
