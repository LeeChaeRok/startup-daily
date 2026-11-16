# v2 UX 패턴 카탈로그 — 제품 벤치마커 (2026-11-14)

입력: `00_lead_audit.md`, `00_current/` 캡처 13장, `src/data/days/2026-11-14.json`·`contests.json`·`updates.json`·`korea-lens.json` 스키마.
근거 표기: 이번 조사에서는 브라우저로 경쟁 앱을 직접 조작하지 않았다(대부분 앱 전용·로그인 벽). 공식 문서·변경 기록·리뷰 글을 근거로 하고 URL을 달았다. URL이 없는 관찰(Apple News, Instagram, Things, 토스 앱 화면 등)은 널리 알려진 현행 화면에 대한 일반 지식이며, 설계 단계에서 실제 앱으로 한 번 더 확인해야 한다.

---

## 0. 진단 — 불편함의 뿌리 세 가지

| 뿌리 | 캡처 증거 | 고칠 방향 |
|---|---|---|
| **문법이 여러 개다** | 히어로만 배경 상자, 나머지는 2px 검은 선(m-02). 세그먼트는 각진 상자(m-05·m-08), 칩은 테두리 상자, 상세 칩은 검은 채움(m-04) | 컴포넌트 문법을 **카드 1종 + 행 1종 + 칩 1종 + 시트 1종**으로 줄인다 |
| **모든 걸 한 화면에서 말한다** | 최신 호 한 화면에 개념 12개, 상세 하단 바 버튼 5개, 탐색 첫 결과가 화면 절반 아래(m-05) | 화면마다 "주인공 하나"를 정하고 나머지는 접거나 다른 탭으로 보낸다(점진적 공개) |
| **숙제처럼 읽힌다** | "0/5" 카운터, 손으로 누르는 "읽음", 첫 방문 역할 질문 시트(m-01) | 진행은 저절로 쌓이게, 질문은 가치를 본 다음에 |

---

## 1. 패턴 카드

### A. 일간 진입 화면 ("오늘" 포장)

#### P1. 날짜 언어 + 한 줄 약속
- 관찰 서비스: Apple News "Today", 뉴닉(오늘의 뉴닉), 롱블랙(하루 한 편)
- 무엇을: 화면 맨 위가 큰 날짜("11월 14일 금요일")와 "오늘 읽을 것"의 한 줄 약속. 발행 번호는 없거나 아주 작다. 롱블랙은 "하루 한 편, 그날 지나면 닫힘"이라는 약속 하나로 정체성을 만든다([기자협회보](https://www.journalist.or.kr/m/m_article.html?no=54421)).
- 왜 효과적인가: 독자는 "몇 호"가 아니라 "오늘 것"을 찾는다. 시간 단서가 습관(아침 루틴)에 붙는다.
- Startup Daily 적용안: 헤더 = `date`(요일 포함) + "오늘의 스타트업 5곳 · 약 6분". 읽는 시간은 `product.summary`·`trending_reason.summary` 글자 수로 계산. "제37호"(`meta.issue_count`)는 지난 호 목록에서만 보조로 쓴다.
- 난이도: S

#### P2. 오늘의 다섯 = 균질한 카드 스택 (히어로 1 + 행 4 폐기)
- 관찰 서비스: Product Hunt 일간 리더보드(순위가 매겨진 균질한 행, "See all"로 확장 — [PH 변경 기록](https://www.producthunt.com/p/producthunt/changelog-december-11-leaderboard-redesign-mobile-mentions)), Particle의 스토리 카드(제목 + 요약 불릿 — [Twipe](https://twipemobile.com/particle-a-user-focused-ai-news-experience))
- 무엇을: 같은 무게의 카드 5장이 세로로 쌓인다. 각 카드는 로고·이름·한 줄 설명·"왜 지금" 한 문장·숫자 1개. 번호(1~5)로 순서감을 준다.
- 왜 효과적인가: 형식이 하나면 눈이 패턴을 학습해 훑는 속도가 빨라진다. 지금은 1번만 상자이고 2~5번은 행이라 "1번만 중요한가?"라는 오독이 생긴다.
- 적용안: `logo_url`·`name_ko`·`tagline`·`trending_reason.summary`(첫 문장 60자 컷)·`funding.latest_round.{stage,amount}`·`sector` 색 점. `featured=true` 5곳만. 가로 캐러셀이 아닌 세로 스택.
- 난이도: M

#### P3. "다 읽었어요" 완료 상태 (인박스 제로)
- 관찰 서비스: Things(오늘 목록을 다 끝내면 빈 화면 + 조용한 축하), Readwise Reader의 트리아지(인박스를 비우는 게임 같은 정리 — [Readwise 공식](https://readwise.io/read)), 롱블랙 출석 스탬프([기자협회보](https://www.journalist.or.kr/m/m_article.html?no=54421))
- 무엇을: 5곳을 모두 열면 카드 스택 아래가 "오늘 다섯 곳 끝 · 내일 아침 8시에 새로 와요"로 바뀌고, 그 아래에 YC·공모전 같은 "더 볼 것"이 나타난다.
- 왜 효과적인가: 끝이 있는 콘텐츠가 무한 피드보다 만족감이 크다. "0/5"는 빚, "끝"은 보상이다.
- 적용안: 기존 읽음 기록(`lib/seen.js`)을 그대로 쓰고 **상세 진입 = 읽음**으로 자동 처리. 진행 표시는 카드 번호 옆 체크로만. 숫자 카운터 제거.
- 난이도: S

#### P4. 약한 스트릭 (손실 공포 대신 기록)
- 관찰 서비스: Duolingo 스트릭 — 손실 회피가 핵심이고, "스트릭 프리즈"로 한 번 끊겨도 포기하지 않게 한다([Lenny's Podcast 요약](https://rosetta.to/u/lennyspodcast/behind-the-product-duolingo-streaks-jackson-shuttleworth-group-pm-retention-team), [분석 글](https://japm.substack.com/p/the-psychology-behind-duolingos-most))
- 무엇을: 연속 일수 + 끊김 보호.
- 왜 효과적인가: 첫 7일의 습관 형성에 강하다. 다만 매체에서 강한 압박은 "결제할 품질"과 반대로 싸구려 게임처럼 보인다.
- 적용안: 보관함 상단에 "이번 주 4일 읽음" 7칸 점(월~일)만. 숫자 불꽃·경고 푸시는 하지 않는다. 데이터는 읽음 기록의 날짜.
- 난이도: S

---

### B. 회사 상세 (가장 오래 머무는 화면)

#### P5. 30초 요약 블록 → 깊이 (점진적 공개)
- 관찰 서비스: Arc Search "Browse for Me"(맨 위 짧은 답 → 상위 요약 → 자세한 섹션 → 더 깊이 — [Freethink](https://www.freethink.com/consumer-tech/arc-search-app), [TechCrunch](https://techcrunch.com/2024/01/28/arcs-new-iphone-browser-wants-to-be-your-search-companion)), Particle 상단 불릿 요약, NN/g 점진적 공개([NN/g](https://www.nngroup.com/videos/progressive-disclosure/))
- 무엇을: 첫 화면(스크롤 전)에 결론을 다 준다. 그 아래는 읽고 싶은 사람만.
- 왜 효과적인가: 대부분은 30초만 읽고 나간다. 그 30초가 완결되면 만족, 길이는 "더 원하는 사람의 선택"이 된다.
- 적용안: 상세 첫 화면 = ① 로고·`name_ko`·`name_en`·`website` ② `tagline` ③ **팩트 4칸**(`funding.total_raised` / `funding.latest_round.stage·amount·date` / `founded_year` / `headquarters.country_ko`) ④ **"왜 지금" 3줄**(`trending_reason.summary`) ⑤ 역할 한 줄(ForRoleLine, 역할을 골랐을 때만). 그 아래 섹션은 제목 + 첫 2줄 미리보기, 탭하면 펼침: 제품(`product.*`), 경쟁(`competitive_landscape.*`), 팀(`founders[]`·`team_highlights`), 투자(`funding.funding_history[]`), 시장(`market_outlook.*`), 한국에서는(`korea-lens.verdict·headline·similar`), 출처(`related_links[]`·`trending_reason.media_mentions[]`).
- 난이도: M

#### P6. 스크롤에 따라 바뀌는 한 줄 헤더 (가로 넘치는 칩 대신)
- 관찰 서비스: Stratechery·Every 같은 장문 매체의 얇은 상단 바(제목 + 진행), iOS 큰 제목이 스크롤 시 작은 제목으로 접히는 동작
- 무엇을: 스크롤하면 헤더가 "월리 헬스 · 팀" 처럼 현재 섹션 이름으로 바뀐다. 섹션 이동은 헤더를 탭하면 뜨는 목차 시트에서.
- 왜 효과적인가: 375px에 칩 8개(m-04)는 절반이 잘린다. 한 줄 텍스트는 잘리지 않고, 목차는 필요할 때만 나온다.
- 적용안: 섹션 ID는 지금의 앵커를 그대로. IntersectionObserver로 현재 섹션 표시. 얇은 2px 진행선은 헤더 아래에.
- 난이도: S

#### P7. 하단 행동은 2개만
- 관찰 서비스: Apple News·Medium 리더 하단(공유·저장 정도), 토스 화면 하단 단일 주요 버튼
- 무엇을: 왼쪽 저장 아이콘, 오른쪽 "다음 회사 →" 주요 버튼. 글자 크기·공유는 헤더 "···" 안으로.
- 왜 효과적인가: 버튼 5개(m-03)는 모두 같은 무게라 아무것도 강조되지 않는다. "다음"이 다섯 곳 흐름의 주인공이다.
- 적용안: "읽음" 버튼 삭제(P3 자동 처리). "다음"은 같은 날 `featured` 순서로, 마지막 회사에서는 "오늘 끝 · YC 보기"로 바뀐다.
- 난이도: S

#### P8. 장문 읽기 타이포 (본문 폭·리듬 고정)
- 관찰 서비스: Stratechery·Every 본문, Linear의 2026 개편(내비 요소를 낮추고 본문이 앞서게, 테두리 완화 — [Linear 블로그](https://linear.app/now/behind-the-latest-design-refresh), [변경 기록](https://linear.app/changelog/2026-03-12-ui-refresh))
- 무엇을: 본문 17px/1.7, 문단 간격 일정, 소제목만 굵게, 구분은 선이 아니라 여백.
- 왜 효과적인가: "정성 들인 매체"의 인상은 색이 아니라 여백과 리듬에서 온다. 2px 검은 선을 걷어내는 것만으로 무게가 절반이 된다.
- 적용안: `product.key_features[]`는 불릿, `competitive_landscape.direct_competitors[]`는 "이름 + 한 줄 비교" 행 리스트, `market_outlook.risks[]`는 불릿. 숫자는 고정폭 대신 tabular-nums.
- 난이도: S

#### P9. 기업 DB식 "지표 카드" 묶음
- 관찰 서비스: 혁신의숲(매출·투자·고용·특허가 한 페이지, 성장 지표를 한 차트에 겹쳐 보여줌 — [혁신의숲 가이드](https://www.innoforest.co.kr/report/450/%EC%9D%BC%EB%B0%98-%EA%B0%80%EC%9D%B4%EB%93%9C-%EC%A2%85%ED%95%A9%EC%84%B1%EC%9E%A5%EB%B6%84%EC%84%9D-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%9D%B4%ED%95%B4-%EB%B0%8F-%ED%99%9C%EC%9A%A9%ED%95%98%EA%B8%B0)), Crunchbase·THE VC 프로필 상단 요약 수치
- 무엇을: 라운드 이력이 세로 타임라인(날짜·단계·금액·리드).
- 왜 효과적인가: 투자 관심층은 숫자 → 이력 순서로 읽는다. 표보다 타임라인이 모바일에서 읽힌다.
- 적용안: `funding.funding_history[]` + `latest_round`를 날짜 순 타임라인. `valuation_estimate`의 "(추정)"은 회색 꼬리표. 시계열 차트는 데이터가 없으므로 **하지 않는다**.
- 난이도: S

---

### C. 내비게이션

#### P10. 하단 탭 4개, 저장·설정은 한 집에
- 관찰 서비스: Apple HIG(iOS 탭은 3~5개, 탭이 늘수록 복잡 — [HIG Tab bars](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars)), Material(3~5개 동급 목적지 — [Material](https://m1.material.io/components/bottom-navigation.html)), Apple News(Today · News+ · Audio · Following)
- 무엇을: 탭은 동급 목적지만. 개인 것(저장·설정·알림)은 한 탭에 모은다.
- 왜 효과적인가: 지금은 하단 4개 + 상단 저장 + 상단 ⋮로 진입점이 6곳이다(m-02). YC는 "콘텐츠 종류"이지 목적지가 아니다.
- 적용안: **오늘 · 탐색 · 공모전 · 보관함**. YC는 "오늘" 안 섹션(다섯 곳 뒤) + 탐색의 필터(`yc` 필드). 보관함 = 저장한 회사·공모전 + 읽은 기록 + 주간 점(P4) + 설정(역할·분야 숨기기·알림·언어·다크). 상단 바는 로고와 검색 아이콘만.
- 난이도: M

---

### D. 탐색·필터·검색 (모바일)

#### P11. 검색창 하나 + 필터는 시트, 결과 수가 버튼에
- 관찰 서비스: Airbnb(폰에서는 필터를 아이콘 뒤로 숨기고 "더 보기" 시트 — [가이드](https://thetoolstrunk.com/airbnb-filters-not-showing/), [Baymard 사례](https://baymard.com/ecommerce-design-examples/33-search-results-page/19314-airbnb)), 당근 검색(상단 검색 + 가로 필터 칩 한 줄), 토스증권 발견 탭(주제별 묶음 카드)
- 무엇을: 상단은 검색창 1줄 + 칩 1줄(가로 스크롤). 칩 맨 앞 "필터" 칩이 시트를 열고, 시트 하단 버튼이 "252곳 보기"처럼 결과 수를 실시간으로 보여준다.
- 왜 효과적인가: 첫 결과가 스크롤 없이 보인다. 결과 수 버튼은 "이 필터가 너무 좁은가"를 미리 알려 빈 결과를 막는다.
- 적용안: 칩 = 분야(`sector`) 중 상위 몇 개 + 단계(`company_stage`) + "YC"(`yc`). 시트 = 분야·단계·지역(`headquarters.country_ko`)·투자 규모(`funding.total_raised_usd` 구간). "회사/지난 호" 세그먼트는 없애고, 지난 호는 오늘 탭 하단 "지난 날짜" 링크로.
- 난이도: M

#### P12. 검색 전 화면 = 묶음 카드
- 관찰 서비스: 토스증권 발견, 당근 검색 진입(최근 검색·인기 검색)
- 무엇을: 검색어를 넣기 전에는 "분야별 모아 보기" 카드 그리드와 최근 검색어.
- 왜 효과적인가: 빈 검색창은 할 일을 모르게 만든다. 묶음이 곧 둘러보기다.
- 적용안: `sector`별 개수 + 대표 로고 3개 겹침. `lib/sectors.js` 그대로.
- 난이도: S

---

### E. 목록 행 밀도

#### P13. 행 하나 = 2줄 고정
- 관찰 서비스: Product Hunt 행(로고 + 이름 + 한 줄), Linear 목록(한 줄에 필요한 것만, 메타는 오른쪽 정렬), 링커리어 목록
- 무엇을: 1줄 = 이름 + 오른쪽 숫자, 2줄 = 한 줄 설명(1줄 말줄임). 메타(분야·국가·날짜)는 상세로.
- 왜 효과적인가: 지금 탐색 행은 4~5줄(m-05)이라 한 화면에 3곳뿐. 2줄 행이면 6~7곳이 보이고 비교가 쉽다.
- 적용안: `logo_url`(없으면 `sector` 색의 통일된 이니셜 원) · `name_ko` · `tagline` · 오른쪽 `funding.total_raised`. 읽음은 이름 옆 작은 점, "읽음" 칩 제거.
- 난이도: S

---

### F. 온보딩

#### P14. 가치 먼저, 질문은 맥락에서
- 관찰 서비스: Duolingo(먼저 레슨을 해보게 하고 계정은 나중에), 일반 가이드(가치 전 가입 벽이 가장 비싼 화면 — [techinterview 정리](https://www.techinterview.org/post/3233475134/design-mobile-app-onboarding/), [Mind the Product](https://www.mindtheproduct.com/lessons-from-onboard-mobile-app-users/))
- 무엇을: 첫 화면은 바로 오늘의 다섯. 질문은 사용자가 뭔가를 한 직후에 인라인 카드로.
- 왜 효과적인가: 무엇인지 모르는 상태의 질문(m-01)은 이탈 또는 "건너뛰기"를 부른다.
- 적용안: 첫 상세를 닫고 돌아오면 오늘 탭에 한 번만 "어떤 입장에서 읽으세요? 창업자 · 투자자 · PM · 취업" 인라인 카드(닫기 가능). 알림 권한은 P3 완료 상태에서 "내일 아침에 알려드릴까요?"로. 언어 토글은 보관함 설정으로.
- 난이도: S

---

### G. 저장·보관함

#### P15. 저장은 1탭 + 되돌리기 토스트, 보관함은 목적별
- 관찰 서비스: Instagram 저장(탭하면 아이콘 채움 + 하단 "컬렉션에 저장" 안내), Readwise Reader(Later / Archive 구분)
- 무엇을: 저장 즉시 아이콘 채움 + 짧은 진동감 애니메이션 + "저장함 · 되돌리기" 토스트.
- 왜 효과적인가: 확인 단계 없이 되돌릴 수 있으면 부담 없이 누른다.
- 적용안: 보관함 상단 세그먼트 "회사 · 공모전"(둥근 세그먼트 1종). 공모전은 마감 순, 마감 지난 것은 아래 접힘(m-08 구조는 유지). "이 기기에만 저장돼요"는 설정 안 설명으로 이동.
- 난이도: S

---

### H. 공모전·마감 목록

#### P16. 날짜 그룹 헤더 + D-day 칩 + 필터 시트
- 관찰 서비스: Luma(날짜 헤더 아래 행사 묶음, 캘린더 추가 — [Luma 앱](https://apps.apple.com/us/app/id1546150895)), 링커리어·캠퍼스픽 목록(D-day 강조)
- 무엇을: "오늘 마감 · 이번 주 · 다음 주 · 그 이후" 날짜 헤더가 스크롤 시 상단에 붙는다. 행 왼쪽 D-day 칩, 행에는 날짜를 반복하지 않는다.
- 왜 효과적인가: 날짜를 행마다 반복하면(m-06 "오늘 11.14"가 계속) 소음이 된다. 헤더 하나로 묶으면 리듬이 생긴다.
- 적용안: `deadline`으로 그룹, `title`·`host`·`prize_top`/`prize_kind`·`topic` 2줄 행. 데스크톱 필터 벽(d-02)은 모바일과 같은 칩 1줄 + 시트로 통일(`who`·`topic`·`prize_band`). 상세는 오른쪽 패널 유지, `sites[]`는 "원문 보기" 버튼 하나 + 다른 사이트 링크 접힘.
- 난이도: M

---

### I. 데스크톱 레이아웃

#### P17. 2단: 목록 레일 + 읽기 기둥
- 관찰 서비스: Readwise Reader 웹(왼쪽 목록, 가운데 본문), Linear(사이드바를 낮추고 본문 우선 — [Linear](https://linear.app/now/behind-the-latest-design-refresh)), Apple Mail 3단을 2단으로 접는 iPad 레이아웃
- 무엇을: 왼쪽 320px 목록, 오른쪽 본문 680px 고정 폭. 팩트·목차는 본문 첫 블록(P5)에 포함, 오른쪽 3번째 단 없음.
- 왜 효과적인가: 3단(d-01)은 같은 정보(팩트)를 두 번 보여주고 버튼이 4곳에 흩어진다. 모바일과 같은 구조를 넓게 펼친 것이어야 "통일감"이 생긴다.
- 적용안: 오늘·탐색·공모전·보관함 모두 "목록 + 상세" 같은 틀. 상단 가로 내비 4개 = 모바일 탭 4개와 동일.
- 난이도: M

---

### J. 다크 모드

#### P18. 순흑 대신 따뜻한 짙은 회색, 표면 단계 3개
- 관찰 서비스: Linear(따뜻함을 조절해 탁해지지 않게 — [Linear](https://linear.app/now/behind-the-latest-design-refresh)), 토스 다크(배경 < 카드 < 시트로 밝기가 한 단계씩 오름)
- 무엇을: 배경·카드·시트 3단 표면, 선 대신 표면 밝기 차로 구분, 강조색은 채도 낮춘 버전.
- 왜 효과적인가: 다크에서 선을 그대로 쓰면 격자처럼 번쩍인다. 표면 단계가 고급스러움을 만든다.
- 적용안: 토큰만 두 벌(`tokens.css`). `sector` 색 점은 다크에서 밝기 보정. 로고 이미지에 1px 반투명 테두리(흰 배경 로고 대비).
- 난이도: S

---

### K. 신뢰·AI 고지

#### P19. 출처는 각주처럼, 확인 시각은 조용히
- 관찰 서비스: Particle(요약 아래 원문 매체 목록), Perplexity류 번호 각주, 혁신의숲 "데이터 제보/오류 신고"([혁신의숲 도움말](https://docs.channel.io/innoforest/ko))
- 무엇을: 문장 끝 작은 번호 → 탭하면 출처 시트(매체·날짜·링크). 상세 맨 아래 "AI가 공개 자료로 정리 · 11월 14일 확인 · 오류 알리기".
- 왜 효과적인가: 고지를 화면마다 큰 상자로 반복하면(d-05) 불안을 키운다. 근거에 바로 닿을 수 있으면 신뢰가 오른다.
- 적용안: `trending_reason.media_mentions[].{source,date,url,verified}`, `related_links[].verified`·`checked_at`, `website_check.verified`, `generated_at`. `verified=true`만 체크 표시. "오류 알리기"는 기존 정정 기록 페이지로. 오늘 탭에는 하단 한 줄만.
- 난이도: M

---

### L. 마이크로 인터랙션·모션

#### P20. 모션 토큰 4개로 전체를 통일
- 관찰 서비스: 토스(단순함 원칙, Lottie 그래픽 — [토스피드](https://toss.im/tossfeed/article/importance-simplicity), [LottieFiles 사례](https://lottiefiles.com/kr/case-studies/toss)), Things(체크 시 짧은 튕김), Linear(즉각 반응, 화면 전환 짧음)
- 무엇을: ① 누름: 0.97 축소 100ms ② 시트: 스프링으로 올라옴 ③ 저장·완료: 아이콘 채움 + 살짝 튕김 ④ 로딩: 실제 레이아웃 모양의 스켈레톤. 지속시간 3단계(120/200/320ms)와 이징 1종만.
- 왜 효과적인가: 프리미엄 느낌은 화려함이 아니라 "모든 게 같은 물리로 움직임"에서 온다. 지금은 반응이 없거나 제각각이다.
- 적용안: CSS 변수 `--dur-1/2/3`, `--ease`. `prefers-reduced-motion`이면 페이드만. 카드→상세는 로고·이름이 이어지는 View Transitions(지원 브라우저만).
- 난이도: M

---

### M. 공유·후속 소식

#### P21. 공유는 "한 장 카드"로
- 관찰 서비스: Instagram 스토리 공유 카드, Product Hunt 공유 미리보기
- 무엇을: 공유 링크 미리보기 = 로고·이름·한 줄·핵심 숫자 1개 + 브랜드.
- 적용안: 기존 `/s/:id` 미리보기 페이지 유지, OG 이미지 레이아웃만 카드 문법(P2)과 맞춘다. `tagline`·`funding.total_raised`.
- 난이도: S

#### P22. "그때 그 회사"는 저장한 회사의 소식으로
- 관찰 서비스: Crunchbase·THE VC 관심 기업 알림, Apple News Following
- 무엇을: 내가 저장·읽은 회사에 새 소식이 있으면 보관함 탭에 점, 상세 맨 위에 "새 소식" 띠.
- 적용안: `updates.json`의 `kind`·`title_ko`·`date`·`source_url`. 오늘 탭에서는 소식이 있을 때만 다섯 곳 아래 1줄로.
- 난이도: S

---

## 2. 안티패턴 — 우리 캡처에 대응

| # | 안티패턴 | 캡처 | 왜 나쁜가 | 대체 패턴 |
|---|---|---|---|---|
| 1 | 가치 전에 막는 질문 시트 | m-01 | 무엇인지 모른 채 고르라고 함 | P14 |
| 2 | 숙제형 카운터 "0/5", 손으로 누르는 "읽음" | m-02, m-03 | 진행이 빚처럼 보임 | P3 |
| 3 | 히어로만 다른 문법(상자 vs 선) | m-02 | 1번만 중요해 보이고 통일감 깨짐 | P2 |
| 4 | 두꺼운 검은 선으로 구획 | m-02·m-06·d-03 | 무겁고 "문서" 느낌 | P8, P18 |
| 5 | 가로로 잘리는 칩 줄 | m-04, m-05 | 절반이 안 보이고 스크롤 가능함을 모름 | P6, P11 |
| 6 | 하단 바 동급 버튼 5개 | m-03 | 주요 행동이 묻힘 | P7 |
| 7 | 같은 정보 두 번(팩트 칸 + 오른쪽 핵심 팩트) | d-01 | 시선 분산 | P5, P17 |
| 8 | 진입점 6곳(탭 4 + 저장 + ⋮), 탭과 섹션 중복(YC) | m-02, m-07 | 어디서 뭘 하는지 모름 | P10 |
| 9 | 4~5줄짜리 목록 행, "읽음" 칩 | m-05 | 한 화면 3곳, 비교 불가 | P13 |
| 10 | 필터 칩 세 줄 벽 | d-02 | 목록보다 필터가 주인공 | P11, P16 |
| 11 | 행마다 반복되는 날짜 | m-06 | 소음 | P16 |
| 12 | 데스크톱 표(13열 느낌) | d-03 | 모바일과 다른 제품처럼 보임 | P13, P17 |
| 13 | 제각각 색의 이니셜 상자 | m-02, m-05 | 무작위로 보임 | P13(분야 색 통일) |
| 14 | 고지·데이터 범위·푸터 상자 반복 | d-05 | 신뢰보다 불안 | P19 |
| 15 | 각진 세그먼트·칩 | m-05, m-08 | 투박함 | 컴포넌트 1종(둥근 세그먼트·칩) |

추가로 피할 것: 가로 캐러셀에 긴 텍스트 몰아넣기(다섯 곳을 스와이프 카드로 만드는 안), 이모지 아이콘, 불꽃 스트릭과 경고 푸시, 근거 없는 시계열 차트.

---

## 3. v2 패턴 묶음 추천

| 영역 | 고를 패턴 | 이유 |
|---|---|---|
| 내비 | **탭 4개: 오늘 · 탐색 · 공모전 · 보관함**(P10), 상단은 로고 + 검색 | 진입점 6→5, YC 중복 제거, 설정이 한 집에 |
| 오늘 | **Apple News Today식 날짜 헤더 + Product Hunt식 균질 카드 5장 + Things식 완료 상태**(P1·P2·P3) | "끝이 있는 하루"가 이 제품의 정체성. 아래로 YC 5곳 → 공모전 마감 3건 → 지난 날짜 순 |
| 상세 | **Arc Search식 30초 요약 → 펼침 섹션**(P5) + 접히는 헤더(P6) + 하단 2버튼(P7) + Linear식 본문(P8) | 가장 오래 머무는 화면의 길이 문제를 "선택"으로 바꿈 |
| 목록 | **2줄 행 1종**(P13)을 오늘·탐색·YC·보관함·공모전 공통으로 | 통일감의 가장 빠른 지름길 |
| 탐색 | **검색 1줄 + 칩 1줄 + 필터 시트(결과 수 버튼)**(P11·P12) | 첫 결과가 첫 화면에 |
| 공모전 | **Luma식 날짜 그룹 헤더 + D-day 칩**(P16), 데스크톱도 같은 필터 시트 | 지금 괜찮은 모바일 목록을 기준으로 데스크톱을 맞춤 |
| 온보딩 | **질문 없음 → 첫 상세 후 인라인 역할 카드 → 완료 후 알림 제안**(P14) | 가치 먼저 |
| 데스크톱 | **2단(목록 320 + 본문 680)**(P17) | 모바일과 같은 구조라 한 제품처럼 보임 |
| 시각·모션 | **카드·행·칩·시트 4종 + 표면 3단 + 모션 토큰 4개**(P18·P20) | "어색하고 통일되지 않는다"의 직접 해법 |
| 신뢰 | **각주형 출처 + 하단 한 줄 고지**(P19) | 조용하지만 근거에 바로 닿음 |

우선순위(효과 대비 난이도): P14·P3·P7·P13 (S, 첫인상과 매일 쓰는 화면) → P10·P2·P5 (M, 구조) → P11·P16·P17 → P20·P19.

---

## 4. Startup Daily가 할 것 / 하지 말 것

**할 것**
- 화면마다 주인공 하나. 오늘=다섯 곳, 상세=30초 요약, 탐색=결과.
- 컴포넌트 4종(카드·행·칩·시트)으로 모든 화면을 다시 조립.
- 진행은 저절로(상세 진입=읽음), 질문은 가치 다음에.
- 출처·확인 시각은 데이터(`verified`, `checked_at`)로 정직하게.

**하지 말 것**
- 데이터에 없는 기능(성장 차트, 매출 추이, 커뮤니티 댓글) 제안.
- 다섯 곳을 가로 스와이프 카드로 바꾸기, 불꽃 스트릭, 이모지.
- 데스크톱만 다른 구조(3단, 표) 유지.
- AI 고지를 화면마다 큰 상자로 반복.

---

## 5. 출처

- Twipe, Particle UX: https://twipemobile.com/particle-a-user-focused-ai-news-experience
- TechCrunch, Particle 출시(2024-11): https://techcrunch.com/2024/11/12/particle-launches-an-ai-news-app-to-help-publishers-instead-of-just-stealing-their-work
- Product Hunt 리더보드 개편 변경 기록: https://www.producthunt.com/p/producthunt/changelog-december-11-leaderboard-redesign-mobile-mentions
- Freethink, Arc Search: https://www.freethink.com/consumer-tech/arc-search-app
- TechCrunch, Arc Search(2024-01): https://techcrunch.com/2024/01/28/arcs-new-iphone-browser-wants-to-be-your-search-companion
- NN/g, Progressive Disclosure: https://www.nngroup.com/videos/progressive-disclosure/
- Apple HIG Tab bars: https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars
- Material Bottom navigation: https://m1.material.io/components/bottom-navigation.html
- Duolingo 스트릭(Lenny's Podcast 요약): https://rosetta.to/u/lennyspodcast/behind-the-product-duolingo-streaks-jackson-shuttleworth-group-pm-retention-team
- Duolingo 스트릭 심리 분석: https://japm.substack.com/p/the-psychology-behind-duolingos-most
- Readwise Reader: https://readwise.io/read
- 롱블랙 24시간 열람(기자협회보): https://www.journalist.or.kr/m/m_article.html?no=54421
- 혁신의숲 종합성장분석 가이드: https://www.innoforest.co.kr/report/450/
- 혁신의숲 도움말(오류 신고): https://docs.channel.io/innoforest/ko
- Linear 디자인 개편(2026-03): https://linear.app/now/behind-the-latest-design-refresh , https://linear.app/changelog/2026-03-12-ui-refresh
- Airbnb 필터(폰): https://thetoolstrunk.com/airbnb-filters-not-showing/ , Baymard: https://baymard.com/ecommerce-design-examples/33-search-results-page/19314-airbnb
- Luma 앱: https://apps.apple.com/us/app/id1546150895
- 토스 단순함: https://toss.im/tossfeed/article/importance-simplicity , LottieFiles 토스 사례: https://lottiefiles.com/kr/case-studies/toss
- 온보딩(가치 먼저): https://www.techinterview.org/post/3233475134/design-mobile-app-onboarding/ , https://www.mindtheproduct.com/lessons-from-onboard-mobile-app-users/
