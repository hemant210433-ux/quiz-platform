# Builds frontend/src/content/guess.json from tools/guess_src/*.txt (Unit headings + "Q: ... — Ans: ..." lines).
import json, re, pathlib
SRC = pathlib.Path(__file__).parent / 'guess_src'
OUT = pathlib.Path(__file__).parent.parent / 'frontend/src/content/guess.json'
Q = re.compile(r'^(?:\d+\.\s+)?Q:\s*(.+?)\s+—\s+Ans:\s*(.+)$')
U = re.compile(r'^Unit\s+(\d+):\s*(.+)$')
def slug(t):
    return '-'.join(re.findall(r'[A-Za-z0-9]+', t)).lower()
out = {}
for mod in ['m1-r5', 'm2-r5', 'm3-r5', 'm4-r5']:
    units, cur = [], None
    for line in (SRC / f'{mod}.txt').read_text(encoding='utf8').splitlines():
        line = line.strip()
        if not line: continue
        m = U.match(line)
        if m:
            cur = {'n': int(m.group(1)), 'title': m.group(2).strip(), 'items': []}
            cur['slug'] = f"{cur['n']}-{slug(cur['title'])}"
            units.append(cur); continue
        m = Q.match(line)
        if m and cur is not None:
            cur['items'].append([m.group(1).strip(), m.group(2).strip()]); continue
        if cur is not None and not line.startswith(('हर सवाल', 'Code ')):
            print('SKIPPED', mod, line[:80])
    out[mod] = units
    print(mod, len(units), 'units', sum(len(u['items']) for u in units), 'questions')
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf8')
