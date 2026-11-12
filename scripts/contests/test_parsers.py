#!/usr/bin/env python3
"""Parsers against saved responses (fixtures/), and the merge and bookkeeping rules. No network.

  python3 scripts/contests/test_parsers.py

Refresh a fixture with scripts/contests/fixtures/refresh.py when a site changes its layout on
purpose, then check that these tests still describe what the app needs."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from common import DATE_RE, new_stats, plus_days, recheck_due, upsert, valid_deadline  # noqa: E402
from merge import merge  # noqa: E402
from sites import NAMES, allcon, contestkorea, linkareer, thinkcontest, wevity  # noqa: E402

FIX = os.path.join(HERE, "fixtures")
TODAY = "2026-11-12"  # the day the fixtures were saved
failures = []


def check(name, cond, detail=""):
    if not cond:
        failures.append(f"{name} {detail}")
    print(("ok   " if cond else "FAIL ") + name + (f" — {detail}" if detail and not cond else ""))


def fx(name):
    return open(os.path.join(FIX, name), encoding="utf-8").read()


def dated(d):
    return bool(d and DATE_RE.match(d))


# ---------- sites ----------

lst = wevity.parse_list(fx("wevity_list.html"), TODAY)
check("wevity list: a page of notices", len(lst) >= 15, str(len(lst)))
check("wevity list: D-day becomes a deadline", sum(1 for d in lst.values() if d) >= 10)
d = wevity.parse_detail(fx("wevity_detail.html"), "1")
check("wevity detail parses", bool(d), "layout changed?")
if d:
    check("wevity detail: title, host, dates", d["title"] and d["host"] and dated(d["posted"]) and dated(d["deadline"]), str(d)[:200])

rows = contestkorea.parse_list(fx("contestkorea_list.html"))
check("contestkorea list: 12 rows", len(rows) == 12, str(len(rows)))
check("contestkorea list: title and period", all(r["title"] and dated(r["deadline"]) for r in rows[:5]), str(rows[:1])[:200])
d = contestkorea.parse_detail(fx("contestkorea_detail.html"))
check("contestkorea detail parses", bool(d), "layout changed?")
if d:
    check("contestkorea detail: host and dates", d["host"] and dated(d["deadline"]), str(d)[:200])

nodes = json.loads(fx("linkareer_page.json"))["data"]["activities"]["nodes"]
r = linkareer.row_of(nodes[0])
check("linkareer node → row", r["title"] and dated(r["posted"]) and dated(r["deadline"]) and r["url"].startswith("https://linkareer.com/activity/"), str(r)[:200])

tg = json.loads(fx("thinkcontest_page.json"))["listJsonData"]
r = thinkcontest.row_of(tg[0])
check("thinkcontest row", r["title"] and dated(r["posted"]) and dated(r["deadline"]) and "contest_pk=" in r["url"], str(r)[:200])

ac = json.loads(fx("allcon_list.json"))
r = allcon.parse_row(ac["rows"][0])
check("allcon list row", r["sid"] and r["title"] and dated(r["deadline"]), str(r)[:200])
posted, info, body = allcon.parse_detail(fx("allcon_detail.html"))
check("allcon detail: posting date and host", dated(posted) and info.get("주최"), f"{posted} {info}"[:200])

# ---------- dates and bookkeeping ----------

check("deadline checks", [valid_deadline(x, TODAY) for x in ("2026-11-30", "2026-11-11", "0202-06-21", "2029-01-01", "", "2026-13-01")]
      == ["ok", "closed", "closed", "bad", "bad", "bad"])
check("recheck: two days before the deadline", recheck_due("x", {"deadline": plus_days(TODAY, 2), "last_checked": plus_days(TODAY, -1)}, TODAY))
check("recheck: not twice a day", not recheck_due("x", {"deadline": plus_days(TODAY, 2), "last_checked": TODAY}, TODAY))
check("recheck: a week without one", recheck_due("x", {"deadline": plus_days(TODAY, 60), "last_checked": plus_days(TODAY, -9)}, TODAY))
weekly = sum(recheck_due(str(i), {"deadline": plus_days(TODAY, 60), "last_checked": plus_days(TODAY, -1)}, TODAY) for i in range(700))
check("recheck: about a seventh of the far ones each day", 60 <= weekly <= 140, str(weekly))

recs, st = {}, new_stats()
upsert(recs, "1", {"title": "A", "deadline": "2026-11-20"}, TODAY, st)
upsert(recs, "1", {"title": "A", "deadline": "2026-11-27"}, plus_days(TODAY, 1), st)
check("upsert: extension recorded", recs["1"]["extended_from"] == "2026-11-20" and st["new"] == 1 and st["extended"] == 1, str(recs))

# ---------- merge ----------


def row(site, sid, title, deadline, host="주최", posted="2026-11-01"):
    return {"site": site, "sid": sid, "title": title, "deadline": deadline, "host": host, "posted": posted, "url": f"https://{site}/{sid}", "target": "누구나", "prize_text": "대상 300만원"}


order = [s for s in NAMES]
reg = {"wevity:1": "keepme0001"}
cs, ent = merge({"wevity": [row("wevity", "1", "제3회 바다 사진 공모전 (마감 연장)", "2026-12-05")],
                 "linkareer": [row("linkareer", "9", "제3회 바다 사진 공모전", "2026-12-05")]}, reg, order, NAMES)
check("merge: a known notice keeps its id after title and deadline changes", [c["id"] for c in cs] == ["keepme0001"], str([(c["id"], c["title"]) for c in cs]))
check("merge: a new notice joins it", ent.get("linkareer:9") == "keepme0001")
cs, _ = merge({"wevity": [row("wevity", "1", "2026 서울 도시건축 아이디어 공모전", "2026-12-20", host="서울특별시")],
               "thinkcontest": [row("thinkcontest", "5", "2026 서울 도시건축 아이디어 공모전", "2026-11-30", host="서울특별시")]}, {}, order, NAMES)
check("merge: same host, near-identical title, deadlines apart → one row, earliest deadline", len(cs) == 1 and cs[0]["deadline"] == "2026-11-30", str([(c["title"], c["deadline"]) for c in cs]))
cs, _ = merge({"wevity": [row("wevity", "1", "제5회 청년 창업 아이디어 공모전", "2026-12-20", host="부산시")],
               "allcon": [row("allcon", "2", "제5회 청년 창업 아이디어 공모전", "2026-11-30", host="대구시")]}, {}, order, NAMES)
check("merge: different hosts and deadlines stay apart", len(cs) == 2, str([(c["title"], c["host"]) for c in cs]))

print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
