---
target: 홈 이슈 화면 + 상세·탐색 (재검)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/roki/Desktop/project/startup-new/startup-daily/src/screens/Issue.jsx"
target_fingerprint: "sha256:ef8db6ed1c45337d1fb7000fc99c00bc8dae88bb929b877a8455825afc16d480"
target_path: /Users/roki/Desktop/project/startup-new/startup-daily/src/screens/Issue.jsx
timestamp: 2026-11-05T08-32-01Z
slug: src-screens-issue-jsx
---
# Critique #2: 홈 이슈 화면 + 상세·탐색·설정 (수정 배포 9d30c70 이후)
Method: dual-agent (A: design review · B: detector+CDP)

## Heuristics 26/40
1 상태 3 · 2 실세계 3 · 3 통제 2 · 4 일관성 2 · 5 오류예방 3 · 6 인지 2 · 7 효율 2 · 8 미니멀 3 · 9 복구 3 · 10 도움말 3

## Priority issues
- [P1] 내 5곳 → 상세 맥락 상실: detail-hooks.jsx:178 useContextList가 공용 5곳만 봄 → 풀 전용 회사는 위치·다음 없음, "이 호로 돌아가기", 배너 사실 오류 (풀 공개 시 드러남)
- [P1] 취향 시트 자동 노출: Issue.jsx:831-845 히어로가 스크롤 아웃되면 시트가 뜸
- [P1] 홈 행 태그라인 1줄 clamp(app.css:1070), 히어로 AI 코멘트 2줄 clamp(1041)
- [P2] 순서 체계 3개 + 효과 없는 '호 안의 순서' 설정(Settings.jsx:84-97)
- [P2] 상세 상단 투자 사실 4회 반복, '투자자라면' 줄 가치 낮음(personal.js:197-202)
- [P3] 진행 막대 분야색 범례 없음·AI=검정 칸 오독·0/5일 때 거의 안 보임; 액션바 아이콘 라벨 없음

## Detector
CLI 1건(splash low-contrast 오탐). CDP 6 routes: cream-palette 6(의도 토큰), cramped-padding 1(상세 1280 compare__self td 왼쪽 0 — 사실상 오탐), em-dash 47(탐색, 생성 데이터 원인). 이전 실제 문제 3건(읽은 행 대비 2, 패딩 1) 해소.
