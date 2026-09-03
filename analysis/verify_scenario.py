#!/usr/bin/env python3
"""章データの検証：<q>…</q> の原文一致，blocks の行範囲，task.answer の範囲，「、。」の混入（引用外）．
usage: verify_scenario.py src/data/chapters/S03.ts [...]"""
import re, sys, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
sec = {s['id']: s for s in json.load(open(ROOT / 'analysis/sections.json'))['sections']}
lines = {}
for f in (ROOT / 'analysis/lines').glob('S*.txt'):
    for ln in f.read_text().splitlines()[1:]:
        n, _, t = ln.partition('\t'); lines[int(n)] = t
full = ''.join(lines[k] for k in sorted(lines))
def norm(s): return re.sub(r'\s+', '', re.sub(r'<[^>]+>', '', s))
fulln = norm(full)
bad = 0
for path in sys.argv[1:]:
    src = pathlib.Path(path).read_text(); errs = []
    for q in re.findall(r'<q>(.*?)</q>', src, re.S):
        if norm(q) not in fulln: errs.append(f'引用不一致: <q>{q[:60]}…</q>')
    for s, a, b in re.findall(r"section:\s*'(S\d\d)',\s*from:\s*(\d+),\s*to:\s*(\d+)", src):
        a, b = int(a), int(b); r = sec[s]
        if not (r['line_start'] <= a <= b <= r['line_end']): errs.append(f'行範囲外: {s} {a}-{b}（{s} は {r["line_start"]}-{r["line_end"]}）')
        if b - a > 80: errs.append(f'ブロックが長すぎ: {s} {a}-{b}（{b-a+1}行）')
    for m in re.finditer(r"opts:\s*\[(.*?)\],\s*answer:\s*(\d+)", src, re.S):
        n = len(re.findall(r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"", m.group(1)))
        if int(m.group(2)) >= n: errs.append(f'answer 範囲外: {m.group(0)[:80]}')
    # 引用外の「、。」
    stripped = re.sub(r'<q>.*?</q>', '', src, flags=re.S); stripped = re.sub(r'//.*', '', stripped)
    for m in re.finditer(r'[、。]', stripped):
        ctx = stripped[max(0, m.start()-25):m.start()+5].replace('\n', ' ')
        errs.append(f'引用外の「、。」: …{ctx}…'); 
        if len([e for e in errs if e.startswith('引用外')]) >= 8: errs.append('（以下略）'); break
    print(f'{path}: {"OK" if not errs else str(len(errs))+" 件"}')
    for e in errs: print('  -', e)
    bad += len(errs)
sys.exit(1 if bad else 0)
