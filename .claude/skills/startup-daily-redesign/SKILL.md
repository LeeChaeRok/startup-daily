---
name: startup-daily-redesign
description: Startup Daily 웹 매거진의 리서치→설계→구현→QA 전 과정을 전문가 에이전트로 조율하는 오케스트레이터. "개편", "고도화", "리디자인", "UI 개선", "디자인 바꿔", "기능 추가", "유사앱 조사", "시장 조사", "디자인 시스템 수정", "다시 실행", "이전 결과 기반으로 개선", "QA만 다시", "리서치만 다시" 등 Startup Daily 화면·경험·기획에 관한 요청이면 반드시 이 스킬을 사용할 것. 데일리 데이터 추가(startups.json 생성)나 단순 배포 요청에는 사용하지 않는다.
---

# Startup Daily Redesign Orchestrator

**실행 모드:** 하이브리드 — 리서치·설계는 서브 에이전트 병렬(팀 통신 불필요, 결과만 파일로 수집), 구현은 리더(메인)가 직접 수행하거나 frontend-engineer 위임, QA는 독립 서브 에이전트.

모든 Agent 호출에 `model: "opus"`를 명시한다.

## Phase 0: 컨텍스트 확인
1. `_workspace/` 존재 여부 확인
   - 없음 → 초기 실행 (Phase 1부터)
   - 있음 + 부분 요청("QA만", "리서치 보강") → 해당 Phase의 에이전트만 재호출
   - 있음 + 새 방향 제시 → `_workspace`를 `_workspace_prev/`로 옮기고 새 실행
2. 현재 앱을 브라우저로 띄워(`.claude/launch.json`의 `startup-daily`) 375px/1280px 스크린샷으로 현 상태를 확인한다.

## Phase 1: 리서치 (서브 에이전트 2개 병렬, run_in_background)
| 에이전트 | 스킬 | 산출물 |
|---|---|---|
| market-researcher | market-benchmark (시장 리서치) | `_workspace/01_market-researcher_market.md` |
| product-benchmarker | market-benchmark (UX 벤치마크) | `_workspace/01_product-benchmarker_patterns.md` |

리더는 그동안 Chrome(claude-in-chrome)으로 핵심 레퍼런스 3~5개를 직접 열어 보고 `_workspace/01_lead_chrome-notes.md`에 관찰을 남긴다 — 서브 에이전트는 사용자의 실제 브라우저를 쓸 수 없기 때문이다.

## Phase 2: 설계 (서브 에이전트 2개 병렬)
| 에이전트 | 스킬 | 산출물 |
|---|---|---|
| ux-architect | (에이전트 정의) | `_workspace/02_ux-architect_ia.md` |
| visual-designer | editorial-design-system | `_workspace/02_visual-designer_system.md` |

## Phase 3: 통합 스펙 (리더)
두 설계 문서를 대조해 충돌을 해소하고 `_workspace/03_final_spec.md`를 쓴다. 포함: 화면 목록, 컴포넌트 트리, 토큰, MVP 범위/Later 범위, 결정 근거. 충돌은 삭제하지 않고 "결정: X (대안 Y는 ~때문에 보류)"로 남긴다.

## Phase 4: 구현
frontend-engineer 정의를 따른다. 데이터 스키마는 유지. `npm run build` + `npm run lint` 통과 필수.

## Phase 5: QA (서브 에이전트) + 브라우저 검증 (리더)
- ui-qa-reviewer → `_workspace/05_ui-qa-reviewer_report.md`
- 리더는 375px·1280px, 라이트/다크에서 직접 확인. P0/P1 수정 후 재검증.

## 데이터 흐름
```
현재 코드/스크린샷 ─┬→ market-researcher ─┐
                   ├→ product-benchmarker ┼→ ux-architect ─┐
리더 Chrome 노트 ───┘                     └→ visual-designer ┴→ 03_final_spec → 구현 → QA
```

## 에러 핸들링
- 에이전트 실패: 1회 재시도, 재실패 시 해당 산출물 없이 진행하고 최종 보고에 누락 명시.
- 리서치 출처 상충: 둘 다 출처와 함께 남긴다.
- 빌드 실패: 원인 수정 후 재빌드. 3회 실패 시 사용자에게 보고.

## 사용자 메모리 준수
- 배포는 `vercel --prod --yes`, vercel.json 추가 금지.
- 스타트업 선정은 유명 회사 회피 원칙 유지 (데이터 생성 시).

## 테스트 시나리오
- 정상: "Startup Daily 고도화해줘" → Phase 0~5 전부 실행, 01~05 산출물 생성, 빌드 통과, 브라우저 검증.
- 부분: "QA만 다시 돌려줘" → `_workspace` 존재 확인 → ui-qa-reviewer만 재호출 → 05 보고서 갱신.
- 에러: product-benchmarker가 웹 접근 실패 → 1회 재시도 → 실패 시 리더 Chrome 노트만으로 Phase 2 진행, 최종 보고에 명시.
