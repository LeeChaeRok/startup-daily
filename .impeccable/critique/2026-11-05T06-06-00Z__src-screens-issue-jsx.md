---
target: 홈 이슈 화면 + 상세·탐색
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/roki/Desktop/project/startup-new/startup-daily/src/screens/Issue.jsx"
target_fingerprint: "sha256:588686efb7dd6c58b87c9f4ede9c4b7ecf24a7091b9df4ad7bd7e3989fd2acd5"
target_path: /Users/roki/Desktop/project/startup-new/startup-daily/src/screens/Issue.jsx
timestamp: 2026-11-05T06-06-00Z
slug: src-screens-issue-jsx
---
# Critique: 홈 이슈 화면 (src/screens/Issue.jsx) + 상세·탐색·취향 시트
Method: dual-agent (A: design review · B: detector+CDP)

## Heuristics 27/40
1 상태 3 · 2 실세계 3 · 3 통제 3 · 4 일관성 2 · 5 오류예방 3 · 6 인지 3 · 7 효율 2 · 8 미니멀 2 · 9 복구 3 · 10 도움말 3

## Priority issues
- [P1] 개인화 설명 문구 모순: Settings.jsx:73 "오늘의 묶음은 모두에게 같아요"가 poolLive 분기 없이 고정 → 풀 공개 시 내 5곳과 충돌
- [P1] 투자 타임라인 누락: Detail.jsx:403 latest_round를 funding_history가 비었을 때만 추가 → Gardens Series B $35M 누락, "라운드 2회"(1065) 오표기
- [P1] 상세 화면 과밀: 8섹션 × "약 1분" × "틀린 내용이 있나요?" 반복, 왜 지금 중복, 탭 8개
- [P2] 홈 상단 개인화 두 축(내/모두 탭 + 내 관심 순 정렬) 중복
- [P2] 탐색 첫 화면 15+ 선택지, USD/원화 혼재 정렬; 취향 시트 편집모드 14~23 선택지
- [P2] 읽은 행 opacity .55 (app.css:412) → 태그라인 2.9:1 대비 미달
- [P3] compare__self td 좌우 패딩 0 (app.css:610) 데스크톱

## Detector
CLI 1건(index.html splash low-contrast, 오탐: 실제 배경 #1A1915). CDP 6 routes: cream-palette 전부(의도된 토큰), deskdetail low-contrast 2 + cramped-padding 1(실제), explore em-dash advisory(데이터 문구).
