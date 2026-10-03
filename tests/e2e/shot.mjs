// Quick screenshot helper: node tests/e2e/shot.mjs [outdir]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const out = process.argv[2] || '.';
const url = process.env.URL || 'http://localhost:8765/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url);
await page.waitForSelector('.screen-title');
await page.screenshot({ path: `${out}/01-title.png`, fullPage: true });
console.log('errors:', errors);
await browser.close();
