"""Site collectors. Each module has KEY, NAME, probe(client) and
collect(client, records, meta, today, stats, full=False), which updates the site's state in place.

캠퍼스픽 is not here: its terms forbid access by programs, scripts and bots (이용약관 제12조), so it
is not collected at all (_workspace/18_contests_batch-design.md §10)."""
from sites import allcon, contestkorea, linkareer, thinkcontest, wevity

# merge order: a merged contest takes its title and topic from the first site in this list
SITES = [wevity, contestkorea, linkareer, thinkcontest, allcon]
BY_KEY = {s.KEY: s for s in SITES}
NAMES = {s.KEY: s.NAME for s in SITES}
