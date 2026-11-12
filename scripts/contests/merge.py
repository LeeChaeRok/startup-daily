"""One contest listed on several sites → one row, with an id that does not change.

Ported from _workspace/16_contests (open/merge.py: prize numbers, kind, topic, title similarity;
collectors/export_app.py: same-title and contained-title merges). New here:

- ids.json maps every site notice ("wevity:112063") to its contest id. A notice already in the
  registry keeps its contest, whatever happens to its title or deadline, so saved contests and
  shared links keep working. Only notices not seen before are matched by similarity.
- A new notice also joins a contest with a near-identical title (>= 0.9) from the same host when
  the deadlines differ; the row shows the earliest deadline still open (design §3.5).
"""
import collections
import hashlib
import re

from common import days_from

# ---------- prize ----------


def won(s):
    """'1,000만원' '300만 원' '1억 5천만원' '2,000,000원' → int"""
    s = s.replace(",", "")
    m = re.search(r"(\d+(?:\.\d+)?)\s*억(?:\s*(\d+)\s*천\s*만)?", s)
    if m:
        return int(float(m[1]) * 1e8 + (int(m[2]) * 1e7 if m[2] else 0))
    m = re.search(r"(\d+(?:\.\d+)?)\s*천\s*만\s*원?", s)
    if m:
        return int(float(m[1]) * 1e7)
    m = re.search(r"(\d+(?:\.\d+)?)\s*백\s*만\s*원?", s)
    if m:
        return int(float(m[1]) * 1e6)
    m = re.search(r"(\d+(?:\.\d+)?)\s*만\s*원?", s)
    if m:
        return int(float(m[1]) * 1e4)
    m = re.search(r"(\d{5,})\s*원", s)
    if m:
        return int(m[1])
    return None


AMT = r"((?:\d[\d,\.]*\s*억\s*)?(?:\d[\d,\.]*\s*(?:천|백)?\s*만\s*원?|\d[\d,]{4,}\s*원))"
BAND = r"5천만원\s*이상|5천만원~3천만원|3천만원~1천만원|1천만원\s*이하|3천만원 미만~1천만원 이상|1천만원\s*미만|1천만원 미만"


def prize(x):
    t = re.sub(r"\s+", " ", " ".join(str(x.get(k) or "") for k in ("prize_text", "prize")))
    band = (re.search(BAND, t) or [None])[0]
    tn = re.sub(BAND, "", t)
    top = total = None
    m = re.search(r"(?:총\s*상금|총\s*시상금|시상\s*규모|상금\s*총|총)\s*[:：]?\s*" + AMT, tn)
    if m:
        total = won(m[1])
    m = re.search(r"(?:1등|1위|대상|최우수상?|작가대상|본상)[^0-9가-힣]{0,6}(?:\(\d+\S*\)\s*)?(?:상금\s*)?[:：]?\s*" + AMT, tn)
    if m:
        top = won(m[1])
    for k, v in (("prize_total_krw", "total"), ("prize_top_krw", "top")):
        a = x.get(k)
        try:
            a = int(a) if a not in (None, "None", "") else None
        except (TypeError, ValueError):
            a = None
        if v == "total" and total is None and not (band and a in (10000000, 30000000, 50000000)):
            total = a
        if v == "top" and top is None:
            top = a
    if top and total and top > total:
        total = None  # a total smaller than the 1st prize was caught wrong
    top, total = top or None, total or None  # a 0 from a site field means "not given"
    perks =[k for k, p in [("채용·인턴", r"채용|인턴|입사|가산점"), ("상품", r"상품|상품권|기프티|골드바|굿즈|경품|맥북|스타일러"), ("상장", r"상장|표창|장관상|시장상")] if re.search(p, t)]
    if top or total:
        kind_ = "현금"
    elif band:
        kind_ = "현금(규모만)"
    elif perks:
        kind_ = perks[0]
    else:
        kind_ = "미상"
    return {"prize_top": top, "prize_total": total, "prize_band": band, "prize_kind": kind_, "perks": perks, "prize_raw": t.strip()[:160]}


# ---------- what kind of notice ----------

NOT_CONTEST = r"서포터즈|기자단|봉사|자원봉사|홍보대사|모니터단|평가단|참여단|동아리.*모집|교육생|아카데미|멘토 모집|대관 공모|입주|채용 일정|명예보좌관|탐험단|레지던시"


def kind(x):
    t = x["title"]
    if re.search(r"공모전|경진대회|콘테스트|챌린지|해커톤|신춘문예|문학상|공모\b|대회|콩쿠르|아이디어톤|드래프톤|백일장", t) and not re.search(r"이벤트 안내|구독 이벤트|설문조사 이벤트", t):
        return "공모전"
    if re.search(r"지원사업 참여|활동 지원사업|참여 기업 모집|입주|대관", t):
        return "지원사업"
    if re.search(r"이벤트|퀴즈|구독|설문|캠페인", t):
        return "이벤트"
    if re.search(NOT_CONTEST + r"|모집|캠프", t):
        return "대외활동·모집"
    return "공모전"


# ---------- topic ----------

TOPICS = [  # first match wins; title first, then the site's own category
    ("음악·공연·예체능", r"음악|밴드|콩쿠르|댄스|무용|공연|노래|가요|e스포츠|요리대회|선발대회|BGM"),
    ("창업·비즈니스", r"창업|스타트업|IR\b|데모데이|비즈니스|사업화|오픈 ?이노베이션|Open Innovation|투자"),
    ("영상·사진·숏폼", r"영상|숏폼|쇼츠|숏츠|UCC|사진|영화|디카시|촬영|크리에이터"),
    ("문학·글·시나리오", r"문학|신춘문예|소설|시나리오|수기|에세이|글쓰기|문예|웹소설|편지|논술|희곡|백일장|원고|나도 작가|글판|스토리"),
    ("AI·데이터·SW", r"해커톤|드래프톤|데이터|인공지능|AI 활용|AI 역량|AX|분석 경진|SW|소프트웨어|앱 개발|알고리즘|코딩|(?<![A-Za-z])IT(?![A-Za-z])|로컬AI|AI 달인|벤치마크|워크톤"),
    ("디자인·캐릭터·미술", r"디자인|캐릭터|마스코트|웹툰|만화|일러스트|미술|그림|포스터|로고|패키지|IP 창"),
    ("광고·마케팅·네이밍", r"광고|마케팅|네이밍|명칭|슬로건|브랜드|홍보|꿀조합|이벤트"),
    ("과학·학술·논문", r"논문|학술|과학|공학|연구|리포트|발명|특허"),
    ("건축·도시·공간", r"건축|인테리어|공간|정원|조경|한옥|꾸미기"),
    ("정책·아이디어 제안", r"정책|아이디어|제안|혁신|국민|시민|행정|청년의 시간|참여 예산|미래의제|규제|용어|사례|Idea|상상"),
    ("음악·공연·예체능", r"체육|스포츠|예체능"),
]


def topic(x):
    cat = x.get("site_category") or x.get("category") or ""
    if isinstance(cat, list):
        cat = str(cat)
    for t in (x["title"], str(cat)):
        for name, p in TOPICS:
            if re.search(p, t):
                return name
    return "기타"


# ---------- same contest? ----------

STOP = r"20\d\d년?|제\s*\d+\s*회|공모전|경진대회|공모|대회|콘테스트|챌린지|모집|아이디어|영상|숏폼|사진|디자인|국민|전국|청년|대학생"


def grams(t):
    t = re.sub(r"\[[^\]]*\]|" + STOP, "", t)
    t = re.sub(r"[^0-9A-Za-z가-힣]", "", t).lower()
    return {t[i:i + 2] for i in range(len(t) - 1)}


def sim(a, b):
    a, b = grams(a), grams(b)
    return len(a & b) / max(1, min(len(a), len(b)))


def clean_title(t):
    """Site decorations that are not part of the name: 올콘's "N 새글" badge, a "(~11/25)" hint."""
    t = re.sub(r"\s*N\s*새글\s*$", "", (t or "").strip())
    return re.sub(r"\s*\(\s*~\s*\d{1,2}\s*[./]\s*\d{1,2}\s*(까지)?\s*\)\s*$", "", t).strip()


def norm_title(t):
    # "[보건복지부] 2026 청년 e-Room 공모전 참가자 모집" ≈ "보건복지부 2026 청년e-Room 공모전"
    t = re.sub(r"(참가자|참여자|작품|응모작|아이디어)?\s*(모집|접수)(\s*안내)?\s*$", "", clean_title(t))
    return re.sub(r"[^0-9A-Za-z가-힣]", "", t).lower()  # also ㆍ vs ·, 「」 and the like


def norm_host(h):
    return re.sub(r"\(주\)|㈜|주식회사|[^0-9A-Za-z가-힣]", "", h or "").lower()


def hosts(h):
    """'조선일보사 · 조선일보미디어연구소 · 한글학회' → {'조선일보사', '조선일보미디어연구소', '한글학회'}"""
    return {norm_host(p) for p in re.split(r"[·ㆍ,/|]|\s-\s", h or "") if len(norm_host(p)) >= 2}


def same_host(a, b):
    A, B = hosts(a), hosts(b)
    return bool(A & B) or any(x in y or y in x for x in A for y in B if min(len(x), len(y)) >= 4)


def near(a, b):
    """Days between two deadlines (None if either is missing)."""
    if not a or not b:
        return None
    return abs(days_from(a, b))


def same_contest(row, group):
    """Is a new notice the same contest as an existing group?"""
    rep = group["rows"][0]
    other_site = all(r["site"] != row["site"] for r in group["rows"])
    s = sim(clean_title(row["title"]), clean_title(rep["title"]))
    gap = near(row["deadline"], group["deadline"])
    host = any(same_host(row.get("host"), r.get("host")) for r in group["rows"])
    if other_site and ((gap == 0 and s >= 0.6) or (s >= 0.9 and (gap is None or gap <= 3))):
        return True
    # same deadline and the same name: also a site listing one contest twice
    if gap == 0:
        a, b = norm_title(row["title"]), norm_title(rep["title"])
        if a == b or (min(len(a), len(b)) >= 8 and (a in b or b in a)) or (s >= 0.9 and host):
            return True
    # deadlines that disagree between sites: near-identical title from the same host
    if other_site and s >= 0.9 and host:
        return True
    return False


# ---------- groups → contests ----------

WHO = [  # 참가 대상 → the groups the app filters on. "any" = open to everyone; [] = not stated
    ("any", r"제한\s*없|누구나|전\s*국민|전\s*연령|연령\s*무관"),
    ("kid", r"유치원|어린이|초등|아동"),
    ("teen", r"청소년|중학|고등학|고교"),
    ("univ", r"대학|학부|재학생|휴학생"),
    ("adult", r"일반인|직장인|성인|만\s*1[89]\s*세\s*이상|창업|입사|시민|국민|주민|도민|구민|군민"),
]


def who(texts):
    t = " ".join(texts)
    keys = [k for k, rx in WHO if re.search(rx, t)]
    return ["any"] if "any" in keys else keys


def best_target(texts):
    # the most specific wording: skip bare "기타"/"제한없음", prefer the longest
    good = [t for t in texts if t and not re.fullmatch(r"\s*(기타|제한\s*없음|대상 제한 없음)(,\s*기타)?\s*", t)]
    return max(good, key=len)[:80] if good else (texts[0] if texts else "")


def new_id(title, deadline, taken):
    n = 0
    while True:
        seed = f"{title}|{deadline}" + (f"|{n}" if n else "")
        cid = hashlib.sha1(seed.encode()).hexdigest()[:10]
        if cid not in taken:
            return cid
        n += 1


def contest_of(group, names):
    """The merged contest row (before the 공모전-only export filter)."""
    rows = group["rows"]
    rep = rows[0]
    p = None
    for r in rows:
        q = prize(r)
        if p is None:
            p = q
            continue
        for f in ("prize_top", "prize_total", "prize_band"):
            if p[f] is None and q[f] is not None:
                p[f] = q[f]
        if p["prize_kind"] in ("미상", "상장", "상품") and q["prize_kind"].startswith("현금"):
            p["prize_kind"] = q["prize_kind"]
    if p["prize_top"] and p["prize_total"] and p["prize_top"] > p["prize_total"]:
        p["prize_total"] = None
    targets = []
    for r in rows:
        t = str(r.get("target") or "")[:80]
        if t and t not in targets:
            targets.append(t)
    k = kind(rep)
    if k == "대외활동·모집" and (p["prize_top"] or p["prize_total"]):
        k = "공모전"  # a '참가팀 모집' with prize money is a contest
    sites, urls = [], set()
    for r in sorted(rows, key=lambda r: r.get("posted") or "9"):
        if r["url"] in urls:
            continue
        urls.add(r["url"])
        sites.append({"site": names[r["site"]], "url": r["url"], "posted": r.get("posted") or "", "deadline": r["deadline"]})
    return {
        "id": group["id"],
        "title": clean_title(rep["title"]),
        "host": next((r["host"].strip() for r in rows if (r.get("host") or "").strip()), ""),
        "posted": min(r.get("posted") or "9999" for r in rows),
        "deadline": group["deadline"],
        "target": best_target(targets),
        "who": who(targets),
        "topic": topic(rep),
        "kind": k,
        "prize_top": p["prize_top"],
        "prize_total": p["prize_total"],
        "prize_band": p["prize_band"] or "",
        "prize_kind": p["prize_kind"] or "",
        "sites": sites,
    }


def merge(rows_by_site, registry, order, names):
    """rows_by_site: {site_key: [row]} of open notices, each row with site, sid, title, host,
    posted, deadline, url, ... registry: {"site:sid": contest_id}. Returns (contests, registry
    entries for today's rows)."""
    groups = collections.OrderedDict()  # contest id → {"id", "rows", "deadline"}
    pending = []
    for site in order:
        for row in sorted(rows_by_site.get(site, []), key=lambda r: (r.get("posted") or "", r["sid"]), reverse=True):
            cid = registry.get(f"{site}:{row['sid']}")
            if cid:
                groups.setdefault(cid, {"id": cid, "rows": []})["rows"].append(row)
            else:
                pending.append(row)
    for g in groups.values():
        g["deadline"] = min(r["deadline"] for r in g["rows"])
    taken = set(registry.values()) | set(groups)
    for row in pending:
        g = next((g for g in groups.values() if same_contest(row, g)), None)
        if g is None:
            cid = new_id(row["title"], row["deadline"], taken)
            taken.add(cid)
            g = groups[cid] = {"id": cid, "rows": [], "deadline": row["deadline"]}
        g["rows"].append(row)
        g["deadline"] = min(g["deadline"], row["deadline"])
    entries = {f"{r['site']}:{r['sid']}": g["id"] for g in groups.values() for r in g["rows"]}
    return [contest_of(g, names) for g in groups.values()], entries
