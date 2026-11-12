#!/usr/bin/env python3
"""Daily contest collection (_workspace/18_contests_batch-design.md): collect → merge → check →
export → report.

  python3 scripts/contests/run.py --mode probe      one list request per site, nothing written
  python3 scripts/contests/run.py --mode dry-run    collect and report, nothing written
  python3 scripts/contests/run.py --mode publish    write data/contests/ and src/data/contests.json
  options: --full-resync (ignore state, read everything again), --today YYYY-MM-DD,
           --sites wevity,allcon, --skip-collect (merge and export the stored state only),
           --summary FILE (markdown report, e.g. $GITHUB_STEP_SUMMARY), --out FILE (dry-run export)

Exit codes: 0 done · 2 published, but a site has failed three days in a row · 3 not published,
the export failed its checks · 1 crashed.
"""
import argparse
import copy
import json
import os
import sys
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from common import Blocked, Client, SiteBroken, is_open, kst_today, new_stats, prune, valid_deadline  # noqa: E402
from export import export_doc  # noqa: E402
from merge import merge  # noqa: E402
from sites import NAMES, SITES  # noqa: E402
from validate import export_problems, site_problems  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
FAIL_ALERT_DAYS = 3
_print_lock = threading.Lock()


def log(msg):
    with _print_lock:
        print(msg, flush=True)


def load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def dump(path, obj, pretty=True):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        if pretty:
            json.dump(obj, f, ensure_ascii=False, indent=1, sort_keys=True)
        else:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    os.replace(tmp, path)


def run_site(mod, state, today, full):
    client = Client(mod.KEY, log=lambda m: log(f"[{mod.KEY}] {m}"))
    old = state.get("records", {})
    records = {} if full else copy.deepcopy(old)
    meta = copy.deepcopy(state.get("meta", {}))
    stats = new_stats()
    error = None
    try:
        mod.collect(client, records, meta, today, stats, full=full)
        prune(records, today)
        problems = site_problems(old, records, client, today)
        error = "; ".join(problems) or None
    except (Blocked, SiteBroken) as e:
        error = f"{type(e).__name__}: {e}"
    except Exception as e:  # a bug in one collector must not stop the others
        error = f"crash: {e!r}"
        log(f"[{mod.KEY}] {traceback.format_exc()}")
    stats.update({"calls": client.calls, "tries": client.tries, "failed": client.failed})
    log(f"[{mod.KEY}] {'FAILED ' + error if error else 'ok'} · {stats}")
    return {"key": mod.KEY, "error": error, "records": records, "meta": meta, "stats": stats}


def rows_of(states, today, order):
    rows, bad = {}, {}
    for key in order:
        rows[key], bad[key] = [], 0
        for sid, rec in (states.get(key) or {}).get("records", {}).items():
            if not is_open(rec, today) or not rec.get("title") or not rec.get("url"):
                continue
            check = valid_deadline(rec.get("deadline"), today)
            if check == "bad":
                bad[key] += 1
                continue
            if check == "ok":
                rows[key].append({**rec, "site": key, "sid": sid})
    return rows, bad


def summary(today, mode, results, doc, prev, fails, problems, bad):
    prev_ids = {i["id"] for i in (prev or {}).get("items") or []}
    ids = {i["id"] for i in doc["items"]}
    lines = [
        f"## 공모전 수집 {today} ({mode})",
        "",
        "| 사이트 | 결과 | 요청 | 목록 | 새 공고 | 변경 | 연장 | 재확인 | 사라짐 | 마감일 오류 |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in results:
        s = r["stats"]
        res = "정상" if not r["error"] else f"실패 {fails.get(r['key'], 0)}일째: {r['error']}"
        lines.append(f"| {NAMES[r['key']]} | {res} | {s['calls']} | {s['listed']} | {s['new']} | {s['changed']} | {s['extended']} | {s['rechecked']} | {s['missing']} | {bad.get(r['key'], 0)} |")
    lines += [
        "",
        f"내보낸 공모전 {len(ids)}건 (직전 {len(prev_ids)}건) · 새로 생긴 줄 {len(ids - prev_ids)} · 빠진 줄 {len(prev_ids - ids)}",
    ]
    if problems:
        lines += ["", "**발행 중단:** " + "; ".join(problems)]
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["probe", "dry-run", "publish"], default="dry-run")
    ap.add_argument("--full-resync", action="store_true")
    ap.add_argument("--skip-collect", action="store_true")
    ap.add_argument("--today", default=kst_today())
    ap.add_argument("--sites", default="")
    ap.add_argument("--data-dir", default=os.path.join(ROOT, "data", "contests"))
    ap.add_argument("--app", default=os.path.join(ROOT, "src", "data", "contests.json"))
    ap.add_argument("--summary")
    ap.add_argument("--out")
    a = ap.parse_args()
    today = a.today
    order = [s.KEY for s in SITES]
    chosen = [s for s in SITES if not a.sites or s.KEY in a.sites.split(",")]

    if a.mode == "probe":
        broken = 0
        for mod in chosen:
            try:
                log(f"{mod.NAME}: {mod.probe(Client(mod.KEY, log=log))}")
            except Exception as e:
                broken += 1
                log(f"{mod.NAME}: FAILED {type(e).__name__}: {e}")
        return 1 if broken else 0

    state_dir = os.path.join(a.data_dir, "state")
    states = {key: load(os.path.join(state_dir, f"{key}.json"), {"meta": {}, "records": {}}) for key in order}
    last = load(os.path.join(a.data_dir, "last-run.json"), {})
    fails = {k: v.get("failed_days", 0) for k, v in (last.get("sites") or {}).items()}
    checked = dict(last.get("checked") or {})

    results = []
    if not a.skip_collect:
        with ThreadPoolExecutor(max_workers=len(chosen) or 1) as pool:
            results = list(pool.map(lambda m: run_site(m, states[m.KEY], today, a.full_resync), chosen))
    for r in results:
        if r["error"]:
            fails[r["key"]] = fails.get(r["key"], 0) + 1
        else:
            fails[r["key"]] = 0
            states[r["key"]] = {"meta": r["meta"], "records": r["records"]}
            checked[NAMES[r["key"]]] = today

    rows, bad = rows_of(states, today, order)
    registry = load(os.path.join(a.data_dir, "ids.json"), {"ids": {}})
    contests, entries = merge(rows, registry["ids"], order, NAMES)
    known = {f"{k}:{sid}" for k in order for sid in states[k]["records"]}
    ids = {k: v for k, v in registry["ids"].items() if k in known}
    ids.update(entries)
    doc = export_doc(contests, today, [NAMES[k] for k in order], {NAMES[k]: checked.get(NAMES[k]) for k in order})
    prev = load(a.app, None)
    problems = export_problems(None if a.full_resync else prev, doc)
    report = summary(today, a.mode, results, doc, prev, fails, problems, bad)
    log(report)
    if a.summary:
        with open(a.summary, "a", encoding="utf-8") as f:
            f.write(report)

    if a.mode == "dry-run":
        if a.out:
            dump(a.out, doc, pretty=False)
        return 3 if problems else 0
    if problems:
        return 3
    for r in results:
        if not r["error"]:
            dump(os.path.join(state_dir, f"{r['key']}.json"), states[r["key"]])
    dump(os.path.join(a.data_dir, "ids.json"), {"ids": ids})
    dump(os.path.join(a.data_dir, "last-run.json"), {
        "date": today,
        "checked": checked,
        "exported": len(doc["items"]),
        "sites": {r["key"]: {"error": r["error"], "failed_days": fails[r["key"]], **r["stats"]} for r in results} or last.get("sites", {}),
    })
    dump(a.app, doc, pretty=False)
    log(f"wrote {len(doc['items'])} contests -> {os.path.relpath(a.app, ROOT)}")
    return 2 if any(n >= FAIL_ALERT_DAYS for n in fails.values()) else 0


if __name__ == "__main__":
    sys.exit(main())
