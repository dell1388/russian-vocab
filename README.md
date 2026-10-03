# Транссиб — Russian vocab roguelike

Ride the Trans-Siberian from Москва to Владивосток, fighting your way through the ~5,600 most
common Russian words. Real-time battles, relics (значки), bosses from Russian folklore, spaced repetition
under the hood.

- **Modes:** English → Russian, Russian → English, or Mixed
- **Formats:** multiple choice, typing (lenient: ё=е, typos, Latin translit OK), match pairs, flashcards
- **Progression:** levels unlock word bands, ★ stars buy permanent upgrades, 6 characters, 26 achievements, daily challenge

## Play locally
```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
(Opening `index.html` directly from disk won't work: browsers block loading the word list over `file://`.)

## Deploy
GitHub Pages workflow in `.github/workflows/pages.yml` deploys on push to `master`.
Enable it once: repo **Settings → Pages → Source: GitHub Actions**.

## Develop
- `npm test`: unit tests (answer matching, SRS, distractors)
- `node tests/e2e/smoke.mjs --acc 0.9 --shots /tmp/shots`: a bot plays a full run in headless Chromium (serve on :8765 first)
- `python3 scripts/build_words.py`: rebuild `data/words.json`; fix translations in `scripts/overrides.json`

See `SPEC.md` for the design and `ROADMAP.md` for what's next.

## Credits
- Frequency: Ляшевская & Шаров, *Частотный словарь современного русского языка* (НКРЯ), 2009
- Dictionary data: [OpenRussian.org](https://en.openrussian.org), CC BY-SA 4.0. `data/words.json` is shared under the same licence.
