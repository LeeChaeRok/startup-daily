"""링커리어: the public GraphQL API the site itself calls. Every open contest, body included,
comes back in about ten pages of 50, so the whole open list is re-read every day."""
import json
from datetime import datetime

from common import KST, SiteBroken, a_prize_lines, a_top, a_total, gone, html_lines, is_open, upsert

KEY = "linkareer"
NAME = "링커리어"
API = "https://api.linkareer.com/graphql"
PAGE_SIZE = 50
QUERY = """query($page:Int!,$size:Int!){
 activities(filterBy:{activityTypeID:"3",status:OPEN},orderBy:{field:CREATED_AT,direction:DESC},
            pagination:{page:$page,pageSize:$size}){
  totalCount
  nodes{ id title organizationName createdAt recruitStartAt recruitCloseAt status
         tenThousandUnitOfReward
         additionalBenefit categories{name} targets{name} benefits{name} detailText{text} }
 }}"""


def kst_day(ms):
    return datetime.fromtimestamp(ms / 1000, KST).strftime("%Y-%m-%d") if ms else None


def row_of(n):
    reward = n.get("tenThousandUnitOfReward")
    reward = int(reward) if reward and int(reward) > 0 else None
    benefits = [b["name"] for b in n.get("benefits") or []]
    prize = f"{reward}만원" if reward else None
    if benefits:
        prize = ", ".join(([prize] if prize else []) + benefits)
    lines = html_lines((n.get("detailText") or {}).get("text"))
    site_bits = ([f"시상규모 {reward:,}만원"] if reward else []) + benefits
    if n.get("additionalBenefit"):
        site_bits.append(n["additionalBenefit"])
    cats = [c["name"] for c in n.get("categories") or []]
    return {
        "title": n["title"].strip(),
        "host": n.get("organizationName"),
        "category": ", ".join(cats) or None,
        "posted": kst_day(n["createdAt"]),
        "start": kst_day(n.get("recruitStartAt")),
        "deadline": kst_day(n.get("recruitCloseAt")),
        "prize": prize,
        "prize_total_krw": reward * 10000 if reward else a_total(lines),
        "prize_top_krw": a_top(lines),
        "prize_text": " / ".join(site_bits + a_prize_lines(lines)) or None,
        "site_category": cats,
        "target": ", ".join(t["name"] for t in n.get("targets") or []) or None,
        "status": n.get("status"),
        "url": f"https://linkareer.com/activity/{n['id']}",
    }


def page(client, n):
    body = json.dumps({"query": QUERY, "variables": {"page": n, "size": PAGE_SIZE}})
    status, text = client.fetch(API, data=body, headers=["content-type: application/json"])
    if status != 200:
        raise SiteBroken(f"list page {n}: HTTP {status}")
    d = json.loads(text)
    if d.get("errors") or not d.get("data"):
        raise SiteBroken(f"list page {n}: {str(d.get('errors'))[:200]}")
    return d["data"]["activities"]


def probe(client):
    res = page(client, 1)
    return f"{res['totalCount']} open, first page {len(res['nodes'])}"


def collect(client, records, meta, today, stats, full=False):
    seen, n = set(), 1
    while True:
        res = page(client, n)
        nodes = res["nodes"]
        if n == 1 and not nodes:
            raise SiteBroken("first list page is empty")
        for node in nodes:
            sid = str(node["id"])
            seen.add(sid)
            upsert(records, sid, row_of(node), today, stats)
        if len(nodes) < PAGE_SIZE or len(seen) >= res["totalCount"] or n >= 40:
            break
        n += 1
    stats["listed"] = len(seen)
    # the list is every open contest: a known open one that is not in it closed early or was taken down
    for sid, rec in records.items():
        if sid not in seen and is_open(rec, today):
            gone(records, sid, today, stats)
