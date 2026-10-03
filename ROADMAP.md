# Roadmap / task queue

Work top to bottom. Tick boxes as done and commit. Future sessions: read `SPEC.md` + this file, continue
from the first unticked item. Keep each milestone playable.

## M0 — Data
- [x] Build word list: RNC lemma frequency × OpenRussian (`scripts/build_words.py`)
- [x] Manual gloss fixes + skips (`scripts/overrides.json`)
- [x] Everyday essentials added (`extra` in overrides, tagged `ess`)
- [ ] Second pass review of glosses for words 300–1085 (look for odd 2nd items like "morn")

## M1 — Vocab engine
- [ ] `js/text.js`: normalize, stress strip, ё=е, Latin→Cyrillic translit, Levenshtein, answer check
- [ ] `js/srs.js`: Leitner boxes, due times, weighted pick, new-word pacing
- [ ] `js/data.js`: load words, bands, POS filter, distractor picking (same POS, no gloss overlap)
- [ ] Unit tests (`tests/*.test.mjs`)

## M2 — Core game (v1 playable)
- [ ] Screens: title, character select, run setup (mode/easy), map, combat, reward, shop, rest, event, game over, victory
- [ ] Map generation (5 legs × 3 floors + boss, branching DAG, seeded RNG)
- [ ] Real-time combat: timer bar, MC, typing (+ on-screen ЙЦУКЕН), match pairs, damage/speed bonus, streaks
- [ ] Enemies (normal/elite/boss) with traits; boss phases
- [ ] 2 starting characters (Комсомолец, Космонавт)
- [ ] ~12 relics, 3 consumables
- [ ] Rewards: ₽, relic choice after elites/bosses
- [ ] Save/load profile + SRS in localStorage; resume run in progress
- [ ] Constructivist styling, mobile layout
- [ ] SFX (WebAudio) + TTS

## M3 — Full content
- [ ] All 6 characters + unlock conditions
- [ ] 30+ relics, 6 consumables
- [ ] 10+ events with vocab mini-challenges
- [ ] Rest stop: review flashcards + drill
- [ ] Meta ★ upgrades shop
- [ ] XP/levels unlocking word bands
- [ ] Achievements (~25) + toasts
- [ ] Daily challenge (seeded) + streak
- [ ] Study mode (plain flashcards / browse word list with SRS status)
- [ ] Stats screen (words mastered, accuracy, runs)

## M4 — Polish
- [ ] Animations: hits, shake, damage numbers, train travel between stations
- [ ] Procedural march music loop (toggle)
- [ ] Settings: volume, TTS on/off, auto-speak, stress marks on/off, reduce motion, unlock all bands
- [ ] Tutorial / first-run hints
- [ ] Balance pass (timers, HP, damage) via a headless sim
- [ ] Playwright e2e smoke test
- [ ] GitHub Pages deploy workflow
- [ ] Credits/licensing page (OpenRussian CC BY-SA, RNC freq dictionary)

## Ideas backlog
- Example sentences (Tatoeba) as "boss quotes"
- Verb aspect pair mini-boss (match imperfective↔perfective)
- Gender challenge enemies (choose м/ж/с)
- Audio-only questions (listen → pick)
- Export/import save
