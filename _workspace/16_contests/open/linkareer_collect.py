#!/usr/bin/env python3
"""Collect Linkareer contests (activityTypeID=3) created in a date window.

Uses the public GraphQL endpoint the site itself calls (no auth):
  POST https://api.linkareer.com/graphql
  activities(filterBy:{activityTypeID:"3"}, orderBy:{field:CREATED_AT,direction:DESC})
`createdAt` is the real posting (registration) timestamp.

Usage: python3 linkareer_collect.py [START YYYY-MM-DD] [END YYYY-MM-DD] [OUT]
"""
import json, re, sys, time, os, subprocess
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
START = sys.argv[1] if len(sys.argv) > 1 else "2026-11-02"
END = sys.argv[2] if len(sys.argv) > 2 else "2026-11-09"
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "linkareer.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
PAGE_SIZE = 50

QUERY = """query($page:Int!,$size:Int!){
 activities(filterBy:{activityTypeID:"3"},orderBy:{field:CREATED_AT,direction:DESC},
            pagination:{page:$page,pageSize:$size}){
  totalCount
  nodes{ id title organizationName createdAt recruitStartAt recruitCloseAt status
         tenThousandUnitOfReward
         additionalBenefit categories{name} targets{name} benefits{name} detailText{text} }
 }}"""

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


def post(page):
    body = json.dumps({"query": QUERY, "variables": {"page": page, "size": PAGE_SIZE}})
    r = subprocess.run(["curl", "-s", "-A", UA, "-H", "content-type: application/json",
                        "-H", "Origin: https://linkareer.com", "-H", "Referer: https://linkareer.com/list/contest",
                        "-X", "POST", "https://api.linkareer.com/graphql", "-d", body],
                       capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    if "errors" in d:
        raise SystemExit(d["errors"])
    return d["data"]["activities"]


def day(ms):
    return datetime.fromtimestamp(ms / 1000, KST).strftime("%Y-%m-%d") if ms else None


def main():
    out, page = [], 1
    while True:
        res = post(page)
        nodes = res["nodes"]
        stop = False
        for n in nodes:
            p = day(n["createdAt"])
            if p > END:
                continue
            if p < START:
                stop = True
                break
            if n.get("status") == "REJECTED":  # rejected by moderators, not publicly listed
                continue
            reward = n.get("tenThousandUnitOfReward")
            prize = f"{reward}만원" if reward and int(reward) > 0 else None
            benefits = [b["name"] for b in n.get("benefits") or []]
            if benefits:
                prize = ", ".join(([prize] if prize else []) + benefits)
            lines = html_lines((n.get("detailText") or {}).get("text"))
            plines = prize_lines(lines)
            site_bits = []
            if reward and int(reward) > 0:
                site_bits.append(f"시상규모 {int(reward):,}만원")
            site_bits += benefits
            if n.get("additionalBenefit"):
                site_bits.append(n["additionalBenefit"])
            prize_text = " / ".join(site_bits + plines) or None
            total_krw = int(reward) * 10000 if reward and int(reward) > 0 else find_total(lines)
            out.append({
                "title": n["title"].strip(),
                "host": n["organizationName"],
                "category": ", ".join(c["name"] for c in n.get("categories") or []) or None,
                "posted": p,
                "start": day(n["recruitStartAt"]),
                "deadline": day(n["recruitCloseAt"]),
                "prize": prize,
                "prize_total_krw": total_krw,
                "prize_top_krw": find_top(lines),
                "prize_text": prize_text,
                "site_category": [c["name"] for c in n.get("categories") or []],
                "target": ", ".join(t["name"] for t in n.get("targets") or []) or None,
                "status": n.get("status"),
                "url": f"https://linkareer.com/activity/{n['id']}",
            })
        if stop or not nodes:
            break
        page += 1
        time.sleep(1)
    with open(OUT, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(out)} items -> {OUT} (pages fetched: {page})")


if __name__ == "__main__":
    main()
