# CLAUDE.md

Russian vocab roguelike web game. Read `SPEC.md` (design) and `ROADMAP.md` (task queue — continue from first
unticked item, tick + commit as you go).

- Static site, vanilla JS ES modules, no build step. Open via a local server: `python3 -m http.server`.
- Word data: `python3 scripts/build_words.py` regenerates `data/words.json` (downloads raw sources to gitignored `data/raw/`).
  Fix bad translations in `scripts/overrides.json`, never by hand-editing words.json.
- Tests: `node --test tests/` (pure logic). E2E: `node tests/e2e/smoke.mjs` (Playwright, Chromium preinstalled).
- Keep game content (relics, enemies, events, characters) as data in `js/content/*.js`.
- User prefers terse communication.
