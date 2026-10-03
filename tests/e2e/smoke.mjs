// Bot that plays through the game in a real browser, answering mostly correctly.
// Usage: (serve repo on :8765) node tests/e2e/smoke.mjs [--acc 0.9] [--shots dir] [--mode mix] [--easy]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ACC = +arg('--acc', 0.9);
const SHOTS = arg('--shots', null);
const MODE = arg('--mode', 'mix');
const EASY = process.argv.includes('--easy');
const MAX_STEPS = +arg('--steps', 4000);
const url = process.env.URL || 'http://localhost:8765/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + e.stack));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_CERT')) errors.push('console: ' + m.text()); });
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.screen-title');

const shotsTaken = new Set();
async function shot(name) {
  if (!SHOTS || shotsTaken.has(name)) return;
  shotsTaken.add(name);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}
const cls = () => page.evaluate(() => document.querySelector('#screen').className);
const click = async (sel) => { await page.click(sel, { timeout: 3000 }); };

await shot('title');
await click('[data-a="new"]');
await page.waitForSelector('.modal');
await shot('tutorial');
await click('.modal .btn');
await page.waitForSelector('.screen-chars');
await shot('chars');
await click('.char-card[data-id="komsomolets"]');
await page.waitForSelector('.screen-setup');
await click(`.mode[data-m="${MODE}"]`);
if (EASY) await click('.easy');
await shot('setup');
await click('.btn-go');

let steps = 0;
let result = null;
const seen = {};
while (steps++ < MAX_STEPS) {
  if (errors.length) break;
  const c = await cls();
  const key = c.split(' ').find((x) => x.startsWith('screen-')) || c;
  seen[key] = (seen[key] || 0) + 1;
  if (await page.$('.modal')) { await shot('modal'); await click('.modal .btn'); continue; }
  if (key === 'screen-map') {
    await shot(`map`);
    const nodes = await page.$$('.node.avail');
    if (!nodes.length) { errors.push('map with no available nodes'); break; }
    await nodes[Math.floor(Math.random() * nodes.length)].click();
    await page.waitForTimeout(100);
  } else if (key === 'screen-travel') {
    await page.waitForTimeout(300);
  } else if (key === 'screen-intro') {
    await shot('intro');
    await click('.btn-fight');
  } else if (key === 'screen-combat') {
    const st = await page.evaluate(() => {
      const C = window.__combat;
      if (!C || C.state !== 'asking') return null;
      const q = C.q;
      if (q.format === 'match') {
        const l = C.match.left.find((x) => !x.done);
        return { format: 'match', id: l?.id, wrongId: C.match.right.find((x) => x.id !== l?.id)?.id };
      }
      return { format: q.format, dir: q.dir, correct: q.options?.findIndex((o) => o.correct), answer: q.dir === 'en2ru' ? q.word.bare : q.word.gloss.split(/[,;]/)[0], tier: C.enemy.tier };
    });
    if (!st) { await page.waitForTimeout(120); continue; }
    await shot(`combat-${st.format}${st.tier !== 'normal' ? '-' + st.tier : ''}`);
    const right = Math.random() < ACC;
    await page.waitForTimeout(200 + Math.random() * 600);
    if (['mc', 'gender', 'aspect'].includes(st.format)) {
      const opts = await page.$$('.opt');
      const i = right ? st.correct : (st.correct + 1) % opts.length;
      await opts[i].click().catch(() => {});
    } else if (st.format === 'type') {
      await page.fill('.type-input', right ? st.answer : 'zzzz').catch(() => {});
      await page.press('.type-input', 'Enter').catch(() => {});
    } else if (st.format === 'match') {
      if (st.id == null) { await page.waitForTimeout(100); continue; }
      const rid = right ? st.id : st.wrongId;
      await page.click(`.mcell[data-side="l"][data-id="${st.id}"]`).catch(() => {});
      await page.click(`.mcell[data-side="r"][data-id="${rid}"]`).catch(() => {});
    }
    await page.waitForTimeout(150);
    await shot(`combat-feedback`);
  } else if (key === 'screen-reward') {
    await shot('reward');
    const cards = await page.$$('.relic-card:not([disabled])');
    if (cards.length) await cards[0].click(); else await click('.btn-continue');
  } else if (key === 'screen-shop') {
    await shot('shop');
    const buy = await page.$('.cons-card:not([disabled])');
    if (buy && Math.random() < 0.5) await buy.click();
    await click('.btn-leave');
  } else if (key === 'screen-rest') {
    await shot('rest');
    const ch = await page.$$('.choice');
    await ch[Math.random() < 0.5 ? 0 : 1].click();
  } else if (key === 'screen-flash') {
    await shot('flash');
    if (await page.$('.btn-flip:not([hidden])')) await click('.btn-flip');
    else await click(Math.random() < ACC ? '.btn-good' : '.btn-bad');
  } else if (key === 'screen-quiz') {
    await shot('quiz');
    const opts = await page.$$('.opt:not([disabled])');
    if (opts.length) await opts[0].click();
    else if (await page.$('.type-input:not([disabled])')) { await page.fill('.type-input', 'да'); await page.press('.type-input', 'Enter'); }
    await page.waitForTimeout(400);
  } else if (key === 'screen-event') {
    await shot('event');
    const ch = await page.$$('.choice:not([disabled])');
    if (ch.length) await ch[0].click(); else await click('.btn-continue');
  } else if (key === 'screen-poster') {
    const txt = await page.textContent('.poster h1');
    await shot(`poster-${txt.includes('Владивосток') ? 'win' : txt.includes('Пораж') ? 'lose' : 'leg'}`);
    if (await page.$('.summary')) { result = txt.trim(); break; }
    await click('.btn-continue');
  } else {
    await page.waitForTimeout(150);
  }
}
const run = await page.evaluate(() => window.__transsib.save.get());
console.log(JSON.stringify({ result, steps, seen, level: run.level, stars: run.stars, stats: run.stats, achievements: Object.keys(run.achievements) }, null, 1));
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exitCode = 1; }
await browser.close();
