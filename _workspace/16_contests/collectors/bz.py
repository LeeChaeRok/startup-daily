import re,html,json,subprocess,collections
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36'
def get(u): return subprocess.run(['curl','-sL','-A',UA,'-m','40',u],capture_output=True).stdout.decode('utf-8','ignore')
txt=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
out=[]
for p in range(1,16):
    t=get(f'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do?cpage={p}&schEndAt=N')
    tb=t[t.find('<tbody'):t.find('</tbody>')]
    rows=re.findall(r'<tr>(.*?)</tr>',tb,re.S)
    if not rows: break
    for r in rows:
        tds=re.findall(r'<td[^>]*>(.*?)</td>',r,re.S)
        if len(tds)<8: continue
        pid=re.search(r'pblancId=(PBLN_\d+)',r)
        out.append({'no':txt(tds[0]),'field':txt(tds[1]),'title':txt(tds[2]),'period':txt(tds[3]),'ministry':txt(tds[4]),'org':txt(tds[5]),'reg':txt(tds[6]),'id':pid and pid.group(1)})
    print(p,len(rows),min(x['reg'] for x in out[-len(rows):]))
json.dump(out,open('bz.json','w'),ensure_ascii=False,indent=1)
w=[x for x in out if x['reg']>='2026-11-02']
print('week',len(w),collections.Counter(x['field'] for x in w))
print(collections.Counter(x['reg'] for x in w))
