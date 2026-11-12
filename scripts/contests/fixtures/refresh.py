#!/usr/bin/env python3
"""Save fresh fixtures for test_parsers.py: one list page and one detail page per site, trimmed
to what the parsers read (no styles, no scripts except JSON-LD, two rows of each JSON list).

  python3 scripts/contests/fixtures/refresh.py

About fifteen requests, with the same bot name and pace as the daily run."""
import json
import os
import re
import sys
from urllib.parse import urlencode

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

import common  # noqa: E402
from common import Client  # noqa: E402
from sites import allcon, contestkorea, linkareer, thinkcontest, wevity  # noqa: E402


def trim_html(page):
    page = re.sub(r"(?s)<style.*?</style>|<!--.*?-->", "", page)
    page = re.sub(r'(?s)<script(?![^>]*application/ld\+json).*?</script>', "", page)
    return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n", page))


def save(name, text):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
        f.write(text)
    print(f"{name}: {len(text):,} chars")


def between(page, start, end, before=0, after=0):
    """The part of a page from `start` to `end`: notice bodies stay out of the repository."""
    i = page.find(start)
    j = page.find(end, i + 1) if i >= 0 else -1
    if i < 0 or j < 0:
        raise SystemExit(f"layout changed: {start!r} … {end!r} not found")
    return page[max(0, i - before): j + len(end) + after]


def prize_only(text, lines_of):
    """Keep only the prize lines of a notice body, as <br>-separated text."""
    return "<br>".join(common.a_prize_lines(lines_of(text)) or ["상금 없음"])


def main():
    c = Client("fixtures")
    _, page = c.fetch(wevity.LIST.format(1))
    save("wevity_list.html", between(trim_html(page), '<div class="list-area">', "</ul>") if '<div class="list-area">' in page else trim_html(page))
    ix = sorted(wevity.parse_list(page, "2000-01-01"), key=int)[-1]
    _, page = c.fetch(wevity.DETAIL.format(ix))
    page = trim_html(page)
    og = re.search(r'<meta property="og:title"[^>]*>', page)[0]
    poster = re.search(r'<img[^>]*upload/contest/[^>]*>', page)[0]
    save("wevity_detail.html", "\n".join([og, poster, between(page, "직접입력", "홈페이지", before=400)]))

    _, page = c.fetch(contestkorea.LIST.format(1))
    save("contestkorea_list.html", between(trim_html(page), "list_style_2", 'class="pagination"', before=200))
    first = contestkorea.parse_list(page)[0]
    _, page = c.fetch(contestkorea.BASE + first["href"])
    page = trim_html(page)
    end = "접수방법" if "접수방법" in page else "참가비용"
    save("contestkorea_detail.html", between(page, "대표분야", end, before=1500, after=40))

    body = json.dumps({"query": linkareer.QUERY, "variables": {"page": 1, "size": 2}})
    _, text = c.fetch(linkareer.API, data=body, headers=["content-type: application/json"])
    d = json.loads(text)
    for n in d["data"]["activities"]["nodes"]:
        n["detailText"] = {"text": prize_only((n.get("detailText") or {}).get("text"), common.html_lines)}
    save("linkareer_page.json", json.dumps(d, ensure_ascii=False, indent=1))

    rows = thinkcontest.list_page(c, 1)[:2]
    for x in rows:
        x["competition_syllabus"] = "<br>".join(common.b_prize_lines(thinkcontest.syllabus_lines(x)))
    save("thinkcontest_page.json", json.dumps({"listJsonData": rows}, ensure_ascii=False, indent=1))

    _, text = c.fetch(allcon.LIST, data=urlencode({"sortorder": "asc", "page": 1, "sortname": "cl_order", "t": 1, "rows": 15}))
    d = json.loads(text)
    d["rows"] = d["rows"][:2]
    save("allcon_list.json", json.dumps(d, ensure_ascii=False, indent=1))
    _, page = c.fetch(f"{allcon.BASE}/view/contest/{d['rows'][0]['cl_srl']}")
    page = trim_html(page)
    ld = re.search(r'(?s)<script[^>]*application/ld\+json.*?</script>', page)
    save("allcon_detail.html", (ld[0] if ld else "") + "\n" + between(page, ">주최<", "상세내용", before=200, after=10))


if __name__ == "__main__":
    main()
