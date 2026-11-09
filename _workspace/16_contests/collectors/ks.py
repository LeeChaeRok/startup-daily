import re,html,json,subprocess,sys
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36'
def get(u): return subprocess.run(['curl','-sL','-A',UA,'-m','30',u],capture_output=True).stdout.decode('utf-8','ignore')
out=[]
for p in range(1,15):
    t=get(f'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?page={p}')
    items=re.findall(r'<li class="notice">(.*?)</li>\s*(?=<li|</ul)',t,re.S)
    if not items: break
    for it in items:
        sn=re.search(r'go_view\((\d+)\)',it); sn=sn and sn.group(1)
        txt=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
        title=re.search(r'<p class="tit">(.*?)</p>',it,re.S)
        flags=[txt(x) for x in re.findall(r'<span class="flag[^"]*">(.*?)</span>',it,re.S)]
        lists=[txt(x) for x in re.findall(r'<span class="list">(.*?)</span>',it,re.S)]
        d={'sn':sn,'title':txt(title.group(1)) if title else '','flags':flags,'meta':lists}
        for k,lab in [('reg','등록일자'),('start','시작일자'),('end','마감일자')]:
            m=re.search(lab+r'\s*(\d{4}-\d{2}-\d{2})',txt(it)); d[k]=m and m.group(1)
        out.append(d)
    print(p,len(items),min(x['reg'] or '9' for x in out[-len(items):]),file=sys.stderr)
json.dump(out,open('ks.json','w'),ensure_ascii=False,indent=1)
