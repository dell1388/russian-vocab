# Roadmap / task queue

Work top to bottom. Tick boxes as done and commit. Future sessions: read `SPEC.md` + this file, continue
from the first unticked item. Keep each milestone playable.

## M0 — Data
- [x] Build word list: RNC lemma frequency × OpenRussian (`scripts/build_words.py`)
- [x] Manual gloss fixes + skips (`scripts/overrides.json`)
- [x] Everyday essentials added (`extra` in overrides, tagged `ess`)
- [x] Second pass review of glosses for words 300–1085 (look for odd 2nd items like "morn")

## M1 — Vocab engine
- [x] `js/text.js`: normalize, stress strip, ё=е, Latin→Cyrillic translit, Levenshtein, answer check
- [x] `js/srs.js`: Leitner boxes, due times, weighted pick, new-word pacing
- [x] `js/data.js`: load words, bands, POS filter, distractor picking (same POS, no gloss overlap)
- [x] Unit tests (`tests/*.test.mjs`)

## M2 — Core game (v1 playable)
- [x] Screens: title, character select, run setup (mode/easy), map, combat, reward, shop, rest, event, game over, victory
- [x] Map generation (5 legs × 3 floors + boss, branching DAG, seeded RNG)
- [x] Real-time combat: timer bar, MC, typing (+ on-screen ЙЦУКЕН), match pairs, damage/speed bonus, streaks
- [x] Enemies (normal/elite/boss) with traits; boss phases
- [x] 2 starting characters (Комсомолец, Космонавт)
- [x] ~12 relics, 3 consumables
- [x] Rewards: ₽, relic choice after elites/bosses
- [x] Save/load profile + SRS in localStorage; resume run in progress
- [x] Constructivist styling, mobile layout
- [x] SFX (WebAudio) + TTS

## M3 — Full content
- [x] All 6 characters + unlock conditions
- [x] 30+ relics, 6 consumables
- [x] 10+ events with vocab mini-challenges
- [x] Rest stop: review flashcards + drill
- [x] Meta ★ upgrades shop
- [x] XP/levels unlocking word bands
- [x] Achievements (~25) + toasts
- [x] Daily challenge (seeded) + streak
- [x] Study mode (plain flashcards / browse word list with SRS status)
- [x] Stats screen (words mastered, accuracy, runs)

## M4 — Polish
- [x] Animations: hits, shake, damage numbers, train travel between stations
- [x] Procedural march music loop (toggle)
- [x] Settings: volume, TTS on/off, auto-speak, stress marks on/off, reduce motion, unlock all bands
- [x] Tutorial / first-run hints
- [x] Balance pass via `scripts/balance.mjs` (first pass; re-tune after real play feedback)
- [x] Playwright e2e smoke test
- [x] GitHub Pages deploy workflow
- [x] Credits/licensing page (OpenRussian CC BY-SA, RNC freq dictionary)

## M5 — Next (after playtesting)
- [ ] Playtest on a real phone; fix layout/keyboard issues
- [ ] Re-balance from real play (sim assumes 80% accuracy reaches leg 3 ~20%, 90% wins ~30%)
- [ ] Theme toggle (light/dark) in settings
- [ ] Boss-specific mechanics beyond phases (Кощей needle, Горыныч per-head HP bars)
- [ ] Gender challenge enemy (м/ж/с) and aspect-pair mini-boss
- [ ] More events (target 20) and relic synergies
- [ ] Run history / leaderboard of daily scores (local)
- [ ] PWA: offline cache + install to home screen

## Ideas backlog
- Example sentences (Tatoeba) as "boss quotes"
- Verb aspect pair mini-boss (match imperfective↔perfective)
- Gender challenge enemies (choose м/ж/с)
- Audio-only questions (listen → pick)
- Export/import save
