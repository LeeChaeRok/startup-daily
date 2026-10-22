# 05. UI QA 리포트 (ui-qa-reviewer) — 2026-10-22

- 기준: `03_final_spec.md` → `02_ux-architect_ia.md`(S1–S7, §5 매핑, §8 접근성) → `02_visual-designer_system.md`
- 방법: 코드 경로 판독 + `src/data/startups.json` 실데이터 node 스크립트(스크래치패드) + 일부 항목은 백그라운드 브라우저 탭에서 JS로 수치 측정(표에 "실측"으로 표기). 소스는 수정하지 않음.
- 판정: **P0 0건 · P1 3건 · P2 24건**

## 1. 자동 검사

| 항목 | 결과 |
|---|---|
| `npm run build` | 통과. 경고: `index-*.js` 819.66 kB(gzip 249 kB). 500 kB 초과 경고. 원인은 `startups.json`(655 kB)이 번들에 들어가는 것 |
| `npm run lint` | **실패(exit 1), 오류 2건. 모두 `_workspace/backup_pre_redesign/` 안에서 발생** (`App.jsx:41` react-hooks/set-state-in-effect, `AccordionSection.jsx:2` no-unused-vars). `src/`는 오류 0건 |

lint 원문:
```
_workspace/backup_pre_redesign/src/App.jsx
  41:7  error  Calling setState synchronously within an effect ...  react-hooks/set-state-in-effect
_workspace/backup_pre_redesign/src/components/AccordionSection.jsx
  2:10  error  'motion' is defined but never used ...  no-unused-vars
✖ 2 problems (2 errors, 0 warnings)
```

## 2. 데이터 경계 (80건, 13호) — 확인 결과

- 필드 결측 없음: founders 0명 0건, funding_history 0건 0건, `investors` 키 0건(모두 `lead_investor`), related_links는 모두 `{title,url}`. 중복 id 없음, 날짜 형식 모두 `YYYY-MM-DD`.
- `funding.total_raised` "M+" 2건(insilico-medicine, bionaut-labs) → `cleanAmount`에서 "미공개"로 처리됨. 정상.
- `valuation_estimate`에 숫자 없는 값 3건("B+ (유니콘)", "Public — 시가총액 변동", "M+") → "미공개". 크래시 없음.
- `funding_history[].date`에 연도만 있는 값 9종("2020" 등) → `ym()` 정상, 정렬도 깨지지 않음.
- stageLabel 정정 반영: 상장사 7(Lilium 포함) / M&A 1 / Growth 3. 단계 그룹: early 13 · b 21 · c 21 · late 16 · exit 9. S6 예외 집계는 상장사 6 · 인수 2 · 운영 중단 1로 IA §5-1 기대값과 일치.
- 지역: kr 15 · us 45 · eu 12 · asia 5 · etc 3(브라질, 케이맨 제도, 탄자니아). 분야 10개 모두 1곳 이상, '기타' 0곳.
- 검색 "Physical Intelligence" → skild-ai, covariant가 "경쟁사로 언급: …"으로 나옴. 정상.
- **신뢰 규칙**: `media_mentions[].url`, `related_links`, `founders[].linkedin`, `product.demo_or_screenshot_url`는 `src/` 어디에서도 href로 렌더링되지 않음(grep으로 확인). 외부 링크는 website, 정정 출처, Google 뉴스 검색 3종뿐. 모두 `target=_blank rel="noopener noreferrer"`와 sr-only "(새 창)"이 붙어 있음.
- AI 라벨: "AI 작성"(한 줄 코멘트·미리보기), "AI 추정"(기업가치·시장 규모), "추정"(레일 기업가치, 호 숫자 합), "AI 수집"(성장 지표) 모두 있음. AI 고지 3곳(홈 AiNote, 상세 출처 블록, 소개)도 있음.
- 정정 노출: 상세 배너(role=note) ✓, 상세 히어로 단계 대체 ✓, 모바일 행 배지 ✓, 저장함 배지 ✓, 탐색 표 배지 ✓, 단계 필터(wiz·lilium → exit) ✓, 소개 정정 기록 ✓. **데스크톱 왼쪽 목록에는 배지가 없음** → P1-03.

## 3. 결함

### P1

| ID | 심각도 | 화면 | 재현 | 기대 | 실제 | 위치(file:line) |
|---|---|---|---|---|---|---|
| P1-01 | P1 | 전체(QA 게이트) | `npm run lint` | exit 0 | `_workspace/backup_pre_redesign/**`까지 검사해서 오류 2건, exit 1. `src`는 깨끗함. `globalIgnores(['dist', '_workspace'])`로 고치면 됨 | eslint.config.js:8 |
| P1-02 | P1 | S3 (모바일, 공유 링크 진입) | 새 탭에서 `#/s/skild-ai-2026` 진입 → 하단 "다음"(→ `#/s/…` 2번째 회사) → 헤더 ← → 헤더 ← 다시 | 두 번째 ←는 앱 안에 머무름(호 `#/d/2026-04-27`로 이동, IA §4-3 `sd_nav_depth`) | `inAppNavs`는 뒤로 이동에서도 +1만 되고 줄지 않음. 두 번째 ←에서도 `history.back()`이 실행되어 사이트를 벗어남(카카오톡 인앱 브라우저에서는 빈 화면이나 창 닫힘) | src/App.jsx:44, :72, :81-85 |
| P1-03 | P1 | S1/S2/S3 데스크톱 ≥1024 왼쪽 목록 | 1280px에서 `#/d/2026-04-18`(wiz) 또는 lilium·covariant·plenty가 실린 호 열기 | 목록 행에 "정정 · {status}" 배지(IA D6, P0 항목) | `compact` 행은 meta 블록을 통째로 숨기는데, `CorrectionBadge`가 그 블록 안에 있어서 함께 빠짐. 데스크톱 호 목록은 compact 행뿐이라 정정이 상세에 들어가야만 보임. 실측: `.split__list .badge` 0개 | src/components/StartupRow.jsx:41-53 |

### P2

| ID | 심각도 | 화면 | 재현 | 기대 | 실제 | 위치(file:line) |
|---|---|---|---|---|---|---|
| P2-01 | P2 | S1/S2/S4/S5 행 375px | 375px에서 `#/d/2026-04-16` | 태그라인 칼럼이 읽을 만한 폭 유지 | 누적 투자 칼럼이 `auto`라서 `minmax(0,1fr)`보다 먼저 max-content만큼 자리를 차지함. **실측**: 체인링크 랩스("$32M (ICO) + 토큰 트레저리") 본문 폭 58px·행 높이 232px, 프로코어 102px, 징코 118px. 같은 영향: akili, innospace, recursion, ponyai, propertyguru. 대응: `minmax(64px, 30%)` 같은 상한을 두거나 괄호 부분을 잘라냄 | src/styles/app.css:397, :416; src/components/StartupRow.jsx:20 |
| P2-02 | P2 | S3 섹션 칩 / S6 `?sec=` | 375px 상세에서 칩 "투자" 누름 | 섹션 머리가 칩 바(하단 100px) 바로 아래 | `html{scroll-padding-top: anchor-offset}`과 `.section{scroll-margin-top: anchor-offset}`이 더해짐. **실측**: 섹션 top 224px, 칩 바 하단 100px라서 124px가 빔. ≥1280에서도 64+48+12와 88이 더해짐. `.about-sec`도 같은 문제 | src/styles/app.css:13, :587, :590, :785 |
| P2-03 | P2 | 데스크톱 왼쪽 목록 | 1280px에서 `#/s/skild-ai-2026` | 선택 행 왼쪽 3px 액센트 바가 보임 | `.row__link`에 `margin-inline:-8px`이 있는데 `.split__list`가 `overflow-y:auto`이고 padding-left가 0이라 왼쪽 8px가 잘림. 액센트 바가 안 보임. **실측**: 링크 left 32px, 목록 left 40px | src/styles/app.css:317-324, :398, :422 |
| P2-04 | P2 | S1 데스크톱 ≥1280 오른쪽 레일 | 1280px에서 `#/` | 가로 스크롤 없음 | `.issue-row`의 `margin-inline:-8px` 때문에 레일에 가로 스크롤이 생김. **실측**: scrollWidth 248 > clientWidth 240 | src/styles/app.css:328-331, :454 |
| P2-05 | P2 | S4 데스크톱 필터 사이드바 | 1280×800에서 `#/explore` | 필터 전체에 닿을 수 있음 | `.explore__filters`가 sticky인데 max-height·overflow가 없음. **실측**: 높이 946px > 뷰포트 800px라서 지역 그룹 하단은 결과 표 끝까지 스크롤해야 보임 | src/styles/app.css:751 |
| P2-06 | P2 | S1/S3 데스크톱 1024–1279 | 1100px에서 `#/`, `#/s/:id` | IA: 레일이 없으면 "지난 호"가 본문 아래로 내려감, 푸터 있음 | split일 때 Footer는 IssueRail 안에만 있고(≥1280), IssueOverview에는 PastIssues·Footer·데이터 기간이 없음. 이 구간에서는 지난 호·정정 기록·투자 조언 아님 링크가 모두 사라짐 | src/App.jsx:189; src/screens/Issue.jsx:386-398 |
| P2-07 | P2 | 데스크톱 split 전체 | 1280px `#/` 또는 `#/s/:id` | 화면마다 H1 1개(IA §8) | 왼쪽 목록의 `IssueHeader compact`도 `<h1>`를 렌더함. DOM 순서상 첫 H1이 날짜. **실측**: h1 = ["4월 27일 월요일", "스킬드 AI"] | src/screens/Issue.jsx:48; src/App.jsx:111 |
| P2-08 | P2 | S3 모바일 | 375px 상세 | 저장·공유는 하단 액션 바 1곳(IA S3, 1024–1279만 히어로) | `!wide` 조건이라 모바일에서도 히어로에 저장·공유가 나오고 액션 바에도 있음(중복) | src/screens/Detail.jsx:181-188, :646-665 |
| P2-09 | P2 | S3 | 한국 투자사·경쟁사·보도가 있는 회사(예: 노타, 이노스페이스) | 한국어 텍스트는 lang=ko | `lang="en"`을 조건 없이 붙임. 실데이터: lead_investor 10/80, 투자 이력 22/246, notable 17/80, 경쟁사 14/223, 보도 매체 14/148, 보도 제목 16/148이 한글. 스크린리더가 영어 음성으로 읽음 | src/screens/Detail.jsx:245, :287, :340, :438, :611 |
| P2-10 | P2 | S3 ≥1280 | 1280px 상세 | id 유일 | Detail과 DetailRail이 각각 `useShare` 시트를 렌더해서 `id="sheet-title"`이 2개가 됨(**실측** 2개) | src/components/Sheet.jsx:35, :47; src/screens/Detail.jsx:666, :708 |
| P2-11 | P2 | 라우팅/스크롤 | 상세 A를 끝까지 스크롤 → B로 이동 → 데스크톱 ←/→ 키, 또는 토스트 "보기"로 A·저장함 재진입 | 새 이동은 맨 위 | `forwardNav`는 `<a href="#/">` 클릭 때만 켜짐. `navigate()`로 하는 앞 이동(키보드 ←/→, 토스트 "보기", 헤더 검색 제출)은 뒤로 이동처럼 다뤄져 예전 스크롤 위치로 복원됨 | src/App.jsx:53, :73; src/screens/Detail.jsx:547; src/components/bits.jsx:78; src/components/Chrome.jsx:72 |
| P2-12 | P2 | 라우팅/스크롤 | 홈에서 탭 바 "최신 호"(현재 해시와 같음)를 누른 뒤 다음 이동이 history.back(←)이면 | 스크롤 복원 | 같은 해시를 클릭하면 hashchange가 없어서 `forwardNav=true`가 남고, 다음 뒤로 이동이 맨 위로 감 | src/App.jsx:53, :70-74 |
| P2-13 | P2 | S4 검색 디바운스 | 검색어 입력 후 250ms 안에 데스크톱 필터 체크 | 둘 다 유지 | 디바운스 effect가 이전 렌더의 `update`(필터 적용 전 state)를 캡처해서 replace하므로 방금 고른 필터가 지워짐 | src/screens/Explore.jsx:230-235, :51-64 |
| P2-14 | P2 | S4 데스크톱 표 | 정렬 "이름순" | `aria-sort="ascending"` | 모든 정렬 열에 `descending`. 이름순은 오름차순 | src/screens/Explore.jsx:127 |
| P2-15 | P2 | S4 / S6 | 키보드로 회사/지난 호 탭, 테마 라디오 | tablist·radiogroup 패턴(화살표 키, roving tabindex, aria-controls) | role만 붙였고 키 처리와 tabpanel 연결이 없음 | src/screens/Explore.jsx:268-283; src/screens/About.jsx:136-148 |
| P2-16 | P2 | S5 | 저장함에서 행 북마크 해제 | IA S5: 행은 바로 사라지지 않음, 토스트로 되돌리기 | 행이 즉시 언마운트되어 키보드 포커스가 body로 사라짐(되돌리기 토스트는 있음). 분야별 그룹 헤더는 `aria-hidden`이라 스크린리더에는 그룹이 전달되지 않음 | src/screens/Saved.jsx:23-29, :110, :113 |
| P2-17 | P2 | S1/S2/S4 모바일 행 | 375px 호 목록·검색 결과 | IA S1/S4: 행 = 링크 + 북마크 버튼 | `IssueList`와 탐색 모바일 리스트가 `showSave`를 넘기지 않아서 저장 버튼이 없음(상세·저장함·데스크톱 표에서만 저장 가능) | src/screens/Issue.jsx:89; src/screens/Explore.jsx:347 |
| P2-18 | P2 | S7 | `#/d/2026-01-01`, `#/zzz` | H1 1개, 없는 날짜면 "가장 가까운 호" 링크(IA 라우트 표) | NotFound에 H1이 없어서(EmptyState는 h2) 라우트 포커스가 갈 곳이 없음. 없는 날짜일 때는 "‘2026 01 01’ 검색" 버튼이 나옴 | src/App.jsx:117-139; src/components/bits.jsx:108 |
| P2-19 | P2 | S3 진입 배너 | 첫 방문을 홈으로 시작 → 행 탭 | 공유 링크로 처음 들어온 사람에게만 배너(IA §4-3) | `sd_seen`이 없으면 앱 안에서 이동해 왔어도 첫 상세에 "이 글은 제n호에 실렸어요" 배너가 나옴 | src/screens/Detail.jsx:111-117 |
| P2-20 | P2 | S3 from=saved | 저장함에서 상세 진입 | 호 맥락과 저장함 순번을 섞지 않음 | 히어로에 "제13호 · 4월 27일 · 3곳 중 2번째"가 나오는데, 링크는 호를 가리키고 순번은 저장함 기준임. "다음"도 저장함 화면의 정렬·안 읽음 필터를 무시하고 원래 저장 순서를 따름 | src/screens/Detail.jsx:170-180; src/screens/detail-hooks.jsx:24 |
| P2-21 | P2 | S6 | 소개 → 선정 기준 예외 박스 | 기준 위반만 집계 | "Series D 이상 16곳"을 예외 줄에 함께 표시하지만, 이 회사들은 기준 위반이 아니고 "해당 회사 보기"(stage=exit)에도 들어가지 않음 | src/screens/About.jsx:62-65 |
| P2-22 | P2 | S6 견고성 | corrections.json `source`가 URL이 아닐 때 | 상세처럼 폴백 | `new URL()`을 try 없이 호출해서 소개 화면 전체가 크래시함(상세 배너는 try/catch 처리). 현재 데이터 4건은 모두 유효 | src/screens/About.jsx:98 |
| P2-23 | P2 | 라우터 견고성 | `#/s/%E0%A4` 같은 잘린 퍼센트 시퀀스 | S7 | path 부분 `decodeURIComponent`가 URIError를 던지고, 에러 바운더리가 없어 앱 전체가 빈 화면이 됨 | src/lib/hooks.js:15 |
| P2-24 | P2 | PWA/OG | 배포 후 공유, dev 서버 | og:image 절대 URL, SW 캐시 범위 제한 | `og:image="/og.png"`가 상대 경로라 Facebook 등은 절대 URL을 요구함(og:url 없음). `sw.js`는 dev(5173)에서도 등록되고, 교차 출처를 포함한 모든 GET(파비콘, 폰트, Vite 모듈)을 크기 제한 없이 캐시함. `cache.put` 실패를 처리하지 않음 | index.html:24, :45-51; public/sw.js:27-37 |

### 참고 (결함 아님 / 낮음)
- 수동 테마(라이트·다크)를 OS 설정과 다르게 저장해 두면, 첫 로드에서 `applyTheme`가 호출되지 않아 `theme-color` 메타가 OS 기준 색으로 남음(토글하면 맞춰짐). src/lib/hooks.js:151-159, index.html:17-18.
- 상세 액션 바 `role="toolbar"`에 화살표 키 처리가 없음. role을 빼는 편이 나음. src/screens/Detail.jsx:647.
- 저장 스토어에 `storage` 이벤트 구독이 없어 탭 사이 동기화가 안 됨. src/lib/hooks.js:94.
- `useActiveSection`은 변경된 entry만 보고 고르기 때문에, 아래 섹션이 띠에 들어오는 즉시 활성으로 바뀜(체감상 이른 전환). src/screens/detail-hooks.jsx:84-88.
- 수동 복사 시트에서 React `autoFocus`는 닫힌 dialog 안이라 효과가 없음. 시트를 열면 닫기 버튼에 포커스가 가고 URL은 미리 선택되지 않음. src/screens/detail-hooks.jsx:45.
- 미사용 의존성 `framer-motion`, `date-fns`, 빈 디렉터리 `src/hooks`, `src/utils`가 남아 있음.

## 4. 미검증
- 375/768/1280 전체 화면 시각 검토, 다크 모드 대비, 실제 기기 safe-area, Web Share 시트: 리드의 브라우저 점검 범위라 수행하지 않음. 위 "실측" 항목은 백그라운드 탭에서 JS로 수치만 측정함(375×812, 1280×800). 측정 후 뷰포트를 원복하고 탭을 닫음.
- Google s2 파비콘이 `naturalWidth ≥ 48` 기준을 실제로 통과하는지(네트워크 의존).

---

## 리더 조치 결과 (2026-10-22)

| ID | 결과 | 비고 |
|---|---|---|
| P1-01 | 수정 | eslint `globalIgnores`에 `_workspace` 추가. `npm run lint` 전체 통과 |
| P1-02 | 수정 | 스크롤·뒤로가기를 history.state 항목 키/깊이 기반으로 재작성(`src/lib/nav.js`). 공유 링크 진입 → 다음 → ← → ←가 사이트를 떠나지 않음 |
| P1-03 | 수정 | compact 행에도 정정 배지 표시(실측 1개) |
| P2-01 | 수정 | 금액 칼럼 max-width 112px + 괄호 이하 생략. 375px 본문 폭 58px → 173px |
| P2-02 | 수정 | html scroll-padding 제거 + 칩 바 중앙 정렬을 scrollIntoView → nav.scrollTo로 변경(진행 중 스무스 스크롤 취소 방지). 섹션 top 112 = 칩 바 하단 100 + 12 |
| P2-03, 04, 05 | 수정 | compact 행 음수 마진 제거, 레일 issue-row 마진 제거(240=240), 필터 사이드바 max-height+overflow |
| P2-06, 07, 08 | 수정 | 1024–1279 개요에 지난 호·푸터, 왼쪽 목록 헤더 h2, 히어로 저장·공유는 1024–1279에서만 |
| P2-09, 10 | 수정 | `langOf()`로 라틴 문자열에만 lang=en, Sheet `useId` |
| P2-11, 12 | 수정 | P1-02 재작성으로 해소(새 항목은 항상 맨 위) |
| P2-13, 14, 15 | 수정 | update가 실시간 URL을 읽음, 이름순 aria-sort ascending, 세그먼트를 aria-pressed 버튼 그룹으로 |
| P2-16 | 수정 | 저장함에서 해제한 행은 화면을 떠날 때까지 유지, 그룹 헤더 aria-hidden 제거 |
| P2-17 | 유지(의도) | 목록 행 저장 버튼 없음 — VD 5-5 오탭 방지 결정. 저장은 상세·저장함·데스크톱 표 |
| P2-18, 19 | 수정 | S7 H1, 없는 날짜는 가장 가까운 호 링크. 진입 배너는 콜드 스타트에만 |
| P2-20 | 부분 | 히어로 순번을 "저장함 n곳 중"으로 구분. 다음 회사는 저장 순서 기준(정렬 미반영) |
| P2-21, 22, 23 | 수정 | 예외 줄에서 Series D 제거, getDomain 폴백, 잘린 퍼센트 해시 → S7 |
| P2-24 | 수정 | og:url·og:image 절대 URL(startup-daily.vercel.app), SW는 localhost 미등록·동일 출처·ok 응답만 캐시 |
