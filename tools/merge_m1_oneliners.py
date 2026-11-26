# Adds the question-bank one-liners (txt) to M1-R5 notes in notes.json, skipping points that M1 already has.
# Usage: python3 -I tools/merge_m1_oneliners.py <oneliners.txt>   (safe to re-run: it replaces its own section)
import json, re, sys
TXT = sys.argv[1]
JS = 'frontend/src/content/notes.json'
# (chapter, number) of txt points that M1 already covers -> not added again
DUP = {(1,5),(1,8),(1,10),(1,11),(1,12),(2,5),(2,12),(2,17),(2,24),(2,32),(2,33),(2,34),(3,17),(3,19),
 (4,6),(4,13),(4,19),(4,21),(4,22),(4,24),(4,28),(4,33),(4,34),(4,44),(4,45),(4,47),
 (5,26),(5,27),(5,33),(5,36),(5,37),(5,42),(5,45),(5,47),(5,48),(5,49),
 (6,2),(6,4),(6,6),(6,15),(6,16),(6,17),(6,18),(6,19),(6,21),
 (7,4),(7,6),(7,7),(7,8),(7,10),(7,14),(7,16),(7,21),
 (8,6),(8,9),(8,12),(8,13),(8,14),(8,15),(8,19),(8,24),(8,33),(8,35),
 (9,1),(9,3),(9,4),(9,10),(9,12),(9,13),(9,17),(9,18),(9,19)}
AI = {(9,5),(9,11),(9,14),(9,16),(9,20)}   # txt chapter 9 mixes cyber security and AI; these go to chapter 10
lines = [l.rstrip('\n') for l in open(TXT, encoding='utf8')]
ch = 0; items = []; i = 0
while i < len(lines):
    m = re.match(r'^Chapter (\d+):', lines[i])
    if m: ch = int(m.group(1)); i += 1; continue
    m = re.match(r'^(\d+)\.\t(.+)$', lines[i])
    if m and ch: items.append((ch, int(m.group(1)), m.group(2).strip(), lines[i+1].strip())); i += 2; continue
    i += 1
d = json.load(open(JS, encoding='utf8'))
chs = {c['n']: c for c in d['m1-r5']}
SEC_EN = 'Important One-Liners'
for c in chs.values():
    c['sections'] = [s for s in c['sections'] if s['en'] != SEC_EN]
seen = set(re.sub(r'\W+', ' ', b['p'][1].lower()) for c in chs.values() for s in c['sections'] for b in s['blocks'] if 'p' in b)
add = {}; skipped = 0
for ch, n, hi, en in items:
    if (ch, n) in DUP: skipped += 1; continue
    key = re.sub(r'\W+', ' ', en.lower())
    if key in seen: skipped += 1; continue
    seen.add(key)
    to = 10 if (ch, n) in AI else ch
    add.setdefault(to, []).append({'p': [hi, en]})
for to, blocks in add.items():
    chs[to]['sections'].append({'hi': 'ज़रूरी वन-लाइनर', 'en': SEC_EN, 'blocks': blocks})
json.dump(d, open(JS, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('txt points', len(items), 'skipped duplicates', skipped, 'added', sum(len(v) for v in add.values()), {k: len(v) for k, v in sorted(add.items())})
