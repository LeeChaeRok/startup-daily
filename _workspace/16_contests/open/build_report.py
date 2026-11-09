"""contests_*.json → 혼자 열어 보는 HTML 보고서 (데이터 내장, 외부 요청 없음).
usage: python3 build_report.py ../contests_2026-11-02_09.json ../report_2026-11-02_09.html"""
import json, sys, collections

src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
items = d['items']
gov = d['gov']
raw = d['raw_counts']

site_rows = []
for site in ['링커리어', '위비티', '씽굿', '콘테스트코리아', '캠퍼스픽', '올콘']:
    mine = [r for r in items if any(s['site'] == site for s in r['sites'])]
    only = [r for r in mine if len(r['sites']) == 1]
    site_rows.append({'site': site, 'raw': raw.get(site, 0), 'only': len(only)})

payload = {
    'items': items,
    'sites': site_rows,
    'gov': {
        'K-Startup': [{'title': x['title'], 'org': (x['meta'][1] if len(x['meta']) > 1 else ''), 'field': (x['flags'][1] if len(x['flags']) > 1 else ''),
                       'posted': x['reg'], 'deadline': x['end'], 'url': f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn={x['sn']}"} for x in gov['K-Startup']],
        '기업마당': [{'title': x['title'], 'org': x['org'] if x['org'] != '직접수행' else x['ministry'], 'field': x['field'], 'posted': x['reg'],
                    'deadline': x['period'].split('~')[-1].strip(), 'url': f"https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId={x['id']}"} for x in gov['기업마당']],
    },
}

HTML = r"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>국내 공모전 주간 수집</title>
<style>
:root{--bg:#F3EFE6;--panel:#FBF8F2;--ink:#1D1B17;--ink2:#55504A;--ink3:#8A847C;--line:#DDD5C7;--accent:#B7321C;--chip:#ECE5D8}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#15161A;--panel:#1D1F24;--ink:#ECE7DE;--ink2:#B8B1A6;--ink3:#857F76;--line:#33353C;--accent:#E0694F;--chip:#272A31}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 64px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.02em}h2{font-size:18px;margin:36px 0 10px;letter-spacing:-.01em}
.sub{color:var(--ink2);margin:0 0 20px}.num{font-variant-numeric:tabular-nums}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border-top:2px solid var(--ink);border-bottom:1px solid var(--line)}
.stats div{padding:12px 14px;border-right:1px solid var(--line)}.stats div:last-child{border-right:0}
.stats b{display:block;font-size:24px;letter-spacing:-.02em}.stats span{color:var(--ink3);font-size:13px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;color:var(--ink3);font-weight:600;white-space:nowrap}
.bars td:nth-child(2){width:60%}.bar{height:8px;background:var(--accent);border-radius:1px;opacity:.85}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 12px;position:sticky;top:0;background:var(--bg);padding:10px 0;z-index:2;border-bottom:1px solid var(--line)}
select,input{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:6px 8px;min-height:36px}
input{flex:1;min-width:160px}.count{color:var(--ink2);font-size:13px;margin-left:auto}
.title a{color:var(--ink);text-decoration:none;font-weight:600}.title a:hover{text-decoration:underline}
.meta{color:var(--ink3);font-size:12.5px;margin-top:2px}
.chip{display:inline-block;background:var(--chip);border-radius:4px;padding:1px 6px;font-size:12px;color:var(--ink2);white-space:nowrap;margin:1px 2px 1px 0}
.prize{font-weight:700;white-space:nowrap}.prize small{display:block;font-weight:400;color:var(--ink3);font-size:12px}
.srcs a{font-size:12px;color:var(--ink2);margin-right:6px;white-space:nowrap}
.dl{white-space:nowrap}.dl.soon{color:var(--accent);font-weight:600}
.tabs{display:flex;gap:6px;margin:10px 0}.tabs button{font:inherit;background:none;border:1px solid var(--line);color:var(--ink2);border-radius:6px;padding:6px 12px;cursor:pointer;min-height:36px}
.tabs button[aria-selected=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.note{color:var(--ink2);font-size:13.5px;background:var(--panel);border-left:3px solid var(--accent);padding:10px 12px;margin:12px 0}
@media (max-width:720px){.hide-sm{display:none}th,td{padding:8px 4px}}
</style></head><body><main>
<h1>국내 공모전 주간 수집</h1>
<p class="sub">게시일 2026-11-02 ~ 11-09 · 민간 공모전 사이트 6곳 + 정부 지원사업 2곳 · 2026-11-09 수집</p>
<div class="stats" id="stats"></div>

<h2>사이트별</h2>
<table class="bars" id="siteTable"><thead><tr><th>사이트</th><th>수집 건수</th><th class="num">건수</th><th class="num hide-sm">여기만 있음</th></tr></thead><tbody></tbody></table>
<p class="note">같은 공모전이 여러 사이트에 함께 올라오는 일이 많아서, 비슷한 제목에 마감일이 같은 것은 하나로 합쳤습니다. 출처 칸에 실린 사이트가 모두 나옵니다.</p>

<h2>주제별 · 상금별 (공모전만)</h2>
<table class="bars" id="topicTable"><thead><tr><th>주제</th><th></th><th class="num">건수</th><th class="num hide-sm">1등 상금 중앙값</th></tr></thead><tbody></tbody></table>

<h2>전체 목록</h2>
<div class="filters">
 <select id="fKind"><option value="공모전">공모전만</option><option value="">전체 성격</option><option value="대외활동·모집">대외활동·모집</option><option value="이벤트">이벤트</option><option value="지원사업">지원사업</option></select>
 <select id="fTopic"><option value="">모든 주제</option></select>
 <select id="fPrize"><option value="">모든 상금</option><option>1천만원 이상</option><option>300만~1천만원</option><option>100만~300만원</option><option>100만원 미만</option><option value="nocash">금액 미상·현물</option></select>
 <select id="fSite"><option value="">모든 사이트</option></select>
 <select id="fSort"><option value="prize">상금 큰 순</option><option value="posted">최근 게시순</option><option value="deadline">마감 빠른 순</option><option value="sites">많이 실린 순</option></select>
 <input id="fQ" type="search" placeholder="제목·주최 검색">
 <span class="count" id="count"></span>
</div>
<table id="list"><thead><tr><th>공모전</th><th>상금</th><th class="hide-sm">마감</th><th class="hide-sm">출처</th></tr></thead><tbody></tbody></table>

<h2>정부 지원사업 (참고)</h2>
<p class="note">K-Startup·기업마당에는 공모전보다 입주 모집·교육·사업화 지원 공고가 대부분입니다. 공모전·경진대회는 몇 건뿐이라 위 목록과 따로 둡니다. 두 곳 모두 공식 API가 있습니다(공공데이터포털 15125364, 기업마당 crtfcKey). 아래는 공개 목록 페이지에서 모은 결과입니다.</p>
<div class="tabs" role="tablist" id="govTabs"></div>
<table id="govList"><thead><tr><th>공고</th><th class="hide-sm">분야</th><th>게시</th><th>마감</th></tr></thead><tbody></tbody></table>
</main>
<script>
const D = __DATA__;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const won = v => v == null ? '' : v >= 1e8 ? (v/1e8).toFixed(v%1e8?1:0)+'억원' : v >= 1e4 ? Math.round(v/1e4).toLocaleString()+'만원' : v.toLocaleString()+'원';
const best = r => r.prize_top || r.prize_total || 0;
const today = '2026-11-09';
const days = d => d ? Math.round((new Date(d) - new Date(today)) / 864e5) : 999;
const contests = D.items.filter(r => r.kind === '공모전');

// stats
const cash = contests.filter(r => best(r));
const big = contests.filter(r => best(r) >= 1e7);
$('#stats').innerHTML = [
  [D.sites.reduce((a, s) => a + s.raw, 0), '수집한 게시물 (6곳)'],
  [D.items.length, '중복을 합친 건수'],
  [contests.length, '그중 공모전'],
  [cash.length, '상금 금액이 확인된 공모전'],
  [big.length, '1등 또는 총상금 1천만원 이상'],
].map(([n, l]) => `<div><b class="num">${n}</b><span>${l}</span></div>`).join('');

// sites
const maxRaw = Math.max(...D.sites.map(s => s.raw));
$('#siteTable tbody').innerHTML = D.sites.map(s => `<tr><td>${s.site}</td><td><div class="bar" style="width:${s.raw / maxRaw * 100}%"></div></td><td class="num">${s.raw}</td><td class="num hide-sm">${s.only}</td></tr>`).join('');

// topics
const byTopic = {};
contests.forEach(r => (byTopic[r.topic] ||= []).push(r));
const median = a => { a = a.filter(Boolean).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
const topics = Object.entries(byTopic).sort((a, b) => b[1].length - a[1].length);
const maxT = topics[0][1].length;
$('#topicTable tbody').innerHTML = topics.map(([t, rs]) => `<tr><td>${t}</td><td><div class="bar" style="width:${rs.length / maxT * 100}%"></div></td><td class="num">${rs.length}</td><td class="num hide-sm">${won(median(rs.map(r => r.prize_top))) || '—'}</td></tr>`).join('');

// filters
topics.forEach(([t]) => $('#fTopic').insertAdjacentHTML('beforeend', `<option>${t}</option>`));
D.sites.forEach(s => $('#fSite').insertAdjacentHTML('beforeend', `<option>${s.site}</option>`));
function render() {
  const k = $('#fKind').value, t = $('#fTopic').value, p = $('#fPrize').value, s = $('#fSite').value, q = $('#fQ').value.trim().toLowerCase(), sort = $('#fSort').value;
  let rows = D.items.filter(r =>
    (!k || r.kind === k) && (!t || r.topic === t) && (!s || r.sites.some(x => x.site === s)) &&
    (!p || (p === 'nocash' ? !best(r) : r.prize_bucket === p)) &&
    (!q || (r.title + ' ' + r.host).toLowerCase().includes(q)));
  const cmp = { prize: (a, b) => best(b) - best(a), posted: (a, b) => b.posted.localeCompare(a.posted), deadline: (a, b) => (a.deadline || '9').localeCompare(b.deadline || '9'), sites: (a, b) => b.sites.length - a.sites.length }[sort];
  rows.sort(cmp);
  $('#count').textContent = rows.length + '건';
  $('#list tbody').innerHTML = rows.map(r => {
    const dd = days(r.deadline);
    const prize = r.prize_top ? `1등 ${won(r.prize_top)}${r.prize_total ? `<small>총 ${won(r.prize_total)}</small>` : ''}`
      : r.prize_total ? `총 ${won(r.prize_total)}` : r.prize_band ? `<small>${esc(r.prize_band)}</small>` : `<small>${esc(r.prize_kind === '미상' ? '금액 미상' : r.prize_kind)}</small>`;
    return `<tr><td class="title"><a href="${esc(r.sites[0].url)}" target="_blank" rel="noopener">${esc(r.title)}</a>
      <div class="meta">${esc(r.host)}${r.target ? ' · ' + esc(r.target.slice(0, 40)) : ''}</div>
      <div><span class="chip">${esc(r.topic)}</span>${r.kind !== '공모전' ? `<span class="chip">${esc(r.kind)}</span>` : ''}${r.perks.filter(x => x !== '상장').map(x => `<span class="chip">${esc(x)}</span>`).join('')}<span class="chip">게시 ${r.posted.slice(5)}</span></div></td>
      <td class="prize num">${prize}</td>
      <td class="dl num hide-sm ${dd <= 7 ? 'soon' : ''}">${r.deadline ? r.deadline.slice(5) : '—'}<div class="meta">${dd <= 0 ? '오늘' : 'D-' + dd}</div></td>
      <td class="srcs hide-sm">${r.sites.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${x.site}</a>`).join('')}</td></tr>`;
  }).join('');
}
['#fKind', '#fTopic', '#fPrize', '#fSite', '#fSort'].forEach(id => $(id).addEventListener('change', render));
$('#fQ').addEventListener('input', render);
render();

// gov
let govTab = 'K-Startup';
function renderGov() {
  $('#govTabs').innerHTML = Object.keys(D.gov).map(g => `<button role="tab" aria-selected="${g === govTab}" data-g="${g}">${g} · ${D.gov[g].length}</button>`).join('');
  $('#govList tbody').innerHTML = D.gov[govTab].slice().sort((a, b) => b.posted.localeCompare(a.posted)).map(x =>
    `<tr><td class="title"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta">${esc(x.org)}</div></td><td class="hide-sm"><span class="chip">${esc(x.field)}</span></td><td class="num">${x.posted.slice(5)}</td><td class="num">${(x.deadline || '').slice(5)}</td></tr>`).join('');
}
$('#govTabs').addEventListener('click', e => { const g = e.target.dataset.g; if (g) { govTab = g; renderGov(); } });
renderGov();
</script></body></html>"""

open(out, 'w').write(HTML.replace('__DATA__', json.dumps(payload, ensure_ascii=False)))
print('wrote', out)
