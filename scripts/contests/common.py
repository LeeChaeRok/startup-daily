"""Shared pieces for the contest collectors (_workspace/18_contests_batch-design.md).

Polite HTTP (one request a second per site, a User-Agent that names the bot, robots.txt read
on every run, stop on 403/429), text and date helpers, the state-record bookkeeping, and the
two prize parsers the collectors used to carry four copies of.

Standard library and the curl binary only, so the GitHub runner needs nothing installed.
"""
import hashlib
import html
import os
import re
import subprocess
import tempfile
import threading
import time
from datetime import date, datetime, timedelta, timezone
from urllib import robotparser
from urllib.parse import urlsplit

KST = timezone(timedelta(hours=9))
BOT = "StartupDailyBot"
UA = f"{BOT}/1.0 (+https://startup-daily.vercel.app/#/about?sec=contests)"
MIN_INTERVAL = 1.1  # seconds between two requests to the same site
BACKOFF = (2, 5, 10)  # waits before the 2nd, 3rd and 4th try of a failed request
HERE = os.path.dirname(os.path.abspath(__file__))


class Blocked(Exception):
    """403/429, or robots.txt forbids the path: stop this site for today, do not work around it."""


class SiteBroken(Exception):
    """The site answered, but not with what the parser expects (layout change, empty list)."""


# ---------- dates ----------


def kst_today():
    return datetime.now(KST).strftime("%Y-%m-%d")


def day(s):
    return date.fromisoformat(s)


def days_from(a, b):
    """b - a in days, for YYYY-MM-DD strings."""
    return (day(b) - day(a)).days


def plus_days(s, n):
    return (day(s) + timedelta(days=n)).isoformat()


DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def valid_deadline(d, today):
    """'ok', 'closed', or 'bad' (wrong format, or more than two years out, e.g. 씽굿's 0202-06-21)."""
    if not d or not DATE_RE.match(d):
        return "bad"
    try:
        day(d)
    except ValueError:
        return "bad"
    if d < today:
        return "closed"
    if days_from(today, d) > 730:
        return "bad"
    return "ok"


# ---------- text ----------


def txt(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def no_scripts(s):
    return re.sub(r"(?s)<script.*?</script>|<style.*?</style>", "", s or "")


def html_lines(text):
    t = re.sub(r"<br\s*/?>|</p>|</div>|</li>|</h\d>|</tr>", "\n", text or "", flags=re.I)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    return [re.sub(r"\s+", " ", l).strip() for l in t.split("\n") if l.strip()]


# ---------- HTTP ----------

_ca_lock = threading.Lock()
_ca_path = None


def ca_bundle():
    """System CA bundle plus the Sectigo intermediates in certs/, on Linux only.

    all-con.co.kr sends its certificate without the intermediate. macOS fills the gap itself,
    Linux OpenSSL does not (scripts/contests/certs/). Verification stays on."""
    global _ca_path
    with _ca_lock:
        if _ca_path is not None:
            return _ca_path or None
        system = next((p for p in ("/etc/ssl/certs/ca-certificates.crt", "/etc/pki/tls/certs/ca-bundle.crt") if os.path.exists(p)), None)
        if not system:
            _ca_path = ""
            return None
        fd, path = tempfile.mkstemp(prefix="startup-daily-ca-", suffix=".pem")
        with os.fdopen(fd, "w") as f:
            f.write(open(system).read())
            certs = os.path.join(HERE, "certs")
            for name in sorted(os.listdir(certs)):
                if name.endswith(".pem"):
                    f.write("\n" + open(os.path.join(certs, name)).read())
        _ca_path = path
        return path


class Client:
    """One per site: rate limit, retries, robots.txt, counters for the run report."""

    def __init__(self, site, log=print):
        self.site = site
        self.log = log
        self.calls = 0  # logical requests
        self.tries = 0  # HTTP attempts, retries included
        self.failed = 0  # calls that ended without a usable answer
        self._last = 0.0
        self._robots = {}

    def _curl(self, url, data=None, headers=()):
        wait = self._last + MIN_INTERVAL - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        fd, tmp = tempfile.mkstemp(prefix="contest-")
        os.close(fd)
        cmd = ["curl", "-sS", "-L", "--compressed", "-m", "30", "-A", UA, "-o", tmp, "-w", "%{http_code}"]
        ca = ca_bundle()
        if ca:
            cmd += ["--cacert", ca]
        for h in headers:
            cmd += ["-H", h]
        if data is not None:
            cmd += ["-X", "POST", "--data-binary", data]
        cmd.append(url)
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            body = open(tmp, encoding="utf-8", errors="replace").read()
        except subprocess.TimeoutExpired:
            r, body = None, ""
        finally:
            self._last = time.monotonic()
            os.unlink(tmp)
        self.tries += 1
        if r is None or r.returncode != 0:
            return 0, "", (r.stderr.strip()[:200] if r else "timeout")
        return int(r.stdout.strip() or 0), body, ""

    def allowed(self, url):
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in self._robots:
            status, body, _ = self._curl(origin + "/robots.txt")
            rp = robotparser.RobotFileParser()
            if status in (401, 403):
                rp.disallow_all = True
            elif status != 200:
                rp.allow_all = True  # no robots.txt (404) or unreachable: the request itself will tell
            else:
                rp.parse(body.splitlines())
                rp.modified()
            self._robots[origin] = rp
        return self._robots[origin].can_fetch(BOT, url)

    def fetch(self, url, data=None, headers=(), missing_ok=False):
        """(status, body). 403/429 and robots.txt refusals raise Blocked. Network errors and 5xx
        are retried with backoff; a 404 is returned as is (counted as a failure unless missing_ok)."""
        if not self.allowed(url):
            raise Blocked(f"robots.txt disallows {url}")
        self.calls += 1
        err = ""
        for attempt in range(len(BACKOFF) + 1):
            status, body, err = self._curl(url, data, headers)
            if status in (403, 429):
                self.failed += 1
                raise Blocked(f"HTTP {status} for {url}")
            if status == 200:
                return status, body
            if status == 404:
                if not missing_ok:
                    self.failed += 1
                return status, body
            if attempt < len(BACKOFF):
                time.sleep(BACKOFF[attempt])
        self.failed += 1
        self.log(f"[{self.site}] gave up on {url}: {status or err}")
        return status, ""


# ---------- state records ----------
# A site's state file: {"meta": {...}, "records": {site_id: record}}. A record carries what the
# collector parsed (title, host, posted, start, deadline, target, site_category, prize_text,
# prize_top_krw, prize_total_krw, url, ...) plus first_seen / last_seen / last_checked / missing.

WATCHED = ("title", "deadline", "start", "host")


def new_stats():
    return {"listed": 0, "new": 0, "changed": 0, "extended": 0, "rechecked": 0, "missing": 0, "unparsed": 0}


def upsert(records, sid, row, today, stats):
    """Store what was just read for one notice. Only the given fields change."""
    old = records.get(sid)
    rec = dict(old or {})
    if old is None or old.get("unparsed"):
        if old is None:
            rec["first_seen"] = today
        stats["new"] += 1
        rec.pop("unparsed", None)
    elif any(row.get(k) is not None and row.get(k) != old.get(k) for k in WATCHED):
        stats["changed"] += 1
        if row.get("deadline") and old.get("deadline") and row["deadline"] > old["deadline"]:
            stats["extended"] += 1
            rec["extended_from"] = old["deadline"]
    rec.update({k: v for k, v in row.items() if v is not None or k not in rec})
    rec["last_seen"] = rec["last_checked"] = today
    rec["missing"] = 0
    records[sid] = rec
    return rec


def saw(records, sid, today):
    """Seen in today's list, nothing re-read."""
    rec = records[sid]
    rec["last_seen"] = today
    rec["missing"] = 0


def unparsed(records, sid, today, stats, **known):
    """A detail page we could not parse: remember it so it is not fetched again every day."""
    stats["unparsed"] += 1
    rec = records.get(sid) or {"first_seen": today}
    rec.update(known)
    rec.update({"unparsed": True, "last_seen": today, "last_checked": today, "missing": 0})
    records[sid] = rec


def gone(records, sid, today, stats):
    """Not found where it should be (list of every open notice, or its detail page)."""
    rec = records[sid]
    rec["missing"] = rec.get("missing", 0) + 1
    rec["last_checked"] = today
    stats["missing"] += 1


def is_open(rec, today):
    return not rec.get("unparsed") and rec.get("missing", 0) < 2 and (rec.get("deadline") or "") >= today


def recheck_due(sid, rec, today):
    """Around the deadline (3 days before to the day after) every day, otherwise once a week,
    a seventh of the notices each day so the requests don't bunch up."""
    dl = rec.get("deadline") or ""
    if rec.get("last_checked") == today:
        return False
    if DATE_RE.match(dl):
        left = days_from(today, dl)
        if left < -1:
            return False
        if left <= 3:
            return True
    if not rec.get("last_checked") or days_from(rec["last_checked"], today) >= 8:
        return True
    slot = int(hashlib.sha1(str(sid).encode()).hexdigest()[:8], 16) % 7
    return slot == day(today).toordinal() % 7


def prune(records, today):
    """Drop notices closed more than 14 days ago, and missing ones not seen for 14 days."""
    cut = plus_days(today, -14)
    for sid in [s for s, r in records.items() if (r.get("deadline") or "9999") < cut or (r.get("missing", 0) >= 2 and (r.get("last_seen") or "") < cut)]:
        del records[sid]


# ---------- prize amounts from notice text ----------
# Two parsers, kept as they were tuned per site: A for 링커리어 (and the retired 캠퍼스픽
# collector), B for 씽굿 and 올콘. Folding them into one changes amounts on live rows, so that
# is its own change with its own before/after comparison.

_UNIT_A = {"억": 10**8, "천만": 10**7, "백만": 10**6, "만": 10**4, "천": 10**3}
_AMT_A = r"(?:\d[\d,\.]*\s*억\s*)?(?:\d[\d,\.]*\s*(?:천만|백만|만|천)?\s*)원"
_TOP_A = r"(?:대상|최우수상?|1등|1위|금상|그랑프리|으뜸상)"
_TOTAL_A = r"(?:총\s*(?:상금|시상금|상금\s*규모|시상\s*규모|시상금\s*규모|상금액)|상금\s*총|시상\s*규모는?)"
_NOT_PRIZE_A = re.compile(r"(참가|참여|지원|모집|응모|공모|신청|선정|교육|심사)\s*대상|대상자|대상\s*[:：]\s*(누구|대학|일반|국민|전|만|청|고|초|중)")
_PRIZE_LINE_A = re.compile(r"총\s*상금|상금|시상|상장|부상|" + _TOP_A + r"|우수상|장려상|입상|가산점|인턴|채용\s*연계|특전|혜택")


def a_krw(s):
    s = s.replace(",", "").replace(" ", "").rstrip("원")
    if re.fullmatch(r"\d+(\.\d+)?", s):
        return int(float(s))
    total = 0
    for num, unit in re.findall(r"(\d+(?:\.\d+)?)(억|천만|백만|만|천)?", s):
        total += int(float(num) * _UNIT_A.get(unit, 1))
    return total or None


def a_prize_lines(lines, limit=4):
    out = []
    for l in lines:
        if len(l) > 160 or _NOT_PRIZE_A.search(l):
            continue
        if _PRIZE_LINE_A.search(l) and (re.search(_AMT_A, l) or re.search(r"가산점|인턴|채용|상장|특전|해외|전시|굿즈|상품", l)):
            out.append(l)
        if len(out) >= limit:
            break
    return out


def a_top(lines):
    for l in lines:
        if _NOT_PRIZE_A.search(l):
            continue
        m = re.search(_TOP_A + r"[^\n총]{0,30}?(" + _AMT_A + ")", l)
        if m:
            return a_krw(m.group(1))
    return None


def a_total(lines):
    for l in lines:
        m = re.search(_TOTAL_A + r"[^\d\n]{0,15}?(" + _AMT_A + ")", l)
        if m:
            return a_krw(m.group(1))
    return None


_UNIT_B = {"억": 100_000_000, "천만": 10_000_000, "백만": 1_000_000, "만": 10_000}


def b_krw(s):
    """First KRW amount in s -> int won, or None. 1,000만원 / 2천만원 / 1억 5천만원 / 20,000,000원."""
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
        v = float(m[1]) * _UNIT_B["억"]
        if m[2]:
            v += int(m[2]) * _UNIT_B[m[3]]
        return int(v)
    if kind == "unit":
        return int(float(m[1]) * _UNIT_B[m[2]])
    return int(m[1])


_MONEY_B = re.compile(r"\d[\d,]*(?:\.\d+)?\s*(?:억|천만|백만|만)?\s*원")
_BENEFIT_B = re.compile(r"입사|채용|인턴|서류\s*(?:전형\s*)?(?:면제|가점)|해외\s*(?:탐방|연수)|연수권|장학|라이선스\s*계약|독점\s*라이선스|출간|등단(?:패|인증|식)|상장(?!회사)|상패|장관상")
_AMT_B = r"(\d[\d,.]*\s*(?:억|천만|백만|만)?\s*(?:\d[\d,]*\s*(?:천만|만)\s*)?원)"
_TOTAL_RES_B = [
    re.compile(r"총\s*(?:[가-힣]{1,6}\s*)?[:：]?\s*" + _AMT_B),  # 총상금 1,000만원 / 총 상금: 600만원
    re.compile(r"총\s*\d+\s*(?:명|팀|점|편|개)[^/]{0,8}?(?:상금|시상금)\s*" + _AMT_B),  # 총 27점, 상금 1,020만원
]


def b_prize_lines(lines, limit=5):
    out = []
    for l in lines:
        l = " ".join(l.split())
        if len(l) > 140 or l in out or re.search(r"않|없습니다|없음|불가|자격|사용\s*가능|준수|약관|상장회사", l):
            continue
        if (_MONEY_B.search(l) and re.search(r"상|등|총|시상|상금|당선|선정|상당", l)) or _BENEFIT_B.search(l):
            out.append(l)
        if len(out) >= limit:
            break
    return out


def b_total(lines):
    for l in lines:
        for rx in _TOTAL_RES_B:
            m = rx.search(l)
            if m and b_krw(m[1]):
                return b_krw(m[1])
    return None


def b_top(lines):
    for kw in ("대상", "1등", "일등", "그랑프리", "으뜸상", "최우수상", "당선"):
        for l in lines:
            if kw in l and _MONEY_B.search(l[l.find(kw):]):
                v = b_krw(l[l.find(kw):])
                if v:
                    return v
    return None
