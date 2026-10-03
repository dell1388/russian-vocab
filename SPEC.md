# Транссиб — Russian vocab roguelike (design spec)

A browser game that's as much a game as a vocab trainer. Static site (no backend,
no build step), deployable to GitHub Pages. Progress saved in `localStorage`.

## Core loop
A **run** is a train journey Москва → Владивосток in 5 legs. Each leg = 3 floors of
branching stations + a boss city. ~10–15 min per run.

| Leg | From → Boss city | Boss |
|---|---|---|
| I | Москва → Казань | Баба Яга |
| II | Казань → Екатеринбург | Хозяйка Медной горы |
| III | Екатеринбург → Новосибирск | Кощей Бессмертный |
| IV | Новосибирск → Иркутск | Змей Горыныч (3 heads = 3 phases) |
| V | Иркутск → Владивосток | Генерал Мороз (final) |

Node types: **fight**, **elite**, **shop** (₽), **rest stop** (самовар), **event** (?), **treasure**, **boss**.

## Language modes (per run)
- **EN→RU**: prompt in English, answer in Russian
- **RU→EN**: prompt in Russian, answer in English
- **Mixed**: random per question (+25% score/stars)

## Combat (real-time)
- Each question = one exchange. Enemy has an attack timer bar.
- Correct before timer → you hit (damage × speed bonus up to 2×; crits from relics/streaks).
- Wrong or timeout → enemy hits you. New question either way.
- Answer formats by enemy tier:
  - Normal: multiple choice (4 options)
  - Elite: typing
  - Boss: phases mixing MC → match-pairs → typing
- Timers shrink further east. **Easy mode**: no timer (enemy only hits on wrong answers), fewer stars.
- Enemy traits (e.g. Контролёр fines ₽ on misses, Волк hits twice, Леший flips direction).

## Vocab layer
- `data/words.json`: ~1085 lemmas. Top 1000 by RNC lemma frequency (Lyashevskaya & Sharoff)
  joined to OpenRussian (CC BY-SA) for stress, POS, gender, aspect, translations, plus everyday essentials.
- Bands unlock by player level: 1–100 (+essentials), –250, –500, –750, all.
- Spaced repetition (Leitner boxes 0–7) chooses words; weak/due words more often; new words introduced gradually.
  Typing only uses words already seen correctly at least once (falls back to MC).
- Lenient answer check: case, stress, ё=е ignored; 1 typo allowed (2 for long words); Latin translit accepted;
  any listed English meaning accepted; "to " optional for verbs.
- On-screen ЙЦУКЕН keyboard for Russian typing. Stress marks shown. TTS (ru-RU speechSynthesis).
- POS filter in settings.

## Rest stop
Choose: **Review** (flashcards of words missed this run, self-graded → feeds SRS only; heals 30% regardless of grades so no incentive to cheat)
or **Drill** (5 quick typing questions; +1 permanent damage for this run per correct).

## Loot
- **Relics** (run-only passive effects) from elites, treasure, shop, bosses.
- **Consumables** (3 slots): чай (heal), сахар (slow timer this fight), шпаргалка (reveal answer), etc.
- **Meta currency ★ (звёзды)** earned per run → permanent upgrades (max HP, start ₽, timer, extra slot, revive) and character unlocks.

## Characters
| Name | Play style | Unlock |
|---|---|---|
| Комсомолец | balanced | start |
| Космонавт | +30% timer, low HP | start |
| Бабушка | heals on 3-streaks, low dmg | reach Екатеринбург |
| Шахматист | first answer each fight crits; sees next word | beat Кощей |
| Балерина | 15% dodge; streak builds faster | ★ shop |
| Хоккеист | big hits, shorter timer | win a run |

## Progression
- XP & levels (XP per correct answer, more for typing / rare words). Levels unlock word bands.
- Daily challenge: date-seeded map/enemies/relics/character; local best score + daily streak.
- Achievements (~25).

## Look & sound
Soviet constructivist posters: cream paper, red, black, ochre; diagonal bands, rays, bold
condensed Cyrillic type (Russo One / Oswald). Flat SVG portraits. WebAudio synth SFX + optional march loop.

## Tech
Vanilla JS ES modules, no build. `index.html`, `css/`, `js/`, `data/words.json`.
Tests: `node --test tests/` for pure logic; Playwright smoke test in `tests/e2e/`.
