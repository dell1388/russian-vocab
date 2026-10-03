#!/usr/bin/env python3
"""Build data/sentences.json: up to 2 short example sentences (RU + EN) per word in data/words.json.

Source: Tatoeba (https://tatoeba.org), CC BY 2.0 FR. Exports are downloaded into data/raw/ (gitignored).
Russian sentences are lemmatised with pymorphy3 (`pip install pymorphy3`) so a sentence containing
"людей" counts as an example of "человек"/"люди" as the dictionary allows.

Easier sentences win: each sentence is scored by the frequency rank of its hardest word plus its length.
Output: {"<word id>": [[ru, en, matched form], ...]}
"""
import bz2, json, os, re, urllib.request
import pymorphy3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw')
BASE = 'https://downloads.tatoeba.org/exports/per_language/'
FILES = ['rus/rus_sentences.tsv.bz2', 'eng/eng_sentences.tsv.bz2', 'rus/rus-eng_links.tsv.bz2']
PER_WORD = 2
MAX_TOKENS = 9
MAX_RU_CHARS = 60
MAX_EN_CHARS = 75

TOKEN = re.compile(r'[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*')


def fetch():
    os.makedirs(RAW, exist_ok=True)
    for f in FILES:
        p = os.path.join(RAW, os.path.basename(f))
        if not os.path.exists(p):
            print('downloading', f)
            urllib.request.urlretrieve(BASE + f, p)


def read_tsv(name):
    with bz2.open(os.path.join(RAW, name), 'rt', encoding='utf-8') as fh:
        for line in fh:
            yield line.rstrip('\n').split('\t')


def key(s):
    return s.lower().replace('ё', 'е')


def main():
    fetch()
    words = json.load(open(os.path.join(ROOT, 'data', 'words.json'), encoding='utf-8'))
    by_key = {}
    for w in words:
        by_key.setdefault(key(w['bare']), []).append(w)
    rank = {key(w['bare']): w['id'] for w in words}

    links = {}
    for r, e in read_tsv('rus-eng_links.tsv.bz2'):
        links.setdefault(r, e)
    need_en = set(links.values())
    eng = {}
    for sid, _, text in read_tsv('eng_sentences.tsv.bz2'):
        if sid in need_en and len(text) <= MAX_EN_CHARS:
            eng[sid] = text

    morph = pymorphy3.MorphAnalyzer()
    cache = {}

    def lemma(tok):
        t = key(tok)
        if t not in cache:
            cache[t] = key(morph.parse(t)[0].normal_form)
        return cache[t]

    best = {}  # word id -> list of (score, ru, en, form)
    seen_ru = set()
    n = 0
    for sid, _, ru in read_tsv('rus_sentences.tsv.bz2'):
        en = eng.get(links.get(sid))
        if not en or len(ru) > MAX_RU_CHARS or ru in seen_ru:
            continue
        toks = TOKEN.findall(ru)
        if not 3 <= len(toks) <= MAX_TOKENS:
            continue
        seen_ru.add(ru)
        lemmas = [lemma(t) for t in toks]
        # Difficulty: rarest word in the sentence (unknown words count as very rare)
        hardest = max(rank.get(l, 20000 if not l[0].isupper() else 8000) for l in lemmas)
        score = hardest + 40 * len(toks)
        n += 1
        for tok, lem in zip(toks, lemmas):
            for w in by_key.get(lem, []) + (by_key.get(key(tok), []) if key(tok) != lem else []):
                lst = best.setdefault(w['id'], [])
                if any(x[1] == ru or x[2] == en for x in lst):
                    continue
                lst.append((score, ru, en, tok))
                lst.sort()
                del lst[PER_WORD:]
    out = {str(i): [[ru, en, form] for _, ru, en, form in v] for i, v in sorted(best.items())}
    path = os.path.join(ROOT, 'data', 'sentences.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
    print(f'scanned {n} sentences; examples for {len(out)}/{len(words)} words -> {path}')


if __name__ == '__main__':
    main()
