# v2 UI QA 보고서 (2026-11-14)

기준: `03_final_spec.md` D1–D10·§8, IA, 비주얼 §5. 방법: 코드 리뷰와 함께 브라우저 패널(localhost:5173)을 375/768/1280px, 라이트/다크에서 JS로 직접 조작했다.

**자동 검사:** `npx eslint src` 통과, `npm run build` 통과.
**참고:** 리뷰 도중 `src/lib/nav.js`가 바뀌었다(17:50, `scrollRestoration='manual'` 추가). 아래 줄 번호는 17:51 기준이다.
**미검증:** 실제 터치 기기 동작(P1-3), 스크린 리더 낭독, PWA·오프라인, `days/<date>.json` 로드 실패 화면(코드만 확인). 브라우저 패널이 숨겨져 있어 스크롤 이벤트가 발생하지 않았다. 그래서 스크롤 복원은 이벤트를 직접 발생시켜 확인했다(복원은 정상 동작).

---

## P0

### P0-1 필터 시트 안에서 고른 필터·정렬이 시트를 닫으면 사라짐 (탐색·공모전)
- **위치:** `src/lib/hooks.js:52-57` (`setQuery`), `src/components/Sheet.jsx:46-57`, `src/screens/Explore.jsx:50-67`, `src/screens/Contests.jsx:321`
- **재현(확인함):** 375px, `#/explore` → 필터 칩 → 분야 "헬스" 선택. 이 시점 URL은 `#/explore?sector=health`, 버튼은 "35곳 보기"다. "35곳 보기"를 누르면 URL이 `#/explore`로 돌아가고 결과도 필터 없는 상태로 돌아간다. `#/contests`에서 정렬 "상금 큰 순"을 골라도 똑같다(`?sort=prize` → 닫으면 `#/contests`).
- **원인:** 시트를 열면 기록에 한 칸이 쌓인다. 그 상태에서 `setQuery`가 바꾸는 것은 **시트 칸**의 URL뿐이다. 닫을 때 `history.back()`이 필터 전 URL을 가진 화면 칸으로 돌아간다.
- **수정 제안:** Sheet 정리 코드에서 닫기 직전의 `location.hash`를 기억한다. 그 `back()`이 일으킨 popstate 뒤에 해시가 다르면 `history.replaceState(history.state, '', 기억한해시)` 후 hashchange를 발생시킨다. 또는 필터 시트에서는 초안 상태로 고르게 하고, 닫힌 뒤(popstate 이후)에 한 번 `setQuery`한다.

## P1

### P1-1 상세 ··· 메뉴의 "틀린 내용 알리기"를 누르면 신고 시트가 열리자마자 닫힘
- **위치:** `src/screens/Detail.jsx:848-851` (`act`), `:1198`, `Sheet.jsx:55`
- **재현(확인함):** 상세 → ··· → "틀린 내용 알리기". 1.2초 뒤 열린 dialog가 0개다. 메뉴 시트를 닫는 정리 코드의 비동기 `history.back()`이 신고 시트의 `pushState` 뒤에 처리된다. 그 popstate를 받은 신고 시트가 스스로 닫힌다. 같은 경쟁이 메뉴 "링크 복사"에서 복사에 실패해 수동 복사 시트를 띄울 때(`detail-hooks.jsx:222-226`)와 공유 시트 → 수동 시트 경로에도 있다.
- **수정 제안:** `goSection`(`Detail.jsx:1027-1035`)처럼 첫 시트가 pop된 뒤에 두 번째 시트를 연다. 일반 해법은 nav.js에 `afterSheetClosed(fn)`(popstate 1회 대기)을 두는 것이다.

### P1-2 영어판 오늘 화면·상세에 한국어 새 소식 제목이 노출됨
- **위치:** `src/screens/Today.jsx:244`, `src/screens/Detail.jsx:117,124,127`
- **재현(확인함):** `?lang=en#/` → "Where are they now" 블록에 "…만 달러 전환사채 발행 완료", "말레이시아 시그마 워터 인수"가 보인다.
- **수정 제안:** `updates.json`에 `title_en`/`detail_en`이 있으니 `L(u.title_ko, u.title_en || u.title_ko)`를 쓴다.

### P1-3 터치 기기에서 시트 머리의 × 닫기 버튼이 눌리지 않을 가능성 (미검증, 가능성 높음)
- **위치:** `src/components/Sheet.jsx:96` (+ `onPointerDown` 64-65)
- **원인:** 드래그 핸들러가 × 버튼을 감싼 `.sheet__head`에 붙어 있다. 터치 pointerdown에서 `setPointerCapture`가 head에 걸린다. Pointer Events 3 기준으로 click은 캡처 대상(head)으로 가므로 버튼의 onClick이 실행되지 않는다. 마우스는 조기 return이라 데스크톱에서는 재현되지 않는다.
- **수정 제안:** `if (e.target.closest('button, a')) return`을 넣거나 드래그 영역을 grip과 제목에만 둔다. 실기기(iOS Safari, Android Chrome)에서 확인 필요.

## P2

| ID | 위치 | 내용 / 재현 | 제안 |
|---|---|---|---|
| P2-1 | `App.jsx:39` | 영어판에서 `#/contests`, `#/contests?c=` 직접 진입 시 한국어 공모전 목록이 그대로 보임(D10: 탭·링크 숨김) | `isEn`이면 `#/`로 redirect |
| P2-2 | `About.jsx:34` | 영어판 소개 첫 문단에 "The Contests tab gathers…"가 있음 | 영어판 문장에서 공모전 언급 삭제 |
| P2-3 | `App.jsx:225-229` | 데스크톱(≥1024)의 상세·YC·지난 날·날짜별·설정에 화면 속 뒤로 버튼이 없음(§8-1). 상세 레일 머리 링크 `Detail.jsx:1209`는 push라서 뒤로를 누르면 상세로 되돌아옴 | DesktopNav 아래나 레일 머리에 `back`(goBack) 연결 |
| P2-4 | `Detail.jsx:181-183` | lite 단계에서는 셋째 팩트가 "직원"이고 full이 오면 "기업가치"로 바뀜(레이아웃 점프) | lite에 `valuation_estimate` 포함, 또는 full 전에는 셋째 칸을 스켈레톤으로 |
| P2-5 | `Detail.jsx:1139` | 공유 링크로 처음 들어온 사람(depth 0)에게도 "다음 · ○○"가 보임. IA 497은 "오늘의 5곳 보기 →" | `isColdStart()`이면 오늘로 가는 CTA |
| P2-6 | `Detail.jsx:295`, `app.css:202`, `.kw a` | 터치 타깃 미달: 역할 "묻지 않기" ×가 32×32, 날짜 버튼 높이 32, 키워드 링크 높이 30 | 44 확보(투명 패딩) |
| P2-7 | `Chrome.jsx:97,120`, `Company.jsx:101` | 새 소식 점 `<span aria-label>`은 role이 없어서 낭독되지 않음 | `role="img"` 또는 sr-only 텍스트 |
| P2-8 | `ui.jsx:89-105` | Segmented가 `role=tablist`/`tab`인데 tabpanel·aria-controls가 없음(저장 화면) | `aria-pressed` 버튼 그룹으로 바꾸거나 tabpanel 연결 |
| P2-9 | `data.js:366,370` | 검색 이유 "창업자:", "경쟁사로 언급:"이 영어판에서도 한국어 | `L()` 적용 |
| P2-10 | `Today.jsx:255-261` | "내 분야에서 더"가 행 최대 3개(IA 214)가 아니라 탐색으로 가는 한 줄 링크. 게다가 `poolLive`가 거짓이면 안 보임 | 의도라면 스펙 갱신 |
| P2-11 | `Today.jsx:336` + `DaySheet` | 지난 날에서 날짜 시트로 "오늘"을 고르면 replace되어 기록에 `#/`가 두 번 연속 남음 | 대상이 `#/`이고 뒤 칸이 오늘이면 `history.back()` |
| P2-12 | `App.jsx:32` | `#/yc/2020-01-01`처럼 없는 날짜는 최신 YC를 보여 주지만 URL은 그대로 남음 | `#/yc`로 redirect |
| P2-13 | `data.js:170-171,286,339-349`, `hooks.js:171-225`, `personal.js:110-150` | 없앤 기능의 죽은 코드(weeks, issueNo, sectorMix, useMuted, usePersonal/useIssueOrder)가 남아 있음. 화면 영향은 없음(D9: 저장값은 유지) | 함수 삭제(스토어 키는 유지) |

## 통과 확인한 항목
- 라우트: `#/t/ai`→`?sector=ai`, `#/w/*`·`?view=issues`→`?view=dates`, `#/d/<오늘>`→`#/`, 없는 날·회사·공모전의 빈 상태, `?sec=settings`→`#/settings`
- 뒤로가기: 시트를 연 상태에서 뒤로가기를 누르면 시트만 닫힘. 날짜 시트에서 지난 날로 이동한 뒤 뒤로가기 한 번이면 오늘. "다음"·데스크톱 레일·←/→는 replace(뒤로 한 번에 목록). 링크로 처음 들어온 상세에서 ‹를 누르면 `#/`로 replace. 모바일 공모전 상세는 push이고 ‹가 필터를 유지한 채 목록으로 돌아감. 데스크톱 공모전 선택은 기록이 늘지 않음. 활성 탭을 다시 누르면 탭 첫 화면으로 감. 새 화면에서는 h1에 포커스
- 영어판: 탭 3개(공모전 숨김), 저장 화면 세그먼트 숨김
- 375·768·1280px 가로 스크롤 0, 다크 토큰 적용, `app.css` 색 리터럴 0건, 임의 transition 0건, 2px 이상 테두리 0건, 테두리 버튼 0건, 칩은 한 줄 스크롤, "제N호"는 화면에 없음
