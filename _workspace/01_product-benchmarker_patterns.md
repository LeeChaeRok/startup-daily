# Startup Daily UX 벤치마크 — 패턴 카탈로그 & 안티패턴

- 작성: product-benchmarker / 기준일 2026-10-22
- 근거: 공개 페이지·공식 문서·디자인 리뷰 글(WebSearch/WebFetch), 그리고 리더의 Chrome 관찰 노트(`_workspace/01_lead_chrome-notes.md`, 2026-10-22). 이 에이전트는 사용자 Chrome을 열 수 없어 Product Hunt 홈은 WebFetch 텍스트로, THE VC·뉴닉·Sifted·혁신의숲 화면은 리더 노트로 확인했다. Artifact(2024년 서비스 종료)와 Pocket(2025-07-08 종료)은 아카이브된 리뷰로만 확인했다.
- 데이터 근거: `src/data/startups.json` 80건, 13일치(2026-04-15~04-27, 하루 5건). 필드: `date, name_en/ko, tagline, category[](자유 태그 3개), founded_year, headquarters{city,country,country_ko}, company_stage, employee_count, website, logo_url(80건 전부 빈 값), logo_svg_description, founders[], team_highlights, product{summary, problem_statement, solution, key_features[], business_model…}, competitive_landscape{direct_competitors[], key_differentiator, moat…}, trending_reason{summary, catalysts[], media_mentions[], growth_metrics}, funding{total_raised, latest_round, valuation_estimate, funding_history[]}, market_outlook{…, risks[]}, related_links[], editor_pick_comment`. 레코드 하나가 평균 약 4,500자다.

---

## 0. 요약 — 가장 먼저 바꿀 5가지

| 우선순위 | 패턴 | 바꾸는 것 | 근거 서비스 |
|---|---|---|---|
| P0 | 랭크 리스트 → 상세 페이지 (#2, #4) | "카드마다 가로 7장"을 버리고, 오늘의 리스트를 훑은 뒤 세로 스크롤 상세로 들어가는 구조 | Product Hunt, Crunchbase, THE VC |
| P0 | Smart Brevity 요약 블록 (#3) | 리스트 행과 상세 첫 화면에 "왜 지금 / 핵심 숫자 / 에디터 한 줄"만 둔다 | Axios, 뉴닉 |
| P0 | 로고 폴백 + 모노그램 (#19) | 빈 흰 박스를 없앤다 | (Clearbit 종료) |
| P0 | 신뢰 표시 + 검증 안 된 링크 숨김 (#18) | 생성일, AI 작성 표기, 출처 상태 | THE VC, Particle, Artifact |
| P1 | 필터/검색 + 지난 호 아카이브 (#9, #10) | 날짜 칩이 끝없이 늘어나는 구조와 전체/한국 2분법을 대체 | Product Hunt, Perplexity Discover, 혁신의숲 |

---

## 1. 일간 진입 화면

### #1 오늘의 브리핑 헤더 (인사 + 분량 예고)
- 관찰 서비스: Morning Brew(친근한 인사 → 날짜 → 섹션 순서), 뉴닉(고슴이 인사로 하루를 연다는 독자 반응, 주 3회 발행, 출퇴근 시간에 읽을 분량), Axios(읽는 데 걸리는 시간 표시)
- 무엇을: 첫 화면 위쪽에 큰 날짜 타이틀("10월 22일 수요일")을 두고, 그 아래 한 줄 요약("오늘의 스타트업 5곳 · 약 4분")과 진행 상태("2/5 읽음")를 붙인다. 헤더의 칩은 3줄에서 1줄로 줄인다.
- 왜 효과적인가: 시작 전에 끝을 알려 주면 완독 동기가 생긴다. 일간 매체들은 뉴스 속보 대신 사람의 인사로 시작해 습관적인 의식을 만든다(The Audiencers의 Morning Brew 분석, 뉴닉 인터뷰). 지금은 콘텐츠가 화면 1/4 지점에서야 시작된다(리더 노트).
- Startup Daily 적용안: `date`, 그 날짜 레코드 수, 읽음 수(localStorage). 오늘 분량은 `tagline`과 `trending_reason.summary` 글자 수로 읽기 시간을 추정한다. 그날의 테마는 `category[0]`을 묶어서 만든다(예: "오늘은 로보틱스 2곳, 디지털 헬스 1곳").
- 구현 난이도: S

### #2 랭크 리스트 + 시간축 섹션 (오늘 → 어제 → 지난주)
- 관찰 서비스: Product Hunt 홈. "Top Products Launching Today"는 번호·48px 로고·이름·한 줄 소개·주제 태그 1~3개·댓글/업보트 수로 된 행을 나열한다. 그 아래 "Yesterday's / Last Week's / Last Month's Top Products"가 각각 5개씩 이어진다. 혁신의숲은 "인기 급상승 기업 1~8위"를 2열 리스트로 보여 준다.
- 무엇을: 한 화면에 5~6개 회사를 훑을 수 있는 촘촘한 행. 행을 탭하면 상세(#4)로 간다. 오늘 섹션 아래에 "어제의 5곳"과 "이번 주"를 접힌 형태로 둔다.
- 왜 효과적인가: 비교와 선택이 먼저이고 깊게 읽는 건 그다음이다. 지금 구조에서는 회사 10곳을 보려면 슬라이드 70장 사이를 오가야 하고, 회사끼리 비교할 수 없다(리더 노트). 시간축 섹션은 놓친 날을 메워 주는 장치이면서 아카이브의 입구 역할도 한다.
- Startup Daily 적용안: 행에는 모노그램/로고, `name_ko`(`name_en`은 보조), `tagline`, `category[0]`, `company_stage`(정규화한 값), 오른쪽 정렬 숫자 `funding.total_raised`를 넣는다. 순서는 데이터 순서 또는 에디터 지정 순서. 업보트가 없으니 사회적 증거 대신 투자 숫자를 오른쪽 메타로 쓴다.
- 구현 난이도: S

### #3 Smart Brevity 요약 블록 ("Axioms")
- 관찰 서비스: Axios. 첫 화면은 헤드라인 + 이미지 + 두 문단의 "atomic unit"이고, "Why it matters", "The big picture", "By the numbers", "Go deeper" 같은 굵은 라벨 뒤에 한 문장이나 불릿 몇 개가 온다. 평균 체류 26초를 전제로 설계됐다(journalism.co.uk, 2025-07 업데이트). 뉴닉은 큰 한글 헤드라인 + 2~3줄 요약 + 작은 회색 메타를 쓴다.
- 무엇을: 상세 첫 화면이자 리스트를 펼친 상태에서 고정 라벨 3~4개를 보여 준다.
  - **왜 지금** → `trending_reason.summary`
  - **숫자로 보면** → `funding.total_raised` · `funding.latest_round.stage/amount/date` · `valuation_estimate`
  - **무엇을 하나** → `product.summary`(1문장으로 자름)
  - **에디터 한 줄** → `editor_pick_comment`(평균 96자로 한 화면 인용에 적합)
- 왜 효과적인가: 라벨이 고정돼 있으면 독자가 매일 같은 자리에서 같은 정보를 찾는다. 이게 일간 포맷이 쌓는 학습 효과다. 지금의 "Cover" 슬라이드는 회사명·태그라인·숫자 하나만 보여 주고 화면의 60%가 비어 있다(리더 노트).
- Startup Daily 적용안: 위 필드를 그대로 쓴다. 새 데이터는 필요 없다.
- 구현 난이도: S

---

## 2. 기업 프로필(딥다이브) 구조

### #4 회사별 상세 페이지 + 고유 URL
- 관찰 서비스: Crunchbase 프로필(About: 설명·본사·펀딩 상태 / Highlights: 총 투자·인수 / 헤더 탭: People·Technology·Signals & News, 2020 리디자인, 2025-11 갱신). THE VC 기업 페이지(`thevc.kr/{slug}/fundings`처럼 회사마다 고정 URL과 탭을 둔다).
- 무엇을: `/s/{id}`(또는 해시 `#/s/{id}`)로 들어가는 세로 스크롤 문서. 뒤로가기를 하면 리스트의 스크롤 위치가 복원된다.
- 왜 효과적인가: 공유(#15), 저장(#11), 검색 유입, 딥링크가 모두 "회사 하나 = URL 하나"를 전제로 한다. 지금은 URL이 없어서 특정 회사를 가리킬 방법이 없다.
- Startup Daily 적용안: `id`(예: `skild-ai-2026`)가 이미 slug 형태다. **배포 제약**: memory 규칙상 `vercel.json` 추가가 금지라 SPA rewrite를 쓸 수 없다. 해시 라우팅(S)을 쓰거나, Vite 빌드 후 `dist/s/{id}/index.html`을 미리 생성(M)하는 방식을 권장한다. 후자는 회사별 OG 메타를 넣을 수 있어 #15 공유 카드와 연결된다.
- 구현 난이도: S(해시) / M(정적 프리렌더)

### #5 세로 문서 + 스티키 섹션 내비 (가로 슬라이드 대체)
- 관찰 서비스: Crunchbase 헤더 탭, Axios Axiom 라벨, Sifted 섹션 탭(Latest/Sectors/Startups/Investors). NN/g "Mobile Carousels"(2018)는 마지막 항목까지 3~4번 스와이프로 닿아야 하고, 그보다 많으면 리스트처럼 직접 접근하게 하라고 권고한다.
- 무엇을: 상세 페이지를 `개요 · 왜 지금 · 제품 · 경쟁 · 팀 · 투자 · 시장` 7개 섹션의 세로 문서로 만든다. 위에는 스크롤에 따라 하이라이트가 바뀌는 sticky 칩 바(IntersectionObserver)를 둔다. 탭하면 해당 앵커로 이동한다.
- 왜 효과적인가: 세로 스크롤은 모바일의 기본 동작이라 학습 비용이 없다. 섹션 길이가 서로 달라도 높이가 강제되지 않는다(지금은 슬라이드마다 `minHeight: 420` + 내부 `overflowY: auto`). 원하는 섹션으로 바로 갈 수 있다.
- Startup Daily 적용안: 지금의 7개 슬라이드 컴포넌트 내용을 섹션으로 재사용한다. 섹션 제목은 한국어로 바꾼다(아래 안티패턴 A5).
- 구현 난이도: M

### #6 핵심 팩트 스트립 (Key facts)
- 관찰 서비스: THE VC 기업 페이지 상단 요약(최근 단계·누적 유치 금액·유치 건수·투자자 수). Crunchbase About/Highlights.
- 무엇을: 상세 페이지 위쪽에 2×3 또는 3×2 그리드로 라벨(작은 회색)과 값(큰 숫자, tabular-nums)을 둔다.
- 왜 효과적인가: 투자자·창업자 독자는 숫자부터 확인한다. 지금은 이모지와 함께 한 줄로 흩어져 있다(📍 🗓 👥).
- Startup Daily 적용안: `founded_year` · `headquarters.city, country_ko` · `company_stage` · `employee_count` · `funding.total_raised` · `funding.valuation_estimate`.
- 구현 난이도: S

### #7 투자 타임라인 + 투자자 목록
- 관찰 서비스: THE VC "투자 유치 배경". 연·월 단위 타임라인에 출처 표기와 팔로온 여부가 붙고, 투자자 표에는 이름·분류·날짜·단계·금액 열이 있다. 알 수 없는 금액은 "알 수 없음"으로 명시한다.
- 무엇을: 세로 타임라인(점 + 선)과, 라운드마다 `stage · amount · date · lead_investor`. 맨 아래에 `notable_investors`를 칩으로 둔다.
- 왜 효과적인가: 성장 속도(라운드 사이 간격과 금액 증가)가 한눈에 보인다. "알 수 없음"을 숨기지 않고 표기하는 것 자체가 신뢰 장치다.
- Startup Daily 적용안: `funding.funding_history[]`, `funding.latest_round.notable_investors[]`. 빈 값은 "미공개"로 표기한다.
- 구현 난이도: S

### #8 경쟁사 비교 리스트
- 관찰 서비스: Particle "Opposite Sides"/관점 비교(같은 이슈를 여러 시각으로 나란히 둔다), Crunchbase의 유사 기업 노출.
- 무엇을: 행마다 "경쟁사명 — 차이 한 줄"을 쓰고, 위에 `key_differentiator`와 `moat`를 강조 박스로 둔다.
- 왜 효과적인가: 낯선 회사를 이해하는 가장 빠른 방법은 "아는 회사와 무엇이 다른가"다. 덜 알려진 스타트업을 다루는 우리 콘셉트에서는 경쟁사가 독자가 붙잡을 기준점 역할을 한다.
- Startup Daily 적용안: `competitive_landscape.direct_competitors[{name, comparison}]`, `key_differentiator`, `moat`, `competitive_position_summary`.
- 구현 난이도: S

---

## 3. 탐색 / 필터 / 검색

### #9 필터 시트 + 즉시 검색
- 관찰 서비스: Product Hunt "Top Product Categories"(7개 대분류 → 하위 분류), Perplexity Discover(Top + Tech & Science/Finance 등 주제 탭), 혁신의숲("최근 30일 가장 투자가 활발한 카테고리" 모듈).
- 무엇을: 헤더 오른쪽 검색 아이콘을 누르면 전체 화면 검색(이름·태그라인·카테고리, 클라이언트 측 필터)이 열린다. 필터 바텀시트에는 `분야` / `단계` / `국가`가 있다.
- 왜 효과적인가: 레코드는 이미 80건이고 1년이면 1,800건이 넘는다. 날짜만으로는 "로보틱스 시리즈 B 회사들"을 다시 찾을 수 없다. 지금의 지역 필터는 전체/한국 2개뿐인데, 데이터는 미국 42건 · 한국 15건 · 독일 5건 등 20여 개국에 걸쳐 있다.
- Startup Daily 적용안: `category[]`는 자유 태그라 거의 모든 조합이 1회씩만 나온다. 상위 태그도 최대 7회(AI 인프라)다. 그래서 **8~10개 대분류(예: AI·인프라 / 로보틱스·하드웨어 / 바이오·헬스 / 핀테크 / 기후·에너지 / 우주·모빌리티 / 개발자도구 / 커머스·소비자)로 매핑하는 테이블**이 필요하다(생성 파이프라인에 `sector` 필드를 추가하는 것을 권장). `company_stage`도 "Public (NASDAQ: RXRX)", "Series C+", "Post-IPO (재상장 추진)"처럼 제각각이라 `Seed/A/B/C/D+/상장` enum으로 정규화한다. 국가는 `country_ko`.
- 구현 난이도: M(분류 매핑 포함)

### #10 지난 호 아카이브 (캘린더/주간 그룹)
- 관찰 서비스: Product Hunt 시간축 섹션과 "Launch archive", Morning Brew·뉴닉의 지난 호 목록.
- 무엇을: 가로 날짜 칩 대신 "지난 호" 화면을 둔다. 주 단위로 묶고, 날짜마다 그날 회사 로고 5개를 미니 썸네일로 보여 준다. 읽은 날은 체크 표시를 한다.
- 왜 효과적인가: 날짜 칩은 1년이면 365개가 된다. 칩 행은 "최근 7일"까지만 의미가 있다.
- Startup Daily 적용안: `date`로 그룹을 만들고, 읽음 상태는 localStorage에 둔다.
- 구현 난이도: S~M

---

## 4. 저장 · 아카이브

### #11 저장(북마크) + 읽음 상태 + 내보내기
- 관찰 서비스: Readwise Reader의 Inbox → Later → Archive 트리아지(단축키 E/L, Shortlist 모드). Pocket 종료(2025-05 발표, 2025-07-08 종료, 2025-10-08 데이터 삭제). 저장이 읽기보다 빠르게 쌓인다는 문제 제기(Beeminder).
- 무엇을: 리스트 행과 상세 헤더에 북마크 아이콘을 둔다(SVG, 별 문자 대신). "저장함"은 헤더 토글 대신 별도 화면이나 하단 탭으로 분리한다. 저장 항목에는 `읽음/안 읽음`과 저장 날짜를 표시하고, 정렬 옵션(저장순/분야별)을 준다. JSON/링크 목록 내보내기를 제공한다.
- 왜 효과적인가: 3단 트리아지는 우리에게 과하다. 그래도 "읽음" 상태 하나는 리텐션(#12, #13)의 기반 데이터가 된다. Pocket 종료 사례가 보여 주듯 로컬 저장소는 사라질 수 있으니 내보내기가 신뢰를 준다.
- Startup Daily 적용안: `id`, localStorage `saved_startups`(기존 키 유지) + `read_startups{id: timestamp}`.
- 구현 난이도: S

---

## 5. 리텐션

### #12 일간 완독 링 + 부드러운 스트릭
- 관찰 서비스: Duolingo 스트릭(1년 이상 스트릭 사용자 900만+, 리텐션 팀이 4년간 600회 넘게 실험, 스트릭 프리즈; Lenny's Newsletter). Apple News 퍼즐 Scoreboard(현재 스트릭과 최장 스트릭, 발행 후 24시간 안에 풀어야 인정).
- 무엇을: 헤더에 작은 링(오늘 5곳 중 n곳 읽음)을 둔다. 다 읽으면 "오늘 완독 · 연속 4일"이라는 조용한 완료 카드를 보여 준다. 주말과 하루 결석은 자동으로 유예한다(프리즈).
- 왜 효과적인가: 일간 콘텐츠는 "오늘 분량을 끝냈다"는 종결감이 핵심 보상이다. 하루 5곳이라는 고정 분량이 이 장치와 잘 맞는다. 다만 연구는 상관관계 중심이고, Wordle 사례처럼 강박이나 죄책감으로 이어질 수 있다는 비판이 있다. 그래서 알림 압박, 스트릭 소실 경고, 하트 같은 패널티는 쓰지 않는다.
- Startup Daily 적용안: 날짜별 레코드 수와 `read_startups`. 서버가 필요 없다.
- 구현 난이도: S

### #13 "어제 놓친 것" 리마인더
- 관찰 서비스: Product Hunt "Yesterday's Top Products", Particle의 오디오 다이제스트("출퇴근 중 따라잡기").
- 무엇을: 오늘 리스트 아래에 "어제 놓친 3곳"이라는 접힌 섹션을 둔다. 읽음 상태 기준으로 안 읽은 것만 보여 준다. PWA를 설치한 사용자에게는 이후 옵트인 푸시(아침 8시)를 제공할 수 있다(iOS는 홈 화면 설치가 필요하다).
- 왜 효과적인가: 하루를 놓치면 이탈하는 흐름을 끊는다. "밀린 것"이 3개 정도면 부담 없이 따라잡을 수 있다.
- Startup Daily 적용안: `date`가 전날인 레코드에서 `read_startups`에 없는 것만 고른다. 푸시는 서버/Edge 함수가 필요해서 별도로 다룬다(L).
- 구현 난이도: S(섹션) / L(푸시)

---

## 6. 공유

### #14 Wordle식 "오늘의 결과" 공유 텍스트
- 관찰 서비스: Wordle 이모지 그리드. 정답을 스포일러하지 않고 내 결과를 보여 줘서 바이럴됐고, 하루 한 번 같은 퍼즐이라 사람들이 같은 순간을 공유한다.
- 무엇을: 완독 카드에 "공유" 버튼을 둔다. 텍스트는 "Startup Daily 10/22 — 로보틱스·디지털헬스·핀테크 5곳 완독 · 연속 4일 + 링크"다.
- 왜 효과적인가: 공유하는 사람은 자기 습관을 드러내고, 받는 사람은 그날의 주제를 미리 본다.
- Startup Daily 적용안: 그날의 `category[0]` 묶음, 스트릭, 루트 URL.
- 구현 난이도: S

### #15 회사별 공유(Web Share API + OG 카드)
- 관찰 서비스: MDN/web.dev Web Share API(`navigator.share`, HTTPS와 사용자 제스처 필수, canonical URL 공유 권장). Product Hunt와 Crunchbase는 회사마다 OG 이미지를 둔다.
- 무엇을: 상세 헤더에 공유 아이콘을 둔다. `navigator.share({title, text, url})`를 쓰고, 지원하지 않으면 링크 복사 후 토스트를 띄운다. 회사별 OG 메타(제목 = `name_ko · tagline`, 설명 = `editor_pick_comment`)를 넣는다.
- 왜 효과적인가: 일간 매체의 성장은 대부분 "이 회사 봐"라는 1:1 공유에서 온다. 지금은 URL이 없어 공유가 아예 불가능하다.
- Startup Daily 적용안: `id`, `name_ko`, `tagline`, `editor_pick_comment`. OG는 #4의 정적 프리렌더에 의존한다.
- 구현 난이도: S(Share) / M(OG)

---

## 7. 데스크톱 레이아웃

### #16 리스트-상세 분할 뷰 (≥1024px)
- 관찰 서비스: THE VC 데스크톱 3단(왼쪽 내비 · 중앙 콘텐츠 · 오른쪽 랭킹 레일, 리더 노트), Readwise Reader(왼쪽 목록 + 리더), Product Hunt(메인 리스트 + 하단/측면 카테고리 모듈).
- 무엇을: 768px 이상에서는 콘텐츠 폭을 680px로 넓히고 상세 본문 폭은 65~72자로 제한한다. 1024px 이상에서는 왼쪽 오늘 리스트(360px)와 오른쪽 상세(최대 720px)를 나란히 두고, 1280px 이상이면 오른쪽 레일(핵심 팩트·지난 호·분야 필터)을 추가한다.
- 왜 효과적인가: 지금은 데스크톱에서도 520px 단일 칼럼이라 화면의 3분의 2가 빈 회색이다. 투자자나 리서처 독자는 데스크톱에서 여러 회사를 비교한다.
- Startup Daily 적용안: 기존 필드를 그대로 쓴다. 상세 선택은 URL(#4)과 동기화한다.
- 구현 난이도: M

---

## 8. 다크모드

### #17 시맨틱 컬러 토큰 + 시스템 연동 다크
- 관찰 서비스: THE VC(다크 UI가 투자 데이터 서비스의 기본처럼 익숙하다, 리더 노트), Artifact(흑백 베이스에 브랜드색은 포인트로만 쓴다, UX Breakdowns 2023-03).
- 무엇을: `--bg / --surface / --text / --text-muted / --border / --accent` 토큰을 쓰고, `prefers-color-scheme` 자동 감지와 수동 토글(시스템/라이트/다크)을 둔다. 다크 배경은 순수 검정 대신 #0f1115 근처를 쓰고, 액센트는 채도를 낮춘다.
- 왜 효과적인가: 아침과 밤 출퇴근 시간에 읽히는 일간 콘텐츠라 저조도 환경이 많다. 지금은 인라인 스타일에 `#fff`, `#1a1a2e`, `#888` 같은 값이 하드코딩돼 있어 다크모드를 붙일 수 없다. 토큰화가 선행 조건이다.
- Startup Daily 적용안: 데이터 무관. Tailwind v4 `@theme` + `dark:` variant.
- 구현 난이도: M(인라인 스타일 제거 작업량 때문)

---

## 9. 신뢰 표시

### #18 출처 상태 · 생성일 · AI 작성 표기
- 관찰 서비스: THE VC(항목마다 "직접 제보/출처" 표기, "알 수 없음" 명시, 페이지 하단에 정확성 비보장 면책). Particle(여러 매체 출처를 함께 보여 주는 이야기 단위 요약). Artifact(AI가 재작성한 헤드라인에 별 아이콘 표시, TechCrunch 2023-06). Perplexity(답변마다 출처 링크).
- 무엇을: 상세 페이지 아래에 "이 프로필은 AI가 공개 자료를 바탕으로 작성하고 에디터가 선정했습니다 · 작성 2026-04-27 · 수치는 기준 시점 이후 변했을 수 있음" 블록을 둔다. 외부 링크는 **검증된 것만** 노출하고, 검증되지 않은 언론 보도는 링크 없이 "보도 언급(미확인)"으로 표기하거나 숨긴다. 공식 웹사이트(`website`)는 항상 보여 준다.
- 왜 효과적인가: AI가 생성한 투자 정보는 틀린 숫자 하나로 매체 전체의 신뢰가 무너진다. 날짜와 출처 상태를 정직하게 표기하면 오류가 생겨도 피해가 덜하다.
- Startup Daily 적용안 — **데이터 경고**: 샘플 10개 레코드의 `trending_reason.media_mentions[].url` 12개를 확인했더니(curl, 2026-10-22) **10개가 404/401**이었다(예: `forbes.com/skild-300m/`, `bloomberg.com/skild-android-robots/`, `techcrunch.com/tessl-125m/`). URL 형태로 보아 생성 모델이 지어낸 링크로 보인다. 지금 UI는 링크를 걸지 않고 "In the News"에 매체명과 제목만 보여 주지만, 이 표시 자체가 실제 보도처럼 읽힌다. → (1) UI: 링크를 노출하지 않고 섹션명을 "관련 보도(미검증)"로 바꾸거나 숨긴다. (2) 파이프라인: 생성 단계에서 HTTP 200을 검증하고 `verified: true` 필드를 추가하며, `generated_at` 필드를 추가한다. `related_links`도 같은 검증이 필요하다.
- 구현 난이도: S(UI) / M(파이프라인 검증)

---

## 10. 타이포그래피 · 비주얼 아이덴티티

### #19 로고 폴백 체인 + 모노그램
- 관찰 서비스: Product Hunt(모든 행에 48px 정사각 로고), Clearbit Logo API 종료(HubSpot 공지 2025-12, logo.dev로 이전 권장. logo.dev는 퍼블리셔블 키가 필요하고 무료 티어는 월 50만 건, 벤더 주장).
- 무엇을: `logo_url` → logo.dev(키 필요) 또는 Google s2 favicons(`/s2/favicons?domain=&sz=128`, 리더 확인 200 OK, 비공식 엔드포인트) → `naturalWidth < 64`이면 모노그램 순서로 시도한다. 모노그램은 이니셜 1~2자에 분야 대분류(#9) 색을 단색 배경으로 쓴다. 이미지는 `loading="lazy"`, 고정 크기, 로드 전에는 모노그램을 보여 준다.
- 왜 효과적인가: 회사가 낯설수록 로고 같은 시각적 앵커가 기억을 돕는다. 빈 박스는 "깨진 사이트"라는 인상을 준다.
- Startup Daily 적용안: `website`의 도메인과 `name_en`. `logo_svg_description`은 지금 쓰이지 않는데, 모노그램 색과 형태 힌트로만 참고한다.
- 구현 난이도: S

### #20 에디토리얼 타이포 위계 (한글 우선)
- 관찰 서비스: Stratechery(2018 리뉴얼에서 타자기 느낌의 Archer 세리프를 쓰고 올캡스 헤드라인을 없앴다), Sifted(컬러 텍스트 카테고리 라벨 + 굵은 헤드라인 + 회색 요약 + 세로 룰, 리더 노트), 뉴닉(큰 한글 헤드라인과 작은 회색 메타의 강한 대비).
- 무엇을: 본문은 Pretendard(OFL, 한글과 라틴 일관성) 16~17px, 행간 1.6~1.75(WCAG 최소 1.5)로 한다. 헤드라인은 한글 굵은 산세리프 22~28px. 카테고리는 배지 대신 "컬러 텍스트 라벨"로 쓴다. 숫자는 `font-variant-numeric: tabular-nums`. 세리프를 쓴다면 한글 세리프(예: 본명조 계열)를 `editor_pick_comment` 인용에만 쓴다.
- 왜 효과적인가: 지금 쓰는 DM Sans와 Playfair Display는 한글 글리프가 없어서 한글은 시스템 폰트로 폴백한다. 영문 회사명만 세리프가 되어 서체가 섞인다. 크기 분포도 11px 29회, 12px 20회, 13px 11회로 한국어 본문으로는 작다.
- Startup Daily 적용안: 데이터 무관. `editor_pick_comment`를 풀 쿼트로 쓰면 매체의 목소리가 생긴다.
- 구현 난이도: S

---

## 11. 안티패턴 — 현재 UI 비판

| # | 안티패턴 | 현재 UI에서의 증상 | 왜 나쁜가 (근거) | 대체 패턴 |
|---|---|---|---|---|
| A1 | **카드마다 가로 7장 캐러셀에 긴 텍스트를 몰아넣음** | `StartupCard`가 슬라이드 7장(Cover~Market), 하루 5~10곳이면 35~70장 | NN/g: 마지막 항목까지 3~4스텝 안에 닿아야 한다. 캐러셀 클릭은 첫 슬라이드에 몰린다(Notre Dame 데이터, 2차 인용 84~89%). 회사끼리 비교와 스캔이 불가능하다 | #2 리스트 + #4/#5 세로 상세 |
| A2 | **가로 스크롤 안의 세로 스크롤(스크롤 트랩)** | 각 슬라이드가 `minHeight: 420; overflowY: auto` | 수직 제스처가 카드 안과 피드 중 어느 쪽에 먹히는지 예측할 수 없다. 긴 섹션(Market, Funding)은 420px 상자 안에 갇힌다 | #5 |
| A3 | **약한 진행 표시와 작은 터치 타깃** | 높이 3px 진행 바를 버튼으로 사용, 10px 회색 "Cover 1/7", 텍스트 힌트 "swipe to explore →" | NN/g: 점이나 선은 약한 시그니파이어이고, 다음 항목이 살짝 보이는 peek가 강한 단서다. WCAG 2.5.8 최소 타깃 24px 미달. 페이지 거터가 12px라 iOS 엣지 스와이프(뒤로가기)와 충돌한다 | #5 스티키 칩(높이 ≥ 36px) |
| A4 | **죽은 로고 서비스, 빈 흰 상자** | `getLogoUrl`이 clearbit URL을 반환 → `onError`로 img만 숨김 → 72px 빈 흰 상자. `logoUrl`이 null이 아니라서 모노그램 분기에는 영영 도달하지 않음 | Clearbit Logo API는 2025-12 종료됐다. 첫 화면의 시각 앵커가 0개다 | #19 |
| A5 | **한/영 혼용 UI 라벨** | "Cover, Why Trending, Catalysts, Growth, In the News, Saved, Total Raised, swipe to explore", 날짜 "4/27 Mon" | 한국어 매체인데 내비게이션 언어가 영어라 정보 위계가 약해진다. 뉴닉과 THE VC는 UI 라벨이 모두 한국어다 | 라벨 한국어화(왜 지금 / 투자 / 경쟁 …) |
| A6 | **보라 그라디언트 단일 액센트 남용** | 로고, 저장 버튼, 지역 칩, 날짜 칩의 활성 상태가 모두 `linear-gradient(#667eea,#764ba2)`. 게다가 `catColors` 키가 영문('AI', 'FinTech')인데 데이터 `category`는 한국어('피지컬 AI')라 **모든 카드 액센트가 기본값 #7c3aed로 같다** | 색이 분야 정보를 전달하지 못하고, 활성 상태끼리 위계가 없다. 이른바 "AI 템플릿" 인상(리더 노트) | #9 대분류 색 매핑, #17 토큰, 활성 칩은 단색 |
| A7 | **이모지 아이콘** | 📍 🗓 👥 🌐 🇰🇷 ⚠ ☆★ | OS·폰트마다 렌더가 다르고(Windows에서 국기 이모지는 "KR" 문자로 보임), 스크린리더가 "round pushpin"처럼 읽으며, 크기와 정렬을 제어할 수 없다 | SVG 아이콘 세트(Lucide 등) 또는 텍스트 라벨(#6 팩트 스트립) |
| A8 | **라틴 전용 웹폰트와 작은 본문** | DM Sans + Playfair Display(한글 없음), 본문 11~13px가 대부분 | 한글이 시스템 폰트로 폴백해 서체가 섞인다. 11px 한글은 모바일 가독성 하한 미달 | #20 |
| A9 | **헤더 칩 3줄** | 로고/Saved → 전체/한국 → 날짜 칩 | 콘텐츠가 화면 1/4 아래에서 시작한다(리더 노트). 날짜 칩은 1년이면 365개로 늘어난다 | #1 헤더 1줄 + #10 지난 호 |
| A10 | **회사별 URL 없음** | 단일 화면 상태 전환만 있음 | 공유, 북마크 링크, 뒤로가기, 검색 유입이 모두 막힌다 | #4 |
| A11 | **저장 토글이 피드 모드를 바꿈** | Saved를 누르면 지역/날짜 칩이 사라지고 피드가 교체됨 | 사용자가 지금 어디에 있는지 잃는다. 저장함과 오늘 피드는 다른 장소여야 한다 | #11 별도 화면/탭 |
| A12 | **미검증 출처를 실제 보도처럼 표시** | "In the News"에 Forbes/Bloomberg 등 매체명 + 기사 제목. 샘플 URL 12개 중 10개가 404/401 | AI 생성 콘텐츠의 신뢰를 결정적으로 해칠 수 있다. 생성일과 AI 작성 표기도 없다 | #18 |
| A13 | **520px 고정 폭** | 데스크톱에서도 단일 좁은 칼럼 | 리서치형 독자가 쓰는 데스크톱에서 공간을 낭비하고 비교 작업이 불가능하다 | #16 |
| A14 | **하드코딩 인라인 컬러** | 컴포넌트마다 `style={{ color:'#888' }}` | 다크모드와 테마 변경이 불가능하다 | #17 |

---

## 12. 데이터 관찰 (설계자 참고)

- `category`는 레코드마다 자유 태그 3개라 필터에 그대로 쓸 수 없다. 대분류 매핑이 필요하다(#9).
- `company_stage`는 Series A~F 외에도 "Public (NASDAQ: PONY)", "Growth (Post-SPAC)", "Series A2" 등 15종이 넘는다. 정규화 enum이 필요하다.
- `logo_url`은 80건 모두 빈 값이다. 생성 파이프라인에서 채우지 않는다.
- 생성 시각과 검증 여부 필드가 없다. #18을 위해 `generated_at`, `sources_verified`를 추가할 것을 권장한다.
- (범위 밖 메모) "대중성 회피" 원칙에 비해 시리즈 C 이상 · 상장사 비중이 높다(Series C 이상·레이트 약 37건 + 상장·상장 후 5건, 80건 중). 콘텐츠 선정은 market-researcher나 리더가 판단할 사항이다.

---

## 13. 결론 — Startup Daily가 할 것 / 하지 말 것

**할 것**
1. 오늘 화면은 **랭크 리스트(훑기) → 세로 상세(읽기)** 2단 구조로 바꾼다(#2, #4, #5).
2. 리스트와 상세 첫 화면에 **고정 라벨 요약**(왜 지금 / 숫자 / 에디터 한 줄)을 둔다(#3). 기존 필드만으로 된다.
3. 회사마다 **고유 URL**을 두되, `vercel.json` 금지 제약에 맞춰 해시 라우팅이나 빌드 타임 정적 페이지로 만든다(#4). 공유와 OG는 이 위에 올린다(#15).
4. **로고 폴백 + 모노그램**, **한국어 UI 라벨**, **Pretendard 16px 이상 본문**을 적용한다(#19, #20, A5). 비용 대비 체감 개선이 가장 크다.
5. **신뢰 블록**(AI 작성 · 작성일 · 출처 상태)을 두고, **미검증 링크는 숨긴다**(#18).
6. 분야/단계/국가 **정규화 → 필터·검색 → 지난 호 아카이브**(#9, #10).
7. **읽음 상태**를 기반으로 완독 링, 부드러운 스트릭, "어제 놓친 것"을 만든다(#11~#13). 서버는 필요 없다.
8. **시맨틱 토큰**으로 인라인 컬러를 제거한 뒤 다크모드와 데스크톱 분할 뷰를 붙인다(#16, #17).

**하지 말 것**
1. 회사마다 가로 캐러셀을 두는 구조를 유지하거나, 슬라이드 수를 늘리지 않는다(A1~A3).
2. 이모지를 아이콘 대용으로 쓰지 않는다(A7).
3. 모든 활성 상태와 액센트에 같은 보라 그라디언트를 쓰지 않는다(A6).
4. 검증되지 않은 외부 기사 링크를 노출하지 않는다. 매체명만 내세워 권위를 빌리는 것도 하지 않는다(A12).
5. 스트릭 소실 경고, 죄책감 유발 알림, 패널티를 쓰지 않는다(#12 주의).
6. 데이터에 없는 기능(업보트, 댓글, 실시간 지표, 트래픽 그래프)을 화면에 약속하지 않는다.

---

## 출처

- Product Hunt 홈 구조 — https://www.producthunt.com/ (WebFetch 2026-10-22)
- Product Hunt 리더보드 포인트 개편 changelog — https://www.producthunt.com/p/producthunt/changelog-december-11-leaderboard-redesign-mobile-mentions (2024년 말 추정)
- Crunchbase 프로필 리디자인 — https://about.crunchbase.com/blog/new-crunchbase-profile-design (2020-07, 2025-11 갱신 표기)
- THE VC 기업 투자 페이지 예시 — https://thevc.kr/modern/fundings , https://thevc.kr/creatz/fundings (2026-10 검색)
- 혁신의숲 지표 정의 — https://www.venturesquare.net/888045/ , https://www.innoforest.co.kr/report/NS00000334
- Axios Smart Brevity — https://www.journalism.co.uk/how-axios-is-reinventing-text-journalism-with-smart-brevity/ (2022-09 게재, 2025-07 갱신), https://www.inma.org/blogs/conference/post.cfm/axios-reaches-today-s-reader-with-smart-brevity-journalism , https://thefineprintnyc.com/article/tldr-axios-wants-to-change-the-way-the-world-writes/
- Morning Brew 분석 — https://theaudiencers.com/deep-dive-into-the-morning-brew-newsletter-andy-griffiths/ , https://techcrunch.com/2018/03/26/the-morning-brew-is-a-daily-business-briefing-built-for-millennials
- 뉴닉 — https://byline.network/2019/08/11-72 , https://www.fnnews.com/news/202404211509066996 , https://imweb.me/interview?idx=17
- Particle — https://techcrunch.com/2024/02/29/former-twitter-engineers-are-building-particle-an-ai-powered-news-reader/ , https://apps.apple.com/app/id6683283775 , https://elevenlabs.io/blog/particle , https://techcrunch.com/2026/02/23/particles-ai-news-app-listens-to-podcasts-for-interesting-clips-so-you-you-dont-have-to/
- Artifact — https://uxbreakdowns.substack.com/p/7-the-ux-of-artifact (2023-03), https://techcrunch.com/2023/06/02/artifact-news-app-now-uses-ai-to-rewrite-headline-of-a-clickbait-article
- Perplexity Discover — https://www.firstaimovers.com/p/perplexity-discover-feed
- Apple News 퍼즐 스트릭 — https://support.apple.com/guide/news/iph0f3793804/mac
- Readwise Reader 트리아지 — https://docs.readwise.io/reader/guides/workflows/library-configuration , https://blog.beeminder.com/readwise
- Pocket 종료 — https://engadget.com/apps/mozilla-is-shutting-down-its-read-it-later-app-pocket-183247576.html (2025-05)
- Duolingo 스트릭 — https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks , https://experiments.lazyweb.com/research/duolingo-streak-goals-retention
- Wordle 공유 — https://stories.uq.edu.au/contact-magazine/2022/word-on-wordle/index.html
- NN/g Mobile Carousels — https://www.nngroup.com/articles/mobile-carousels/ (2018-08). 캐러셀 클릭 집중 2차 인용 — https://silktide.com/blog/stop-using-carousels-on-websites/ , https://www.oshyn.com/blog/web-carousels
- Instagram 캐러셀 관행(벤더 블로그, 참고용) — https://meetedgar.com/blog/instagram-carousel-tips
- Stratechery 4.0 — https://stratechery.com/2018/stratechery-4-0/
- Pretendard — https://www.sandollcloud.com/free-font/16951/Pretendard
- Clearbit Logo API 종료 — https://developers.hubspot.com/changelog/upcoming-sunset-of-clearbits-free-logo-api , https://www.logo.dev/clearbit
- Web Share API — https://developer.mozilla.org/docs/Web/API/Web_Share_API , https://web.dev/web-share
- 리더 Chrome 관찰 — `_workspace/01_lead_chrome-notes.md` (2026-10-22; Product Hunt, THE VC, 뉴닉, Sifted, 혁신의숲 화면)
- 내부 검증 — `startups.json` 샘플 media_mentions URL curl 결과(2026-10-22)
