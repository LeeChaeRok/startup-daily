"""Checks before anything is published (design §3.6)."""
from common import is_open, valid_deadline

MAX_ERROR_RATE = 0.2  # failed requests
MIN_KEEP = 0.6  # a site's open notices against yesterday
MAX_BAD_DEADLINES = 0.05
MAX_DROP = 0.25  # exported contests against the published file


def site_problems(old_records, new_records, client, today):
    """Reasons to throw away today's collection for one site and keep yesterday's state."""
    problems = []
    if client.calls and client.failed / client.calls > MAX_ERROR_RATE:
        problems.append(f"{client.failed}/{client.calls} requests failed")
    before = sum(1 for r in old_records.values() if is_open(r, today))
    after = sum(1 for r in new_records.values() if is_open(r, today))
    if before >= 20 and after < before * MIN_KEEP:
        problems.append(f"open notices fell from {before} to {after}")
    live = [r for r in new_records.values() if r.get("last_seen") == today and not r.get("unparsed")]
    bad = [r for r in live if valid_deadline(r.get("deadline"), today) == "bad"]
    if live and len(bad) / len(live) > MAX_BAD_DEADLINES:
        problems.append(f"{len(bad)} of {len(live)} deadlines unreadable")
    return problems


def export_problems(prev_doc, doc):
    """Reasons not to publish at all."""
    problems = []
    ids = [i["id"] for i in doc["items"]]
    if len(ids) != len(set(ids)):
        problems.append("duplicate contest ids")
    before = len((prev_doc or {}).get("items") or [])
    if before and len(ids) < before * (1 - MAX_DROP):
        problems.append(f"contests fell from {before} to {len(ids)}")
    if not ids:
        problems.append("no contests")
    return problems
