#!/usr/bin/env python3
"""씽굿(thinkcontest.com) 공모전 수집기.
List endpoint: POST /thinkgood/user/contest/subList.do (JSON body), sorted by putup_sdt(등록일) DESC.
Server caps recordsPerPage at 10. Stops once putup_sdt < START.
Usage: python3 thinkcontest_collect.py [START YYYY-MM-DD] [END YYYY-MM-DD]
"""
import json, sys, time, urllib.request, os, re, html

START = sys.argv[1] if len(sys.argv) > 1 else "2026-11-02"
END = sys.argv[2] if len(sys.argv) > 2 else "2026-11-09"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
BASE = "https://www.thinkcontest.com"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "thinkcontest.json")

def fetch(page):
    body = json.dumps({"searchStatus": "Y", "sidx": "putup_sdt", "sord": "DESC",
                       "recordsPerPage": 10, "currentPageNo": page,
                       "contest_field": "", "host_organ": "", "enter_qualified": "", "award_size": ""}).encode()
    req = urllib.request.Request(BASE + "/thinkgood/user/contest/subList.do", data=body, method="POST", headers={
        "User-Agent": UA, "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest", "Referer": BASE + "/thinkgood/user/contest/index.do"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

# ---- prize parsing (shared logic, duplicated in both collectors) ----
_UNITS = {"억": 100_000_000, "천만": 10_000_000, "백만": 1_000_000, "만": 10_000}

def krw(s):
    """First KRW amount in s -> int won, or None. Handles 1,000만원 / 2천만원 / 1억 5천만원 / 20,000,000원."""
    if not s:
        return None
    s = s.replace(",", "").strip()
    if s.isdigit():  # bare number in a site field, e.g. "200000"
        return int(s)
    pats = [
        (r"(\d+(?:\.\d+)?)\s*억(?:\s*(\d+)\s*(천만|만))?\s*원?", "eok"),
        (r"(\d+(?:\.\d+)?)\s*(천만|백만|만)\s*원", "unit"),
        (r"(\d{4,})\s*원", "won"),
    ]
    best = None
    for p, kind in pats:
        m = re.search(p, s)
        if m and (best is None or m.start() < best[0].start()):
            best = (m, kind)
    if not best:
        return None
    m, kind = best
    if kind == "eok":
        v = float(m[1]) * _UNITS["억"]
        if m[2]:
            v += int(m[2]) * _UNITS[m[3]]
        return int(v)
    if kind == "unit":
        return int(float(m[1]) * _UNITS[m[2]])
    return int(m[1])

_MONEY = re.compile(r"\d[\d,]*(?:\.\d+)?\s*(?:억|천만|백만|만)?\s*원")
_BENEFIT = re.compile(r"입사|채용|인턴|서류\s*(?:전형\s*)?(?:면제|가점)|해외\s*(?:탐방|연수)|연수권|장학|라이선스\s*계약|독점\s*라이선스|출간|등단(?:패|인증|식)|상장(?!회사)|상패|장관상")
_AMT = r"(\d[\d,.]*\s*(?:억|천만|백만|만)?\s*(?:\d[\d,]*\s*(?:천만|만)\s*)?원)"
_TOTAL_RES = [
    re.compile(r"총\s*(?:[가-힣]{1,6}\s*)?[:：]?\s*" + _AMT),            # 총상금 1,000만원 / 총 상금: 600만원 / 총 제작지원금 2억 4,000만원
    re.compile(r"총\s*\d+\s*(?:명|팀|점|편|개)[^/]{0,8}?(?:상금|시상금)\s*" + _AMT),  # 총 27점, 상금 1,020만원
]

def prize_lines(lines, limit=5):
    """Pick prize-ish lines (money amounts with award words, or non-cash benefits)."""
    out = []
    for l in lines:
        l = " ".join(l.split())
        if len(l) > 140 or l in out or re.search(r"않|없습니다|없음|불가|자격|사용\s*가능|준수|약관|상장회사", l):
            continue
        has_money = bool(_MONEY.search(l))
        if (has_money and re.search(r"상|등|총|시상|상금|당선|선정|상당", l)) or _BENEFIT.search(l):
            out.append(l)
        if len(out) >= limit:
            break
    return out

def total_from(lines):
    for l in lines:
        for rx in _TOTAL_RES:
            m = rx.search(l)
            if m and krw(m[1]):
                return krw(m[1])
    return None

def top_from(lines):
    for kw in ("대상", "1등", "일등", "그랑프리", "으뜸상", "최우수상", "당선"):
        for l in lines:
            if kw in l and _MONEY.search(l[l.find(kw):]):
                v = krw(l[l.find(kw):])
                if v:
                    return v
    return None
# ---- end prize parsing ----

def syllabus_lines(x):
    t = html.unescape(re.sub(r"<br\s*/?>|</(?:p|div|li|tr)>", "\n", x.get("competition_syllabus") or ""))
    t = re.sub(r"<[^>]+>", "", t)
    return [l.strip() for l in t.split("\n") if l.strip()]

def d(s):
    return s[:10] if s else None

def prize_fields(x):
    title = " ".join((x.get("program_nm") or "").replace("\ufeff", "").split())
    lines = [l for l in syllabus_lines(x) if not (title and title[:20] in " ".join(l.split()))]
    pl = prize_lines(lines)
    site = []
    if x.get("prize_money"): site.append(f"1등 {x['prize_money']}")
    if x.get("award_size_nm"): site.append(f"시상규모 {x['award_size_nm']}")
    if x.get("award_type_nm"): site.append(f"시상유형 {x['award_type_nm']}")
    if x.get("perks_nm"): site.append(f"특전 {x['perks_nm']}")
    return {
        "prize_total_krw": total_from(pl) or total_from(lines),
        "prize_top_krw": krw(x.get("prize_money")) or top_from(pl),
        "prize_text": " / ".join(site + pl) or None,
        "site_category": x.get("contest_field_nm"),
    }

out, page, requests = [], 1, 0
while page <= 1500:
    data = fetch(page); requests += 1
    rows = data.get("listJsonData") or []
    if not rows:
        break
    older = False
    for x in rows:
        posted = d(x.get("putup_sdt"))
        if posted is None:
            continue
        if posted < START:
            older = True
            continue
        if posted > END:
            continue
        out.append({
            "title": (x.get("program_nm") or "").replace("﻿", "").strip(),
            "host": x.get("host_company"),
            "category": x.get("contest_field_nm"),
            "posted": posted,
            "start": d(x.get("accept_dt")),
            "deadline": d(x.get("extend_dt") or x.get("finish_dt")),
            "prize": x.get("prize_money") or x.get("award_size_nm"),
            # 씽굿 prize_money = the site's "1등 시상금" field; total parsed from the 공고 본문.
            **prize_fields(x),
            "target": x.get("enter_qualified_nm"),
            "status": x.get("process_nm"),
            "url": f"{BASE}/thinkgood/user/{x.get('reg_type') or 'contest'}/view.do?contest_pk={x['contest_pk']}",
        })
    if older:
        break
    page += 1
    time.sleep(1.0)

json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(out)} items, {requests} requests -> {OUT}")
