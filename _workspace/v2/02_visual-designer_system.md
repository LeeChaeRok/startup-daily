# v2 비주얼 아이덴티티 · 디자인 시스템 — 비주얼 디자이너 (2026-11-14)

입력: `00_lead_audit.md`, `00_current/` 캡처, `01_market-researcher_market.md`, `01_product-benchmarker_patterns.md`, `01_lead_ref-notes.md`, `01_refs/`.
기존 `_workspace/01~18` 문서는 참고하지 않았다. 지금의 "베이지 종이 + 굵은 검은 선 + 붉은 강조 + 고정폭 숫자"는 **실패 사례로만** 다룬다.
목업: `02_visual-mock.html` (375px 홈·상세 상단, 라이트/다크).

> IA 메모: 화면 이름은 리서치 두 문서가 공통으로 권한 **오늘 · 탐색 · 공모전 · 보관함** 4탭을 기준으로 했다. ux-architect의 IA 문서가 나오면 이름은 그쪽을 따른다. "오늘의 5곳"을 *대표 1곳 크게 + 4곳 행*(시장 리서치)으로 할지 *같은 무게 카드 5장*(벤치마커)으로 할지는 IA에서 정한다. 이 시스템은 둘 다 지원한다(§3.6 대표 카드의 `compact` 변형). 목업은 앞의 안으로 그렸다.

---

## 1. 방향

### 후보 A — "조용한 브리핑" (Quiet Briefing)
- 무드: 거의 무채색인 밝은 회백 배경 위에 흰 카드, 짙은 잉크 글자, 잉크 블루 강조 하나. 선 대신 여백과 표면 단계로 나눈다. 글꼴은 Pretendard 한 가족.
- 참고: Apple News Today(날짜 + 큰 제목), Linear 2026 개편(테두리를 줄이고 본문을 앞에), 토스(표면 3단, 큰 숫자), Readwise Reader(읽기 기둥).
- 장점: 휴대폰에서 가장 잘 읽히고, 다크 모드가 자연스럽고, 컴포넌트 하나하나가 단정해서 "통일감"을 만들기 쉽다. 단점: 개성이 약해질 수 있다 → 강조색·숫자 타이포·로고 처리로 정체성을 만든다.

### 후보 B — "따뜻한 매거진" (Warm Magazine)
- 무드: 아이보리 바탕, 제목은 한글 명조(Noto Serif KR / 마루부리), 본문은 고딕, 테라코타 강조. 잡지 표지 같은 큰 제목과 사진 대신 큰 숫자.
- 참고: 롱블랙, Monocle, Stratechery.
- 장점: 첫인상이 강하고 "매체" 느낌. 단점: ① 지금의 베이지·붉은 강조와 너무 가까워 "또 같은 느낌"이 된다. ② 한글 명조는 375px에서 21px 이하로 내려가면 획이 가늘어 흐려지고, 회사명·숫자·칩이 많은 데이터 화면에서 두 가족이 섞이면 다시 "통일되지 않는다"가 된다. ③ 다크에서 명조가 번진다.

### 선택: A "조용한 브리핑"
- **독자에게 맞다.** 출근길 지하철에서 5~10분 읽는 한국 직장인(시장 리서치 세그먼트 A)에게 가장 중요한 건 훑는 속도와 피로도다. 단일 고딕, 넉넉한 행간, 2줄 행이 그 일을 한다.
- **"결제할 품질"은 장식이 아니라 일관성에서 나온다**(두 리서치 공통 결론). A는 컴포넌트 문법을 카드·행·칩·시트 4종으로 줄이기에 가장 유리하다.
- **AI 생성 콘텐츠의 신뢰.** 차분한 무채색 + 정확한 숫자 표기 + 조용한 출처 표시는 "과장하지 않는 매체"로 읽힌다. 붉은 강조는 경고·속보 느낌이라 신뢰와 반대다.
- **정체성 장치 3개**로 "템플릿 같음"을 피한다: ① 잉크 블루 `#2D4BC8` 하나(채도는 높지만 탁하지 않은, 보라로 기울지 않은 청색) ② 크고 단단한 tabular 숫자(팩트·금액이 시각 앵커) ③ 분야 색으로 통일한 로고 모노그램(사진이 없는 서비스의 시각 자산).

이름: **"잉크 블루 브리핑"**. 토큰 접두어는 구현 호환을 위해 `--sd-` 그대로 쓴다.

---

## 2. 토큰

### 2.1 색 — 표

대비비는 WCAG 2.x 공식으로 계산했다(배경 → bg / surface / surface-2 순).

| 토큰 | 라이트 | 다크 | 용도 | 대비(라이트 · 다크) |
|---|---|---|---|---|
| `--sd-bg` | `#F5F5F3` | `#111214` | 앱 배경(카드 바깥) | — |
| `--sd-surface` | `#FFFFFF` | `#1A1B1E` | 카드, 행 그룹, 탭바, 상세 본문 | — |
| `--sd-surface-2` | `#EDEDEA` | `#25272B` | 칩 바탕, 세그먼트 트랙, 팩트 묶음, 스켈레톤, 눌림 | — |
| `--sd-surface-raised` | `#FFFFFF` | `#2C2E33` | 바텀시트, 토스트, 메뉴(다크는 한 단계 더 밝게) | — |
| `--sd-ink` | `#15161A` | `#EDEEF0` | 제목·본문 | 16.6/18.1/15.4 · 16.1/14.8/12.9 |
| `--sd-ink-2` | `#474A52` | `#B6B9C0` | 보조 본문(태그라인, 요약) | 8.1/8.9/7.6 · 9.5/8.8/7.6 |
| `--sd-ink-3` | `#666971` | `#9498A0` | 메타, 라벨, 비활성 탭 | 5.0/5.5/4.7 · 6.4/5.9/5.1 |
| `--sd-line` | `#E6E6E2` | `#2A2C30` | 행 사이 1px 헤어라인(장식, 대비 요구 없음) | — |
| `--sd-line-ui` | `#83868D` | `#6E727A` | 입력창·보조 버튼 테두리(3:1 필요) | 3.3/3.6/3.1 · 3.9/3.6/3.1 |
| `--sd-accent` | `#2D4BC8` | `#8EA1FF` | 링크, 활성 탭, 주요 버튼, 포커스 | 6.5/7.1/6.1 · 7.8/7.1/6.2 |
| `--sd-accent-ink` | `#FFFFFF` | `#0E1330` | 강조색 채움 위 글자 | 7.1 · 7.5 |
| `--sd-accent-soft` | `#E8ECFB` | `#232B4D` | 선택된 칩, "새 소식" 띠 바탕 | accent 글자 6.0 · ink 글자 11.9 |
| `--sd-positive` | `#1D7A4C` | `#5FCB92` | 확인됨(✓ 출처), 성장 수치 | 4.9/5.3/4.5 · 9.3/8.6/7.4 |
| `--sd-positive-soft` | `#E2F2E8` | `#163323` | 확인 배지 바탕 | positive 글자 4.6 · 6.8 |
| `--sd-warning` | `#9A5700` | `#F2B24E` | 마감 임박(D-3 이내), 추정치 꼬리표 | 5.2/5.6/4.8 · 10.0/9.2/8.0 |
| `--sd-warning-soft` | `#FBEFD9` | `#3A2C14` | 마감 임박 배지 바탕 | warning 글자 4.9 · 7.3 |
| `--sd-warning-ink` | `#FFFFFF` | `#1A1206` | 마감 "오늘" 채움 배지 글자 | 5.6 · 9.9 |
| `--sd-focus` | `#2D4BC8` | `#8EA1FF` | 포커스 링(2px + 2px 간격) | — |
| `--sd-scrim` | `rgb(12 13 16 / .40)` | `rgb(0 0 0 / .56)` | 시트 뒤 어둡게 | — |
| `--sd-logo-bg` | `#FFFFFF` | `#FFFFFF` | 로고 이미지 바탕(흰 배경 로고 대비) | — |
| `--sd-logo-ring` | `rgb(21 22 26 / .08)` | `rgb(255 255 255 / .10)` | 로고 1px 안쪽 테두리 | — |

규칙
- 다크는 순흑 대신 `#111214`. 표면은 bg < surface < surface-2 < raised 순으로 한 단계씩 밝아진다. **다크에서는 선 대신 표면 차이**로 구분하고 헤어라인은 행 그룹 안에서만 쓴다.
- `ink-3`은 다크 `surface-raised`(시트) 위에서 4.7:1로 여유가 적다. 시트 안에서 13px 이하 메타는 `ink-2`를 쓴다.
- 강조색은 화면당 "주인공 1개"(주요 버튼 또는 활성 탭 + 링크)에만. 제목·배경에 칠하지 않는다.
- 위험(빨강) 색은 두지 않는다. 오류 상태는 토스트 문구로 알리고, 마감은 warning 계열로 처리한다.

### 2.2 분야 색 (9개 + 기타)

`src/lib/sectors.js`의 9개 풀 키와 1:1. 코드가 이미 `var(--sd-sector-${key})`를 쓰므로 이름을 유지하고 `-soft`만 추가한다.
쓰임은 **딱 세 곳**: ① 분야 라벨 앞 6px 점 ② 로고 없는 회사의 모노그램(soft 바탕 + 진한 글자) ③ 탐색의 분야 묶음 카드 아이콘. 카드 배경·제목에 분야 색을 칠하지 않는다.

| 키 | 라벨 | 라이트 fg / soft | 다크 fg / soft | fg 대비(surface · soft) 라이트 / 다크 |
|---|---|---|---|---|
| `health` | 헬스·바이오 | `#B8325A` / `#FBE9EF` | `#F28AA5` / `#3A1E27` | 5.8·4.9 / 7.3·6.4 |
| `robotics` | 로보틱스·제조 | `#A84B0C` / `#FCEBDD` | `#F2A066` / `#3A2618` | 5.7·4.9 / 8.2·6.8 |
| `mobility` | 모빌리티·우주·국방 | `#0A6A9E` / `#E1F0F8` | `#6CC0EC` / `#16303D` | 5.9·5.1 / 8.5·6.8 |
| `climate` | 기후·에너지·푸드 | `#2D7432` / `#E5F2E3` | `#86CF7C` / `#1D3320` | 5.7·5.0 / 9.2·7.3 |
| `fintech` | 핀테크 | `#0C6F64` / `#DDF1EE` | `#5FD0C1` / `#14322F` | 6.1·5.2 / 9.3·7.4 |
| `infra` | AI 인프라·개발도구 | `#3F5A7A` / `#E6ECF3` | `#9DB4D3` / `#232C38` | 7.1·6.0 / 8.1·6.7 |
| `enterprise` | 엔터프라이즈 | `#80600F` / `#F5EDD6` | `#E2C063` / `#352D17` | 5.8·5.0 / 9.8·7.8 |
| `consumer` | 컨슈머·교육·게임 | `#A0368F` / `#F7E5F3` | `#E994DA` / `#36203A` | 6.1·5.1 / 8.0·6.8 |
| `ai` | AI 모델·에이전트 | `#6646BF` / `#EEE8FA` | `#B9A2F5` / `#2A2442` | 6.6·5.5 / 7.8·6.7 |
| `other` | 기타 | = `ink-3` / `surface-2` | = `ink-3` / `surface-2` | 5.5·4.7 / 5.9·5.1 |

모든 fg는 본문 텍스트로 써도 AA(4.5:1)를 넘는다. 그래도 분야 라벨 글자는 `ink-2`로 쓰고 색은 점에만 준다(색 9개가 글자로 흩어지면 다시 산만해진다).

### 2.3 타이포그래피

**글꼴: Pretendard Variable 단일 가족.**
- CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css`
- 이유: 한글·라틴·숫자의 획 굵기와 높이가 맞고, 가변 굵기(400~800)라 굵기 단계로 위계를 만들 수 있다. tabular 숫자(`tnum`)를 지원한다. 명조나 두 번째 가족을 섞지 않는 것이 이번 개편의 핵심(통일감).
- 대체 스택: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`.

**스케일 6단계** (이 밖의 크기는 쓰지 않는다)

| 토큰 | 크기/행간 | 굵기 | 자간 | 용도 |
|---|---|---|---|---|
| `--sd-text-display` | 28/36 (≥1024: 32/40) | 700 | -0.024em | 페이지 제목("오늘의 스타트업 5곳"), 상세 회사명 |
| `--sd-text-title` | 21/30 | 700 | -0.018em | 섹션 제목, 대표 카드 회사명, 팩트 숫자 |
| `--sd-text-body-lg` | 17/29 (1.7) | 400 / 600 | -0.01em | 상세 본문(400), 행의 회사명·공모전 제목(600) |
| `--sd-text-body` | 15/24 (1.6) | 400 / 600 | -0.006em | 태그라인, 요약, 버튼·칩 라벨(600) |
| `--sd-text-meta` | 13/18 | 500 / 600 | 0 | 메타, 팩트 라벨, 눈썹 제목(eyebrow), 날짜 |
| `--sd-text-micro` | 11/14 | 600 | 0.01em | 탭바 라벨, 배지(YC·NEW·D-3) |

- 굵기는 400(본문) · 500(메타) · 600(라벨·행 제목) · 700(제목·숫자) 넷만. 800은 워드마크에만.
- 한글 줄바꿈: `word-break: keep-all; overflow-wrap: anywhere; line-break: strict;` (단어 중간에서 끊기지 않게).
- 읽기 폭: 상세 본문 기둥 최대 **640px**(17px 기준 한글 약 36자). 모바일은 화면 폭 − 40px.
- 문단 간격: 본문 17px 기준 `margin-block: 0 16px`. 소제목 위 32px, 아래 8px.
- 말줄임: 행 태그라인 1줄, 대표 카드 태그라인 2줄, "왜 지금" 미리보기 3줄(`-webkit-line-clamp`).

**숫자** — 고정폭 글꼴을 쓰지 않는다.
- 모든 숫자 영역에 `font-variant-numeric: tabular-nums lining-nums;` (`.num` 유틸리티, 팩트·금액·D-day·날짜·카운트).
- 팩트 숫자는 `title`(21/700) + 단위·꼬리는 같은 줄 `body`(15/500, ink-3). 예: **$28.1M** <small>누적</small>.
- 표기: 달러 `$120M`, `$1.7M`, `$650K`(K·M·B 대문자, 소수 1자리까지). 원화 `240억 원`(띄어 씀). 비공개는 `비공개`(ink-3). 추정은 숫자 뒤 `추정` 배지(warning soft). 날짜는 목록에서 `11.14`, 상세에서 `2026년 11월`. 라운드는 영문 표기 유지(`Series A`, `Seed`, `Pre-seed`).
- 천 단위 쉼표, 범위는 en dash(`10–20배`).

### 2.4 간격 · 반경 · 그림자

간격(4 기반): `--sd-space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-7` 32 · `-8` 40 · `-9` 56 · `-10` 72.
- 화면 좌우 여백 20px(모바일), 카드 안쪽 20px, 행 세로 패딩 14px, 섹션 사이 40px(모바일)·56px(데스크톱), 섹션 제목과 내용 사이 12px.

반경: `--sd-radius-xs` 6(배지) · `-sm` 10(입력창·작은 버튼) · `-md` 14(버튼·토스트) · `-lg` 18(카드·행 그룹·팩트 묶음) · `-xl` 24(바텀시트 위 모서리) · `-pill` 999(칩·세그먼트).
로고 반경은 크기 비례: `round(size × 0.26)` → 40px=10, 44px=12, 48px=12, 64px=16.

그림자(라이트만, 다크는 `none` + 표면 단계)
- `--sd-shadow-1`: `0 1px 2px rgb(16 17 20 / .04), 0 0 0 1px rgb(16 17 20 / .04)` — 카드, 행 그룹(선 대신 아주 옅은 윤곽).
- `--sd-shadow-2`: `0 4px 16px rgb(16 17 20 / .08), 0 0 0 1px rgb(16 17 20 / .04)` — 스크롤 시 헤더, 데스크톱 호버 카드.
- `--sd-shadow-3`: `0 12px 40px rgb(16 17 20 / .16)` — 바텀시트, 토스트.
- 다크: `--sd-shadow-1/2`는 `0 0 0 1px rgb(255 255 255 / .04)`(윤곽만), `-3`은 `0 12px 40px rgb(0 0 0 / .5)`.

### 2.5 모션

| 토큰 | 값 | 무엇에 |
|---|---|---|
| `--sd-dur-1` | 120ms | 누름(scale .98), 색 변화, 호버 |
| `--sd-dur-2` | 200ms | 페이드, 아코디언 열림, 토스트 등장, 저장 아이콘 튕김 |
| `--sd-dur-3` | 320ms | 바텀시트, 화면 전환(View Transition), 헤더 접힘 |
| `--sd-ease` | `cubic-bezier(.2,.8,.2,1)` | 들어오는 모든 것(기본) |
| `--sd-ease-exit` | `cubic-bezier(.4,0,1,1)` | 사라지는 것(시트 닫힘, 토스트 퇴장) — 지속시간은 들어올 때의 70% |

- 움직이는 것은 이것뿐: 눌림 축소, 저장 아이콘 채움 + 1.0→1.18→1.0 튕김, 시트 translateY, 아코디언(`grid-template-rows: 0fr→1fr` + 내용 opacity), 토스트 올라옴(8px + 페이드), 스켈레톤 맥동(opacity .55↔1, 1.2s), 카드→상세 로고·회사명 View Transition(지원 브라우저만).
- 하지 않는 것: 스크롤 시차, 숫자 카운트업, 무한 반복 장식, 그라디언트 흐름.
- `prefers-reduced-motion: reduce`: transform·튕김·맥동 제거, 모든 전환을 120ms opacity로 대체, View Transition 끔.

### 2.6 붙여 넣을 CSS 토큰

```css
/* ============================================================
   Startup Daily v2 — "잉크 블루 브리핑" tokens
   Spec: _workspace/v2/02_visual-designer_system.md
   ============================================================ */
:root {
  color-scheme: light;
  /* surfaces */
  --sd-bg: #F5F5F3;
  --sd-surface: #FFFFFF;
  --sd-surface-2: #EDEDEA;
  --sd-surface-raised: #FFFFFF;
  /* ink */
  --sd-ink: #15161A;
  --sd-ink-2: #474A52;
  --sd-ink-3: #666971;
  /* lines */
  --sd-line: #E6E6E2;
  --sd-line-ui: #83868D;
  /* accent + semantic */
  --sd-accent: #2D4BC8;
  --sd-accent-ink: #FFFFFF;
  --sd-accent-soft: #E8ECFB;
  --sd-positive: #1D7A4C;
  --sd-positive-soft: #E2F2E8;
  --sd-warning: #9A5700;
  --sd-warning-soft: #FBEFD9;
  --sd-warning-ink: #FFFFFF;
  --sd-focus: #2D4BC8;
  --sd-scrim: rgb(12 13 16 / 0.40);
  --sd-logo-bg: #FFFFFF;
  --sd-logo-ring: rgb(21 22 26 / 0.08);
  --sd-header-bg: rgb(245 245 243 / 0.86);   /* blurred sticky header */
  --sd-tabbar-bg: rgb(255 255 255 / 0.92);
  --sd-toast-action: #AFC0FF;

  /* sectors: fg (dot, monogram letter) / soft (monogram tile) */
  --sd-sector-health: #B8325A;      --sd-sector-health-soft: #FBE9EF;
  --sd-sector-robotics: #A84B0C;    --sd-sector-robotics-soft: #FCEBDD;
  --sd-sector-mobility: #0A6A9E;    --sd-sector-mobility-soft: #E1F0F8;
  --sd-sector-climate: #2D7432;     --sd-sector-climate-soft: #E5F2E3;
  --sd-sector-fintech: #0C6F64;     --sd-sector-fintech-soft: #DDF1EE;
  --sd-sector-infra: #3F5A7A;       --sd-sector-infra-soft: #E6ECF3;
  --sd-sector-enterprise: #80600F;  --sd-sector-enterprise-soft: #F5EDD6;
  --sd-sector-consumer: #A0368F;    --sd-sector-consumer-soft: #F7E5F3;
  --sd-sector-ai: #6646BF;          --sd-sector-ai-soft: #EEE8FA;
  --sd-sector-other: var(--sd-ink-3); --sd-sector-other-soft: var(--sd-surface-2);

  /* type */
  --sd-font: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
             "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
  --sd-text-display: 700 28px/36px var(--sd-font);
  --sd-text-title: 700 21px/30px var(--sd-font);
  --sd-text-body-lg: 400 17px/29px var(--sd-font);
  --sd-text-body: 400 15px/24px var(--sd-font);
  --sd-text-meta: 500 13px/18px var(--sd-font);
  --sd-text-micro: 600 11px/14px var(--sd-font);
  --sd-track-display: -0.024em;
  --sd-track-title: -0.018em;
  --sd-track-body-lg: -0.01em;
  --sd-track-body: -0.006em;
  --sd-track-meta: 0;
  --sd-track-micro: 0.01em;
  --sd-measure: 640px;

  /* space */
  --sd-space-1: 4px;  --sd-space-2: 8px;  --sd-space-3: 12px; --sd-space-4: 16px;
  --sd-space-5: 20px; --sd-space-6: 24px; --sd-space-7: 32px; --sd-space-8: 40px;
  --sd-space-9: 56px; --sd-space-10: 72px;
  --sd-gutter: 20px;
  --sd-section-gap: 40px;

  /* radius */
  --sd-radius-xs: 6px; --sd-radius-sm: 10px; --sd-radius-md: 14px;
  --sd-radius-lg: 18px; --sd-radius-xl: 24px; --sd-radius-pill: 999px;

  /* elevation */
  --sd-shadow-1: 0 1px 2px rgb(16 17 20 / 0.04), 0 0 0 1px rgb(16 17 20 / 0.04);
  --sd-shadow-2: 0 4px 16px rgb(16 17 20 / 0.08), 0 0 0 1px rgb(16 17 20 / 0.04);
  --sd-shadow-3: 0 12px 40px rgb(16 17 20 / 0.16);

  /* motion */
  --sd-dur-1: 120ms; --sd-dur-2: 200ms; --sd-dur-3: 320ms;
  --sd-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --sd-ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* sizes */
  --sd-header-h: 52px;
  --sd-tabbar-h: 56px;      /* + env(safe-area-inset-bottom) */
  --sd-touch: 44px;
}

@media (min-width: 1024px) {
  :root {
    --sd-text-display: 700 32px/40px var(--sd-font);
    --sd-gutter: 32px;
    --sd-section-gap: 56px;
  }
}

/* dark: system preference unless the user forced light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* same block as [data-theme="dark"] below */ }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --sd-bg: #111214;
  --sd-surface: #1A1B1E;
  --sd-surface-2: #25272B;
  --sd-surface-raised: #2C2E33;
  --sd-ink: #EDEEF0;
  --sd-ink-2: #B6B9C0;
  --sd-ink-3: #9498A0;
  --sd-line: #2A2C30;
  --sd-line-ui: #6E727A;
  --sd-accent: #8EA1FF;
  --sd-accent-ink: #0E1330;
  --sd-accent-soft: #232B4D;
  --sd-positive: #5FCB92;
  --sd-positive-soft: #163323;
  --sd-warning: #F2B24E;
  --sd-warning-soft: #3A2C14;
  --sd-warning-ink: #1A1206;
  --sd-focus: #8EA1FF;
  --sd-scrim: rgb(0 0 0 / 0.56);
  --sd-logo-ring: rgb(255 255 255 / 0.10);
  --sd-header-bg: rgb(17 18 20 / 0.86);
  --sd-tabbar-bg: rgb(26 27 30 / 0.92);
  --sd-toast-action: #8EA1FF;

  --sd-sector-health: #F28AA5;      --sd-sector-health-soft: #3A1E27;
  --sd-sector-robotics: #F2A066;    --sd-sector-robotics-soft: #3A2618;
  --sd-sector-mobility: #6CC0EC;    --sd-sector-mobility-soft: #16303D;
  --sd-sector-climate: #86CF7C;     --sd-sector-climate-soft: #1D3320;
  --sd-sector-fintech: #5FD0C1;     --sd-sector-fintech-soft: #14322F;
  --sd-sector-infra: #9DB4D3;       --sd-sector-infra-soft: #232C38;
  --sd-sector-enterprise: #E2C063;  --sd-sector-enterprise-soft: #352D17;
  --sd-sector-consumer: #E994DA;    --sd-sector-consumer-soft: #36203A;
  --sd-sector-ai: #B9A2F5;          --sd-sector-ai-soft: #2A2442;

  --sd-shadow-1: 0 0 0 1px rgb(255 255 255 / 0.04);
  --sd-shadow-2: 0 0 0 1px rgb(255 255 255 / 0.06);
  --sd-shadow-3: 0 12px 40px rgb(0 0 0 / 0.5);
}

@media (prefers-reduced-motion: reduce) {
  :root { --sd-dur-1: 1ms; --sd-dur-2: 120ms; --sd-dur-3: 120ms; }
}

/* base */
html { background: var(--sd-bg); color: var(--sd-ink);
  font-family: var(--sd-font); -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility; }
body { font: var(--sd-text-body); letter-spacing: var(--sd-track-body);
  word-break: keep-all; overflow-wrap: anywhere; line-break: strict; }
.num { font-variant-numeric: tabular-nums lining-nums; }
:focus-visible { outline: 2px solid var(--sd-focus); outline-offset: 2px; border-radius: inherit; }
```

> 구현 메모: `prefers-color-scheme: dark` 안의 블록은 실제 파일에서는 `[data-theme="dark"]` 블록과 같은 선언을 그대로 복제한다(CSS는 선택자 공유로 미디어쿼리를 합칠 수 없다). Tailwind v4 `@theme`에는 색을 `--color-*`로 다시 노출하지 말고 `var(--sd-*)`를 참조만 한다.
> 이름 호환: 기존 코드의 `--sd-bg / surface / surface-2 / ink / ink-2 / ink-3 / line / line-ui / accent / accent-ink / accent-soft / positive(-soft) / warning(-soft) / focus / logo-bg / scrim / sector-*`는 **이름 유지, 값만 교체**. `--sd-line-strong`, `--sd-surface-lift`, `--sd-indicator`, `--sd-on-ink`, `--sd-mono-0~7-*`는 폐기(쓰는 곳은 각각 `line`, `surface`, `accent-soft`, `accent-ink`, 분야 모노그램으로 바꾼다).

---

## 3. 컴포넌트

공통 상태 규칙(모든 인터랙티브 요소)
- **hover**(포인터 기기만, `@media (hover:hover)`): 배경을 한 단계(`surface` → `surface-2` 50% 혼합, `color-mix(in srgb, var(--sd-surface-2) 50%, transparent)`).
- **active(누름)**: `transform: scale(.98)` + 배경 `surface-2`, `--sd-dur-1`.
- **focus-visible**: 2px `--sd-focus` 외곽선 + 2px 간격, 요소 반경을 따름.
- **disabled**: opacity .4, 포인터 없음. 텍스트로 이유를 알 수 있을 때만 쓰고 가능하면 숨긴다.
- 터치 타깃 최소 44×44(아이콘 버튼은 시각 크기 24여도 히트 영역 44).
- 아이콘: 이모지 금지. 1.75px 선 굵기, 24px 그리드, 둥근 끝(round cap/join) 라인 아이콘을 인라인 SVG로(Lucide 계열과 같은 문법). 채움은 "저장됨"·활성 탭에서만.

### 3.1 앱 헤더 (모바일)
- 높이 52, 좌우 패딩 8(아이콘 버튼 44가 가장자리에서 12 안쪽에 오도록), `position: sticky; top: 0`.
- 배경 `--sd-header-bg` + `backdrop-filter: saturate(1.4) blur(16px)`. 맨 위에서는 테두리·그림자 없음, 8px 이상 스크롤하면 하단 1px `--sd-line`이 페이드인(`--sd-dur-2`).
- 왼쪽: 워드마크 "Startup Daily" — Pretendard 800, 18px, -0.03em, `ink`. "Daily" 뒤에 6px 강조색 원(브랜드 점) 하나. 이미지 로고 없음.
- 오른쪽: 검색 아이콘 버튼 1개만(설정·저장은 보관함 탭으로).
- 상세 화면 변형: 왼쪽 뒤로(chevron-left), 가운데 회사명(스크롤로 회사명이 헤더 밑으로 사라진 뒤에만 `body` 600으로 페이드인), 오른쪽 공유·더보기(···). 헤더 아래 2px 읽기 진행선(`accent`, 트랙 없음).

### 3.2 하단 탭바 (모바일·태블릿 <1024)
- 높이 56 + `env(safe-area-inset-bottom)`, 배경 `--sd-tabbar-bg` + blur 16, 상단 1px `--sd-line`.
- 4개 등폭: 오늘(calendar/sun) · 탐색(search/compass) · 공모전(trophy) · 보관함(bookmark). 아이콘 24 위, 라벨 `micro` 아래, 간격 4.
- 비활성: 아이콘·라벨 `ink-3`. 활성: 아이콘 채움 `accent`, 라벨 `ink` 600. 인디케이터 막대·알약 없음(색과 채움만으로).
- 보관함에 새 소식이 있으면 아이콘 오른쪽 위 7px `accent` 점(숫자 없음).
- 상세 화면에서는 탭바를 숨기고 §3.20 하단 행동 바로 바꾼다.

### 3.3 페이지 제목
- 구조: 눈썹(eyebrow) → 제목 → 한 줄 부제. 위 여백 8(헤더 아래), 아래 24.
- 눈썹: `meta` 600, `ink-3`. 예: `11월 14일 금요일`.
- 제목: `display`, `ink`. 예: `오늘의 스타트업 5곳`.
- 부제: `body`, `ink-2`, 메타 최대 2개를 ` · `로. 예: `약 6분 · AI가 공개 자료로 조사`.
- 같은 문법을 모든 탭 첫 화면에 쓴다(탐색: 눈썹 없음 + "탐색", 공모전: 눈썹 `11월 14일 갱신` + "공모전" + `접수 중 554건 · 이번 주 마감 183건`).

### 3.4 섹션 헤더 (유일한 한 가지 방식)
- 한 줄: 왼쪽 제목 `title`(21/700), 오른쪽 선택적 링크 `body` 600 `accent` + chevron-right 16(예: `10곳 모두`). 링크 히트 영역 44 높이.
- 제목 아래 선택적 설명 1줄 `meta` `ink-3`(예: `Summer · Fall 2026 배치`).
- 위 간격 `--sd-section-gap`, 아래 12. **선·배경 상자·색 막대 없음.**
- 상세 본문 안의 섹션 제목도 같은 크기·굵기(§3.9).

### 3.5 회사 행 (목록 공통 · 오늘·YC·탐색·보관함)
- 레이아웃: `[로고 44] 12 [본문 1fr] 12 [오른쪽 숫자 auto]`, 세로 패딩 14, 최소 높이 72.
- 1줄: 회사명 `body-lg` 600 `ink`(1줄 말줄임) + 선택적 배지 1개(YC / NEW) 이름 뒤 6px.
- 2줄: 태그라인 `body` `ink-2` 1줄 말줄임.
- 오른쪽: 숫자 1개 `body` 600 `ink-2` `.num`(누적 투자, 없으면 단계, 둘 다 없으면 비움). 1줄 기준선에 맞춘다.
- 행 그룹: `surface` + `radius-lg` + `shadow-1`, 안쪽 좌우 16. 행 사이 1px `--sd-line`을 **로고 오른쪽에서 시작**(inset 72px).
- 읽음: 회사명·숫자를 `ink-3`으로, 로고 opacity .72. "읽음" 칩·체크 아이콘은 붙이지 않는다 — 색만 흐리게(조용한 진행).
- 상태: hover 배경 혼합, active scale .985(그룹 안에서 행만), focus 링은 행 전체(반경 12).
- 분야 표시는 행에서 하지 않는다(대표 카드·상세·필터에서만). 탐색에서 분야가 섞인 결과일 때만 2줄 앞에 6px 분야 점을 붙인다.

### 3.6 대표 "오늘" 카드 (featured)
- `surface`, `radius-lg`, `shadow-1`, 패딩 20, 카드 전체가 링크.
- 1행: 로고 48 + 12 + 분야 라벨(6px 점 + `meta` 600 `ink-2`) · 국가(`meta` `ink-3`). 메타 2개까지.
- 회사명 `title`, 위 14.
- 태그라인 `body-lg` 400 `ink-2`, 2줄 말줄임, 위 4.
- "왜 지금": 위 16, 라벨 `meta` 600 `accent` "왜 지금" + 아래 본문 `body` `ink` 3줄 말줄임. 상자·인용선 없음.
- 팩트 줄: 위 16, 숫자 2개를 가로로 — 각 `title`급이 아니라 `body-lg` 700 `.num` + 라벨 `meta` `ink-3`(`누적 투자 $120M` · `Series B · 2026.11`). 사이 24 간격, 구분선 없음.
- 상태: hover `shadow-2`, active scale .99.
- `compact` 변형(5장을 같은 무게로 쌓을 때): 로고 40, 회사명 `body-lg` 600, 태그라인 1줄, "왜 지금" 2줄, 팩트 줄 생략, 카드 사이 12. 왼쪽 위 순번 `meta` 700 `ink-3` `01`~`05`.

### 3.7 회사 프로필 헤더 (상세 1층)
- 순서: 로고 64 → 16 → 회사명 `display` → 4 → 영문명 · 웹사이트(`body` `ink-2`, 웹사이트는 `accent` + external 아이콘 14) → 12 → 배지 줄(분야 배지 + YC 배지 있으면, 최대 2개) → 20 → 태그라인 `body-lg` 600 `ink`(= 한 줄 요약) → 24 → 팩트 묶음(§3.10) → 32 → "왜 지금" 섹션(§3.9, 기본 펼침).
- 역할 한 줄(ForRoleLine, 역할을 골랐을 때만): 팩트 묶음 다음, `accent-soft` 바탕 `radius-md` 패딩 14·16, 라벨 `meta` 600 `accent` "창업자 입장에서" + `body` `ink`.
- 신뢰 한 줄(1층 끝): `meta` `ink-3`: `출처 7개 · 웹사이트 확인 11월 14일` + positive 체크 아이콘 14. 탭하면 출처 시트.
- 로고·회사명은 목록에서 이어지는 View Transition 이름(`view-transition-name: logo-<id>`, `name-<id>`).

### 3.8 섹션 목차 (상세)
- 가로로 넘치는 칩 줄 금지. 헤더의 회사명(또는 현재 섹션명 "월리 헬스 · 팀")을 탭하면 목차 바텀시트(§3.17)가 뜬다. 목차 행 = 섹션명 `body-lg` 600 + 첫 줄 미리보기 `meta` `ink-3`.

### 3.9 프로필 섹션 / 아코디언 (상세 2층)
- 섹션 제목 행: `title` + 오른쪽 chevron-down 20 `ink-3`, 높이 최소 56, 전체가 버튼(`aria-expanded`).
- 닫힘: 제목 아래 미리보기 2줄 `body` `ink-2`(line-clamp 2). 열림: chevron 180° 회전(`--sd-dur-2`), 본문 `body-lg` 400 `ink`, 문단 간격 16.
- 섹션 사이 32 간격 + 1px `--sd-line`(풀폭이 아니라 본문 폭만큼). 이 헤어라인이 상세에서 쓰는 유일한 구분선.
- 기본 펼침: "왜 지금". 나머지(제품·경쟁·팀·투자·시장·한국에서는·출처)는 닫힘으로 시작, 사용자가 연 상태는 세션 동안 기억.
- 내부 하위 요소:
  - 불릿: 6px 둥근 점 `ink-3`, 들여쓰기 20, 항목 사이 8.
  - 경쟁사: "이름 + 한 줄 비교" 행(이름 `body` 600, 비교 `body` `ink-2`), 행 사이 12, 선 없음.
  - 투자 타임라인: 왼쪽 8px 점(최신만 `accent`, 나머지 `line-ui` 테두리 원) + 2px 세로선 `--sd-line`, 행 = 날짜 `meta` `.num` `ink-3` / 단계·금액 `body` 600 `.num` / 리드 투자자 `meta` `ink-2`.
  - 팀: 이름 `body` 600 + 역할 `meta` `ink-3` 한 줄, 배경 설명 `body` `ink-2`.
  - 출처: 번호 `[1]` `meta` `.num` `accent` + 매체·날짜 + verified면 positive 체크.

### 3.10 핵심 숫자 (facts)
- 2×2 그리드, 바탕 `surface-2`, `radius-lg`, 패딩 20, 열 간격 16, 행 간격 20. 칸 사이 선 없음.
- 칸: 라벨 `meta` 500 `ink-3`(예: `누적 투자`) → 4 → 값 `title` 700 `.num` `ink`(예: `$28.1M`) → 보조 `meta` `ink-3` 1줄(예: `Series A $25M · 2026.10`).
- 4칸 고정 순서: 누적 투자 / 최근 라운드 / 설립 / 본사. 값이 없으면 `비공개`를 `title` 대신 `body-lg` 600 `ink-3`으로(칸을 지우지 않는다 — 위치가 늘 같아야 훑는다).
- 추정 값: 값 뒤 `추정` 배지(§3.13 warning-soft).
- 숫자를 탭하면 근거 출처 시트(값에 점선 밑줄 없음 — 칸 전체 버튼, 오른쪽 위 info 아이콘 14 `ink-3`).
- ≥1024: 4×1 한 줄.

### 3.11 칩 · 필터
- 높이 36(히트 44: 위아래 4 투명 패딩), 좌우 패딩 14, `radius-pill`, 라벨 `body` 600(15px).
- 기본: 바탕 `surface-2`, 글자 `ink-2`, 테두리 없음.
- 선택: 바탕 `ink`, 글자 `surface`(라이트: 검정 알약 / 다크: 흰 알약). 체크 아이콘 없음.
- 필터 시트 열기 칩: 맨 앞, sliders 아이콘 16 + "필터", 적용된 필터 수가 있으면 `필터 2`(숫자 `.num`), 선택 상태 스타일.
- 칩 줄은 한 줄 가로 스크롤, 끝에 24px 페이드 마스크로 넘침을 알린다. **두 줄 이상 쌓지 않는다**(데스크톱도).
- 분야 칩은 라벨 앞 6px 분야 점.

### 3.12 세그먼트 컨트롤
- 트랙: `surface-2`, `radius-pill`, 높이 40, 패딩 3. 세그먼트 2~3개 등폭.
- 선택 세그먼트: `surface`(다크 `surface-raised`) 알약 + `shadow-1`, 글자 `ink` `body` 600. 비선택 글자 `ink-3`.
- 선택 알약이 미끄러져 이동(`--sd-dur-2` `--sd-ease`). 키보드는 좌우 화살표(`role="tablist"`).
- 쓰는 곳: 보관함 "회사 · 공모전", 공모전 정렬 시트 안. 그 외 화면 상단에 세그먼트를 쌓지 않는다.

### 3.13 버튼
| 종류 | 높이 | 모양 | 기본 | hover | active | disabled |
|---|---|---|---|---|---|---|
| primary | 52(모바일 하단 바) / 44(본문) | `radius-md`, 좌우 20 | 바탕 `accent`, 글자 `accent-ink` `body` 600 | 밝기 −6%(`color-mix(... black 6%)`) | scale .98 | opacity .4 |
| secondary | 44 | `radius-md` | 바탕 `surface-2`, 글자 `ink` | 바탕 `line` 혼합 | scale .98 | opacity .4 |
| ghost | 44 | `radius-md` | 투명, 글자 `accent` `body` 600 | 바탕 `accent-soft` | scale .98 | opacity .4 |
| icon | 44×44(시각 24) | `radius-pill` | 투명, 아이콘 `ink-2` | 바탕 `surface-2` | scale .94 | opacity .4 |
- 테두리 있는 버튼은 만들지 않는다(각진 테두리 상자 = 현재의 투박함). 예외: 입력창만 `line-ui` 1px.
- 한 화면에 primary는 1개.
- 저장 버튼(icon 변형): 비저장 bookmark 선, 저장됨 bookmark 채움 `accent` + 튕김 + 토스트 "저장했어요 · 되돌리기".

### 3.14 배지
- 공통: 높이 20, 좌우 패딩 6, `radius-xs`, 글자 `micro`(11/600), 아이콘 없음.
- **YC**: YC 주황 같은 외부 브랜드색은 쓰지 않는다. 바탕 `surface-2`, 글자 `ink` 700, 텍스트 `YC S26`(배치 약어, `.num`). 목록 행에서는 `YC`만.
- **분야**: 6px 분야 점 + 라벨 `micro` `ink-2`, 바탕 `surface-2`(상세 헤더에서만 상자형, 다른 곳은 점+텍스트).
- **NEW**(새 소식·오늘 추가): 바탕 `accent-soft`, 글자 `accent`, `새 소식`/`NEW`.
- **D-day(공모전)**: 너비 고정 44, 높이 24, `meta` 700 `.num` 가운데 정렬.
  - 오늘 마감: 바탕 `warning`, 글자 `warning-ink`, 텍스트 `오늘`.
  - D-1~D-3: 바탕 `warning-soft`, 글자 `warning`, `D-2`.
  - D-4 이상: 바탕 `surface-2`, 글자 `ink-2`, `D-12`.
  - 마감 지남: 글자 `ink-3`, 바탕 없음, `마감`.
- **추정**: 바탕 `warning-soft`, 글자 `warning`, `추정`.
- **확인됨**: positive 체크 아이콘 14 + `meta` `positive` "확인됨"(배지 상자 없이).

### 3.15 공모전 행
- 레이아웃: `[D-day 배지 44] 12 [본문 1fr] 8 [저장 아이콘 44]`, 세로 패딩 14.
- 1~2줄: 제목 `body-lg` 600 `ink`, 2줄 말줄임.
- 다음 줄: 메타 최대 2개 `meta` `ink-3`: `주최(1줄 말줄임, 최대 14자)` · `최고 100만 원`(`.num`, 상금 없으면 `상장`·`상품` 등 prize_kind). 주제·대상은 상세로.
- 날짜는 행에 반복하지 않는다 — 날짜 그룹 헤더("오늘 마감 · 이번 주 · 다음 주 · 그 이후")가 sticky로 붙는다. 그룹 헤더 = `meta` 600 `ink-2` + 오른쪽 건수 `.num` `ink-3`, 높이 36, 바탕 `--sd-header-bg` blur.
- 행 그룹 문법은 회사 행과 같다(surface 카드 + inset 헤어라인 64px).

### 3.16 빈 상태
- 가운데 정렬, 위아래 패딩 56. 라인 아이콘 32 `ink-3`(원형 배경 64 `surface-2`) → 16 → 제목 `body-lg` 600 `ink` → 4 → 설명 `body` `ink-2` 최대 2줄 → 20 → ghost 또는 secondary 버튼 1개.
- 문구는 다음 행동을 말한다. 예: 저장 없음 "아직 저장한 회사가 없어요 / 회사 화면의 책갈피를 누르면 여기에 모여요 / [오늘의 5곳 보기]". 검색 결과 없음 "‘핀테크 · 시리즈 C’ 조건에 맞는 회사가 없어요 / [필터 1개 지우기]".
- 오늘 5곳 완료 상태도 같은 문법(아이콘 check-circle positive): "오늘 다섯 곳 끝 / 내일 아침 8시에 새로 와요".

### 3.17 바텀시트
- 바탕 `surface-raised`, 위 모서리 `radius-xl`, `shadow-3`, 뒤 `--sd-scrim`.
- 상단 그립 36×4 `line-ui` 40% 투명, 위 8. 제목 행 높이 56: 제목 `title` 왼쪽, 닫기 icon 버튼 오른쪽.
- 내용 패딩 20, 최대 높이 `calc(100dvh - 64px)`, 내부 스크롤. 하단 고정 행동 영역(필터 시트: secondary "초기화" + primary "252곳 보기" `.num`), safe-area 포함.
- 열림: translateY(100%)→0 `--sd-dur-3` `--sd-ease`, 스크림 opacity 0→1 `--sd-dur-2`. 닫힘 `--sd-ease-exit` 220ms. 아래로 끌어 닫기, Esc 닫기, 포커스 가둠.
- ≥1024: 같은 내용이 가운데 모달(폭 480, `radius-xl` 사방) 또는 필터는 목록 레일 위 팝오버(폭 360)로.

### 3.18 토스트
- 하단 탭바 위 12, 좌우 20, 최대 폭 400 가운데. 높이 48, `radius-md`, 바탕 `ink`(라이트) / `surface-raised`(다크), 글자 `surface`(라이트)/`ink`(다크) `body` 500.
- 오른쪽 행동 1개 `body` 600, 색 `--sd-toast-action`(라이트 `#AFC0FF` — 검은 토스트 위라 밝은 청색 / 다크 `#8EA1FF`). 대비 라이트 10.2:1, 다크 5.6:1.
- 들어옴: translateY(8px)+opacity 0 → 0 `--sd-dur-2`. 4초 뒤 사라짐(행동이 있으면 6초). 동시에 1개만. `role="status"`.

### 3.19 스켈레톤
- 실제 레이아웃과 같은 모양: 로고 자리 = 같은 반경 사각, 텍스트 줄 = 높이 = 글자 크기 × 0.7, `radius-xs`, 너비 92% / 64%.
- 색 `surface-2`, 맥동 opacity .55↔1 1.2s `ease-in-out` 무한(감속 모드에서 정지).
- 300ms 안에 데이터가 오면 스켈레톤을 보여주지 않는다(깜빡임 방지).

### 3.20 하단 행동 바 (상세)
- 높이 64 + safe-area, 배경 `--sd-tabbar-bg` blur, 상단 1px `--sd-line`, 좌우 패딩 16.
- 왼쪽 저장 icon 버튼(44), 오른쪽 primary 버튼이 나머지 폭 전부: `다음 · 사즈지능` + arrow-right 20. 마지막 회사에서는 `오늘 끝 · YC 보기`.
- 글자 크기·공유·읽음 버튼을 두지 않는다(공유·글자 크기는 헤더 ···).

### 3.21 로고 & 폴백 (모노그램)
- 컨테이너: 정사각, 반경 `round(size × 0.26)`, 바탕 `--sd-logo-bg`(흰색, 다크에서도), 안쪽 1px `--sd-logo-ring`(`box-shadow: inset 0 0 0 1px`). 이미지 `object-fit: contain`, 패딩 = size × 0.12.
- 크기 4개만: 40(compact·검색 결과) / 44(행) / 48(대표 카드) / 64(상세).
- **폴백 규칙(로고 URL 없음 또는 로드 실패)**: 같은 모양 컨테이너, 바탕 `--sd-sector-<key>-soft`, 글자 `--sd-sector-<key>`, 테두리 없음.
  - 글자: `name_en`의 첫 라틴 문자 대문자 1자(예: Sazhi → `S`). `name_en`이 없거나 라틴이 아니면 `name_ko` 첫 음절 1자.
  - 글꼴 Pretendard 700, 크기 = size × 0.42(44→18px), 자간 -0.02em, 가운데.
  - 색은 **분야로만** 결정한다(해시·무작위 금지). 분야를 모르면 `other`(ink-3 / surface-2).
- 이미지 로드 실패는 `onError`에서 즉시 폴백으로 바꾸고, 깨진 이미지 아이콘을 보이지 않는다.

---

## 4. 레이아웃 그리드

### 4.1 모바일 (기준 375px, 320~639px)
- 좌우 여백 20 → 콘텐츠 폭 335. 4열 그리드(열 간격 12)이지만 실제로는 1열 + 팩트 2열만 쓴다.
- 세로 리듬: 헤더 52 → 페이지 제목(위 8, 아래 24) → 섹션 사이 40 → 마지막 섹션 아래 탭바 높이 + 24 여백.
- 카드·행 그룹은 콘텐츠 폭 가득(좌우 20 여백 유지). 화면 끝까지 붙이는 풀블리드 카드는 쓰지 않는다.
- 가로 스크롤은 칩 줄 1곳만 허용(콘텐츠 페이지 가로 스크롤 금지).

### 4.2 태블릿 (640~1023px)
- 단일 기둥 640 가운데, 하단 탭바 유지. 팩트 4×1.

### 4.3 데스크톱 (≥1024px)
- **상단 바**(높이 60, 콘텐츠 최대 폭 1120 가운데): 왼쪽 워드마크, 가운데-왼쪽 탭 4개(텍스트 `body` 600, 활성 `ink` + 아래 2px `accent` 밑줄, 비활성 `ink-3`), 오른쪽 검색창(폭 280, `surface-2`, `radius-pill`). 하단 탭바 없음.
- **2단 "목록 레일 + 읽기 기둥"**: 최대 폭 1120 = 레일 360 + 간격 48 + 기둥 640(+여유 72).
  - 오늘: 레일 = 페이지 제목 + 오늘의 5곳(compact 행) + YC 접힘 + 공모전 3건. 기둥 = 선택된 회사 상세(처음 열면 대표 회사). 레일은 `position: sticky; top: 76px`, 자체 스크롤.
  - 탐색·공모전·보관함: 같은 틀(레일 = 검색·칩 줄·결과 목록, 기둥 = 상세). 표(table) 레이아웃 금지.
- **3번째 단 없음.** 팩트·목차는 기둥 안 1층(§3.7, §3.10)에 있고, 목차는 기둥 위 sticky 헤더의 회사명 클릭 → 팝오버.
- 상세 하단 행동 바는 데스크톱에서 기둥 상단 헤더 오른쪽 버튼(저장 icon + primary "다음 회사")으로 이동.
- 1440 이상에서도 폭을 늘리지 않는다(바깥은 `bg`).

---

## 5. 일관성 규칙 (지금의 어색함을 막는 장치)

1. **구분은 여백 → 표면 → 헤어라인 순서.** 2px 이상 선, 검은 선, 섹션 위 굵은 룰 금지. 헤어라인(`--sd-line` 1px)은 행 그룹 안(inset)과 상세 섹션 사이에만.
2. **섹션 헤더는 §3.4 한 가지.** 색 라벨·대문자 영문·밑줄·배경 띠 등 다른 섹션 머리 금지.
3. **컨테이너 문법 4종:** 카드(대표·compact) · 행 그룹 · 칩 · 시트. 새 상자 모양을 만들기 전에 4종 중 하나로 표현할 수 있는지 먼저 본다. 한 화면에서 같은 위계의 블록은 같은 컨테이너를 쓴다(대표 카드만 상자, 나머지 선 — 같은 혼용 금지).
4. **행 하나에 메타 최대 2개**, 행 높이 최대 2줄(공모전 제목만 2줄 + 메타 1줄 허용). 분야·국가·단계·금액을 한 줄에 다 늘어놓지 않는다.
5. **글자 크기는 6단계, 굵기는 4단계, 색은 ink 3단계 + accent.** 13px 회색 메타를 여러 줄 쌓지 않는다.
6. **숫자는 `.num`(tabular lining) + §2.3 표기법.** 고정폭 글꼴 금지. 금액 단위·라운드 표기를 화면마다 바꾸지 않는다(유틸 함수 하나: `formatMoney`, `formatRound`, `formatDday`).
7. **강조색은 화면당 하나의 주인공.** primary 버튼 1개, 링크, 활성 탭, "왜 지금" 라벨. 그 외 장식에 쓰지 않는다. 분야 색은 점·모노그램·분야 아이콘에만.
8. **반경은 토큰 6개만**, 모서리가 각진 버튼·칩·세그먼트 금지(입력창 10, 그 외 14 이상 또는 알약).
9. **테두리 버튼 금지**(입력창만 테두리). 버튼 종류는 4개.
10. **아이콘은 한 세트**(1.75px 라인, 24 그리드). 이모지·컬러 아이콘·일러스트 금지.
11. **로고 폴백은 분야 색 모노그램 한 규칙.** 무작위 파스텔 금지.
12. **고지는 한 줄.** AI 고지·데이터 범위를 상자로 반복하지 않는다. 상세 1층 끝 신뢰 한 줄 + 오늘 화면 맨 아래 한 줄(`meta` `ink-3`).
13. **다크는 토큰으로만.** 컴포넌트 CSS에 색 리터럴(`#…`, `rgb(…)`) 금지 — 린트로 `app.css`에서 `#[0-9a-f]{3,6}` 검색 시 0건이어야 한다(토큰 파일 제외).
14. **모션은 §2.5 토큰만.** 컴포넌트별 임의 `transition: .3s ease` 금지.
15. **화면당 주인공 하나**(오늘 = 5곳, 상세 = 1층 요약, 탐색 = 결과, 공모전 = 마감 목록). 두 번째 주인공이 필요하면 섹션 헤더 아래 접어서 시작.

---

## 6. 화면별 비주얼 노트

- **오늘**: 페이지 제목 → 대표 카드 → 행 그룹 4곳 → (완료 시 빈 상태 문법의 "오늘 다섯 곳 끝") → 섹션 "YC 새 배치"(행 그룹 3곳 + `10곳 모두`) → 섹션 "마감 임박 공모전"(공모전 행 1~3건, `공모전 전체`) → 맨 아래 신뢰 한 줄. 역할 묻기 인라인 카드는 첫 상세를 닫고 돌아왔을 때 대표 카드 아래에 `accent-soft` 카드로 한 번.
- **상세**: 헤더(뒤로····) → 1층(프로필 헤더·팩트·역할 한 줄·왜 지금·신뢰 한 줄) → 2층 아코디언 → 하단 행동 바.
- **탐색**: 페이지 제목 "탐색" → 검색창(높이 48, `surface-2`, `radius-pill`, 검색 아이콘 20) → 칩 한 줄(필터 · YC · 분야 상위 5) → 결과 수 `meta` `ink-3` → 행 그룹. 검색 전에는 분야 묶음 카드 2열(`surface`, `radius-lg`, 분야 모노그램 32 + 라벨 `body` 600 + 개수 `meta` `.num`).
- **공모전**: 페이지 제목 → 칩 한 줄(필터 · 대학생 · 상금 있음 · 정렬) → sticky 날짜 그룹 + 공모전 행.
- **보관함**: 페이지 제목 "보관함" → 이번 주 읽은 날 7칸 점(지름 8, 읽은 날 `accent`, 안 읽은 날 `surface-2`, 오늘은 링) → 세그먼트 "회사 · 공모전" → 행 그룹 → 맨 아래 설정 목록(행 문법, chevron-right).

---

## 7. 검증 체크리스트 (QA용)
- [ ] 본문·메타 대비 4.5:1, 큰 글자·UI 경계 3:1 — §2.1·§2.2 표의 값 그대로인지 계산기로 확인
- [ ] 터치 타깃 44 이상(칩 36은 투명 패딩으로 44)
- [ ] 다크에서 `#000` 없음, 그림자 대신 표면 단계
- [ ] 375px에서 콘텐츠 가로 스크롤 0(칩 줄 제외)
- [ ] `app.css`에 색 리터럴 0건, 임의 transition 0건
- [ ] 숫자 영역 모두 `.num`, 고정폭 글꼴 0건
- [ ] 로고 없는 회사 = 분야 색 모노그램, 실패 이미지 아이콘 노출 0건
- [ ] `prefers-reduced-motion`에서 transform 애니메이션 0건
