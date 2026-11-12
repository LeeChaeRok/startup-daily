"""위비티: list pages, 15 rows a page, newest first. Each row shows its D-day: "D-9 접수중" while
open, "D+9 마감" once closed (closed notices go on for hundreds of pages). Read from the front
until five pages in a row have no open row; a detail page only for a new open notice, one whose
D-day no longer matches the stored deadline, or one due for its re-check. Known open notices
further down are re-read on the recheck schedule.
Posting date = the poster's upload timestamp on the detail page."""
import html
import re

from common import DATE_RE, SiteBroken, days_from, gone, is_open, kst_today, no_scripts, plus_days, recheck_due, saw, txt, unparsed, upsert

KEY = "wevity"
NAME = "위비티"
LIST = "https://www.wevity.com/?c=find&s=1&gub=1&gp={}"
DETAIL = "https://www.wevity.com/?c=find&s=1&gbn=view&ix={}"
DETAIL_RE = re.compile(
    r"직접입력 (.*) 조회수 : [\d,]+ 분야 (.*?) 응모대상 (.*?) 주최/주관 (.*?) 후원/협찬 ?(.*?) 접수기간 (\S+) ~ (\S+) .*?총 상금 ?(.*?) ?1등 상금 ?(.*?) ?홈페이지"
)
QUIET_PAGES = 5


def parse_list(page, today):
    """{ix: (deadline from the D-day, open?)} for the rows of one list page. The SPECIAL (paid)
    banners repeated on every page are left out: they are also ordinary rows somewhere."""
    out = {}
    for chunk in re.findall(r"<li\b(.*?)</li>", page, re.S):
        ids = re.findall(r"ix=(\d+)", chunk)
        if not ids or ids[0] in out or 'class="day"' not in chunk:
            continue
        t = txt(chunk)
        m = re.search(r"D([-+])(\d+)", t)
        if m:
            n = int(m[2])
            out[ids[0]] = (plus_days(today, n if m[1] == "-" else -n), m[1] == "-")
        elif re.search(r"D-?day|오늘\s*마감", t, re.I):
            out[ids[0]] = (today, True)
    return out


def parse_detail(page, ix):
    up = re.search(r"upload/contest/(\d{4})(\d{2})(\d{2})", page)
    s = txt(no_scripts(page))
    m = DETAIL_RE.search(s)
    if not up or not m:
        return None
    og = re.search(r'property="og:title" content="([^"]+)"', page)
    total, top = m[8].strip(), m[9].strip()
    return {
        "title": html.unescape(og[1]) if og else m[1][-80:],
        "site_category": m[2],
        "target": m[3],
        "host": m[4].strip(" /"),
        "sponsor": m[5].strip(),
        "posted": f"{up[1]}-{up[2]}-{up[3]}",
        "start": m[6].replace(".", "-"),
        "deadline": m[7].replace(".", "-"),
        "prize_text": " / ".join(x for x in [f"총상금 {total}" if total else "", f"1등 {top}" if top else ""] if x),
        "url": DETAIL.format(ix),
    }


def list_page(client, n, today):
    status, page = client.fetch(LIST.format(n))
    if status != 200:
        raise SiteBroken(f"list page {n}: HTTP {status}")
    return parse_list(page, today)


def probe(client):
    rows = list_page(client, 1, kst_today())
    return f"first page {len(rows)} rows, {sum(1 for _, o in rows.values() if o)} open"


def detail(client, records, ix, today, stats, listed_deadline=None):
    status, page = client.fetch(DETAIL.format(ix), missing_ok=True)
    row = parse_detail(page, ix) if status == 200 else None
    if row:
        upsert(records, ix, row, today, stats)
    elif ix in records and not records[ix].get("unparsed"):
        gone(records, ix, today, stats)
    elif status == 200:
        unparsed(records, ix, today, stats, deadline=listed_deadline, url=DETAIL.format(ix))


def moved(listed, stored):
    """The list's D-day says another deadline (a day of slack: D-day is counted on the site's clock)."""
    if not listed or not stored or not DATE_RE.match(stored):
        return False
    return abs(days_from(stored, listed)) > 1


def collect(client, records, meta, today, stats, full=False):
    rows, quiet = {}, 0
    for n in range(1, 400 if full else 120):
        found = list_page(client, n, today)
        if n == 1 and not found:
            raise SiteBroken("first list page has no rows")
        fresh = {ix: v for ix, v in found.items() if ix not in rows}
        if not fresh:
            break  # past the last page the site repeats what it already showed
        rows.update(fresh)
        quiet = 0 if any(op for _, op in fresh.values()) else quiet + 1
        if quiet >= QUIET_PAGES:
            break
    stats["listed"] = len(rows)
    for ix, (dl, op) in sorted(rows.items(), key=lambda kv: -int(kv[0])):
        rec = records.get(ix)
        if not op:
            # closed on the site: take the date, never fetch the detail
            if rec and is_open(rec, today):
                upsert(records, ix, {"deadline": dl}, today, stats)
            continue
        if full or rec is None:
            detail(client, records, ix, today, stats, dl)
        elif rec.get("unparsed"):
            if recheck_due(ix, rec, today):
                detail(client, records, ix, today, stats, dl)
            else:
                saw(records, ix, today)
        elif moved(dl, rec.get("deadline")) or recheck_due(ix, rec, today):
            stats["rechecked"] += 1
            detail(client, records, ix, today, stats, dl)
        else:
            saw(records, ix, today)
            rec["last_checked"] = today  # the D-day just confirmed the deadline
    # known open notices further down the list: re-read on the schedule
    for ix, rec in list(records.items()):
        if ix not in rows and is_open(rec, today) and recheck_due(ix, rec, today):
            stats["rechecked"] += 1
            detail(client, records, ix, today, stats)
