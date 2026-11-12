"""Merged contests → the app's file (src/data/contests.json).

{ updated, from, to, sources, checked, items[] }. Only 공모전 rows, open on `updated` (the app also
hides rows that close later, by the viewer's date). `checked` is each site's last successful
collection, so a site that ran on yesterday's data can be named (design §3.8)."""
import re

# not contests at all: races, meetups, briefings, fairs, hiring
NOT_CONTEST = re.compile(r"마라톤|밋업|설명회|박람회|채용|교육생\s*모집|참여기업\s*모집|서포터즈|기자단|봉사단")
FIELDS = ("id", "title", "host", "posted", "deadline", "target", "who", "topic", "prize_top", "prize_total", "prize_band", "prize_kind", "sites")


def export_doc(contests, today, sources, checked):
    items = [
        {k: c[k] for k in FIELDS}
        for c in contests
        if c["kind"] == "공모전" and c["deadline"] >= today and not NOT_CONTEST.search(c["title"])
    ]
    items.sort(key=lambda x: (x["deadline"], x["title"]))
    posted = sorted(i["posted"] for i in items) or [today]
    return {"updated": today, "from": posted[0], "to": posted[-1], "sources": sources, "checked": checked, "items": items}
