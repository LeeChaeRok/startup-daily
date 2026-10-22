# 02. Startup Daily 비주얼 아이덴티티 & 디자인 시스템

- 작성: visual-designer / 기준일 2026-10-22
- 입력: `01_product-benchmarker_patterns.md`, `01_lead_chrome-notes.md`, `01_market-researcher_market.md`. `02_ux-architect_ia.md`는 작성 시점에 없었다. 화면 이름은 리더가 합의한 방향(오늘의 이슈 / 상세 `#/s/:id` / 탐색 / 저장)을 따랐다. IA 문서와 이름이 충돌하면 IA를 기준으로 하고, **토큰 이름은 바꾸지 않는다.**
- 스택 전제: React 19 + Vite + Tailwind v4(`@import "tailwindcss"`), 정적 PWA, 해시 라우팅.
- 대비비는 WCAG 2.x 상대 휘도 공식으로 직접 계산한 값이다(소수 둘째 자리).

---

## 0. 방향 한 줄 — "원장(元帳)과 인주(印朱)"

**미색 신문 용지 위에 먹색 활자와 룰 라인을 깔고, 한 가지 강한 색은 도장 인주의 주홍(朱紅)만 쓴다.** 경제지 지면의 위계(큰 한글 헤드라인, 굵은 상단 룰, 좁은 본문 폭)에 데이터 단말기의 미세층(고정폭 숫자, 순위 `01`, 날짜 `2026.10.22`, 정렬된 금액 열)을 얹는다.

| 결정 | 내용 | 버리는 것 |
|---|---|---|
| 바탕 | 따뜻한 미색 `#F3EFE6`(라이트), 깊은 먹색 `#111317`(다크, 순흑 아님) | `#f5f5f7` 회색 SaaS 배경, 순백 카드 더미 |
| 액센트 | 인주 주홍 1색 `#B7321C` / 다크 `#FF7452` | 보라 그라디언트 `#667eea→#764ba2`, 카테고리별 색 |
| 구분 | 그림자 대신 **룰 라인**(1px 회선, 2–3px 먹선) | 둥근 카드 + 드롭섀도 |
| 모서리 | 0–4px. 둥근 알약 모양은 쓰지 않는다 | `rounded-2xl` 카드, 알약 칩 |
| 서체 | Pretendard Variable(전부) + IBM Plex Mono(ASCII 숫자·날짜·순위만) | DM Sans, Playfair Display(한글 없음) |
| 아이콘 | 인라인 SVG 라인 아이콘, stroke 1.75 | 이모지 📍🗓👥☆ |
| 카테고리 | 텍스트 라벨 + 6px 정사각 먹색 점 | 색상 매핑(카테고리가 자유 태그라 불가능) |

**액센트 사용 규칙(화면 면적 5% 이하):** 다음 6곳에만 쓴다. (1) 워드마크의 인주 사각점, (2) Smart Brevity 블록 라벨("왜 지금" 등)과 리드 키커("에디터 픽"), (3) 저장됨 상태 아이콘, (4) 하단 탭바·상단 내비 활성 인디케이터(2px 바), (5) 본문 링크 밑줄, (6) 포커스 링. 활성 칩·선택 버튼은 **먹색 반전**(ink 배경 + bg 글자)으로 처리하고 액센트로 칠하지 않는다. 액센트 면(배경 채우기)은 쓰지 않는다. 예외는 `--sd-accent-soft` 위 텍스트 하이라이트 한 가지다.

---

## 1. 컬러 토큰

### 1-1. 토큰 표

대비비 열: 해당 토큰을 **전경**으로 쓸 때 `bg / surface / surface-2` 위에서의 값. 선 토큰은 비텍스트 대비(WCAG 1.4.11, 3:1) 기준이다.

| 토큰 | 라이트 | 다크 | 용도 | 대비비 라이트 (bg/sf/sf2) | 대비비 다크 (bg/sf/sf2) |
|---|---|---|---|---|---|
| `--sd-bg` | `#F3EFE6` | `#111317` | 페이지 바탕(용지) | — | — |
| `--sd-surface` | `#FAF8F3` | `#181B20` | 떠 있는 면: 헤더, 탭바, 시트, 검색 필드, 선택 행 | — | — |
| `--sd-surface-2` | `#E9E3D6` | `#21252C` | 눌림, 호버, 인용 블록, 스켈레톤, 차별점 박스 | — | — |
| `--sd-ink` | `#1A1915` | `#ECE7DC` | 헤드라인, 본문 1차 | 15.33 / 16.57 / 13.76 | 15.08 / 14.00 / 12.47 |
| `--sd-ink-2` | `#45413A` | `#B8B2A6` | 본문 2차, 태그라인, 요약 | 8.84 / 9.56 / 7.93 | 8.82 / 8.19 / 7.29 |
| `--sd-ink-3` | `#69645A` | `#969085` | 메타, 캡션, 플레이스홀더, 비활성 탭 | 5.12 / 5.54 / 4.60 | 5.87 / 5.45 / 4.85 |
| `--sd-line` | `#D6CFC0` | `#2E333B` | 장식용 회선(행 구분, 섹션 구분) — 정보 전달 금지 | 1.35 / 1.46 / 1.21 | 1.46 / 1.36 / 1.21 |
| `--sd-line-ui` | `#827B6D` | `#6B717C` | 인터랙티브 테두리(입력 필드, 필터 칩, 단계 배지, 보조 버튼) | 3.66 / 3.95 / 3.28 | 3.79 / 3.52 / 3.13 |
| `--sd-line-strong` | `#1A1915` | `#ECE7DC` | 먹선: 마스트헤드 상단 룰, 섹션 상단 룰, 타임라인 축 | 15.33 / 16.57 / 13.76 | 15.08 / 14.00 / 12.47 |
| `--sd-accent` | `#B7321C` | `#FF7452` | 인주 주홍: 라벨, 링크, 저장됨, 활성 인디케이터 | 5.25 / 5.68 / 4.71 | 6.97 / 6.47 / 5.76 |
| `--sd-accent-ink` | `#FFFFFF` | `#1A0E0A` | 액센트 면 위 글자(토스트 버튼 등 드묾) | on accent 6.02 | on accent 7.08 |
| `--sd-accent-soft` | `#F6DED6` | `#3A1D16` | 검색어 하이라이트, `::selection` | accent on soft 4.69 | accent on soft 5.76 |
| `--sd-positive` | `#1E6B3F` | `#5CC98A` | 검증됨, 성장 지표(+) | 5.67 / 6.13 / 5.08 | 9.01 / 8.37 / 7.45 |
| `--sd-positive-soft` | `#DCEBDF` | `#16301F` | 검증 배지 바탕 | positive on soft 5.26 | 6.89 |
| `--sd-warning` | `#8A5A00` | `#E8B24A` | 미검증, 리스크 마커, 정보 기준일 경고 | 5.16 / 5.58 / 4.64 | 9.65 / 8.96 / 7.98 |
| `--sd-warning-soft` | `#F5E7C8` | `#33280F` | 미검증 배지·신뢰 블록 바탕 | warning on soft 4.84 | 7.51 |
| `--sd-focus` | `#B7321C` | `#FF7452` | 포커스 링(= accent) | 5.25 (≥3 충족) | 6.97 |
| `--sd-on-ink` | `#F3EFE6` | `#111317` | 먹색 반전 면(활성 칩, 기본 버튼) 위 글자 | on ink 15.33 | on ink 15.08 |
| `--sd-logo-bg` | `#FFFFFF` | `#ECE7DC` | 실제 로고/파비콘 이미지 타일 바탕(다크에서도 밝게 — 투명 PNG의 검은 로고가 사라지지 않게) | — | — |
| `--sd-scrim` | `rgb(26 25 21 / 0.48)` | `rgb(0 0 0 / 0.60)` | 바텀시트·모달 뒤 딤 | — | — |

**검증 요약**
- 본문(`ink`, `ink-2`)은 모든 면에서 7:1 이상(AAA).
- 가장 약한 텍스트 조합은 라이트 `ink-3` on `surface-2` 4.60, `accent` on `surface-2` 4.71 → 모두 4.5 이상. **`ink-3`와 `accent`는 `surface-2` 위에서 13px 미만으로 쓰지 않는다.**
- `--sd-line`은 장식 전용이다. 체크박스·칩·입력 테두리처럼 "경계가 곧 정보"인 곳은 `--sd-line-ui`(3:1 이상)를 쓴다.
- 다크 바탕은 `#111317`(먹색, 약간 푸른 기)이다. 순흑 `#000`은 쓰지 않는다. 다크에서 깊이는 그림자 대신 `bg → surface → surface-2` 명도 단계로 표현한다.

### 1-2. 모노그램 팔레트 (로고 폴백 전용, 8색)

카테고리가 아닌 **회사명 해시**로 고른다. 채도를 낮춘 지면 톤이다. 보라·라벤더 계열은 넣지 않았다.

| idx | 이름 | 라이트 bg / fg | 대비 | 다크 bg / fg | 대비 |
|---|---|---|---|---|---|
| 0 | slate | `#DCE3E8` / `#24384A` | 9.31 | `#22303B` / `#BCD0DF` | 8.51 |
| 1 | moss | `#DEE5D4` / `#33452A` | 8.03 | `#263222` / `#C3D6B3` | 8.70 |
| 2 | clay | `#EEDBCD` / `#6A3219` | 7.51 | `#3A271C` / `#EBC3A8` | 8.68 |
| 3 | sand | `#ECE1C4` / `#5A4411` | 7.11 | `#352D18` / `#E3CF94` | 8.84 |
| 4 | teal | `#D3E5E1` / `#1C4943` | 7.71 | `#1C3330` / `#A8D8CF` | 8.55 |
| 5 | brick | `#EFD7D4` / `#6D2A25` | 7.64 | `#3A2221` / `#ECB8B2` | 8.43 |
| 6 | steel | `#D9DCE6` / `#2D3550` | 8.83 | `#262B3B` / `#C2C9E0` | 8.53 |
| 7 | ink | `#1A1915` / `#F3EFE6` | 15.33 | `#ECE7DC` / `#111317` | 15.08 |

### 1-3. CSS (그대로 `src/styles/global.css` 상단에 붙인다)

```css
@import "tailwindcss";

/* 다크 variant: data-theme 기준. "시스템" 설정은 JS가 matchMedia로 풀어서 data-theme에 light|dark를 넣는다 */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  color-scheme: light;
  --sd-bg: #F3EFE6;
  --sd-surface: #FAF8F3;
  --sd-surface-2: #E9E3D6;
  --sd-ink: #1A1915;
  --sd-ink-2: #45413A;
  --sd-ink-3: #69645A;
  --sd-line: #D6CFC0;
  --sd-line-ui: #827B6D;
  --sd-line-strong: #1A1915;
  --sd-accent: #B7321C;
  --sd-accent-ink: #FFFFFF;
  --sd-accent-soft: #F6DED6;
  --sd-positive: #1E6B3F;
  --sd-positive-soft: #DCEBDF;
  --sd-warning: #8A5A00;
  --sd-warning-soft: #F5E7C8;
  --sd-focus: #B7321C;
  --sd-on-ink: #F3EFE6;
  --sd-logo-bg: #FFFFFF;
  --sd-scrim: rgb(26 25 21 / 0.48);

  --sd-mono-0-bg: #DCE3E8; --sd-mono-0-fg: #24384A;
  --sd-mono-1-bg: #DEE5D4; --sd-mono-1-fg: #33452A;
  --sd-mono-2-bg: #EEDBCD; --sd-mono-2-fg: #6A3219;
  --sd-mono-3-bg: #ECE1C4; --sd-mono-3-fg: #5A4411;
  --sd-mono-4-bg: #D3E5E1; --sd-mono-4-fg: #1C4943;
  --sd-mono-5-bg: #EFD7D4; --sd-mono-5-fg: #6D2A25;
  --sd-mono-6-bg: #D9DCE6; --sd-mono-6-fg: #2D3550;
  --sd-mono-7-bg: #1A1915; --sd-mono-7-fg: #F3EFE6;

  --sd-shadow-1: 0 1px 0 var(--sd-line);
  --sd-shadow-2: 0 2px 8px rgb(26 25 21 / 0.08), 0 0 0 1px var(--sd-line);
  --sd-shadow-3: 0 12px 32px rgb(26 25 21 / 0.16), 0 0 0 1px var(--sd-line);
}

[data-theme="dark"] {
  color-scheme: dark;
  --sd-bg: #111317;
  --sd-surface: #181B20;
  --sd-surface-2: #21252C;
  --sd-ink: #ECE7DC;
  --sd-ink-2: #B8B2A6;
  --sd-ink-3: #969085;
  --sd-line: #2E333B;
  --sd-line-ui: #6B717C;
  --sd-line-strong: #ECE7DC;
  --sd-accent: #FF7452;
  --sd-accent-ink: #1A0E0A;
  --sd-accent-soft: #3A1D16;
  --sd-positive: #5CC98A;
  --sd-positive-soft: #16301F;
  --sd-warning: #E8B24A;
  --sd-warning-soft: #33280F;
  --sd-focus: #FF7452;
  --sd-on-ink: #111317;
  --sd-logo-bg: #ECE7DC;
  --sd-scrim: rgb(0 0 0 / 0.60);

  --sd-mono-0-bg: #22303B; --sd-mono-0-fg: #BCD0DF;
  --sd-mono-1-bg: #263222; --sd-mono-1-fg: #C3D6B3;
  --sd-mono-2-bg: #3A271C; --sd-mono-2-fg: #EBC3A8;
  --sd-mono-3-bg: #352D18; --sd-mono-3-fg: #E3CF94;
  --sd-mono-4-bg: #1C3330; --sd-mono-4-fg: #A8D8CF;
  --sd-mono-5-bg: #3A2221; --sd-mono-5-fg: #ECB8B2;
  --sd-mono-6-bg: #262B3B; --sd-mono-6-fg: #C2C9E0;
  --sd-mono-7-bg: #ECE7DC; --sd-mono-7-fg: #111317;

  /* 다크에서는 그림자 대신 테두리로 띄운다 */
  --sd-shadow-1: 0 1px 0 var(--sd-line);
  --sd-shadow-2: 0 0 0 1px var(--sd-line);
  --sd-shadow-3: 0 16px 40px rgb(0 0 0 / 0.5), 0 0 0 1px var(--sd-line);
}

/* Tailwind 유틸리티 매핑: bg-sd-bg, text-sd-ink-2, border-sd-line-ui, font-sd-mono ... */
@theme inline {
  --color-sd-bg: var(--sd-bg);
  --color-sd-surface: var(--sd-surface);
  --color-sd-surface-2: var(--sd-surface-2);
  --color-sd-ink: var(--sd-ink);
  --color-sd-ink-2: var(--sd-ink-2);
  --color-sd-ink-3: var(--sd-ink-3);
  --color-sd-line: var(--sd-line);
  --color-sd-line-ui: var(--sd-line-ui);
  --color-sd-line-strong: var(--sd-line-strong);
  --color-sd-accent: var(--sd-accent);
  --color-sd-accent-ink: var(--sd-accent-ink);
  --color-sd-accent-soft: var(--sd-accent-soft);
  --color-sd-positive: var(--sd-positive);
  --color-sd-positive-soft: var(--sd-positive-soft);
  --color-sd-warning: var(--sd-warning);
  --color-sd-warning-soft: var(--sd-warning-soft);
  --color-sd-on-ink: var(--sd-on-ink);
  --font-sd-sans: var(--sd-font-sans);
  --font-sd-mono: var(--sd-font-mono);
}
```

**테마 전환(FOUC 방지):** `index.html` `<head>`에 렌더 전 인라인 스크립트를 둔다.

```html
<script>
  (function () {
    var pref = 'system';
    try { pref = localStorage.getItem('sd_theme') || 'system'; } catch (e) {}
    var dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  })();
</script>
<meta name="theme-color" content="#F3EFE6" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#111317" media="(prefers-color-scheme: dark)" />
```

- 수동 토글은 3상태 순환(시스템 → 라이트 → 다크). `localStorage.sd_theme` ∈ `system|light|dark`. 시스템 모드일 때는 `matchMedia(...).addEventListener('change')`로 `data-theme`을 갱신한다.
- 수동 선택 시 `<meta name="theme-color">`의 `content`를 JS로 현재 `--sd-bg` 값으로 덮어쓴다.
- `public/manifest.json`: `background_color: "#F3EFE6"`, `theme_color: "#F3EFE6"`(현재 `#667eea` 교체).
- 테마 전환 시 색 트랜지션은 걸지 않는다(전역 `transition: background-color` 금지 — 전환 순간 화면 전체가 번쩍인다).

---

## 2. 타이포그래피

### 2-1. 서체와 로딩

| 역할 | 서체 | 로딩 | 이유 |
|---|---|---|---|
| 모든 한글·라틴 텍스트 | **Pretendard Variable** (45–920) | `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">` + `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>` | 한글·라틴 글리프 일관, OFL, 다이내믹 서브셋으로 첫 화면에 필요한 조각만 받는다. 가변 굵기라 800 헤드라인과 400 본문을 파일 1개로 처리한다. |
| 데이터 미세층(ASCII 숫자·날짜·순위·라틴 코드) | **IBM Plex Mono** 400 / 500 / 600 | `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap` | "데이터 단말기" 층을 Pretendard와 확실히 구분한다. Plex Mono는 인문주의 모노라 JetBrains Mono·Space Mono보다 신문 지면과 잘 어울리고, 0/O·1/l 구분이 명확해 `$1.2B`, `2024.07` 판독이 빠르다. 3개 굵기, 라틴 서브셋만이라 약 60KB 내외. |

- 세리프 디스플레이 서체는 쓰지 않는다. 한글 세리프 웹폰트는 용량이 크고, 라틴 세리프를 한글 옆에 두면 지금의 Playfair 문제(서체 혼용)가 재발한다. 신문 느낌은 서체가 아니라 **룰 라인·굵기 대비·좁은 본문 폭**으로 낸다.
- 기존 Google Fonts 링크(Playfair Display, DM Sans)는 삭제한다.

```css
:root {
  --sd-font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui,
    "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  --sd-font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas,
    "Pretendard Variable", monospace;
}
html {
  font-family: var(--sd-font-sans);
  font-size: 100%;               /* 1rem = 16px, 사용자 확대 존중 */
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
}
body {
  background: var(--sd-bg);
  color: var(--sd-ink);
  font-size: 17px;
  line-height: 1.7;
  letter-spacing: -0.005em;
  word-break: keep-all;          /* 한글 어절 단위 줄바꿈 — 필수 */
  overflow-wrap: anywhere;       /* 긴 URL·영문 단어 넘침 방지 */
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, .sd-headline { text-wrap: balance; }
p, li { text-wrap: pretty; }
.sd-num  { font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1; }
.sd-mono { font-family: var(--sd-font-mono); font-variant-numeric: tabular-nums slashed-zero; letter-spacing: 0; }
```

**모노 사용 규칙(중요):** Plex Mono에는 한글이 없다. 데이터의 금액 문자열에는 `"$330M+"`와 `"약 1,000억 원+"`가 섞여 있다.
- 문자열이 **ASCII만**일 때(`/^[\x20-\x7E]+$/`)만 `.sd-mono`를 쓴다.
- 한글이 섞이면 Pretendard + `.sd-num`(tabular)으로 렌더한다. 헬퍼 `numClass(str) => /^[\x20-\x7E]+$/.test(str) ? 'sd-mono' : 'sd-num'`.
- 숫자 + 한글 단위를 직접 조합하는 곳(오늘의 숫자 스트립)은 `<span class="sd-mono">5</span><span>곳</span>`처럼 나눈다.

### 2-2. 타입 스케일

유동 값은 375px → 1280px 사이를 선형 보간한다. `letter-spacing`의 음수 값은 Pretendard 한글 기준으로 조정했다.

| 토큰 | 크기 (375 → ≥1280) | CSS | 행간 | 자간 | 굵기 | 용도 |
|---|---|---|---|---|---|---|
| `--sd-fs-display` | 30 → 44px | `clamp(30px, 24.2px + 1.55vw, 44px)` | 1.18 | -0.03em | 800 | 상세 히어로 회사명, 데스크톱 마스트헤드 워드마크 |
| `--sd-fs-title-1` | 26 → 36px | `clamp(26px, 21.9px + 1.1vw, 36px)` | 1.22 | -0.025em | 800 | 홈 날짜 타이틀("10월 22일 수요일") |
| `--sd-fs-title-2` | 22 → 26px | `clamp(22px, 20.3px + 0.44vw, 26px)` | 1.32 | -0.02em | 700 | 상세 섹션 제목(h2), 리드 스토리 회사명 |
| `--sd-fs-headline` | 20 → 24px | `clamp(20px, 18.3px + 0.44vw, 24px)` | 1.4 | -0.018em | 700 | 리드 스토리 헤드라인(태그라인), 히어로 태그라인 |
| `--sd-fs-title-3` | 18px | `18px` | 1.4 | -0.012em | 700 | 블록 소제목, 경쟁사명, 빈 상태 제목 |
| `--sd-fs-row` | 17px | `17px` | 1.35 | -0.01em | 700 | 랭크 리스트 행의 회사명 |
| `--sd-fs-body` | 17 → 18px | `clamp(17px, 16.6px + 0.11vw, 18px)` | 1.75 | -0.005em | 400 | 상세 본문 |
| `--sd-fs-body-sm` | 15px | `15px` | 1.6 | -0.003em | 400 | 태그라인(리스트), 카드 요약, 버튼 텍스트 |
| `--sd-fs-caption` | 13px | `13px` | 1.5 | 0 | 500 | 메타, 라벨, 신뢰 표시. **한글 최소 크기** |
| `--sd-fs-label` | 13px | `13px` | 1.3 | 0.02em | 700 | Smart Brevity 라벨, 키커, 섹션 칩 |
| `--sd-fs-micro` | 12px | `12px` | 1.3 | 0.04em | 500 | **모노 ASCII 전용**(날짜, 순위, `$`값 보조). 한글 금지 |
| `--sd-fs-data-xl` | 24 → 30px | `clamp(24px, 21.9px + 0.55vw, 30px)` | 1.1 | -0.01em | 600 | 오늘의 숫자 값(모노) |
| `--sd-fs-data` | 15px | `15px` | 1.3 | 0 | 600 | 리스트 행 누적 투자, 타임라인 금액 |

- 본문 폭: `--sd-measure: 36em`(한글 약 36자/줄; 17px 기준 612px, 18px 기준 648px). 리드 요약·카드 요약은 `--sd-measure-narrow: 30em`.
- 문단 간격: `p + p { margin-top: 0.9em; }`. 리스트 항목 간격 `0.5em`.
- 굵기는 400 / 500 / 700 / 800 네 단계만 쓴다(Pretendard 가변 값으로 600을 쓰는 곳은 모노 데이터뿐).
- 이탤릭은 쓰지 않는다(한글 가짜 기울임 방지). 강조는 700 또는 `ink` 색 대비로.
- 본문 링크: `color: var(--sd-ink); text-decoration: underline; text-decoration-color: var(--sd-accent); text-decoration-thickness: 1.5px; text-underline-offset: 3px;` hover 시 `color: var(--sd-accent)`.

---

## 3. 간격 · 레이아웃 · 반경 · 그림자 · z-index

### 3-1. 간격 (4px 기반)

| 토큰 | 값 | 대표 용도 |
|---|---|---|
| `--sd-space-0` | 2px | 아이콘-텍스트 미세 보정 |
| `--sd-space-1` | 4px | 배지 내부 세로 |
| `--sd-space-2` | 8px | 아이콘과 라벨 사이, 메타 구분자 양옆 |
| `--sd-space-3` | 12px | 칩 사이, 행 내부 열 간격 |
| `--sd-space-4` | 16px | 행 세로 패딩, 블록 내부 |
| `--sd-space-5` | 20px | **모바일 좌우 거터** |
| `--sd-space-6` | 24px | 블록 사이, 데스크톱 그리드 gap |
| `--sd-space-8` | 32px | 태블릿 거터, 섹션 내부 상단 |
| `--sd-space-10` | 40px | 데스크톱 거터, 섹션 사이(모바일) |
| `--sd-space-12` | 48px | 섹션 사이(데스크톱) |
| `--sd-space-16` | 64px | 페이지 하단 여백(탭바 위) |

### 3-2. 레이아웃 토큰

| 토큰 | 값 | 비고 |
|---|---|---|
| `--sd-gutter` | 20px (<640) / 32px (640–1023) / 40px (≥1024) | 모바일 20px: iOS 엣지 스와이프(뒤로가기) 영역 회피 |
| `--sd-container` | 1200px | 데스크톱 최대 폭(거터 제외) |
| `--sd-header-h` | 52px (<1024) / 64px (≥1024) | 스티키 헤더 |
| `--sd-chipnav-h` | 48px | 상세 섹션 칩 내비 |
| `--sd-tabbar-h` | 56px | + `env(safe-area-inset-bottom)` |
| `--sd-sticky-top` | `calc(var(--sd-header-h) + env(safe-area-inset-top))` | 칩 내비 `top` |
| `--sd-anchor-offset` | `calc(var(--sd-sticky-top) + var(--sd-chipnav-h) + 12px)` | 상세 섹션 `scroll-margin-top` |
| `--sd-measure` | 36em | 본문 최대 폭 |
| `--sd-tap` | 44px | 최소 터치 타깃 |

브레이크포인트(Tailwind v4 기본과 일치): `sm 640` · `md 768` · `lg 1024` · `xl 1280`. 레이아웃 전환은 `lg`(탭바 → 상단 내비, 단일 칼럼 → 그리드/분할)와 `xl`(상세 오른쪽 팩트 레일 추가) 두 지점만 쓴다.

### 3-3. 반경

| 토큰 | 값 | 용도 |
|---|---|---|
| `--sd-radius-0` | 0 | 행, 섹션, 리드 스토리, 숫자 스트립, 탭바(지면은 각지게) |
| `--sd-radius-1` | 2px | 칩, 배지, 모노그램 24–40px, 포커스 링 |
| `--sd-radius-2` | 4px | 버튼, 입력 필드, 모노그램 56px 이상, 로고 타일, 토스트 |
| `--sd-radius-3` | 12px | **바텀시트 상단 모서리만** (예외) |

`9999px` 알약 모양과 원형 아바타는 쓰지 않는다. 저장 버튼·아이콘 버튼의 hover 배경도 4px 사각이다.

### 3-4. 그림자

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--sd-shadow-1` | `0 1px 0 var(--sd-line)` | 동일 | 스크롤된 헤더 하단, 칩 내비 하단 |
| `--sd-shadow-2` | `0 2px 8px rgb(26 25 21/.08), 0 0 0 1px var(--sd-line)` | `0 0 0 1px var(--sd-line)` | 토스트, 드롭다운 |
| `--sd-shadow-3` | `0 12px 32px rgb(26 25 21/.16), 0 0 0 1px var(--sd-line)` | `0 16px 40px rgb(0 0 0/.5), 0 0 0 1px var(--sd-line)` | 바텀시트, 검색 오버레이 |

카드·리스트 행에는 그림자를 쓰지 않는다.

### 3-5. z-index

`--sd-z-base: 0` · `--sd-z-sticky: 20`(칩 내비) · `--sd-z-header: 30` · `--sd-z-tabbar: 30` · `--sd-z-scrim: 40` · `--sd-z-sheet: 50` · `--sd-z-toast: 60`

---

## 4. 아이콘

- **인라인 SVG만** 쓴다. 이모지 아이콘은 전면 금지(국기 이모지 포함 — 국가는 텍스트 "미국", "한국").
- 그리드 24×24, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. 형태는 Lucide(ISC 라이선스)에서 path를 복사해 `src/components/icons.jsx` 한 파일에 둔다(패키지 의존성 추가 없이).
- 크기: 16px(인라인 메타), 20px(기본, 버튼 안), 24px(탭바). 아이콘 버튼의 히트 영역은 아이콘 크기와 무관하게 44×44.
- 색은 부모 `color`를 상속한다. 기본 `ink-2`, 비활성 `ink-3`, 저장됨 `accent`.
- 장식 아이콘은 `aria-hidden="true"`, 단독 아이콘 버튼은 `aria-label` 필수.

| 용도 | Lucide 이름 | 비고 |
|---|---|---|
| 탭: 오늘 | `newspaper` | |
| 탭: 탐색 | `search` | |
| 탭: 저장 | `bookmark` | |
| 저장됨 | `bookmark` + `fill="currentColor"` | `accent` |
| 뒤로 | `arrow-left` | |
| 날짜 이전/다음 | `chevron-left` / `chevron-right` | |
| 외부 링크(웹사이트) | `arrow-up-right` | |
| 공유 | `share` (iOS형 상자+화살표) | |
| 필터 | `sliders-horizontal` | |
| 테마 | `sun` / `moon` / `monitor` | 3상태 |
| 정보·신뢰 | `info` | |
| 미검증 | `circle-alert` | `warning` |
| 검증됨 | `circle-check` | `positive` |
| 리스크 | `triangle-alert` | `warning` |
| 읽음 | `check` | |
| 닫기 | `x` | |
| 지난 호 | `calendar-days` | |
| 위치(팩트) | 아이콘 대신 텍스트 라벨 "본사" | 팩트 그리드는 라벨로 충분 |

---

## 5. 컴포넌트 스펙

공통 상태 규칙(모든 인터랙티브 요소):

| 상태 | 처리 |
|---|---|
| hover (포인터 장치만, `@media (hover: hover)`) | 배경 `--sd-surface-2` 또는 글자 `--sd-ink` → 링크는 `--sd-accent` |
| active(누름) | 배경 `--sd-line`(라이트) / `--sd-surface-2`(다크), `transform: none`(스케일 축소 금지 — 지면 느낌 유지) |
| focus-visible | `outline: 2px solid var(--sd-focus); outline-offset: 2px; border-radius: var(--sd-radius-1);` |
| disabled | `color: var(--sd-ink-3); opacity: 1; cursor: default;` 배경 없음. `aria-disabled="true"` |
| selected / pressed | 먹색 반전(`bg: --sd-ink; color: --sd-on-ink`) 또는 액센트 인디케이터 — 컴포넌트별 명시 |

`-webkit-tap-highlight-color: transparent;`를 전역에 두고 active 상태를 직접 그린다.

### 5-1. 앱 헤더 (스티키, 모든 화면)

- 높이 `--sd-header-h`, `position: sticky; top: 0; padding-top: env(safe-area-inset-top);` 배경 `--sd-bg`. 스크롤이 0보다 크면 `box-shadow: var(--sd-shadow-1)`.
- **모바일(<1024):** 좌측 워드마크, 우측 아이콘 버튼 2개(검색, 테마). 상세 화면에서는 좌측이 `[← 뒤로]` 아이콘 버튼 + 회사명(15px 700, 스크롤로 히어로가 사라진 뒤에만 opacity 0→1, 200ms), 우측은 저장·공유.
- **워드마크:** "Startup Daily" Pretendard 800, 18px(모바일) / 20px(데스크톱), `letter-spacing: -0.035em`, `ink`. 글자 뒤 6×6px 정사각 `accent` 점(인주), 기준선 정렬, 간격 3px. 클릭하면 홈.
- **데스크톱(≥1024):** 높이 64px, 좌측 워드마크 · 중앙~우측 상단 내비(오늘 / 탐색 / 저장, 15px 500 `ink-2`, 활성은 `ink` 700 + 하단 2px `accent` 바, 바 폭 = 텍스트 폭) · 우측 검색 필드(240px, 높이 36) + 테마 버튼. 하단 1px `--sd-line`.

### 5-2. 홈 마스트헤드 (스크롤되는 지면 머리)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← 3px --sd-line-strong
──────────────────────────────────────  ← 1px --sd-line-strong, 위 룰과 간격 3px (이중 괘선)
NO.191 · 2026.10.22 WED              ← micro 모노 12px ink-3, 좌측 정렬
10월 22일 수요일                       ← title-1 800 ink
오늘의 스타트업 5곳 · 약 6분 · 2/5 읽음   ← caption 13px ink-2, 숫자 .sd-num
ⓘ AI 리서치 기반 · 2026.10.22 작성 · 검증 필요 정보 포함   ← 신뢰 라벨(5-17) compact
```

- 상단 이중 괘선: `border-top: 3px solid var(--sd-line-strong);` + `::after` 1px 라인(위로 3px 간격). 상단 여백 16px.
- 호수 표기(`NO.191`)는 첫 발행일부터의 발행일 수다. 계산 규칙은 IA가 정한다. 없으면 생략한다.
- 날짜 타이틀 아래 간격 8px, 요약 줄 아래 간격 12px, 신뢰 라벨 아래 24px.
- "2/5 읽음"은 읽음 0이면 숨긴다. 전부 읽으면 `positive` 색 "오늘 완독"으로 바꾼다(체크 아이콘 16px).
- **데스크톱:** 워드마크를 마스트헤드 중앙에 `--sd-fs-display`로 한 번 더 크게(신문 제호) 두고, 날짜·호수는 그 아래 한 줄 중앙 정렬(`NO.191 — 2026년 10월 22일 수요일 — 5곳`). 상단 이중 괘선은 컨테이너 전체 폭.

### 5-3. 날짜 내비게이터

- 위치: 마스트헤드의 날짜 타이틀 오른쪽(모바일은 타이틀 줄 우측 끝, 데스크톱은 마스트헤드 우측 하단).
- 구조: `[‹] 10.22 수 [›]` — 화살표는 44×44 아이콘 버튼(아이콘 20px, `ink-2`), 가운데는 모노 15px 500 `ink` 버튼(높이 44, 좌우 패딩 8). 가운데를 누르면 "지난 호"(탐색 화면의 아카이브 섹션)로 이동한다.
- 상태: 최신 호에서 `›`는 disabled(`ink-3`, `aria-disabled`). 가장 오래된 호에서 `‹` disabled. hover는 `surface-2` 4px 사각 배경.
- 오늘이 아닌 날짜를 보고 있으면 날짜 타이틀 위에 키커 "지난 호" 13px 700 `ink-3` + 우측 "오늘로" 텍스트 링크를 둔다.
- 가로 날짜 칩 행은 만들지 않는다(1년이면 365개).

### 5-4. 리드 스토리 (에디터 픽, 홈 최상단 1개)

- 컨테이너: 패딩 0, 배경 없음, 위 `1px --sd-line-strong`, 아래 `1px --sd-line`. 내부 상하 패딩 20px(모바일) / 32px(데스크톱).
- 순서:
  1. 키커 줄: "에디터 픽" `--sd-fs-label` `accent` 700 + 구분 점 + 섹터 라벨(5-9) + 국가 13px `ink-3`.
  2. 로고/모노그램 56px(5-20) + 회사명(`--sd-fs-title-2`, `name_ko`) + `name_en`(13px `ink-3`, 회사명 아래 줄).
  3. 헤드라인: `tagline`을 `--sd-fs-headline` 700 `ink`로. 최대 3줄.
  4. "왜 지금" 미니 블록: 라벨(5-13 스타일) + `trending_reason.summary` 15px `ink-2` 3줄 클램프(`-webkit-line-clamp: 3`).
  5. 에디터 한 줄: 좌측 2px `--sd-line-strong` 세로 룰, 패딩-left 12px, 16px 500 `ink`, 앞뒤 따옴표 “ ” 없이 본문만. 아래 13px `ink-3` "— 에디터".
  6. 팩트 행: `단계 배지` · `누적 투자 $330M+`(모노/num 600 15px) · `설립 2023`(13px). 구분자는 1px×12px 세로 `--sd-line`.
  7. CTA 행: 왼쪽 텍스트 링크 "전체 읽기"(15px 700 `ink`, 오른쪽 `arrow-right` 16px, 하단 1.5px `accent` 밑줄) · 오른쪽 저장 아이콘 버튼.
- 리드 전체를 `<a>`로 감싸지 않는다(저장 버튼 중첩 방지). 회사명과 CTA가 링크이고, 카드 영역 탭은 `::after` 오버레이로 확장한다(저장 버튼은 `position: relative; z-index: 1`).
- hover: 회사명 밑줄(`accent`), 배경 변화 없음.
- **데스크톱(≥1024):** 8칼럼 폭. 2단 내부 그리드 `grid-template-columns: 1fr 240px; gap: 32px`. 왼쪽 = 키커·회사명·헤드라인(이때 헤드라인을 `--sd-fs-title-1`로 키움)·왜 지금(클램프 없음). 오른쪽 = 에디터 한 줄 + 팩트를 세로 정의 목록(dl)으로.

### 5-5. 랭크 리스트 행 ("오늘의 기업")

섹션 머리: 위 2px `--sd-line-strong` + "오늘의 기업" `--sd-fs-title-3` 700 + 우측 "5곳" 모노 12px `ink-3`. 머리 아래 8px.

행 그리드(모바일):

```
grid-template-columns: 28px 40px minmax(0,1fr) auto;
column-gap: 12px; align-items: start;
padding: 16px 0; min-height: 76px; border-bottom: 1px solid var(--sd-line);
```

| 열 | 내용 | 스타일 |
|---|---|---|
| 순위 | `02` | 모노 15px 500 `ink-3`, `padding-top: 2px`. 리드가 1위이므로 리스트는 `02`부터. 읽은 행은 순위 자리에 `check` 16px `ink-3` |
| 로고 | 40px 로고 타일/모노그램 | 5-20 |
| 본문 | 1줄: `name_ko` `--sd-fs-row` 700 `ink` (+ 공백 + `name_en` 13px 500 `ink-3`, 한 줄 넘치면 `name_en` 생략 ellipsis) / 2줄: `tagline` 15px `ink-2` 2줄 클램프 / 3줄: 메타 13px `ink-3` — 섹터 라벨 · 단계 · 국가 | 줄 간격 4px |
| 숫자 | 상단: `$330M+` (`numClass`, 15px 600 `ink`, 우측 정렬) / 하단: "누적 투자" 13px `ink-3` | `text-align: right; min-width: 64px;` |

- 저장 버튼은 행에 두지 않는다(오탭 방지, 행 높이 유지). 저장은 리드·상세·저장함에서.
- 상태: hover `background: var(--sd-surface-2)` + 좌우로 배경 확장(`margin-inline: -8px; padding-inline: 8px`). active `--sd-line`. focus-visible 행 전체 outline(-2px offset 안쪽). **읽음**: 회사명 `ink-2` 500, 순위 → 체크. **선택됨**(데스크톱 분할 뷰): 배경 `--sd-surface`, 좌측 3px `accent` 바(`box-shadow: inset 3px 0 0 var(--sd-accent)`), `aria-current="page"`.
- 값이 없는 금액: "미공개" 13px `ink-3`.
- **컴팩트 변형**(데스크톱 상세 좌측 목록, 탐색 결과): 로고 32px, 태그라인 1줄, 메타 줄 생략, `min-height: 64px`, 순위 열은 탐색 결과에서 날짜 `10.22`(모노 12px)로 대체.

### 5-6. 오늘의 숫자 스트립

- 섹션 머리: "오늘의 숫자" `--sd-fs-label` 700 `ink` + 우측 기준일 모노 12px `ink-3`.
- 몸체: 위 2px `--sd-line-strong`, 아래 1px `--sd-line`. 셀 4개.
- 모바일: `grid-template-columns: 1fr 1fr;` 셀 사이 1px `--sd-line` 세로/가로 구분선(2×2). 데스크톱 레일: 2×2 유지, 홈 1024–1279에서는 1×4 가로.
- 셀: 패딩 14px 12px. 라벨 13px 500 `ink-3`(위), 값 `--sd-fs-data-xl` 모노 600 `ink` + 단위 15px 500 `ink-2`(아래, 기준선 정렬, 간격 2px).
- 권장 지표(데이터에서 계산 가능, IA 확정 시 교체): `소개 기업 5곳` · `합산 누적 투자 $1.4B`(USD 문자열만 합산, 원화는 제외 표기 `*원화 제외` 12px) · `평균 설립 2019년` · `국가 4개국`.
- 변화량 화살표, 스파크라인은 쓰지 않는다(근거 데이터 없음 — 벤치마크 "하지 말 것" 6).
- 숫자 카운트업 애니메이션 금지(값이 처음부터 정확히 보여야 한다).

### 5-7. 칩

| 변형 | 크기 | 기본 | 선택 | 용도 |
|---|---|---|---|---|
| 필터 칩 | 높이 36px(히트 44: `::before` 상하 4px 확장), 패딩 0 14px, 15px 500 | 배경 투명, `1px solid --sd-line-ui`, `ink-2`, radius 2px | 배경 `--sd-ink`, 글자 `--sd-on-ink` 600, 테두리 `--sd-ink`, 앞에 `check` 16px | 탐색 화면 분야/단계/국가 |
| 섹션 칩 | 높이 32px(히트 44), 패딩 0 12px, 13px 700 `letter-spacing .02em` | 배경 투명, 테두리 없음, `ink-3` | 배경 `--sd-ink`, 글자 `--sd-on-ink` | 상세 스티키 칩 내비(5-12) |
| 단계 배지(비인터랙티브) | 높이 22px, 패딩 0 6px, 13px 600 | `1px solid --sd-line-ui`, `ink-2`, radius 2px, 배경 없음 | — | "시리즈 B", "시드", "상장", "인수됨" |
| 상태 배지 | 높이 22px, 패딩 0 6px, 12–13px 600 | 미검증: `--sd-warning-soft` 배경 + `--sd-warning` 글자 + `circle-alert` 12px / 검증됨: `--sd-positive-soft` + `--sd-positive` | — | 링크·수치 옆 |

- 필터 칩 hover: `--sd-surface-2` 배경. disabled(결과 0건): `ink-3`, 테두리 `--sd-line`, 숫자 "(0)".
- 칩 그룹: `display: flex; flex-wrap: wrap; gap: 8px;` 섹션 칩만 가로 스크롤.
- 칩에 색 배경을 넣지 않는다(카테고리 색 금지).

### 5-8. 버튼

| 변형 | 스펙 |
|---|---|
| 기본(Primary) | 높이 48px(모바일)/44px(데스크톱), 패딩 0 20px, radius 4px, 배경 `--sd-ink`, 글자 `--sd-on-ink` 15px 700. hover: 배경 `--sd-ink-2`. 액센트 채움 버튼은 만들지 않는다 |
| 보조(Secondary) | 같은 크기, 배경 투명, `1px solid --sd-line-ui`, 글자 `ink` 15px 600. hover `--sd-surface-2` |
| 텍스트 링크 버튼 | 15px 700 `ink` + `arrow-right` 16px, 하단 1.5px `accent` 밑줄, offset 4px. 히트 높이 44 |
| 아이콘 버튼 | 44×44, 아이콘 20px `ink-2`, radius 4px. hover `--sd-surface-2`, 글자 `ink` |

### 5-9. 섹터 라벨 · 메타 구분자

- 섹터(정규화된 대분류, 예: "로보틱스·하드웨어"): 6×6px 정사각 `--sd-ink-3` 점 + 간격 6px + 13px 500 `ink-2`. 색은 쓰지 않는다.
- 원본 `category[]` 자유 태그는 상세 히어로 하단에만 `#태그` 13px `ink-3`로 나열(링크 시 탐색 검색어로).
- 메타 구분자: 가운뎃점 `·` 대신 `margin: 0 8px`의 3×3px `--sd-line-ui` 정사각 점(`::before`). 텍스트 복사 시 깨지지 않도록 시각 요소로만.

### 5-10. 상세 히어로

순서(모바일, 좌우 거터 20px, 위 여백 16px):

1. 키커: 섹터 라벨 · 국가 · `2026.10.22 호` 모노 12px `ink-3`.
2. 로고 72px(5-20) — 데스크톱에서는 회사명 왼쪽에 나란히(`grid-template-columns: 72px 1fr; gap: 20px`), 모바일에서는 위에 단독.
3. 회사명 `name_ko` `--sd-fs-display` 800 / 아래 `name_en` 15px 500 `ink-3`.
4. 태그라인 `--sd-fs-headline` 500(굵기 낮춤) `ink-2`, 최대 폭 `--sd-measure`.
5. 액션 행(위 20px): `[저장]` 보조 버튼(아이콘+텍스트) · `[공유]` 보조 버튼 · `[웹사이트 ↗]` 텍스트 링크 버튼. 모바일은 `display:grid; grid-template-columns: 1fr 1fr auto; gap: 8px`.
6. 팩트 그리드(위 24px): 위 2px `--sd-line-strong`. `grid-template-columns: repeat(2, 1fr)`(모바일) / `repeat(3, 1fr)`(≥640). 셀 패딩 12px 0, 셀 하단 1px `--sd-line`. 라벨 13px 500 `ink-3`, 값 17px 600 `ink`(`numClass`). 항목: 설립 · 본사 · 단계(배지) · 인원 · 누적 투자 · 기업가치(추정, 라벨 옆 "추정" 12px `warning`).
7. 신뢰 라벨 compact(5-17), 위 16px.

- 히어로 배경은 `--sd-bg` 그대로. 회사별 컬러 배경·그라디언트 배너 없음.

### 5-11. 섹션 구성(상세 본문)

- 섹션 7개: `요약 · 왜 지금 · 제품 · 경쟁 · 팀 · 투자 · 시장`. id: `summary, why-now, product, competition, team, funding, market`.
- 섹션 머리: 위 2px `--sd-line-strong`, 그 아래 12px에 모노 12px `ink-3` 번호(`01`–`07`) + 8px + 섹션 제목 `--sd-fs-title-2` 700. 섹션 사이 간격 40px(모바일) / 48px(데스크톱). `scroll-margin-top: var(--sd-anchor-offset)`.
- 본문 블록은 `max-inline-size: var(--sd-measure)`. 표·타임라인은 컬럼 전체 폭 사용.

### 5-12. 섹션 칩 내비 (스티키)

- `position: sticky; top: var(--sd-sticky-top); z-index: var(--sd-z-sticky); height: 48px;` 배경 `--sd-bg`, 하단 `box-shadow: var(--sd-shadow-1)`.
- 내부: `display:flex; gap: 4px; overflow-x: auto; scroll-snap-type: x proximity; padding-inline: var(--sd-gutter); scrollbar-width: none;` 오른쪽 끝 24px 페이드(`mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent)`)로 넘침을 알린다.
- 활성: 섹션 칩 선택 스타일(먹색 반전). 활성 판정은 IntersectionObserver `rootMargin: "-(anchor-offset) 0px -60% 0px"`. 활성 칩이 바뀌면 `scrollIntoView({inline:'center', block:'nearest'})`(reduced-motion이면 `behavior:'auto'`).
- 탭 → 해당 섹션으로 스크롤, `history.replaceState`로 `#/s/:id?sec=funding` 갱신은 IA 결정에 따른다.
- `role="tablist"`가 아니라 `<nav aria-label="섹션">` 안의 링크 목록 + `aria-current="true"`(앵커 내비이므로).
- 데스크톱 ≥1280: 칩 내비 대신 오른쪽 레일의 세로 목차(13px 500 `ink-3`, 활성 `ink` 700 + 좌측 2px `accent` 바)로 대체해도 된다 — 둘 중 하나만 노출.

### 5-13. 라벨 블록 (Smart Brevity)

```
왜 지금 ─────────────────────────────
Skild AI는 7월 시리즈 A로 3억 달러를 …
■ 촉매 1 …
■ 촉매 2 …
```

- 라벨 행: `display:flex; align-items:center; gap: 12px;` 라벨 텍스트 `--sd-fs-label` 700 `accent` + `flex:1; height:1px; background: var(--sd-line)` 라인. 라벨 아래 8px.
- 본문: `--sd-fs-body` 400 `ink`, 행간 1.75.
- 불릿: `list-style: none; padding-left: 18px;` 마커 `::before` 6×6px `--sd-ink-3` 정사각, `top: 0.72em`, 왼쪽 0. 항목 간 8px.
- 블록 간 간격 28px.
- 변형:
  - **숫자로 보면**: 본문 대신 `dl` 2열(`grid-template-columns: max-content 1fr; column-gap: 16px; row-gap: 8px`), dt 13px `ink-3`, dd 17px 600 `numClass`.
  - **에디터 한 줄**: 배경 `--sd-surface-2`, 패딩 16px 20px, 좌측 3px `--sd-line-strong`, 17px 500 `ink`, 아래 "— 에디터" 13px `ink-3`. radius 0.
  - **핵심 차별점/해자**: 배경 `--sd-surface-2`, 패딩 16px, 라벨은 `ink` 700(액센트 아님 — 블록당 액센트 라벨은 1개).
- 고정 라벨 문구(홈·상세 공통, 매일 같은 자리): `왜 지금` · `무엇을 하나` · `숫자로 보면` · `에디터 한 줄` · `더 보기`.

### 5-14. 투자 타임라인

```
2023.09  ■── 시드            $30M
         │   Sequoia Capital
         │   ▬▬
2024.07  ■── 시리즈 A        $300M      ← 최신 라운드: 노드·바 accent
             Lightspeed Venture Partners
             ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
```

- 그리드: `grid-template-columns: 64px 16px 1fr auto; column-gap: 12px;` 항목 간 20px.
- 날짜 열: 모노 12px 500 `ink-3`, `2024.07` 형식(원본 `2024-07` → `.` 치환), 노드와 같은 기준선.
- 축: 1px `--sd-line-strong` 세로선(노드 열 중앙), 마지막 항목 아래로는 그리지 않는다.
- 노드: 9×9px 정사각, 배경 `--sd-ink`. **최신 라운드**는 `--sd-accent`. 금액 미공개 라운드는 배경 없이 `1px dashed --sd-ink-3` 테두리.
- 본문: 단계 15px 700 `ink` / 리드 투자자 13px 500 `ink-2`.
- 금액: 오른쪽 정렬 `--sd-fs-data` 600 `numClass`. 미공개는 "미공개" 13px `ink-3`.
- 상대 규모 바: 본문 아래 4px, 높이 4px, `width: calc(amount / maxAmount * 100%)`(파싱 가능한 USD만, 최소 4px), 색 `--sd-ink-3`, 최신 라운드는 `--sd-accent`. 파싱 불가 시 바 생략. radius 0.
- 하단: "주요 투자자" 라벨(5-13) + 투자자명 나열 15px `ink-2`, 쉼표 구분(칩 아님).
- 요약 행(타임라인 위): `누적 $330M+ · 라운드 2회 · 기업가치(추정) $1.5B` 15px, 숫자 600.

### 5-15. 경쟁 비교

- 상단: "핵심 차별점" 블록(5-13 차별점 변형) — `key_differentiator`, 그 아래 "해자" 블록 — `moat`.
- 비교 목록(표 의미 → `<table>`로 마크업, 모바일은 CSS로 쌓음):
  - 데스크톱/≥640: `grid-template-columns: 180px 1fr;` 행 패딩 14px 0, 행 하단 1px `--sd-line`. 머리 행: "경쟁사" / "이 회사와의 차이" 13px 700 `ink-3`, 하단 2px `--sd-line-strong`.
  - 첫 행은 **이 회사 자신**(배경 `--sd-surface`, 이름 앞 3px `accent` 좌측 바) — 기준점.
  - 경쟁사명 15px 700 `ink`(라틴 그대로), 비교문 15px 400 `ink-2`.
  - 모바일(<640): 행마다 이름(15px 700) 위, 비교문 아래(간격 4px).
- 경쟁사 로고는 넣지 않는다(네트워크 요청 수 억제, 모노그램 남발 방지).

### 5-16. 창업자 카드 · 팀

- 목록: `display:grid; grid-template-columns: 1fr;` (≥640: `repeat(2, 1fr)`), gap 16px.
- 카드: 배경 없음, 위 1px `--sd-line`, 패딩 16px 0. `grid-template-columns: 40px 1fr; gap: 12px;`
  - 이니셜 타일 40px: 모노그램 규칙(5-20) 적용하되 팔레트는 항상 idx 7(먹색)로 통일 — 사람과 회사를 구분.
  - 이름 17px 700 `ink` + 직함 13px 500 `ink-3`(같은 줄, 넘치면 줄바꿈).
  - 배경 이력 15px `ink-2` 3줄 클램프 + "더 보기" 텍스트 버튼(13px 700, 펼침).
- 사진·원형 아바타는 쓰지 않는다(데이터에 없음, 생성 이미지 금지).
- `team_highlights`는 카드 목록 아래 라벨 블록 "팀의 강점"으로.

### 5-17. 신뢰 라벨

| 변형 | 위치 | 스펙 |
|---|---|---|
| compact | 홈 마스트헤드 아래, 상세 히어로 하단 | 한 줄 `display:flex; gap:6px; align-items:center;` `info` 16px `ink-3` + 13px 500 `ink-2`: "AI 리서치 기반 · 2026.10.22 작성 · 검증 필요 정보 포함". 날짜는 `.sd-num`. "검증 필요 정보 포함"은 `warning` 색 + 밑줄 점선(`text-decoration: underline dotted`) 버튼 → 누르면 상세 하단 block으로 스크롤(홈에서는 소개 시트) |
| block | 상세 본문 맨 끝, 관련 링크 위 | 배경 `--sd-surface`(경고색 면으로 칠하지 않는다 — 상시 노출 블록이 경고처럼 보이면 피로해진다), 위 2px `--sd-line-strong`, 패딩 20px. 제목 "이 프로필에 대해" 15px 700. 본문 15px `ink-2`: "AI가 공개 자료를 바탕으로 작성하고 에디터가 선정했습니다. 수치는 작성일(2026-04-27) 기준이며 이후 바뀌었을 수 있습니다." + 정의 목록: 작성일 / 출처 상태(검증됨 n · 미검증 n 배지) / 오류 제보(링크). |
| 인라인 미검증 | 수치·보도 옆 | 상태 배지(5-7) "미검증" |

- 미검증 언론 보도는 링크를 걸지 않고 "관련 보도(미검증)" 목록에 매체명 + 제목만 13px `ink-3`로 둔다(벤치마크 A12). 검증된 링크만 `arrow-up-right` + 본문 링크 스타일.
- 신뢰 라벨은 접거나 닫는 버튼을 두지 않는다(상시 표시).

### 5-18. 리스크 목록 (시장 섹션)

- 라벨 블록 "리스크" 아래 `<ol>`.
- 항목: `grid-template-columns: 32px 1fr; gap: 8px;` 패딩 12px 0, 하단 1px `--sd-line`.
- 번호: 모노 12px 600 `warning` `R1`, `R2` … (기준선 정렬).
- 본문 15px `ink`. 리스크 심각도 데이터가 없으므로 등급 색·게이지는 만들지 않는다.
- 기회(`opportunities`가 있으면) 목록은 같은 구조에 번호 `O1` `ink-3`.

### 5-19. 저장 버튼

| 변형 | 스펙 |
|---|---|
| 아이콘(리드, 상세 헤더) | 44×44 아이콘 버튼. 미저장: `bookmark` 라인 20px `ink-2`. 저장됨: `bookmark` fill `accent` + stroke `accent` |
| 라벨(상세 히어로) | 보조 버튼 + 아이콘 + "저장" / 저장됨이면 "저장됨"(글자 `ink`, 아이콘 `accent` 채움, 테두리 `--sd-ink`) |

- `aria-pressed="true|false"`, `aria-label="저장"`(라벨 고정, 상태는 pressed로 전달).
- 토글 시 토스트(5-22) "저장했어요 · 저장함 보기" / "저장을 취소했어요 · 되돌리기"(3초).
- 모션: 저장 시 아이콘 `scale(.85) → scale(1)` 200ms `--sd-ease-out` + fill 즉시. 취소 시 모션 없음. reduced-motion이면 모션 없음.
- 저장소 키는 기존 `saved_startups` 유지(벤치마크 #11).

### 5-20. 로고 타일 · 모노그램

**크기:** 24(아카이브 썸네일) / 32(컴팩트 행) / 40(리스트 행, 창업자) / 56(리드) / 72(상세 히어로). radius: ≤40px는 2px, ≥56px는 4px.

**폴백 체인(시각 규칙):** 처음부터 모노그램을 그리고, 이미지가 `load` + `naturalWidth >= 64`이면 그 위에 덮는다(opacity 0→1 120ms). 실패하면 모노그램 유지. 빈 흰 상자는 어떤 경우에도 보이지 않는다.

- 이미지 타일: 배경 `--sd-logo-bg`, `1px solid --sd-line`(inset `box-shadow: inset 0 0 0 1px var(--sd-line)`), 내부 패딩 = 크기×12%, `object-fit: contain`, `loading="lazy"`, `decoding="async"`, `width/height` 고정, `alt=""`(회사명이 옆에 텍스트로 있으므로).

**모노그램 규칙:**
- 색 인덱스: `name_en` 소문자·공백 제거 문자열의 djb2 해시 → `idx = hash % 7`(0–6). idx 7(먹색)은 사람용 예약.
  ```js
  const monoIndex = (s) => { let h = 5381; for (const c of s.toLowerCase().replace(/\s+/g, '')) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h % 7; };
  ```
- 글자: `name_en`이 공백으로 2단어 이상이면 첫 두 단어 머리글자 대문자 2자(`Skild AI` → `SA`), 한 단어면 첫 글자 1자(`Tessl` → `T`). 라틴 이름이 없으면 `name_ko` 첫 음절 1자. 숫자로 시작하면 그 숫자.
- 서체: Pretendard 800, `letter-spacing: -0.02em`. 크기 = 타일 × 0.44(1자) / × 0.36(2자). 중앙 정렬.
- 배경 `var(--sd-mono-{idx}-bg)`, 글자 `var(--sd-mono-{idx}-fg)`. 테두리 없음.
- `role="img"` + `aria-label="{name_ko} 로고"`는 회사명 텍스트가 옆에 없을 때만(아카이브 썸네일).

### 5-21. 하단 탭바 (모바일 <1024)

- `position: fixed; inset-inline: 0; bottom: 0; height: calc(56px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom);` 배경 `--sd-surface`, 위 1px `--sd-line`. 블러/반투명 없음.
- 탭 3개(오늘 / 탐색 / 저장) — IA가 4번째(예: 지난 호)를 정하면 같은 규칙으로 균등 분할.
- 탭: `flex:1; min-height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;` 아이콘 24px + 라벨 13px 500(한글 최소 크기 준수).
- 비활성: `ink-3`. 활성: 아이콘·라벨 `ink`, 라벨 700, 탭 상단에 2px × 24px `accent` 바(`::before`, 중앙). 저장 탭 아이콘은 저장 수가 1 이상이면 우상단에 6×6 `accent` 정사각 점(숫자 배지 없음).
- 본문 하단 패딩: `padding-bottom: calc(var(--sd-tabbar-h) + env(safe-area-inset-bottom) + 24px)`.
- 상세 화면에서도 탭바를 유지한다(뒤로 동선은 헤더). 키보드가 열린 검색 화면에서는 숨긴다.
- `<nav aria-label="주 메뉴">`, 활성 탭 `aria-current="page"`.

### 5-22. 토스트

- 위치: 탭바 위 12px(모바일) / 우하단 24px(데스크톱), 최대 폭 360px.
- 배경 `--sd-ink`, 글자 `--sd-on-ink` 15px 500, radius 4px, 패딩 12px 16px, `box-shadow: var(--sd-shadow-2)`. 액션 텍스트 버튼 15px 700, 밑줄 `accent`.
- 진입: translateY(8px)→0 + opacity 200ms. 3초 후 opacity 0 120ms. `role="status" aria-live="polite"`.

### 5-23. 빈 상태

- 컨테이너: 중앙 정렬, 위 64px, 최대 폭 320px.
- 구성: 라인 아이콘 40px `ink-3`(stroke 1.5) → 제목 `--sd-fs-title-3` 700 `ink`(위 16px) → 설명 15px `ink-2`(위 8px) → 보조 버튼(위 20px).
- 문구:
  - 저장함 비었음: `bookmark` / "아직 저장한 회사가 없어요" / "관심 가는 회사의 저장 버튼을 누르면 여기 모입니다." / [오늘의 이슈 보기]
  - 검색 결과 없음: `search` / "‘{검색어}’에 맞는 회사가 없어요" / "철자를 확인하거나 필터를 줄여 보세요." / [필터 초기화]
  - 해당 날짜 데이터 없음: `calendar-days` / "이 날은 발행하지 않았어요" / [가장 최근 호 보기]
  - 오프라인: `info` / "오프라인 상태예요" / "저장한 회사와 최근 본 호는 계속 읽을 수 있어요."
- 일러스트·캐릭터 이미지는 쓰지 않는다.

### 5-24. 스켈레톤 (로딩)

- 실제 레이아웃과 같은 크기의 `--sd-surface-2` 블록(radius 0, 텍스트 줄은 높이 = font-size × 0.8, 줄 간격 유지).
- 모션: opacity 1 ↔ 0.55, 1200ms `ease-in-out` 무한. reduced-motion이면 정지.
- 정적 JSON이라 대부분 즉시 렌더되므로 300ms 이상 걸릴 때만 노출(`setTimeout` 지연).

### 5-25. 탐색 화면 요소

- 검색 필드: 높이 48px, 배경 `--sd-surface`, `1px solid --sd-line-ui`, radius 4px, 좌측 `search` 20px `ink-3`(패딩-left 44px), 텍스트 17px(iOS 확대 방지 위해 16px 이상), placeholder `ink-3` "회사명, 분야, 키워드". focus: 테두리 `--sd-ink` + 포커스 링. 지우기 버튼 44×44 `x`.
- 검색어 하이라이트: `<mark>` 배경 `--sd-accent-soft`, 글자 `ink`(색 유지), 패딩 0 1px.
- 필터 그룹: 그룹 제목 13px 700 `ink-3` + 칩 그룹(5-7). 모바일은 "필터" 보조 버튼 → 바텀시트(배경 `--sd-surface`, 상단 radius 12px, 핸들 36×4 `--sd-line-ui` radius 2, `--sd-shadow-3`, 스크림 `--sd-scrim`, 하단 고정 [초기화][결과 23곳 보기] 버튼 행).
- 결과 수: "23곳" 모노 숫자 + 정렬 셀렉트(최신순/투자 규모순) 13px.
- **지난 호(아카이브):** 주 단위 그룹 머리 "10월 4주" 13px 700 `ink-3` + 1px 라인. 날짜 행: `grid-template-columns: 72px 1fr auto;` 높이 56px, 하단 1px `--sd-line`. 날짜 `10.22 수` 모노 15px 500 / 모노그램 24px × 최대 5개(겹치지 않고 gap 4px) / 우측 "5곳" 13px `ink-3` 또는 다 읽었으면 `check` `positive`. hover `--sd-surface-2`.

---

## 6. 모션

| 토큰 | 값 |
|---|---|
| `--sd-dur-1` | 120ms — 색·배경·opacity 상태 변화 |
| `--sd-dur-2` | 200ms — 진입(토스트, 페이지, 저장 아이콘) |
| `--sd-dur-3` | 320ms — 바텀시트 진입 |
| `--sd-ease-out` | `cubic-bezier(0.2, 0, 0, 1)` — 진입 |
| `--sd-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` — 퇴장 |
| `--sd-ease-std` | `cubic-bezier(0.2, 0, 0.2, 1)` — 상태 변화 |

| 대상 | 모션 |
|---|---|
| 행·칩·버튼 hover/active | `background-color, color` `--sd-dur-1` `--sd-ease-std` |
| 홈 → 상세 진입 | 상세 콘텐츠 `opacity 0→1` + `translateY(8px→0)` `--sd-dur-2` `--sd-ease-out`. 공유 요소(로고 morph) 트랜지션 없음 |
| 상세 → 홈 복귀 | 모션 없음 + 리스트 스크롤 위치 복원 |
| 섹션 칩 탭 → 스크롤 | `scrollIntoView({behavior:'smooth'})` |
| 헤더 축약 회사명 | opacity `--sd-dur-2` |
| 바텀시트 | `translateY(100%→0)` `--sd-dur-3` `--sd-ease-out`, 닫힘 `--sd-dur-2` `--sd-ease-in`. 스크림 opacity 동일 |
| 저장 | 5-19 |
| 로고 이미지 로드 | opacity 0→1 `--sd-dur-1` |

**금지:** 스크롤 패럴랙스, 숫자 카운트업, 스태거 진입 애니메이션(리스트 행이 순차 등장), 무한 마퀴 티커, 스프링 바운스, 가로 캐러셀 자동 넘김.

**reduced-motion:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

JS 스크롤에는 `matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`를 넘긴다. framer-motion을 계속 쓴다면 `<MotionConfig reducedMotion="user">`로 감싼다. 기존 `html { scroll-behavior: smooth; }`는 위 미디어쿼리로 무력화된다.

---

## 7. 반응형 레이아웃

| 범위 | 홈(오늘의 이슈) | 상세 | 내비 |
|---|---|---|---|
| <640 | 단일 칼럼, 거터 20 | 단일 칼럼, 팩트 2열 | 하단 탭바 |
| 640–1023 | 단일 칼럼 최대 680 중앙, 거터 32 | 단일 칼럼 최대 720, 팩트 3열 | 하단 탭바 |
| 1024–1279 | 12칼럼(gap 24): 마스트헤드 12 / 리드 8 + 레일 4(오늘의 숫자 1×4는 레일 대신 리드 위 12칼럼) / 리스트 8 + 레일 4 | **분할:** `grid-template-columns: 300px minmax(0,1fr); gap: 32px;` 좌측 컴팩트 리스트(스티키, 자체 스크롤) / 우측 상세 | 상단 내비(헤더) |
| ≥1280 | 위와 같음, 레일에 오늘의 숫자 2×2 + 지난 호 미니 목록 + 신뢰 라벨 | `grid-template-columns: 300px minmax(0,1fr) 220px; gap: 32px;` 우측 레일 = 세로 목차 + 핵심 팩트 요약 + 저장/공유 (스티키) | 상단 내비 |

- 1280에서 상세 중앙 칼럼: 1200 − 300 − 220 − 64 = 616px ≈ 18px 기준 34em(본문 폭 목표 범위 안).
- 분할 뷰의 좌측 리스트: `position: sticky; top: calc(var(--sd-header-h) + 24px); max-height: calc(100dvh - var(--sd-header-h) - 48px); overflow-y: auto; overscroll-behavior: contain;` 우측 하단 페이드 없음, 스크롤바 얇게(`scrollbar-width: thin`).
- 데스크톱에서는 홈에서 행을 눌러도 같은 `#/s/:id`로 이동하고, 상세 화면이 분할 뷰다(홈은 편집 그리드, 상세는 분할). 데스크톱 스티키 칩 내비는 ≥1280에서 숨기고 레일 목차를 쓴다.

---

## 8. ASCII 목업

### 8-1. 홈 — 375px

```
┌───────────────────────────────────────────┐
│ Startup Daily▪                    [⌕] [☾] │ 52px sticky, bg
├───────────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ 3px 먹선
│ ───────────────────────────────────────── │ 1px (이중 괘선)
│ NO.191 · 2026.10.22 WED                   │ mono 12 ink-3
│ 10월 22일 수요일             [‹] 10.22 [›]│ title-1 26/800
│ 오늘의 스타트업 5곳 · 약 6분 · 2/5 읽음      │ 13 ink-2
│ ⓘ AI 리서치 기반 · 10.22 작성 · 검증 필요…   │ 13, '검증 필요' warning
│                                           │
│ ───────────────────────────────────────── │ 1px 먹선
│ 에디터 픽 ▪ 로보틱스·하드웨어 · 미국          │ 13/700 accent + 메타
│ ┌────┐                                    │
│ │ SA │ 스킬드 AI                          │ 56px 모노그램 + title-2 22
│ └────┘ Skild AI                           │ 13 ink-3
│ 어떤 로봇에도 들어가는 범용 로봇 두뇌를        │ headline 20/700
│ 만든다                                     │
│ 왜 지금 ───────────────────────────────── │ label accent + rule
│ 7월 3억 달러 시리즈 A 이후 휴머노이드 제조…  │ 15 ink-2, 3줄 clamp
│ ┃ 소프트웨어가 하드웨어보다 빨리 범용화되는    │ 16/500, 좌 2px 먹선
│ ┃ 순간을 보여 주는 회사.  — 에디터            │
│ [시리즈 A]  │ 누적 $330M+  │ 설립 2023     │ 배지 + mono 600
│ 전체 읽기 →                          [🔖] │ 링크 accent 밑줄 / 44px
│ ───────────────────────────────────────── │
│                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ 2px 먹선
│ 오늘의 숫자                      2026.10.22 │
│ ┌──────────────────┬────────────────────┐ │
│ │ 소개 기업          │ 합산 누적 투자        │ │ 13 ink-3
│ │ 5곳               │ $1.4B              │ │ mono 24/600
│ ├──────────────────┼────────────────────┤ │
│ │ 평균 설립          │ 국가                 │ │
│ │ 2019년            │ 4개국               │ │
│ └──────────────────┴────────────────────┘ │
│                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 오늘의 기업                             5곳 │ title-3 18
│ 02 ┌──┐ 테슬 Tessl               $125M    │ 17/700 + 13 ink-3 | mono 15
│    │T │ 명세만 쓰면 코드를 생성·유지하는   누적 투자 │ 15 ink-2 2줄
│    └──┘ AI 네이티브 개발 플랫폼             │
│         ▪ 개발자도구 ▫ [시리즈 A] ▫ 영국      │ 13 ink-3
│ ───────────────────────────────────────── │ 1px line
│ ✓  ┌──┐ 카르테시아 Cartesia       $91M    │ 읽음: 체크, 이름 ink-2
│    │C │ 실시간 음성 AI를 위한 상태공간…        │
│    └──┘ ▪ AI·인프라 ▫ [시리즈 A] ▫ 미국      │
│ ───────────────────────────────────────── │
│ 04 …                                      │
│ 05 …                                      │
│                                           │
│ 어제의 5곳 (안 읽은 3곳)               ▾    │ 접힌 섹션 (IA)
├───────────────────────────────────────────┤
│   [▤]          [⌕]           [🔖]          │ 56px + safe-area
│   오늘          탐색           저장          │ 활성: 위 2px accent 바
└───────────────────────────────────────────┘
```
(괄호 아이콘 표기는 목업용 기호다. 실제는 SVG 라인 아이콘.)

### 8-2. 상세 — 375px

```
┌───────────────────────────────────────────┐
│ [←]  스킬드 AI (스크롤 후 노출)    [🔖] [⇪] │ 52px sticky
├───────────────────────────────────────────┤
│ ▪ 로보틱스·하드웨어 · 미국 · 2026.10.22 호    │ 키커
│ ┌──────┐                                  │
│ │  SA  │                                  │ 72px
│ └──────┘                                  │
│ 스킬드 AI                                   │ display 30/800
│ Skild AI                                  │ 15 ink-3
│ 어떤 로봇에도 들어가는 범용 로봇 두뇌를        │ headline 20/500 ink-2
│ 만든다                                     │
│ [🔖 저장 ] [⇪ 공유 ]   웹사이트 ↗           │ 48px 버튼
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 설립               │ 본사                   │ 13 ink-3
│ 2023               │ 피츠버그, 미국           │ 17/600
│ ───────────────────┼───────────────────── │
│ 단계               │ 인원                   │
│ [시리즈 A]          │ 50–100                │
│ ───────────────────┼───────────────────── │
│ 누적 투자           │ 기업가치 추정           │
│ $330M+             │ $1.5B                 │
│ ⓘ AI 리서치 기반 · 04.27 작성 · 검증 필요…   │
├───────────────────────────────────────────┤
│ [요약] 왜 지금  제품  경쟁  팀  투자  시…▸    │ 48px sticky (top 52)
├───────────────────────────────────────────┤ 활성 칩 = 먹색 반전
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 01  요약                                   │ mono 12 + title-2 22
│ 무엇을 하나 ───────────────────────────── │ label accent
│ 로봇 형태와 무관하게 쓸 수 있는 기초 모델…   │ body 17/1.75
│ 숫자로 보면 ───────────────────────────── │
│ 누적 투자     $330M+                       │ dl
│ 최근 라운드   시리즈 A · $300M · 2024.07    │
│ ┃ 에디터 한 줄                              │ surface-2, 3px 먹선
│ ┃ 소프트웨어가 하드웨어보다…  — 에디터         │
│                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 06  투자                                   │
│ 누적 $330M+ · 라운드 2회 · 가치(추정) $1.5B  │
│ 2023.09 ■── 시드                  $30M    │
│         │   Sequoia Capital                │
│         │   ▬                              │
│ 2024.07 ■── 시리즈 A              $300M    │ 최신 = accent 노드/바
│             Lightspeed Venture Partners    │
│             ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬            │
│ 주요 투자자 ────────────────────────────── │
│ SoftBank, Coatue, Bezos Expeditions, …     │
│                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 07  시장                                   │
│ 리스크 ────────────────────────────────── │
│ R1  휴머노이드 하드웨어 양산 지연…            │ mono warning
│ R2  …                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 이 프로필에 대해                            │ 신뢰 block (surface)
│ AI가 공개 자료를 바탕으로 작성하고…          │
│ 작성일 2026-04-27 · 출처 [검증됨 3][미검증 5]│
├───────────────────────────────────────────┤
│   오늘           탐색           저장         │ 탭바
└───────────────────────────────────────────┘
```

### 8-3. 홈 — 1280px (컨테이너 1200, 12칼럼 gap 24)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Startup Daily▪          오늘   탐색   저장                               [⌕ 회사명, 분야, 키워드   ] [☾] │ 64px
│                         ‾‾‾‾ (2px accent)                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ──────────────────────────────────────────────────────────────────────────────────────────────────────── │
│                                         Startup Daily▪                                                    │ display 44/800 중앙
│                       NO.191 — 2026년 10월 22일 수요일 — 5곳 · 약 6분              [‹] 10.22 수 [›]    │
│                   ⓘ AI 리서치 기반 · 2026.10.22 작성 · 검증 필요 정보 포함                                 │
│ ──────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ┌──── col 1–8 ─────────────────────────────────────────────────────┐ ┌──── col 9–12 (sticky) ───────────┐ │
│ │ 에디터 픽 ▪ 로보틱스·하드웨어 · 미국                                  │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ ┌────┐ 스킬드 AI  Skild AI                ┌──────────────────────┐ │ │ 오늘의 숫자            2026.10.22 │ │
│ │ └────┘                                    │┃ 소프트웨어가 하드웨어 │ │ │ 소개 기업     │ 합산 누적 투자     │ │
│ │ 어떤 로봇에도 들어가는                       │┃ 보다 빨리 범용화되는  │ │ │ 5곳          │ $1.4B            │ │
│ │ 범용 로봇 두뇌를 만든다                      │┃ 순간.  — 에디터       │ │ │ 평균 설립     │ 국가              │ │
│ │ (title-1 36/800)                          │ 단계    [시리즈 A]    │ │ │ 2019년       │ 4개국             │ │
│ │ 왜 지금 ─────────────────────────────     │ 누적    $330M+       │ │ │                                  │ │
│ │ 7월 3억 달러 시리즈 A 이후 … (전문)          │ 설립    2023         │ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ 전체 읽기 →                          [🔖]  └──────────────────────┘ │ │ 지난 호                    전체 → │ │
│ │ ─────────────────────────────────────────────────────────────────  │ │ 10.21 화  ▢▢▢▢▢          5곳 ✓  │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ 10.20 월  ▢▢▢▢▢          5곳    │ │
│ │ 오늘의 기업                                                    5곳  │ │ 10.17 금  ▢▢▢▢▢          5곳    │ │
│ │ 02 ┌──┐ 테슬 Tessl                                         $125M   │ │                                  │ │
│ │    └──┘ 명세만 쓰면 코드를 생성·유지하는 AI 네이티브 개발 플랫폼   누적 투자 │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │         ▪ 개발자도구 ▫ [시리즈 A] ▫ 영국                              │ │ 분야로 보기                        │ │
│ │ ─────────────────────────────────────────────────────────────────  │ │ [AI·인프라] [로보틱스·하드웨어]     │ │
│ │ ✓  ┌──┐ 카르테시아 Cartesia                                 $91M   │ │ [바이오·헬스] [핀테크] …           │ │
│ │ ─────────────────────────────────────────────────────────────────  │ │                                  │ │
│ │ 04 …                                                              │ │                                  │ │
│ │ 05 …                                                              │ └──────────────────────────────────┘ │
│ │ 어제의 5곳 (안 읽은 3곳) ▾                                          │                                      │
│ └───────────────────────────────────────────────────────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8-4. 상세 — 1280px (300 | 1fr | 220, gap 32)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Startup Daily▪          오늘   탐색   저장                               [⌕ 회사명, 분야, 키워드   ] [☾] │ 64px
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ 300px sticky ─────────┐  ┌──── 616px ───────────────────────────────┐  ┌─ 220px sticky ──────────┐ │
│ │ ← 10월 22일 수요일       │  │ ▪ 로보틱스·하드웨어 · 미국 · 2026.10.22 호  │  │ 목차                      │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━ │  │ ┌──────┐ 스킬드 AI                        │  │ ┃01 요약  (accent 바, ink)│ │
│ │▌01 ┌─┐ 스킬드 AI  $330M+ │  │ │  SA  │ Skild AI                        │  │  02 왜 지금               │ │
│ │▌   └─┘ 범용 로봇 두뇌…     │  │ └──────┘                                 │  │  03 제품                  │ │
│ │ ────────────────────── │  │ 어떤 로봇에도 들어가는 범용 로봇 두뇌를 만든다 │  │  04 경쟁                  │ │
│ │ 02 ┌─┐ 테슬       $125M  │  │ [🔖 저장] [⇪ 공유]  웹사이트 ↗             │  │  05 팀                    │ │
│ │    └─┘ 명세만 쓰면 코드…   │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │  06 투자                  │ │
│ │ ────────────────────── │  │ 설립 2023 │ 본사 피츠버그 │ 단계 [시리즈 A]  │  │  07 시장                  │ │
│ │ ✓  ┌─┐ 카르테시아  $91M   │  │ 인원 50–100│ 누적 $330M+ │ 가치(추정) $1.5B│  │ ━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ ────────────────────── │  │ ⓘ AI 리서치 기반 · 04.27 작성 · 검증 필요…   │  │ 핵심 숫자                 │ │
│ │ 04 …                    │  │                                          │  │ 누적 투자   $330M+       │ │
│ │ 05 …                    │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │ 최근 라운드 시리즈 A      │ │
│ │                         │  │ 01  요약                                  │  │ 기업가치   $1.5B 추정     │ │
│ │ (선택 행: surface 배경   │  │ 무엇을 하나 ─────────────────────────── │  │ ━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │  + 좌 3px accent 바)     │  │ 로봇 형태와 무관하게 쓸 수 있는 기초 모델을 │  │ [🔖 저장]                 │ │
│ │                         │  │ 만든다. … (body 18/1.75, 34em)            │  │ [⇪ 공유]                  │ │
│ │                         │  │ 숫자로 보면 ─────────────────────────── │  │ 웹사이트 ↗                │ │
│ │                         │  │ …                                        │  │                          │ │
│ │                         │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │                          │ │
│ │                         │  │ 04  경쟁                                  │  │                          │ │
│ │                         │  │ 경쟁사          │ 이 회사와의 차이           │  │                          │ │
│ │                         │  │ ━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━ │  │                          │ │
│ │                         │  │▌Skild AI        │ (기준점)                  │  │                          │ │
│ │                         │  │ Physical Intel. │ 범용 정책 모델 중심, …     │  │                          │ │
│ │                         │  │ Figure AI       │ 자체 하드웨어 수직통합 …    │  │                          │ │
│ └─────────────────────────┘  └──────────────────────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
(1024–1279: 우측 레일 제거, 스티키 섹션 칩 내비를 중앙 칼럼 상단에 둔다.)

---

## 9. 화면별 비주얼 노트

| 화면 | 노트 |
|---|---|
| 오늘의 이슈(홈) | 첫 화면(375×667 기준, 헤더 52 + 탭바 56 제외 559px)에 마스트헤드 + 리드 스토리의 헤드라인까지 보여야 한다. 마스트헤드 총 높이 ≤ 180px. 액센트는 워드마크 점 · "에디터 픽" · "왜 지금" 라벨 · CTA 밑줄 · 활성 탭 바 5곳뿐이다. |
| 상세 | 히어로부터 팩트 그리드까지 1.2 화면 이내. 본문은 `--sd-measure`. 섹션마다 먹선 2px로 지면 단 나눔. 섹션 내 액센트 라벨은 블록당 1개. |
| 탐색 | 검색 필드가 최상단 포커스 대상. 필터 칩은 먹색 반전으로 선택 표시. 결과는 컴팩트 행(날짜 열). 지난 호는 같은 화면 하단 섹션. |
| 저장 | 컴팩트 행 + 행 우측에 저장 해제 아이콘 버튼(44×44, `bookmark` fill `accent`). 상단에 "12곳 · 안 읽음 4" 메타, 정렬 셀렉트(저장순/분야별), "내보내기" 텍스트 버튼(JSON). 비었으면 빈 상태. |
| 다크모드 | 같은 레이아웃, 먹선은 `#ECE7DC`(밝은 선)로 반전되어 지면 괘선 느낌 유지. 로고 이미지 타일은 `--sd-logo-bg #ECE7DC`(밝은 종이 타일). 그림자 대신 테두리. |

---

## 10. 구현 체크리스트 (구현자용)

1. `index.html`: Playfair/DM Sans 링크 삭제 → Pretendard Variable(jsDelivr) + IBM Plex Mono(Google Fonts) + preconnect 2개. 테마 인라인 스크립트, `theme-color` 메타 2개. `apple-mobile-web-app-status-bar-style`은 `default` 유지.
2. `src/styles/global.css`: 1-3의 토큰 블록 + 2-1의 베이스 + 6의 reduced-motion + `:focus-visible` 전역 규칙. 기존 `#f5f5f7`, `#1a1a2e`, `rgba(124,58,237,…)` 제거.
3. 모든 인라인 `style={{ color: '#888' }}` 류 하드코딩 색 제거 → `text-sd-ink-3` 등 유틸리티 또는 `var(--sd-*)`.
4. `src/components/icons.jsx`(4장 목록), `Monogram.jsx`/`LogoTile.jsx`(5-20), `TrustLabel.jsx`(5-17), `numClass` 헬퍼(2-1).
5. 이모지 사용처 전부 교체(📍🗓👥🌐🇰🇷⚠☆★).
6. `public/manifest.json`의 `theme_color`/`background_color` → `#F3EFE6`.

## 11. 검증 결과

| 항목 | 기준 | 결과 |
|---|---|---|
| 본문 대비 | 4.5:1 | 최저 `ink-3`/`surface-2` 라이트 4.60, 다크 4.85 — 통과 (본문 `ink` 13.76 이상) |
| 큰 텍스트·UI 경계 | 3:1 | `line-ui` 최저 3.13(다크/surface-2) — 통과. `line`은 장식 전용으로 제한 |
| 액센트 텍스트 | 4.5:1 | 라이트 4.71–5.68, 다크 5.76–6.97 — 통과 |
| 모노그램 8색 | 4.5:1 | 7.11–15.33 — 통과 |
| 터치 타깃 | 44px | 아이콘 버튼 44, 탭 56, 행 76, 칩 히트 44, 날짜 화살표 44 — 통과 |
| 한글 최소 글자 | 13px | 한글 13px 이상, 12px는 모노 ASCII 전용 — 통과 |
| 다크 바탕 | 순흑 금지 | `#111317` — 통과 |
| 보라 그라디언트 | 금지 | 사용 없음 |
