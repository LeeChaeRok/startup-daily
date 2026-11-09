"""Export merged contests to the app's data file (src/data/contests.json).

usage: python3 export_app.py ../contests_2026-11-02_09.json ../../../src/data/contests.json 2026-11-09

Only 공모전 rows are exported; rows already closed on <updated> are dropped
(the app also hides rows that close later, by the viewer's date).
"""
import hashlib
import json
import sys
from pathlib import Path

src, out, updated = sys.argv[1], sys.argv[2], sys.argv[3]
data = json.loads(Path(src).read_text())

SITES = ["링커리어", "위비티", "씽굿", "콘테스트코리아", "캠퍼스픽", "올콘"]


def cid(it):
    # stable across runs: same title + deadline → same id (used in #/contests?c=)
    return hashlib.sha1(f"{it['title']}|{it['deadline']}".encode()).hexdigest()[:10]


items = []
for it in data["items"]:
    if it["kind"] != "공모전" or str(it["deadline"]) < updated:
        continue
    items.append({
        "id": cid(it),
        "title": it["title"],
        "host": it.get("host") or "",
        "posted": it["posted"],
        "deadline": it["deadline"],
        "target": it.get("target") or "",
        "topic": it["topic"],
        "prize_top": it.get("prize_top"),
        "prize_total": it.get("prize_total"),
        "prize_band": it.get("prize_band") or "",
        "prize_kind": it.get("prize_kind") or "",
        "sites": [{"site": s["site"], "url": s["url"], "posted": s.get("posted") or ""} for s in it["sites"]],
    })

# a site sometimes lists one contest twice: same title + deadline → one row, sites combined
byid = {}
for i in items:
    if i["id"] in byid:
        b = byid[i["id"]]
        b["sites"] += [s for s in i["sites"] if s["url"] not in {z["url"] for z in b["sites"]}]
        for f in ("prize_top", "prize_total"):
            b[f] = b[f] or i[f]
    else:
        byid[i["id"]] = i
items = sorted(byid.values(), key=lambda x: (x["deadline"], x["title"]))
assert len({i["id"] for i in items}) == len(items), "duplicate contest ids"
posted = sorted(i["posted"] for i in items)
doc = {"updated": updated, "from": posted[0], "to": posted[-1], "sources": SITES, "items": items}
Path(out).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n")
print(len(items), "contests ->", out)
