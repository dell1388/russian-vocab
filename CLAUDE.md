# CLAUDE.md

Russian vocab roguelike web game. Read `SPEC.md` (design) and `ROADMAP.md` (task queue — continue from first
unticked item, tick + commit as you go).

- Static site, vanilla JS ES modules, no build step. Open via a local server: `python3 -m http.server`.
- Word data: `python3 scripts/build_words.py` regenerates `data/words.json` (downloads raw sources to gitignored `data/raw/`).
  Fix bad translations in `scripts/overrides.json`, never by hand-editing words.json.
- Tests: `npm test` (pure logic). E2E: `node tests/e2e/smoke.mjs` (Playwright, Chromium preinstalled).
- Keep game content (relics, enemies, events, characters) as data in `js/content/*.js`.
- User prefers terse communication.
- Live artifact (private): https://claude.ai/artifact/CXz4u5cZELT3gEvBdPpjgy — republish by regenerating a skeleton-free copy of
  index.html (no doctype/html/head/body tags) and publishing it with `root` = repo and `files` = css, js/**, data/words.json.
- E2E helpers in `tests/e2e/`: `smoke.mjs` (bot plays a run), `cat.mjs <enemyId> <dir>` (screenshot one fight), `dark.mjs`.
- Balance: `node scripts/balance.mjs <accuracy> <speedFrac>`.
