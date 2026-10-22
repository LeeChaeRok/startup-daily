---
name: ui-qa
description: Startup Daily 프론트엔드 변경의 QA 체크리스트(빌드/린트, 스펙 대조, 데이터 엣지케이스, 반응형, 접근성, 다크모드, PWA). "QA", "검증", "버그 찾아", "점검", "리뷰해줘", "QA만 다시" 요청 또는 구현 직후 반드시 사용할 것.
---

# UI QA

## 1. 자동 검사
```bash
npm run build && npm run lint
```
실패 시 로그를 보고서에 그대로 첨부한다.

## 2. 데이터 경계 교차 검증
`src/data/startups.json`의 실제 레코드로 확인한다. 스크립트 예:
```bash
node -e 'const d=require("./src/data/startups.json");/* 누락 필드 집계 */'
```
- 필드 누락(founders 빈 배열, funding 없음, funding_history 내 investors/lead_investor 혼재, related_links의 label/title 혼재)에서 렌더가 깨지지 않는가.
- 긴 텍스트(태그라인, 회사명), 많은 카테고리, 비정형 company_stage("Public (NASDAQ: RXRX)")에서 레이아웃이 넘치지 않는가.
- 날짜/지역 필터 조합에서 빈 결과가 처리되는가.

## 3. 화면 검증 (브라우저 가능 시)
- 375px, 768px, 1280px. 가로 스크롤 없음.
- 라이트/다크(prefers-color-scheme).
- 키보드 탭 순서, focus-visible, aria-label(아이콘 버튼), 이미지 alt.
- 저장 → 새로고침 후 유지(localStorage), 해시 라우트 직접 진입/뒤로가기.

## 4. 보고서 형식
```
| ID | 심각도 | 화면 | 재현 | 기대 | 실제 | 위치(file:line) |
```
P0: 크래시/데이터 손실/빌드 실패, P1: 주요 플로우 장애·접근성 차단, P2: 시각 결함·개선.
