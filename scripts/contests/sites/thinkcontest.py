"""씽굿: JSON list API, 10 rows a page (the server caps it), sorted by registration date, closed
notices mixed in (70,000 rows in all) and no working filter for open ones or sort by deadline.
Every row already has what we need, so detail pages are never fetched.

Each day: the front pages until two pages in a row bring nothing new, plus one seventh of the
pages down to the oldest open notice (meta.depth), so every known notice is re-read once a week."""
import html
import json
import math
import re

from common import SiteBroken, b_krw, b_prize_lines, b_top, b_total, day, days_from, gone, is_open, upsert

KEY = "thinkcontest"
NAME = "씽굿"
BASE = "https://www.thinkcontest.com"
API = BASE + "/thinkgood/user/contest/subList.do"
QUIET_PAGES = 2
DEFAULT_DEPTH = 330
STALE_DAYS = 15  # an open notice the rotation has not met for this long is taken as gone


def syllabus_lines(x):
    t = html.unescape(re.sub(r"<br\s*/?>|</(?:p|div|li|tr)>", "\n", x.get("competition_syllabus") or ""))
    t = re.sub(r"<[^>]+>", "", t)
    return [l.strip() for l in t.split("\n") if l.strip()]


def d10(s):
    return s[:10] if s else None


def row_of(x):
    title = (x.get("program_nm") or "").replace("﻿", "").strip()
    short = " ".join(title.split())[:20]
    lines = [l for l in syllabus_lines(x) if not (short and short in " ".join(l.split()))]
    pl = b_prize_lines(lines)
    site = []
    if x.get("prize_money"):
        site.append(f"1등 {x['prize_money']}")
    if x.get("award_size_nm"):
        site.append(f"시상규모 {x['award_size_nm']}")
    if x.get("award_type_nm"):
        site.append(f"시상유형 {x['award_type_nm']}")
    if x.get("perks_nm"):
        site.append(f"특전 {x['perks_nm']}")
    return {
        "title": title,
        "host": x.get("host_company"),
        "category": x.get("contest_field_nm"),
        "posted": d10(x.get("putup_sdt")),
        "start": d10(x.get("accept_dt")),
        "deadline": d10(x.get("extend_dt") or x.get("finish_dt")),
        "prize": x.get("prize_money") or x.get("award_size_nm"),
        "prize_total_krw": b_total(pl) or b_total(lines),
        "prize_top_krw": b_krw(x.get("prize_money")) or b_top(pl),
        "prize_text": " / ".join(site + pl) or None,
        "site_category": x.get("contest_field_nm"),
        "target": x.get("enter_qualified_nm"),
        "status": x.get("process_nm"),
        "url": f"{BASE}/thinkgood/user/{x.get('reg_type') or 'contest'}/view.do?contest_pk={x['contest_pk']}",
    }


def list_page(client, n):
    body = json.dumps({"searchStatus": "Y", "sidx": "putup_sdt", "sord": "DESC", "recordsPerPage": 10, "currentPageNo": n,
                       "contest_field": "", "host_organ": "", "enter_qualified": "", "award_size": ""})
    status, text = client.fetch(API, data=body, headers=["Content-Type: application/json; charset=UTF-8"])
    if status != 200:
        raise SiteBroken(f"list page {n}: HTTP {status}")
    try:
        return json.loads(text).get("listJsonData") or []
    except ValueError:
        raise SiteBroken(f"list page {n}: not JSON")


def probe(client):
    return f"first page {len(list_page(client, 1))} rows"


def collect(client, records, meta, today, stats, full=False):
    depth = int(meta.get("depth") or DEFAULT_DEPTH)
    seen, deepest = set(), 0

    def read(n):
        """Store the page's rows; returns (rows, new open notices, open notices)."""
        nonlocal deepest
        rows = list_page(client, n)
        fresh = opened = 0
        for x in rows:
            if not x.get("contest_pk") or not x.get("putup_sdt"):
                continue
            sid = str(x["contest_pk"])
            row = row_of(x)
            open_now = (row["deadline"] or "") >= today
            if open_now:
                deepest = max(deepest, n)
                opened += 1
            if sid in seen:
                continue
            seen.add(sid)
            if sid in records or open_now:
                fresh += open_now and sid not in records
                upsert(records, sid, row, today, stats)
        return rows, fresh, opened

    read_pages = set()
    if full:
        quiet = 0
        for n in range(1, 1600):
            rows, _, opened = read(n)
            read_pages.add(n)
            if not rows:
                break
            quiet = 0 if opened else quiet + 1
            if quiet >= 30:  # 300 rows in a row with nothing open: past the oldest open notice
                break
        meta["depth"] = deepest + 3
    else:
        quiet = 0
        for n in range(1, 40):
            rows, fresh, _ = read(n)
            read_pages.add(n)
            if n == 1 and not rows:
                raise SiteBroken("first list page is empty")
            quiet = 0 if fresh else quiet + 1
            if quiet >= QUIET_PAGES:
                break
        # this week's slice of the deeper pages; new notices push rows down a few pages a day,
        # so the slices overlap a little
        size = math.ceil(depth / 7) + 3
        k = day(today).toordinal() % 7
        last_slice = k == 6
        for n in range(max(1, k * (size - 3)), min(depth + 3, k * (size - 3) + size) + 1):
            if n in read_pages:
                continue
            rows, _, _ = read(n)
            read_pages.add(n)
            if not rows:
                break
        if last_slice and deepest:
            meta["depth"] = max(deepest + 3, 20)
    stats["listed"] = len(seen)
    stats["pages"] = len(read_pages)
    for sid, rec in records.items():
        if sid not in seen and is_open(rec, today) and rec.get("last_seen") and days_from(rec["last_seen"], today) > STALE_DAYS:
            gone(records, sid, today, stats)
            rec["missing"] = max(rec["missing"], 2)
