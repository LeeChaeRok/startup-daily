"""콘테스트코리아: list HTML, 12 a page, newest first, closed notices included (3,600 pages in
all), each row with its 접수 period. Read from the front until three pages in a row bring no
new open notice; a detail page (host, target, period, 시상내역) only for new ones. Known
notices take a changed period from the list, and are re-read on the recheck schedule.
Posting date = the first 8 digits of str_no."""
import html
import re

from common import SiteBroken, gone, is_open, no_scripts, recheck_due, saw, txt, upsert

KEY = "contestkorea"
NAME = "콘테스트코리아"
BASE = "https://www.contestkorea.com/sub/"
LIST = (
    BASE + "list.php?displayrow=12&int_gbn=1&Txt_sGn=1&Txt_key=all&Txt_word=&Txt_bcode=&Txt_code1=&Txt_aarea=&Txt_area="
    "&Txt_sortkey=a.int_sort&Txt_sortword=desc&Txt_ahost=&Txt_host=&Txt_award=&Txt_award2=&Txt_code3=&Txt_tipyn="
    "&Txt_comment=&Txt_resultyn=&Txt_actcode=&page={}"
)
QUIET_PAGES = 3  # stop after this many list pages in a row without a new open notice


def parse_list(page):
    """[{sn, href, category, title, start, deadline}] for one list page."""
    body = page[page.find("list_style_2"): page.find('class="pagination"')]
    rows = []
    for li in re.split(r'<div class="title">', body)[1:]:
        m = re.search(r'href="(view\.php[^"]*str_no=(\d+))"', li)
        if not m:
            continue
        sn = m[2]
        cat = re.search(r'class="category">(.*?)</span>', li, re.S)
        title = re.search(r'class="txt">(.*?)</span>', li, re.S)
        dd = re.search(r"접수\s*(\d\d)\.(\d\d)~(\d\d)\.(\d\d)", txt(li))
        start = deadline = None
        if dd:
            y = int(sn[:4])
            # 접수 11.20~01.10 posted in 2026 closes in 2027; a period that began the year before
            # posting (12.15~01.31 posted in January) started a year earlier
            sy = y - 1 if (dd[1], dd[2]) > (sn[4:6], sn[6:8]) and int(dd[1]) - int(sn[4:6]) > 6 else y
            start = f"{sy}-{dd[1]}-{dd[2]}"
            ey = sy + (1 if (dd[3], dd[4]) < (dd[1], dd[2]) else 0)
            deadline = f"{ey}-{dd[3]}-{dd[4]}"
        rows.append({
            "sn": sn,
            "href": html.unescape(m[1]),
            "category": txt(cat[1]) if cat else "",
            "title": txt(title[1]) if title else "",
            "start": start,
            "deadline": deadline,
        })
    return rows


def parse_detail(page):
    s = txt(no_scripts(page))
    k = s.find(" 대표분야 ")
    if k < 0:
        return None
    s = s[max(0, k - 200):]  # the menu above also says 주최.주관

    def f(a, b):
        m = re.search(re.escape(a) + r" (.*?) (?:" + b + ")", s)
        return m[1] if m else None

    st, _, en = (f("접수기간", "심사기간|대회지역|시상내역") or "").partition(" ~ ")
    if not en:
        return None
    return {
        "host": (f("주최 . 주관", "대표분야") or "").strip(),
        "target": f("참가대상", "접수기간"),
        "start": st.replace(".", "-"),
        "deadline": en.replace(".", "-"),
        "prize_text": f("시상내역", "접수방법|참가비용") or "",
    }


def list_page(client, n):
    status, page = client.fetch(LIST.format(n))
    if status != 200:
        raise SiteBroken(f"list page {n}: HTTP {status}")
    return parse_list(page)


def probe(client):
    return f"first page {len(list_page(client, 1))} rows"


def read_detail(client, records, sid, url, today, stats, base=None):
    status, page = client.fetch(url, missing_ok=True)
    row = parse_detail(page) if status == 200 else None
    if row:
        upsert(records, sid, {**(base or {}), **row}, today, stats)
    elif sid in records:
        gone(records, sid, today, stats)


def collect(client, records, meta, today, stats, full=False):
    seen, quiet = set(), 0
    for n in range(1, 4000 if full else 120):
        rows = list_page(client, n)
        if not rows:
            if n == 1:
                raise SiteBroken("first list page has no rows")
            break
        fresh = 0
        for r in rows:
            sid = r["sn"]
            if sid in seen:
                continue
            seen.add(sid)
            if r["deadline"] and r["deadline"] < today:
                continue
            url = BASE + r["href"]
            rec = records.get(sid)
            if rec is None or full:
                fresh += 1
                base = {"title": r["title"], "site_category": r["category"], "posted": f"{sid[:4]}-{sid[4:6]}-{sid[6:8]}", "url": url}
                read_detail(client, records, sid, url, today, stats, base)
            else:
                if r["deadline"] and r["deadline"] != rec.get("deadline"):
                    upsert(records, sid, {"start": r["start"] or rec.get("start"), "deadline": r["deadline"], "title": r["title"] or rec.get("title")}, today, stats)
                else:
                    saw(records, sid, today)
                    rec["last_checked"] = today  # the list just confirmed its period
        quiet = 0 if fresh else quiet + 1
        if quiet >= QUIET_PAGES and not full:
            break
        if full and all(r["deadline"] and r["deadline"] < today for r in rows):
            quiet += 1
            if quiet >= 20:
                break
    stats["listed"] = len(seen)
    # known open notices further down the list: re-read their detail page on the schedule
    for sid, rec in list(records.items()):
        if sid not in seen and is_open(rec, today) and recheck_due(sid, rec, today):
            stats["rechecked"] += 1
            read_detail(client, records, sid, rec["url"], today, stats)
