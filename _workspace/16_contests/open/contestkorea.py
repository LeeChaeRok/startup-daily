"""콘테스트코리아 대회·공모전: 게시일 = str_no 앞 8자리. 상세에서 시상내역. usage: python3 contestkorea.py 2026-11-02 2026-11-09"""
import re,html,json,subprocess,sys,time
FROM,TO=[d.replace('-','') for d in sys.argv[1:3]]
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36'
def get(u):
    time.sleep(0.6); return subprocess.run(['curl','-sL','-A',UA,'-m','30',u],capture_output=True).stdout.decode('utf-8','ignore')
txt=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
Q='https://www.contestkorea.com/sub/list.php?displayrow=12&int_gbn=1&Txt_sGn=1&Txt_key=all&Txt_word=&Txt_bcode=&Txt_code1=&Txt_aarea=&Txt_area=&Txt_sortkey=a.int_sort&Txt_sortword=desc&Txt_ahost=&Txt_host=&Txt_award=&Txt_award2=&Txt_code3=&Txt_tipyn=&Txt_comment=&Txt_resultyn=&Txt_actcode=&page='
seen={};miss=0
TODAY=sys.argv[3]
for p in range(1,600):
    t=get(Q+str(p)); t=t[t.find('list_style_2'):t.find('class="pagination"')]
    hit=0
    for li in re.split(r'<div class="title">',t)[1:]:
        m=re.search(r'href="(view\.php[^"]*str_no=(\d+))"',li)
        if not m or m[2] in seen: continue
        if FROM<=m[2][:8]<=TO:
            hit+=1
            dd=re.search(r'접수\s*(\d\d)\.(\d\d)~(\d\d)\.(\d\d)',txt(li))
            if dd:
                y=int(m[2][:4])+(1 if (dd[3],dd[4])<(dd[1],dd[2]) else 0)
                if f'{y}-{dd[3]}-{dd[4]}'<TODAY: continue
            seen[m[2]]={'href':m[1],'category':txt(re.search(r'class="category">(.*?)</span>',li,re.S)[1]),'title':txt(re.search(r'class="txt">(.*?)</span>',li,re.S)[1])}
    miss=0 if hit else miss+1
    if miss>=3: break
out=[]
for sn,v in sorted(seen.items(),reverse=True):
    url='https://www.contestkorea.com/sub/'+html.unescape(v['href'])
    s=txt(re.sub(r'<script.*?</script>|<style.*?</style>','',get(url),flags=re.S))
    k=s.find(' 대표분야 '); s=s[max(0,k-200):]  # the menu above also says 주최.주관
    f=lambda a,b: (re.search(re.escape(a)+r' (.*?) (?:'+b+')',s) or [None,None])[1]
    st,_,en=(f('접수기간','심사기간|대회지역|시상내역') or '').partition(' ~ ')
    out.append({'site':'콘테스트코리아','title':v['title'],'site_category':v['category'],'host':(f('주최 . 주관','대표분야') or '').strip(),'target':f('참가대상','접수기간'),
      'posted':f'{sn[:4]}-{sn[4:6]}-{sn[6:8]}','start':st.replace('.','-'),'deadline':en.replace('.','-'),'prize_text':f('시상내역','접수방법|참가비용') or '','url':url})
json.dump(out,open('contestkorea.json','w'),ensure_ascii=False,indent=1)
print(len(out),'items')
