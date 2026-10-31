# 12. 앱 출시 설계용 시장 리서치: 수익 채널, 개인화, 영어판 차별 섹션, 포지셔닝

- 작성: market-researcher / 2026-10-30
- 범위: 08(수수료·심사·등록 요건·푸시 리텐션), 09(수익화 설계), 11(한국 스토어 벤치마크)에서 **다루지 않은 부분만** 보강한다. 겹치는 사실은 "08 참조"처럼 표시만 하고 반복하지 않는다.
- 표기 규칙:
  - [사실] 1차 출처(공식 문서, 공식 발표, 실험 원문)
  - [2차] 보도나 벤더 블로그
  - [추정] 계산이나 간접 근거
  - [판단] 리서처 의견
- 기준 시점이 없는 자료는 "시점 미상"으로 적었다.

---

## 0. 요약 (5줄)

1. **"앱이 수익에 낫다"는 말은 iOS에서, 그리고 이미 들어온 독자를 결제 화면으로 데려가는 순간에만 맞다.** 통제 실험에서 앱 안 결제(IAP)가 웹 결제보다 유료 전환이 높았다(6.3% vs 5.3%)[R2]. 반면 **Android는 설치→유료 전환이 iOS의 약 1/3**이다(0.9% vs 2.6%)[R3]. Google Play 해지의 31%는 결제 실패 때문이다[R1]. 그러니 **Android 우선 출시는 "수익 채널"이 아니라 "리텐션 채널"**로 봐야 한다.
2. **Substack은 지금도 Android 앱에서 구독을 팔지 않는다.** iOS에서는 Apple 수수료만큼 가격을 올려서 판다[R4]. 콘텐츠 구독의 기본값은 여전히 **"웹에서 결제하고 앱은 읽기·알림 전용"**이다. 미국 Google Play의 외부 링크 결제는 2026-10-01부터 **구독 10% + 설치당 2.85달러** 수수료를 신고·납부하는 구조로 바뀌었다[R6]. 그래서 "앱 밖 결제는 공짜"라는 전제도 미국 Android에서는 더 이상 맞지 않다.
3. **개인화는 "무엇을 보여줄지"가 아니라 "순서·강조·알림"을 바꾸는 쪽이 하루 4곳 고정 큐레이션과 충돌하지 않는다.** 온보딩에서는 3~5개 주제를 고르게 하는 패턴이 많다. Particle 4개·40초[R11], Product Hunt 최소 5개[R13], Flipboard 3~5개[R12]가 그 예다. 그런데 Flipboard 데이터상 사용자는 **온보딩 뒤에 주제를 거의 고치지 않는다**[R12]. 그래서 처음 고르는 화면의 설계가 중요하다.
4. **미국 독자용 "유사 산업·선례 분석"은 유료 인텔리전스 제품들이 2025~2026년에 가장 많이 투자한 기능과 같은 방향**이다. Crunchbase는 2025-12에 "Similar Companies"를 순위가 붙은 경쟁사 목록과 경쟁 지형 맵으로 바꿨다. 2026-05에는 마이크로 산업 5,100개도 추가했다[R17]. 다만 **데이터 DB와 경쟁하면 진다.** 차별점은 "왜 이 회사가 X의 재현인지"를 설명하는 **서사형 선례 분석**이어야 한다[판단].
5. **영어 스토어 부제는 "결과 약속(Stay ahead / See every side)"이나 "형식 약속(60 words, Smart summaries)" 둘 중 하나**다. 경쟁 앱 가운데 "아직 알려지지 않은 회사"를 내세운 앱은 없다[R20]. Google Play 제목은 30자, 짧은 설명은 80자다[R22].

---

## 1. 수익: 앱 vs 웹

### 1-1. 08에 없던 근거

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| **IAP vs 웹 결제 통제 실험** | RevenueCat이 인수한 iOS 구독 앱 Dipsea에서 미국 신규 사용자를 변형당 약 3,100명씩 나눠 비교했다. **유료 전환: IAP 6.3%, IAP+웹 5.9%, 웹 전용 5.3%**. 웹으로 넘어가는 순간 체험 시작률이 27.0%에서 18.1%로 떨어졌다. 체험→유료 전환은 웹이 조금 높았다(26.3% vs 25.0%). 그래도 줄어든 시작 규모를 메우지 못했다. **수수료 15%(SBP) 기준으로 웹 전용 매출은 IAP 1달러당 약 0.77달러**였다 | 2025-05-07 시작, 2025-05-28 업데이트 | [R2] [사실, 단일 앱·단기] |
| Android vs iOS 전환 | 설치 후 35일 안 유료 전환 중앙값은 **Android 0.9%, iOS 2.6%**다. 체험→유료는 32.5% vs 32.6%로 거의 같다. 차이는 퍼널 입구(결제 화면까지 오는 비율)에서 난다 | 2026-03-25 (SOSA 2026 데이터) | [R3] [사실] |
| 설치당·결제자당 매출 | 60일 설치당 매출은 iOS 0.42달러, Android 0.16달러다. 1년 차 결제자당 매출은 23.38달러 vs 21.62달러다. **결제자가 되면 플랫폼 차이는 약 8%로 줄어든다** | 2026 | [R5] [2차, RevenueCat 수치 인용, 원문 미확인] |
| 비자발 해지 | 해지 가운데 결제 실패 비중이 **Google Play 31%, App Store 14%**다. 연간 구독자의 약 72%가 1년 안에 해지한다(2026) | 2026-03-19 | [R1] [사실] |
| Substack 앱 결제 | iOS IAP는 2025-08부터 가능하다. Apple 수수료만큼 **가격을 자동으로 올린다**(웹 30달러 → iOS 약 39달러 예시). 기본으로 켜져 있고 끌 수 있다. 미국 iOS에서는 웹 결제 링크도 함께 보여준다. **Android 앱에서는 구독을 살 수 없다** | 2025-08-18 | [R4] [사실] |
| 뉴스레터 무료→유료 전환 | Substack이 예전에 말했다는 "5~10%"는 1차 출처를 찾을 수 없다. 독립 분석의 중앙값은 **약 3%**, 일반적인 범위는 1~3%다 | 시점 혼재 | [R7] [2차] |
| 미국 온라인 뉴스 유료 지불 | 약 **20%**(2025). 한국은 19%(08 참조) | 2025 | [R8] [2차, 원문 미확인] |
| 미국 Google Play 수수료 | 2026-06-24 발표: 첫 100만 달러와 자동 갱신 구독은 서비스 수수료 10%다. Play 결제를 쓰면 결제 수수료 5%가 붙는다(미국·영국·EEA) | 2026-06-24 | [R9] [2차] |
| 미국 Google Play 외부 링크 | External content links 프로그램: 자동 갱신 구독 10%(첫 100만 달러). **외부 링크를 따라간 뒤 24시간 안에 일어난 거래나 설치는 수수료 대상**이고, 앱 설치당 **2.85달러**다. 거래 신고·납부는 **2026-10-01부터**, 다운로드 신고는 2027-02-01까지다 | 2026-07-22 갱신 | [R6] [사실] |
| 위 수수료의 법적 확정 여부 | 법원이 이 수수료를 인정할지는 아직 정해지지 않았다. 벤더들은 "확실해질 때까지 등록 보류"를 권한다 | 2026-07-30 | [R10] [2차, 이해관계 있음] |
| 한국 | Google 신규 체계는 2026-12-31까지 적용, 방미통위 심의 중(08 §2, §0 참조). 한국 Android의 웹 링크에는 결제 수수료가 없다고 보도됐다(08 [A8]) | – | 08 |
| 뉴스레터형 미디어의 앱 | Morning Brew, TLDR은 독립 앱이 없다(11 §0). Quartz Brief, NYT Now 같은 요약 앱은 규모를 만들지 못하고 접었다 | 2016~ | [R19] [2차] |

### 1-2. 해석

- **"앱이 수익에 낫다"의 정확한 의미 [판단]**
  - 앱이 낫다는 근거는 하나다. **결제 화면에 도착한 사용자를 놓치지 않는다**(R2의 웹 이탈).
  - 결제 화면까지 오는 사람 수는 앱이 늘려주지 않는다. 그 숫자는 **유입량과 리텐션**이 정한다.
  - 독자 0명 단계에서 앱이 실제로 바꾸는 변수는 "푸시로 다시 오게 하기"뿐이다. 이것이 08·09의 결론(앱 = 리텐션 채널)과 같다.
- **Android 우선의 함의 [판단]**
  - Android는 결제 화면 앞에서 이미 걸러진다(0.9%). 결제한 뒤에도 카드 실패로 빠진다(31%).
  - 앱 수익의 레버(iOS IAP 전환)를 당장은 쓰지 못한다. 그래서 **Android 1차 출시의 KPI는 매출이 아니라 "푸시 동의율, D7·D30 리텐션, 웹 대비 회차당 읽기 수"**로 둔다.
  - 결제는 iOS 출시 뒤로 미룬다. Android에 먼저 붙인다면 Play Billing 구독 하나로 한다.
    - 한국에서 Play 결제 15%와 웹 링크(10% + PG)의 순수취 차이는 1%p 안팎이다(08 §2-1).
    - 반면 Play Billing은 결제 실패 재시도와 유예 기간을 Google이 처리한다 [추정].
- **미국 독자에게 앱 결제를 붙일 때 [판단]**
  - 미국 Android에서 외부 링크를 쓰면 구독 10%에 설치당 2.85달러가 붙을 수 있다. Play Billing(10% + 5%)과 비교하면 **링크의 이점이 작다.** 소액 구독에서는 설치당 고정비 때문에 오히려 손해일 수 있다.
  - 미국 iOS는 링크 수수료가 0%인지가 대법원 심리 중이라 확인 불가다(08 §1-3).

### 1-3. 결론: 앱이 나은 조건 / 웹이 나은 조건

| 앱(IAP)이 나은 조건 | 웹 결제가 나은 조건 |
|---|---|
| 이미 매일 들어오는 모바일 독자가 있고, **결제 순간의 마찰**이 병목일 때(R2) | 유입이 **검색·SNS·뉴스레터 링크**로 웹에 먼저 도착할 때(지금의 Startup Daily) |
| iOS 사용자 비중이 높을 때(전환 2.6% vs 0.9%) | **Android 위주**일 때(입구 전환이 낮고 결제 실패 해지가 많다) |
| 월간 소액 구독이고 체험 시작률이 중요할 때 | **연간 결제, 팀·B2B 결제, 영수증과 세금계산서**가 필요한 독자(VC 애널리스트, 기업 PM) |
| Apple SBP 15%를 받을 수 있을 때 | 수수료 차이가 10%p 넘게 벌어지는 구간(SBP 없는 30%, 미국 iOS 링크가 0%로 확정될 경우) |
| 푸시로 "오늘 분석 잠금 해제" 같은 결제 계기를 만들 수 있을 때 | 무료→유료 전환을 이메일 시퀀스로 운영할 때(뉴스레터 중앙값 약 3%) |

---

## 2. 개인화

### 2-1. 앱별 방식

| 서비스 | 온보딩에서 고르는 것 | 개수 | 콜드스타트 처리 | 이후 학습 | 출처 / 시점 |
|---|---|---|---|---|---|
| **Particle** | 관심 주제(기술, 정치, 비즈니스, 과학, 스포츠, 세계) | 리뷰어는 4개를 골랐다. 전체 흐름 **약 40초**, 첫 기사를 보기 전에 이메일·푸시 권한을 묻지 않는다 | 샘플 기사에 "Less/More"를 눌러 평가하게 한다(별도 리뷰) | 사람·장소·사물, 기자·매체 팔로우. 더 깊은 개인화는 유료 | [R11] [2차, 시점 혼재] |
| **Ground News** | 판(에디션: US·Europe·International)과 주제 몇 개 | 몇 개(정해진 수 없음) | 리뷰마다 다르다. 처음에 묻지 않고 My Topics에서 빼게 하는 방식이라는 리뷰도 있다 | My Feed는 "명시한 관심과 관찰한 읽기 행동"으로 알고리즘이 고른다 | [R14] [사실(FAQ)/2차] |
| **SmartNews** | 주제와 채널(탭) | 상세 선택 | 언어·지역 기본 탭 | 클릭·공유·스크롤 통과를 학습한다. 회사 입장은 "**과도한 개인화보다 발견에 최적화**" | [R15] [2차] |
| **Google News** | 언어·지역 | – | "Full Coverage는 언어·지역·구독 말고는 개인화하지 않는다" | For you, 팔로우 주제 | [R16] [사실] |
| **Feedly** | 소스(RSS)와 Leo 우선순위(유료) | 사용자가 정한다 | 소스를 직접 추가 | Leo는 사용자가 정의한 우선순위와 예시로 학습 | [R18] [2차] |
| **Flipboard** | 주제 | **3~5개**(웹 7개) — 출처마다 다르다 | 고른 주제로 For You를 만든다 | 튜닝 아이콘을 추가했다. "**사용자는 온보딩 뒤 주제를 거의 고치지 않는다**" | [R12] [사실, 2021년 추정] |
| **Product Hunt** | 팔로우할 주제 | **최소 5개**(5개 전에는 다음 버튼 비활성) | 주제가 홈과 다이제스트에 반영된다 | 팔로우한 사람 | [R13] [2차, 2022년경] |
| **Inshorts** | 언어 | 명시적 선호 입력을 **일부러 받지 않는다** | 인기 기사 | 오른쪽(좋아요)·왼쪽 스와이프로 학습. 리뷰에서는 "개인화가 고장 났다"는 불만이 나온다 | [R16b] [사실(스토어)/2차] |
| **Crunchbase** | – | – | – | 저장 목록, 알림, 경쟁사 순위 | [R17] |
| **뉴닉** | 온보딩 주제 선택은 **확인 불가** | – | – | 앱 설명은 "관심 있는 주제의 지식을 뉴니커와 이야기"하고 저장하는 기능 중심 | [R21] [사실(스토어)] |

### 2-2. 개인화 알림 효과 데이터

| 지표 | 값 | 성격 / 시점 | 출처 |
|---|---|---|---|
| 일반 vs 개인화 푸시 열람률 | **1.5% → 5.9%**(약 4배). 행동 기반 발송 **8%**, 즉시 일괄 발송 0.9% | 15억 건, 2015-01~2016-03, 벤더 | [R23] [2차] |
| 타깃 vs 일괄 발송 | 타깃·개인화 메시지의 열람률이 **약 7배** | Airship, 오래된 자료 | [R24] [2차, 벤더] |
| 뉴스 앱 동의율·리텐션, 주 1~3회 푸시의 효과 | 08 §7 참조 | – | 08 |

이 숫자들은 모두 벤더 자료이고 오래됐다. 방향(개인화하면 열람이 몇 배 오른다)만 믿고, **크기는 직접 실험으로 확인한다** [판단].

### 2-3. 하루 4곳 고정 큐레이션과 개인화를 함께 두는 법 [판단]

- **충돌 지점**
  - Startup Daily의 가치는 "모두가 같은 4곳을 본다"는 편집적 약속이다.
  - "내 관심만 보여주기"로 가면 매일 0~1곳만 남는 날이 생긴다. 그러면 습관이 깨진다.
  - SmartNews조차 "과도한 개인화보다 발견"을 내세운다.
- **해법: 무엇은 고정하고 무엇은 바꾸는가**

| 고정 (모두 동일) | 개인화 (사람마다 다름) |
|---|---|
| 오늘의 4곳 자체 | 4곳의 **노출 순서**(관심 분야를 먼저) |
| 회사별 본문 | 카드의 **"당신에게 왜"** 한 줄(역할 기준. 예: 창업자에게는 "선례에서 배울 점", 구직자에게는 "팀 규모·채용 신호") |
| 발행 시각 | **푸시 문구**에서 관심 분야 회사의 이름을 앞에 둔다. 발송 시각은 사용자가 고른다 |
| – | **아카이브의 "이런 회사도"**: 관심 분야의 과거 호를 추천한다. 이곳만 진짜 추천 영역으로 둔다 |

- **온보딩 권장**
  - 2단계, 건너뛰기 가능, 30~40초 안에 끝낸다(Particle 패턴).
    - ① 역할 1개: 창업자 / 투자자·애널리스트 / PM·기획자 / 구직자·커리어 / 그냥 궁금
    - ② 관심 분야 **3개 이상 선택 권장**(강제는 안 함): `category` 값을 8~10개로 묶어서 보여준다
  - 푸시 권한은 **첫 호를 다 읽은 뒤**에 묻는다(Particle은 처음에 묻지 않는다). 08의 뉴스 앱 동의율 30% 안팎을 감안해야 한다.
  - Flipboard처럼 사람들이 나중에 거의 고치지 않는다. 그래서 **읽기 행동(상세 진입, 저장)으로 조용히 가중치를 보정**한다. 계정이 없어도 기기 안 저장으로 된다.
  - 콜드스타트에는 개인화가 필요 없다. 4곳 고정이 이미 "인기·편집 기본값" 역할을 한다. 이것은 다른 앱에 없는 구조적 이점이다.

---

## 3. 영어판 차별 섹션: "유사 산업·선례 분석"

### 3-1. 시장 근거

| 근거 | 내용 | 시점 | 출처 |
|---|---|---|---|
| Crunchbase | 2025-12에 "Similar Companies"를 **순위가 붙은 경쟁사 목록 + Competitive Landscape Map**으로 바꿨다. 2026-02에는 회사 프로필에 소속 Market Map을 보여주고, "경쟁 이유"(공통 지역·산업)를 표시하기 시작했다. 2026-05에는 **마이크로 산업 5,100개 이상**, 2026-07에는 산업별 성장·쇠퇴 신호를 추가했다 | 2025-11~2026-07 | [R17] [사실] |
| CB Insights | AI 에이전트 마켓맵(2025-03 기준 170개 이상 → 이후 400개 이상) 같은 마켓맵을 꾸준히 낸다. 2025-11에 Competitive Intel Agent(베타)를 출시했다 | 2025 | [R25] [사실(자사)] |
| Exploding Topics | 유료(Pro) 기능으로 "Trending Startups" 리포트를 판다(성장률, 펀딩, 인원, 카테고리). 비즈니스 플랜 월 249달러(연간 결제) | 2026 접근 | [R26] [사실(자사)/가격 혼재] |
| Not Boring | 회사 한 곳을 수천 단어로 분석하는 **스폰서 딥다이브**가 대표 형식이다. 구독자 약 20만~25만으로 보도되지만 날짜가 불분명하다 | 시점 미상 | [R27] [2차] |
| Stratechery / The Generalist | 유료 구독 모델이다. Stratechery 유료 독자 2.6만 명 이상, 연 300만~500만 달러라는 추정이 있다. 독자가 돈을 내는 이유는 사건을 **프레임(Aggregation Theory 등)으로 해석**해 주기 때문이다 | 추정, 시점 혼재 | [R28] [2차, 추정] |
| a16z 마켓맵 | 창업자들이 "무엇이 투자받을 만한가"를 읽는 신호로 쓴다는 해석이 있다 | 2026 | [R29] [2차, 저신뢰] |

- **해석 [판단]**
  - 미국의 유료 인텔리전스 시장은 **"이 회사 하나"보다 "이 회사가 속한 지형"**에 돈을 낸다.
  - 다만 Crunchbase와 CB Insights는 **DB와 맵(누가 있나)**을 판다. Not Boring과 Stratechery는 **해석(왜 그런가)**을 판다.
  - Startup Daily는 DB 규모로 이길 수 없다. 그러니 **해석 쪽, 그중에서도 "선례"**를 가져가야 한다.

### 3-2. 미국 독자 세그먼트별 필요

| 세그먼트 | 이 섹션에서 원하는 것 | 지금 쓰는 도구 | Startup Daily가 줄 수 있는 것 |
|---|---|---|---|
| 창업자 | 비슷한 시도가 **왜 실패하고 왜 성공했나**, 인접 시장으로 피벗할 경로 | Crunchbase, Not Boring, X | "같은 아이디어의 이전 시도 2~3개와 결과" |
| VC 애널리스트·스카우트 | 소싱 단서, 같은 테제의 다른 회사, **비교 기업(comps)** | PitchBook·Crunchbase(유료), CB Insights 맵 | DB를 대신하지는 못한다. "이 회사를 어떤 테제에 넣을 수 있나" 한 줄과 인접 기업 목록(검증 링크 포함) |
| PM·기획자 | 다른 산업에서 같은 패턴이 어떻게 풀렸나(**아날로그**) | Stratechery, Lenny's 등 | "X 산업의 Y가 같은 구조다" 형식의 유추 |
| 구직자 | 이 회사가 이길 시장인가, 비슷한 회사의 결말 | LinkedIn, Glassdoor | 선례의 결말(인수, 폐업, IPO)과 그 이유 |

### 3-3. 설계 시사점 [판단]

- **이름**: "Similar companies"는 Crunchbase가 이미 버린 이름이다. **"Precedents & Adjacent Markets"** 또는 **"Seen This Before?"**처럼 선례를 앞세운다.
- **구성**: 06의 `similar`(direct / adjacent / analog) 구조를 그대로 쓴다. 한국 부분을 다음 두 가지로 바꾼다.
  - `precedents`: 같은 아이디어의 이전 시도와 그 결말
  - `adjacent_markets`: 인접 시장. 규모 수치는 출처가 있을 때만 넣는다
- **검증 규칙**: 06과 같다. 링크 검증, 단정어 금지, 사실과 가설 분리. 미국 독자, 특히 애널리스트는 **틀린 comps 하나**에 신뢰를 바로 접는다.
- **유료화와의 연결**: 한국판의 "한국에서는"처럼 **무료는 헤드라인과 선례 1개, 전체는 멤버**로 같은 잠금 구조를 쓸 수 있다.

---

## 4. 정체성·포지셔닝 문장

### 4-1. 영어권 경쟁 앱의 스토어 부제 (App Store US, 2026-10-30 직접 확인)

| 앱 | 이름 | 부제 | 유형 |
|---|---|---|---|
| Particle | Particle: Personalized News | Smart summaries built for you | 형식 + 개인화 |
| Ground News | Ground News | See every side of every story | 관점·신뢰 |
| SmartNews | SmartNews: Breaking News | Read in English or Spanish | 기능 |
| Google News | Google News | Top world & local news stories | 범위 |
| Feedly | Feedly - Smart News Reader | Stay ahead of the curve | 결과 약속 |
| Flipboard | Flipboard: The Social Magazine | Stories curated by enthusiasts | 큐레이터 |
| Inshorts | Inshorts | 60 words News Summary | 형식 |
| Product Hunt | Product Hunt | Find the best products in tech | 발견 |
| The Information | The Information: Tech News | Exclusive Technology Stories | 독점 |
| PitchBook | PitchBook Mobile | VC, PE and M&A data | 데이터 |

- 출처: [R20]. 페이지 HTML의 첫 subtitle 요소로 추출했다. 관련 앱 부제와 섞였을 가능성이 있어 일부는 [2차 수준].
- Google Play 제목(2026-10-30) [R20b]
  - "SmartNews: Local Breaking News"
  - "Inshorts - News in 60 words"
  - "Google News - Daily Headlines"
  - "Feedly - Smarter News Reader"
- **관찰 [판단]**
  - 패턴은 넷이다: **결과(Stay ahead), 관점(every side), 형식(60 words, summaries), 출처(exclusive, enthusiasts)**.
  - "아직 아무도 모르는 회사"나 "선례·인접 시장"을 약속하는 앱은 없다. 이 자리가 비어 있다.
  - 스타트업 분야는 Product Hunt(제품 발견)와 PitchBook(데이터)이 양 끝에 있고, 그 사이의 **"매일 읽는 신생 회사 해설"**이 비어 있다.
- 한국어 부제 패턴(매일, 핵심·요약, 쉽게, 루틴, 저자 신뢰)은 11 §2-1 참조.

### 4-2. Google Play 규정

| 항목 | 규정 | 출처 |
|---|---|---|
| 앱 제목 | **30자 이하**, 고유해야 하고 흔한 용어는 피한다 | [R22] [사실] |
| 짧은 설명 | **80자 이하**, 가장 큰 이점을 요약 | [R22] [사실] |
| 메타데이터 정책 | 모든 번역본에 적용. "#1", "Best", 수상 표시 같은 순위·성과 주장은 금지(2차 정리) | [R22] [사실/2차] |

### 4-3. 후보 문안 (글자 수는 직접 셈)

| 언어 | 제목(≤30) | 짧은 설명(≤80) | 의도 |
|---|---|---|---|
| EN A (추천) | `Startup Daily: New Startups` (27) | `Four startups you haven't heard of yet. Daily, sourced, with market precedents.` (79) | "아직 모르는 회사"와 "선례"라는 빈자리를 동시에 잡는다 |
| EN B | `Startup Daily: Early Startups` (29) | `4 under-the-radar startups a day, each with its precedents and adjacent markets.` (80) | 업계 용어 under-the-radar로 애널리스트를 겨냥한다 |
| KO A | `스타트업 데일리 - 해외 스타트업 브리핑` (22) | `매일 4곳, 덜 알려진 해외 스타트업을 한국어로. 한국에서 될지까지 짚어 드립니다.` (46) | 11의 A안을 4곳 기준으로 고쳤다. "한국에서는"을 짧은 설명에 넣는다 |
| KO B | 같음 | `매일 4곳, 한국어로 읽는 해외 신생 스타트업과 한국 기회 분석` (35) | 검색 키워드(해외, 스타트업, 분석)를 더 앞에 둔다 |

- "AI"는 제목과 짧은 설명에서 뺀다(11 §3-2의 AI 반발 리뷰). 대신 전체 설명 첫 문단에 생성 방식과 검증 방식을 공개한다(뉴스보이 선례).

---

## 5. Startup Daily가 할 것 / 하지 말 것

### 할 것

1. **Android 1차 출시의 KPI를 리텐션으로 정한다**: 푸시 동의율, D7·D30, 주당 방문일 수. 웹 PWA와 같은 지표로 비교해 "앱이 리텐션을 올리는가"부터 증명한다.
2. **결제는 웹을 기본으로 둔다.** 앱 안 결제는 iOS 출시 때 IAP 구독 하나로 붙인다. Android에 먼저 붙인다면 Play Billing 구독 하나로 하되, 결제 실패 해지(31%) 대응(유예 기간, 계정 보류 안내)을 함께 설계한다.
3. **개인화는 순서·한 줄·알림·아카이브 추천에만 쓴다.** 오늘의 4곳은 모두에게 같게 유지한다.
4. **온보딩은 "역할 1개 + 관심 분야 3개 권장", 건너뛰기 가능, 40초 이내**로 만든다. 푸시 권한은 첫 호를 읽은 뒤에 묻는다.
5. **푸시 문구를 개인화한다**(관심 분야 회사명을 앞에). 하루 1회, 시간은 사용자가 고른다. 열람률은 A/B로 직접 잰다.
6. **영어판에 "Precedents & Adjacent Markets"를 만든다.** 06의 검증 규칙(링크 검증, 단정어 금지, 사실·가설 분리)을 그대로 적용한다. 세그먼트별 한 줄("For founders / investors / PMs / job seekers")을 붙인다.
7. **영어 스토어 문안은 "아직 모르는 회사 + 선례"를 앞세운다**(EN A). 한국어는 "매일 4곳 + 한국에서 될지"를 앞세운다(KO A).

### 하지 말 것

1. **"앱을 내면 매출이 오른다"를 출시 근거로 쓰지 않는다.** Android 입구 전환은 0.9%이고, 독자 0명 단계의 앱은 매출 변수를 바꾸지 않는다.
2. **미국 Android에서 외부 링크 결제를 "수수료 0%"로 가정하지 않는다.** 2026-10-01부터 구독 10% + 설치당 2.85달러를 신고·납부해야 한다(법적 확정은 미정).
3. **관심 분야로 4곳 자체를 바꾸지 않는다.** 편집 약속이 깨진다. 주제를 많이 고르도록 강제하지도 않는다(Product Hunt식 최소 5개 강제는 이탈 위험) [판단].
4. **Crunchbase·PitchBook과 데이터 규모로 경쟁하지 않는다.** 펀딩 표나 경쟁사 수십 개 목록을 늘리는 대신, 선례 2~3개와 "왜 같은 구조인가"를 쓴다.
5. **검증되지 않은 comps나 시장 규모 숫자를 싣지 않는다.** 애널리스트 독자는 틀린 숫자 하나에 떠난다.
6. **스토어 제목·짧은 설명에 "#1", "Best", "AI-powered"를 쓰지 않는다**(정책 위험과 AI 반발).

---

## 6. 출처 (접근일 2026-10-30)

- [R1] RevenueCat, Subscription app trends & benchmarks 2026 (2026-03-19) — https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026.md
- [R2] RevenueCat, IAP vs web purchases conversion test (2025-05~) — https://www.revenuecat.com/blog/growth/iap-vs-web-purchases-conversion-test/
- [R3] RevenueCat, The Android paywall conversion gap (2026-03-25) — https://www.revenuecat.com/blog/engineering/android-paywall-gap
- [R4] Substack, In-app payments (IAP) FAQ (2025-08-18) — https://on.substack.com/p/in-app-payments-iap-faq / TechCrunch (2025-08-18) — https://techcrunch.com/2025/08/18/substack-writers-can-now-direct-u-s-readers-to-often-cheaper-web-based-subscriptions-on-ios
- [R5] iOS vs Android revenue per user (2026, 2차) — https://appsops.store/news/ios-android-revenue-gap-platform-strategy-2026 / https://thesocialoutline.com/blog/ios-vs-android-subscription-economics
- [R6] Google Play Console Help, External content links program (US) (2026-07-22 갱신) — https://support.google.com/googleplay/android-developer/answer/16470497?hl=en
- [R7] Substack 전환율 정리(2차) — https://www.reallygoodbusinessideas.com/p/substack-average-paid-subscriber-conversion-rate / https://simonowens.substack.com/p/whats-a-realistic-conversion-rate
- [R8] Reuters Institute DNR 2025 요약(2차) — https://www.academicjobs.com/higher-education-news/reuters-digital-news-report-2025-48-markets-habits-or-academicjobs-1352 / https://www.inma.org/blogs/readers-first/post.cfm/paying-for-online-news-hits-new-high
- [R9] Stash, Google's lower fees announcement June 2026 — https://www.stash.gg/blog/googles-lower-fees-announcement-june-2026-whats-really-going-on-and-what-us-developers-should-do
- [R10] Stash, Google's October 1 external link fees (2026-07-30) — https://www.stash.gg/blog/googles-october-1-external-link-fees-what-changes-and-what-developers-still-dont-know
- [R11] Particle 온보딩 — https://screensdesign.com/showcase/particle-news / https://newsmachines.beehiiv.com/p/particle-news-ai-aggregation / https://twipemobile.com/particle-a-user-focused-ai-news-experience
- [R12] Flipboard, Personalize your For You feed (2021년 추정) — https://about.flipboard.com/inside-flipboard/stop-doomscroling-and-take-control-personalize-your-for-you-feed/ / 최소 주제 수: https://instructables.com/Getting-Started-With-Flipboard
- [R13] Appcues GoodUX, Product Hunt onboarding — https://goodux.appcues.com/blog/product-hunts-new-user-onboarding
- [R14] Ground News FAQ — https://ground.news/frequently-asked-questions / Android Authority — https://www.androidauthority.com/google-news-alternatives-3584732 / TapSmart — https://www.tapsmart.com/apps/review-ground-news-4/?amp=1
- [R15] Nieman Lab, Behind SmartNews — https://www.niemanlab.org/reading/behind-smartnews-the-2-billion-unicorn-trying-to-fix-the-news-algorithm/ / IJNet — https://ijnet.org/en/story/smartnews-app-drives-traffic-will-it-drive-revenue
- [R16] Google News Help, How stories are selected — https://support.google.com/googlenews/answer/9005749?hl=en
- [R16b] Inshorts App Store — https://apps.apple.com/us/app/id892146527
- [R17] Crunchbase Product Updates — https://about.crunchbase.com/product-updates / Similar Companies 도입 — https://about.crunchbase.com/blog/crunchbase-similar-companies
- [R18] Feedly Leo — https://blog.feedly.com/?p=11799 / https://liliputing.com/feedly-launches-pro-plans-with-ai-assistant-features/
- [R19] NYT Now 종료(2016) — https://techcrunch.com/2016/08/18/the-new-york-times-to-shutter-its-news-summary-app-nyt-now
- [R20] App Store US 페이지 직접 확인(2026-10-30) — Particle https://apps.apple.com/us/app/id6683283775 · Ground News https://apps.apple.com/us/app/id1324203419 · SmartNews https://apps.apple.com/us/app/id579581125 · Google News https://apps.apple.com/us/app/id459182288 · Feedly https://apps.apple.com/us/app/id396069556 · Flipboard https://apps.apple.com/us/app/id358801284 · Inshorts https://apps.apple.com/us/app/id892146527 · Product Hunt https://apps.apple.com/us/app/id904658671 · The Information https://apps.apple.com/us/app/id1485459932 · PitchBook https://apps.apple.com/us/app/id830609497
- [R20b] Google Play US 페이지 og:title(2026-10-30) — https://play.google.com/store/apps/details?id=jp.gocro.smartnews.android · id=com.nis.app · id=com.google.android.apps.magazines · id=com.devhd.feedly
- [R21] 뉴닉 App Store — https://apps.apple.com/kr/app/id1549450444
- [R22] Google Play Console Help, Best practice for your store listing — https://support.google.com/googleplay/android-developer/answer/13393723?hl=en / 메타데이터 금지 표현(2차) — https://www.inspiringapps.com/blog/google-play-store-listing
- [R23] Leanplum 연구 보도 (2016) — https://www.mobilemarketer.com/cms/news/research/22881.html / https://segment.com/blog/push-notification-study-analysis
- [R24] Airship — https://www.airship.com/blog/7-mobile-engagement-statistics-that-show-how-push-notifications-boost-roi/
- [R25] CB Insights — https://research.cbinsights.com/400-ai-agent-market-map / https://cbinsights.com/november-2025-product-launch/
- [R26] Exploding Topics — https://explodingtopics.com/blog/exploding-topics-pro-vs-free / https://explodingtopics.com/pricing-intent
- [R27] Not Boring 관련(2차) — https://curatorofinsights.substack.com/p/not-boring-how-packy-mccormick-built-a-1m-newsletter-business / https://hypefury.beehiiv.com/p/he-picked-a-crowded-niche-and-yet-he-hit-183k-subscribers
- [R28] Stratechery·The Generalist 추정(2차) — https://blog.beehiiv.com/p/discover-the-million-dollar-secrets / https://stratechery.com/outline/what-is-stratechery/
- [R29] a16z 신호 해석(2차, 저신뢰) — https://blog.mean.ceo/?p=7482

### 확인 불가 기록

- RevenueCat 2026 보고서의 웹 결제 비중, 뉴스·매거진 카테고리 전환율: 전체 PDF는 유료·게이트라 확인 불가.
- Medium·Morning Brew의 앱 vs 웹 전환율: 공개 자료 없음.
- Google Play 경쟁 앱의 짧은 설명(80자): Play 웹 페이지에 노출되지 않아 확인 불가. 제목만 확인했다.
- 뉴닉·Ground News의 현재 첫 실행 온보딩 화면: 직접 설치 확인이 필요하다.
- 미국 iOS 외부 링크 수수료가 현재 0%인지: 대법원 심리 중(08 참조).
