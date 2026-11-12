"""올콘: JSON list of the open 대학생·일반인 contests (15 a page, about 12 pages), each row with
its period. The whole list is read every day; a detail page (posting date from JSON-LD, host,
target, 시상내역) only for new notices.

all-con.co.kr sends an incomplete certificate chain; common.ca_bundle() adds the intermediates
on Linux. Verification is never turned off."""
import html
import json
import re
from urllib.parse import urlencode

from common import SiteBroken, b_prize_lines, b_top, b_total, gone, is_open, no_scripts, recheck_due, saw, unparsed, upsert

KEY = "allcon"
NAME = "올콘"
BASE = "https://www.all-con.co.kr"
LIST = BASE + "/page/ajax.contest_list.php"
LABELS = ("주최", "주관", "접수기간", "분야", "응모대상", "시상내역")


def strip(s):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s or "")).split())


def yy(s):  # "26.11.02" -> "2026-11-02"
    m = re.match(r"(\d{2})\.(\d{2})\.(\d{2})", (s or "").strip())
    return f"20{m[1]}-{m[2]}-{m[3]}" if m else None


def parse_row(r):
    dates = (r.get("cl_date") or "").split("~")
    badges = [html.unescape(b) for b in re.findall(r'class="badge cl_cate">([^<]+)<', r.get("cl_cate", ""))]
    return {
        "sid": str(r["cl_srl"]),
        "title": re.sub(r"\s*N\s*새글\s*$", "", strip(r.get("cl_title"))),  # the "new" badge
        "host": strip(r.get("cl_host")),
        "start": yy(dates[0]) if dates and dates[0] else None,
        "deadline": yy(dates[1]) if len(dates) > 1 else None,
        "badges": badges,
        "pinned": r.get("cl_is_star") == "1",
    }


def parse_detail(page):
    pub = re.search(r'"datePublished"\s*:\s*"([^"]+)"', page)
    lines = [l.strip() for l in html.unescape(re.sub(r"<[^>]+>", "\n", no_scripts(page))).split("\n") if l.strip()]
    info = {}
    for key in LABELS:
        if key in lines:
            i = lines.index(key)
            nxt = lines[i + 1] if i + 1 < len(lines) else ""
            if nxt not in LABELS + ("접수처",):
                info[key] = nxt
    body = lines[lines.index("상세내용") + 1:] if "상세내용" in lines else []
    return (pub[1][:10] if pub else None), info, body


def list_page(client, n):
    status, text = client.fetch(LIST, data=urlencode({"sortorder": "asc", "page": n, "sortname": "cl_order", "t": 1, "rows": 15}))
    if status != 200:
        raise SiteBroken(f"list page {n}: HTTP {status}")
    try:
        return json.loads(text)
    except ValueError:
        raise SiteBroken(f"list page {n}: not JSON")


def probe(client):
    d = list_page(client, 1)
    return f"first page {len(d.get('rows') or [])} rows, {d.get('totalPage')} pages"


def row_from(r, posted, info, body):
    plines = b_prize_lines(([info["시상내역"]] if info.get("시상내역") else []) + body, limit=6)
    plines = [l for l in plines if r["title"][:20] not in l]
    return {
        "title": r["title"],
        "host": info.get("주최") or r["host"],
        "category": info.get("분야") or (r["badges"][0] if r["badges"] else None),
        "posted": posted,
        "start": r["start"],
        "deadline": r["deadline"],
        "prize": info.get("시상내역"),
        "target": info.get("응모대상") or ", ".join(r["badges"][1:]) or None,
        "prize_total_krw": b_total(plines) or b_total(body),
        "prize_top_krw": b_top(plines) or b_top(body),
        "prize_text": " / ".join(plines) or info.get("시상내역"),
        "site_category": info.get("분야") or (r["badges"][0] if r["badges"] else None),
        "pinned_ad": r["pinned"],
        "url": f"{BASE}/view/contest/{r['sid']}",
    }


def collect(client, records, meta, today, stats, full=False):
    first = list_page(client, 1)
    pages = int(first.get("totalPage") or 1)
    if not first.get("rows"):
        raise SiteBroken("first list page is empty")
    listed = {}
    for n in range(1, min(pages, 40) + 1):
        d = first if n == 1 else list_page(client, n)
        for r in d.get("rows") or []:
            if r.get("cl_srl"):
                row = parse_row(r)
                listed.setdefault(row["sid"], row)
    stats["listed"] = len(listed)
    for sid, r in listed.items():
        rec = records.get(sid)
        if rec is None or full or (rec.get("unparsed") and recheck_due(sid, rec, today)):
            status, page = client.fetch(f"{BASE}/view/contest/{sid}", missing_ok=True)
            posted, info, body = parse_detail(page) if status == 200 else (None, {}, [])
            if posted:
                upsert(records, sid, row_from(r, posted, info, body), today, stats)
            else:
                unparsed(records, sid, today, stats, deadline=r["deadline"], url=f"{BASE}/view/contest/{sid}")
        elif rec.get("unparsed"):
            saw(records, sid, today)
        else:
            # the list carries the period, title and host: enough to catch an extension
            upsert(records, sid, {"title": r["title"] or rec.get("title"), "start": r["start"], "deadline": r["deadline"]}, today, stats)
    for sid, rec in records.items():
        if sid not in listed and is_open(rec, today):
            gone(records, sid, today, stats)
