# 12. Android 앱 1.0 기획·IA: 개인화, 영어판 선례 분석, 첫 화면, 정체성, 앱 골격

- 작성: ux-architect / 2026-10-30
- 상태: 설계 (코드 미수정)
- 입력:
  - `12_market-researcher_launch.md` (이하 **R12**)
  - `12_product-benchmarker_android.md` (이하 **B12**, 카드 번호 #A1 등)
  - `12_lead_current-notes.md` (이하 **N12**)
  - `06_korea-lens_design.md` (**06**), `09_app-monetization_design.md` (**09**), `10_completeness_roadmap.md` (**10**)
  - 코드: `src/screens/*.jsx`, `src/components/Onboarding.jsx`, `src/lib/{data,storage,hooks,sectors,lite,load,i18n}.js`, `src/screens/detail-hooks.jsx`, `api/korea-lens.mjs`, `api/push/send.mjs`
  - 데이터: `src/data/startups.json`(123곳), `startups.en.json`, `meta.json`

## 변경 로그

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1 | 2026-10-30 | 최초 작성. 02의 화면 ID(S1~S7)를 그대로 쓴다. **신규 화면 ID**: S8 설정(`#/settings`, About에서 분리). **신규 컴포넌트 ID**(라우트 아님): C1 취향 시트(온보딩), C2 알림 사전 설득 시트, C3 상태 띠·스낵바, W1/W2 위젯. 화면 이름 변경 없음. |
| v1 | 2026-10-30 | **이전 결정 뒤집기 1건**: 10 "하지 않을 것"과 `hooks.js` 주석("it never reorders an issue")은 오늘 호 순서를 바꾸지 않는다고 했다. 사용자가 R12 §2-3 결론(묶음은 같게, **순서는 개인화**)을 확정했으므로 이 문서에서 뒤집는다. 대신 "발행 순으로 보기" 토글을 둔다(§1-6). |

---

## 0. 결정 요약 (한 줄씩)

| # | 주제 | 결정 | MVP(1.0) / Later |
|---|---|---|---|
| 1 | 개인화 | 역할 1개 + 관심 분야 0개 이상을 저장한다. 바뀌는 것은 **순서, "○○라면" 한 줄, 알림 문구, 지난 회사 추천** 네 가지뿐이다. "○○라면" 한 줄은 **LLM 생성 필드가 아니라, 역할별로 기존 필드 하나를 고르는 규칙**으로 만든다 | 1.0 |
| 2 | 영어판 섹션 | 이름은 **"Precedents & Adjacent Markets"**(목차 칩은 "Precedents"). 06 구조를 재사용해 `precedents.json` 스키마로 만든다. 생성은 한국판과 같은 **버튼 온디맨드** 방식이고, `/api/korea-lens`를 `lens=precedents` 파라미터로 일반화한다 | 1.0(무료 전체 공개, 잠금 경계만 레이아웃에 표시) / 사전 생성·잠금은 Later |
| 3 | 첫 화면 | 고지 박스와 분야 칩을 빼고, **히어로 1곳 + "5곳 중 n곳" 막대 + 행마다 '왜 지금' 한 줄**로 바꾼다. 금액은 오른쪽 큰 숫자에서 메타 줄의 일반 글자로 내린다. 접힌 상태 기준으로 **히어로 1 + 행 3곳**이 보인다(현재 2.5곳) | 1.0 |
| 4 | 정체성 | 최근 9개 호 43곳 중 13곳(30%)이 한국 회사다. 그래서 **"해외"를 브랜드 문장에서 뺀다**. 브랜드 문장은 "아직 모르는, 지금 뜨는 스타트업"이고, 스토어 짧은 설명에는 "해외·국내"를 쓴다 | 1.0 (사용자 결정 1건, §6) |
| 5 | 앱 골격 | 하단 탭 3개를 유지한다. 최신 호의 top app bar는 large flexible(스크롤하면 접힘)로 한다. back은 시트 → 해시 히스토리 → 시스템 순으로 처리한다. 알림 권한은 맥락 트리거 3개로 묻는다. 상태 화면 5종 문구를 확정한다. 위젯은 1.1로 미룬다 | 1.0 / 위젯 1.1 |

---

## 1. 개인화 설계

### 1-1. 원칙 (근거 R12 §2-3, B12 #C1, 10 §3-14)

| 고정 (모두 같음) | 개인화 (사람마다 다름) |
|---|---|
| 오늘의 묶음(4~5곳)과 그 구성 | 묶음 안의 **순서** (§1-6) |
| 회사별 본문, "왜 지금" 문장 | 히어로와 상세 상단의 **"○○라면" 한 줄** (§1-5) |
| 발행 시각, 호 번호 | **푸시 문구**에서 앞에 놓는 회사 이름 (§1-7) |
| 탐색 기본 정렬 | **지난 회사 추천** "내 분야 지난 회사" (§1-8) |

- 계정은 없다. 모든 값은 `localStorage`에 둔다(`storage.js`의 `load/save`. 예외가 나도 메모리 값으로 계속 동작한다).
- 개인화 결과는 화면에 **보이게** 한다. 순서가 바뀌었으면 "내 관심 순" 라벨과 "발행 순으로 보기" 토글을 둔다. 근거: Inshorts 리뷰의 "개인화가 고장 났다" 불만(R12 §2-1). 이유를 모르는 재정렬은 고장처럼 보인다.

### 1-2. 저장 스키마

기존 키는 이름과 형식을 그대로 둔다. 새 키 4개만 더한다.

| 키 | 형식 | 상태 | 쓰는 곳 |
|---|---|---|---|
| `sd_interests` | `string[]` — `SECTORS[].key` | **기존** (`hooks.js` `interestStore`) | 순서, 알림 필터, 탐색 "내 관심 분야" 칩 |
| `sd_read` | `{ [id]: 'YYYY-MM-DD' }` | **기존** | 진척, 행동 가중치 |
| `saved_startups` | `string[]` (최근이 앞) | **기존** | 행동 가중치 |
| `sd_onboarded` | `boolean` | **기존** | 취향 시트(C1) 표시 여부 |
| `sd_push_only_interests` | `boolean` | **기존** | 알림 필터 |
| `sd_role` | `'founder' \| 'investor' \| 'pm' \| 'job' \| 'curious' \| null` | **신규** | "○○라면" 한 줄, 영어판 세그먼트 줄 |
| `sd_opens` | `{ [id]: 'YYYY-MM-DD' }`, 최대 300개(오래된 것부터 삭제) | **신규** | 상세 진입 신호(2초 미만 이탈 포함) |
| `sd_order` | `'personal' \| 'editorial'`, 기본 `'personal'` | **신규** | §1-6 토글 |
| `sd_taste_prompt` | `{ shown: 'YYYY-MM-DD' \| null, dismissed: number }` | **신규** | C1 시트를 자동으로 띄운 횟수(최대 1회 + 목록 끝 카드 1회) |

- **가중치는 저장하지 않고 계산한다.** `sd_read`·`saved_startups`·`sd_opens`에서 매번 다시 계산한다. 이유는 셋이다. ① "읽음 기록 초기화"(설정)를 누르면 가중치도 함께 사라져야 한다. ② 데이터 파일이 바뀌어 회사의 분야가 다시 매핑되면(`sectors.js` 정규식 수정) 가중치도 따라가야 한다. ③ 키가 늘수록 스키마 이전 비용이 생긴다.
- 백업과 복원: 기존 `restore`/`restoreRead` 흐름에 `sd_role`, `sd_interests`, `sd_opens`를 더한다(Later, 기기 이전 기능이 생길 때).

### 1-3. 분야 묶음 목록 (`src/lib/sectors.js` 기준)

온보딩 칩은 `SECTORS` 10개를 그대로 쓰고 `OTHER_SECTOR`(기타)는 뺀다. 원천 `category`(180개 넘는 자유 텍스트)는 쓰지 않는다(B12 #C1). 칩 옆에 회사 수를 mono 숫자로 표시한다. 현재 123곳 기준 분포는 아래와 같다.

| key | 한국어 칩 | 영어 칩 | 전체 | 10월 호(43곳) |
|---|---|---|---|---|
| `health` | 헬스·바이오 | Health & Bio | 18 | 5 |
| `ai` | AI 모델·에이전트 | AI Models & Agents | 17 | 8 |
| `enterprise` | 엔터프라이즈 | Enterprise | 17 | 4 |
| `climate` | 기후·에너지 | Climate & Energy | 16 | 8 |
| `infra` | AI 인프라·반도체 | AI Infra & Chips | 14 | 3 |
| `robotics` | 로보틱스·제조 | Robotics & Industry | 12 | 5 |
| `fintech` | 핀테크 | Fintech | 9 | 4 |
| `mobility` | 모빌리티·우주 | Mobility & Space | 7 | 3 |
| `consumer` | 컨슈머·교육 | Consumer & Education | 7 | 1 |
| `devtools` | 개발자 도구 | Developer Tools | 4 | 0 |

- 칩 순서는 **전체 회사 수 내림차순**으로 한다(지금 `Onboarding.jsx`는 `SECTORS` 정의 순서). 많이 실리는 분야가 앞에 있어야 첫 줄에서 고를 확률이 높다.
- 회사 수가 0인 분야도 칩은 보여준다(지금은 `counts.get(s.key)`가 0이면 숨긴다). 숨기면 한 번도 안 실린 분야는 고를 길이 없다. 0이면 숫자 자리에 "준비 중"을 표시한다.
- `ai`는 `sectors.js`에서 마지막 순서의 포괄 버킷이다. "AI 신약"은 `health`로, "AI 칩"은 `infra`로 먼저 분류된다. 칩 설명에 이 차이를 적지 않는다(설명이 길어지면 40초 목표를 깬다). 대신 상세의 분야 라벨이 실제 분류를 보여준다.

### 1-4. 온보딩 = 취향 시트 (C1)

**언제 띄우나 (근거 B12 #B2, R12 §2-1 Particle)**
- 첫 실행에서는 **콘텐츠를 먼저** 보여준다. 히어로를 가리는 모달은 쓰지 않는다. 지금의 `<dialog>.showModal()` 3단계는 폐기한다.
- 자동 표시는 아래 중 먼저 일어나는 일에서 **한 번만** 한다.
  1. 첫 상세를 읽고 S1으로 돌아왔을 때
  2. S1에서 히어로 아래로 스크롤했을 때
- 이렇게 하는 이유: 첫 묶음은 누구에게나 같다. 그러니 개인화를 먼저 받아도 첫 3초에 얻는 것이 없다. 반면 첫 회사를 본 뒤에는 "순서를 맞춰 준다"는 제안이 구체적으로 들린다.
- 공유 링크로 들어온 콜드 스타트(`#/s/` 진입)에서는 띄우지 않는다. 기존 `isColdStart()` 규칙을 유지한다.
- 건너뛰면 다시 자동으로 띄우지 않는다. 대신 S1 목록 끝에 한 줄 카드 "역할과 분야를 고르면 순서를 맞춰 드려요 ›"를 **1회** 둔다.

**구성: 2단계, 40초 이내** (하단 시트, 높이 최대 90%, 드래그하거나 back을 누르면 닫힌다)

```
┌───────────────────────────────────────┐
│ ─────                     1/2  건너뛰기 │
│ 어떤 일을 하세요?                         │
│ 고르면 회사마다 내 입장에서 볼 한 줄을 붙여요  │
│                                         │
│ ( 창업자 )  ( 투자자·애널리스트 )          │
│ ( PM·기획자 )  ( 취업·이직 준비 )          │
│ ( 그냥 궁금해요 )                         │
│                                         │
│        탭하면 바로 다음 단계로              │
└───────────────────────────────────────┘
            ↓ 역할 탭 (자동 진행, 0.2초)
┌───────────────────────────────────────┐
│ ─────                     2/2  건너뛰기 │
│ 관심 분야                                │
│ 3개쯤 고르면 순서가 잘 맞아요.             │
│ 오늘의 묶음은 모두에게 같아요.             │
│                                         │
│ [헬스·바이오 18] [AI 모델·에이전트 17]      │
│ [엔터프라이즈 17] [기후·에너지 16]          │
│ [AI 인프라·반도체 14] [로보틱스·제조 12]     │
│ [핀테크 9] [모빌리티·우주 7] [컨슈머·교육 7] │
│ [개발자 도구 4]                           │
│                                         │
│ [ 이전 ]        [ 완료 · 2개 선택됨 ]       │
└───────────────────────────────────────┘
```

- 1단계 역할: 단일 선택이고 탭하면 바로 다음으로 넘어간다(버튼 한 번을 줄인다). 이미 고른 값이 있으면 체크해 둔다.
- 2단계 분야: 0개여도 "완료"가 활성 상태다(B12 #C1, R12 "강제 X"). 버튼 라벨은 0개면 "완료", 1개 이상이면 "완료 · n개 선택됨"이다. 1~2개일 때만 칩 위에 "1개만 더 고르면 순서가 더 잘 맞아요"를 회색 한 줄로 보여준다(권장이지 강제는 아니다).
- 알림 단계는 **뺀다.** 알림은 §5-5의 맥락 트리거로 묻는다(B12 #D1·안티패턴, R12 §2-3).
- 소개 단계(지금 step 0)도 **뺀다.** 정체성 문장은 S1 상단에 이미 있다(§3).
- 영어 문구: "What do you do?" / "We'll add one line per company from your side of the table." / 역할 "Founder · Investor / analyst · PM / product · Job seeker · Just curious" / "Sectors" / "About 3 works best. Today's picks are the same for everyone." / "Done · 2 selected".
- 소요 시간: 역할 1탭(약 5초)과 칩 3개(약 15초)를 합쳐 20~30초다. Particle 40초 기준 안에 든다.

**수정 위치 (3곳)**
1. **S8 설정** → "역할과 관심 분야" 행 → C1 시트를 다시 연다(자동 진행 없이 두 단계를 한 화면에 세로로 보여준다).
2. **S4 탐색** 상단 분야 칩 줄의 맨 끝 "편집" 칩 → C1의 2단계만 연다.
3. **S1 목록 머리의 "내 관심 순" 라벨** → 탭하면 작은 메뉴가 열린다: "발행 순으로 보기 / 역할·분야 바꾸기".

### 1-5. "○○라면" 한 줄 (= "당신에게 왜")

**결정: LLM 생성 필드를 새로 만들지 않는다. 역할마다 기존 필드 하나를 고르는 규칙(필드 선택)으로 만든다.** 1.0에서는 이것으로 충분하다.

| 근거 | 내용 |
|---|---|
| 비용 0, 과거 회사까지 즉시 적용 | 123곳 모두 이미 필드가 있다. LLM 필드는 백필 비용이 들고, 4월 호(정정 대상 포함)도 다시 생성해야 한다 |
| 환각 위험 0 | 상세에 이미 실린 사실을 다시 보여줄 뿐이다. 06 §1의 "새 사실을 지어내지 않는다" 원칙과 같다 |
| 영어판 즉시 적용 | `startups.en.json`에 같은 필드의 번역이 이미 있다(확인: `competitive_landscape.key_differentiator`, `product.key_features`, `team_highlights`) |
| 한계 | 문장이 "관점"이 아니라 "발췌"다. 예를 들어 "창업자라면 배울 점"을 해석해 주지는 못한다. 이 해석은 Later의 LLM 필드나 영어판 `for_segments`(§2)에서 맡는다 |

**역할 → 필드 규칙** (위에서부터 첫 번째로 값이 있는 것)

| 역할 (`sd_role`) | 라벨 KO / EN | 1순위 | 2순위 (폴백) | 예 (솔리드뷰) |
|---|---|---|---|---|
| `founder` | 창업자라면 / For founders | `competitive_landscape.key_differentiator` | `competitive_landscape.moat` | 창업자라면 · 국내 유일의 라이다 센서 IC 팹리스. 400×128 해상도 단일칩… |
| `investor` | 투자자라면 / For investors | 템플릿 `{latest_round.stage} {latest_round.amount} · 리드 {latest_round.lead_investor}` (빈 칸은 그 조각을 생략) | `trending_reason.growth_metrics` | 투자자라면 · Series C 163억원 · 리드 엔베스터 |
| `pm` | PM이라면 / For PMs | `product.key_features[0]` 앞에 "핵심 기능: " | `product.problem_statement` | PM이라면 · 핵심 기능: 400×128 픽셀 고해상도 3D 포인트 클라우드… |
| `job` | 커리어로 보면 / For job seekers | 템플릿 `팀 {employee_count} · {latest_round.date} {latest_round.stage} 유치` | `team_highlights` | 커리어로 보면 · 팀 11-50명 · 2026-10 Series C 유치 |
| `curious` 또는 `null` | (표시 안 함) | – | – | – |

- 길이: 두 줄 넘치면 말줄임한다(`line-clamp: 2`). 문장을 자르지 않고 CSS로만 줄인다. 전문은 상세에 있다.
- 금지: 템플릿에 해석 단어("채용 확대 가능성", "유망")를 넣지 않는다. 사실만 조합한다. job 템플릿의 "유치"는 사실 동사다.
- `employee_count`가 "51-100 (추정)"처럼 괄호를 포함하면 괄호를 그대로 둔다(추정 표시를 지우지 않는다).
- 정정이 붙은 회사(`_correction.kind !== 'note'`, 인수·폐업)는 한 줄을 표시하지 않는다. 투자 라운드가 더는 의미가 없기 때문이다.
- **구현 위치**: 새 모듈 `src/lib/personal.js`의 `forRole(startup, role) → { label, text } | null`. 첫 화면에서 쓰려면 `lite.js`의 `liteRecord`에 아래 4개를 추가해야 한다(현재 lite에는 없음). 크기 증가는 회사당 약 200바이트로 추정한다.
  - `competitive_landscape.key_differentiator`
  - `product.key_features[0]`(첫 항목만)
  - `funding.latest_round.{stage, amount, date, lead_investor}`
  - `employee_count`
- **어디에 보이나**: S1 히어로(§3), S3 상세 요약 블록 바로 아래. **목록 행에는 넣지 않는다.** 행은 '왜 지금'이 맡는다. 두 줄이 겹치면 행 높이가 커져 첫 화면에 보이는 회사 수가 다시 줄어든다.
- **Later**: 발췌가 어색하다는 피드백이 쌓이면 생성기에 `for_roles: { founder, investor, pm, job }` 필드(각 60자 이하)를 추가한다. 입력은 프로필 필드만 쓰고 웹 검색은 끈다. 단정어 검사(06 §3-C②)를 재사용하고, `translate-en.mjs`로 번역한다. 생성된 필드가 있으면 `forRole`이 그것을 먼저 쓴다.

### 1-6. 정렬 규칙

```
score(s) = 10 × [s._sector.key ∈ sd_interests]
         + min(5, affinity[s._sector.key])

affinity[sector] = Σ over companies c in that sector:
     1.0 × decay(sd_read[c])     ← 단, c가 오늘 호이면 0.3
   + 0.5 × decay(sd_opens[c])    ← 읽음으로 이어진 진입은 중복 계산하지 않음
   + 2.0 × [c ∈ saved_startups]  ← 저장은 날짜가 없으므로 감쇠 없음
decay(date) = 0.5 ^ (경과일 / 30)   (반감기 30일)
```

- **안정 정렬**을 한다. 점수가 같으면 발행 순(데이터 순서)을 유지한다.
- **오늘 호 읽기의 가중치는 0.3으로 낮춘다.** 오늘 호는 모두가 같은 5곳을 받으므로, 다 읽는 사람의 읽기는 "선택"이 아니다. 탐색·지난 호·분야 페이지에서 **스스로 고른 읽기**가 진짜 신호다.
- 명시한 관심(10점)이 행동(최대 5점)을 항상 이긴다. 사용자가 고른 것이 조용한 학습보다 앞서야 결과를 예측할 수 있다.
- 음의 신호(건너뛰기, 저장 취소)는 쓰지 않는다. 저장 취소는 `saved_startups`에서 빠지므로 자연스럽게 0이 된다. 건너뛴 이유는 알 수 없다(이미 아는 회사일 수 있다).
- **적용 범위**: S1 최신 호, S2 지난 호, S3 상세의 이전/다음(`useContextList`가 같은 순서를 쓰게 한다), 푸시 문구, 위젯(1.1). 탐색·저장·분야 페이지는 정렬하지 않는다(각자 정렬 기준이 있다).
- 행 앞의 번호 "01~05"는 **개인 순서의 위치**를 뜻한다. 발행 순 번호는 공유 텍스트나 다른 곳에서 쓰이지 않으므로(확인: `useShare`, 완독 공유 문구) 충돌이 없다.
- **투명성**: 개인 순서가 발행 순과 다를 때만 목록 머리에 "내 관심 순 ▾"를 표시한다. 같으면 아무것도 표시하지 않는다. `sd_order='editorial'`이면 "발행 순 ▾"로 표시한다.
- 히어로는 정렬 결과에서 **첫 번째 안 읽은 회사**다(§3).

### 1-7. 알림 문구 개인화

- 서버(`api/push/send.mjs`)는 이미 구독 레코드에 `sectors`와 `onlyInterests`를 가지고 있다. 여기에 **`lang`**(`'ko'|'en'`)을 더한다. 지금은 한국어 문구만 나가서 영어판 구독자에게도 한국어가 간다.
- `role`은 서버에 보내지 않는다. 문구에 쓰지 않으므로 필요 이상 수집하지 않는다.
- 문구 규칙 (첫 번째로 맞는 것):

| 조건 | 제목 KO / EN | 본문 KO / EN |
|---|---|---|
| 관심 분야 회사가 있음 | `10월 30일 · 오늘 5곳` / `Oct 30 · 5 startups today` | `{관심 회사명} 외 4곳 · 내 분야 {분야 라벨}` / `{name} + 4 more · in {sector}` |
| 관심 분야가 있지만 오늘 해당 없음(`onlyInterests=false`) | 같음 | `{첫 회사명} 외 4곳 · {분야 2개}` (현재 문구 유지) |
| 관심 없음 | 같음 | 같음 |

- 관심 회사가 여러 곳이면 서버의 발행 순으로 첫 곳을 쓴다. 서버는 기기의 행동 가중치를 모르기 때문에 발행 순을 쓴다.
- 숫자는 그날 건수를 그대로 쓴다. "4곳"을 하드코딩하지 않는다(N12).
- 발송 시각 전제: 09 §2에 따르면 cron이 05:00 KST로 당겨져야 "아침 8시" 약속을 지킬 수 있다. 현재 실제 실행은 10:36이다. **cron을 옮기기 전에는 시트 문구에 시각을 쓰지 않는다**(10 "데이터가 없는 약속 문구 금지"). §5-5 문구에 두 가지 버전을 둔다.

### 1-8. 지난 회사 추천 "내 분야 지난 회사"

- 위치: ① S1 완독 카드(§3 상태 C) 안, ② S4 탐색 첫 화면 상단 가로 줄(관심이나 행동 신호가 있을 때만).
- 후보: 오늘 호가 아닌 회사 가운데 **안 읽은 곳**, `_stageGroup !== 'exit'`인 곳.
- 정렬: `score`(위 공식) 내림차순 → 소개일 최신 순. 3곳을 보여준다.
- 라벨: "내 분야 지난 회사" / "More in your sectors". 관심이 없고 행동만 있으면 "최근 읽은 분야의 지난 회사" / "More like what you've read".

### 1-9. 개인화가 비었을 때 기본값

| 상태 | 순서 | 히어로 | "○○라면" | 알림 | 추천 |
|---|---|---|---|---|---|
| 역할 없음 + 관심 없음 + 행동 없음 (콜드 스타트) | 발행 순 | 발행 순 첫 곳 | 표시 안 함 | 현재 문구 | 완독 카드에 `followUps(3)`("그때 그 회사" 새 소식). 없으면 지난 호 1개 |
| 역할만 있음 | 발행 순(행동이 생기면 보정) | 같음 | 표시 | 현재 문구 | 위와 같음 |
| 관심만 있음 | 관심 순 | 관심 1순위 | 표시 안 함 | 관심 문구 | 내 분야 지난 회사 |
| "그냥 궁금해요" | 위와 같음 | – | 표시 안 함 | – | – |

- R12 §2-3: "콜드 스타트에는 개인화가 필요 없다. 고정 묶음이 이미 편집 기본값이다." 그러니 빈 상태에서 무리하게 추천을 만들지 않는다.

### 1-10. MVP / Later

| 항목 | 1.0 | Later | 근거 |
|---|---|---|---|
| `sd_role`, `sd_opens`, `sd_order` 저장 + 정렬 계산 | O | | S 난이도, 클라이언트만 |
| C1 취향 시트(2단계), 기존 모달 폐기 | O | | B12 #B2·#C1 |
| `forRole` 필드 선택 + `liteRecord` 4필드 추가 | O | | 비용 0 |
| 푸시 `lang` 추가 + 관심 문구 | O | | 영어판 구독자에게 한국어가 가는 결함 |
| 지난 회사 추천 (완독 카드) | O | 탐색 상단 줄 | 탐색 개편은 범위 밖 |
| `for_roles` LLM 필드 | | O | 품질 피드백을 본 뒤 |
| 기기 간 동기화 | | O (09 Phase 2 로그인 이후) | 계정 없음 원칙 |

---

## 2. 영어판 "Precedents & Adjacent Markets"

### 2-1. 이름과 자리

- **섹션 제목**: "Precedents & Adjacent Markets"
- **목차 칩**(`detail-hooks.jsx` `sectionsFor`): "Precedents". `KOREA_SECTION`과 같은 자리(Market 뒤, Sources 앞)에 들어간다. 한국어판은 지금처럼 "한국"이다. 한 판에는 둘 중 하나만 있다.
- **도입 문장**(제목 아래 회색): "Has this been tried before, and where else does the pattern show up?"
- 이유: "Similar companies"는 Crunchbase가 이미 버린 이름이다(R12 §3-3). "Seen This Before?"는 기억에 남지만, 목차 칩과 스토어 스크린샷 캡션에서는 의미가 바로 읽히는 이름이 낫다. 질문형 문장은 도입 문장으로 살린다.

### 2-2. 데이터 스키마

별도 파일 `public/data/precedents.json`(키 = 회사 `id`)과 인덱스 `precedents-index.json`(목록 배지·검색용)으로 둔다. `korea-lens.json`/`korea-lens-index.json`과 **같은 위치, 같은 로딩 방식**이다. 재생성 주기가 다르고, 상세에서만 지연 로드하기 때문이다(06 §2).

```jsonc
"solidvue-solidvue-2026": {
  "generated_at": "2026-10-30T…", "model": "…", "lang": "en",
  "verdict": "repeat",            // repeat | transplant | new-ground | unclear  (기본 unclear)
  "headline": "≤ 90 chars, one-line conclusion",
  "similar": [                    // 06 재사용. 2~5개
    { "name": "", "country": "", "relation": "direct | adjacent | analog",
      "kind": "company | product | idea", "summary": "2 sentences: same / different",
      "url": "https://…", "verified": true }
  ],
  "precedents": [                 // 새 필드. 같은 아이디어의 이전 시도. 0~3개
    { "name": "", "years": "2014–2019",
      "outcome": "acquired | shut_down | ipo | operating | pivoted | unknown",
      "outcome_note": "1 sentence, what happened (sourced)",
      "lesson": "1 sentence, why it matters for this company (hypothesis)",
      "source_url": "https://…", "verified": true }
  ],
  "adjacent_markets": [           // 새 필드. 0~3개
    { "market": "", "why_adjacent": "1 sentence",
      "size": { "value": "$X B", "year": 2025, "source_url": "https://…" } | null,
      "players": [ { "name": "", "url": "…", "verified": true } ] }   // 0~3, 검증된 것만
  ],
  "for_segments": {               // 새 필드. 각 ≤ 140 chars. 가설 라벨
    "founders": "", "investors": "", "pms": "", "job_seekers": ""
  },
  "search_gaps": "What we searched for and could not confirm"   // 필수 (06과 같음)
}
```

- `verdict` 정의:
  - `repeat`: 같은 아이디어의 이전 시도가 검증된 출처로 1개 이상 있다.
  - `transplant`: 다른 산업에서 증명된 패턴을 옮겨 왔다(`similar[].relation = analog`가 중심).
  - `new-ground`: **검색에서 가까운 선례가 확인되지 않았다.** "없다"고 쓰지 않는다.
  - `unclear`: 근거가 부족하다. **기본값이다.**
- 인덱스 `precedents-index.json`: `{ [id]: { v: verdict, n: [similar·precedents·players 이름] } }`. `korea-lens-index.json`과 같은 모양이다. `data.js` 검색의 `competitors` 확장에 그대로 쓴다. 예를 들어 "Quibi"를 검색하면 Quibi를 선례로 언급한 회사가 나온다.

### 2-3. 검증 규칙 (06 §1·§3-C를 그대로 적용 + 영어판 추가분)

| # | 규칙 | 실패 시 |
|---|---|---|
| 1 | 모든 `url`·`source_url`을 `checkUrl`로 확인한다 | 그 항목을 삭제한다 |
| 2 | **`precedents[].outcome`은 `source_url`이 검증될 때만** `unknown` 이외의 값을 쓸 수 있다 | `outcome='unknown'`으로 강등하고 `outcome_note`를 삭제한다 |
| 3 | `adjacent_markets[].size`는 검증된 `source_url`과 `year`가 있을 때만 허용한다 | `size=null` |
| 4 | 영어 단정어 정규식: `the only`, `first[- ]ever`, `no one else`, `nobody`, `unprecedented`, `guaranteed`, `will (dominate\|win)`, `no competitors` | 그 문장을 다시 쓰게 하고(1회), 또 실패하면 그 항목을 삭제한다 |
| 5 | `search_gaps`가 비어 있으면 | `verdict='unclear'` |
| 6 | `new-ground`는 `precedents=0`이고 검색 질의가 6회 이상일 때만 허용한다 | `unclear` |
| 7 | `for_segments`는 입력 사실에 없는 회사명이나 숫자를 포함할 수 없다(06 §3-B "입력에 없는 회사명 금지") | 그 세그먼트 문장을 삭제한다 |
| 8 | 언어 검사: 본문의 ASCII 비율이 90% 이상이어야 한다(한국판의 "한글 비율" 검사를 뒤집은 것) | 재시도 |
| 9 | 스키마 검증 | 재시도 1회, 그래도 실패하면 섹션 없음 |

- 면책 문구: "Not business or investment advice. Precedents are researched by AI from public sources; lessons are hypotheses."
- 미국 애널리스트 독자는 틀린 comps 하나에 신뢰를 접는다(R12 §3-3). 그래서 `similar`와 `precedents`는 **검증된 링크가 없으면 화면에 이름조차 보이지 않는다**(06의 "한국 사업자 이름은 검증된 URL이 있어야 노출"과 같다).

### 2-4. 생성 방식

**결정: 한국판과 같은 버튼 온디맨드 방식이다. 엔드포인트는 하나를 일반화한다.**

현재 흐름은 다음과 같다(확인).
- `detail-hooks.jsx` `useKoreaLens(id, hasStatic, canRequest)`:
  1. 미리 만든 분석이 있으면 `/data/korea-lens.json`을 받는다.
  2. 없으면 버튼을 눌렀을 때 `GET /api/korea-lens?id=` 요청(최대 330초) → 결과를 `localStorage sd_lens:{id}`에 저장 → 다른 화면에 있어도 `onLensReady` 토스트를 띄운다.
- `api/korea-lens.mjs`:
  - 같은 사이트에서 온 요청만 받는다.
  - 방문자별 10분에 4회, 동시 실행 3건으로 제한한다.
  - 성공한 응답은 엣지에 30일 캐시한다(첫 요청자만 비용을 낸다).
  - `LENS_ENABLED=0`이면 끈다.
- `generate-daily.mjs`의 사전 생성은 기본으로 꺼져 있다(비용 절감).

영어판 변경점:

| 층 | 변경 |
|---|---|
| API | `api/korea-lens.mjs` → 쿼리 `lens=korea\|precedents`(기본 korea)를 받는다. 빌더만 `buildKoreaLens` / `buildPrecedents`(신규 `scripts/lib/precedents.mjs`)로 갈라진다. 레이트 리밋·동시 실행·엣지 캐시·킬 스위치는 공유한다. 함수 파일을 늘리지 않아 Vercel Hobby의 함수 수 제한과 관리 부담을 피한다. 파일 이름은 그대로 둔다(경로 변경은 이미 캐시된 URL을 깨뜨린다) |
| 입력 | 영어 프로필(`startups.en.json` 병합본)의 `product.summary`, `category`, `business_model`, `target_customer`, `competitive_landscape.direct_competitors[].name`(이미 경쟁사로 실린 이름은 `similar`에서 뺀다. 기존 섹션과 겹치지 않게) |
| 파이프라인 | 06과 같은 3단계: A 조사(웹 검색, 영어 질의 예: "{product} startup shut down", "{idea} acquired", "{category} market size {year}") → B 작성(검색 없음) → C 가드(§2-3) |
| 클라이언트 | `useKoreaLens`를 `useLens(kind, id, …)`로 일반화한다. 저장 키는 `sd_lens:{kind}:{id}`이고, 기존 `sd_lens:{id}`는 korea로 읽어 하위 호환을 유지한다. `canAnalyze`를 `canLens(kind, s)`로 바꾼다: korea는 `!isEn && exit 아님`, precedents는 `isEn && exit 아님` |
| 대기 단계 문구 | 0초 "Looking for earlier attempts at this idea" → 40초 "Checking how they turned out" → 120초 "Mapping adjacent markets and checking links" → 210초 "Almost done. Just a little longer" |

- 근거: 영어판 독자 수는 아직 증명되지 않았다. 매일 5곳을 미리 만들면 하루 약 $0.5(06 §3 추정과 같은 규모)가 고정으로 든다. 온디맨드는 누가 누를 때만 비용이 들고, 엣지 캐시가 두 번째 독자부터 비용을 없앤다.
- **Later (사전 생성 전환 조건)**: 영어판에서 주당 생성 요청이 20건을 넘거나 Android 영어 설치가 500을 넘으면, 최신 호만 매일 사전 생성한다(`generate-daily.mjs`에 `PRECEDENTS_ENABLED` 플래그). 그때부터 §2-5의 "무료 미리보기"가 버튼 없이 바로 보인다.

### 2-5. 화면 구성 (S3 상세, 영어판)

```
── 07 Precedents & Adjacent Markets ─────────────── [AI hypothesis]
Has this been tried before, and where else does the pattern show up?

(생성 전, idle)
┌───────────────────────────────────────────────┐
│ See earlier attempts at this idea, how they    │
│ ended, and the markets next door.              │
│ [ Find precedents ]   takes about 2–3 minutes  │
│ Free while we're in early access.              │
└───────────────────────────────────────────────┘

(생성 후, ready)
┌ REPEAT ───────────────────────────────────────┐
│ {headline}                                     │  ← 미리보기 ①
└───────────────────────────────────────────────┘
For founders  {for_segments.founders}              ← 미리보기 ② (내 역할 1줄.
                                                     역할이 없으면 4줄 모두를 접힌 목록으로)
PRECEDENTS
 ▸ {name} · 2014–2019 · Acquired                    ← 미리보기 ③ (첫 선례 1개)
   {outcome_note}
   Lesson: {lesson}                     source ↗
- - - - - - - - - - - - - - - - - - - - - - - - - -  ← 멤버 경계 (1.0에서는 선만 있고 잠금 없음)
 ▸ {name} · … (나머지 선례)
SIMILAR NOW
 [card] {name} · {country} · direct      ↗
 [card] …
ADJACENT MARKETS
 {market} — {why_adjacent}  ($X B, 2025, source ↗)
   Players: A ↗ · B ↗
WHAT WE COULDN'T CONFIRM
 {search_gaps}
Not business or investment advice. …   Something wrong? ›
```

- **무료와 전체의 경계** (09 §3-1의 "한국에서는" 경계와 같은 구조, R12 §3-3)
  - 무료: verdict 배지, headline, **내 역할 세그먼트 줄 1개**, 첫 선례 1개
  - 전체(멤버): 나머지 선례, 유사 회사, 인접 시장, 확인하지 못한 것
  - **1.0에서는 잠그지 않는다.** 09 결론 1(앱은 처음에 무료)을 따른다. 대신 경계선 위치를 레이아웃에 미리 둔다(점선 구분선). Phase 2에서 그 아래를 페이드 처리하고 멤버십 시트를 연결한다(블러 금지, 09 §5).
  - idle 카드의 "Free while we're in early access." 문구는 나중에 유료화했을 때 "약속 위반"으로 읽히지 않게 하려는 것이다. 유료 전환 예고를 미리 깔아 둔다.
- **세그먼트 줄**: `sd_role` → `for_segments` 키 매핑은 founder→founders, investor→investors, pm→pms, job→job_seekers다. curious나 null이면 4줄을 "For founders · investors · PMs · job seekers ▾" 접힌 목록으로 보여준다.
- **목록 배지**: 06 결정 2("한국 기회" 배지는 open/emerging만 작게)와 맞춘다. 영어판 목록에는 `repeat`일 때만 텍스트 배지 "Has precedents"를 단다. 미국 독자에게 "이 회사는 선례가 있다"는 클릭 동기가 된다. `new-ground`는 배지를 달지 않는다. 부재 주장처럼 읽히기 때문이다.
- **오프라인**: idle 버튼을 비활성화하고 "Needs a connection"을 표시한다(§5-6).
- 한국 회사도 대상이다. 미국 독자에게 한국 회사의 미국 선례는 오히려 가치가 크다.
- 참고 관찰(범위 밖): 한국어판의 `canAnalyze`는 한국 본사 회사에도 "한국에서는"을 연다. 한국 회사에 "한국에서 될지"를 묻는 것은 어색하다. 한국어판에서 한국 회사는 `canAnalyze=false`로 하거나, 이 영어판 섹션의 한국어 번역판으로 대체하는 것을 Later로 남긴다.

### 2-6. 세그먼트별 한 줄 (`for_segments` 작성 지침, 프롬프트에 넣을 문장)

| 키 | 독자가 원하는 것 (R12 §3-2) | 지침 (영어, 140자 이하, 가설 어조) | 예시 형식 |
|---|---|---|---|
| `founders` | 이전 시도가 왜 실패하고 왜 성공했나, 피벗 경로 | What the closest precedent got wrong or right, as one transferable lesson | "X died on unit economics at Y scale; watch whether Z's chip cost curve avoids that." |
| `investors` | 테제, comps | Which thesis this fits and which verified precedent is the nearest comp | "Fits a 'solid-state replaces mechanical' thesis; nearest exited comp: X (acquired 2021)." |
| `pms` | 다른 산업의 같은 패턴(아날로그) | The analog from another industry and the product pattern it shares | "Same pattern as X in Y: replace moving parts with a chip, then win on cost." |
| `job_seekers` | 이 시장이 이길 시장인가, 비슷한 회사의 결말 | How comparable companies ended, without predicting this one | "Of 3 precedents, 1 acquired, 2 shut down; the survivor had Z." |

- 공통 금지: 매수·매도·투자 권유 표현, 연봉이나 채용 단정. 09 §8의 유사투자자문 리스크를 영어판에도 적용한다.

### 2-7. MVP / Later

| 항목 | 1.0 | Later |
|---|---|---|
| 스키마·가드·`buildPrecedents`·API 파라미터 일반화 | O | |
| `useLens(kind)` 일반화, 섹션 UI(경계선 포함, 잠금 없음) | O | |
| 목록 배지 "Has precedents", 검색에 이름 포함 | O | |
| 최근 3개 호 백필(06 §5와 같은 범위, 약 15곳) — 사람이 10곳 표본 검증 | O (출시 전, 스토어 스크린샷 4번에 필요) | |
| 최신 호 사전 생성 | | O (전환 조건 §2-4) |
| 멤버 잠금 | | O (09 Phase 2) |
| 한국어판 번역 제공 | | O |

---

## 3. 첫 화면 가치 전달 (S1 최신 호, 375×812 기준)

### 3-1. 바꾸는 것과 근거

| 현재 (N12) | 변경 | 근거 |
|---|---|---|
| 웹 헤더(로고·검색·EN·데스크톱 아이콘) | large flexible top app bar. 접히면 small 바 "제22호" | B12 #A2 |
| 고지 박스(`AiNote`) 상단 | **목록 아래 한 줄 각주**로 내린다 + app bar의 정보 아이콘. 첫 실행에는 정체성 문장 바로 아래에 회색 한 줄 | 첫 화면 40% 점유 해소, AI 기본법 표시 의무는 각주와 상세에서 유지(09 §8) |
| "이 호의 분야" 칩(`SectorMix`) | 모바일 S1에서 제거한다. 분야는 각 행 메타에 이미 있다. 데스크톱 overview에는 유지한다 | 중복 |
| 행 = 로고·이름·tagline·메타 + **오른쪽 큰 금액** | 행 = 번호/체크·로고·이름·tagline·**'왜 지금' 한 줄**·메타(분야·국가·단계·금액은 일반 글자) | N12 "금액이 시선 중심", `trending_reason` 미사용 |
| 히어로 없음 | 히어로 1곳(개인 순서의 첫 안 읽은 회사) | B12 #B2 |
| 진척 링(0/5) | "5곳 중 n곳" 텍스트 + N칸 세그먼트 막대 | B12 #B2, 숫자 하드코딩 금지 |
| "여기서 시작" 카드(`ContinueCard`) | 히어로와 역할이 같으므로 **0곳 읽음일 때는 숨긴다**. 1곳 이상 읽고 덜 읽었을 때 "이어 읽기"는 히어로가 맡는다. 완독 카드만 남긴다 | 중복 |
| `editor_pick_comment` 미사용 | 히어로의 인용 한 줄로 쓴다 | N12 |
| `IntroCard` "한국에 아직 덜 알려진 해외…" | 폐기. 정체성 문장으로 대체한다(§4) | "해외" 충돌 |

- **히어로에 `trending_reason.summary`를 쓰지 않고 `editor_pick_comment`를 쓰는 이유**: 두 필드는 내용이 자주 겹친다. 예를 들어 솔리드뷰는 둘 다 "163억 시리즈C"를 말한다. 행에는 사실형인 '왜 지금'을, 히어로에는 해석형인 '한 줄 코멘트'를 둔다. 상세에서는 둘 다 보인다.
- 길이 근거(123곳 중앙값): `trending_reason.summary` 99자, `editor_pick_comment` 94자, `tagline` 36자. 375px 본문 폭에서 한글 99자는 약 3줄이다. 그래서 행의 '왜 지금'은 **1줄 말줄임**으로 한다(전문은 히어로나 상세에서 본다). 히어로의 코멘트는 3줄까지 보여준다.

### 3-2. 상태 A — 첫 실행 (신규, 읽음 0, 역할·관심 없음)

```
┌─────────────────────────────────────────┐ ← 상태 바 (엣지 투 엣지, 배경 이어짐)
│ Startup Daily                    (i)  🔔 │  app bar 상단 줄: 워드마크, 정보, 알림 벨
│                                          │
│ 10월 30일 · 제22호                         │  large title
│ 아직 모르는, 지금 뜨는 스타트업              │  정체성 문장 (첫 실행~첫 완독까지만)
│ AI가 공개 자료로 작성 · 링크 확인됨          │  회색 작은 글자 1줄 (첫 실행만)
├─────────────────────────────────────────┤
│ 오늘 5곳 · 약 4분          5곳 중 0곳 읽음  │  진척 줄
│ [    ][    ][    ][    ][    ]            │  N칸 세그먼트
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │  히어로 카드 (전체가 링크)
│ │ 01 · AI 인프라·반도체 · 한국           │ │
│ │ [로고56]  솔리드뷰                      │ │
│ │          SolidVue                     │ │
│ │ 국내 유일 라이다 센서 IC 팹리스           │ │  tagline
│ │ "목표 100억원을 넘긴 163억원 시리즈C는…   │ │  editor_pick_comment (3줄)
│ │  …본궤도에 올랐다는 신호다."   AI 코멘트  │ │
│ │ Series C · 누적 241억원        읽기 →  │ │  메타 (금액은 일반 글자)
│ └─────────────────────────────────────┘ │
│ 02 [로고] 카이노스                        │  행 1
│    소형 핵융합 발전 플랜트 …               │  tagline 1줄
│    ↑ 10월 시리즈A 확장으로 실증로 착공 …    │  '왜 지금' 1줄 말줄임
│    기후·에너지 · 미국 · Series A           │
│ 03 [로고] …                              │  행 2
│ 04 [로고] …                              │  행 3 (여기까지 첫 화면)
├─────────────────────────────────────────┤
│  최신 호        탐색          저장         │  하단 탭 64dp
└─────────────────────────────────────────┘
(아래로) 05 행 → "역할과 분야를 고르면 순서를 맞춰 드려요 ›" (C1을 건너뛴 경우 1회)
       → 지난주 카드(월·화) → 그때 그 회사 → 지난 호 3개
       → 각주 "AI가 공개 자료로 작성하고 모든 사실을 사람이 확인하지는 않아요 · 정정 기록 ›"
```

- 높이 예산(812 − 상태 바 24 − 탭 64 − 제스처 바 16 ≈ 708px):
  - app bar(large) 132
  - 진척 44
  - 히어로 268
  - 행 3개 × 84 = 252
  - 합계 696
- **"히어로 1 + 행 3곳 = 4곳"이 첫 화면에 든다**(현재 2.5곳).
- 히어로를 지나 스크롤하면 C1(취향 시트)을 한 번 띄운다(§1-4).
- 회사 이름 표기: 한국어판은 `name_ko` 아래 `name_en`(다를 때만), 영어판은 `name_en`만.
- 로고가 없으면(123곳 중 약 17%) 모노그램을 쓴다(기존 `Logo.jsx`).

### 3-3. 상태 B — 재방문, 새 호, 진행 중 (2/5 읽음, 역할 = 투자자, 관심 = 기후·에너지)

```
┌─────────────────────────────────────────┐
│ Startup Daily                    (i)  🔔 │
│ 10월 30일 · 제22호               [새 호]   │  정체성 문장 없음 (재방문)
├─────────────────────────────────────────┤
│ 오늘 5곳                  5곳 중 2곳 읽음   │
│ [████][████][    ][    ][    ]           │
├─────────────────────────────────────────┤
│ 내 관심 순 ▾                               │  순서가 발행 순과 다를 때만
│ ┌─────────────────────────────────────┐ │  히어로 = 개인 순서의 첫 '안 읽은' 회사
│ │ 이어 읽기 · 03 · 기후·에너지 · 미국      │ │
│ │ [로고] 카이노스                         │ │
│ │ 소형 핵융합 발전 플랜트 …                │ │
│ │ "…" (editor_pick_comment)  AI 코멘트   │ │
│ │ 투자자라면 · Series A $… · 리드 …        │ │  forRole 한 줄 (§1-5)
│ │                              읽기 →   │ │
│ └─────────────────────────────────────┘ │
│ ✓ [로고] 솔리드뷰         (읽음, 흐리게)    │  읽은 회사: 체크, 1줄로 압축
│ ✓ [로고] …                               │
│ 04 [로고] … / ↑ 왜 지금 1줄 / 메타          │
│ 05 [로고] …                              │
└─────────────────────────────────────────┘
```

- 읽은 행은 tagline과 '왜 지금'을 숨기고 1줄 높이(56px)로 줄인다. 이렇게 하면 안 읽은 회사가 첫 화면에 더 많이 남는다.
- 히어로의 위 라벨: 읽음 0이면 회사의 순서 번호, 1곳 이상이면 "이어 읽기"를 붙인다.
- `[새 호]` 배지는 기존 `sd_last_issue` 로직을 유지한다(4초 뒤 본 것으로 기록).

### 3-4. 상태 C — 오늘 호 완독

```
│ 10월 30일 · 제22호                         │
│ 5곳 중 5곳 읽음 ✓                          │
│ [████][████][████][████][████]           │
│ ┌─────────────────────────────────────┐ │  완독 카드가 히어로 자리로 올라온다
│ │ ✓ 제22호를 다 읽었어요                  │ │
│ │ 다음 호는 내일 나와요                   │ │  (cron 05:00 이전에는 시각 없이)
│ │ 내 분야 지난 회사                        │ │  §1-8 추천 3곳 (작은 행)
│ │  · [로고] 회사 A  기후·에너지 · 9월 호    │ │
│ │  · [로고] 회사 B  …                     │ │
│ │  · [로고] 회사 C  …                     │ │
│ │ [ 이 호 공유 ]                          │ │
│ └─────────────────────────────────────┘ │
│ ✓ 행 ×5 (1줄씩)                           │
```

- 완독 직후는 §5-5 알림 트리거 ②(아직 묻지 않았다면)와 §5-7 인앱 평점(조건이 맞으면)이 실행되는 순간이다. **둘이 같은 날 겹치면 알림 시트를 먼저 띄우고 평점은 다음 완독으로 미룬다.** 같은 세션에 시스템 대화상자를 두 번 띄우지 않는다.

### 3-5. 상태 D — 새 호 없음 (마지막 호가 2일 이상 지남)

```
│ 10월 30일 · 제22호                         │
│ ┌ 다음 호를 준비하고 있어요 ───────────────┐ │  기존 issue-head__stale 문구를 승격
│ │ 10월 30일 이후 새 호가 없어요.           │ │
│ │ 그동안 내 분야 지난 회사를 읽어 보세요.    │ │
│ └─────────────────────────────────────┘ │
│ (이후 상태 B/C 그대로)                       │
```

- 스트릭이나 "놓쳤어요" 같은 압박 문구는 쓰지 않는다(10 "하지 않을 것", B12 안티패턴).

### 3-6. 데스크톱(≥1024px)과 태블릿(≥600dp)

- 웹 데스크톱 3단 레이아웃(`IssueOverview`·`IssueRail`)은 구조를 유지한다. 바꾸는 것은 아래뿐이다.
  - 가운데 열의 `Preview`가 히어로와 같은 규칙(개인 순서의 첫 안 읽은 회사, `editor_pick_comment`, `forRole`)을 쓴다.
  - 왼쪽 목록 행(compact)에 '왜 지금'은 넣지 않는다. 폭이 좁기 때문이다.
  - `AiNote`는 오른쪽 레일의 "이 서비스는" 박스로 합친다(이미 같은 문구가 있다).
- Android 태블릿(600dp 이상)에서는 하단 탭을 내비게이션 레일로 바꾸고 목록-상세 2단으로 둔다(B12 #A1). 1.0에서는 태블릿 스크린샷을 내지 않으므로 레이아웃이 깨지지 않는 수준만 QA한다.

### 3-7. MVP / Later

| 항목 | 1.0 | Later |
|---|---|---|
| 히어로, 진척 막대, 행 '왜 지금', 금액 강등, 고지·분야 칩 정리 | O | |
| 상태 A~D 분기 | O | |
| 읽은 행 1줄 압축 | O | |
| 히어로 로고 대신 대표 이미지 | | O (이미지 데이터 없음) |

---

## 4. 정체성 문장

### 4-1. 충돌 확인 (데이터)

| 범위 | 한국 본사 | 비율 |
|---|---|---|
| 전체 123곳 | 28곳 | 23% |
| 10월 재개 이후 9개 호(10/22~10/30) 43곳 | 13곳 | **30%** |
| 제22호(10/30) | 5곳 중 2곳 | 40% |
| 한국 회사가 0곳인 날 | 9개 호 중 1개(10/23) | – |

- 생성기(`generate-daily.mjs` 139행)는 한국 후보를 **의도적으로** 다르게 처리한다(`korean ? 'tool' : true` 검색 모드). 그러니 한국 회사가 섞이는 것은 사고가 아니라 현재 선정 방식이다.
- "해외" 문구가 남아 있는 곳: `Onboarding.jsx` step 0, `Issue.jsx` `IntroCard`, R12 KO A·B 안(짧은 설명).

### 4-2. 선택지

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| A. "해외" 유지 + 선정에서 한국 제외 | 파이프라인에서 한국 후보를 뺀다 | 스토어 키워드 "해외 스타트업"이 정직해진다 | 생성기를 바꿔야 한다. 국내 딥테크(솔리드뷰 같은 곳)를 잃는다. 하루 5곳을 채우는 후보 풀이 줄어든다 |
| **B. 브랜드는 "아직 모르는", 설명은 "해외·국내" (권장)** | 브랜드 문장에서 지역을 뺀다. 스토어 짧은 설명과 긴 설명에서만 "해외·국내"를 밝힌다 | 데이터와 맞는다. 차별점("아직 모르는")이 지역보다 강하다(R12 §4-1: 이 자리를 잡은 앱이 없다). 영어판 정체성과 같은 축이다 | 한국 스토어 검색어 "해외 스타트업"의 제목 노출을 포기한다(짧은·긴 설명에는 남는다) |
| C. "국내외" 명시를 브랜드에 | "국내외 신생 스타트업 브리핑" | 정확하다 | 차별점이 흐려진다. 모든 스타트업 뉴스가 국내외다 |
| D. 비율 규칙 | 하루 한국 최대 1곳, "해외 중심" 표기 | "해외"를 유지할 수 있다 | 생성기 변경과 매일 감시가 필요하다. "중심"은 약한 말이다 |

**권장: B.** 이유는 셋이다. ① 실제 선정과 충돌하지 않는다. ② "아직 모르는"은 경쟁 앱 부제 어디에도 없는 약속이다. ③ 한국어판과 영어판의 정체성이 같은 축("you haven't heard of yet")에 선다. 사용자 확인 사항은 §6-1.

### 4-3. 확정 문안 (B안 기준, 글자 수는 직접 셈)

**앱 안 브랜드 한 줄**

| | 한국어 | 영어 |
|---|---|---|
| 브랜드 한 줄 (S1 첫 실행, 스플래시 다음 첫 프레임, About 머리, 공유 카드 하단) | 아직 모르는, 지금 뜨는 스타트업 (18) | Startups you haven't heard of yet (33) |
| 보조 문장 (About, C1 없음, 스토어 긴 설명) | 하루 한 묶음, 덜 알려진 국내외 신생 스타트업을 왜 지금 뜨는지와 함께 소개해요. | A handful of under-the-radar startups every day, with why they matter now. |

- "4곳" 같은 고정 숫자는 쓰지 않는다. 하루 4~5곳이고 4월에는 10곳이었다(N12, 데이터).
- 이 문장은 이미 `index.html <title>`과 `Onboarding.jsx` 제목에 있다. 새로 만드는 것이 아니라 **화면으로 꺼내는 것**이다.

**Google Play**

| 항목 | 한국어 | 영어 |
|---|---|---|
| 제목 (≤30) | `스타트업 데일리: 신생 스타트업 브리핑` (21) | `Startup Daily: New Startups` (27) |
| 짧은 설명 (≤80) | `매일 4~5곳, 아직 덜 알려진 해외·국내 신생 스타트업. 왜 지금 뜨는지, 한국에서 될지까지.` (53) | `4–5 startups a day you haven't heard of yet: why now, sources, and precedents.` (78) |

- R12 EN A의 "Four startups"는 5곳인 날과 맞지 않아 "4–5"로 고쳤다.
- R12 KO A의 "해외 스타트업"은 B안에 따라 "해외·국내"로 고쳤다. "해외"를 앞에 둔 이유는 검색 키워드다.
- 제목과 짧은 설명에 "AI", "#1", "Best", "무료"는 쓰지 않는다(R12 §4-2, §5 하지 말 것 6, B12 #H1).
- 영어 짧은 설명의 "precedents"는 §2 섹션이 1.0에 들어가는 것을 전제로 한다. 백필이 늦어지면 `…: why now, with sources.`(63자)로 낸다.

**긴 설명 첫 문단** (Play 긴 설명은 첫 몇 줄만 접힌 상태로 보이므로, 생성 방식 공개를 첫 문단에 넣는다. 근거: R12 §4-3, 11의 AI 반발 리뷰)

- 한국어
  > 스타트업 데일리는 아직 덜 알려진 신생 스타트업을 하루 한 묶음(4~5곳)으로 소개합니다. 해외 회사가 중심이고, 주목할 만한 국내 회사도 함께 다룹니다. 회사마다 왜 지금 뜨는지, 무엇을 만드는지, 경쟁사와 투자 흐름은 어떤지를 3~4분 분량으로 정리하고, 해외 회사에는 "한국에서는" 분석으로 한국 시장에서 될지까지 짚습니다. 모든 글은 AI가 공개 자료로 작성하고, 링크가 실제로 열리는지 확인한 뒤 싣습니다. 틀린 내용은 제보받아 공개 정정 기록에 남깁니다.
- 영어
  > Startup Daily brings you a handful of startups you haven't heard of yet, every day — 4 to 5 early companies from the US, Europe, Korea, Japan and beyond. For each one you get why it matters now, what it builds, who it competes with and how it's funded, in a few minutes of reading. Then "Precedents & Adjacent Markets" shows who tried the idea before, how that ended, and which markets sit next door. Every profile is researched by AI from public sources, every link is checked before it's published, and reported errors go into a public corrections log.

- "해외 회사가 중심이고"(한국어)는 B안의 정직성 장치다. 비율이 바뀌면(예: 한국 50% 초과) 이 문장을 고친다.

### 4-4. MVP / Later

- 1.0: 위 문안 전부, `Onboarding.jsx`·`IntroCard` 문구 교체(컴포넌트 자체를 폐기하므로 자연히 사라진다), About 머리 문장.
- Later: 스토어 A/B(Play 스토어 등록정보 실험)로 짧은 설명 "결과 약속형"과 "형식 약속형"을 비교한다(R12 §0-5).

---

## 5. Android 앱 골격 IA

### 5-1. 화면 트리 (해시 라우트 유지, 정적 호스팅)

```
하단 탭 (3) ─┬─ 최신 호  S1  #/                 ─ S2 지난 호 #/d/:date
            ├─ 탐색     S4  #/explore (?view=issues, ?sector=…) ─ 분야 #/t/:key, 주간
            └─ 저장     S5  #/saved
상세         S3  #/s/:id (?from=saved)      ← 어느 탭에서든 push
설정         S8  #/settings (신규)          ← S1 app bar 오버플로 / S4·S5 app bar 오버플로
소개         S6  #/about (?sec=corrections|how) ← S8 안의 링크
찾을 수 없음  S7
오버레이: C1 취향 시트 · C2 알림 시트 · 공유 시트 · 정정 제보 시트 · C3 스낵바/오프라인 띠
```

- **S8 설정을 About에서 분리하는 이유**: Android 사용자는 오버플로 메뉴에서 "설정"을 찾는다. 09 §5도 설정 화면을 새로 두라고 했다. 설정에는 다음이 들어간다.
  - 역할과 관심 분야
  - 순서(관심 순 / 발행 순)
  - 알림(시간대, 내 분야만, 끄기 → 시스템 앱 알림 설정 링크)
  - 테마
  - 글자 크기
  - 언어
  - 읽음 기록 초기화
  - 앱 정보(버전, 오픈소스 라이선스)
  - Play 리뷰 남기기(상세 페이지 링크. API 호출 아님, B12 #I1)
  - 소개·선정 기준·정정 기록(S6 링크)
  - AI 고지

### 5-2. 하단 탭 — 3개 유지

- 결정: **최신 호 / 탐색 / 저장**을 유지한다. 4번째 탭(설정·분야·주간)은 만들지 않는다.
- 근거:
  - M3 기준(3~5개)을 이미 충족한다(B12 #A1).
  - Google News는 탭을 4개에서 3개로 줄였다(B12 #A1).
  - 분야와 주간은 탐색 상단 칩으로 둔다(B12 안티패턴).
- 변경:
  - 높이 64dp, 알약 인디케이터
  - 저장 탭 점: "마지막으로 저장 탭을 연 뒤 새로 저장한 것이 있음"일 때만 켠다. 지금은 `saved.length>0`이면 항상 켜져 있다.
  - 최신 호 탭 점: `meta.last_issue_date > sd_last_issue`일 때 켠다.
  - 같은 탭을 다시 누르면 그 탭의 맨 위로 스크롤한다. 이미 맨 위라면 그 탭의 루트로 간다(예: S2에서 최신 호 탭 → S1).

### 5-3. Top app bar 동작

| 화면 | 형태 | 펼침 | 접힘 (스크롤 후) | 액션 (최대 2 + 오버플로) |
|---|---|---|---|---|
| S1 최신 호 | **large flexible** | 워드마크 줄 + "10월 30일 · 제22호" + (첫 실행) 정체성 문장 | small "제22호", 진척 숫자 "2/5"를 오른쪽에 | 알림 벨(C2 트리거 ③. 이미 허용했으면 S8 알림으로) · 오버플로(설정, 소개, 언어) |
| S2 지난 호 | small | "10월 29일 · 제21호" + ← | 같음 + lift | 공유 · 오버플로 |
| S3 상세 | small, 제목 페이드 | ←만 | 스크롤 40px 뒤 `name_ko`가 페이드인. 섹션 칩 줄은 바 아래에 붙는다(sticky) | 저장 · 공유 |
| S4 탐색 | **search app bar** | 검색 입력 + 오버플로 | 그대로 고정. 분야 칩 줄은 스크롤되어 사라진다 | 오버플로(설정) |
| S5 저장 | small | "저장 12" | lift | 오버플로(목록 링크 복사, 설정) |
| S8 설정·S6 소개 | small | 제목 + ← | lift | 없음 |

- 웹 헤더의 EN 버튼과 데스크톱 아이콘은 앱에서 빼고 오버플로의 "언어"로 옮긴다.
- 검색 아이콘은 S1에 두지 않는다. 검색은 탐색 탭이 맡는다(지금 `#/explore?focus=1`과 같은 동작을 탐색 탭이 대신한다).
- 상태 바 아이콘 색은 테마에 따라 바꾼다(`SystemBars.setStyle`, B12 #A3).

### 5-4. 뒤로가기 규칙 (B12 #A4)

back이 눌리면 아래를 **위에서부터 순서대로** 확인하고, 처음 맞는 것 하나만 처리한다.

| # | 상황 | 동작 |
|---|---|---|
| 1 | 시트(C1·C2·공유·정정)가 열려 있음 | 시트를 닫는다 (예측형 축소 모션) |
| 2 | 탐색 검색 입력에 포커스·텍스트가 있음 | 입력을 비우고 포커스를 해제한다 |
| 3 | S3 상세의 섹션 목차가 펼쳐져 있음 | 목차를 접는다 |
| 4 | 딥링크·위젯·푸시로 S3에 콜드 스타트 | 앱 실행 시 히스토리에 `#/`를 먼저 심어 두었으므로 → S1으로 간다 (앱 종료가 아님) |
| 5 | 앱 안 히스토리가 있음 (`canGoBack`) | `history.back()` |
| 6 | 탭 루트(S4·S5)에 있고 히스토리 없음 | S1(최신 호) 탭으로 간다 |
| 7 | S1 루트 | 시스템에 넘긴다(`toggleBackButtonHandler({enabled:false})`) → 예측형 "홈으로" 애니메이션 |

- "두 번 눌러 종료" 토스트는 쓰지 않는다. 예측형 뒤로가기와 충돌하고 Android 가이드에도 어긋난다.
- 탭 전환은 히스토리에 쌓지 않는다(`navigate(…, {replace:true})`). 그래야 back이 탭 사이를 핑퐁하지 않는다. 탭 안의 push(목록 → 상세)만 히스토리에 쌓는다.

### 5-5. 알림 권한: 맥락 트리거 + 사전 설득 시트 (C2)

**트리거** (B12 #D1, R12 §2-3, 09 §5). 첫 실행에서는 묻지 않는다.

| # | 트리거 | 조건 | 시트 첫 줄 |
|---|---|---|---|
| ① | 처음으로 저장했을 때 | `saved_startups` 0 → 1, 저장 스낵바 다음 | "저장한 회사에 새 소식이 생기면 알려 드릴까요?" (Later "그때 그 회사" 알림과 연결. 1.0에서는 새 호 알림과 같은 시트를 쓰고 첫 줄만 다르다) |
| ② | 오늘 호를 다 읽었을 때 | `sd_read`가 그날 건수에 도달, 완독 카드가 나타난 뒤 1초 | "내일 호가 나오면 알려 드릴까요?" |
| ③ | S1 app bar 알림 벨을 탭했을 때 | 언제든 | "새 호가 나오면 알려 드릴까요?" |

- 자동 트리거(①②)는 **설치 후 한 번씩만** 띄운다. "나중에"를 누르면 같은 트리거로 다시 띄우지 않는다. ③은 사용자가 직접 누른 것이므로 언제든 띄운다.
- 시스템 대화상자에서 거절하면, `shouldShowRequestPermissionRationale()`이 true일 때만 다음 ③에서 한 번 더 시스템 대화상자를 연다. 그 뒤로는 시트의 버튼이 "알림 설정 열기"(앱 알림 설정 화면)로 바뀐다.

**사전 설득 시트 문구** (한국어 / 영어)

```
┌───────────────────────────────────────┐
│ ─────                                  │
│ 내일 호가 나오면 알려 드릴까요?            │  ← 트리거별 첫 줄
│                                        │
│ · 하루 한 번, 새 호가 올라왔을 때만        │
│ · 첫 줄에 내 관심 분야 회사를 먼저        │  ← 관심 분야가 있을 때만
│ · 광고나 홍보 알림은 보내지 않아요         │
│                                        │
│ [✓] 내 관심 분야 회사가 있는 날만          │  ← 관심 분야가 있을 때만, 기본 꺼짐
│                                        │
│ [ 나중에 ]            [ 알림 받기 ]      │
└───────────────────────────────────────┘
```

| 요소 | 한국어 | 영어 |
|---|---|---|
| 첫 줄 ① | 저장한 회사에 새 소식이 생기면 알려 드릴까요? | Want a heads-up when a saved company has news? |
| 첫 줄 ② | 내일 호가 나오면 알려 드릴까요? | Want a heads-up when tomorrow's issue is out? |
| 첫 줄 ③ | 새 호가 나오면 알려 드릴까요? | Want a heads-up when a new issue is out? |
| 약속 1 | 하루 한 번, 새 호가 올라왔을 때만 | Once a day, only when a new issue is out |
| 약속 1 (cron 05:00 이전 이후) | 하루 한 번, 아침에 새 호가 올라오면 | Once a day, when the morning issue is out |
| 약속 2 | 첫 줄에 내 관심 분야 회사를 먼저 | Companies in your sectors come first |
| 약속 3 | 광고나 홍보 알림은 보내지 않아요 | No ads, no promos |
| 토글 | 내 관심 분야 회사가 있는 날만 | Only on days with a company in my sectors |
| 버튼 | 나중에 / 알림 받기 | Not now / Turn on |
| 거절 후 버튼 | 알림 설정 열기 | Open notification settings |
| 허용 후 스낵바 | 알림을 켰어요 · 설정에서 바꿀 수 있어요 | Notifications on · change anytime in Settings |

- 시각을 고르는 UI(`AlertSetting.jsx`의 7·8·9시)는 시트에 넣지 않고 S8로 옮긴다. 시트는 결정 하나만 묻는다. 시각 선택은 발송 파이프라인이 그 시각을 지킬 수 있을 때(09 cron 05:00) S8에서 연다.
- "아침" 약속 문구는 cron 이전이 끝난 뒤에만 켠다(§1-7).

### 5-6. 상태 화면 5종 문구 (C3)

| 상태 | 표시 방식 | 한국어 | 영어 | 동작 |
|---|---|---|---|---|
| **로딩** (첫 실행, 데이터 없음) | 시스템 스플래시가 첫 렌더까지 유지된다(B12 #B1). 그 뒤에는 행 뼈대 4줄. 텍스트 없음 | (텍스트 없음). 3초가 지나면 뼈대 아래에 "오늘 호를 받아오는 중이에요" | "Getting today's issue" | 8초가 지나면 오류 상태로 넘어간다 |
| 로딩 (분석 생성) | 물결형 진행 막대 + 단계 문구 + 경과 시간 | 기존 PHASES 문구 유지("비슷한 해외 제품을 찾는 중이에요" 등). "약 2~3분 걸려요 · 다른 화면에 다녀와도 돼요" | §2-4 문구. "Takes 2–3 minutes · feel free to look around" | 완료되면 어디서든 스낵바 "분석이 준비됐어요 · 보기" |
| **오프라인** | app bar 아래 얇은 띠(닫기 없음, 다시 연결되면 자동으로 사라짐) | 오프라인 · 받아 둔 호와 저장한 회사만 볼 수 있어요 | Offline · you can read issues you've opened and saved companies | 분석 생성, 외부 링크, 공유 이미지 버튼은 비활성화하고 버튼 아래에 "연결되면 쓸 수 있어요" / "Needs a connection" |
| 오프라인 (첫 실행에 데이터 없음) | 전체 화면 빈 상태 | 인터넷에 연결하면 오늘 호를 받아올게요 | Connect to the internet to get today's issue | [다시 시도] |
| **빈 상태** — 저장 0 | S5 본문 | 회사 카드의 북마크를 누르면 여기 모여요 | Tap the bookmark on any company to keep it here | [오늘 호 보기] |
| 빈 상태 — 검색 0 | S4 본문 | "{q}"와 맞는 회사가 없어요. 이런 분야는 어때요? + 분야 칩 3개(회사 수 상위) | No companies match "{q}". Try a sector: + 칩 3개 | 칩 탭 → 필터 |
| 빈 상태 — 새 호 공백 | S1 §3-5 | 다음 호를 준비하고 있어요 · {M월 D일} 이후 새 호가 없어요 | The next issue is on its way · nothing new since {Mon D} | [내 분야 지난 회사] |
| **오류** (데이터·네트워크) | 스낵바(하단 탭 위, 인셋 포함), 액션 1개 | 불러오지 못했어요 | Couldn't load this | [다시 시도] / [Retry] |
| 오류 (상세 전체 레코드 실패, `level='failed'`) | S3 본문 | 이 회사의 전체 내용을 받지 못했어요. 목록 정보만 보여 드려요 | We couldn't get the full profile. Showing the summary only | [다시 시도] |
| 오류 (분석 생성 실패) | 섹션 안 | 서버 메시지를 그대로 쓴다(이미 존댓말 한국어). 영어판은 API가 `lang=en`일 때 영어 메시지를 돌려준다(현재 한국어만 있음 → 추가 필요) | – | [다시 시도] |
| **업데이트** — 새 호 (앱 실행 중) | 스낵바 (기존 10 §2-11) | 새 호가 나왔어요 | A new issue is out | [보기] → S1 맨 위로 + 데이터 갱신. 분석 생성 중에는 미룬다(`lensBusy`) |
| 업데이트 — 당겨서 새로고침 (S1만) | 원형 컨테이너 인디케이터 | 새 호가 없으면: 최신 호예요 · 다음 호는 내일 나와요 | You're up to date · next issue tomorrow | – |
| 업데이트 — 앱 버전 (선택) | Play In-App Updates **flexible**. 데이터 스키마가 바뀌어 `meta.json.min_app_version`보다 낮으면 **immediate** | (Play 시스템 UI) 강제일 때 앱 안 문구: 새 호를 보려면 앱을 업데이트해 주세요 | Update the app to see new issues | [업데이트] |

- **`min_app_version`** 필드를 `meta.json`에 새로 둔다(1.0 필수). 데이터를 원격에서 받는 구조(09 Phase 0)에서는 앱 번들과 데이터 스키마가 어긋날 수 있다. 이 필드가 그 안전판이다.

### 5-7. 인앱 평점 시점 (B12 #I1)

- 아래 조건을 **모두** 만족하면, 오늘 호를 완독한 직후 화면 전환 사이에 `launchReviewFlow`를 1회 호출한다.
  1. 서로 다른 3개 호 이상에서 완독
  2. 첫 설치 후 7일 이상
  3. 최근 7일 안에 오류 스낵바나 정정 제보가 없음
  4. 같은 세션에 C2 알림 시트를 띄우지 않았음(§3-4)
  5. 마지막 호출 후 90일 이상
- 사전 질문("마음에 드세요?")은 하지 않고, 버튼으로 API를 부르지도 않는다. 저장 키는 `sd_review_asked: 'YYYY-MM-DD'`(신규)다.

### 5-8. 위젯 (1.1) 정보 구성과 딥링크

| 크기 | 내용 | 데이터 | 탭 동작 |
|---|---|---|---|
| **2×2** | 헤더: 앱 아이콘 + "제22호". 본문: 로고(모노그램 폴백) + 개인 순서 첫 **안 읽은** 회사 `name_ko` + `tagline` 2줄. 하단: "5곳 중 2곳" | `logo_url`, `name_ko`, `tagline`, 그날 건수, 앱이 마지막으로 기록한 읽음 수 | 본문 → `#/s/{id}`, 하단 → `#/` |
| **4×2** | 헤더: "오늘의 스타트업 · 10월 30일" + 진척 "2/5". 본문: 4~5곳 한 줄 목록(읽음은 ✓, 개인 순서). 각 줄 = `name_ko` · `_sector.label` | `date`, `name_ko`, 분야, 읽음 | 각 줄 → `#/s/{id}`, 헤더 → `#/` |
| 빈 상태 | "다음 호를 준비하고 있어요 · 지난 호 보기" | `last_issue_date`가 오늘이 아님 | → `#/explore?view=issues` |
| 오류·첫 설치 | "앱을 한 번 열면 오늘 호가 여기 보여요" | 데이터 없음 | → 앱 |

- 금액은 위젯에 넣지 않는다(§3과 같은 원칙). 4×4는 1.1 범위 밖이다(B12는 '왜 지금'을 넣은 4×4를 제안했지만, 2개 크기면 Tier 1 요건이 충족된다).
- 갱신: 앱이 실행되거나 새 호를 받을 때 SharedPreferences에 오늘 분과 개인 순서를 기록한다. 하루 1회 WorkManager가 `meta.json`을 확인한다.
- **딥링크 체계** (vercel.json 없이 동작):
  - **App Links**: `https://startup-daily.vercel.app/s/{id}`
    - 이미 정적 공유 페이지가 있는 경로다(`shareUrl`).
    - `public/.well-known/assetlinks.json`은 정적 파일이므로 rewrites가 필요 없다.
    - 앱이 있으면 앱의 `#/s/{id}`로, 없으면 지금처럼 웹으로 간다.
  - **앱 내부 전용 스킴**: `startupdaily://open?h=%23%2Fs%2F{id}`. 위젯과 푸시 `url`에 쓴다. 해시를 그대로 넘기므로 라우터를 바꿀 필요가 없다.
  - 푸시 `url`은 지금 `/#/`다. 관심 회사가 첫 줄이면 그 회사의 `#/s/{id}`로 보낸다(§1-7).
  - 콜드 스타트 딥링크는 §5-4 규칙 4에 따라 `#/`를 히스토리에 먼저 심는다.

### 5-9. 스토어 스크린샷 6장 메시지 순서

- 원칙(B12 #H2):
  - 캡션은 위쪽 20% 미만이고, 아래 80%는 실제 화면이다.
  - 기기 프레임 없이 엣지 투 엣지로 보여준다.
  - 첫 3장은 실제 UI 중심이다.
  - "AI가 쓴"을 강조 문구로 쓰지 않는다.
  - 9:16, 1080×1920 이상이다.
- 1~3장은 두 언어가 같은 흐름이고, 4장이 판별 차별점(한국어 "한국에서는" / 영어 "Precedents")이다.

| # | 메시지 | 한국어 캡션 | 영어 캡션 | 화면 |
|---|---|---|---|---|
| 1 | 정체성 | 아직 모르는, 지금 뜨는 스타트업 | Startups you haven't heard of yet | S1 상태 A (히어로 + 진척 + 행 3곳) |
| 2 | 끝이 있는 분량 | 하루 4~5곳, 몇 분이면 끝 | 4–5 a day. Done in minutes | S1 상태 B (진척 2/5, 읽은 행 압축, "내 관심 순") |
| 3 | 왜 지금 | 왜 지금 뜨는지 한눈에 | Why it matters now, at a glance | S3 '왜 지금' 섹션 + `catalysts` |
| 4 | 판별 차별점 | 한국에서 될지까지 | Who tried this before — and how it ended | KO: S3 "한국에서는" 결론 박스 + 비슷한 것들 / EN: S3 Precedents (verdict + headline + 첫 선례) |
| 5 | 내게 맞게 | 내 역할, 내 분야 순서로 | Ordered for your role and sectors | C1 취향 시트 2단계 위에 S1 히어로의 "○○라면" 줄이 비치는 합성(실제 화면 두 장) |
| 6 | 신뢰 | 출처를 열어 확인할 수 있어요 | Every source, checked and linked | S3 출처 섹션(검증 표시) + 정정 기록 링크 |

- 11 §2-2의 iOS 관찰(가치 문장 → 대표 화면 → 개인화)과 비교하면, 개인화를 5장으로 늦췄다. 이유는 R12 §2-3이다. 이 앱의 핵심은 개인화가 아니라 "모두가 같은 묶음"이므로, 개인화를 첫 메시지로 팔면 약속이 틀어진다.
- 위젯이 출시되면(1.1) 6장을 위젯으로 바꾸고, 신뢰 메시지는 5장 캡션 하단에 합친다.
- 피처 그래픽(1024×500): 페이퍼 톤 단색 배경, 회사 카드 3장을 부채꼴로 배치, 문구는 브랜드 한 줄 하나만(B12 #H2).

### 5-10. MVP / Later

| 항목 | 1.0 | 1.1 | Later |
|---|---|---|---|
| 하단 탭 64dp·점 규칙·재탭 동작 | O | | |
| top app bar 화면별 형태 | O | | |
| back 규칙 7단계 + 콜드 스타트 히스토리 심기 | O | | |
| S8 설정 분리 | O | | |
| C2 알림 시트 + 트리거 3개 + FCM | O | | |
| 상태 5종 문구 + `min_app_version` | O | | |
| 인앱 평점 | O | | |
| App Links `/s/{id}` | O | | |
| 위젯 2×2 / 4×2 + 내부 스킴 | | O | |
| 저장한 회사 새 소식 알림(트리거 ①의 본래 약속) | | | O (10 §3-20 "그때 그 회사" 알림) |
| 태블릿 레이아웃·스크린샷 | | | O |

---

## 6. 사용자 결정이 필요한 것

진짜 필요한 것만 남겼다. 나머지는 이 문서에서 권장안으로 확정했다.

1. **정체성과 한국 회사 선정 (§4-2)**
   - 최근 호의 30%가 한국 회사다. 권장은 **B안**이다: 선정은 지금처럼 섞고, 브랜드 문장에서 "해외"를 빼고("아직 모르는, 지금 뜨는 스타트업"), 스토어 설명에는 "해외·국내"를 쓴다.
   - "해외 스타트업 전문"이라는 정체성을 지키고 싶다면 A안(선정에서 한국 제외, 생성기 수정)으로 가야 한다.
   - 둘 중 무엇인지 알려 주세요.

2. **영어판 출시 범위 (§2-7)**
   - Play 영어 등록정보와 스크린샷 4장이 "Precedents"를 약속한다. 그러려면 출시 전에 최근 3개 호(약 15곳)를 백필하고, 사람이 10곳을 검증해야 한다(06 §5·§6과 같은 절차, 약 $1.5 + 검증 반나절).
   - 이 작업을 1.0 출시 전에 할지, 아니면 영어 등록정보를 "why now, with sources"로 먼저 내고 섹션은 1.0.x로 붙일지 정해 주세요.
   - 권장은 출시 전 백필이다. 영어판의 유일한 차별점이기 때문이다.

### 선행 조건 (결정은 아니지만 일정에 영향)

- 09 Phase 0(데이터 원격 로딩)은 이미 `load.js`의 fetch 구조로 대부분 되어 있다. 남은 것은 `min_app_version` 필드와 오프라인 캐시 범위다.
- cron 05:00 이전(09 §2)이 끝나기 전에는 알림 시트와 설정에 "아침" 시각 약속을 쓰지 않는다(§1-7, §5-5).
- 푸시 서버에 `lang` 필드를 추가하기 전까지 영어판에는 알림 시트를 띄우지 않는다. 띄우면 영어 사용자에게 한국어 알림이 간다.
