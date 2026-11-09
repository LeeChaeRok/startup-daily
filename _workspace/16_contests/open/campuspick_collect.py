#!/usr/bin/env python3
"""Collect Campuspick (에브리커리어) contests registered in a date window.

1. List: POST https://api2.campuspick.com/find/activity/list  (form: target=1&limit&offset)
   - the JSON the /contest page calls; no auth. Has id/title/company/endDate/categories but
     NO posting date. Thumbnail filename starts with an upload timestamp (ms) -> used only
     as a pre-filter to decide which detail pages to fetch.
2. Detail: GET https://www.campuspick.com/contest/view?id=N  -> <script id="__INITIAL_STATE__">
   contains activity.created_at (real registration timestamp), start_date, prize, description.

Usage: python3 campuspick_collect.py [START] [END] [OUT]
"""
import json, os, re, subprocess, sys, time
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
START = sys.argv[1] if len(sys.argv) > 1 else "2026-11-02"
END = sys.argv[2] if len(sys.argv) > 2 else "2026-11-09"
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "campuspick.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
LIMIT = 50
MARGIN_DAYS = 3  # image upload may precede registration

CATS = {101: "기획/아이디어", 102: "브랜드/네이밍", 103: "광고/마케팅", 104: "사진/영상/UCC", 105: "디자인",
        106: "예체능", 107: "문학/수기/시나리오", 108: "IT/소프트웨어/게임", 109: "기타"}
PRIZE_TOTAL = {1: "5천만원이상", 2: "5천만원~3천만원", 3: "3천만원~1천만원", 4: "1천만원이하"}
BENEFIT = ["입사가산점", "인턴채용", "정규직채용", "해외연수", "작품전시", "기타"]

# ---- prize parsing (shared logic, duplicated in both collectors) ----
import html as _html
_UNIT = {"억": 10**8, "천만": 10**7, "백만": 10**6, "만": 10**4, "천": 10**3}
_AMT = r"(?:\d[\d,\.]*\s*억\s*)?(?:\d[\d,\.]*\s*(?:천만|백만|만|천)?\s*)원"
_TOP = r"(?:대상|최우수상?|1등|1위|금상|그랑프리|으뜸상)"
_TOTAL = r"(?:총\s*(?:상금|시상금|상금\s*규모|시상\s*규모|시상금\s*규모|상금액)|상금\s*총|시상\s*규모는?)"
_NOT_PRIZE = re.compile(r"(참가|참여|지원|모집|응모|공모|신청|선정|교육|심사)\s*대상|대상자|대상\s*[:：]\s*(누구|대학|일반|국민|전|만|청|고|초|중)")
_PRIZE_LINE = re.compile(r"총\s*상금|상금|시상|상장|부상|"+_TOP+r"|우수상|장려상|입상|가산점|인턴|채용\s*연계|특전|혜택")


def html_lines(text):
    t = re.sub(r"<br\s*/?>|</p>|</div>|</li>|</h\d>|</tr>", "\n", text or "", flags=re.I)
    t = _html.unescape(re.sub(r"<[^>]+>", " ", t))
    return [re.sub(r"\s+", " ", l).strip() for l in t.split("\n") if l.strip()]


def to_krw(s):
    s = s.replace(",", "").replace(" ", "").rstrip("원")
    if re.fullmatch(r"\d+(\.\d+)?", s):
        return int(float(s))
    total = 0
    for num, unit in re.findall(r"(\d+(?:\.\d+)?)(억|천만|백만|만|천)?", s):
        total += int(float(num) * _UNIT.get(unit, 1))
    return total or None


def prize_lines(lines, limit=4):
    out = []
    for l in lines:
        if len(l) > 160 or _NOT_PRIZE.search(l):
            continue
        if _PRIZE_LINE.search(l) and (re.search(_AMT, l) or re.search(r"가산점|인턴|채용|상장|특전|해외|전시|굿즈|상품", l)):
            out.append(l)
        if len(out) >= limit:
            break
    return out


def find_top(lines):
    for l in lines:
        if _NOT_PRIZE.search(l):
            continue
        m = re.search(_TOP + r"[^\n총]{0,30}?(" + _AMT + ")", l)
        if m:
            return to_krw(m.group(1))
    return None


def find_total(lines):
    for l in lines:
        m = re.search(_TOTAL + r"[^\d\n]{0,15}?(" + _AMT + ")", l)
        if m:
            return to_krw(m.group(1))
    return None
# ---- end prize parsing ----


def curl(args):
    r = subprocess.run(["curl", "-s", "--fail", "-A", UA] + args, capture_output=True, text=True, check=True)
    return r.stdout


def list_page(offset):
    raw = curl(["-H", "Origin: https://www.campuspick.com", "-H", "Referer: https://www.campuspick.com/contest",
                "-X", "POST", "https://api2.campuspick.com/find/activity/list",
                "--data", f"target=1&limit={LIMIT}&offset={offset}"])
    d = json.loads(raw)
    assert d["status"] == "success", d
    return d["result"]["activities"]


def img_ts(item):
    m = re.search(r"/activity/(\d{13})", item.get("image") or "")
    return datetime.fromtimestamp(int(m.group(1)) / 1000, KST) if m else None


def detail(aid):
    h = curl([f"https://www.campuspick.com/contest/view?id={aid}"])
    m = re.search(r'id="__INITIAL_STATE__" type="application/json">(.*?)</script>', h, re.S)
    st = json.loads(m.group(1))
    return st["activity"], st.get("categories") or []


def target_from(desc):
    m = re.search(r"(?:참가|참여|지원|응모)\s*(?:대상|자격)(?!\s*및)\s*[:：｜|]?\s*\n?\s*([^\n•]{2,80})", desc or "")
    return m.group(1).strip(" -•·:｜|👀") if m else None


def main():
    cutoff = datetime.strptime(START, "%Y-%m-%d").replace(tzinfo=KST) - timedelta(days=MARGIN_DAYS)
    cands, offset = [], 0
    while True:
        items = list_page(offset)
        if not items:
            break
        old = 0
        for it in items:
            ts = img_ts(it)
            if (ts is None or ts >= cutoff) and str(it.get("endDate") or "9999")[:10] >= END:
                cands.append(it)
            else:
                old += 1
        if old == len(items):  # whole page older than cutoff
            break
        offset += LIMIT
        time.sleep(1)
    out = []
    for it in cands:
        time.sleep(1)
        a, cats = detail(it["id"])
        posted = (a.get("created_at") or "")[:10]
        if not (START <= posted <= END):
            continue
        prize = []
        if a.get("prize_top"):
            prize.append(f"1등 {int(a['prize_top']):,}원")
        if PRIZE_TOTAL.get(a.get("prize_total")):
            prize.append(f"총상금 {PRIZE_TOTAL[a['prize_total']]}")
        pb = a.get("prize_benefit")
        pb = json.loads(pb) if isinstance(pb, str) else (pb or [])
        prize += [BENEFIT[i] for i, v in enumerate(pb) if v == 1 and i < len(BENEFIT)]
        lines = html_lines((a.get("description") or "").replace("\n", "<br>"))
        plines = prize_lines(lines)
        top = int(a["prize_top"]) if a.get("prize_top") else None
        top_txt = find_top(lines)
        if top is not None and top < 10000:  # site field entered in 만원 or wrong; prefer body text
            top = top_txt
        elif top is None:
            top = top_txt
        site_label = " / ".join(([f"1등 상금 {int(a['prize_top']):,}원"] if a.get("prize_top") else [])
                                + ([f"총 상금 {PRIZE_TOTAL[a['prize_total']]}"] if PRIZE_TOTAL.get(a.get("prize_total")) else [])
                                + [BENEFIT[i] for i, v in enumerate(pb) if v == 1 and i < len(BENEFIT)])
        out.append({
            "title": a["title"].strip(),
            "host": a.get("company"),
            "category": ", ".join(CATS.get(c, str(c)) for c in cats) or None,
            "posted": posted,
            "start": a.get("start_date"),
            "deadline": a.get("end_date"),
            "prize": ", ".join(prize) or None,
            "prize_total_krw": find_total(lines),
            "prize_top_krw": top,
            "prize_text": " / ".join(([site_label] if site_label else []) + plines) or None,
            "site_category": [CATS.get(c, str(c)) for c in cats],
            "target": target_from(a.get("description")),
            "url": f"https://www.campuspick.com/contest/view?id={a['id']}",
        })
    out.sort(key=lambda x: x["posted"], reverse=True)
    with open(OUT, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(out)} items in window (list pages: {offset // LIMIT + 1}, details fetched: {len(cands)}) -> {OUT}")


if __name__ == "__main__":
    main()
