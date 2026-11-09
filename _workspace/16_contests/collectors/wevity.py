"""위비티 공모전: 게시일 = 상세 페이지 포스터 업로드 시각. usage: python3 wevity.py 2026-11-02 2026-11-09"""
import re,html,json,subprocess,sys,time
FROM,TO=sys.argv[1],sys.argv[2]
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36'
def get(u):
    time.sleep(0.6); return subprocess.run(['curl','-sL','-A',UA,'-m','30',u],capture_output=True).stdout.decode('utf-8','ignore')
txt=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
ids=set()
for p in range(1,13):
    ids|={int(x) for x in re.findall(r'ix=(\d+)',get(f'https://www.wevity.com/?c=find&s=1&gub=1&gp={p}'))}
out=[];old=0
for ix in sorted(ids,reverse=True):
    url=f'https://www.wevity.com/?c=find&s=1&gbn=view&ix={ix}'
    t=get(url)
    up=re.search(r'upload/contest/(\d{4})(\d{2})(\d{2})',t)
    s=txt(re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S))
    m=re.search(r'직접입력 (.*) 조회수 : [\d,]+ 분야 (.*?) 응모대상 (.*?) 주최/주관 (.*?) 후원/협찬 ?(.*?) 접수기간 (\S+) ~ (\S+) .*?총 상금 ?(.*?) ?1등 상금 ?(.*?) ?홈페이지',s)
    if not up or not m: continue
    posted=f'{up[1]}-{up[2]}-{up[3]}'
    if posted<FROM:
        old+=1
        if old>=12: break
        continue
    old=0
    if posted>TO: continue
    og=re.search(r'property="og:title" content="([^"]+)"',t)
    out.append({'site':'위비티','title':html.unescape(og[1]) if og else m[1][-80:],'site_category':m[2],'target':m[3],'host':m[4].strip(' /'),'sponsor':m[5].strip(),'posted':posted,'start':m[6],'deadline':m[7],
      'prize_text':' / '.join(x for x in [('총상금 '+m[8].strip()) if m[8].strip() else '',('1등 '+m[9].strip()) if m[9].strip() else ''] if x),'url':url})
json.dump(out,open('wevity.json','w'),ensure_ascii=False,indent=1)
print(len(out),'items')
