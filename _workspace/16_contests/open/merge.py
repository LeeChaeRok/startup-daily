"""6개 민간 공모전 사이트 + 정부 지원사업 2곳을 한 형식으로: 상금 숫자화, 주제 분류, 사이트 간 중복 합치기."""
import json,re,collections,sys
OUT=sys.argv[1]; TODAY=sys.argv[2]

def load(path,site):
    d=json.load(open(path))
    for x in d: x.setdefault('site',site)
    return d

rows0=load('wevity.json','위비티')+load('contestkorea.json','콘테스트코리아')+load('linkareer.json','링커리어')+load('campuspick.json','캠퍼스픽')+load('thinkcontest.json','씽굿')+load('allcon.json','올콘')
rows=[x for x in rows0 if (x.get('deadline') or '')[:10]>=TODAY]

# ---------- 상금 ----------
def won(s):
    """'1,000만원' '300만 원' '1억 5천만원' '2,000,000원' '1000만원' → int"""
    s=s.replace(',','')
    m=re.search(r'(\d+(?:\.\d+)?)\s*억(?:\s*(\d+)\s*천\s*만)?',s)
    if m: return int(float(m[1])*1e8+(int(m[2])*1e7 if m[2] else 0))
    m=re.search(r'(\d+(?:\.\d+)?)\s*천\s*만\s*원?',s)
    if m: return int(float(m[1])*1e7)
    m=re.search(r'(\d+(?:\.\d+)?)\s*백\s*만\s*원?',s)
    if m: return int(float(m[1])*1e6)
    m=re.search(r'(\d+(?:\.\d+)?)\s*만\s*원?',s)
    if m: return int(float(m[1])*1e4)
    m=re.search(r'(\d{5,})\s*원',s)
    if m: return int(m[1])
    return None

AMT=r'((?:\d[\d,\.]*\s*억\s*)?(?:\d[\d,\.]*\s*(?:천|백)?\s*만\s*원?|\d[\d,]{4,}\s*원))'
def prize(x):
    t=' '.join(str(x.get(k) or '') for k in ('prize_text','prize'))
    t=re.sub(r'\s+',' ',t)
    BAND=r'5천만원\s*이상|5천만원~3천만원|3천만원~1천만원|1천만원\s*이하|3천만원 미만~1천만원 이상|1천만원\s*미만|1천만원 미만'
    band=(re.search(BAND,t) or [None])[0]
    tn=re.sub(BAND,'',t)
    top=total=None
    m=re.search(r'(?:총\s*상금|총\s*시상금|시상\s*규모|상금\s*총|총)\s*[:：]?\s*'+AMT,tn)
    if m: total=won(m[1])
    m=re.search(r'(?:1등|1위|대상|최우수상?|작가대상|본상)[^0-9가-힣]{0,6}(?:\(\d+\S*\)\s*)?(?:상금\s*)?[:：]?\s*'+AMT,tn)
    if m: top=won(m[1])
    for k,v in (('prize_total_krw','total'),('prize_top_krw','top')):
        a=x.get(k)
        try: a=int(a) if a not in (None,'None','') else None
        except: a=None
        if v=='total' and total is None and not (band and a in (10000000,30000000,50000000)): total=a
        if v=='top' and top is None: top=a
    if top and total and top>total: total=None   # 잘못 잡힌 총액
    perks=[k for k,p in [('채용·인턴',r'채용|인턴|입사|가산점'),('상품',r'상품|상품권|기프티|골드바|굿즈|경품|맥북|스타일러'),('상장',r'상장|표창|장관상|시장상')] if re.search(p,t)]
    best=top or total
    if best: kind='현금'
    elif band and band not in ('기타',): kind='현금(규모만)'
    elif perks: kind=perks[0]
    else: kind='미상'
    return {'prize_top':top,'prize_total':total,'prize_band':band,'prize_kind':kind,'perks':perks,'prize_raw':t.strip()[:160]}

def band_of(v):
    if v is None: return None
    return '1천만원 이상' if v>=1e7 else '300만~1천만원' if v>=3e6 else '100만~300만원' if v>=1e6 else '100만원 미만'

# ---------- 성격(공모전인지) ----------
NOT_CONTEST=r'서포터즈|기자단|봉사|자원봉사|홍보대사|모니터단|평가단|참여단|동아리.*모집|교육생|아카데미|멘토 모집|대관 공모|입주|채용 일정|명예보좌관|탐험단|레지던시'
def kind(x):
    t=x['title']
    if re.search(r'공모전|경진대회|콘테스트|챌린지|해커톤|신춘문예|문학상|공모\b|대회|콩쿠르|아이디어톤|드래프톤|백일장', t) and not re.search(r'이벤트 안내|구독 이벤트|설문조사 이벤트',t): return '공모전'
    if re.search(r'지원사업 참여|활동 지원사업|참여 기업 모집|입주|대관',t): return '지원사업'
    if re.search(r'이벤트|퀴즈|구독|설문|캠페인',t): return '이벤트'
    if re.search(NOT_CONTEST+r'|모집|캠프',t): return '대외활동·모집'
    return '공모전'

# ---------- 주제 ----------
TOPICS=[  # 앞에서부터 먼저 맞는 것; 제목으로 먼저, 안 맞으면 사이트 분야로
 ('음악·공연·예체능',r'음악|밴드|콩쿠르|댄스|무용|공연|노래|가요|e스포츠|요리대회|선발대회|BGM'),
 ('창업·비즈니스',r'창업|스타트업|IR\b|데모데이|비즈니스|사업화|오픈 ?이노베이션|Open Innovation|투자'),
 ('영상·사진·숏폼',r'영상|숏폼|쇼츠|숏츠|UCC|사진|영화|디카시|촬영|크리에이터'),
 ('문학·글·시나리오',r'문학|신춘문예|소설|시나리오|수기|에세이|글쓰기|문예|웹소설|편지|논술|희곡|백일장|원고|나도 작가|글판|스토리'),
 ('AI·데이터·SW',r'해커톤|드래프톤|데이터|인공지능|AI 활용|AI 역량|AX|분석 경진|SW|소프트웨어|앱 개발|알고리즘|코딩|(?<![A-Za-z])IT(?![A-Za-z])|로컬AI|AI 달인|벤치마크|워크톤'),
 ('디자인·캐릭터·미술',r'디자인|캐릭터|마스코트|웹툰|만화|일러스트|미술|그림|포스터|로고|패키지|IP 창'),
 ('광고·마케팅·네이밍',r'광고|마케팅|네이밍|명칭|슬로건|브랜드|홍보|꿀조합|이벤트'),
 ('과학·학술·논문',r'논문|학술|과학|공학|연구|리포트|발명|특허'),
 ('건축·도시·공간',r'건축|인테리어|공간|정원|조경|한옥|꾸미기'),
 ('정책·아이디어 제안',r'정책|아이디어|제안|혁신|국민|시민|행정|청년의 시간|참여 예산|미래의제|규제|용어|사례|Idea|상상'),
 ('음악·공연·예체능',r'체육|스포츠|예체능'),
]
def topic(x):
    for t in (x['title'], str(x.get('site_category') or x.get('category') or '')):
        for name,p in TOPICS:
            if re.search(p,t): return name
    return '기타'

# ---------- 합치기 ----------
def key(title):
    t=re.sub(r'\[[^\]]*\]|\([^)]*\)|<[^>]*>','',title)
    t=re.sub(r'20\d\d년?|제\s*\d+\s*회|[^0-9A-Za-z가-힣]','',t).lower()
    return t[:18]

STOP=r'20\d\d년?|제\s*\d+\s*회|공모전|경진대회|공모|대회|콘테스트|챌린지|모집|아이디어|영상|숏폼|사진|디자인|국민|전국|청년|대학생'
def grams(t):
    t=re.sub(r'\[[^\]]*\]|'+STOP,'',t)
    t=re.sub(r'[^0-9A-Za-z가-힣]','',t).lower()
    return {t[i:i+2] for i in range(len(t)-1)}
def sim(a,b):
    a,b=grams(a),grams(b)
    return len(a&b)/max(1,min(len(a),len(b)))
merged={}
for x in rows:
    k=key(x['title'])
    dl=(x.get('deadline') or '')[:10]
    for k2,m in merged.items():
        s2=sim(x['title'],m['title'])
        if any(z['site']==x['site'] for z in m['sites']): continue   # one notice per site per contest
        if (dl and dl==m['deadline'] and s2>=0.6) or (s2>=0.9 and (not dl or not m['deadline'] or abs(int(dl.replace('-',''))-int(m['deadline'].replace('-','')))<=3)): k=k2; break
    p=prize(x)
    r={'title':x['title'].strip(),'host':(x.get('host') or '').strip(),'posted':x.get('posted'),'deadline':(x.get('deadline') or '')[:10],
       'target':str(x.get('target') or '')[:80],'site_category':str(x.get('site_category') or x.get('category') or ''),**p}
    if k in merged and any(z['site']==x['site'] for z in merged[k]['sites']):
        k=k+'#'+x['url']
    if k in merged:
        m=merged[k]
        m['sites'].append({'site':x['site'],'url':x['url'],'posted':x.get('posted')})
        m['posted']=min(m['posted'],r['posted'])
        for f in ('prize_top','prize_total','prize_band'):
            if m[f] is None and r[f] is not None: m[f]=r[f]
        if m['prize_kind'] in ('미상','상장','상품') and r['prize_kind'].startswith('현금'): m['prize_kind']=r['prize_kind']
        m['perks']=sorted(set(m['perks'])|set(r['perks']))
        if len(r['prize_raw'])>len(m['prize_raw']): m['prize_raw']=r['prize_raw']
    else:
        r['sites']=[{'site':x['site'],'url':x['url'],'posted':x.get('posted')}]
        r['topic']=topic(x); r['kind']=kind(x)
        merged[k]=r
items=sorted(merged.values(),key=lambda r:(r['posted'],r['prize_top'] or r['prize_total'] or 0),reverse=True)
for r in items:
    if r['prize_top'] and r['prize_total'] and r['prize_top']>r['prize_total']: r['prize_total']=None
    if r['kind']=='대외활동·모집' and (r['prize_top'] or r['prize_total']): r['kind']='공모전'   # 상금이 걸린 '참가팀 모집'
for r in items: r['prize_bucket']=band_of(r['prize_top'] or r['prize_total']) or ('규모만: '+r['prize_band'] if r['prize_band'] else r['prize_kind'])

gov={}
json.dump({'items':items,'raw_counts':collections.Counter(x['site'] for x in rows),'gov':gov},open(OUT,'w'),ensure_ascii=False,indent=1)
print('raw',len(rows),'merged',len(items))
print(collections.Counter(x['site'] for x in rows))
print(collections.Counter(r['kind'] for r in items))
print(collections.Counter(r['topic'] for r in items if r['kind']=='공모전'))
print(collections.Counter(r['prize_kind'] for r in items if r['kind']=='공모전'))
print(collections.Counter(len(r['sites']) for r in items))
