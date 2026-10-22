---
name: market-benchmark
description: 스타트업 미디어·뉴스레터·스타트업 DB·큐레이션 앱의 시장 조사와 UX 벤치마크 절차. 경쟁사 조사, 유사앱 분석, 포지셔닝, 리텐션 장치, 화면 패턴 카탈로그 작성이 필요하면 이 스킬을 사용할 것. "시장 조사", "경쟁 서비스", "유사 앱", "벤치마크", "레퍼런스 찾아줘", "리서치 보강" 요청에 트리거.
---

# Market & UX Benchmark

## 공통 규칙
- 모든 사실 주장에 출처 URL. 수치는 기준 시점(연/월) 명시.
- 결론 섹션 필수: "Startup Daily가 할 것 / 하지 말 것".
- 1,500~3,000단어. 표를 적극 사용한다 — 설계자가 빠르게 비교해야 하기 때문이다.

## A. 시장 리서치 (market-researcher)
조사 축:
1. **국내 스타트업 미디어/뉴스레터**: 예) 플래텀, 벤처스퀘어, 아웃스탠딩, 더브이씨(THE VC), 혁신의숲, 스타트업레시피, 뉴닉/어피티류 뉴스레터, 캐릿 등. 포맷, 주기, 유료화, 독자층.
2. **해외 스타트업 인텔리전스/큐레이션**: Product Hunt, Crunchbase, CB Insights, Dealroom, TechCrunch, The Information, Morning Brew, Axios Pro Rata, Sifted, Newcomer, Not Boring, "Startup of the day"류 뉴스레터, Particle·Artifact류 AI 뉴스 앱.
3. **AI 생성 콘텐츠 신뢰 문제**: AI가 생성한 스타트업 프로필의 정확성 리스크와 신뢰 장치(출처 표기, 업데이트일, 검증 배지 등) 사례.
4. **포지셔닝 맵**: 깊이(헤드라인↔딥다이브) × 빈도(실시간↔주간), 데이터형↔에디토리얼형.
5. **수익화·성장**: 뉴스레터 구독, 프리미엄, B2B 리포트, 커뮤니티.

출력 구조: 요약(5줄) → 경쟁 지형 표 → 독자 세그먼트 → 기회/위협 → 할 것/하지 말 것 → 출처.

## B. UX 벤치마크 (product-benchmarker)
관찰 대상 예: Product Hunt(일간 리더보드), Crunchbase/THE VC/혁신의숲(기업 프로필 구조), Morning Brew·뉴닉(일간 포맷·톤), Particle/Artifact/Apple News(카드·요약 UX), Instagram/Threads 카드 캐러셀, Readwise Reader·Pocket(저장/아카이브), Duolingo(스트릭), Sifted/The Information(에디토리얼 타이포).

패턴 카드 형식(패턴당):
```
### 패턴명
- 관찰 서비스:
- 무엇을: (화면 구조/상호작용)
- 왜 효과적인가:
- Startup Daily 적용안: (사용할 데이터 필드 명시)
- 구현 난이도: S/M/L
```
반드시 포함할 영역: 일간 진입 화면, 기업 프로필(딥다이브) 구조, 탐색/필터/검색, 저장·아카이브, 리텐션(스트릭·알림·"어제 놓친 것"), 공유, 데스크톱 레이아웃, 다크모드, 신뢰 표시(출처·업데이트일).
안티패턴 섹션도 별도로 쓴다(예: 가로 7장 캐러셀에 긴 텍스트 몰아넣기, 이모지 아이콘 남용).
