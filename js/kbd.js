// On-screen ЙЦУКЕН keyboard bound to an input element.
import { el } from './ui.js';

const ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ё', '⌫'],
];

export function keyboard(input, onEnter) {
  const k = el(`<div class="kbd">${ROWS.map((r) => `<div class="kbd-row">${r.map((c) => `<button type="button" class="key${c === '⌫' ? ' key-wide' : ''}" data-k="${c}">${c}</button>`).join('')}</div>`).join('')}
    <div class="kbd-row"><button type="button" class="key key-space" data-k=" ">пробел</button><button type="button" class="key key-enter" data-k="enter">Ввод ⏎</button></div></div>`);
  k.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.key');
    if (!b) return;
    e.preventDefault();
    const c = b.dataset.k;
    if (c === '⌫') input.value = input.value.slice(0, -1);
    else if (c === 'enter') { onEnter(); return; }
    else input.value += c;
    input.dispatchEvent(new Event('input'));
  });
  return k;
}
