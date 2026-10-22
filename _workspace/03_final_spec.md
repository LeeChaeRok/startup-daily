# 03. 통합 스펙 (리더) — 2026-10-22

기준 문서: `02_ux-architect_ia.md`(IA, 화면 ID S1–S7) + `02_visual-designer_system.md`(토큰·컴포넌트). 이 문서는 두 문서의 **충돌 해소와 MVP 범위 확정**만 기록한다. 세부 스펙은 원문을 따른다.

## 1. 충돌 해소

| # | 쟁점 | 결정 | 보류한 대안과 이유 |
|---|---|---|---|
| C1 | 홈 상단 "에디터 픽" 리드 카드(VD 5-4) vs 균일 행(IA S1) | **균일 행 리스트**. 데스크톱 가운데 칼럼에서만 첫 회사 미리보기 | 리드 카드는 위계를 주지만 사람 편집자가 고르지 않는데 "픽"처럼 보이게 한다(IA D5, 시장 리서치 "하지 말 것" 2) |
| C2 | "에디터 한 줄" 라벨 | **"한 줄 코멘트" + "AI 작성" 태그** | 사람 에디터 뉘앙스 금지 |
| C3 | 분야 색 텍스트(IA) vs 색 없음(VD) | **색 없음**: 6px 정사각 점 + 텍스트 | 액센트 5% 규칙, 카테고리 색 매핑 금지 |
| C4 | 상세에서 탭바 유지(VD) vs 액션바 대체(IA) | **액션바(저장·공유·다음 회사)** | 상세의 1차 행동은 저장·다음이며 탭 이동은 헤더 ←로 충분 |
| C5 | 데스크톱 홈: 12칼럼 편집 그리드(VD) vs 분할(IA) | **분할**: 왼쪽 호 목록(sticky) · 가운데 호 개요 · 오른쪽 레일(≥1280) | 홈→상세 전환 시 왼쪽 목록이 그대로 유지되어 맥락 손실 없음 |
| C6 | 칼럼 폭 300/616/220(VD) vs 340·360/680/260(IA) | **320 / minmax(0, 680) / 240**, 컨테이너 1320 | 본문 34–36em 유지 + 목록 행 정보량 확보 |
| C7 | 헤더 48(IA) vs 52(VD) | **52px** (데스크톱 64) | 아이콘 버튼 44 + 여백 |
| C8 | 로고 이미지 채택 기준 naturalWidth ≥64(VD) vs ≥32(IA) | **≥48** | 64는 대부분 파비콘을 버리고, 32는 흐릿한 업스케일을 허용 |
| C9 | 탐색 데스크톱 표 | **표 채택**(정렬 가능 th) | VC·전략팀 세그먼트의 비교 니즈 |

## 2. 리드 결정 (IA §10 질문)
1. 신뢰 문구: "자동으로 생성되며, 모든 사실을 사람이 검증하지는 않습니다." — 생성 파이프라인(GitHub Actions → Claude API)에 사람 검수 단계가 없으므로 사실에 부합.
2. "최신 소식 검색 ↗"(Google News 검색 URL): **MVP 포함**. 지어낸 링크가 아니라 검색이므로 신뢰를 해치지 않고, 6개월 낡은 데이터를 보완한다.
3. 기준 위반 회사(상장·인수): **보여 주고 S6에서 예외로 자동 집계**. 숨기면 호 구성과 공유 링크가 깨진다.

## 3. 구현 범위 (이번 실행)
- MVP P0 전부, P1 전부(사이트 공통 OG 포함), P2 중 내보내기·같은 분야 3곳·←/→ 단축키.
- Later는 `02_ux-architect_ia.md` §10 Later 표 그대로 이관(생성기 스펙).

## 4. 코드 구조
```
src/
  lib/data.js       정규화(sector/stage/region/correction), 호 헬퍼, 검색
  lib/hooks.js      라우터, 저장/읽음 공유 스토어(로컬 날짜), 테마, 미디어쿼리
  lib/format.js     날짜·숫자 포맷, numClass, 읽기 시간
  lib/share.js      Web Share → 클립보드 → 수동 복사 시트
  components/       Icon, Logo, AppHeader, TabBar, StartupRow, IssueHeader, ...
  screens/          IssueScreen(S1/S2), DetailScreen(S3), ExploreScreen(S4),
                    SavedScreen(S5), AboutScreen(S6), NotFound(S7)
  styles/tokens.css 토큰(VD 1-3 그대로), styles/app.css 컴포넌트
```
삭제: `components/slides/*`, `StartupCard`, `AccordionSection` 등 v1 컴포넌트, `App.css`, `index.css`, `design-tokens.css`. (v1 백업: `_workspace/backup_pre_redesign/`)

## 5. 데이터 버그 처리
- `stageLabel`: pre-ipo/late를 public보다 먼저 검사.
- `funding.total_raised` "M+" 2건: `cleanAmount` → "미공개".
- 읽음 기록: 로컬 날짜, 공유 스토어.
