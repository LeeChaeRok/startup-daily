"""Export merged contests to the app's data file (src/data/contests.json).

usage: python3 export_app.py ../contests_2026-11-02_09.json ../../../src/data/contests.json 2026-11-09

Only 공모전 rows are exported; rows already closed on <updated> are dropped
(the app also hides rows that close later, by the viewer's date).
"""
import hashlib
import re
import json
import sys
from pathlib import Path

src, out, updated = sys.argv[1], sys.argv[2], sys.argv[3]
data = json.loads(Path(src).read_text())

SITES = ["링커리어", "위비티", "씽굿", "콘테스트코리아", "캠퍼스픽", "올콘"]


# 참가 대상 → groups the app filters on. "any" = open to everyone; [] = not stated.
WHO = [
    ("any", r"제한\s*없|누구나|전\s*국민|전\s*연령|연령\s*무관"),
    ("kid", r"유치원|어린이|초등|아동"),
    ("teen", r"청소년|중학|고등학|고교"),
    ("univ", r"대학|학부|재학생|휴학생"),
    ("adult", r"일반인|직장인|성인|만\s*1[89]\s*세\s*이상|창업|입사|시민|국민|주민|도민|구민|군민"),
]


def who(texts):
    t = " ".join(texts)
    keys = [k for k, rx in WHO if re.search(rx, t)]
    return ["any"] if "any" in keys else keys


def best_target(texts):
    # the most specific wording: skip bare "기타"/"제한없음", prefer the longest that fits
    good = [t for t in texts if t and not re.fullmatch(r"\s*(기타|제한\s*없음|대상 제한 없음)(,\s*기타)?\s*", t)]
    return max(good, key=len)[:80] if good else (texts[0] if texts else "")


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
        "target": best_target(it.get("targets") or [it.get("target") or ""]),
        "who": who(it.get("targets") or [it.get("target") or ""]),
        "topic": it["topic"],
        "prize_top": it.get("prize_top"),
        "prize_total": it.get("prize_total"),
        "prize_band": it.get("prize_band") or "",
        "prize_kind": it.get("prize_kind") or "",
        "sites": [{"site": s["site"], "url": s["url"], "posted": s.get("posted") or ""} for s in it["sites"]],
    })

# not contests at all: races, meetups, briefings, fairs, hiring
NOT_CONTEST = re.compile(r"마라톤|밋업|설명회|박람회|채용|교육생\s*모집|참여기업\s*모집|서포터즈|기자단|봉사단")
items = [i for i in items if not NOT_CONTEST.search(i["title"])]


def norm_title(t):
    # "[보건복지부] 2026 청년 e-Room 공모전 참가자 모집" ≈ "보건복지부 2026 청년e-Room 공모전"
    t = re.sub(r"(참가자|참여자|작품|응모작|아이디어)?\s*(모집|접수)(\s*안내)?\s*$", "", t.strip())
    return re.sub(r"[\s\[\]()（）「」『』<>〈〉《》'\"“”‘’·:,._\-~!?]", "", t).lower()


# one contest listed twice (by one site, or by two under slightly different titles):
# same normalized title + deadline → one row, sites combined
byid = {}
for i in items:
    key = (norm_title(i["title"]), i["deadline"])
    if key in byid:
        b = byid[key]
        b["sites"] += [s for s in i["sites"] if s["url"] not in {z["url"] for z in b["sites"]}]
        for f in ("prize_top", "prize_total"):
            b[f] = b[f] or i[f]
        if not b["host"]:
            b["host"] = i["host"]
        if len(i["target"]) > len(b["target"]):
            b["target"] = i["target"]
        b["who"] = b["who"] if "any" in b["who"] else sorted(set(b["who"]) | set(i["who"])) if "any" not in i["who"] else ["any"]
    else:
        byid[key] = i
# second pass: same deadline and one title contains the other ("[식약처] 식중독 … 공모전" ⊃ "식중독 … 공모전")
rows = sorted(byid.values(), key=lambda x: -len(norm_title(x["title"])))
kept = []
for i in rows:
    k = norm_title(i["title"])
    host = next((b for b in kept if b["deadline"] == i["deadline"] and len(k) >= 8 and k in norm_title(b["title"])), None)
    if not host:
        kept.append(i)
        continue
    host["sites"] += [z for z in i["sites"] if z["url"] not in {y["url"] for y in host["sites"]}]
    for f in ("prize_top", "prize_total"):
        host[f] = host[f] or i[f]
    host["host"] = host["host"] or i["host"]
byid = {i["id"]: i for i in kept}
for i in byid.values():
    i["sites"].sort(key=lambda z: z["posted"] or "9")
items = sorted(byid.values(), key=lambda x: (x["deadline"], x["title"]))
assert len({i["id"] for i in items}) == len(items), "duplicate contest ids"
posted = sorted(i["posted"] for i in items)
doc = {"updated": updated, "from": posted[0], "to": posted[-1], "sources": SITES, "items": items}
Path(out).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n")
print(len(items), "contests ->", out)
