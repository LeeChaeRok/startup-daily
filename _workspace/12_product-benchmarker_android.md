# 12. Android 앱 출시용 UX 패턴 벤치마크

- 작성: product-benchmarker · 기준일 2026-10-30
- 범위: Capacitor로 감싼 Android 앱의 **골격**(내비게이션·시스템 바·뒤로가기), 첫 실행, 권한, 위젯, 상태 화면, 아이콘, 스토어 등록 자료, 인앱 평점
- 반복하지 않은 것: 01(카드·딥다이브·필터·공유·다크모드·신뢰 표시), 10(온보딩 3단계 개념, 오프라인 갭, 알림 시간 설정), 11(스토어 이름·부제·키워드, iOS 스크린샷 첫 3장, 리뷰 불만 주제). 여기서는 **Android 플랫폼에서 달라지는 점**만 다룬다.
- 조사 방법: WebSearch/WebFetch. m3.material.io는 JS 렌더링이라 본문을 가져올 수 없었다. 그래서 같은 내용을 담은 `material-components-android` 공식 문서(GitHub)와 developer.android.com을 1차 근거로 썼다. Particle·Feedly·Medium의 현재 Android 화면은 로그인이나 앱 설치 없이 확인할 수 없어 보도 자료로 대신했고, 해당 카드에 표시해 두었다.

## 0. 요약 (5줄)
1. 지금 하단 탭은 3개(최신 호·탐색·저장)여서 M3 기준(3~5개)을 이미 충족한다. 부족한 것은 **Top app bar의 축소 동작, 엣지 투 엣지 인셋, 시스템 뒤로가기 연동**이다. 이 세 가지가 "웹 매거진" 인상의 주원인이다.
2. targetSdk 35부터 엣지 투 엣지가 강제되고, 36에서는 opt-out도 사라진다. 지금 CSS는 `env(safe-area-inset-*)`만 쓰는데, **WebView 140 미만에서는 이 값이 틀리게 나온다.** Capacitor 8.3.2+가 주입하는 `--safe-area-inset-*`를 먼저 읽도록 바꿔야 한다.
3. 알림 권한은 **첫 실행에서 묻지 않는다.** 저장 버튼이나 "새 호 알림" 벨처럼 맥락이 있는 순간에 사전 설득 시트를 띄운 뒤 시스템 대화상자를 연다. Android 중앙 동의율은 2023년 71.3%에서 2025년 53.3%로 떨어졌다(Airship).
4. 홈 화면 위젯 "오늘의 N곳"은 Startup Daily의 일간 리듬과 가장 잘 맞는 Android 고유 기능이다. 다만 Glance로 네이티브 코드를 짜야 하므로 L이다. 출시 1.0에서는 빼고 1.1로 미룬다.
5. 스토어 자료는 9:16 1080×1920 이상 스크린샷 **4장 이상**(추천 노출 자격 요건)과 피처 그래픽 1024×500이다. 피처 그래픽에는 "1위·무료·최고" 같은 문구와 기기 이미지를 넣지 않는다.

---

## 1. 앱 내비게이션 골격

### #A1 하단 내비게이션 바 — 3개 유지, Expressive 64dp
- 관찰 서비스: Material 3 내비게이션 바 규격. Google News는 2024~2025년 개편에서 하단 탭을 4개에서 3개(Home·Following·Newsstand)로 줄이고, 분야 탐색을 **상단 카테고리 칩 캐러셀**로 옮겼다(9to5Google, Digital Trends 보도. 정확한 배포일은 확인하지 못함).
- 무엇을: 목적지는 3~5개이고, 아이콘과 라벨을 함께 둔다. 기본 라벨 모드는 3개 이하일 때 모두 표시한다. 활성 인디케이터는 `secondaryContainer` 색의 56×32dp 알약 모양이다. 높이는 M3 80dp, M3 Expressive 64dp이고, Expressive에서는 선택된 라벨을 굵게 하지 않는다. 600dp 이상 폭에서는 아이콘과 라벨을 가로로 배치하고, 더 넓으면 내비게이션 레일로 바꾼다. 배지는 숫자 없는 점(dot) 또는 숫자로 표시한다.
- 왜 효과적인가: 하단 3탭은 한 손 엄지 도달 범위 안에 있다. Google News가 탭을 줄인 사례는 "자주 가는 곳만 탭으로, 분류는 칩으로"라는 방향을 보여 준다. Startup Daily의 섹터·주간 화면을 탭으로 올리지 않는 근거가 된다.
- Startup Daily 적용안: 현재 `Chrome.jsx` 탭 `issue / explore / saved`를 유지한다. ① 높이를 64dp에 맞추고 인디케이터를 알약 모양으로 바꾼다. ② 저장 탭 점(`saved.length>0`)은 "새로 저장한 것이 있음"일 때만 켠다. 상시 점등은 정보가 되지 않는다. ③ 최신 호 탭 점은 `meta.json.last_issue_date`가 마지막 방문일보다 새로울 때만 켠다. ④ 섹터(`_sector.key`)와 주간(`date` 주 단위)은 탐색 상단 칩으로 들어간다.
- 구현 난이도: S

### #A2 Top app bar — 첫 화면 large flexible, 상세 small + 스크롤 시 lift
- 관찰 서비스: M3 Top app bar(Expressive). medium/large는 deprecated되었고 **medium flexible·large flexible**로 대체되었다. 여기에 서브타이틀과 가운데 정렬이 추가되었다. Search app bar는 "검색이 핵심인 홈"에서 쓴다.
- 무엇을: large flexible은 큰 헤드라인으로 시작해 스크롤하면 small 바로 접힌다(`exitUntilCollapsed|snap`). `liftOnScroll`이 기본값이라, 내용이 바 밑으로 지나갈 때 바가 톤이 바뀌며 떠오른다.
- 왜 효과적인가: 첫 화면에서는 "오늘 호"라는 정체성을 크게 보여 주고, 읽기 시작하면 공간을 돌려준다. 고정된 웹 헤더가 계속 자리를 차지하는 웹 매거진 인상과 갈리는 지점이 바로 이것이다.
- Startup Daily 적용안: Issue 화면은 large flexible로 만든다. 타이틀은 "10월 30일 · 제22호"(`meta.last_issue_date`, `meta.issue_count`), 서브타이틀은 "오늘 5곳 · 약 6분"(그날 `date` 건수)이다. 접히면 small 바 "제22호"만 남는다. Explore는 Search app bar(이미 있는 검색 입력을 바로 옮긴다)로, Detail은 small 바에 `name_ko`를 두고 스크롤 40px 이후 페이드인한다. 우측 액션은 저장·공유 2개까지만 둔다. CSS `position:sticky`와 스크롤 진행률 변수로 구현할 수 있다.
- 구현 난이도: M

### #A3 엣지 투 엣지 + 시스템 바 스타일
- 관찰 서비스: Android 15(targetSdk 35)부터 엣지 투 엣지가 기본값이고, 상태·내비게이션 바 색 지정은 무시된다. Android 16(targetSdk 36)에서는 opt-out 속성이 제거되었다. Capacitor 8.3.0부터 네이티브 인셋을 `--safe-area-inset-*` CSS 변수로 주입하며, 8.3.2에서 API 34 이하의 중복 패딩 문제가 고쳐졌다.
- 무엇을: 콘텐츠는 상태 바 뒤까지 그리고, 텍스트와 터치 대상만 인셋 안쪽에 둔다. 상태 바 아이콘 색은 `SystemBars.style`(DARK/LIGHT/DEFAULT)로 테마에 맞춘다. 제스처 내비게이션 바는 투명하므로 탭바 배경이 화면 맨 아래까지 이어져야 한다.
- 왜 효과적인가: 상하에 띠가 남는 화면은 즉시 "웹뷰 앱"으로 읽힌다. 시스템 바와 앱 배경이 하나로 이어져야 네이티브 앱처럼 보인다.
- Startup Daily 적용안: `index.html`에는 이미 `viewport-fit=cover`가 있다. `app.css` 218·271·272·296행과 `tokens.css` 69행의 `env(safe-area-inset-*)`를 **`var(--safe-area-inset-*, env(safe-area-inset-*, 0px))`**로 바꾼다. WebView 140 미만에서는 `env()` 값이 틀리게 나오기 때문이다. 상태 바 아이콘 색은 기존 테마 상태(시스템·라이트·다크)에 맞춰 `SystemBars.setStyle()`로 바꾼다. `manifest`의 `theme_color #F3EFE6`·`background_color #1B1A17`이 서로 반대 톤인 점도 함께 정리한다.
- 구현 난이도: S

### #A4 예측형 뒤로가기 + 해시 라우터 연동
- 관찰 서비스: Android 16에서 targetSdk 36 이상이면 `enableOnBackInvokedCallback`이 기본 true다. 이 경우 back은 `KEYCODE_BACK`이 아니라 `OnBackInvokedDispatcher`로 전달되고, 옛 방식으로 가로채는 앱은 back을 받지 못한 채 종료된다는 보고가 있다(React Native 사례). Capacitor `@capacitor/app` 7.1.0에는 `disableBackButtonHandler` 설정과 `toggleBackButtonHandler()`가 추가되었다.
- 무엇을: 뒤로 갈 곳이 있으면 앱 안에서 처리하고, 첫 화면에서는 시스템에 넘겨 "홈으로 돌아가기" 미리보기 애니메이션이 나오게 한다. 바텀시트·검색·드로어는 M3 컴포넌트가 예측형 뒤로가기 축소 모션을 기본 지원한다.
- 왜 효과적인가: 홈에서 back을 했는데 아무 반응이 없거나, 상세에서 back을 했는데 앱이 꺼지면 리뷰 1점 사유가 된다(Ionic 포럼에서 "홈에서 back이 안 먹는다" 사례).
- Startup Daily 적용안: 라우팅이 `#/` 해시이므로 `backButton` 이벤트의 `canGoBack`을 보고 `history.back()`을 호출한다. 히스토리 첫 항목(`#/`)이면 `toggleBackButtonHandler({enabled:false})`로 시스템에 넘긴다. **열린 `Sheet.jsx`가 있으면 back은 시트부터 닫는다.** 딥링크로 Detail(`#/startup/{id}`)에 바로 들어온 경우에는 back이 앱 종료가 아니라 `#/`로 가도록 히스토리를 하나 심는다.
- 구현 난이도: M

---

## 2. 첫 화면 가치 전달

### #B1 시스템 스플래시 → 곧바로 오늘 호 (커스텀 스플래시 금지)
- 관찰 서비스: Android 12+ SplashScreen API. 아이콘은 240dp(배경 있음, 지름 160dp 원 안) 또는 288dp(배경 없음, 지름 192dp 원 안)이다. 애니메이션은 1,000ms 이하를 권장하고, 브랜딩 이미지는 가이드상 비권장이다. 첫 프레임을 그리면 사라지고, `setKeepOnScreenCondition`으로 더 붙잡을 수 있다. CleverTap은 미디어 앱 기준으로 실행 2~2.5초, 온보딩 2~5초를 벤치마크로 제시한다.
- 무엇을: 스플래시는 시스템에 맡기고, 웹뷰의 첫 페인트가 준비될 때까지만 유지한다.
- 왜 효과적인가: 별도 로고 화면을 하나 더 두면 Android 12+에서는 스플래시가 **두 번** 나온다. 대표적인 "포팅 앱" 신호다.
- Startup Daily 적용안: `@capacitor/splash-screen`은 `launchAutoHide:false`로 두고, React가 오늘 호 첫 카드를 렌더한 직후 `SplashScreen.hide()`를 호출한다. 데이터가 번들에 있어 네트워크를 기다릴 필요가 없다. 아이콘은 #G1의 전경 레이어를 그대로 쓴다.
- 구현 난이도: S

### #B2 첫 화면 = 히어로 1곳 + "오늘의 N곳" 진척
- 관찰 서비스: Google News 위젯의 Quick view(헤드라인 1개 + 출처·시각), Inshorts의 "60단어" 약속(분량을 먼저 예고). Lazyweb 표본(뉴스 8개 흐름)에서 뉴스 앱 온보딩은 중앙값 8화면으로 전 카테고리(11) 중 가장 짧았다.
- 무엇을: 첫 실행에서도 **온보딩보다 콘텐츠가 먼저** 나온다. 첫 화면 상단에 오늘의 대표 회사 1곳을 크게 보여 주고, 그 아래에 "5곳 중 0곳 읽음" 진척 막대를 둔다.
- 왜 효과적인가: 일간 큐레이션 앱의 가치는 "오늘 분량이 끝이 있다"는 데 있다. 3초 안에 회사 이름과 한 줄, 그리고 끝이 보이는 분량이 보이면 설치 이유가 바로 확인된다. 01 #1(인사 + 분량 예고)과 #12(완독 링)를 **앱 첫 프레임**에 맞게 압축한 형태다.
- Startup Daily 적용안: 히어로에는 그날 첫 항목의 `name_ko`·`tagline`·`category[0]`·`funding.latest_round`·`logo_url`(123곳 중 97곳만 있어 01 #19 모노그램 폴백 필수)을 쓴다. 진척은 `sd_read`와 그날 `date` 건수다. 하루 4~5곳으로 건수가 들쭉날쭉하므로 **"4곳"을 하드코딩하지 않는다.** 기존 `Onboarding.jsx`는 첫 화면을 가리지 않는 하단 시트로 바꾸고, 히어로를 한 번 스크롤하거나 10초가 지난 뒤에 띄운다.
- 구현 난이도: S

---

## 3. 개인화 온보딩

### #C1 관심 분야 칩 — 최소 0개, 건너뛰기 상시, 수정 위치 2곳
- 관찰 서비스: Medium은 웹 가입 시 "최소 3개 토픽"을 강제하고 Refine Recs에서 수정하게 한다(Medium 공식 블로그). 2015년 Android 앱 출시 때도 3개 선택이었다(9to5Google, 현재 앱은 미확인). Google News는 분야를 하단 탭에서 빼 상단 칩으로 옮겼다. Particle은 첫 실행에 관심사 설정을 거친다는 보도가 있지만 공식 확인은 없다.
- 무엇을: M3 필터 칩(선택 시 체크 아이콘 + 톤 채움)을 2~3열로 흐르게 놓고, 칩마다 회사 수를 붙인다. 하단 고정 버튼은 선택 수에 따라 "건너뛰기 / 3개 선택됨 · 계속"으로 바뀐다.
- 왜 효과적인가: Medium이 최소 개수를 강제하는 이유는 피드를 추천으로 채우기 때문이다. Startup Daily는 **오늘 호가 모두에게 같다**(10 §2-2). 그래서 최소 개수를 강제하면 이득은 없이 마찰만 생긴다. 고른 분야는 알림 필터와 탐색 정렬에만 쓰인다는 것을 칩 위에 한 줄로 밝혀 둔다.
- Startup Daily 적용안: 이미 `Onboarding.jsx`가 `_sector.key`로 회사 수를 세고 있다. 원천 `category`는 쓰지 않는다. 바꿀 점은 ① 최소 0개, ② 칩 라벨 옆 회사 수를 mono 숫자로, ③ 수정 위치를 탐색 상단 칩 줄 맨 끝의 "편집" 칩과 About(설정)의 "관심 분야" 두 곳으로 두는 것이다. 상단 진행 표시(`1 / 3`)는 유지한다.
- 구현 난이도: S

---

## 4. 알림 권한 (Android 13+ POST_NOTIFICATIONS)

### #D1 맥락 트리거 → 사전 설득 시트 → 시스템 대화상자
- 관찰 서비스: Android 공식 가이드는 "첫 실행에 묻지 말고, 사용자가 익숙해진 뒤 **사용자 행동에서** 요청하라"고 한다. 예시로 알림 벨 탭, 계정 팔로우, 주문 제출을 들고, 3~4번째 실행까지 미루는 방법도 제시한다. Airship(2022)은 미디어 앱 예로 "특정 주제 기사 3~4개를 읽은 뒤", 그리고 예/아니오/나중에 세 버튼의 자체 설명 화면에서 "예"인 사람에게만 시스템 대화상자를 보내라고 권한다.
- 무엇을: 자체 시트에 "무엇이·언제·얼마나 자주 오는지"를 적고, 그다음에 시스템 대화상자를 연다. 거절하면 `shouldShowRequestPermissionRationale()`이 true일 때만 다음 맥락에서 한 번 더 시도한다. 그 뒤로는 앱 알림 설정 화면으로 보내는 링크만 남긴다.
- 왜 효과적인가: 데이터(기준 시점 명시)는 다음과 같다.

| 지표 | 값 | 출처·시점 |
|---|---|---|
| Android 중앙 동의율 (전 업종) | 2023 71.3% → 2024 59.5% → **2025 53.3%** | Airship 2026 벤치마크(2025 데이터). 연도별 추이는 2차 인용 |
| iOS 중앙 동의율 | 2025 48.85% | 同 |
| 온보딩 캠페인을 돌린 앱 | 카테고리 평균 대비 **최대 +40%** | 同 |
| Android 13 이전 중앙값 | 80.3% | Airship 2022-08 |

  사전 설득 화면 유무를 직접 A/B로 비교한 공개 데이터는 찾지 못했다. "+40%"는 온보딩 캠페인 전체의 효과이므로, 사전 설득 화면 하나의 효과로 읽으면 안 된다.
- Startup Daily 적용안: 트리거는 ① 처음으로 저장할 때(`saved_startups` 0→1), ② 오늘 호를 끝까지 읽었을 때(`sd_read`가 그날 건수에 도달), ③ 최신 호 상단 벨 아이콘을 탭할 때, 이렇게 셋이다. 시트 문구는 "새 호가 나오면 하루 한 번만 알려 드려요 · 오전 8시"로 하고, 시간은 기존 `AlertSetting.jsx`와 연결한다. 관심 분야를 골랐다면 "내 분야 회사가 있는 날만" 토글(`_sector.key`)을 둔다. 웹 푸시(`usePush.js`, web-push)는 앱에서는 FCM(`@capacitor/push-notifications`)으로 바꿔야 한다. 서버의 `last_issue_date` 변경 감지는 그대로 쓴다.
- 구현 난이도: 시트·트리거 S / FCM 전환 M

---

## 5. 홈 화면 위젯

### #E1 "오늘의 스타트업" 위젯 — 2×2 히어로 / 4×2 목록
- 관찰 서비스: Google News(2023-06, v5.82). 기본 3×2 **Quick view**는 헤드라인 1개, 출처·시각, "Full Coverage" 버튼으로 구성되고, 크기를 키우면 **List view**로 바뀌어 7개를 스크롤한다. 헤더의 아이콘과 "Google News"를 탭하면 For You로 간다. 리뷰어는 Quick view가 이미지 없이 글자만 많다고 지적했다. Inshorts도 헤드라인 위젯을 제공한다(크기는 미확인).
- Android 위젯 품질 기준(공식): Tier 2는 크기를 키울 때 텍스트를 선형으로 확대하지 말고 내용을 더 보여 줄 것, 최소 크기에서도 48dp 터치 대상을 지킬 것, 빈 상태에서도 쓸모가 있을 것을 요구한다. Tier 1은 2×1과 1×1·2×2·4×2·4×4 중 2개 이상의 크기, 일관된 헤더(아이콘 상시, 공간이 되면 제목), 라이트·다크 팔레트, **시스템 모서리 반경 사용**(직접 지정 금지), 위젯에 직접 보이는 로딩·오류 상태, 정확한 미리보기와 설명을 요구한다.
- 왜 효과적인가: 위젯은 앱을 열지 않아도 "오늘 호가 나왔다"는 사실을 홈 화면에 남긴다. 알림을 거절한 53%에게도 닿는 유일한 수동 채널이다. 하루 한 번 갱신하는 데이터라 품질 기준의 "오래된 내용(stale)" 감점 위험도 낮다.
- Startup Daily 적용안:

| 크기 | 내용 | 데이터 필드 |
|---|---|---|
| 2×2 | 로고/모노그램 + `name_ko` + `tagline` 2줄 + "1/5" | `logo_url`, `name_ko`, `tagline`, 그날 건수 |
| 4×2 | 헤더 "오늘의 스타트업 · 10/30" + 4~5곳 한 줄 목록 | `date`, `name_ko`, `category[0]`, `funding.latest_round` |
| 4×4 | 4×2 + 각 회사 "왜 지금" 한 줄 | `trending_reason.summary`(앞 40자) |
| 빈 상태 | "다음 호 준비 중 · 지난 호 보기" | `meta.last_issue_date`가 오늘이 아님 |

  탭하면 `#/startup/{id}`로 딥링크한다. 갱신은 앱 실행 시 `startups.json`의 오늘 분을 SharedPreferences에 써 두고, Glance 위젯이 읽는 방식이다. 하루 1회 WorkManager로 원격 `meta.json`을 확인하는 것은 선택 사항이다. Capacitor 공식 지원이 없어 Kotlin 작업이 필요하다(커뮤니티 플러그인 `capacitor-widget-bridge` 등은 Glance 지원 여부 미확인).
- 구현 난이도: L (1.1 릴리스 권장)

---

## 6. 상태 화면

### #F1 상태 5종 표
기존 10 §2-9·§2-12의 웹 기준 진단 위에 Android 고유 요소만 더한다.

| 상태 | 관찰 기준 | Startup Daily 적용안 (데이터) | 난이도 |
|---|---|---|---|
| 로딩/스켈레톤 | M3 Expressive 로딩 인디케이터는 7개 도형이 모핑하는 짧은 대기용이다. 당겨서 새로고침에서는 **연한 원형 컨테이너** 안에 둔다. 긴 작업에는 물결형 진행 막대를 쓴다(9to5Google 2025-05). | 번들 데이터라 첫 화면 스켈레톤은 거의 불필요하다. "한국에서는" 온디맨드 생성(`korea-lens.json` 미존재 시)에는 물결형 진행 막대와 "약 20초" 예고를 쓴다. 로고 이미지는 회색 원 대신 모노그램을 먼저 그린다. | S |
| 당겨서 새로고침 | Compose `PullToRefreshDefaults.LoadingIndicator`. | 최신 호 화면에만 둔다. 동작은 원격 `meta.json`을 다시 받아 `last_issue_date`를 비교하는 것이다. 새 호가 있으면 리로드하고, 없으면 스낵바로 "최신 호예요 · 다음 호 내일 오전"을 띄운다. 탐색·저장에는 두지 않는다(새로 받을 것이 없다). | S |
| 오프라인 | Readwise처럼 오프라인 범위를 명시(10 §2-12). | `@capacitor/network`의 `networkStatusChange` → top app bar 아래 얇은 띠 "오프라인 · 저장된 호만 볼 수 있어요"를 띄운다. 네트워크가 필요한 버튼("한국에서는" 생성, 외부 `related_links`)은 미리 비활성화하고 이유를 적는다. | S |
| 빈 상태 | 위젯 품질 기준 WT-1: 빈 상태에서도 쓸모가 있어야 한다. | 저장 0건: "회사 카드의 북마크를 누르면 여기 모여요" + 오늘 호 바로가기. 검색 0건: 정규 섹터 칩 3개를 추천. 새 호 공백(6개월 공백 전례): `meta.last_issue_date`가 오늘보다 2일 이상 이전이면 "잠시 쉬어 가는 중 · 지난 22호 보기"를 표시. | S |
| 오류 | 위젯 품질 WS-3: 오류를 UI에 직접 표시한다. | 스낵바(하단 탭 위에 띄우고, 엣지 투 엣지 인셋 포함) + "다시 시도" 액션 1개. 토스트(`Toast.jsx`)가 하단 탭을 가리지 않게 위치를 조정한다. | S |

---

## 7. 앱 아이콘

### #G1 적응형 아이콘 + 모노크롬 레이어
- 관찰 서비스: Android 공식 규격. 레이어(전경·배경·모노크롬)는 각 108×108dp이고, 어떤 마스크로도 잘리지 않는 안전 영역은 가운데 66×66dp다. 로고는 48~66dp 크기로, 바깥 18dp는 마스크와 시차 효과용으로 비워 둔다. Android 13+는 `monochrome` 레이어가 있으면 배경화면 색으로 테마 아이콘을 만든다. **Android 16 QPR2+는 모노크롬이 없는 앱도 자동으로 테마 처리**한다. 즉, 직접 만들지 않으면 시스템이 임의로 단색화한다.
- 무엇을: 전경은 단일 글리프, 배경은 단색이다. 모노크롬은 전경을 단색으로 단순화한 것이다. Play 아이콘은 별도로 512×512 32비트 PNG(알파 포함, 1MB 이하)를 준비하고, 순위·가격·카테고리를 암시하는 배지나 텍스트는 넣지 않는다.
- 왜 효과적인가: 스토어 검색 목록과 런처에서 아이콘은 48dp 안팎으로 보인다. 워드마크 "Startup Daily"를 넣으면 읽히지 않는다. 테마 아이콘을 켠 사용자에게 자동 단색화된 덩어리로 보이면 식별성이 무너진다.
- Startup Daily 적용안: `Logo.jsx`의 마크를 전경으로 쓴다. 글자가 필요하면 "SD" 모노그램이나 "오늘 한 묶음"을 상징하는 4칸 격자 하나만 둔다. 배경은 manifest의 다크 `#1B1A17` 또는 페이퍼 `#F3EFE6` 중 하나로 정한다. 현재 `icon-512.png` 하나를 `maskable` 겸용으로 쓰고 있는데, 이를 108dp 벡터 3레이어로 분리한다. 같은 전경을 SplashScreen 아이콘(#B1)에도 쓴다.
- 구현 난이도: S

---

## 8. Google Play 스토어 등록 자료

### #H1 규격표 (Play Console 고객센터 기준)

| 자산 | 규격 | 비고 |
|---|---|---|
| 앱 아이콘 | 512×512, 32비트 PNG(알파), ≤1MB | 순위·가격 배지 금지 |
| 피처 그래픽 | **1024×500**, JPEG 또는 24비트 PNG(알파 없음) | 핵심은 중앙에 둔다. 순백·검정·짙은 회색 배경은 피한다. "Best/#1/Free/Sale", 시한성 문구, 기기 이미지 금지. 대체 텍스트 140자 이하 |
| 폰 스크린샷 | 기기 유형당 최대 8장, 게시 최소 2장. 변 320~3840px, 긴 변이 짧은 변의 2배 이하 | **추천 노출 자격: 1080px 이상 9:16(1080×1920+) 4장 이상** |
| 스크린샷 가이드 | 첫 3장은 실제 UI 우선. 문구는 화면의 20% 미만. "지금 다운로드" 같은 CTA 금지. 상태 바 정리(알림 숨김, 배터리·신호 가득). 손·사람 금지. 각 장 대체 텍스트 | |
| 미리보기 영상 | 공개 또는 일부 공개 YouTube 1개, 광고 off. 첫 10초 안에 실제 사용 장면, 80% 이상 실제 화면. 처음 30초만 음소거 자동 재생 | 선택 |
| 태블릿 | 1080~7680px, 16:9 또는 9:16, 4장 이상 | 태블릿 지원 시 |

### #H2 스크린샷 메시지 구성 (Android 전용 조정)
- 관찰 서비스: 11 §2-2에서 iOS 상위 뉴스 앱 첫 3장을 직접 확인했다(가치 문장 → 대표 화면 → 개인화 순). Play 가이드는 **문구 20% 미만**과 **첫 3장은 UI 우선**을 명시한다. iOS보다 캡션을 줄여야 한다는 뜻이다.
- 무엇을: 캡션은 짧게 위쪽에 두고, 아래 80%는 실제 화면 캡처로 채운다. 기기 프레임 없이, 엣지 투 엣지 상태 그대로 보여 준다.
- Startup Daily 적용안 (8장 중 6장):

| # | 캡션(한 줄) | 화면 | 데이터 |
|---|---|---|---|
| 1 | 아직 모르는, 지금 뜨는 스타트업 | 최신 호 히어로 + "오늘 5곳" | `tagline`, `funding.latest_round` |
| 2 | 하루 5분, 끝이 있는 브리핑 | 진척 막대가 보이는 오늘 호 목록 | 그날 건수, `sd_read` |
| 3 | 왜 지금 뜨는지 한눈에 | Detail "왜 지금" 섹션 | `trending_reason.catalysts` |
| 4 | 투자·경쟁사까지 한 장에 | 투자 타임라인 + 경쟁사 | `funding.funding_history`, `competitive_landscape.direct_competitors` |
| 5 | 출처를 확인할 수 있는 요약 | 신뢰 블록 | `website_check.verified`, `generated_at`, `related_links` |
| 6 | 홈 화면에서 오늘 호를 | 위젯(1.1 이후 교체) / 그전까지는 "새 호 알림" 시트 | — |

  피처 그래픽은 단색 페이퍼 톤 배경에 회사 카드 3장을 부채꼴로 펼치고 "매일 4~5곳"이라는 문구 하나만 둔다. "AI가 쓴"을 강조 문구로 쓰지 않는다. 11 §3에서 신뢰 불만이 확인되었기 때문이다.
- 구현 난이도: S (디자인 작업)

---

## 9. 인앱 평점 요청

### #I1 In-App Review API — "완독 + n회차" 이후 1회
- 관찰 서비스: Play 공식 가이드는 다음과 같다. 피드백을 줄 만큼 쓴 뒤에 요청한다. **요청 전이나 도중에 "앱이 마음에 드세요?"나 "별 5개 주실래요?" 같은 질문을 하지 않는다.** 카드의 크기·투명도·모양을 바꾸거나 오버레이하지 않는다. 버튼으로 API를 호출하지 않는다(할당량에 걸리면 아무 일도 일어나지 않기 때문). 한 달 미만 간격의 재호출은 표시되지 않을 수 있고, 표시 여부는 보장되지 않는다.
- 무엇을: 긍정적 완료 순간 직후, 화면 전환 사이에 조용히 `launchReviewFlow`를 호출한다. 결과와 무관하게 흐름이 이어지게 한다.
- 왜 효과적인가: "오늘 호를 다 읽었다"는 하루 중 가장 만족도가 높은 순간이다. 사전 질문으로 걸러 내는 것(리뷰 게이팅)은 정책 위반 소지가 있다.
- Startup Daily 적용안: 조건은 ① 서로 다른 날짜 3개 호 이상에서 완독(`sd_read`가 그날 건수에 도달), ② 오늘 완독 직후, ③ 최근 7일 내 오류·정정 제보 없음, ④ 첫 설치 후 7일 이상이다. 마지막 시도 시각을 로컬에 기록해 90일에 한 번만 호출한다. About의 "리뷰 남기기"는 API가 아니라 Play 상세 페이지 링크로 둔다.
- 구현 난이도: S (네이티브 플러그인 1개 필요. 예: 커뮤니티 in-app-review 플러그인)

---

## 10. 안티패턴

| 안티패턴 | 왜 나쁜가 | 근거 |
|---|---|---|
| 첫 실행 직후 알림 시스템 대화상자 | 거절하면 2회 차부터는 재요청이 막히고, 1회 거절로 끝나는 경우도 있다. 중앙 동의율 53%대 시대에 가장 비싼 실수 | Android 공식, Airship |
| 커스텀 로고 스플래시 Activity | Android 12+에서 스플래시가 두 번 나오는 "포팅 앱" 신호 | SplashScreen 가이드 |
| `env(safe-area-inset-*)`만 사용 | WebView 140 미만에서 0 또는 틀린 값 → 상태 바와 글자가 겹친다 | Capawesome |
| `windowOptOutEdgeToEdgeEnforcement`로 버티기 | targetSdk 36에서 제거되므로 다음 해 Play 타깃 요건 때 다시 고쳐야 한다 | edge_to_edge_plus 변경 로그, LanguageForge PR |
| back 이벤트를 무조건 가로채기 | 홈에서 back이 먹지 않거나, 상세에서 앱이 종료된다. 예측형 애니메이션도 사라진다 | Ionic 포럼, AOSP 커밋 |
| 하단 탭에 섹터·주간까지 5개 채우기 | Google News는 오히려 4→3으로 줄였다. 분류는 칩이 맡는다 | 9to5Google·Digital Trends |
| "별점 주기" 버튼 → In-App Review 호출 | 할당량 초과 시 무반응이라 고장 난 UI처럼 보인다 | Play 가이드 |
| "앱이 마음에 드세요?" 사전 질문 | 리뷰 API 가이드 위반 | Play 가이드 |
| 위젯 모서리 반경 직접 지정, 글자만 있는 위젯 | 시스템 일관성 감점. Google News Quick view도 "텍스트만 많다"는 지적을 받았다 | 위젯 품질 기준 WS-2, 9to5Google |
| 피처 그래픽에 "No.1 스타트업 앱", 폰 목업 | Play 가이드 금지 문구와 기기 이미지 | Play Console 고객센터 |
| 관심 분야 최소 3개 강제 | 오늘 호가 공통이라 개인화 이득이 없고 마찰만 생긴다 | 10 §2-2, Medium 사례 대비 |
| 스트릭·완독 수를 앱 아이콘 배지로 압박 | 발행 공백(6개월 전례)에 사용자 탓이 아닌 단절이 생긴다 | 10 §2-3 |

---

## 11. 결론 — Startup Daily가 할 것 / 하지 말 것

### 할 것 (출시 1.0)
| 우선 | 항목 | 카드 | 난이도 |
|---|---|---|---|
| P0 | 인셋 변수 교체(`var(--safe-area-inset-*, env())`) + SystemBars 스타일 테마 연동 | #A3 | S |
| P0 | back 처리: 시트 닫기 → 해시 back → 첫 화면이면 시스템에 넘김 | #A4 | M |
| P0 | 시스템 스플래시 + 첫 렌더 후 hide | #B1 | S |
| P0 | 적응형 아이콘 3레이어(모노크롬 포함) + Play 512 아이콘 | #G1 | S |
| P0 | 스크린샷 9:16 1080×1920 6장 + 피처 그래픽 1024×500 | #H1·H2 | S |
| P1 | 최신 호 large flexible top app bar(접힘) / Detail small 바 | #A2 | M |
| P1 | 첫 화면 히어로 + "N곳 중 n곳" 진척. 온보딩은 하단 시트로 지연 | #B2 | S |
| P1 | 알림: 맥락 트리거 3개 + 사전 설득 시트 + FCM | #D1 | S/M |
| P1 | 오프라인 띠, 당겨서 새로고침(최신 호만), 빈 상태 문구 | #F1 | S |
| P2 | 인앱 평점(완독 3회 이후) | #I1 | S |
| 1.1 | 홈 화면 위젯 2×2 / 4×2 / 4×4 | #E1 | L |

### 하지 말 것
- 첫 실행에서 알림을 요청하지 않는다. 온보딩 3단계의 마지막에 알림 단계를 붙이는 것도 Android에서는 미룬다.
- 하단 탭을 4~5개로 늘리지 않는다. 섹터와 주간은 칩으로 둔다.
- 커스텀 스플래시, 기기 목업 스크린샷, "No.1"·"무료" 문구를 쓰지 않는다.
- edge-to-edge opt-out 속성으로 시간을 벌지 않는다.
- 평점 버튼을 만들지 않고, 사전 만족도 질문도 하지 않는다.
- 위젯을 1.0 일정에 끼워 넣어 출시를 늦추지 않는다.

---

## 출처
- Material Components Android — Navigation bar: https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/BottomNavigation.md
- Material Components Android — Top app bar: https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/TopAppBar.md
- SAP Fiori for Android(M3 내비게이션 레일 요약): https://www.sap.com/design-system/fiori-design-android/v26-4/components/m3-standard-components/navigation-rail/usage
- Android Developers 블로그 — Android 15 엣지 투 엣지 인셋 팁: https://medium.com/androiddevelopers/insets-handling-tips-for-android-15s-edge-to-edge-enforcement-872774e8839b
- Capawesome — Capacitor edge-to-edge & safe areas: https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/
- edge_to_edge_plus 변경 로그(Android 16 opt-out 제거): https://pub.dev/packages/edge_to_edge_plus/changelog
- LanguageForge PR(인셋 → CSS 변수 주입 사례): https://github.com/sillsdev/languageforge-lexbox/pull/2283
- AOSP — Default enableOnBackInvokedCallback true for targetSdk≥36: https://android.googlesource.com/platform/frameworks/base/+/badc0a4bf357
- Android — 예측형 뒤로가기: https://developer.android.com/guide/navigation/predictive-back-gesture
- Android Developers 블로그(2022) — 예측형 뒤로가기 준비: https://android-developers.googleblog.com/2022/07/prepare-your-app-to-support-predictive-back-gestures.html
- Ionic 포럼 — Android back 버튼 이슈: https://forum.ionicframework.com/t/issue-with-android-back-button/249275
- itechguides — RN back exits on Android 16: https://www.itechguides.com/fix-react-native-back-exits-on-android-16-after-target-sdk-36/
- Capacitor App API: https://capacitorjs.com/docs/apis/app
- Android — SplashScreen: https://developer.android.com/develop/ui/views/launch/splash-screen
- CleverTap — 미디어 앱 온보딩: https://clevertap.com/blog/the-secrets-of-successful-media-app-onboarding/
- Lazyweb — 뉴스 앱 온보딩 길이: https://www.lazyweb.com/research/news-onboarding-length.md
- Medium 블로그 — Make Medium yours: https://medium.com/blog/make-medium-yours-86665fd5f16d
- 9to5Google(2015) — Medium Android 출시: https://9to5google.com/2015/06/24/mediums-android-app-now-public-google-play-store/
- TechCrunch(2026-02) — Particle Android 출시 전후: https://techcrunch.com/2026/02/23/particles-ai-news-app-listens-to-podcasts-for-interesting-clips-so-you-you-dont-have-to/
- Google News 하단 탭 4→3 개편: https://9to5google.com/?p=654000 , https://digitaltrends.com/?p=3802906 , https://www.androidauthority.com/google-news-home-tabs-redesign-3502968
- Feedly Android 하단 탭(2018): https://www.phonearena.com/news/Feedly-for-Android-redesign-may-take-getting-used-to_id111009
- Android — 알림 런타임 권한: https://developer.android.com/develop/ui/views/notifications/notification-permission
- Airship(2022-08) — Android 13 기본 opt-out: https://www.airship.com/blog/brands-on-notice-with-android-13-default-opt-out/
- Airship — 2026 푸시 벤치마크(2025 데이터): https://www.airship.com/mobile-app-push-notification-benchmarks-for-2026/
- MoEngage — Android 푸시 권한: https://www.moengage.com/docs/user-guide/campaigns-and-channels/mobile-push/notification-features-and-behavior/android-push-permission-and-reachability
- Android — 위젯 품질 가이드: https://developer.android.com/design/ui/mobile/guides/widgets/widget_quality_guide
- Android — Glance: https://developer.android.com/develop/ui/compose/glance/glance-app-widget
- 9to5Google(2023-06) — Google News 위젯: https://9to5google.com/2023/06/13/google-news-widget/
- Inshorts 위젯 언급: https://apkmirror.com/apk/inshorts-formerly-news-in-shorts/inshorts-news-in-60-words-2
- Capacitor 위젯 포럼: https://forum.ionicframework.com/t/capacitorjs-2024-is-there-a-way-to-add-widgets-for-apps/242306
- 9to5Google(2025-05) — M3 Expressive 로딩 인디케이터: https://9to5google.com/2025/05/16/material-3-expressive-loading-indicator/
- Compose ContainedLoadingIndicator: https://composables.com/material3/containedloadingindicator
- M3 Expressive 연구(최대 4배 빠른 요소 탐지): https://9to5google.com/?p=671309 , https://www.neowin.net/news/google-leaks-material-3-expressive-design-language-ahead-of-google-io-2025/
- Android — 적응형 아이콘: https://developer.android.com/develop/ui/views/launch/icon_design_adaptive
- Play Console — 미리보기 자산: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- Play — In-App Review: https://developer.android.com/guide/playcore/in-app-review
