"""Build the 공모전 tab mockup (static HTML, real data) from a merged contests JSON.

usage: python3 build_mockup.py ../contests_2026-11-02_09.json ../mockup_contests.html 2026-11-09
"""
import json
import sys
from pathlib import Path

src, out, today = sys.argv[1], sys.argv[2], sys.argv[3]
data = json.loads(Path(src).read_text())

items = []
for i, it in enumerate(data["items"]):
    if it["kind"] != "공모전" or str(it["deadline"]) < today:
        continue
    items.append({
        "id": i,
        "t": it["title"],
        "h": it.get("host") or "",
        "p": it["posted"],
        "d": it["deadline"],
        "tg": it.get("target") or "",
        "top": it.get("prize_top"),
        "tot": it.get("prize_total"),
        "band": it.get("prize_band") or "",
        "pk": it.get("prize_kind") or "",
        "topic": it["topic"],
        "sites": [[s["site"], s["url"], s.get("posted") or ""] for s in it["sites"]],
    })

tpl = (Path(__file__).parent / "mockup_template.html").read_text()
html = tpl.replace("/*__DATA__*/null", json.dumps(items, ensure_ascii=False)).replace("__TODAY__", today)
Path(out).write_text(html)
print(len(items), "items ->", out)
