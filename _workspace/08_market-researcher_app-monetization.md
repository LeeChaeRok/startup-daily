# 08. 앱 출시 기반 수익화 리서치: Startup Daily

- 작성: market-researcher / 기준일(접근일) **2026-10-28**
- 범위: iOS·Android 앱 출시를 전제로 한 결제 수수료, 스토어 정책, 앱 포장 방식과 심사 리스크, 구독 관리 도구, 국내 사례, 광고, 푸시, 스토어 유입. 07 문서(가격대, 뉴스레터 광고, 국내 PG, 크레딧 과금, B2B, 규제)는 반복하지 않고 필요한 곳만 [07 M번호]로 참조한다.
- 표기 규칙
  - **[사실]**: 원출처(공식 문서, 법원 기록, 스토어 페이지 직접 확인)가 있는 내용. 출처 번호는 [A번호]다.
  - **[2차]**: 언론·블로그·벤더 자료. 방향을 가늠하는 용도로만 쓴다.
  - **[추정]**: 계산하거나 가정한 값.
  - **[판단]**: 리서처의 해석.
  - **확인 불가**: 검색이나 페이지 접근으로 확인하지 못한 항목.
- 환율 가정: 1 USD ≈ 1,400원 [추정, 07 문서와 동일. 이번에도 환율은 확인하지 않았다].
- 수수료 계산의 공통 가정 [추정]: 소비자 가격에 부가세 10%가 포함되어 있고, 스토어 수수료는 부가세를 뺀 금액에 붙는다고 본다. PG 수수료는 토스페이먼츠 카드 3.4%[07 M19]를 쓴다.

---

## 0. 요약(5줄)

1. **iOS는 Small Business Program에 들면 구독·크레딧 모두 첫날부터 15%**다[A1][A2]. 한국 전용 "외부 결제" 권한은 수수료가 **26%**이고 PG 비용은 따로 내야 한다. 같은 앱에서 IAP와 함께 쓸 수도 없다[A3]. 소규모 개발자에게는 **IAP 15%보다 손해**다[추정]. 앱 밖 웹 결제로 보내는 링크는 **미국 스토어에서만** 허용된다[A4]. 한국은 방미통위가 안티스티어링 시정명령을 넣을지 **2026-10-28 심의 중**이며, 결과는 확인 불가다[A10][A11].
2. **Google Play는 한국에서 2026-12-31까지** 새 수수료 체계로 바뀐다(보도 기준). 구독은 **서비스 수수료 10%**이고, Google Play 결제를 쓰면 **결제 수수료 5%가 더 붙는다**. 자체 결제나 외부 웹 링크를 쓰면 결제 수수료는 없다[A6][A7][A8]. 그전까지는 **구독 15%**, 한국 대체 결제는 **15%에서 4%p 감면**된 수수료다[A5][A9].
3. 독자가 0명인 1인 운영자에게 **진짜 장벽은 수수료보다 등록 요건**이다. Apple 개인 계정은 **실명이 판매자명으로 표시**된다[A13]. 한국 개발자는 유료 앱 계약에 **사업자등록번호**를 요구받고, 번호는 제품 페이지에 공개된다[A14][A15]. Google은 유료 판매 계정의 **전체 주소를 공개**한다[A17]. 2023-11-13 이후 만든 Google 개인 계정은 **테스터 12명이 14일 연속 참여하는 비공개 테스트**를 마쳐야 프로덕션에 출시할 수 있다[A18].
4. **웹 래퍼는 Apple 4.2(최소 기능)에서 반려될 위험이 크다.** 가이드라인 첫 문장부터 "재포장한 웹사이트 이상"을 요구한다[A12]. 2026-01에는 위치·공유 같은 네이티브 기능을 넣은 Capacitor 앱도 다시 반려됐다[A21]. 국내 지식 구독 앱 **롱블랙·퍼블리는 iOS 앱에서 인앱 구입을 아예 팔지 않는다**. **뉴닉은 인앱으로 단품 패키지를 판다**(12,000~37,000원)[A30][A31][A32].
5. 앱을 내는 가장 큰 이유는 **푸시를 통한 리텐션**이다. 2025년 푸시 동의율 중앙값은 **iOS 48.85%, Android 53.3%**다[A35]. 뉴스 앱의 30일 리텐션은 **7.6% 수준**이다[A36]. 광고(AdMob)는 독자 0명 단계에서 **월 수만 원 이하**라 의미가 없다[추정]. 국내 App Store 뉴스 카테고리는 다운로드 1만+ 규모의 앱(롱블랙)이 무료 차트 **#5**에 올라 있다. 뉴스 카테고리 상위 노출이 상대적으로 쉬울 수 있다는 신호다[A30][A33][판단].

---

## 1. Apple App Store

### 1-1. 수수료와 IAP 의무

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| IAP 의무 (3.1.1) | 앱 안에서 기능이나 콘텐츠를 여는 행위(구독, 게임 내 화폐, **프리미엄 콘텐츠 접근**, 정식판 전환 등)는 IAP로만 해야 한다. 라이선스 키, QR 같은 자체 잠금 해제 수단은 금지된다 | 2026-10-28 접근 | [A12] [사실] |
| 표준 수수료 | 유료 앱과 IAP는 30%. 자동 갱신 구독은 첫해 30%이고, **유료 서비스 1년이 쌓이면 개발자 몫이 85%(수수료 15%)**가 된다 | 2026-10-28 접근 | [A2] [사실] |
| Small Business Program (SBP) | 전년도 수익 **100만 달러 이하** 개발자와 **신규 개발자**는 대상이 된다. 수수료 **15%**. SBP 회원은 구독 1년 경과 여부와 관계없이 **매 결제마다 85%**를 받는다. 신청해야 하며, 연관 계정의 수익도 합산한다 | 2026-10-28 접근 | [A1][A2] [사실] |
| SBP의 "1년 후 10%" 문구 | SBP 페이지에 "EU 대체 약관 + SBP, 그리고 첫해 이후 구독은 10%"라는 문장이 있다. **EU 대체 약관에 한정된 것인지** 문맥상 분명하지 않다. 한국 적용 여부는 **확인 불가** | 2026-10-28 접근 | [A1] [사실/해석 주의] |
| 국내 가격 단위 | 2022-10에 한국 IAP 최저 티어가 1,200원에서 1,500원으로 올랐다(자동 갱신 구독은 제외). 현행 가격표는 확인 불가 | 2022-09 | [A40] [2차] |

### 1-2. 한국 대체 결제 (StoreKit External Purchase Entitlement, KR)

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 근거 | 전기통신사업법 개정(2021)에 따른 조치다. 한국 스토어에만 배포하는 **별도 바이너리(새 번들 ID)**가 필요하다. 기존에 IAP를 쓰던 앱은 한국 스토어에서 내려야 승인받을 수 있다 | 2026-10-28 접근 | [A3] [사실] |
| 수수료 | 이용자가 낸 가격의 **26%**. Apple은 결제 처리 비용을 뺀 "감면 요율"이라고 설명한다. 페이지에 SBP 감면 언급은 없다(SBP 회원도 26%인지 **확인 불가**) | 2026-10-28 접근 | [A3] [사실] |
| PG | 사전 승인 PG는 **KCP, 이니시스, 토스, NICE**이고, 권한 하나에 PG 하나만 쓸 수 있다. PG 수수료는 개발자가 따로 낸다 | 2026-10-28 접근 | [A3] [사실] |
| IAP 병행 | **같은 앱에서 IAP와 함께 쓸 수 없다** | 2026-10-28 접근 | [A3] [사실] |
| 앱 밖 링크 | 결제 화면은 앱 안에 네이티브로 만들어야 하고 웹뷰는 금지된다. 웹사이트로 보내는 것은 **법적으로 필요한 경우에만** 허용된다 | 2026-10-28 접근 | [A3] [사실] |
| 운영 부담 | 결제 전 Apple 지정 안내 모달을 띄워야 한다. 매월 판매를 신고하고(회계월 종료 후 15일 안), 인보이스를 45일 안에 납부한다. 환불과 구독 관리 고객지원은 모두 개발자가 맡는다 | 2026-10-28 접근 | [A3] [사실] |
| 규제 현황 | 방미통위가 구글 429억 원, 애플 208억 원(합계 637억 원) 과징금안을 **2026-10-28 전체회의**에서 심의한다는 보도가 있다. 쟁점은 **외부 결제 안내·연결을 허용하는 안티스티어링 의무를 시정명령에 넣을지**다. 의결 결과는 **확인 불가**(조사 시점에 미발표) | 2026-10-27 보도 | [A10][A11] [2차] |

### 1-3. 미국 판결 이후 외부 결제 링크

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 가이드라인 문구 | 3.1.1(a): "**미국 스토어 앱**은 버튼, 외부 링크, 기타 행동 유도에 엔타이틀먼트가 필요 없다." 3.1.3: 다른 결제 수단 유도 금지 조항의 예외도 "**미국 스토어 앱**"으로 한정한다 | 2026-10-28 접근 | [A12] [사실] |
| 항소심 | 제9순회항소법원(2025-12-11)이 법정모독 판단을 대체로 유지했다. 다만 "수수료 전면 금지"는 과하다고 보고, **외부 링크 조정에 실제로 드는 비용 수준의 수수료**는 허용할 수 있다며 사건을 1심으로 돌려보냈다 | 2025-12-11 | [A22][A23] [사실/2차] |
| 대법원 | 2026-06-30 Apple의 상고를 받아들였다(No. 25-1311). Apple 본안 서면은 2026-09 제출. 판결은 아직 없다. 현재 미국에서 외부 링크 수수료가 0%인지는 보도마다 달라 **확인 불가** | 2026-09 | [A24][A25] [사실/2차] |
| **한국 적용 여부** | **적용되지 않는다.** 가이드라인이 미국 스토어로 한정한다. 한국에서는 1-2의 26% 대체 결제나 1-4의 Reader 예외만 쓸 수 있다 | 2026-10-28 | [A12] [사실] |
| 참고: 일본 | 2025-12 스마트폰경쟁법 시행에 맞춰 Apple이 일본에서 웹 링크 결제를 허용했다. 수수료는 **15%**이고, 제3자 인앱 결제는 21%다(보도마다 수치 차이 있음) | 2025-12~2026-02 | [A26][A27] [2차] |

### 1-4. Reader 앱 예외 (3.1.3(a), External Link Account Entitlement)

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 대상 콘텐츠 | **잡지, 신문, 책, 오디오, 음악, 비디오**가 앱의 **주 기능**이어야 한다. 실시간 1:1 서비스(과외, 상담)는 제외된다 | 2026-10-28 접근 | [A12][A16] [사실] |
| 링크 없는 기본 허용 | Reader 앱은 IAP 없이도 **이미 구매한 콘텐츠·구독에 로그인해 접근**할 수 있고, 무료 계정 생성도 받을 수 있다(3.1.3(a) 본문) | 2026-10-28 접근 | [A12] [사실] |
| 링크 엔타이틀먼트 | 신청해서 승인받으면 계정 생성·관리용 **정보성 링크 1개**를 둘 수 있다. 링크에 **가격 문구를 넣으면 안 되고**, 웹뷰가 아닌 기본 브라우저로 열어야 하며, URL 파라미터도 금지된다. 링크 전에 모달을 띄워야 한다 | 2026-10-28 접근 | [A16] [사실] |
| IAP 병행 | 엔타이틀먼트를 쓰는 앱은 **IAP를 제공할 수 없다** | 2026-10-28 접근 | [A16] [사실] |
| 지역 | "App Store가 있는 모든 국가·지역"에서 쓸 수 있다. 한국도 포함된다 | 2026-10-28 접근 | [A16] [사실] |
| 링크 경유 결제의 Apple 수수료 | 공식 페이지에 언급이 없어 **확인 불가** | – | [A16] |
| **뉴스·매거진 앱 적용** | 신문·잡지는 명시된 대상이라 **적용된다.** 다만 Startup Daily의 "한국에서는"처럼 **요청할 때마다 AI가 생성하는 분석 크레딧**이 "콘텐츠"인지 "기능 잠금 해제"(3.1.1, IAP 의무)인지는 심사관 판단에 달려 있다. **확인 불가 → 고위험** [판단] | – | [판단] |

---

## 2. Google Play

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 현행 수수료 (한국, 새 체계 도입 전) | 15% 등급 개발자는 연 첫 100만 달러까지 15%, 초과분 30%. **구독 15%**. Play Media Experience Program 등 프로그램 대상은 "15% 이하" | 2026-10-28 접근 | [A5] [사실] |
| 한국 대체 결제 (User Choice Billing) | 이용자가 대체 결제를 고르면 서비스 수수료가 **4%p 감면**된다(예: 15% → 11%). PCI DSS 인증, 대체 결제 API 연동, **24시간 안 거래 보고**가 필요하다. 2023-08-02부터 API 사용이 의무다 | 2026-10-28 접근 | [A9] [사실] |
| 신규 체계 (2026 발표) | 서비스 수수료와 결제 수수료를 분리한다. **연 첫 100만 달러는 결제 방식과 관계없이 10%**, **자동 갱신 구독은 10%**. **Google Play 결제를 쓰면 결제 수수료 5%가 추가**되고, 개발자 자체 결제나 외부 웹 링크에는 결제 수수료가 없다. "결제 선택 프로그램"으로 자체 결제 병행, 웹 링크 유도, 자체 선택 화면이 허용된다 | 2026-06-24 공식 발표 | [A6] [사실] |
| 신규 체계 한국 적용일 | 국내 보도는 **"한국·일본은 2026-12-31까지"**로 전한다. Google 도움말에는 일본만 2026-09-30으로 적혀 있고 한국 날짜가 없다. 공식 한국 시행일은 **확인 불가** | 2026-03-24 발표 / 2026-08-11 국내 발표 | [A7][A8][A5] [2차/사실] |
| 신규 체계 한국 세부 | 첫 100만 달러까지 10%, 구독 10%, Google Play 결제 시 5% 추가, 외부 링크에는 결제 수수료 없음. 외부 링크에는 자녀 보호와 PCI-DSS 준수 등 안전 기준이 붙는다 | 2026-08-11 | [A8] [2차] |
| 규제 평가 | 방미통위는 구글 인하안을 "자진 시정으로 보기 어렵다"는 입장이다. 업계에서는 "대부분 20% + 5% = 25%를 적용받을 것"이라는 비판이 있다(게임·비구독 기준) | 2026-08-12 | [A10][A28] [2차] |
| 미국 Epic 합의 | 2026-03 Epic과 합의했고, 2026-07 금지명령 변경 신청을 공동 철회했다 | 2026-06-30 분기 | [A29] [사실, Alphabet 10-Q] |

### 2-1. 월 4,900원 구독 1건의 순수취 비교 [추정]

부가세 제외 금액은 4,455원이다. PG 3.4%는 4,900원 기준 약 167원으로 잡는다.

| 경로 | 수수료 | 순수취(원) | 비율 |
|---|---|---|---|
| Apple IAP, SBP 가입 | 15% | 약 3,786 | 77% |
| Apple IAP, 표준 첫해 | 30% | 약 3,118 | 64% |
| Apple 한국 외부 결제 | 26% + PG | 약 3,130 | 64% |
| Google 현행 구독 | 15% | 약 3,786 | 77% |
| Google 현행 대체 결제 | 11% + PG | 약 3,798 | 78% |
| Google 신규, Play 결제 | 10% + 5% | 약 3,786 | 77% |
| Google 신규, 자체 결제·웹 링크 | 10% + PG | 약 3,843 | 78% |
| 웹 직접 결제 (토스) | PG만 | 약 4,288 | 88% |

웹 직접 결제에는 고정비(가입비 22만 원, 연관리비 11만 원)[07 M19]가 따로 든다.

**해석 [판단]:** 소규모 개발자에게 **스토어 결제끼리의 차이는 1%p 안팎**이다. 의미 있는 차이는 **"스토어 결제(77%)"와 "웹 결제(88%)" 사이**뿐이다. 그런데 iOS에서는 한국 사용자를 웹 결제로 안내할 수 없다(Reader 링크 예외 제외). 그래서 **iOS에서 결제를 받을 거라면 SBP + IAP가 가장 합리적**이다. 한국 26% 외부 결제는 쓸 이유가 없다.

---

## 3. PWA를 앱으로 내는 방법과 심사 리스크

### 3-1. 포장 방식

| 방식 | 대상 | 요구사항·특징 | 기준 시점 | 출처 |
|---|---|---|---|---|
| **TWA (Bubblewrap)** | Android | 기존 PWA를 Chrome 기반 Trusted Web Activity로 띄우는 Android 프로젝트를 만들어 준다. **Digital Asset Links로 사이트 소유를 증명**해야 하고, Play 앱 서명 키의 지문을 `assetlinks.json`에 넣어야 한다. 검증에 실패하면 주소창이 보이는 Custom Tab으로 떨어진다. WebView와 달리 **웹 푸시와 백그라운드 동기화를 쓸 수 있다** | 2026-10-28 접근 | [A19][A20] [사실] |
| **Capacitor** | iOS·Android | 웹 앱을 네이티브 셸에 넣고 플러그인으로 네이티브 API(푸시, 공유, 파일 등)에 접근한다. Capacitor 8은 2025-12-08에 나왔다(iOS 신규 프로젝트는 SPM 기본, Xcode 26 이상). 위젯(WidgetKit)은 **Swift로 별도 작성**해야 한다[판단] | 2025-12 | [A41] [2차] |
| iOS 홈 화면 PWA (앱 없이) | iOS 16.4+ | 홈 화면에 추가한 웹 앱도 **Web Push와 배지**를 쓸 수 있다. 권한 요청은 사용자 동작(탭)에 대한 응답으로만 가능하다 | 2023-02 | [A34] [사실] |

### 3-2. Apple 4.2 최소 기능

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 가이드라인 원문 요지 | 4.2: "재포장한 웹사이트를 넘어서는 기능·콘텐츠·UI"가 필요하다. 4.2.2: 웹 클리핑, **콘텐츠 애그리게이터**, 링크 모음이 주가 되면 안 된다 | 2026-10-28 접근 | [A12] [사실] |
| 반려 사례 (2026-01) | Capacitor 앱에 Core Location, Swift 커스텀 플러그인, 클립보드, 공유 시트, 지도 딥링크를 넣었는데도 "웹 브라우징과 충분히 다르지 않다"는 이유로 **4.2 재반려**. 포럼 답변은 핵심 흐름(폼, 저장, 기록)을 네이티브로 만들고 App Review Notes에 기능을 평이하게 설명하라고 조언했다. 최종 결과는 확인 불가 | 2026-01 | [A21] [사실(포럼)] |
| 푸시만으로는 약함 | Ionic 포럼에서는 "알림만으로는 최소 기능 근거가 빈약하다"는 의견이 나왔다. 오프라인 다운로드를 넣고도 4.2.2로 반려된 사례도 있다 | 2020~ | [A42] [2차] |
| 통과에 필요한 것 | 공식적으로 정해진 체크리스트는 **확인 불가**. 실무 권고 [2차/판단]: ① 네이티브 푸시(APNs)와 알림 설정 화면 ② **홈 화면 위젯**("오늘의 스타트업 4곳") ③ **오프라인 저장·읽기**(비행기 모드에서 브라우저 오류 화면이 뜨면 안 된다) ④ 네이티브 탭바와 내비게이션 ⑤ 공유 시트와 Spotlight 연동 ⑥ 리뷰 노트에 "웹에 없는 앱 전용 기능" 목록 명시 | – | [A21][A42] [2차/판단] |
| Google Play | TWA 품질 기준이나 Play 정책을 지키지 못하면 거부되거나 내려갈 수 있다. 초기 가이드는 Lighthouse 성능 80점 이상을 언급했다(2019, 오래된 정보) | 2019 | [A20] [2차] |

### 3-3. 개발자 계정 비용과 신원 노출

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| Apple 비용 | **연 99 USD**. 지역에 따라 현지 통화로 표시된다(원화 금액은 확인 불가) | 2026-10-28 접근 | [A13] [사실] |
| Apple 개인 등록 시 이름 | 법적 실명이 필요하고, "**앱의 판매자 이름으로 App Store에 표시된다**." 별명이나 회사명을 쓰면 승인이 늦어진다 | 2026-10-28 접근 | [A13] [사실] |
| Apple 한국 판매자 정보 | 전자상거래소비자보호법에 따라 Apple이 신원 정보를 수집·확인해 제품 페이지에 표시한다. **개인: 이메일 + 사업자등록번호(BRN)**. 조직은 여기에 회사명과 전화번호가 더해진다. 유료 앱 계약을 맺으면 한국 세금 양식의 BRN이 **자동으로 표시**된다. 실제 롱블랙 페이지에는 "제공자 (주)타임앤코 / 사업자 등록번호 … Apple에서 확인한 정보가 아닙니다"가 보인다 | 2026-10-28 접근 | [A14][A30] [사실] |
| 한국 개인의 유료 계약 | 2026-06 포럼: 한국 개인 계정으로 구독(RevenueCat 연동)을 준비하던 개발자의 유료 앱 계약이 "Pending User Info"에서 멈췄다. Apple이 **BRN이나 국세청 고유번호**를 요구했다. 답변은 없다. 즉 **사업자등록 없이 한국 개인이 유료 판매를 할 수 있는지는 확인 불가**이고, 실무상 사업자등록이 사실상 필요해 보인다 [판단] | 2026-06 | [A15] [사실(포럼)] |
| Google 비용 | 정식 배포 계정 **25 USD**(1회). 2026-09부터 일부 국가에서 Android 개발자 신원 확인 의무화가 시작됐다(한국 시행 시점은 확인 불가) | 2026 | [A39] [사실] |
| Google 공개 정보 | 개발자 이름과 스토어 연락처(이메일 필수)는 공개된다. **유료 앱이나 인앱 판매를 하는 계정은 Google 결제 프로필의 전체 주소를 Google Play에 공개해야 한다** | 2026-10-28 접근 | [A17] [사실] |
| Google 신규 개인 계정 테스트 | 2023-11-13 이후 만든 개인 계정은 **테스터 12명 이상이 14일 연속 참여**하는 비공개 테스트를 마쳐야 프로덕션 접근을 신청할 수 있다. 조직 계정이 면제되는지는 공식 페이지에서 **확인 불가**(2차 자료는 면제라고 함) | 2026-10-28 접근 | [A18] [사실] |
| 통신판매업 | 직전 연도 거래 50회 미만 등 면제 기준이 있다. 다만 인앱 결제는 건수가 빨리 쌓인다. 면제되더라도 사업자 정보 표시 등 소비자보호 의무는 그대로 남는다 | – | [A43] [2차, 공정위 고시 원문 확인 필요] |

---

## 4. 구독 관리 도구 (RevenueCat 등)

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| RevenueCat 요금 | 월 추적 매출(MTR) **2,500 USD까지 무료**. 넘으면 **추적 매출 전체의 1%**(문서 예시: 2,600 USD → 26 USD). 모든 기능이 포함된다 | 2026-10-28 접근 | [A44][A45] [사실] |
| RevenueCat Web | 웹 결제에 별도 RevenueCat 수수료는 없다. 결제 엔진은 ① RevenueCat Web Billing(게이트웨이는 Stripe) ② Stripe Billing ③ **Paddle Billing**(Paddle이 판매자) 중에서 고른다. 결제사 수수료는 따로 든다 | 2026-10-28 접근 | [A46] [사실] |
| 한국 개인의 제약 | **Stripe는 한국 사업자를 지원하지 않는다**[07 M21]. 따라서 ①②는 쓸 수 없고 ③ Paddle만 남는다. Paddle은 원화 소액 결제의 고정비가 커서 07 문서에서 비추천했다 | – | [07 M21] [판단] |
| 토스·포트원 결제를 권한에 묶는 법 | RevenueCat **REST API v1의 프로모션 엔타이틀먼트 부여**(`POST /subscribers/{id}/entitlements/{id}/promotional`)로 웹 결제 웹훅을 받아 권한을 주면 된다. 다만 **매출은 기록되지 않고 권한만 부여된다**. 외부 결제 기록 API는 2024-11 "개발 중"이라는 언급뿐이고 출시는 확인 불가 | 2024-12 / 2025-07 | [A47] [사실(포럼·문서)] |
| 하나의 권한 모델 | 웹 로그인 ID를 RevenueCat `app_user_id`로 쓰면 iOS·Android·웹 구매가 같은 권한(entitlement)으로 합쳐진다[2차][A46]. 세부 ID 매칭 문서는 이번 조사에서 확인하지 못했다 | – | [A46] [2차] |
| 대안 | **Adapty**: 월 매출 5,000 USD 미만 무료, 초과분 1%(2026-02 개편). **Qonversion**: 무료 한도 1만 USD 또는 7천 USD로 자료가 엇갈려 확인 불가 | 2026-02 | [A48] [사실/2차] |

---

## 5. 한국 뉴스·지식 구독 앱의 결제 방식

조사 방법: 2026-10-28에 App Store 한국 페이지 HTML과 Google Play 페이지를 직접 받아 "앱 내 구입" 표시와 품목을 확인했다.

| 서비스 | iOS 앱 결제 | Android 앱 결제 | 웹 가격 | 앱·웹 가격 차이 | 출처 |
|---|---|---|---|---|---|
| **롱블랙** | **앱 내 구입 표시 없음**(무료). 뉴스 카테고리 무료 차트 **#5**, 평가 173개. 앱은 노트 읽기와 요일·시간별 알림 중심이다 | **인앱 구매 표시 없음**, 다운로드 **1만+** | 월 5,900원[07 M1] | 앱에서는 팔지 않는다(웹 결제 후 로그인) [사실/판단] | [A30][A33] |
| **퍼블리** (뉴닉 운영) | **앱 내 구입 표시 없음**(무료). 비즈니스 카테고리, 평가 3.1 | 확인 불가(패키지명을 찾지 못함) | 연 154,800원 정가[07 M4] | 앱에서는 팔지 않는다 [사실/판단] | [A31] |
| **뉴닉** | **앱 내 구입 있음.** 경제 기본기 3종 패키지 ₩37,000, 인문학 ₩17,000, 생활재테크 ₩12,000, 주식 ₩12,000, 경제 ₩17,000, 정치 ₩15,000, 부동산 ₩19,000. 뉴스 카테고리 **#6**, 평가 886개 | 확인 불가 | 웹 판매가는 확인 불가 | 확인 불가 | [A32] |
| **리멤버** (나우 포함) | 메인 앱에 **앱 내 구입 표시 없음**. 비즈니스 #20, 평가 8.5만 개 | 확인 불가 | 리멤버 나우 유료 상품·가격은 확인 불가 | 확인 불가 | [A30a] |
| **아웃스탠딩** | 확인 불가 | 확인 불가 | 확인 불가(사이트 접근은 됐지만 가격표를 특정하지 못함) | 확인 불가 | – |
| 참고: 멜론·유튜브 | 인앱 수수료 인상기에 **웹 결제를 더 싸게 안내**한 사례가 있다(2022) | – | – | 웹이 더 쌈 | [A40][A49] [2차] |

**패턴 [판단]:** 국내 지식 구독의 대표 사례(롱블랙, 퍼블리)는 **"앱 = 읽기와 알림 전용, 결제 = 웹"**이라는 Reader 앱 모델을 쓴다. 단건 지식 상품을 파는 뉴닉은 IAP를 쓴다. 롱블랙과 퍼블리가 External Link 엔타이틀먼트를 받았는지는 확인 불가다(페이지에 링크 여부가 표시되지 않는다).

### 5-1. 전환율·리텐션 공개치

| 지표 | 값 | 성격 | 출처 |
|---|---|---|---|
| 한국 온라인 뉴스 유료 지불 경험 | **19%**(2025, 전년 대비 +4%p). 뉴스 신뢰도 31% | [사실] | [A37] |
| 국내 앱 유료 구독 전환율·해지율 | **확인 불가**(밀리의서재 등도 공개하지 않음). 밀리의서재 2025년 매출 882억 원, 영업이익 144억 원(보도) | [2차] | [A50] |
| 롱블랙 월 재결제율 | 87%(2023 상반기)[07 M1] | [사실] | 07 |
| 하드 페이월 vs 프리미엄, 35일 차 전환(글로벌) | **10.7% vs 2.1%**. 60일 차 설치당 매출 3.09 vs 0.38 USD | [사실, RevenueCat 2026] | [A38] |
| 무료체험 길이별 체험→유료 전환 | 17~32일 체험 42.5%, 4일 미만 25.5% | [사실] | [A38] |
| 연간 구독 1년 차 해지 | 약 72%(2026), 2025년에는 약 56%. Google Play는 해지의 **31%가 결제 실패**로 인한 비자발적 해지(App Store는 14%) | [사실] | [A38] |
| 뉴스·매거진 카테고리 전환율 | 확인 불가(RevenueCat 공개 요약에 카테고리 수치 없음) | – | [A38] |

---

## 6. 앱 광고 (AdMob 등)

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 한국 eCPM, 전면 광고 | 약 **17.8 USD**(전 네트워크 평균, 게임 중심 데이터) | 2024 Q2 | [A51] [2차, Tenjin] |
| 한국 eCPM, 보상형 | 약 **21~22 USD** | 2024 Q2 | [A51] [2차] |
| 한국 eCPM, 배너 | iOS 약 **0.85 USD**, Android 약 **1.17 USD** | 2024 Q1 | [A51] [2차] |
| 국내 개발자 자가 보고 | 전면 약 10 USD, 배너 약 1 USD. 한국 트래픽 비중이 높으면 eCPM이 낮다는 고민 글 | 2025~2026 | [A52] [2차] |
| AdMob 단독, 2025 한국 수치 | **확인 불가** | – | – |
| 뉴스·매거진 적합성 | 보상형과 전면 광고는 게임 지표라 읽기 앱과는 맞지 않는다. 뉴스 앱은 배너·네이티브가 현실적이고, **eCPM이 가장 낮은 형식**이다 [판단] | – | [판단] |
| Startup Daily 적용 [추정] | DAU 100명 × 하루 5회 노출 × 배너 1 USD/1000회 = 하루 0.5 USD, **월 약 2만 원**. DAU 1,000명이어도 월 약 20만 원 | – | [추정] |

---

## 7. 푸시 알림과 리텐션

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 푸시 동의율 중앙값(전 업종) | **iOS 48.85%, Android 53.3%**(2025). Android는 13부터 런타임 권한이 생겨 2023년 71.3%에서 떨어졌다 | 2025 데이터 / 2026 발행 | [A35] [사실, Airship] |
| 뉴스 앱 동의율 | **iOS 29.8%, Android 36.7%** | 2024-09 | [A36] [사실, OneSignal] |
| 뉴스 앱 리텐션 | **1일 26.7%, 7일 15.8%, 30일 7.6%** | 2024-09 | [A36] [사실, OneSignal] |
| 다른 출처의 뉴스 30일 리텐션 | 9%(Sonar), 11.3%(Growth-onomics) | 2025 | [A53] [2차] |
| 푸시와 리텐션의 관계 | 주 1~3회 푸시를 받는 사용자는 0회인 사용자보다 90일 리텐션이 **34% 높다**(Braze 2024, 2차 인용). Pugpig는 "첫 90일에 푸시 1회만 보내도 리텐션 +147%"라고 주장한다(벤더 주장, 방법론 미공개) | 2024~ | [A53][A54] [2차] |
| 뉴스 앱의 피로 | 뉴스 앱 사용자는 하루 1회 이상 알림을 기대하지만, **알림 해제율도 다른 업종보다 높다** | – | [A54] [2차] |
| 동의 사용자 효과 | 한 항공사에서 동의 사용자의 30일 활성화율이 2.9배 높았다(단일 브랜드 사례) | 2026 | [A35] [사실, 사례] |

---

## 8. 앱스토어 출시가 국내 유입에 주는 효과

| 항목 | 내용 | 기준 시점 | 출처 |
|---|---|---|---|
| 검색 비중 | Apple: "**다운로드의 약 65%가 검색 직후** 일어난다." Apple 자체 수치이고 독립 검증은 없다 | 2016~2025-12 | [A55] [사실(자사 주장)] |
| 검색 광고 | Apple Ads(검색 광고)는 **2018-08부터 한국에서** 쓸 수 있다. 2026부터 검색 결과 하단에도 광고를 추가한다고 발표했다 | 2018 / 2025-12 | [A56][A55] [2차] |
| 피처드 신청 | App Store Connect의 "**Featuring Nominations**"(2024-11 도입)로 신규 출시, 업데이트, 인앱 이벤트를 편집팀에 추천할 수 있다. 선정은 보장되지 않는다 | 2024-11~ | [A57] [사실] |
| 한국 뉴스 카테고리 경쟁 강도 | 2026-10-28 기준 롱블랙 무료 뉴스 **#5**(평가 173개, Android 다운로드 1만+), 뉴닉 **#6**(평가 886개). 상위권 앱의 평가 수와 다운로드 규모가 작다 → **뉴스 카테고리 순위 진입 문턱이 낮을 수 있다** [판단]. 순위에 필요한 일 다운로드 수는 **확인 불가** | 2026-10-28 | [A30][A32][A33] |
| PWA vs 스토어 | PWA는 스토어 검색에 노출되지 않는다. iOS PWA 설치는 공유 메뉴를 거쳐야 해서 설치율이 Android의 30~50%라는 벤더 주장이 있다 | 2026 | [A58] [2차] |
| 출시 자체의 유입 효과(신규 앱 부스트) | 정량 자료 **확인 불가** | – | – |

---

## 9. Startup Daily 앱 수익화 시사점 [판단]

### 9-1. 결론 한 줄

**지금 단계에서 앱은 "수익 채널"이 아니라 "리텐션(푸시·위젯)과 검색 노출 채널"이다.** 독자가 0명이면 어떤 결제 구조든 매출은 0에 가깝다. 앱 출시는 **푸시로 매일 돌아오게 만들고, 뉴스 카테고리 검색과 순위로 유입을 받는 것**을 목표로 설계한다. 결제는 그 뒤에 붙인다.

### 9-2. 추천 순서

| 단계 | 할 일 | 비용 | 왜 |
|---|---|---|---|
| 0 | **지금 PWA에 웹 푸시를 붙인다**(Android Chrome, iOS 16.4+ 홈 화면 앱). 현재 `public/sw.js`는 있지만 푸시는 없다 | 0원 | 앱 없이도 "푸시가 리텐션을 올리는지"를 먼저 검증할 수 있다. iOS PWA 푸시는 홈 화면에 추가해야 해서 도달 범위가 작다. 이것이 앱을 낼 근거가 된다 |
| 1 | **Android TWA(Bubblewrap)로 Play 출시** | 25 USD | 가장 싸고 빠르다. 4.2 같은 심사 리스크가 작다. 다만 **개인 계정이면 테스터 12명 × 14일** 요건이 독자 0명 운영자에게 실제 장벽이다. 지인이나 커뮤니티로 미리 모아야 한다 |
| 2 | **iOS Capacitor 앱 + 네이티브 기능 3종**(APNs 푸시와 알림 시간 설정, WidgetKit "오늘의 4곳" 위젯, 오프라인 저장 읽기) | 연 99 USD + Swift 위젯 개발 | 순수 웹 래퍼는 반려 확률이 높다(2026-01 사례). 위젯과 오프라인은 "웹에 없는 앱 전용 가치"로 리뷰 노트에 명시한다 |
| 3 | 결제 (아래 9-3) | 사업자등록 | 푸시 동의 사용자 기준으로 DAU가 쌓인 뒤 |

### 9-3. 결제 설계 선택지

| 안 | 구조 | 장점 | 위험 |
|---|---|---|---|
| **A. Reader 모델** (롱블랙·퍼블리 방식) | iOS 앱에서는 결제를 팔지 않는다. 웹(토스·포트원)에서 결제하고 앱에서는 로그인만 한다 | 수수료가 PG 3.4%뿐이다(순수취 88%). 웹과 앱의 가격이 같다 | 앱 안에서 전환이 일어나지 않는다. **"한국에서는" AI 분석 크레딧은 "콘텐츠"가 아니라 "기능 잠금 해제"로 보일 수 있어 3.1.1(IAP 의무) 위반으로 반려될 위험이 있다.** 링크 엔타이틀먼트를 받아도 가격 문구는 금지된다 |
| **B. IAP + SBP 15%** (권장) | 구독과 크레딧(소모성 IAP)을 앱에서 판다. 웹은 토스로 판다. 권한은 RevenueCat으로 묶는다(앱은 SDK, 웹은 결제 웹훅에서 프로모션 엔타이틀먼트 API 호출) | 심사가 가장 안전하다. 순수취 77%로, 웹 88%와 큰 차이가 없다. MTR 2,500 USD(약 350만 원)까지 RevenueCat 무료 | 웹 결제 매출은 RevenueCat 지표에 잡히지 않는다(권한만 부여). **앱 가격과 웹 가격을 같게 두는 것**을 권한다. 차이 11%p를 소비자에게 전가하지 않는다 |
| C. 한국 외부 결제 26% | – | – | **쓰지 않는다.** 수수료 26%에 PG가 더 붙어 SBP보다 손해이고, 별도 바이너리와 월별 신고 부담도 있다 |
| D. 광고(AdMob) | – | – | **쓰지 않는다.** DAU 1,000명이어도 월 약 20만 원이다. "깊이 있는 매거진"이라는 신뢰를 훼손한다 |

- Google Play는 한국에 새 체계가 적용되면(2026-12-31 예정 보도) **구독 10% + 자체 결제**로 수수료를 더 낮출 여지가 있다. 다만 PCI-DSS 같은 안전 기준을 맞춰야 하므로 초기에는 Play 결제(10% + 5%)가 단순하다.
- 방미통위 시정명령에 **안티스티어링 의무**가 들어가면, iOS에서도 웹 결제 안내가 가능해져 A안과 B안의 장점을 함께 얻을 수 있다. **2026-10-28 의결 결과를 확인한 뒤** iOS 결제 문구를 확정한다.

### 9-4. 등록 요건에 대한 판단

- **유료 판매 전에 사업자등록(간이과세자 가능성 검토)을 한다.** Apple 한국 개인 계정은 유료 계약에 BRN을 요구한다. 등록하지 않고 진행할 수 있는지는 확인되지 않았다.
- **집 주소가 공개되지 않게 한다.** Google 유료 판매 계정은 결제 프로필 주소를 공개한다. 사업장 주소를 비상주 사무실 같은 곳으로 두는 방안을 세무사와 검토한다.
- Apple 개인 등록은 **실명이 판매자명으로 노출**된다. 브랜드명으로 노출하려면 법인 + D-U-N-S 번호가 필요하다. 1인 운영 초기에는 실명 노출을 감수하는 편이 현실적이다.
- 무료 앱만 출시할 때는 유료 계약과 BRN 없이도 진행할 수 있어 보인다. Apple 도움말이 "유료 계약 시 BRN 자동 표시"라고만 하기 때문이다(확정은 아님). **1~2단계는 무료 앱으로 먼저** 낸다.

### 9-5. 하지 말 것

- 순수 웹뷰 래퍼로 iOS에 제출하지 않는다(4.2 반려).
- 앱 안에서 "웹에서 사면 더 싸요"라고 안내하지 않는다. 한국 스토어에서는 3.1.3 위반이다.
- 앱 가격을 웹보다 비싸게 매기지 않는다. 1인 매체에서 가격 차이는 신뢰 비용이 수익보다 크다.
- 하루 2회 이상 푸시를 보내지 않는다. 뉴스 앱은 알림 해제율이 높다. 매일 1회 "오늘의 4곳"으로 고정한다.

### 9-6. 열린 질문

- 2026-10-28 방미통위 의결 결과(안티스티어링 포함 여부, 애플 시정 내용).
- Google 신규 수수료 체계의 한국 공식 시행일(도움말에 한국 날짜가 없다).
- Apple 한국 외부 결제 26%에 SBP 감면이 있는지, Reader 링크 경유 결제의 Apple 수수료.
- Google 조직 계정의 12명 테스트 면제 여부, Android 개발자 신원 확인의 한국 시행일.
- 국내 App Store 뉴스 카테고리 Top 10에 필요한 일 다운로드 수(Sensor Tower, AppTweak 같은 유료 도구 필요).

---

## 10. 출처 (접근일 2026-10-28)

- [A1] Apple, App Store Small Business Program — https://developer.apple.com/app-store/small-business-program/
- [A2] Apple, Auto-renewable Subscriptions — https://developer.apple.com/app-store/subscriptions/
- [A3] Apple, Distributing apps using a third-party payment provider in South Korea — https://developer.apple.com/support/storekit-external-entitlement-kr/
- [A4] = [A12] 3.1.1(a), 3.1.3
- [A5] Google Play Console Help, Service fees — https://support.google.com/googleplay/android-developer/answer/112622?hl=en
- [A6] Android Developers Blog(한국어), Expanded billing choice and lower fees on Google Play (2026-06-24) — https://developer.android.com/blog/posts/expanded-billing-choice-and-lower-fees-on-google-play?hl=ko
- [A7] 아이티데일리, 구글플레이 인앱 결제 수수료 인하…방미통위 "빠른 적용 촉구" (2026-04) — https://www.itdaily.kr/news/articleView.html?idxno=238727
- [A8] 디지털데일리, 구글 플레이, 결제 선택권 확대·수수료 인하 (2026-08-11) — https://www.ddaily.co.kr/page/view/2026081116525803692
- [A9] Google Play Console Help, Alternative billing for users in South Korea — https://support.google.com/googleplay/android-developer/answer/11222040
- [A10] 뉴데일리, 방미통위 28일 구글·애플 '인앱결제 강제' 제재 심의 (2026-10-27) — https://biz.newdaily.co.kr/site/data/html/2026/10/27/2026102700333.html
- [A11] 시사저널, 구글·애플 '결제 강제' 과징금 637억원 윤곽…시정명령 이견 — https://www.sisajournal.com/news/articleView.html?idxno=391835
- [A12] Apple, App Store Review Guidelines (3.1.1, 3.1.1(a), 3.1.3, 3.1.3(a), 4.2, 4.2.2) — https://developer.apple.com/app-store/review/guidelines/
- [A13] Apple, Enrollment (99 USD, 개인 실명 판매자 표시) — https://developer.apple.com/programs/enroll/
- [A14] App Store Connect Help, Manage Korea compliance information — https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-korea-compliance-information
- [A15] Apple Developer Forums, Korean Individual Developer - Paid Apps Agreement requires BRN (2026-06) — https://developer.apple.com/forums/thread/829386
- [A16] Apple, Distributing "reader" apps with a link to your website — https://developer.apple.com/support/reader-apps
- [A17] Google Play Console Help, developer account information (유료 판매 계정 주소 공개) — https://support.google.com/googleplay/android-developer/answer/13634081?hl=en
- [A18] Google Play Console Help, App testing requirements for new personal developer accounts — https://support.google.com/googleplay/android-developer/answer/14151465
- [A19] Bubblewrap CLI (npm) — https://npmjs.com/package/@bubblewrap/cli
- [A20] Chrome for Developers, Trusted Web Activity Quick start / Android concepts — https://developer.chrome.com/docs/android/trusted-web-activity/quick-start , https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs
- [A21] Apple Developer Forums, Capacitor 앱 4.2 재반려 스레드 (2026-01) — https://developer.apple.com/forums/thread/812889
- [A22] Justia, Epic Games v. Apple, No. 25-2935 (9th Cir. 2025-12-11) — https://law.justia.com/cases/federal/appellate-courts/ca9/25-2935/25-2935-2025-12-11.html
- [A23] Fenwick, Ninth Circuit Largely Upholds Ruling in Epic v. Apple — https://www.fenwick.com/insights/publications/ninth-circuit-largely-upholds-ruling-in-epic-v-apple
- [A24] IPWatchdog, High Court Grants Cert in Apple's Challenge (2026-06-30) — https://ipwatchdog.com/2026/06/30/high-court-grants-cert-in-apples-challenge-to-ninth-circuit-contempt-ruling-in-app-store-dispute/
- [A25] U.S. Supreme Court, No. 25-1311 Apple merits brief (2026-09-14) — https://www.supremecourt.gov/DocketPDF/25/25-1311/424150/20260914154510009_2026-09-14%20No.%2025-1311%20Apple-Epic%20Merits%20Opening%20Brief.pdf
- [A26] 9to5Mac, Japan tech groups say Apple's new payment rules are not viable (2026-02-10) — https://9to5mac.com/2026/02/10/japan-tech-groups-say-apples-new-payment-rules-are-not-a-viable-option-for-developers/
- [A27] Notebookcheck, Epic CEO slams Apple's junk fees (Japan) — https://www.notebookcheck.net/Epic-CEO-slams-Apple-s-junk-fees-as-Fortnite-stays-off-iOS-in-Japan-despite-new-App-Store-rules.1189456.0.html
- [A28] 네이트뉴스(원문 언론사 기사), 방미통위 "구글 수수료 10% 인하, 자진시정으로 보기 어려워" (2026-08-12) — https://m.news.nate.com/view/20260812n32363 / 업계 25% 비판: https://www.inews24.com/view/1945833
- [A29] Alphabet Form 10-Q (2026-06-30 분기) — https://www.sec.gov/Archives/edgar/data/0001652044/000165204426000071/goog-20260630.htm
- [A30] App Store(한국), 롱블랙 LongBlack — https://apps.apple.com/kr/app/longblack/id6450910866 (2026-10-28 HTML 직접 확인: 무료, 앱 내 구입 표시 없음, 뉴스 #5, 평가 173개, 제공자·사업자등록번호 표시)
- [A30a] App Store(한국), 리멤버 — https://apps.apple.com/KR/app/id840553277 (2026-10-28: 앱 내 구입 표시 없음, 비즈니스 #20)
- [A31] App Store(한국), 퍼블리 - 커리어 멤버십 — https://apps.apple.com/kr/app/id1440756899 (2026-10-28: 앱 내 구입 표시 없음, 평가 3.1)
- [A32] App Store(한국), 뉴닉 - 가장 쉬운 뉴스 브리핑 — https://apps.apple.com/kr/app/id1549450444 (2026-10-28: 앱 내 구입 7품목 ₩12,000~37,000, 뉴스 #6)
- [A33] Google Play(한국), 롱블랙 — https://play.google.com/store/apps/details?id=co.timenco.longblack&hl=ko&gl=KR (2026-10-28: 다운로드 1만+, 인앱 구매 표시 없음)
- [A34] WebKit, Web Push for Web Apps on iOS and iPadOS (2023-02) — https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- [A35] Airship, Mobile App Push Notification Benchmarks for 2026 (2025 데이터) — https://www.airship.com/mobile-app-push-notification-benchmarks-for-2026/
- [A36] OneSignal, Mobile app benchmarks 2024 (2024-09-17) — https://onesignal.com/mobile-app-benchmarks-2024
- [A37] Reuters Institute, Digital News Report 2025 South Korea — https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/south-korea
- [A38] RevenueCat, Subscription app trends & benchmarks 2026 (2026-03-19) — https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026
- [A39] Google, Understanding Android developer verification — https://support.google.com/android-developer-console/answer/16561738?hl=en
- [A40] MTN, 애플 인앱결제 10월부터 1200원→1500원 인상 (2022-09-20) — https://news.mtn.co.kr/news-detail/2022092015124330029
- [A41] Ionic, Announcing Capacitor 8 (2025-12-08, 요약 페이지) — https://www.plushcap.com/content/ionic/blog/ionic-announcing-capacitor-8
- [A42] Ionic Forum, Apple §4.2 Minimum Functionality — https://forum.ionicframework.com/t/apple-4-2-minimum-functionality/189688 / Apple Forums 4.2.2 오프라인 사례 — https://developer.apple.com/forums/thread/126359
- [A43] 토스페이먼츠, 통신판매업신고 방법 2025 — https://www.tosspayments.com/blog/articles/sales-registration?from=category / 인프런 Q&A — https://www.inflearn.com/community/questions/1553958
- [A44] RevenueCat, Pricing — https://www.revenuecat.com/pricing/
- [A45] RevenueCat Docs, Account management (1% 계산 예시) — https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management
- [A46] RevenueCat Docs, Getting Started With RevenueCat Web / Web Billing — https://www.revenuecat.com/docs/web/overview , https://www.revenuecat.com/partners/technology/partner/paddle
- [A47] RevenueCat API v1 (promotional entitlements) — https://www.revenuecat.com/docs/api-v1 / Community, Custom purchase integration — https://community.revenuecat.com/general-questions-7/custom-purchase-integration-210 / v2 미지원 — https://community.revenuecat.com/third-party-integrations-53/how-to-add-entitlement-to-customer-using-rest-api-v2-6621
- [A48] Adapty, New pricing 2026 — https://adapty.io/blog/adapty-new-pricing-2026/ / Qonversion(2차) — https://agentdeals.dev/vendor/qonversion
- [A49] 데일리안, 웹 결제·원스토어…구글 인앱결제에 소비자 대안 (2022) — https://www.dailian.co.kr/news/view/1120185/
- [A50] 쿠키뉴스 등, 밀리의서재 실적 보도 — https://www.kukinews.com/article/view/kuk202504230064
- [A51] Tenjin 광고 수익화 리포트 요약 (2024 Q1·Q2) — https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile-00b?open=false , https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile
- [A52] 인프런, 리텐션은 좋은데 너무 낮은 ecpm — https://www.inflearn.com/en/community/questions/1756694
- [A53] Sonar, App User Retention Benchmarks — https://trysonar.app/blog/app-user-retention-benchmarks-and-what-moves-it / Growth-onomics — https://growth-onomics.com/mobile-app-retention-benchmarks-by-industry-2025/
- [A54] Pugpig, Push notifications and in-app messaging — https://pugpig.helpjuice.com/en_US/improving-engagement-with-your-app/how-to-maximise-engagement-with-push-notifications-and-in-app-messaging
- [A55] MobileSyrup, Apple more ads App Store 2026 (2025-12-18, "약 65%" 인용) — https://mobilesyrup.com/2025/12/18/apple-more-ads-app-store-2026/
- [A56] TechCrunch, Apple's Search Ads expand to six more markets (2018-07-25) — https://techcrunch.com/2018/07/25/apples-search-ads-expand-to-six-more-markets-in-europe-and-asia
- [A57] App Store Connect Help, Nominate your app for featuring — https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/ / TechCrunch (2024-11-13) — https://techcrunch.com/2024/11/13/apple-now-lets-app-developers-apply-to-be-featured-on-the-app-store
- [A58] Framesixty, PWA vs Native App 2026 (벤더) — https://framesixty.com/pwa-vs-native-app/

### 접근 실패·확인 불가 기록

- 방미통위 2026-10-28 의결 결과: 조사 시점에 발표 전.
- Apple Ads 지원 국가 공식 페이지: 404. 한국 지원 여부는 2018 보도로 대체했다.
- RevenueCat External Payments Integrations 문서: 404.
- 아웃스탠딩 가격, 리멤버 나우 가격, 뉴닉 웹 판매가, 퍼블리 Android 앱: 특정하지 못했다.
- 한국 AdMob 2025 eCPM(AdMob 단독): 공개 자료 없음(AnyMind 리포트는 이메일을 남겨야 받을 수 있다).
- 뉴스·매거진 카테고리 구독 전환율(RevenueCat): 공개 요약에 없음.
