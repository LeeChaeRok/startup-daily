# 10. 앱 완성도 벤치마크 — "완성된 앱"으로 느껴지게 하는 기능 방향

- 작성: product-benchmarker / 기준일 2026-10-28
- 범위: 앱 완성도(첫 실행·루틴·읽기·후속·신뢰·엮어 읽기). **수익화는 다루지 않는다.** 01(패턴 카탈로그)·02(IA)·03(스펙)·06(한국에서는)에 이미 있는 내용(로고 폴백, 섹션 내비, 분할 뷰, 다크 토큰, 진행 링, 완독 카드, 이어 읽기, 웹 공유 폴백 등)은 반복하지 않고 "이미 있음"으로만 표기한다.
- 근거 수집 방법: App Store 상세·버전 기록(WebFetch, 2026-10-28), 공식 도움말, 언론 보도. 브라우저로 직접 열어 본 것은 디스콰이엇 홈(공개 피드)과 Product Hunt 주간 리더보드 페이지다.
- 확인 한계(표기 의무):
  - **리멤버 나우**: 현재 서비스 페이지를 찾지 못했다. App Store 리뷰(2019-08)에서 "출근길 경제 콘텐츠 레터"로만 확인된다. 현재 운영 여부는 불명이다.
  - **Morning Brew**: 전용 읽기 앱이 검색되지 않았다. 뉴스레터 안의 퍼즐·퀴즈·팟캐스트로만 비교했다.
  - **Sifted**: sifted.eu가 WebFetch에 403을 돌려줬다. 랭킹 페이지와 보도로 대체했다.
  - **Crunchbase 앱**: 스토어 등재본이 2021년 1.7.1에서 멈춰 있다. 기능 비교는 웹 Pro 도움말 기준이다.
  - **Artifact**: 2024년 1월 종료 발표. 보도로만 확인했다.
  - **폴인**: 스토어 설명에 기능 목록이 없다(멤버십 전용 앱).
  - **토스피드**: 앱 내 별도 탭은 확인하지 못했다. 웹/모바일 개편 기사로 확인했다.

---

## 0. 요약 (5줄)

1. 지금 Startup Daily는 "읽기 화면"으로는 완성도가 높다. 하지만 **앱을 앱답게 만드는 세 가지 고리가 없다**: 사용자를 부르는 고리(알림·배지), 사용자가 말을 거는 고리(오류 제보), 회사를 다시 만나는 고리(팔로우·후속 소식).
2. 비교 대상들이 최근 1년 사이에 추가한 기능은 거의 같은 방향이다. 뉴닉은 알림·위젯·글자 크기·다크·이슈 타임라인·주간 회고를, 롱블랙은 요일·시간 지정 알림을, Particle은 팔로우·근거 보기를 추가했다.
3. 콘텐츠는 매일 4~5곳이 흩어져 쌓이기만 한다. 109곳·19호가 쌓였는데도 **"묶어서 다시 보는 단위"(주간·테마·섹터 비교·후속)가 없다.** 데이터는 이미 있어서 대부분 S~M으로 만들 수 있다.
4. AI 신뢰 장치는 페이지 단위(고지·검증 링크·정정 기록)로는 갖췄다. 문장·수치 단위의 근거 보기와 독자 제보 루프는 없다.
5. 상위 8개: ① 틀린 내용 알리기 ② 새 호 알림과 시간 설정 ③ 첫 실행 온보딩과 관심 분야 ④ 주간 정리 ⑤ 회사 팔로우와 "그때 그 회사" ⑥ 상세 읽기 설정(진행률·남은 시간·글자 크기) ⑦ 공유 카드 이미지 ⑧ 테마 묶음과 섹터 비교.

---

## 1. 비교 대상 관찰표 (완성도 관련 기능만)

| 서비스 | 루틴(알림·위젯·스트릭) | 읽기 경험 | 엮어 읽기·후속 | 신뢰·피드백 | 출처 |
|---|---|---|---|---|---|
| 롱블랙 | 하루 1편, **오늘만 읽기**. 원하는 **요일·시간 알림**(1.1.0, 2025-07). 노트 문장 미니게임 "롱블랙 플레이"(1.2.15, 10월). 라이브러리(읽은 노트·스탬프·북마크) | 스토어 리뷰가 미완독 정렬과 필터를 요청 | 스탬프로 누적을 시각화 | — | [App Store](https://apps.apple.com/kr/app/longblack/id6450910866) |
| 뉴닉 | 오렌지 불꽃 **스트릭**(0.10.3~0.11.2), **위젯 2종**(0.11.6), 주요 뉴스·새 글 **알림**(0.14.2) | **글자 크기·다크모드** 설정(0.15.0), 1분 요약, **오디오 브리핑** | **이슈 타임라인**(0.17.0, 2026-09: 흩어진 뉴스를 시간순으로 묶음), "이번 주 어떤 소식" 퀴즈 회고, 지금 뜨는 뉴스(24시간) | 주간 의견 설문(피자스테이션) | [App Store](https://apps.apple.com/kr/app/%EB%89%B4%EB%8B%89-%EC%A7%80%EC%8B%9D-%ED%94%8C%EB%9E%AB%ED%8F%BC/id1549450444) |
| 퍼블리 | **출석 캘린더**·포인트(0.7.0), 푸시 | **형광펜(하이라이트)**, 마이 컬렉션(북마크·최근 읽음·하이라이트). 리뷰가 글자 크기·행간·다크 부재를 지적 | 커리어 단계(스타터/그로우어/임팩터) **온보딩 추천**(0.20.0, 2025-04), 고민 진단 테스트 | — | [App Store](https://apps.apple.com/kr/app/%ED%8D%BC%EB%B8%94%EB%A6%AC-%EC%BB%A4%EB%A6%AC%EC%96%B4-%EB%A9%A4%EB%B2%84%EC%8B%AD-publy/id1440756899) |
| 폴인 | — | 멤버십 전용. 리뷰는 "느리다"(평점 3.0, 1건) | 2,000여 개 콘텐츠 | — | [App Store](https://apps.apple.com/us/app/%ED%8F%B4%EC%9D%B8-%EC%84%B1%EC%9E%A5%EC%9D%98-%EA%B2%BD%ED%97%98%EC%9D%84-%EB%82%98%EB%88%95%EB%8B%88%EB%8B%A4/id6451428786) |
| 리멤버(나우) | 출근길 레터(2019, 현재 불명) | — | 인맥 승진·이직 소식 알림 = **"아는 대상의 후속 소식"** | — | [App Store](https://apps.apple.com/KR/app/id840553277) |
| 토스피드 | — | — | 모바일 홈이 **"이 주의 콘텐츠"·"이번 주 많이 본 콘텐츠"**로 시작. 댓글·좋아요 추가 | 반응 수집 | [토스피드 5천만](https://toss.im/tossfeed/article/tossfeed-50-million) |
| Product Hunt 앱 | **스트릭 위젯**(5.20.0). 커뮤니티에서 "7일 스트릭 깨지 마세요" 리마인드를 다크 패턴으로 지적 | — | **일·주·월·연 리더보드**와 이전·다음 주 링크, 메이커 영상 업데이트 | 메이커 Q&A | [App Store](https://apps.apple.com/us/app/product-hunt/id904658671), [주간 리더보드](https://www.producthunt.com/leaderboard/weekly/2026/43), [스트릭 토론](https://www.producthunt.com/p/general/how-not-to-lose-product-hunt-streak-during-the-summer) |
| Particle | 매일 Top 뉴스 푸시, 팔로우 대상이 뉴스가 되면 즉시 알림 | 요약 스타일 전환(Overview·5W·ELI5·Opposite Sides), 오디오 재생, 다크 | **인물·장소·사물 팔로우**(벨 알림), Related Stories | **Supporting Material**(요약 불릿을 누르면 원문 발췌와 근거), Reality Check, "Is this answer accurate?" | [Story anatomy](https://intercom.help/particlenews/en/articles/10094099-story-anatomy), [App Store](https://apps.apple.com/us/app/particle-news/id6683283775) |
| Artifact(종료) | — | AI 요약 | — | **낚시성 제목 신고 → AI 재작성 + 별표 표시** | [TechCrunch 2023-06](https://techcrunch.com/2023/06/02/artifact-news-app-now-uses-ai-to-rewrite-headline-of-a-clickbait-article), [Engadget 종료](https://www.engadget.com/instagrams-founders-are-shutting-down-artifact-their-year-old-news-app-233431390.html) |
| Readwise Reader | — | 하이라이트, 읽기 테마(Sepia·Slate 등, 8.25), 시스템 글자 크기 연동, 진행률 표시(퍼센트·남은 시간 선택), **오프라인 범주 선택과 다운로드 상태**(8.2.2), TTS(0.5~3배속) | Ghostreader(문서와 대화, 용어 찾기) | — | [App Store](https://apps.apple.com/us/app/readwise-reader/id1567599761), [Docs](https://docs.readwise.io/reader/docs) |
| Morning Brew | 매일 뉴스레터 + 크로스워드·퀴즈 | 짧은 분량 | — | — | [Money Crashers 리뷰](https://www.moneycrashers.com/morning-brew-business-financial-newsletter-review/) |
| Crunchbase | **저장 목록·저장 검색 알림**(파란 칩: 새 회사, 초록 칩: 리스트 회사의 새 소식) | — | My Follows에 저장하면 그 회사 알림이 켜짐 | — | [Dashboard 도움말](https://support.crunchbase.com/hc/en-us/articles/115010642328-Navigating-My-Dashboard), [Alerts](https://support.crunchbase.com/hc/en-us/articles/115010462027-Set-Up-and-Manage-Your-Alerts-using-Crunchbase-Pro), [프로필 개편](https://about.crunchbase.com/blog/new-crunchbase-profile-design) |
| Sifted | 일간·섹터 뉴스레터 | — | 연례 랭킹(Rising 100 → 매출 성장 Sifted 100), 브리핑 100여 편 | — | [Rising 100 2024](https://sifted.eu/rankings/b2b-saas-rising-100-2024), [Wellfound](https://wellfound.com/company/sifted-1) |
| 디스콰이엇 | 오늘·주간 랭킹 | — | 메이커가 직접 올리는 제품 업데이트 = 후속 소식의 1차 출처 | 로그인해야 댓글 작성 | [disquiet.io](https://disquiet.io) (2026-10-28 열람) |

플랫폼 제약: iOS 16.4부터 **홈 화면에 추가한 웹앱**에서만 Web Push와 Badging API를 쓸 수 있다. iOS 18.4에는 Declarative Web Push가 추가됐다([WebKit Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Badging](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/), [Declarative](https://webkit.org/blog/16535/meet-declarative-web-push/)). 네이티브 앱이 나오기 전에도 PWA 설치자에게는 알림과 배지를 줄 수 있다는 뜻이다.

---

## 2. "완성된 앱" 요소 카탈로그

각 항목: 관찰 → 왜 효과적인가 → Startup Daily 데이터로 가능한가.

### 2-1. 첫 실행·온보딩
- 관찰: 퍼블리는 커리어 단계를 골라 추천을 받고, Particle은 관심사를 골라 피드를 만들며, 뉴닉은 본인 인증 가입을 거친다.
- 왜: 첫 화면에서 "나를 위한 앱"이라는 신호를 주고, 이후 알림 동의를 받을 맥락을 만든다. 다만 가입을 강제하면 이탈한다.
- 우리: 계정 없이 3화면이면 된다(무엇을 하는 앱인지 → 관심 분야 → 알림 시간). 관심 분야는 `_sector.key`(SECTORS 정규화)로 가능하다. 지금 있는 것은 홈의 IntroCard(`sd_intro_dismissed`) 한 장뿐이다.

### 2-2. 관심 분야 설정
- 관찰: Particle의 토픽 선호 조정, Crunchbase의 저장 검색 알림.
- 왜: 하루 4~5곳이라 오늘 호를 개인화할 필요는 없다. 대신 **아카이브 정렬과 알림 필터**에 쓰면 가치가 생긴다("내 분야 회사가 나온 날만 알림").
- 우리: 가능하다. 단, 원천 `category`가 "디지털 헬스"와 "디지털 헬스케어"처럼 흩어져 있어 반드시 정규화된 `_sector`를 써야 한다.

### 2-3. 하루 루틴(알림·위젯·스트릭)
- 관찰: 롱블랙은 요일·시간을 지정하는 알림, 뉴닉은 스트릭·위젯·알림, PH는 스트릭 위젯을 둔다. PH 커뮤니티는 스트릭 독촉을 다크 패턴으로 비판했다.
- 왜: 일간 매체의 리텐션은 "정해진 시간의 한 번 알림"이 좌우한다. 스트릭은 발행이 끊기면 사용자 잘못이 아닌데도 깨진다. 실제로 2026-04-27 다음 호가 10-22에 나와 공백이 약 6개월이다.
- 우리: 알림은 `meta.json.last_issue_date`가 바뀔 때 보내면 된다(서버·푸시 키 필요, L). 배지는 PWA에서도 가능하다. 스트릭은 02 §6 결정대로 계속 "안 함"을 유지하고, 위젯은 네이티브 출시 뒤로 미룬다.

### 2-4. 읽기 경험
- 관찰: Readwise Reader는 진행률(퍼센트·남은 시간), 테마, 시스템 글자 크기를 지원한다. 뉴닉은 글자 크기 설정이 있다. 퍼블리는 형광펜이 있지만 글자 크기가 없어 불만이 나온다.
- 왜: 상세는 레코드 하나가 약 4,500자에 섹션이 7~8개인 긴 문서다. 위치와 남은 분량을 모르면 중간에 이탈한다. 한국어 장문에서는 글자 크기 조절이 접근성의 기본이다.
- 우리: 호 단위 "요약 읽기 약 n분"과 진행 링은 이미 있다. **상세 안의 스크롤 진행률, 섹션별 남은 시간, 글자 크기(3단계)**는 없다. 모두 S다. 하이라이트·메모는 M인데, 짧은 프로필에서는 효용이 낮아 "저장한 회사에 한 줄 메모" 정도로 축소하는 것을 권한다.

### 2-5. 회사 팔로우·후속 소식
- 관찰: Crunchbase는 My Follows에 넣으면 펀딩·뉴스 알림을 준다. Particle은 인물·사물 팔로우에 벨을 단다. 리멤버는 인맥의 승진·이직 소식을 알린다. 디스콰이엇은 메이커가 직접 업데이트를 올린다.
- 왜: "덜 알려진 신생 회사"를 소개하는 서비스의 고유 가치는 **"내가 6개월 전에 본 그 회사가 지금 어떻게 됐나"**다. 다른 서비스가 흉내 내기 어려운 장치다.
- 우리: 클라이언트만으로는 불가능하다. 생성 파이프라인에 재조사 잡이 필요하다(§3-4). 1차로는 저장 = 팔로우로 간주하는 것을 권한다(새 모델을 만들지 않는다).

### 2-6. 검색
- 관찰: 뉴닉은 0.15.3(2026-08)에 Discover 탭 검색을 추가했다. Particle은 검색 속도를 개선했다.
- 우리: 이미 있다(회사·분야·창업자·경쟁사, 매칭 근거 표시). 남은 갭은 **최근 검색어, 결과 0건일 때 대안 제안, 탭바에서 바로 진입**(데스크톱 `/`는 있음) 정도로 작다.

### 2-7. 공유 카드
- 관찰: Particle·Artifact는 요약 카드를 이미지로 공유한다. Product Hunt는 제품마다 OG를 둔다.
- 왜: 카카오톡·인스타 스토리에서 링크 미리보기는 사이트 공통 OG 하나뿐이라 "무슨 회사인지"가 전달되지 않는다.
- 우리: Web Share와 사이트 공통 OG는 있다. **회사별 OG(02 Later L2)와 세로 1080×1350 카드 이미지 저장**은 없다. 둘 다 `name_ko`, `tagline`, `_sector`, 투자 금액, 모노그램으로 만들 수 있다.

### 2-8. 피드백·오류 제보
- 관찰: Particle은 "Is this answer accurate?"를, Artifact는 낚시성 제목 신고를, Yahoo News는 "Report a problem"을 둔다([Yahoo 도움말](https://help.yahoo.com/kb/SLN36666.html)). Apple은 AI 알림 요약 오류로 기능을 중단했다([City AM](https://cityam.com/?p=2299733)).
- 왜: AI가 작성하는 매체에서 독자 제보는 가장 값싼 검증 인력이다. 정정 기록(corrections.json)은 이미 있지만 **들어오는 입구가 없다**. 코드 검색 결과 `mailto`나 이슈 링크가 0건이다.
- 우리: S. 입구는 mailto 또는 GitHub 이슈 템플릿 URL을 쓰고, 본문에 회사 id·섹션·날짜를 미리 채운다.

### 2-9. 빈 상태
- 우리: 저장함 빈 상태, "저장한 회사를 모두 읽었어요", 탐색 0건, "M월 D일 이후 새 호가 없어요"가 이미 있다. 갭은 **오프라인 빈 상태**와 **"한국에서는" 생성 실패 상태 문구**뿐이다. 작다.

### 2-10. 아카이브 탐색
- 관찰: PH는 일·주·월·연 리더보드 사이를 이전·다음 링크로 이동한다. 토스피드는 "이 주의 콘텐츠"를 둔다. 뉴닉은 이슈 타임라인을 둔다.
- 우리: 지난 호 탭(주 그룹)은 있다. **주·월 단위로 묶은 편집 화면**은 없다(§3-1).

### 2-11. 다크모드
- 우리: 이미 있다(시스템·라이트·다크). 갭 없음. 뉴닉도 2026-07에야 추가했다.

### 2-12. 오프라인
- 관찰: Readwise는 오프라인으로 둘 범주를 고르고 다운로드 상태를 보여 준다.
- 우리: `sw.js`가 network-first로 같은 출처 GET을 캐시한다. 데이터가 번들 안에 있어서 한 번 연 뒤에는 대부분 오프라인으로 열린다. 하지만 ① 오프라인임을 알리는 표시가 없고 ② "한국에서는" 생성처럼 네트워크가 필요한 버튼이 오프라인에서 그냥 실패하며 ③ 첫 방문 전에는 앱 셸 외에 프리캐시가 없다. S~M.

---

## 3. 콘텐츠 측면 완성도 — "엮어 읽기"와 신뢰

### 3-1. 주간 정리 ("이번 주 스타트업")
- 벤치마크: 토스피드 "이 주의 콘텐츠", PH 주간 리더보드, 뉴닉 "이번 주 어떤 소식" 퀴즈.
- 형태: 월요일 아침 홈 최상단 카드 하나로 "지난주 5호 · 24곳"을 보여 준다. 분야 분포, 가장 큰 투자 3곳, 내가 안 읽은 n곳, 저장한 n곳을 담는다.
- 데이터: `date`, `_sector`, `funding.total_raised`(정규화된 금액), `sd_read`, `saved_startups`. **새 생성이 필요 없다.** "AI 주간 총평" 한 단락을 넣는다면 파이프라인에서 주 1회 생성한다(선택).

### 3-2. 테마 묶음
- 벤치마크: 뉴닉 이슈 타임라인, Sifted 섹터 브리핑·랭킹.
- 형태: "로봇 파운데이션 모델 회사들", "AI 신약개발 6곳"처럼 3곳 이상 모인 정규 섹터를 자동으로 컬렉션으로 만든다. 탐색 상단에 가로 칩으로 노출한다.
- 데이터: 정규화된 `_sector` 대분류 기준 3곳 이상. 좁은 테마는 원천 `category` 키워드로 만든다(원천 상위: AI 인프라 6, 디지털 헬스 4 등). 사람의 손이 필요한 것은 컬렉션 제목 정도이고, 섹터 라벨을 그대로 써도 된다.

### 3-3. 같은 섹터 비교
- 벤치마크: Crunchbase·THE VC 비교 표.
- 형태: 상세의 "같은 분야의 다른 회사"(이미 3곳 리스트로 있음)를 **비교 표**로 확장한다. 열은 설립·단계·누적 투자·HQ·핵심 차별점 한 줄이다. 데스크톱 탐색 표에도 "선택한 회사 비교"를 둔다.
- 데이터: `founded_year`, `company_stage`, `funding.total_raised`, `headquarters`, `competitive_landscape.key_differentiator`. 모두 있다.

### 3-4. "그때 그 회사" 후속 업데이트
- 벤치마크: Crunchbase 리스트 알림, 리멤버 인맥 소식, startups.co.uk "Where are these Startups 100 businesses now?"([참고](https://startups.co.uk/startups-100/wp-json/wp/v2/posts/47020)). Sifted에서는 같은 형식을 찾지 못했다.
- 형태: 소개 후 90일·180일에 재조사한다. 새 투자·인수·폐업·주요 출시가 있을 때만 `updates.json`에 `{id, checked_at, kind, summary, source_url, verified}`를 추가한다. 상세 맨 위에 "업데이트 · 2027-01" 띠를 붙이고, 홈에는 "그때 그 회사" 섹션(주 1~2건)을 둔다.
- 데이터: 지금은 없다. 생성기 확장이 필요하다(L). 데이터가 생기면 화면은 S다. 6개월 공백이 있는 4월 호 65곳이 첫 대상으로 적합하다.

### 3-5. AI 요약 신뢰 장치 (현재 상태와 다음 단계)
| 장치 | 현재 | 다음 | 벤치마크 |
|---|---|---|---|
| 페이지 단위 AI 고지·기준일 | 있음 | — | THE VC, 01 #18 |
| 검증된 링크만 노출 | 있음(`verified`) | — | — |
| 정정 기록·배너 | 있음 | 입구(제보) 추가 | — |
| **문장·수치 단위 근거 보기** | 없음 | "왜 지금"·투자 수치 옆 [근거] → 출처 발췌와 URL 시트 | Particle Supporting Material |
| **독자 제보** | 없음 | 섹션마다 "틀린 내용 알리기" | Particle "Is this answer accurate?", Artifact 신고 |
| 생성 모델·생성일 표기 | `generated_at`, `model` 필드는 있음, UI 미노출 | 신뢰 블록에 "작성 모델 · 작성 시각" 한 줄 | — |
| 재확인 일자 | 없음 | 후속 재조사(§3-4)를 하면 "마지막 확인 2027-01-15" | Crunchbase 업데이트 칩 |

---

## 4. 갭 분석 표

난이도: S(반나절~1일, 클라이언트만) / M(2~4일 또는 빌드 스크립트) / L(서버·파이프라인·외부 키)

| 기능 | 현재 상태 | 벤치마크 | 사용자 가치 | 난이도 | 우선순위 |
|---|---|---|---|---|---|
| 오류 제보 + 정정 루프 | 정정 기록만 있음, 입구 없음 | Particle, Artifact, Yahoo | 신뢰, AI 오류 조기 발견 | S | **P0** |
| 새 호 알림 + 시간 설정 + 배지 | "새 호" 배지(앱 안에서만) | 롱블랙, 뉴닉, Particle, WebKit Push | 매일 돌아올 이유 | M(PWA) / L(서버) | **P0** |
| 첫 실행 온보딩 + 관심 분야 | IntroCard 1장 | 퍼블리, Particle | 첫인상, 알림 동의 맥락 | S | **P0** |
| 주간 정리 | 없음(지난 호 주 그룹만) | 토스피드, PH, 뉴닉 | 놓친 날 회복, 엮어 읽기 | S | **P1** |
| 회사 팔로우 + "그때 그 회사" | 저장만 있음 | Crunchbase, 리멤버 | 서비스 고유 가치 | L(데이터) / S(화면) | **P1** |
| 상세 진행률·남은 시간·글자 크기 | 호 단위 분량만 | Readwise, 뉴닉 | 긴 문서 완독, 접근성 | S | **P1** |
| 공유 카드 이미지 + 회사별 OG | 사이트 공통 OG, 텍스트 공유 | Particle, PH | 확산, 카톡 미리보기 | M | **P1** |
| 테마 묶음 + 섹터 비교 표 | 같은 분야 3곳 리스트 | 뉴닉 타임라인, Sifted, Crunchbase | 엮어 읽기, 비교 | M | **P1** |
| 문장·수치 단위 근거 보기 | 없음 | Particle | 신뢰 | L(파이프라인) | P2 |
| 오프라인 표시·프리캐시 | 암묵적으로 동작 | Readwise | 지하철·비행기 | S | P2 |
| 생성 모델·시각 표기 | 필드만 있음 | — | 투명성 | S | P2 |
| 저장한 회사 한 줄 메모 | 없음 | 퍼블리 형광펜, Readwise | 리서처 세그먼트 | S | P2 |
| 최근 검색어·0건 대안 | 0건 빈 상태만 | 뉴닉 | 편의 | S | P3 |
| 오디오(TTS) 브리핑 | 없음 | 뉴닉, Particle, Readwise | 출퇴근 | M | P3 |
| 홈 화면 위젯 | 없음 | 뉴닉, PH | 노출 | L(네이티브) | P3(앱 출시 후) |
| 스트릭 | 의도적으로 안 함 | 뉴닉, PH(비판 있음) | 습관(부작용) | S | 안 함 유지 |
| 문장 하이라이트 | 없음 | 퍼블리, 롱블랙(스크린샷 설명) | 짧은 프로필에서 효용 낮음 | M | 안 함 |
| 다크모드·빈 상태·검색 | 있음 | — | — | — | 완료 |

---

## 5. 상위 8개 — 화면 단위 구체 제안

### ① 틀린 내용 알리기 (P0, S)
- **어디**: S3 상세. 각 섹션 끝에 텍스트 버튼을 두고, "출처와 신뢰" 블록에 한 번 더 둔다.
- **무엇**: 탭하면 바텀시트를 연다. 항목은 라디오(숫자가 틀렸어요 / 회사 상태가 바뀌었어요(인수·폐업) / 링크가 안 열려요 / 기타) + 선택 입력 1줄이다. [보내기]를 누르면 GitHub 새 이슈 URL(`title`, `body`에 `id`·섹션·`date`·앱 버전을 미리 채움) 또는 `mailto:`로 연다. 개인 정보는 URL에 넣지 않는다.
- **문구**:
  - 버튼: "이 섹션에 틀린 내용이 있나요?"
  - 시트 제목: "틀린 내용 알리기"
  - 안내: "확인되면 정정 기록에 남기고 이 페이지 맨 위에 표시해요."
  - 완료 토스트: "알려 주셔서 고마워요. 확인 후 정정 기록에 반영할게요."
- **연결**: 반영된 건은 기존 corrections.json → CorrectionBanner로 흐른다. S6 소개에 "독자 제보로 정정한 n건"을 집계한다.

### ② 새 호 알림 + 알림 시간 + 앱 배지 (P0, PWA M / 서버 L)
- **어디**: 온보딩 3단계, S6 설정, 홈의 완독 카드 하단.
- **무엇**: 알림 시간을 아침 7·8·9시 중에서 고르고, "내 관심 분야가 있는 날만"을 토글한다. 푸시 권한은 **사용자가 버튼을 누를 때만** 요청한다(첫 진입에 자동으로 묻지 않는다). iOS에서 홈 화면에 추가하지 않았다면 "홈 화면에 추가하면 알림을 받을 수 있어요" 안내를 대신 보여 준다. 새 호가 생기면 `navigator.setAppBadge(안 읽은 수)`로 배지를 달고, 다 읽으면 지운다. 서버는 `meta.json.last_issue_date`가 바뀌는 배포 직후 1회 발송한다(Vercel 함수 + VAPID 키, 구독 저장소 필요).
- **문구**:
  - 설정 라벨: "새 호 알림"
  - 보조: "하루 한 번, 정한 시간에만 보내요."
  - 알림 본문: "10월 28일 호 · 로보틱스·핀테크 등 5곳이 도착했어요."
  - 공백일에는 알림을 보내지 않는다. "오늘은 쉬어요" 같은 알림도 금지.
- **주의**: 파이프라인이 매일 성공한다는 보장이 생기기 전까지 "매일 아침"이라는 약속 문구는 쓰지 않는다.

### ③ 첫 실행 온보딩 + 관심 분야 (P0, S)
- **어디**: 첫 진입(`sd_onboarded` 없음) 시 홈 위 전체 화면 시트. 공유 링크로 들어온 콜드 스타트(`#/s/:id`)에서는 띄우지 않고, 두 번째 앱 내 이동 이후에 띄운다.
- **무엇**: 3장 구성이고 각 장에 [건너뛰기]를 둔다.
  1. "한국에 아직 덜 알려진 해외 신생 스타트업을 매일 4~5곳 소개해요. AI가 공개 자료로 조사하고, 링크는 열리는지 확인해요."
  2. "관심 분야를 골라 주세요(선택)." 정규 섹터 칩 다중 선택. 각 칩에 지금까지 소개한 회사 수를 붙인다(예: "헬스·바이오 18" 같은 형식).
  3. "새 호가 나오면 알려 드릴까요?" [알림 받기] [나중에]
- **쓰임**: 관심 분야는 오늘 호의 순서를 바꾸지 않는다(호의 순번 유지). 행에 작은 "관심" 점을 표시하는 데, 탐색 기본 필터, 주간 정리 상단, 알림 필터에 쓴다. S6에서 언제든 바꿀 수 있다.

### ④ 주간 정리 "지난주 스타트업" (P1, S)
- **어디**: 새 라우트 `#/w/2026-W43` + 홈 상단 카드(월·화에만 노출) + 탐색 > 지난 호 탭의 주 그룹 헤더 링크.
- **무엇**:
  - 헤더: "10월 셋째 주 · 5호 · 24곳"
  - 분야 분포 막대(기존 SectorMix 재사용)
  - "가장 큰 투자 3곳"(정규화 금액 기준, "미공개" 제외)
  - "아직 안 읽은 7곳"(`sd_read` 기준, 접힘)
  - "내가 저장한 3곳"
  - 끝에 이전·다음 주 링크(PH 방식)
- **문구**: 홈 카드 "지난주 24곳 중 7곳을 아직 못 봤어요 → 이어 보기". 다 읽었으면 "지난주 24곳을 모두 읽었어요."
- 공백 주(호 0개)는 라우트를 만들지 않는다.

### ⑤ 회사 팔로우 + "그때 그 회사" (P1, 데이터 L / 화면 S)
- **어디**: S3 상세 히어로, S5 저장함, 홈의 새 섹션.
- **무엇**:
  - 1단계(화면만): 저장 버튼 보조 문구를 "저장하면 이 회사의 새 소식도 모아 드려요(준비 중)"로 바꾸지 **않는다.** 데이터가 생기기 전에는 약속하지 않는다.
  - 2단계(데이터): 생성기가 소개 후 90·180일에 재조사해 `updates.json`을 쓴다. 상세 상단에 띠 "업데이트 · 2027-01-15 · 시리즈 B $40M 유치(확인된 보도 ↗)"를 붙인다. 저장함 행에 "새 소식" 점을 단다. 홈의 "그때 그 회사" 섹션에는 "4월에 소개한 ○○, 그 후" 카드를 1~2개 둔다.
  - 알림(②)과 결합해 "저장한 회사에 새 소식이 있을 때"를 선택할 수 있게 한다.
- **문구**: 섹션 제목 "그때 그 회사". 상태 라벨 "새 투자 / 인수됨 / 서비스 종료 / 새 제품". 인수·종료는 정정과 같은 톤으로 사실만 쓴다.
- **신뢰**: 업데이트는 `verified: true` 출처가 있을 때만 노출한다. 출처가 없으면 쓰지 않는다.

### ⑥ 상세 읽기 설정: 진행률 · 남은 시간 · 글자 크기 (P1, S)
- **어디**: S3 상세 헤더 하단(2px 진행 바), 섹션 내비 칩, 헤더 더보기 메뉴.
- **무엇**:
  - 스크롤 진행 바(`prefers-reduced-motion`이면 트랜지션 없음).
  - 섹션 내비 칩 옆에 "약 1분" 같은 섹션별 읽기 시간(기존 `readMinutes` 로직을 섹션 텍스트에 적용).
  - 히어로 메타에 "전체 약 6분".
  - 글자 크기 3단계(작게·기본·크게, `--fs-body` 15/17/19px 토큰 스위치, `sd_font` 저장). S6 설정과 상세 더보기 두 곳에서 바꿀 수 있다.
- **문구**: 메뉴 "글자 크기", 옵션 "작게 · 기본 · 크게". 진행 바는 `aria-hidden`이고, 섹션 내비에 "4/8 섹션"을 시각적으로 숨겨 둔다.

### ⑦ 공유 카드 이미지 + 회사별 OG (P1, M)
- **어디**: S3 공유 시트(Web Share 앞단에 선택지 추가), 빌드 스크립트.
- **무엇**:
  - (a) 빌드 후 `dist/s/{id}/index.html`(OG 메타 + 해시 라우트로 리다이렉트)과 `og/{id}.png`(1200×630)를 생성한다. 이것은 02 Later L2를 앞당긴 것이다. vercel.json이 필요 없다.
  - (b) "이미지로 저장"은 클라이언트 캔버스로 1080×1350 카드를 그린다. 구성은 모노그램, `name_ko`/`name_en`, 한 줄 tagline, 분야·단계·누적 투자, "Startup Daily · 10월 27일 호" 워터마크와 URL이다. `navigator.share({files})`가 되면 파일로 공유하고, 아니면 다운로드한다.
- **문구**: 시트 항목 "링크 공유 / 이미지로 저장 / 링크 복사". 카드 하단 "AI가 공개 자료로 작성 · startup-daily.vercel.app".
- **주의**: 이미지에 "AI 작성" 표기를 반드시 넣는다(캡처본이 맥락 없이 돌아다니기 때문).

### ⑧ 테마 묶음 + 섹터 비교 표 (P1, M)
- **어디**: S4 탐색 상단 "모아 보기" 가로 칩 행, 새 라우트 `#/t/:sector`, S3 "같은 분야의 다른 회사".
- **무엇**:
  - 테마 페이지: "헬스·바이오 · n곳 · 2026-04 ~ 10"(대분류). 좁은 테마 예: "AI 신약개발". 소개일 역순 리스트와 비교 표(설립·단계·누적 투자·HQ·차별점 한 줄)를 둔다. 모바일 표는 첫 열(회사명)을 고정하고 가로 스크롤한다.
  - 상세: 기존 3곳 리스트 아래에 [이 회사와 비교] 버튼을 두고, 현재 회사 + 같은 섹터 최대 3곳을 비교 시트로 띄운다.
  - 3곳 미만인 섹터는 칩을 노출하지 않는다.
- **문구**: 칩 행 제목 "분야별로 모아 보기". 비교 시트 제목 "같은 분야 4곳 비교". 각주 "수치는 각 회사 소개일 기준이에요." (기준일이 달라 직접 비교가 어렵다는 점을 명시)
- **선행 조건**: `_sector`는 "헬스·바이오"처럼 넓은 대분류다(`src/lib/data.js` SECTORS 정규식). 원천 표기 흔들림(예: "디지털 헬스" / "디지털 헬스케어")은 여기서 합쳐진다. "AI 신약개발"처럼 좁은 테마는 대분류 안에서 원천 `category` 키워드가 3곳 이상 겹칠 때만 만든다. 그렇지 않으면 대분류 페이지로 충분하다.

---

## 6. 결론 — Startup Daily가 할 것 / 하지 말 것

**할 것**
1. 독자가 말을 걸 입구(제보)를 먼저 연다. 정정 기록은 있는데 입구가 없는 것이 가장 싼 갭이다.
2. 알림은 "하루 한 번, 정한 시간, 새 호가 있을 때만"으로 시작한다. 권한은 버튼으로만 요청한다.
3. 이미 쌓인 109곳을 주간·테마·비교로 다시 엮는다. 새 생성 비용 없이 콘텐츠 양이 늘어난 것처럼 느껴진다.
4. "그때 그 회사"를 서비스 고유 장치로 삼는다. 단, 검증된 출처가 있을 때만 노출한다.
5. 공유 이미지와 회사별 OG에는 AI 작성 표기를 넣는다.

**하지 말 것**
1. 스트릭과 소실 경고. 발행 공백(4/27→10/22) 이력이 있는 서비스에서는 독자에게 벌을 주는 장치가 된다.
2. 가입 강제. 계정 없이 온보딩·알림·저장이 모두 가능해야 한다.
3. 오늘 호를 관심 분야로 재정렬하는 것. 하루 4~5곳의 "같은 호를 같이 읽는다"는 성격이 깨진다.
4. 데이터가 없는 약속 문구("새 소식을 알려 드려요", "매일 아침")를 먼저 노출하는 것.
5. 장문 하이라이트·주석 시스템. 짧은 프로필에서는 효용 대비 비용이 크다. 메모 한 줄이면 충분하다.

---

## 출처
- 롱블랙 App Store: https://apps.apple.com/kr/app/longblack/id6450910866
- 뉴닉 App Store(버전 기록 0.10.3~0.18.1): https://apps.apple.com/kr/app/%EB%89%B4%EB%8B%89-%EC%A7%80%EC%8B%9D-%ED%94%8C%EB%9E%AB%ED%8F%BC/id1549450444
- 퍼블리 App Store: https://apps.apple.com/kr/app/%ED%8D%BC%EB%B8%94%EB%A6%AC-%EC%BB%A4%EB%A6%AC%EC%96%B4-%EB%A9%A4%EB%B2%84%EC%8B%AD-publy/id1440756899
- 폴인 App Store: https://apps.apple.com/us/app/%ED%8F%B4%EC%9D%B8-%EC%84%B1%EC%9E%A5%EC%9D%98-%EA%B2%BD%ED%97%98%EC%9D%84-%EB%82%98%EB%88%95%EB%8B%88%EB%8B%A4/id6451428786
- 리멤버 App Store(리멤버 나우 리뷰 2019-08): https://apps.apple.com/KR/app/id840553277
- 토스피드 5천만 뷰(모바일 홈 개편): https://toss.im/tossfeed/article/tossfeed-50-million
- Product Hunt App Store: https://apps.apple.com/us/app/product-hunt/id904658671
- Product Hunt 주간 리더보드: https://www.producthunt.com/leaderboard/weekly/2026/43
- Product Hunt 스트릭 토론: https://www.producthunt.com/p/general/how-not-to-lose-product-hunt-streak-during-the-summer
- Particle Story anatomy: https://intercom.help/particlenews/en/articles/10094099-story-anatomy
- Particle App Store: https://apps.apple.com/us/app/particle-news/id6683283775
- Artifact 낚시성 제목 재작성(TechCrunch 2023-06-02): https://techcrunch.com/2023/06/02/artifact-news-app-now-uses-ai-to-rewrite-headline-of-a-clickbait-article
- Artifact 종료(Engadget 2024-01): https://www.engadget.com/instagrams-founders-are-shutting-down-artifact-their-year-old-news-app-233431390.html
- Readwise Reader App Store: https://apps.apple.com/us/app/readwise-reader/id1567599761
- Readwise Reader Docs: https://docs.readwise.io/reader/docs
- Morning Brew 리뷰: https://www.moneycrashers.com/morning-brew-business-financial-newsletter-review/
- Crunchbase Dashboard: https://support.crunchbase.com/hc/en-us/articles/115010642328-Navigating-My-Dashboard
- Crunchbase Alerts: https://support.crunchbase.com/hc/en-us/articles/115010462027-Set-Up-and-Manage-Your-Alerts-using-Crunchbase-Pro
- Crunchbase 프로필 개편: https://about.crunchbase.com/blog/new-crunchbase-profile-design
- Sifted Rising 100(2024): https://sifted.eu/rankings/b2b-saas-rising-100-2024
- Sifted 회사 소개(Wellfound): https://wellfound.com/company/sifted-1
- 디스콰이엇: https://disquiet.io
- Yahoo News 신고: https://help.yahoo.com/kb/SLN36666.html
- Apple AI 알림 중단(City AM): https://cityam.com/?p=2299733
- WebKit Web Push(iOS 16.4): https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- WebKit Badging: https://webkit.org/blog/14112/badging-for-home-screen-web-apps/
- WebKit Declarative Web Push(iOS 18.4): https://webkit.org/blog/16535/meet-declarative-web-push/
- Startups 100 후속 기사: https://startups.co.uk/startups-100/wp-json/wp/v2/posts/47020
