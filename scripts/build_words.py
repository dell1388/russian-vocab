#!/usr/bin/env python3
"""Build data/words.json: top-N Russian lemmas by frequency with stress + English.

Sources (downloaded into data/raw/ on first run, gitignored):
  - Frequency: Lyashevskaya & Sharoff, RNC lemma frequency dictionary (2009/2011)
      http://dict.ruslang.ru/Freq2011.zip
  - Stress, translations, POS details: OpenRussian.org (CC BY-SA 4.0)
      https://github.com/Badestrand/russian-dictionary

Lemmatization comes from the RNC list itself (one row per lemma+POS), so
inflected forms never appear as separate entries.

Usage: python3 scripts/build_words.py [N]   (default 1000)
Manual fixes live in scripts/overrides.json and are applied last.
"""
import csv, io, json, os, re, sys, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw')
OR_BASE = 'https://raw.githubusercontent.com/Badestrand/russian-dictionary/master/'
OR_FILES = ['nouns', 'verbs', 'adjectives', 'others']
RNC_URL = 'http://dict.ruslang.ru/Freq2011.zip'

csv.field_size_limit(10**8)


def fetch():
    os.makedirs(RAW, exist_ok=True)
    for f in OR_FILES:
        p = os.path.join(RAW, f + '.csv')
        if not os.path.exists(p):
            print('downloading', f)
            urllib.request.urlretrieve(OR_BASE + f + '.csv', p)
    p = os.path.join(RAW, 'freqrnc2011.csv')
    if not os.path.exists(p):
        print('downloading RNC freq')
        data = urllib.request.urlopen(RNC_URL).read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            z.extract('freqrnc2011.csv', RAW)


def key(s):
    return s.lower().replace('ё', 'е').strip()


def load_or():
    """Return {file: {key: [rows]}} preserving file order (OpenRussian rank)."""
    out = {}
    for f in OR_FILES:
        idx = {}
        with open(os.path.join(RAW, f + '.csv'), encoding='utf-8') as fh:
            for i, row in enumerate(csv.DictReader(fh, delimiter='\t')):
                if not row.get('bare') or not row.get('translations_en'):
                    continue
                row['_file'] = f
                row['_order'] = i
                idx.setdefault(key(row['bare']), []).append(row)
        out[f] = idx
    return out


# RNC PoS -> OpenRussian files to search, in priority order
POS_FILES = {
    's': ['nouns'], 'v': ['verbs'], 'a': ['adjectives'],
    'apro': ['adjectives', 'others'], 'anum': ['adjectives', 'others'],
    'adv': ['others', 'adjectives'], 'advpro': ['others'],
    'spro': ['others', 'adjectives'], 'num': ['others', 'adjectives'],
    'conj': ['others'], 'pr': ['others'], 'part': ['others'],
}
POS_NAME = {
    's': 'noun', 'v': 'verb', 'a': 'adj', 'apro': 'pron', 'anum': 'num',
    'adv': 'adv', 'advpro': 'adv', 'spro': 'pron', 'num': 'num',
    'conj': 'conj', 'pr': 'prep', 'part': 'part',
}


def accent(s):
    """OpenRussian marks stress with an apostrophe after the vowel -> combining acute."""
    return s.replace("'", '́')


JUNK = re.compile(r'\b(gapirish)\b')


def split_senses(tr):
    """'a, b; c' -> [['a','b'],['c']] with junk/dupes stripped."""
    senses = []
    seen = set()
    for part in tr.split(';'):
        items = []
        for it in re.split(r',(?![^()]*\))', part):
            it = JUNK.sub('', it).strip().strip('.').strip()
            if not it or len(it) > 40:
                continue
            k = it.lower()
            if k in seen:
                continue
            seen.add(k)
            items.append(it)
        if items:
            senses.append(items)
    return senses


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    fetch()
    ors = load_or()
    rnc = []
    with open(os.path.join(RAW, 'freqrnc2011.csv'), encoding='utf-8') as fh:
        r = csv.reader(fh, delimiter='\t')
        next(r)
        for lemma, pos, ipm, *_ in r:
            if pos not in POS_FILES:
                continue
            if '-' in lemma and pos == 'intj':
                continue
            rnc.append((lemma, pos, float(ipm)))
    rnc.sort(key=lambda x: -x[2])

    overrides = {}
    op = os.path.join(ROOT, 'scripts', 'overrides.json')
    if os.path.exists(op):
        overrides = json.load(open(op, encoding='utf-8'))
    skip = {key(x) for x in overrides.get('skip', [])}
    drop = {x.lower() for x in overrides.get('glossDrop', [])}

    def default_gloss(senses):
        items = [senses[0][0]] + [x for x in senses[0][1:2] if x.lower() not in drop]
        return ', '.join(items)

    used = set()
    words = []
    for lemma, pos, ipm in rnc:
        if len(words) >= n:
            break
        if key(lemma) in skip:
            continue
        rows = None
        for f in POS_FILES[pos]:
            rows = ors[f].get(key(lemma))
            if rows:
                break
        if not rows:
            continue
        # Prefer exact (with ё) matches; take first unused
        row = next((x for x in rows if (x['_file'], x['_order']) not in used), None)
        if row is None:
            continue
        used.add((row['_file'], row['_order']))
        senses = split_senses(row['translations_en'])
        if not senses:
            continue
        w = {
            'id': len(words) + 1,
            'ru': accent(row['accented'] or row['bare']),
            'bare': row['bare'],
            'pos': POS_NAME[pos],
            'en': senses,
            'ipm': ipm,
        }
        if row['_file'] == 'nouns' and row.get('gender'):
            w['g'] = row['gender']
        if row['_file'] == 'verbs' and row.get('aspect'):
            w['asp'] = 'pf' if row['aspect'].startswith('perf') else 'impf'
            if row.get('partner'):
                w['partner'] = row['partner'].split(';')[0]
        w['gloss'] = default_gloss(senses)
        o = overrides.get('fix', {}).get(row['bare'])
        if o:
            w.update(o)
            if 'en' in o and 'gloss' not in o:
                w['gloss'] = ', '.join(o['en'][0][:2])
        words.append(w)

    # Everyday essentials a written-text corpus under-ranks
    rnc_ipm = {}
    for lemma, pos, ipm in rnc:
        rnc_ipm[key(lemma)] = max(rnc_ipm.get(key(lemma), 0), ipm)
    have = {key(w['bare']) for w in words}
    for lemma in overrides.get('extra', []):
        if key(lemma) in have:
            continue
        row = None
        for f in OR_FILES:
            rows = ors[f].get(key(lemma))
            if rows:
                row = rows[0]
                break
        if not row:
            print('extra not found:', lemma)
            continue
        pos = {'nouns': 'noun', 'verbs': 'verb', 'adjectives': 'adj', 'others': 'adv'}[row['_file']]
        senses = split_senses(row['translations_en'])
        w = {'id': 0, 'ru': accent(row['accented'] or row['bare']), 'bare': row['bare'], 'pos': pos,
             'en': senses, 'ipm': rnc_ipm.get(key(lemma), 20.0), 'gloss': default_gloss(senses), 'ess': 1}
        if row['_file'] == 'nouns' and row.get('gender'):
            w['g'] = row['gender']
        if row['_file'] == 'verbs' and row.get('aspect'):
            w['asp'] = 'pf' if row['aspect'].startswith('perf') else 'impf'
        o = overrides.get('fix', {}).get(row['bare'])
        if o:
            w.update(o)
        words.append(w)
        have.add(key(lemma))
    for a in overrides.get('add', []):
        if key(a['bare']) not in have:
            words.append(dict(a, id=0))
    words.sort(key=lambda w: -w['ipm'])
    for i, w in enumerate(words):
        w['id'] = i + 1

    out = os.path.join(ROOT, 'data', 'words.json')
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('[\n' + ',\n'.join(json.dumps(w, ensure_ascii=False) for w in words) + '\n]\n')
    print('wrote', len(words), 'words to', out)


if __name__ == '__main__':
    main()
