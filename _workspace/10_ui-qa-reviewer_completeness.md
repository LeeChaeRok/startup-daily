# 10. 완성도 감사 (ui-qa-reviewer) — 2026-10-28

- 기준: "앱으로서 얼마나 완성도 있게 느껴지는가". 수익화 범위 밖. `05_ui-qa-reviewer_report.md`에서 이미 고친 항목은 다시 적지 않음(P2-17 목록 행 저장 버튼 없음은 의도된 결정이라 제외).
- 대상: 라이브 https://startup-daily.vercel.app (제20호 10/28, 번들 `index-CTqUshT0.js`) + 로컬 `main`(921d2f2) 코드. 로컬 데이터는 라이브보다 하루 늦음(109곳 / 라이브 114곳).
- 방법: Lighthouse 13.6(모바일, 헤드리스), puppeteer-core 스크립트(375×812 DPR2 모바일 에뮬, 1280×800, 라이트/다크 `prefers-color-scheme`, CPU 4배 감속), `vite preview`를 `sd.localhost`로 띄운 뒤 서버를 꺼서 만든 실제 오프라인, `startups.json` node 집계. 소스는 수정하지 않음.
- 증거 파일: `_workspace/10_shots/` (스크린샷 36장 + `lh-mobile-home.report.html`)
- 판정: **P0 0건 · P1 7건 · P2 16건**

## 0. 자동 검사

| 항목 | 결과 |
|---|---|
| `npm run build` | 통과. 경고: `index-*.js` **1,223 kB (gzip 376 kB)**, `korea-lens-*.js` 90 kB. 번들 문자열의 약 87%가 `startups.json` |
| `npm run lint` | 통과(출력 없음) |
| Lighthouse 모바일 `/` | **Perf 79** · A11y 100 · BP 96 · SEO 100. FCP 3.7s, **LCP 3.7s**, SI 4.9s, TBT 0ms, CLS 0. LCP 요소 = 첫 방문 안내 카드 문단. LCP 분해: TTFB 33ms, **render delay 2,491ms** |
| Lighthouse 모바일 `/#/s/traceweave-2026` | Perf 99 · A11y 100 · BP 100. FCP/LCP 1.7s, TTI 4.1s (1회 측정이라 홈과의 차이 일부는 편차일 수 있음) |
| 렌더 차단 | Pretendard CSS(jsDelivr) 931ms, IBM Plex Mono CSS(Google Fonts) 904ms |
| 콘솔 오류 | 파비콘 404 2건(k-oqt.com, mybenefit.co.kr) → BP 96의 원인 |
| 런타임(4배 감속) | 부팅 long task 96ms+104ms. 홈→상세 151ms, 상세→탐색 122ms. 상세 13,000px 스크롤 중 최악 프레임 17ms, long task 0. **스크롤·전환 버벅임은 체감되지 않음** |
| 캐시 헤더 | `/assets/index-*.js`가 `cache-control: public, max-age=0, must-revalidate` (해시 파일인데 immutable이 아님) |

## 1. 이슈 목록

### P1

| ID | 영역 | 재현 위치 | 근거 | 제안 수정 | 위치(file:line) |
|---|---|---|---|---|---|
| **C-01** | "한국에서는" 대기 | 375px `#/s/traceweave-2026` → "AI로 한국 시장 분석하기" → 3초 뒤 홈으로 갔다가 뒤로가기 | **실측**(API를 8초 지연 응답으로 목킹): 돌아오면 진행 표시가 사라지고 처음 버튼이 다시 나옴. 응답이 도착해 `localStorage`에 `sd_lens:traceweave-2026`이 저장된 뒤에도 화면은 계속 버튼 상태. 사용자는 실패로 알고 다시 누르게 되고, 그러면 유료 생성 요청이 한 번 더 나감. 요청 상태가 `useState`라 상세가 언마운트되면 사라지고, `lensCache`는 갱신해도 다시 그리지 않음. 다른 화면에 있을 때 완료 알림도 없음. 스크린샷 `lens-loading-375.png`, `lens-after-return-375.png` | 진행 중인 요청을 모듈 수준 스토어(`id → {promise, started}`)로 올리고 `useSyncExternalStore`로 구독. 돌아오면 경과 시간 그대로 이어서 표시. 완료되면 현재 화면이 어디든 토스트("헬리컬 퓨전 한국 분석이 준비됐어요 · 보기"). 같은 id로 요청 중이면 `run()`이 새 요청을 만들지 않음. 요청 시작 시각을 `sessionStorage`에도 저장해 새로고침 뒤 "이전 요청이 진행 중일 수 있어요"를 안내 | src/screens/detail-hooks.jsx:44-108, src/screens/Detail.jsx:498-530 |
| **C-02** | "한국에서는" 대기 | 같은 화면에서 2~3분 기다리는 동안 홈화면 앱을 백그라운드로 보냄(iOS) / 앱 복귀 시 새 배포가 감지됨 | (코드) `watchForUpdates`가 `visibilitychange`마다 번들 해시를 비교해 다르면 **바로 `location.reload()`** 함. 데일리 배포가 매일 있으니 분석 대기 중 복귀하면 요청이 끊기고 결과도 사라짐. iOS는 백그라운드 fetch를 수십 초 안에 중단함(실기기 미검증). 안내 문구 "이 화면을 열어 두세요"만으로는 막지 못함 | 분석 요청 중이거나 입력 중이면 reload를 미루고 "새 호가 나왔어요 · 새로고침" 토스트로 바꿈. 서버 쪽은 생성 결과를 엣지 캐시뿐 아니라 KV/Blob에 저장해 두고, 클라이언트가 같은 id로 다시 요청하면 진행 중인 작업이나 완성본을 받도록(재생성 비용 방지) | src/lib/update.js:11-21, api/korea-lens.mjs:58-87 |
| **C-03** | 오프라인/PWA | 첫 방문(또는 iOS 홈화면 추가 후 첫 실행) → 네트워크 끊김 → 앱 다시 열기 | **실측**(`sd.localhost` preview 서버 종료): 첫 방문 뒤 캐시에는 `/`, `/index.html`만 있음. 오프라인 재실행 시 `#root` 텍스트 0자 = **흰 화면**. 두 번째 방문부터 JS·CSS가 런타임 캐시에 들어가 정상 동작. SW가 `load` 뒤에 설치되므로 첫 페이지의 번들 요청을 가로채지 못함. iOS 홈화면 앱은 Safari와 저장소가 분리되어 첫 실행이 곧 이 상태임. 스크린샷 `offline-first-visit.png` / `offline-second-visit.png` | 빌드 시 해시 자산 목록을 SW precache에 넣음(vite-plugin-pwa 또는 빌드 후 `sw.js`에 manifest 주입). 최소한 install 단계에서 `/`를 받아 `<script src>`·`<link href>`를 파싱해 함께 `addAll` | public/sw.js:1-13, index.html:47-53 |
| **C-04** | 오프라인/배포 직후 | (a) 오프라인에서 정적 분석이 있는 회사 상세(`#/s/nationa-neuroid-2026`) 열기, (b) 탭을 열어 둔 채 새 배포 후 처음으로 정적 분석 회사 열기 | **실측**(a): `korea-lens-*.js` 청크 로드가 실패하면 `lensCache.set(id, null)`로 굳어지고, 이미 만들어진 분석이 있는 회사인데 "AI로 한국 시장 분석하기" 버튼이 나옴. 누르면 유료 재생성. 다시 온라인이 되어도 새로고침 전까지 복구되지 않음. (b) 라이브에서 없는 해시 `/assets/korea-lens-AAAAAAAA.js`가 404인 것을 확인. 매일 배포되므로 옛 청크 404가 흔히 일어남. 스크린샷 `offline-korea-static.png` | 청크 로드 실패를 "분석 없음"이 아니라 오류 상태로 다룸("분석을 불러오지 못했어요 · 다시 시도", 버튼은 `import()` 재시도). `hasStatic`인 회사에는 API 요청 버튼을 보이지 않음. 청크 404면 `location.reload()`로 새 번들 받기 | src/screens/detail-hooks.jsx:50-62, :102-104 |
| **C-05** | 콘텐츠 표시 | 375px `#/s/helical-fusion-co-ltd-2026` → 투자 섹션 | **실측 스크린샷** `helical-funding-375.png`: 금액 칼럼이 `auto`라 "약 23억 엔 (융자 포함, 주식·융자 내역 비공개)" 같은 긴 금액이 폭을 차지하고, 라운드명 "Series A"가 **한 글자씩 세로로** 줄바꿈됨. 금액 문자열 18자 초과 라운드 14건 / 11개사. 모두 10월 새 파이프라인 데이터라 앞으로 늘어남(helical-fusion, celaid, pit-in, wasimil, mybenefit, matria, mach9, baba, letara, hunarai, the-phage) | 타임라인 금액 칼럼을 `minmax(0, 40%)`로 제한하고, 괄호 이하는 금액 아래 작은 회색 주석 줄로 분리(`amount.split(/\s*\(/)`). 375px에서는 금액을 라운드명 아래 줄로 내림 | src/styles/app.css:648-649, src/screens/Detail.jsx:300-302 |
| **C-06** | 콘텐츠 표시 | 1280px `#/explore` (회사 표) | **실측**: 문서 `scrollWidth` **1741 > 1280** → 페이지 전체에 가로 스크롤. "누적 투자" 열이 667px(`white-space: nowrap`로 "약 131억 엔(보조금·융자 포함, 약 $83.8M). 일문 발표는 …" 전체를 한 줄로 그림). 그래서 첫 화면에서 누적 투자·설립·발행·저장 열이 보이지 않고 저장 버튼도 화면 밖에 있음. `.results-wrap{overflow-x:auto}`가 있지만 grid 자식이 `min-width:auto`라 효과가 없음. 스크린샷 `explore-1280-light.png` | 표 셀에는 목록 행과 같은 축약 규칙(`StartupRow`의 `raised`)을 함수로 빼서 쓰고, 전체 문자열은 `title`로. `.explore__results{min-width:0}` 추가 | src/screens/Explore.jsx:186-188, src/styles/app.css:765-766 |
| **C-07** | 콘텐츠 신뢰 | 라이브 제19호(10/27)와 제20호(10/28) | **같은 회사가 이틀 연속 실림**: `oqt-2026`("오큐티")와 `occu-t-oqt-2026`("주식회사 오큐티"), 웹사이트 모두 k-oqt.com. 탐색 표에서 4번째·7번째 행으로 나란히 보임(`explore-1280-light.png`). "매일 새 회사"라는 약속을 정면으로 깨뜨림 | 생성 파이프라인 중복 검사를 id·이름이 아니라 **정규화한 도메인** 기준으로. 이미 실린 건 corrections로 처리하거나 제20호에서 교체 | scripts/(데일리 생성기), src/data/startups.json |

### P2

| ID | 영역 | 재현 위치 | 근거 | 제안 수정 | 위치(file:line) |
|---|---|---|---|---|---|
| C-08 | 첫 로드 체감 | 모바일 4G(Lighthouse 기본) `/` | FCP=LCP 3.7s. JS가 실행되기 전까지 화면이 비어 있음(render delay 2.5s). 번들의 87%가 데이터라 **매일 배포할 때마다 번들 해시가 바뀌어 376 kB(gzip)를 매일 다시 받음**. 해시 자산이 `max-age=0`이라 같은 날에도 매번 재검증 왕복이 생김 | (1) `startups.json`을 호(날짜)별 JSON으로 나눠 `fetch`. 최신 호 1개만 먼저 받고 나머지는 지연 로드. 코드 번들은 데이터가 바뀌어도 해시 유지. (2) `index.html`에 앱 셸(헤더·스켈레톤 행 5줄)을 인라인으로 넣어 첫 페인트를 1s 안쪽으로. (3) `/assets/*`에 `max-age=31536000, immutable` 지정. 이 프로젝트는 vercel.json을 추가하지 않기로 했으므로 설정 위치는 따로 정해야 함 | vite.config.js, src/lib/data.js:1, index.html |
| C-09 | 첫 로드 체감 | 모든 화면 | 웹폰트 CSS 2개가 렌더를 막음(931ms·904ms, 서로 다른 CDN 2곳). Pretendard는 서브셋 woff2를 11개 받음 | Plex Mono는 숫자만 쓰므로 `font-display:swap` + `<link rel=preload>`로 비차단 로드하거나 시스템 mono로 대체. Pretendard CSS는 `media="print" onload` 패턴이나 self-host로 같은 출처에 두기 | index.html:39-43 |
| C-10 | 숫자 단위 | 375/1280 홈·탐색·상세 | 같은 열에 단위가 섞임: 제20호 한 화면에 "US$10.1M · 6,500만 엔 · $4.1M · ₩170억 · 미공개"(`home-1280-dark.png`). 전체 데이터 109곳 중 `$`로 시작하지 않는 누적 투자 34건(억 엔, 억원, 억 원, ₩B, ¥M, ₹crore, "만 달러", "10M 달러 이상"). 목록 행 축약은 "¥490M 누적", "335억원 이상"처럼 꼬리말이 남음 | 표시용 정규화 함수 하나로 통일: 기본 표기 `$xxM`(원래 통화는 상세에서 "원문: 131억 엔"으로), 한국 회사만 `xxx억 원` 허용. 생성 프롬프트에도 `total_raised_usd` 숫자 필드를 따로 요구 | src/components/StartupRow.jsx:20-22, src/lib/data.js:12-30 |
| C-11 | 숫자 정확도 | 홈 "이 호의 숫자", 탐색 "누적 투자 큰 순" 정렬 | `parseAmountUSD`가 엔(¥, "억 엔")·루피·"만 달러"를 모름. **집계(node)**: "약 131억 엔(…약 $83.8M)" → **$9M**(억을 원으로 계산), "¥9.5억" → $1M(실제 약 $6M), "¥4.4B"·"4,650만 달러"·"10M 달러 이상" → 파싱 실패, 이름이 "비공개"인데 숫자를 끌어와 $13M·$0M으로 계산되는 2건. 제20호는 "6,500만 엔"을 못 읽어 **"2곳 미공개"**로 표시(실제 미공개는 1곳). "추정" 태그가 있어도 틀린 합계는 신뢰를 깎음 | 문자열 안의 `약 $NN.NM` 환산값을 우선 사용, 엔/루피/만 달러 패턴 추가, "비공개"로 시작하면 null. 장기적으로 C-10의 숫자 필드로 대체 | src/lib/data.js:12-30, src/screens/Issue.jsx:316-323 |
| C-12 | 데이터 자체 오류 | `#/s/helical-fusion-co-ltd-2026` 투자 | 최신 라운드 "3.23억 엔 (약 $20.6M)"은 서로 맞지 않음(3.23억 엔 ≈ $2M, $20.6M ≈ 32.3억 엔). 막대 그래프도 그래서 최신 라운드가 가장 짧게 그려짐. 누적 금액 문장에 "일문 발표는 130.5억 엔으로 표기해 약 0.1억 엔 차이가 있다" 같은 생성 과정 메모가 그대로 노출됨 | 생성기 검증 단계에 "통화 환산 일관성" 체크 추가. `total_raised`는 금액만, 메모는 별도 `note` 필드로 | src/data/startups.json(생성기) |
| C-13 | 홈 레이아웃 마감 | 1280px `/` 이 호의 숫자 | "≈$26M ·" 뒤 "· 2곳 미공개"가 줄바꿈되어 첫 줄 끝에 가운뎃점만 남음(`home-1280-dark.png`) | `<small>`을 블록으로 내리고 앞 " · " 제거 | src/screens/Issue.jsx:322 |
| C-14 | 홈 첫 화면 | 375×812, 첫 방문 | 첫 회사 행이 y=612에서 시작해 첫 화면에 **회사 1곳**만 보임. 안내 카드 + 제목 + "모두 읽음으로 표시" + AI 고지 + 분야 요약이 위를 차지함. 아직 0/5인 호에 "모두 읽음으로 표시"가 두 번째로 눈에 띄는 버튼임 | 안내 카드는 1줄 배너로 줄이거나 첫 행 아래로 내림. "모두 읽음"은 1곳 이상 읽었을 때만 보이게 하거나 진행 링(0/5) 옆 메뉴로 | src/screens/Issue.jsx(IssueMobile), src/components/bits.jsx:130-150 |
| C-15 | PWA 셸 | 홈화면 앱(Android/iOS), 다크 모드 사용자 | `manifest.json`의 `theme_color`·`background_color`가 라이트(#F3EFE6) 하나뿐이라 Android 스플래시가 크림색으로 뜬 뒤 다크 화면으로 바뀜. iOS는 `apple-touch-startup-image`가 없어 실행 직후 흰 화면 → JS 부팅. `apple-mobile-web-app-status-bar-style="default"`라 다크 테마에서 상태바가 앱 배경과 다를 수 있음(실기기 미검증) | 스플래시 배경을 아이콘과 같은 #1B1A17로 통일(라이트/다크 모두 자연스러움), iOS 스플래시 이미지 몇 종 생성, status-bar-style은 `black-translucent` + 헤더 safe-area(이미 있음) | public/manifest.json:6-8, index.html:32-34 |
| C-16 | PWA 셸 | manifest | `id`·`scope`가 없음, `orientation: "portrait"`로 태블릿·데스크톱 설치 앱도 세로 고정 요구, `screenshots` 없음(Android 설치 시트가 빈약함), `shortcuts`(최신 호/탐색/저장) 없음 | `id: "/"`, `scope: "/"`, orientation 삭제 또는 `any`, 스크린샷 2장(모바일·와이드), shortcuts 3개 | public/manifest.json |
| C-17 | SW 견고성 | 라이브 장기 사용 | 캐시 이름이 고정(`startup-daily-v2`)이고 런타임 캐시에서 지우는 로직이 없어, 매일 배포마다 1.2MB 번들이 쌓임(30일이면 약 36MB). 네트워크 우선 + 타임아웃 없음이라 신호가 약한 곳(지하철)에서는 오프라인보다 더 오래 흰 화면 | `activate`/`fetch`에서 현재 셸이 참조하지 않는 `/assets/*` 정리. 해시 자산은 cache-first, HTML만 network-first + 3초 타임아웃 후 캐시 | public/sw.js:27-44 |
| C-18 | 새로고침 수단 | iOS 홈화면 앱 | 당겨서 새로고침도, 새로고침 버튼도 없음. 새 호는 앱이 다시 포그라운드로 올 때만 확인(60초 스로틀)하고 묻지 않고 reload함. 앱을 켜 둔 채 새 호가 나오면 알 방법이 없음 | 포그라운드 중에도 10분 간격 확인 + "새 호가 나왔어요 · 보기" 토스트. reload는 사용자가 누를 때만(C-02와 같이 처리) | src/lib/update.js |
| C-19 | 로고 | 전체 목록 | **실측**: Google s2 파비콘 109개 중 91개(83%)가 48px 이상으로 로드, 18개(17%)는 16~32px라 모노그램으로 대체(k-oqt, mybenefit, deepfine, switchwon, innospc, plenty, meetiqm, covariant 등). `logo_url`은 109건 모두 빈 문자열. 404 파비콘 2건은 콘솔 오류로 남음. 모노그램 → 이미지로 바뀌는 순간이 목록마다 보임(지연 0.4s 내외) | 생성 파이프라인에서 로고를 받아 `public/logos/{id}.png`로 저장(폴더는 이미 있음) 후 `logo_url` 채우기. 실패한 도메인은 `apple-touch-icon`/`og:image` 순으로 재시도. 같은 출처라 SW 캐시·오프라인에도 들어감 | src/components/Logo.jsx:24-28, 생성기 |
| C-20 | 접근성 | "한국에서는" 대기 중 | 경과 초가 `role="status" aria-live="polite"` 영역 안에 있어 스크린리더가 2~3분 동안 매초 "4초, 5초…"를 읽음 | 초 숫자는 live 영역 밖으로 빼고, live 영역에는 시작·30초 간격·완료/실패만 넣기 | src/screens/Detail.jsx:504-510 |
| C-21 | 터치 타겟 | 375px 상세 | 섹션 칩 8개가 32px 높이(가로 36~62px), 해시태그 링크 30px, 첫 방문 카드 닫기 36×36. WCAG 2.2 AA(24px)는 통과하지만 iOS HIG 44pt 미만이라 엄지로 칩을 잘못 누르기 쉬움 | 칩 `min-height:40px` + 보이지 않는 히트 영역 확장(`::after` inset -6px) | src/styles/app.css(.chipnav__chip, .icon-btn) |
| C-22 | 문구 불일치 | 375px `#/saved` 빈 상태 | "목록이나 상세에서 저장 버튼을 누르면 여기에 모여요" — 모바일 목록 행에는 저장 버튼이 없음(P2-17 유지 결정) | "회사 상세 화면 아래쪽 저장 버튼을 누르면…"으로 | src/screens/Saved.jsx |
| C-23 | 분석 진행 표시 | "한국에서는" 대기 | 2~3분 동안 스피너와 초만 보임. 지금 무엇을 하는지(검색 중/링크 확인 중/작성 중)나 남은 시간이 없어 1분쯤 지나면 멈춘 것처럼 느껴짐. 330초에서 클라이언트가 abort하는데, 서버 제한 270초 + 지연을 고려하면 맞지만 안내가 없음 | 서버를 스트리밍(SSE)으로 바꿔 단계 이벤트를 보내거나, 최소한 시간 기반 단계 문구(0–40초 "비슷한 제품 찾는 중", 40–120초 "한국 시장 검색 중", 120초~ "링크 확인·정리 중")와 진행 막대 | src/screens/Detail.jsx:502-511, api/korea-lens.mjs |

## 2. 항목별 요약

1. **체감 성능**: 런타임은 좋음(전환 120~150ms@4배 감속, 스크롤 jank 없음, TBT 0). 문제는 첫 로드(Lighthouse 모바일 79, LCP 3.7s)와 매일 바뀌는 1.2MB 단일 번들(C-08, C-09). 로고는 lazy라 LCP에 영향 없음.
2. **PWA**: 두 번째 방문부터는 오프라인으로 열림. 첫 방문 오프라인 흰 화면(C-03), 오프라인·배포 직후 분석 청크 실패 시 잘못된 상태(C-04), 스플래시/상태바/manifest 마감(C-15, C-16), 캐시 누적(C-17), 새로고침 수단 부재(C-18). safe-area는 상단 헤더·하단 탭바/액션바/토스트에 모두 적용되어 있음(코드 확인, 실기기 미검증).
3. **상호작용**: 뒤로가기·스크롤 복원은 실측상 정상(탐색 3000px → 상세 → 뒤로 = 3000px, 헤더 ← 동일). 빈 검색·빈 저장함 상태 있음. "모두 읽음" 토스트에 되돌리기 있음. 가장 큰 결함은 "한국에서는" 대기 중 이탈 시 결과가 화면에 안 붙는 문제(C-01, C-02, C-23).
4. **콘텐츠 표시**: 금액 문자열이 길고 단위가 제각각이라 상세 타임라인(C-05)과 탐색 표(C-06)가 깨짐. 합계 계산도 엔화를 원화로 읽음(C-11). 중복 게재(C-07). 로고 없는 회사 17%(C-19). 빈 섹션 데이터는 `team_highlights` 빈 문자열 1건, 투자 이력 0건 1건뿐이며 화면에서 숨겨짐.
5. **접근성**: Lighthouse A11y 100(라이트 기준), 읽음 토글·"안 읽은 곳만"에 `aria-pressed`, 진행 링에 sr-only "읽음" 있음. 회귀는 C-20(대기 중 매초 낭독) 하나.

## 3. 미검증

- **실제 iOS/Android 기기**: 홈화면 앱의 상태바 색, 노치 safe-area 실제 여백, 스플래시, 백그라운드에서 2~3분 fetch 유지 여부. 헤드리스 Chrome 모바일 에뮬레이션만 사용함.
- **다크 모드 대비**: Lighthouse는 라이트에서만 측정. 다크는 스크린샷 육안 검토만 했고 명백한 저대비는 보지 못함.
- **Lighthouse 편차**: 홈·상세 각 1회 측정.
- **"한국에서는" 실제 2~3분 소요와 서버 동작**: 대기 UX는 API를 목킹(8초 지연)해서 검증함. 클라이언트가 끊겼을 때 Vercel 함수가 끝까지 실행되어 엣지 캐시에 남는지는 확인하지 못함.

## 4. 감사 중 발생한 부수 효과 (보고)

- 첫 번째 대기 UX 스크립트는 puppeteer 요청 가로채기로 API를 목킹하려 했지만, 라이브 사이트의 서비스 워커가 `/api/korea-lens` 요청을 대신 보내서 가로채기가 적용되지 않았음. 그 결과 **라이브 `/api/korea-lens?id=traceweave-2026`에 실제 요청 1건**이 나갔고, 약 11초 뒤 브라우저를 닫아 클라이언트 쪽에서 끊김. 서버가 생성을 끝까지 진행했다면 OpenRouter 비용 1회분이 발생했을 수 있음. 이후 스크립트는 모두 `setBypassServiceWorker(true)`와 `/api/*` 차단을 적용함.
- 이 관찰은 별개의 사실도 보여 줌: SW가 API 응답까지 동일 출처 GET으로 처리하므로 200 응답은 SW 캐시에 남음(오프라인에서 이전 분석을 다시 볼 수 있다는 장점도 있음).
