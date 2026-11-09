#!/usr/bin/env python3
"""올콘(all-con.co.kr) 공모전 수집기.
List endpoint: POST /page/ajax.contest_list.php (form: sortname=cl_order&sortorder=asc&page=N&t=1&rows=15).
The list rows carry no registration date, so each item's detail page (/view/contest/<cl_srl>) is fetched
and its JSON-LD "datePublished" is used as the posting date. Non-pinned rows are ordered by cl_srl DESC
(newest first); we stop after STOP_AFTER consecutive non-pinned items published before START.
Usage: python3 allcon_collect.py [START] [END] [t]   (t=1 대학생·일반인 공모전, t=3 청소년)
"""
import json, re, sys, time, html, os, subprocess, urllib.parse

START = sys.argv[1] if len(sys.argv) > 1 else "2026-11-02"
END = sys.argv[2] if len(sys.argv) > 2 else "2026-11-09"
T = sys.argv[3] if len(sys.argv) > 3 else "1"
STOP_AFTER = 4
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
BASE = "https://www.all-con.co.kr"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "allcon.json" if T == "1" else f"allcon_t{T}.json")
nreq = 0

def get(url, data=None, xhr=False):
    # curl is used (not urllib) because all-con.co.kr serves an incomplete TLS chain that
    # Python's default CA bundle rejects; system curl validates it fine.
    global nreq
    cmd = ["curl", "-sS", "--fail", "-m", "20", "-A", UA, "-e", f"{BASE}/list/contest/{T}/1"]
    if xhr:
        cmd += ["-H", "X-Requested-With: XMLHttpRequest"]
    if data:
        cmd += ["-X", "POST", "--data", urllib.parse.urlencode(data)]
    body = subprocess.run(cmd + [url], capture_output=True, check=True).stdout.decode("utf-8", "replace")
    nreq += 1
    time.sleep(1.0)
    return body

def strip(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s or "")).split() and " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split())

def yy(s):  # "26.11.02" -> "2026-11-02"
    m = re.match(r"(\d{2})\.(\d{2})\.(\d{2})", s.strip())
    return f"20{m[1]}-{m[2]}-{m[3]}" if m else None

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

def detail(srl):
    t = get(f"{BASE}/view/contest/{srl}")
    pub = re.search(r'"datePublished"\s*:\s*"([^"]+)"', t)
    text = re.sub(r"(?s)<script.*?</script>|<style.*?</style>", "", t)
    lines = [l.strip() for l in html.unescape(re.sub(r"<[^>]+>", "\n", text)).split("\n") if l.strip()]
    info = {}
    for key in ("주최", "주관", "접수기간", "분야", "응모대상", "시상내역"):
        if key in lines:
            i = lines.index(key)
            nxt = lines[i + 1] if i + 1 < len(lines) else ""
            if nxt not in ("주최", "주관", "접수기간", "분야", "응모대상", "시상내역", "접수처"):
                info[key] = nxt
    body = lines[lines.index("상세내용") + 1:] if "상세내용" in lines else []
    info["_prize_lines"] = prize_lines(([info["시상내역"]] if info.get("시상내역") else []) + body, limit=6)
    info["_body"] = body
    return (pub[1][:10] if pub else None), info

out, seen, page, old_run, done = [], set(), 1, 0, False
while not done and page <= 15:
    d = json.loads(get(f"{BASE}/page/ajax.contest_list.php",
                       {"sortorder": "asc", "page": page, "sortname": "cl_order", "t": T, "rows": 15}, xhr=True))
    rows = d.get("rows") or []
    if not rows:
        break
    for r in rows:
        srl = r.get("cl_srl")
        if not srl or srl in seen:
            continue
        seen.add(srl)
        pinned = r.get("cl_is_star") == "1"
        posted, info = detail(srl)
        badges = [html.unescape(b) for b in re.findall(r'class="badge cl_cate">([^<]+)<', r.get("cl_cate", ""))]
        dates = (r.get("cl_date") or "").split("~")
        if posted and START <= posted <= END:
            ttl = strip(r.get("cl_title")) or ""
            info["_prize_lines"] = [l for l in info["_prize_lines"] if ttl[:20] not in l]
            out.append({
                "title": strip(r.get("cl_title")),
                "host": info.get("주최") or strip(r.get("cl_host")),
                "category": info.get("분야") or (badges[0] if badges else None),
                "posted": posted,
                "start": yy(dates[0]) if dates and dates[0] else None,
                "deadline": yy(dates[1]) if len(dates) > 1 else None,
                "prize": info.get("시상내역"),
                "target": info.get("응모대상") or ", ".join(badges[1:]) or None,
                "prize_total_krw": total_from(info["_prize_lines"]) or total_from(info["_body"]),
                "prize_top_krw": top_from(info["_prize_lines"]) or top_from(info["_body"]),
                "prize_text": " / ".join(info["_prize_lines"]) or info.get("시상내역"),
                "site_category": info.get("분야") or (badges[0] if badges else None),
                "pinned_ad": pinned,
                "url": f"{BASE}/view/contest/{srl}",
            })
        if not pinned:
            old_run = old_run + 1 if (posted and posted < START) else 0
            if old_run >= STOP_AFTER:
                done = True
                break
    if page >= int(d.get("totalPage") or 1):
        break
    page += 1

json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(out)} items, {nreq} requests -> {OUT}")
