#!/usr/bin/env python3
"""One-off: start the batch state from the manual collection of 2026-11-09 instead of a full
re-crawl, and the id registry from the contests the app already shows, so every saved contest
and shared link keeps its id.

  python3 scripts/contests/seed.py _workspace/16_contests/open 2026-11-09 [--data-dir DIR] [--app FILE] [--with-campuspick]
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SNAPSHOT = {  # site key → (file, id pattern in the notice URL, name in contests.json)
    "wevity": ("wevity.json", r"ix=(\d+)", "위비티"),
    "contestkorea": ("contestkorea.json", r"str_no=(\d+)", "콘테스트코리아"),
    "linkareer": ("linkareer.json", r"/activity/(\d+)", "링커리어"),
    "thinkcontest": ("thinkcontest.json", r"contest_pk=(\d+)", "씽굿"),
    "allcon": ("allcon.json", r"/view/contest/(\d+)", "올콘"),
    "campuspick": ("campuspick.json", r"[?&]id=(\d+)", "캠퍼스픽"),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("snapshot")
    ap.add_argument("as_of")
    ap.add_argument("--data-dir", default=os.path.join(ROOT, "data", "contests"))
    ap.add_argument("--app", default=os.path.join(ROOT, "src", "data", "contests.json"))
    ap.add_argument("--with-campuspick", action="store_true", help="only for comparing with the manual export")
    a = ap.parse_args()
    keys = [k for k in SNAPSHOT if k != "campuspick" or a.with_campuspick]
    os.makedirs(os.path.join(a.data_dir, "state"), exist_ok=True)
    for key in keys:
        file, pat, _ = SNAPSHOT[key]
        records = {}
        for row in json.load(open(os.path.join(a.snapshot, file), encoding="utf-8")):
            if (row.get("deadline") or "")[:10] < a.as_of:
                continue
            sid = re.search(pat, row["url"])[1]
            rec = {k: v for k, v in row.items() if k != "site"}
            rec["deadline"] = rec["deadline"][:10]
            rec.update({"first_seen": row.get("posted") or a.as_of, "last_seen": a.as_of, "last_checked": a.as_of, "missing": 0})
            records[sid] = rec
        meta = {"depth": 330} if key == "thinkcontest" else {}
        with open(os.path.join(a.data_dir, "state", f"{key}.json"), "w", encoding="utf-8") as f:
            json.dump({"meta": meta, "records": records}, f, ensure_ascii=False, indent=1, sort_keys=True)
            f.write("\n")
        print(f"{key}: {len(records)} open notices")
    by_name = {SNAPSHOT[k][2]: k for k in keys}
    ids = {}
    for item in json.load(open(a.app, encoding="utf-8"))["items"]:
        for s in item["sites"]:
            key = by_name.get(s["site"])
            if key:
                ids[f"{key}:{re.search(SNAPSHOT[key][1], s['url'])[1]}"] = item["id"]
    with open(os.path.join(a.data_dir, "ids.json"), "w", encoding="utf-8") as f:
        json.dump({"ids": ids}, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    print(f"ids: {len(ids)} notices → {len(set(ids.values()))} contests")


if __name__ == "__main__":
    sys.exit(main())
