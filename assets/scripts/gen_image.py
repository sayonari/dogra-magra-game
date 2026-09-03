#!/usr/bin/env python3
"""Nano Banana（Gemini image）で1枚生成し assets/generated/<id>.png に保存，LEDGER.csv に記録．
usage: gen_image.py <id> <model> <aspect> "<prompt>" [reference.png ...]"""
import sys, json, base64, csv, datetime, pathlib, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
KEY = (pathlib.Path.home() / '.config/dogra/gemini_api_key').read_text().strip()
iid, model, aspect, prompt, *refs = sys.argv[1:]
parts = [{"text": prompt}]
for r in refs:
    parts.append({"inline_data": {"mime_type": "image/png", "data": base64.b64encode(pathlib.Path(r).read_bytes()).decode()}})
body = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}}}
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}",
                             data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
try:
    res = json.load(urllib.request.urlopen(req, timeout=180))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:600]); sys.exit(1)
out = None
for p in res.get("candidates", [{}])[0].get("content", {}).get("parts", []):
    if "inlineData" in p:
        out = ROOT / "assets/generated" / f"{iid}.png"; out.write_bytes(base64.b64decode(p["inlineData"]["data"]))
    elif "text" in p: print("text:", p["text"][:200])
if not out: print(json.dumps(res)[:800]); sys.exit(1)
with open(ROOT / "assets/LEDGER.csv", "a", newline="") as f:
    csv.writer(f).writerow([iid, "image", model, prompt, ";".join(refs), "generated (Google Gemini API, project use)", datetime.date.today().isoformat(), f"aspect {aspect}"])
print("saved", out, out.stat().st_size)
