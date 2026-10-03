// Spawn a fight against a specific enemy and screenshot it: node tests/e2e/cat.mjs <enemyId> <outdir>
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const [id, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:8765/');
await page.waitForSelector('.screen-title');
await page.evaluate(async (id) => {
  const { Combat } = await import('./js/combat.js');
  const t = window.__transsib;
  const run = t.run_.newRun({ char: 'komsomolets', mode: 'mix', easy: false });
  new Combat(run, id).start();
}, id);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/enemy-${id}.png` });
console.log('errors', errors);
await browser.close();
