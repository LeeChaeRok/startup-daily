# 01. 시장 리서치: Startup Daily 포지셔닝·경쟁·신뢰

- 작성: market-researcher / 기준일 2026-10-22
- 범위: 국내 스타트업 미디어·DB·뉴스레터, 해외 스타트업 인텔리전스·큐레이션, AI 생성 콘텐츠의 신뢰 문제, 포지셔닝, 수익화
- 표기: 출처가 있는 수치는 [번호]로 표시했다. 출처 없는 판단은 "추정" 또는 "판단"으로 적었다. 웹 검색으로 가격을 확인하지 못한 항목은 "확인 불가"로 적었다.

---

## 0. 요약(5줄)

1. 국내 시장은 **데이터 DB**(THE VC, 혁신의숲, 아웃스탠딩 DB)와 **뉴스형 미디어**(플래텀, 벤처스퀘어, 아웃스탠딩, 스타트업레시피)로 나뉜다. 둘 다 사실상 **한국 기업과 투자 뉴스** 중심이다. **"해외의 덜 알려진 떠오르는 스타트업을 한국어로 깊게, 매일 한 묶음"** 자리는 비어 있다.
2. 해외에서는 이 자리를 Exploding Topics의 Trending Startups(유료, 월 $99부터)[13]와 Sifted의 Rising 100·리더보드[11][12], VC용 발굴 툴(Harmonic·Specter)[14]이 나눠 갖고 있다. 이들 모두 **"발견(discovery)" 자체를 돈 받고 판다.** Startup Daily가 겨눌 가치도 미디어보다 발견에 가깝다.
3. 가장 큰 위협은 경쟁사가 아니라 **신뢰**다. 현재 `startups.json`(80개사)을 직접 점검했다. 언론 보도 링크 148개 중 **HTTP 200으로 열리는 것은 8개(5%)뿐**이고, 89개(60%)는 404/410이다. 폐업한 Lilium을 "재상장 추진"으로, 2026년 3월 Google 인수가 끝난 Wiz를 "Series D"로 쓰는 등 **사실 오류가 확인됐다**(§4).
4. 2026-01-22 시행된 한국 AI 기본법은 생성형 AI 결과물 표시 의무를 둔다[19]. EBU·BBC 연구에서는 AI 뉴스 답변의 45%에 중대한 문제가 있었다[16]. 국내 독자도 AI가 자료조사·정리를 맡은 기사에 거부감을 보인다[18]. 따라서 **"AI 생성 + 출처 검증 + 갱신일" 표시는 선택이 아니라 기본값이어야 한다.**
5. 개편 방향: 매일 5~10개를 쏟아내는 대신 **"매일 3~5개, 검증된 발견"**으로 간다. 수익은 유료 구독보다 **뉴스레터 + 아카이브/검색 + (장기) B2B 스카우팅 리포트** 순서로 쌓는다.

---

## 1. 경쟁 지형

### 1-1. 국내

| 서비스 | 유형 | 포맷·주기 | 수익 모델 | 독자층(추정 포함) | Startup Daily와의 관계 |
|---|---|---|---|---|---|
| **THE VC** (thevc.kr) | 투자 DB | 기업·투자자 프로필, 컬렉션, 월간 투자 결산 | 무료 / **베이직 월 15만원(VAT 별도)** / 프로(가격 확인 불가)[1] | VC, 심사역, 창업자, 기자 | 국내 기업 사실 확인용 **참조 소스**다. 직접 경쟁하지는 않는다. |
| **혁신의숲** (마크앤컴퍼니) | 성장 분석 DB | 기업 프로필(트래픽·거래액·고용), 월간 투자 결산 리포트 | 2025-07 "혁신의숲 2.0"으로 사업화 추진, 요금 확인 불가[2] | VC, 기업 전략팀 | 국내 기업의 **성장 지표 출처**로 쓸 수 있다. |
| **아웃스탠딩** | IT·스타트업 미디어 + DB | 하루 여러 건의 기사, 월간 투자 리포트, 스타트업 DB 약 4.5만 개사, e북, 카톡 커뮤니티[3] | 광고, 브랜디드 콘텐츠, e북, 결제 상품(가격 비공개)[3] | 국내 IT 종사자 | "쉽고 재미있는" 톤의 국내 뉴스. 해외 딥다이브는 약하다(판단). |
| **플래텀 / 벤처스퀘어** | 스타트업 전문 뉴스 | 매일 뉴스·보도자료, 벤처스퀘어는 주간 뉴스레터[4][5] | 광고, 행사, 보도자료 | 창업 생태계 종사자 | 국내 소식 중심이다. 플래텀 임직원 6명(2026-06 기준)[4]으로 소규모. |
| **스타트업레시피** | 미디어 + 투자 데이터 | 뉴스레터 중심 구독형 미디어 + 웹서비스, 연간 투자 리포트[6] | 구독, 데이터, 행사(가격 확인 불가) | 창업자, 지원기관 | 뉴스레터 + 데이터 결합 모델의 국내 선례다. |
| **디스콰이엇** | 메이커 커뮤니티(한국판 Product Hunt) | 프로덕트 런칭·투표, 아티클, 팀빌딩 | 채용·커뮤니티 | 누적 사용자 33만(2023-02)[7] | "초기 제품 발견" 수요가 있다는 증거다. 다만 국내 메이커 위주. |
| **롱블랙** | 지식 구독 | **하루 1개 노트**, 월 4,900원[8] | 유료 구독 | 2030 직장인, 기획자 | **"하루 하나, 깊게"를 유료로 파는 국내 선례**다. 형식상 가장 가깝다. |
| **뉴닉** | 시사 뉴스레터 | 평일 뉴스레터, 퍼블리 멤버십 인수(2024)로 지식 플랫폼화 | 광고, 멤버십 | 구독자 60만(2024-02)[9] | 톤·브랜딩·리텐션(캐릭터, 친근한 말투)의 벤치마크. |
| **EO** | 창업 영상 미디어 | 유튜브 인터뷰·다큐 | 브랜디드 콘텐츠, 기관 제작[10] | 구독자 20만+(2020 기준)[10] | 창업자 스토리 수요가 크다는 근거다. 영상은 범위 밖. |

**국내 시사점:** 국내 경쟁자는 모두 **한국 기업**과 **투자 이벤트(누가 얼마 받았나)**를 축으로 한다. **"해외의 아직 덜 알려진 회사"를 "왜 지금 떠오르는지"까지 한국어로 정리하는 정기 매체**는 확인되지 않았다(판단, 검색 기준).

### 1-2. 해외

| 서비스 | 유형 | 핵심 가치 | 가격(기준 시점) | Startup Daily에 주는 교훈 |
|---|---|---|---|---|
| **Product Hunt** | 일간 런칭 리더보드 | 매일 새 제품 + 커뮤니티 투표 | 무료 | 하루 단위 리더보드가 습관을 만든다. 다만 "제품" 단위라 회사·투자 맥락은 약하다. |
| **Crunchbase** | 기업 DB + 예측 | 2026-03 기준 예측 신호 4.55억 건 이상, 성장·IPO·인수 예측[15] | Pro 월 $49(연간), Business 약 $199[15] | "예측" 라벨이 붙은 데이터는 신뢰도 검증이 부족하다는 비판을 받는다[15]. |
| **CB Insights / Dealroom** | 엔터프라이즈 인텔리전스 | 리포트, 시장 맵 | CB Insights 연 $2.5만~10만+(추정), Dealroom 연 €1.25만~(추정)[20] | B2B 리포트 시장은 크지만 진입 비용도 높다. |
| **Exploding Topics – Trending Startups** | 트렌드·급성장 스타트업 DB | 성장률, 펀딩, 인원, 카테고리 필터, CSV | Entrepreneur $39 / **Investor $99(스타트업 리스트 포함)** / Business $249 (월)[13] | **"떠오르는 덜 알려진 스타트업 리스트" 자체가 유료 상품**이라는 강력한 근거. |
| **Harmonic / Specter** | VC용 발굴 엔진 | 3,000만~5,500만 개사, 채용·팀 변동 알림[14] | 좌석당 과금(비공개) | 신호는 "팀 변동, 채용, 트래픽"이다. 장기적으로 Startup Daily의 "왜 지금" 근거로 쓸 만한 지표다. |
| **Sifted** | 유럽 스타트업 미디어 | 기사 + 멤버십(딥다이브, 밸류에이션 분석, 투자자 서베이)[11] + **Rising 100 / Sifted 100 리더보드**[12][21] | 월간·연간 멤버십(가격 확인 불가)[11] | 리더보드·디렉터리가 **커뮤니티와 매출 동력**으로 진화 중이다[21]. 선정 기준(설립 2018 이후, $1B 미만 등)을 공개한다[12]. |
| **The Information** | 유료 테크 저널리즘 | 독점 취재 | 연 $399, Pro $749, 30세 이하 $199[22] | 비싸게 받으려면 독점성과 정확성이 필요하다. AI 생성 매체는 이 길이 막혀 있다. |
| **Axios Pro Rata / Fortune Term Sheet** | 일간 딜 뉴스레터 | 매일 VC·PE·M&A 딜 요약 | 무료, Axios Pro는 연 $600~1,800(2022)[23] | 무료 일간 레터(20만+ 구독, 2022)[23]로 독자를 모은 뒤 유료로 올라가는 구조. |
| **Morning Brew** | 일간 뉴스레터 | 짧고 재치 있는 요약 | 무료, 광고 수익 | 400만+ 구독(자체 발표)[24]. 수익은 네이티브 광고와 B2B 버티컬[24][25]. |
| **Not Boring / Newcomer** | 개인 분석 뉴스레터 | 회사 딥다이브, 업계 분석 | Substack 유료 | Not Boring 17.7만~25만 구독(출처별 상이)[26]. Newcomer는 유료 구독 1,355명(첫해)[27]. **딥다이브 단독으로는 유료 전환 규모가 작다.** |
| **The Daily Startup (Startup to Follow)** | "하루 한 스타트업" 뉴스레터 | 매일 1개사 소개 | 무료 | 이름부터 동일한 콘셉트다. 운영 지속 여부는 확인되지 않는다[28]. **콘셉트만으로는 해자가 아니다.** |
| **Particle / (구)Artifact** | AI 뉴스 요약 앱 | AI 요약 + 원문 출처 링크 + 관점 비교 | 무료, 투자 $15.3M[29] | Particle은 요약마다 **출처 링크**를 붙인다[29]. Artifact는 시장 규모 부족으로 1년 만에 종료했다(2024-01)[30]. **"AI 요약 앱" 자체로는 사업이 되기 어렵다.** |

---

## 2. 포지셔닝 맵

```
                 딥다이브(회사 1개를 끝까지)
                          ▲
       Not Boring ●       │        ● Sifted 멤버십
       롱블랙(형식) ●      │   ★ Startup Daily (목표)
                          │        ● The Information
  에디토리얼 ◀─────────────┼──────────────▶ 데이터형
                          │     ● Exploding Topics
       뉴닉 ●  Morning Brew●│   ● 혁신의숲   ● THE VC
       플래텀/벤처스퀘어 ●   │   ● Crunchbase  ● Harmonic
       Product Hunt ●     │
                          ▼
                 헤드라인(여러 건을 짧게)
```

| 축 | 현재 Startup Daily | 권장 위치 |
|---|---|---|
| 깊이 | 딥다이브(7장 슬라이드) | 유지. 단 "30초 요약 → 3분 딥다이브"의 **2단 깊이** |
| 빈도 | 매일 5~10개 | **매일 3~5개** + 주간 묶음(뉴스레터) |
| 성격 | AI가 만든 에디토리얼처럼 보이지만 데이터 검증 장치는 없음 | **"에디토리얼 + 구조화 데이터"의 중간**. 같은 필드 구조로 비교·필터 가능 |
| 대상 | 전 세계 + 한국 | "한국 독자가 아직 모르는 해외 회사" + "해외가 모르는 한국 회사"의 **양방향 발견** |

**판단:** 이 사분면(딥다이브 × 데이터 구조 × 한국어)에는 국내 경쟁자가 없다. 해외 경쟁자(Sifted, Exploding Topics)는 한국어 독자에게 닿지 않는다. 단, 이 자리를 지키는 조건은 **정확성**이다. 정확하지 않으면 "AI가 쓴 그럴듯한 글"로 분류되어 뉴닉·롱블랙보다 낮은 신뢰를 받게 된다.

---

## 3. 독자 세그먼트

| 세그먼트 | 크기(추정) | 원하는 것 | 지불 의사 | 핵심 필드 | 우선순위 |
|---|---|---|---|---|---|
| **A. 테크·스타트업 종사자(PM, 개발자, 디자이너, 마케터)** | 큼 | 출퇴근길 5분 동안 "요즘 뜨는 회사" 감 잡기, 이직처 탐색 | 낮음~중(롱블랙 4,900원 수준[8]) | tagline, product, trending_reason, team_highlights | **1순위(무료 리텐션 기반)** |
| **B. 예비·초기 창업자** | 중 | 아이디어 검증, 해외 유사 모델, 비즈니스 모델 | 중 | problem/solution, business_model, competitive_landscape, market_outlook | 1순위 |
| **C. VC 심사역·CVC·액셀러레이터** | 작음(수천 명, 추정) | 딜소싱, 섹터 맵, 해외 비교 기업(comps) | **높음**(THE VC 월 15만원[1], Exploding Topics $99[13]) | funding, investors, valuation, competitors, 검색·필터·내보내기 | 2순위(B2B, 장기) |
| **D. 대기업 전략·신사업팀** | 작음 | 오픈이노베이션 후보, 트렌드 리포트 | 높음(법인 결제) | 카테고리별 모음, market_outlook | 3순위 |
| **E. 학생·취준생** | 큼 | 업계 공부, 면접 준비 | 낮음 | 전체 | 무료 유입원 |

**판단:** A·B로 **무료 습관**을 만들고, C·D로 **나중에 돈을 받는다**. C·D는 정확성과 검색·필터·내보내기가 없으면 쓰지 않는다. 따라서 신뢰 장치가 수익화의 전제 조건이다.

---

## 4. AI 생성 콘텐츠 신뢰 문제: 외부 사례 + 자체 데이터 점검

### 4-1. 외부 근거

| 근거 | 내용 | 시사점 |
|---|---|---|
| EBU·BBC 국제 연구(2025-10) | 22개 공영미디어가 ChatGPT·Copilot·Gemini·Perplexity 답변 3,000여 건을 검토했다. **45%에 중대한 문제**가 있었고, 31%는 출처 문제, 20%는 정확성 문제(지어낸 세부사항, 낡은 정보)였다[16]. | LLM은 **출처 URL과 최신 상태**에서 가장 자주 틀린다. Startup Daily의 약점과 정확히 겹친다. |
| CNET AI 기사 사태(2023) | AI가 쓴 기사 77~78건 중 **41건을 정정**했다. AI 사용 사실을 바이라인 뒤에 숨겼다가 비판받았고, 이후 공개 표기와 사람 편집자 공동 바이라인을 도입했다[17]. | **숨기는 것이 오류보다 신뢰를 더 깎는다.** 공개 + 정정 이력이 해법이다. |
| 한국언론진흥재단(2025) | 국내 생성형 AI 이용률 57.2%. 응답자는 AI의 사실 검증 보조에는 긍정적이었지만, **자료조사·정리를 AI에 맡긴 기사에는 거부감**을 보였다[18]. AI 이용자 중 오류를 발견해 수정한 비율은 14.8%뿐이었다(2026-02)[18]. | Startup Daily는 정확히 "AI가 자료조사·정리를 맡은 콘텐츠"다. 독자가 오류를 스스로 찾지 못하므로 **검증 책임은 서비스에 있다.** |
| Reuters Institute DNR 2025 | 한국 뉴스 신뢰도 31%. 다수가 생성형 AI 때문에 뉴스가 "더 싸지만 덜 정확하고 덜 신뢰할 만해진다"고 예상한다[31]. | 기본 신뢰가 낮은 시장이다. 신뢰 표시 하나하나가 차별점이 된다. |
| **한국 AI 기본법**(2026-01-22 시행) | AI 서비스 제공 사업자에게 생성형 결과물 표시 의무. 가시적 표시나 워터마크·메타데이터 중 선택. 과태료 최대 3,000만 원, 1년 이상 계도기간[19]. | **법적으로도 "AI 생성" 표시가 필요하다**(적용 범위는 법률 검토 필요). |
| Particle | 요약 아래에 원문 출처 링크를 붙여 트래픽을 돌려준다[29]. | "요약 + 원문 링크"가 업계 표준 신뢰 패턴이다. |
| Sifted 리더보드 | 선정 기준(설립 연도, 밸류에이션 상한, 펀딩 시점)과 편집 독립성을 공개한다[12]. | **선정 기준 공개**가 리스트형 콘텐츠의 신뢰 장치다. |

### 4-2. 자체 데이터 점검 (src/data/startups.json, 80개사, 2026-04-15~04-27분)

**(a) 링크 실효성.** 2026-10-22에 모든 URL로 HTTP 요청(리다이렉트 추적, 12초 타임아웃)을 보냈다.

| 링크 종류 | 개수 | 200 OK | 404/410 | 403/401/429(봇 차단, 판정 불가) | 기타 |
|---|---|---|---|---|---|
| `trending_reason.media_mentions[].url` (언론 보도) | 148 | **8 (5%)** | **90 (61%)** | 49 (33%) | 1 |
| `related_links[].url` | 218 | 97 (44%) | 75 (34%) | 42 (19%) | 4 |

- 404 예시: `techcrunch.com/tessl-125m/`, `techcrunch.com/cartesia-64m/`, `asia.nikkei.com/Business/PropertyGuru-AI-fintech-2026`. 실제 TechCrunch URL 형식(`/YYYY/MM/DD/slug/`)과 다르다. **LLM이 지어낸 URL로 판단된다.**
- 200이어도 내용이 맞는지는 별도 확인이 필요하다(soft 404 가능). 봇 차단 응답은 실재 여부를 판정할 수 없다.

**(b) 사실 오류와 낡은 정보(표본).**

| 기업(게재일) | 데이터 표기 | 실제 | 출처 |
|---|---|---|---|
| Lilium (04-20) | "Post-IPO (재상장 추진)" | 2025-02 운영 중단, 최종 파산 | [32] |
| Wiz (04-18) | "Series D" | 2025-03 Google 인수 발표, **2026-03-11 인수 완료(게재 전)** | [33] |
| Covariant (04-15) | "Series C", 창업자 소개 | 2024-08 Amazon이 공동창업자 3명 영입 + 기술 라이선스("역 인수고용") | [34] |
| Plenty (04-24) | "Series E" | 2025-03 Chapter 11 신청, 2025-05 구조조정 후 재출발 | [35] |

**(c) 선정 기준 위반.** 80개사 중 Wiz, Glean, Mercury, LangChain, Procore(상장), Recursion(상장), Ginkgo(상장), Photomath(Google 인수) 등은 **"덜 알려진 떠오르는 스타트업"이라는 콘셉트와 맞지 않는다.** 단계 분포도 Series B~F가 55개사(69%)로, 후기 단계에 치우쳐 있다.

**(d) 운영 공백.** 로컬 저장소 데이터는 2026-04-27이 마지막이다. 오늘(2026-10-22) 기준 약 6개월 동안 갱신이 없다(원격 저장소는 확인하지 않음). 일간 매체에서 공백은 리텐션에 치명적이다.

**결론:** 지금 콘텐츠를 그대로 노출하면 전문 독자(세그먼트 C·D)는 **첫 링크를 눌러 보는 순간 이탈**할 것이다(판단). 개편의 1순위는 UI가 아니라 **생성 파이프라인의 검증 단계**다.

---

## 5. 기회 / 위협

| 기회 | 근거 |
|---|---|
| 한국어 "해외 덜 알려진 스타트업 발견" 매체의 공백 | §1-1. 국내 경쟁자는 모두 국내·투자 뉴스 중심 |
| "발견 리스트"는 해외에서 이미 유료 상품 | Exploding Topics Investor 월 $99[13], Sifted 리더보드[12][21] |
| "하루 하나, 깊게" 형식은 국내에서 유료로 검증됨 | 롱블랙 월 4,900원, 누적 조회 2,500만[8] |
| 뉴스레터 경제성 개선 | beehiiv 2025년 유료 구독 매출 $19M(전년 $8M), 2025년 신규 레터의 첫 매출까지 중앙값 66일[36]. 스폰서십이 유료 구독보다 우세[37] |
| 국내 자동화 이메일 성과 | 자동화 메일의 오픈율 1.6배, 클릭률 3.8배. 미디어 업종 클릭률 2.2%로 최고[38] |
| 한국 기업을 해외 기업과 같은 틀로 비교 | THE VC·혁신의숲은 국내 전용. "한국판 X" 비교는 국내 독자가 좋아하는 프레임(판단) |

| 위협 | 근거 |
|---|---|
| **신뢰 붕괴**(지어낸 출처, 낡은 상태) | §4-2. 언론 링크 5%만 정상 |
| 법적 표시 의무 | AI 기본법[19] |
| 범용 AI 검색(Perplexity, ChatGPT)이 "이 회사 알려줘"를 대체 | under-25의 15%가 AI 비서로 뉴스를 접한다[16]. **"무엇을 물어볼지 모르는 발견"이 남은 가치**다(판단) |
| AI 요약 앱은 사업 규모가 작다 | Artifact 종료[30] |
| 콘셉트 복제가 쉽다 | The Daily Startup 등 동일 콘셉트 존재[28] |
| 유명 기업으로 쏠림 → 차별성 상실 | §4-2(c) |

---

## 6. 수익화·성장 경로 (단계별)

| 단계 | 시점(제안) | 무엇 | 근거·전제 |
|---|---|---|---|
| 0. 신뢰 복구 | 즉시 | 검증 파이프라인, AI 표시, 출처·갱신일, 정정 로그 | §4 |
| 1. 습관 | 1~3개월 | 웹/PWA + **주 1~3회 뉴스레터**(이메일). 공유 카드, 아카이브 검색 | Morning Brew·뉴닉은 무료 일간 레터로 규모를 만들었다[9][24] |
| 2. 광고·스폰서 | 구독 수천 명 이후 | 뉴스레터 스폰서 1칸(VC·SaaS·채용). "스폰서" 명확 표기 | 스폰서십이 유료보다 우세[37]. Morning Brew의 크라우드펀딩 광고 논란[24]처럼 **광고 심사 기준이 필요** |
| 3. 프리미엄 | 아카이브 수백 개 이후 | 전체 아카이브 검색·필터, 카테고리 구독 알림, 비교표, CSV. 월 4,900~9,900원(추정 적정가) | 롱블랙 4,900원[8], Exploding Topics $39~99[13] |
| 4. B2B | 신뢰 확보 후 | 섹터별 월간 "해외 스카우팅 리포트"(CVC·전략팀), 맞춤 리스트 | THE VC 월 15만원[1], CB Insights 연 수천만 원대(추정)[20] |
| 보조 | 상시 | 분기별 "Startup Daily Rising 30"(한국어 리더보드) | Sifted 리더보드 모델[12][21] |

**하지 않는 편이 나은 것:** 초기부터 페이월을 걸거나 앱스토어 네이티브 앱을 만드는 것. 독자 기반이 없고, 아직 정확성도 증명하지 못했다.

---

## 7. Startup Daily가 할 것 / 하지 말 것

### 할 것 (우선순위순)

**A. 신뢰(개편의 전제)**
1. **생성 파이프라인에 검증 단계를 추가한다.** 모든 URL에 HTTP 요청 → 404·지어낸 URL은 삭제한다. `media_mentions`는 웹 검색 도구로 **실제로 찾은 기사만** 남긴다. 실패하면 필드를 비운다.
2. **상태 검증**: 인수·파산·상장 여부를 생성 전에 확인한다(Lilium·Wiz 사례). 인수·상장·폐업 기업은 **자동 제외**한다.
3. **필드별 신뢰 표시**: 각 수치(펀딩, 밸류에이션, TAM)에 `출처 링크` 또는 `AI 추정` 배지를 붙인다. 출처 없는 밸류에이션·TAM은 "추정"으로 명시한다.
4. **페이지 단위 표시**: "AI가 공개 자료를 바탕으로 작성 · 생성일 · 마지막 검증일 · 오류 제보" 푸터. AI 기본법 대응을 겸한다[19].
5. **정정 로그 공개**: 수정된 프로필에 "정정됨(날짜, 내용)"을 남긴다(CNET 교훈[17]).
6. **선정 기준 공개 페이지**: 예) 설립 N년 이내, 누적 투자 $X 이하 또는 Series B 이하, 비상장, 국내 인지도 낮음. Sifted처럼 기준을 공개한다[12]. 기존 메모리의 "유명 회사 제외" 원칙을 **코드 수준 필터**로 만든다(블록리스트 + 단계·투자액 상한).

**B. 포지셔닝·콘텐츠**
7. 한 줄 정체성: **"한국 독자가 아직 모르는, 지금 뜨는 회사를 매일 3분에."** "AI 매거진"이 아니라 "발견 매체"로 말한다.
8. **"왜 지금"을 맨 앞에 둔다.** `trending_reason.summary`와 `catalysts`가 카드의 첫 화면이다. 회사 소개는 그다음이다. (Exploding Topics·Sifted 모두 "모멘텀"을 핵심 가치로 판다[12][13].)
9. **2단 깊이**: 피드는 30초 요약(tagline + 왜 지금 + 핵심 숫자 3개), 탭하면 딥다이브 상세 페이지(7개 섹션을 세로 스크롤 아티클로).
10. **양방향 발견**: "한국판 ○○", "해외의 △△ 같은 한국 회사" 비교 프레임(`competitive_landscape` 활용).
11. 수량을 줄인다: **매일 3~5개**. 10개는 검증 부담만 늘리고 하나하나의 가치를 떨어뜨린다.

**C. 리텐션·성장**
12. **이메일 뉴스레터**(주 1~3회 다이제스트)를 먼저 붙인다. PWA 푸시는 보조로 둔다. 자동화 환영 메일 시퀀스도 넣는다[38].
13. **검색 + 카테고리·국가·단계 필터 + 아카이브**: 누적 콘텐츠가 자산이 되게 한다(나중에 프리미엄의 기반).
14. **공유**: 기업별 고유 URL + OG 이미지 카드 + 카카오톡/링크 공유. 현재는 공유할 URL 자체가 없다.
15. **팔로우**: 기업·카테고리 팔로우 → 후속 투자·뉴스가 생기면 업데이트("지난번 소개한 X가 Series A 유치"). 다시 찾아올 이유를 만들고 적중률도 증명한다.
16. **"적중 기록(Track record)"**: 소개 후 투자 유치·성장한 기업을 모아 보여준다. AI 큐레이션의 신뢰를 성과로 증명한다(판단, 차별화 장치).

### 하지 말 것
1. **검증 안 된 URL·언론 보도·밸류에이션을 사실처럼 노출하지 않는다.** 지금 상태로 홍보·배포를 확대하면 안 된다.
2. **AI 생성 사실을 숨기거나 "에디터 픽" 같은 사람 편집자 뉘앙스만 앞세우지 않는다.** 사람이 검수하지 않았다면 "에디터"라는 표현을 재검토한다.
3. **유명·후기 단계·상장·인수 완료 기업을 넣지 않는다.** 콘셉트가 무너지고, ChatGPT에 물어보면 되는 콘텐츠가 된다.
4. **"매일 10개" 같은 양 경쟁을 하지 않는다.** 국내 DB(THE VC 등)와 양으로 붙으면 이길 수 없다.
5. **가로 7장 캐러셀에 긴 텍스트를 몰아넣지 않는다.** 딥다이브는 상세 페이지로 분리한다(UX 상세는 product-benchmarker 문서).
6. **초기 페이월이나 네이티브 앱부터 만들지 않는다.** 독자와 신뢰가 먼저다.
7. **투자 권유로 읽힐 표현("지금 투자해야 할", "유니콘 확정")을 쓰지 않는다.** "투자 조언 아님" 고지를 넣는다.
8. **운영 공백을 방치하지 않는다.** 생성이 실패한 날은 "오늘은 쉬어갑니다 + 지난 주 베스트"로 대체하고, 실패 알림을 받는 체계를 갖춘다.

---

## 8. 출처

1. THE VC 요금제: https://thevc.kr/pricing (검색 스니펫 기준, 페이지 직접 접근은 403)
2. 혁신의숲/마크앤컴퍼니: https://career.rememberapp.co.kr/job/posting/343072 , https://www.nextunicorn.kr/newsroom/8411670b0c08dc53
3. 아웃스탠딩: https://outstanding.kr (2026-10-22 접속)
4. 플래텀(THE VC 프로필): https://thevc.kr/platum
5. 벤처스퀘어 뉴스레터 안내: https://www.venturesquare.net/1285/
6. 스타트업레시피(미디어레시피): https://thevc.kr/mediarecipe , https://www.venturesquare.net/tag/스타트업레시피/
7. 디스콰이엇: https://yozm.wishket.com/magazine/detail/1975/
8. 롱블랙: https://www.journalist.or.kr/news/article.html?no=50281 , https://lottiefiles.com/kr/case-studies/longblack
9. 뉴닉 60만(2024-02): https://eopla.net/magazines/18731 , https://www.journalist.or.kr/m/m_article.html?no=46431
10. EO: https://www.etoday.co.kr/news/view/1914742 , https://blog.youtube/intl/ko-kr/creator-and-artist-stories/2020_08_21st-meet-the-youtube-creators/
11. Sifted 멤버십: https://sifted.eu/articles/sifted-membership
12. Sifted B2B SaaS Rising 100(2025) 방법론: https://sifted.eu/rankings/b2b-saas-rising-100-2025
13. Exploding Topics Pro 요금·Trending Startups: https://explodingtopics.com/pro , https://explodingtopics.com/blog/exploding-topics-pro-vs-free
14. Harmonic/Specter: https://www.tryspecter.com/features/vs-harmonic , https://yespress.io/harmonic.md
15. Crunchbase 가격·예측: https://pipeline.zoominfo.com/sales/crunchbase-pricing , https://syncgtm.com/blog/crunchbase-pro-review-2026 , https://www.robotics.press/news/crunchbase-competitive-response-data-gap/
16. EBU·BBC AI 뉴스 정확성 연구(2025-10): https://www.journalism.co.uk/nearly-half-of-ai-generated-answers-contain-an-error-ebu-bbc-report/ , https://theregister.com/2025/10/24/bbc_probe_ai_news
17. CNET AI 기사 정정: https://www.mediapost.com/publications/article/381963/ai-copy-stands-corrected-cnet-finds-errors-in-tes.html , https://vice.com/en/article/cnet-defends-use-of-ai-blogger-after-embarrassing-163-word-correction-humans-make-mistakes-too
18. 한국언론진흥재단 관련 보도: https://journalist.or.kr/news/article.html?no=58480 , https://www.journalist.or.kr/news/article.html?no=59349
19. AI 기본법 표시 의무: https://wikidocs.net/blog/@openwiki/25888/ , https://www.webtoonguide.com/ko/board/news-column/25440 , https://shinkim.com/kor/media/newsletter/pdf/3114 (2차 자료. 법령 원문 확인 필요)
20. CB Insights / Dealroom 가격 추정: https://www.costbench.com/compare/cb-insights-vs-dealogic/ , https://www.ellty.com/blog/dealroom-pricing , https://zoftwarehub.com/products/dealroom/pricing
21. 리더보드·디렉터리 수익화(Journalism UK, 2026-08-27): https://www.journalism.co.uk/leaderboards-and-directories-how-the-list-format-is-evolving-into-a-community-and-revenue-driver/
22. The Information 가격: https://digiday.com/media/information-launches-new-199-749-annual-subscription-tiers/ , https://www.readless.app/blog/the-information-price-per-month-2026
23. Axios Pro Rata / Axios Pro(2022): https://www.niemanlab.org/2022/01/axios-launches-a-premium-subscription-product-aimed-at-the-dealmakers-among-us/
24. Morning Brew 모델: https://productmint.com/how-does-morning-brew-make-money/ , https://www.axios.com/2024/10/22/morning-brew-newsletter-b2b-brands
25. Morning Brew × beehiiv 광고 네트워크: https://www.beehiiv.com/blog/case-study-why-morning-brew-doubling-down-beehiiv-ad-network
26. Not Boring 구독자: https://interintellect.com/?p=59313 , https://yespress.io/packy-mccormick.md
27. Newcomer 첫해: https://www.newcomer.co/p/looking-back-on-newcomers-first-year
28. The Daily Startup: https://startuptofollow.substack.com/about , https://inboxreads.co/n/the-daily-startup
29. Particle: https://techcrunch.com/2024/06/11/ai-news-reader-particle-adds-publishing-partners-and-10-9m-in-new-funding , https://www.choppingblock.ai/companies/particle
30. Artifact 종료: https://www.engadget.com/instagrams-founders-are-shutting-down-artifact-their-year-old-news-app-233431390.html
31. Reuters Institute DNR 2025 한국: https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/south-korea
32. Lilium 운영 중단: https://avweb.com/aviation-news/lilium-ceases-operations , https://www.ch-aviation.com/news/150719-germanys-lilium-files-for-final-insolvency
33. Google의 Wiz 인수 완료(2026-03-11): https://www.clearygottlieb.com/news-and-insights/news-listing/google-completes-32-billion-acquisition-of-wiz
34. Amazon–Covariant: https://www.geekwire.com/2024/amazon-hires-covariant-founders-inks-licensing-deal-with-robotics-ai-startup-in-latest-reverse-acquihire-deal/
35. Plenty Chapter 11: https://www.plenty.ag/plenty-completes-restructuring-emerges-from-chapter-11/
36. beehiiv State of Newsletters 2026(2025 데이터): https://www.beehiiv.com/blog/beehiiv-the-state-of-newsletters-2026
37. InboxReads State of Newsletters 2025: https://inboxreads.co/blog/state-of-newsletters-2025 , https://ppc.land/newsletter-monetization-shifts-toward-sponsorships-as-paid-models-plateau/
38. 스티비 2025 이메일 마케팅 리포트: https://www.tech42.co.kr/?p=102937
39. 자체 점검: `src/data/startups.json`의 URL 366개에 2026-10-22 HTTP 요청(curl, 리다이렉트 추적, 12초 타임아웃). 결과는 스크래치패드 `status.tsv`에 있다.
