# 07. 수익화 UX 벤치마크: 페이월·가입·스폰서·AI 과금

- 작성: product-benchmarker / 기준일 2026-10-27~28
- 범위: **수익화 관점만** 다룬다. 일반 UX 패턴은 `01_product-benchmarker_patterns.md`, 화면 스펙은 `03_final_spec.md`, 한국 분석 구조는 `06_korea-lens_design.md`에 있다.
- 근거 수준 표기
  - **[관찰]**: 브라우저로 직접 연 화면. 2026-10-27~28, 로그아웃 상태, 데스크톱 폭.
  - **[문서]**: 공식 문서나 보도.
  - **[2차]**: 리뷰·블로그·벤더 글. 수치는 바뀌었을 수 있다.
- 직접 볼 수 없었던 화면(대체 자료를 썼다)
  - Morning Brew, Crunchbase: Cloudflare 봇 확인 화면에 막혔다. 우회하지 않았다.
  - 퍼블리: 2024-06 뉴닉에 멤버십 사업부가 넘어가 현행 화면이 없다.
  - Perplexity, ChatGPT, Gamma: 로그인해야 보이는 화면이라 도움말 문서와 2차 자료로 대신했다.
- Startup Daily 현재 상태(코드 확인)
  - 계정·결제가 없고, 저장은 localStorage에 한다.
  - "한국에서는"은 `/api/korea-lens`가 처음 요청한 사람의 비용으로 생성한다. 결과는 **Vercel 엣지에 30일 캐시**되므로 이후 독자는 비용이 0이다(`api/korea-lens.mjs` 6~8행).
  - 요청 한도는 IP당 10분에 4회다(같은 파일 20행).
  - 생성에는 2~3분이 걸리고, 그동안 경과 초를 보여 준다(`Detail.jsx` `KoreaSection`).

---

## 0. 요약

1. **오늘 호는 잠그지 않는다.** 습관을 만드는 장치이자 공유되는 단위다.
   - 비교한 서비스 중 오늘 콘텐츠를 무료로 열어 두는 곳(롱블랙의 오늘 노트, Stratechery 주간 글, Sifted의 매일 무료 기사)은 모두 이것을 유입 장치로 쓴다.
   - 전부 잠그는 곳은 The Information뿐이다. 연 $399급 B2B 가격이 그 구조를 받쳐 준다.
2. **잠글 곳은 "축적"과 "도구"다.** 매일 쌓이는 아카이브, 탐색 표의 깊은 필터와 내보내기, AI 한국 분석의 후반부가 해당한다.
   - Crunchbase(검색 결과 5개 상한), Exploding Topics(예측·스타트업 리포트는 Pro), Stratechery(분석 업데이트만 유료)가 같은 축으로 잠근다.
3. **첫 벽은 결제가 아니라 무료 가입이어야 한다.** 롱블랙과 Sifted 모두 결제벽 앞에 "무료 가입하면 읽을 수 있어요"라는 등록벽을 둔다.
   - 롱블랙은 버튼 순서를 카카오, 다른 방법(Apple, 이메일 인증번호) 순으로 두고 "3초만에"라고 쓴다.
4. **PWA에서는 매직링크보다 이메일 인증번호(OTP)가 맞다.** 홈 화면 앱으로 실행하면 링크가 Safari나 메일 앱 브라우저에서 열려 세션이 PWA로 돌아오지 않을 수 있다(확인 필요, §2).
   - iOS 웹 푸시는 홈 화면에 추가한 웹앱에서만 동작한다.
5. **스폰서는 한 호에 1칸, 같은 행 형식에 명시적 라벨을 붙인다.**
   - TLDR: 상단에 "Together With", 제목 끝에 "(Sponsor)"를 붙이고, 편집 항목과 같은 포맷으로 쓴다.
   - "Presented by"류의 완곡한 라벨은 광고 인지율이 낮다는 연구가 있다(§4).
6. **AI 분석 과금은 "실행 전에 비용과 잔량을 보여 주고, 실행 중에는 업셀하지 않는" 방식이 낫다.**
   - ChatGPT는 한도에 도달하면 재개 시각과 업그레이드 버튼을 함께 보여 준다.
   - Startup Daily는 이미 캐시된 분석을 열람하는 데 원가가 들지 않으므로, **새로 생성하는 행위만** 한도 대상으로 삼는다.

---

## 1. 페이월 패턴 카탈로그

### 1-1. 잠금 방식(무엇을 잠그나)

| 서비스 | 패턴 | 실제 동작 | 장점 | 단점 | 근거 |
|---|---|---|---|---|---|
| **롱블랙** | 시간 지연(최신 무료 → 과거 잠김) + 무료 등록벽 | 홈 최상단에 "TODAY" 노트를 두고 카운트다운 타이머(00:12:35)와 함께 "오늘 안에 읽으면 라이브러리에 저장할 수 있어요. 이 시간이 지나면 읽을 수 없습니다"라고 쓴다. 그 아래 "공개 예정 노트"를 D-1, D-2, D-3으로 예고한다. 로그아웃 상태에서는 오늘 노트와 지난 노트 모두 도입부 약 1,500자 뒤에서 끊기고 "회원가입만 해도 이 글을 무료로 읽을 수 있어요" 카드가 나온다. 유료 멤버도 놓친 노트는 못 본다(2023 보도). | 손실 회피로 매일 방문을 만든다. 월평균 16회 방문, 2023 상반기 재결제율 87%(보도). 무료 가입이 결제 퍼널의 입구 역할을 한다. | 로그아웃 상태에서는 "오늘은 무료"라는 약속이 보이지 않는다(지난 노트와 같은 벽이 나온다). 가격은 가입한 뒤에야 보인다(`/payment/membership-plan`에 들어가면 `/register`로 이동한다). | [관찰] longblack.co, /note/2157, /note/2149 · [문서] journalist.or.kr no=54421, no=50281 |
| **퍼블리** (2024 뉴닉 인수) | 구독 멤버십 + 연간 할인 | 연 154,800원을 프로모션가 99,000원에 팔았다(2023). 콘텐츠 약 4,000개, 누적 유료 고객 12만 명. 잠금 UI는 현행 화면이 없어 확인하지 못했다. | 아카이브 자체가 상품이다. | 독립 서비스로는 지속하지 못하고 사업부 매각으로 끝났다. | [문서] ditoday ?p=66029, venturesquare 928278 |
| **The Information** | 하드 페이월(전부 잠금) | 기사 페이지에 제목, 기자, 시각, **블러 처리한 대표 이미지**만 남기고 본문은 0자다. 상단에 "Subscribe to read the full article", 중간에 자물쇠와 "Subscribe to unlock", 그 아래 이메일 입력란, "Subscribe now", "Continue with Google or Apple"이 있다. 사이트 최상단 띠배너는 "Save 25% to unlock this story"다. 출시 당시 가격은 연 $399. | 독점 기사라 희소성이 크다. 이메일을 먼저 받아 할인 리타기팅을 할 수 있다. | 공유와 검색 유입이 거의 없다. 일반 독자에게는 벽으로만 보인다. | [관찰] theinformation.com 기사 · [문서] econsultancy, journalism.co.uk |
| **Sifted** | 프리미엄 섹션만 잠금(미터 없음) + 무료 등록벽 | 카드에 "Pro" 배지를 붙인다. Pro 기사에서는 헤드라인, 리드, 첫 1~2문단을 보여 주고 이후 본문은 **글자를 뒤섞은 텍스트**로 렌더링한 뒤, 가운데 모달 "Unlock this story with Sifted Pro" → "Subscribe now", "Explore Pro"를 띄운다. 무료 기사는 "Register for free" 등록벽 뒤에 있고, 뉴스레터는 모두 무료다(2021 런칭 당시 £19/월). | 깊은 분석만 유료라는 구분이 명확하다. 뉴스레터가 무료 유입로가 된다. | 뒤섞인 텍스트는 "뭔가 숨긴다"는 인상을 주고 접근성(스크린리더)에도 나쁘다. | [관찰] sifted.eu, /articles/strawberry-browser-1-0 · [문서] pressgazette ?p=162752 |
| **Stratechery** | 상품 분리(주간 글 무료, 일간 업데이트 유료) | "Weekly Articles are free", 주 3회 Daily Update는 구독자 전용이다. 로그인은 Passport OAuth와 이메일 인증으로 한다. | 무료 글이 자유롭게 공유되어 유료의 광고가 된다. 저자는 이를 "벌이 아니라 추가"로 설명했다. | 무료와 유료가 다른 상품이라 둘 다 꾸준히 써야 한다. | [관찰] stratechery.com/about · [문서] stratechery 2014 free-stratechery-daily-email |
| **Substack** | 글마다 정하는 페이월 라인 | 작성자가 에디터에서 페이월 위치를 정한다(2021 flexible paywall). 무료 독자에게는 이메일로 맞춤 미리보기와 구독 CTA를 보낼 수 있다. 실제 유료 글(Lenny's Newsletter)은 본문 약 13,500자를 보여 준 뒤 "This post is for paid subscribers" → "Subscribe", "Already a paid subscriber? Sign in"을 띄운다. | 미리보기가 길어 가치를 충분히 보여 준다. 글 단위로 조절할 수 있다. | 작성자가 정하는 방식이라 일관성이 없다. | [관찰] lennysnewsletter.com/p/how-to-tell-if-a-startup-has-a-moat · [문서] on.substack.com/p/new-tools-paywall-embeds |
| **Exploding Topics** | 데이터 깊이 잠금 + 체험판 | 무료 사용자도 15년치 차트와 트렌드 목록을 본다. Pro는 기간 필터, 예측, 채널, **스타트업·제품 리포트(펀딩·가격)**, Meta Trends를 더한다. 2차 자료에 따르면 최근 3~6개월 신규 트렌드는 Pro 전용이다. 7일 무료 체험, $39/$99/$249(연간 결제 기준 월액). 홈에는 "No credit card required"를 쓴다. | 무료로도 쓸모가 있어 SEO와 유입을 만든다. 가장 새로운 것이 유료라 업그레이드 동기가 분명하다. | 무료와 유료의 경계가 화면마다 달라 학습 비용이 든다. 공개 화면에서 블러 요소는 확인되지 않았다(0건). | [관찰] explodingtopics.com · [문서] explodingtopics.com/blog/exploding-topics-pro-vs-free (2026-03 갱신) · [2차] unite.ai |
| **Crunchbase** | 결과 수 상한 + 필드 잠금 | 무료는 검색당 결과 5개, Pro와 Business는 1,000개다. 홈, AI 에이전트, 성장 인사이트는 무료에서 "Limited", 알림은 첫 리스트에만 준다. 리뷰에는 "유용한 필터와 데이터 포인트가 잠겨 있다"는 불만이 나온다. | 존재는 보여 주고 양만 제한한다. 무엇이 더 있는지 알게 된다. | 무료 경험이 답답하다(G2 불만). 2025년에 무료 API를 없앴다. | [문서] support.crunchbase.com 360062989313(검색 스니펫) · [2차] G2, enrichlayer |
| **Medium** (참고) | 미터드(월 N편) | 작성자가 고른 글만 미터 대상이다. 비회원도 도입부는 본다. Friend Link로 우회 공유가 가능하다. | 공유를 막지 않는다. | 몇 편이 남았는지 모르면 갑자기 막힌 것처럼 느낀다. | [문서] help.medium.com 360017581433, 360006543813 |

### 1-2. 잠금 표시 UI(어떻게 보여 주나)

| 요소 | 롱블랙 | The Information | Sifted | Substack | 교훈 |
|---|---|---|---|---|---|
| 끊기는 지점 | 도입부 약 1,500자, 첫 챕터 중간 | 본문 0자 | 리드와 1~2문단 | 작성자 지정(관찰 사례는 약 13,500자) | 가치를 보여 줄 만큼은 열어야 한다. 0자는 B2B 가격이어야 버틴다. |
| 끊김 처리 | 흰색 그라데이션 페이드 → 카드 | 블러 이미지 + 점선 구분선 + 자물쇠 | 뒤섞인 텍스트 + 중앙 모달 | 평범한 구분 후 박스 | 페이드 + 인라인 카드가 가장 덜 공격적이다. 모달은 이탈만 부른다. |
| 1차 CTA | "카카오로 무료 계정 만들기"(노란 버튼) | 이메일 입력 + "Subscribe now" | "Subscribe now" | "Subscribe" | 무료 가입을 1차로, 결제를 2차로 둔다. |
| 보조 CTA | "다른 방법으로 무료 계정 만들기", "로그인" | "Continue with Google or Apple" | "Explore Pro", "Back to homepage" | "Already a paid subscriber? Sign in" | 이미 회원인 사람의 출구를 반드시 둔다. |
| 가격 노출 | 숨김(가입 후 공개) | 할인율만("Save 25%") | 모달에는 없음 | 구독 페이지에서 | 벽에는 가격 대신 "무엇을 얻나"를 둔다. 가격은 다음 화면에서 보여 준다. |
| 설득 블록 | 벽 아래에 "1,800개 이상", 분야 칩 15개, 구독자 후기 5개, 다시 CTA | "Join high-powered tech and business leaders" | 가치 문장 1줄 | 없음 | 후기와 분량 같은 사회적 증거는 벽 **아래**에 둔다. |

---

## 2. 가입·결제 플로우 마찰

| 서비스 | 가입 수단 | 관찰 포인트 | 근거 |
|---|---|---|---|
| 롱블랙 | 카카오 → Apple → 이메일(인증번호 받기) | 비밀번호 없이 이메일 **인증번호** 방식이다. 결제 플랜 URL로 바로 가도 가입 화면으로 보낸 뒤 `return_url`로 돌려보낸다. | [관찰] longblack.co/register |
| The Information | 이메일 입력 칸이 기사 페이지 안에 있음 + Google/Apple | 이메일을 받는 일과 결제를 분리한다. 이탈자에게 할인을 보내는 동선이다(추정). | [관찰] |
| Substack | 이메일 로그인 링크(매직링크) 또는 비밀번호. 출판물에 따라 숫자 코드를 받기도 한다. | 링크는 1회용이고 만료된다. 스팸함에 빠지는 문제가 있다. | [문서] faq.substack.com/p/logging-in-to-substack · [2차] substackcourse.com |
| Stratechery | Passport OAuth → 이메일 인증 | 구독 관리를 외부(Passport)에 맡긴다. | [관찰] stratechery.com/about |
| 카카오 로그인(JS SDK) | 카카오톡 앱 인증이 먼저, 없으면 카카오계정으로 | 카카오싱크를 쓰면 동의 화면에서 약관 동의까지 한 번에 받는다. 인앱 브라우저에서는 REST 방식보다 JS SDK Authorize 방식을 권장한다. | [문서] developers.kakao.com/docs/latest/ko/kakaologin · [2차] devtalk.kakao.com/t/topic/136465 |

**PWA와 iOS 제약**

- **앱스토어 규칙은 PWA에 해당하지 않는다.** Startup Daily는 앱스토어 앱이 아니므로 IAP 의무(가이드라인 3.1.1)가 적용되지 않고, 웹 결제(토스페이먼츠 등)를 그대로 쓸 수 있다.
  - 이것은 추론이다. 근거는 가이드라인이 App Store 배포 앱을 대상으로 한다는 점이다.
  - 앱스토어 래퍼로 나갈 경우에는 미국 스토어만 2025-04-30 판결 이후 외부 결제 링크가 허용됐고, 다른 나라 스토어는 여전히 제한된다.
- **iOS 웹 푸시는 홈 화면에 추가한 웹앱에서만** 권한을 요청할 수 있다. 권한 요청은 사용자의 탭으로 시작해야 한다(iOS 16.4+). 따라서 "새 호 알림"은 설치한 독자에게만 줄 수 있는 리텐션 장치다.
- **매직링크의 함정(확인 필요):** iOS 홈 화면 PWA는 Safari와 저장소를 따로 쓰는 것으로 알려져 있다. 메일 앱에서 링크를 누르면 Safari에서 로그인되고 PWA는 로그아웃 상태로 남을 수 있다.
  - 롱블랙처럼 **6자리 인증번호**를 같은 화면에 입력하게 하면 이 문제가 없다.
  - 카카오 로그인도 standalone PWA에서 리다이렉트 복귀를 반드시 실기기로 확인해야 한다.
- **토스페이먼츠 결제위젯**은 모바일 웹, PC, 앱 환경을 지원한다고 안내한다. 웹 환경에서는 성공·실패 리다이렉트에 일반 URL을 쓴다. 웹뷰 래핑 환경에서는 일부 카드사 모달이 뜨지 않은 사례가 보고됐다. Apple Pay는 iOS Safari에서만 된다.
  - 근거: [문서] tosspayments.com/services/payment-widget, tosspayments.com/blog/articles/paytech-5 · [2차] techchat.tosspayments.com/m/1309382914017984542

---

## 3. 무료 리텐션 → 유료 전환 장치

| 장치 | 사례 | 관찰 | Startup Daily 적합성 |
|---|---|---|---|
| 카운트다운과 예고 | 롱블랙 | 오늘 노트 타이머와 D-1~D-3 공개 예정 목록 | 예고(내일 소개할 섹터나 지역 힌트)는 적합하다. 타이머는 과거 호를 실제로 잠그지 않는 한 거짓 긴박감이므로 쓰지 않는다. |
| 출석과 스크랩 | 롱블랙 | 출석 스탬프(2022-02)와 문장 스크랩(2022-04)이 참여를 높였다고 회사가 밝혔다 | 이미 있는 저장과 읽음 기록으로 대체할 수 있다. |
| 무료 뉴스레터 유입 | Sifted("120,000+ founders…" 배너 + Register for free), Stratechery, Substack | 뉴스레터를 무료로 두고 그 안에 유료 미리보기를 넣는다 | 가장 적합하다. 이메일이 생기면 스폰서 재고(§4)도 생긴다. |
| 이메일 수집 팝업 | Substack 생태계 도구들 | 스크롤 60~70%, 이탈 의도, 시간 지연 트리거를 쓴다(벤더 문서). 빈도 정책은 공개 자료가 없다. | 진입 시 모달은 금지한다. "다 읽은 뒤" 인라인 카드로 하고, 닫으면 14일간 숨긴다. |
| 저장·알림 한도 | Crunchbase(알림은 첫 리스트만) | 저장한 것을 늘리는 것 자체가 유료 이유가 된다 | 부적합하다. Startup Daily의 저장은 원가 0인 localStorage다. 한도를 두면 반감만 산다. 대신 **기기 간 동기화**를 계정 혜택으로 둔다. |

근거: [관찰] longblack.co, sifted.eu · [문서] journalist.or.kr no=54421 · [2차] supascribe.com/docs/popup-modal

---

## 4. 스폰서 슬롯 표기

| 서비스 | 표기 방식 | 형식 | 근거 |
|---|---|---|---|
| **TLDR** | 호 머리에 "Together With", 광고 제목 끝에 "(Sponsor)". 편집 항목이 "(8 minute read)" 자리에 같은 괄호 꼬리표를 쓰므로 **형식은 같고 꼬리표로 구분**한다. 하단 Quick Links에도 "(Sponsor)"가 붙은 자사 광고 모집 항목이 있다. | Primary(상단, 100단어, 로고, CTA 3), Secondary(중간, 50단어, CTA 2), Quick Links(하단, 30단어). 한 호에 광고주 최대 3곳. 원하면 TLDR이 편집 문체로 대신 써 준다. | [관찰] tldr.tech/tech/2026-10-26 · [문서] advertise.tldr.tech, /newsletter-advertising-best-practices/ |
| **Morning Brew** | 마스트헤드 아래 "Together with" 로고. 네이티브 광고는 헤드라인, 이미지, 본문, CTA 구조. 텍스트 광고는 별표 각주로 표시한다. | 2022-12~2023-01 관찰에서 광고 면적은 이메일의 약 25~35% | [2차] thenewsletternewsletter.beehiiv.com(2023-01), theaudiencers.com |
| **Axios** | "A message from {브랜드}" 라벨. 편집 기사와 비슷한 모양(헤드라인, 이미지, 짧은 문단)이며, 한 주 단위로 스폰서를 판다. 2020년 정치 광고가 기사처럼 보인다는 비판을 받았다. | 주간 스폰서십, 뉴스레터에는 배너를 넣지 않음(2022) | [2차] adexchanger.com, freebeacon.com, digiday.com |
| **뉴닉** | 광고주 원고를 에디터가 뉴닉 문체로 다시 쓴다. 공식 글에 "광고인지 모르고 유익하게 봤다"는 독자 반응을 소개한다. 라벨 문구는 확인하지 못했다. | 네이티브 재작성 | [문서] newneek.co/@newneek/article/16341 · [2차] i-boss.co.kr ab-74668-4101 |
| **Hacker Newsletter** | 공개 페이지와 스폰서 페이지에서 표기 방식을 확인하지 못했다(/sponsor는 404). | — | [관찰] hackernewsletter.com |
| The Information | 헤더 바로 아래 "Featured Partners" 로고 띠 | 편집 영역과 띠로 분리 | [관찰] |

**라벨 문구 연구:** "advertising"이나 "sponsored" 라벨은 "brand voice"나 "presented by"보다 광고로 인지될 확률이 약 7배 높았다(2015 연구, 보도). 실험 참가자 800명 중 네이티브 광고를 알아본 사람은 10% 미만이었다.

- 근거: [2차] sciencedaily.com 151218095441, Wikipedia "Native advertising"
- 한국은 공정위 추천·보증 심사지침이 "광고" 같은 명확한 문구를 요구하는 것으로 알고 있으나, 이번 조사에서 원문을 확인하지 못했다. 구현 전에 확인해야 한다.

**교훈:** 신뢰를 지키는 쪽은 TLDR식(같은 형식 + 분명한 꼬리표 + 개수 상한)이다. 뉴닉식 재작성은 몰입도는 높지만, "AI 작성" 표기를 이미 하고 있는 Startup Daily에서는 "이 소개도 광고인가"라는 의심을 키운다.

---

## 5. 건당 비용 기능(AI 생성)의 과금 UI

| 서비스 | 단위 | 잔량 표시 | 한도 도달 시 | 근거 |
|---|---|---|---|---|
| **ChatGPT 무료** | 5시간 창 안의 메시지 수(GPT-5.5) | 평소에는 잔량을 숨긴다 | 알림과 함께 **재개 가능 시각**을 보여 주고 "Get Plus" 버튼을 둔다. 이미지 생성, 업로드, 데이터 분석 한도는 따로 센다. | [문서] help.openai.com 9275245 |
| **Perplexity 무료** | 하루 Pro Search 횟수(3~5회, 자료마다 다름) | 2차 자료상 Research 토글 근처에 남은 횟수와 리셋 시각을 표시한다(미확인) | "Enhanced queries exhausted" → Quick Search로 전환하거나 업그레이드 | [2차] vantaige.io, fast.io, llmrefs.com |
| **Gamma** | 크레딧(가입 시 400, 무료는 월 리셋 없음) | 2차 자료상 AI 이미지는 생성 전에 크레딧 비용을 보여 준다. 덱 생성 40, 카드 추가 5 등 | 소진되면 추천(200/건) 또는 업그레이드 | [문서] help.gamma.app 11047156 · [2차] eesel.ai, krea.ai |
| **Exploding Topics** | 플랜 등급 | 잔량 개념 없이 기능 자체를 잠근다 | 7일 체험 | [문서] 위 블로그 |

**정리:** 잘 된 사례의 공통점은 세 가지다.
1. 실행 **전에** 비용이나 남은 횟수를 보여 준다.
2. 한도에 닿으면 **언제 다시 되는지**를 알려 준다.
3. 무료 대안(하위 모델, Quick Search)을 함께 준다.

생성 대기 중에 업셀하는 공식 사례는 찾지 못했다. Startup Daily의 2~3분 대기는 이미 긴 편이므로, 그 시간에 결제를 권하면 "돈을 내야 빨라진다"는 신호로 읽힌다.

---

## 6. Startup Daily 화면별 적용안

전제는 세 가지다.
- 계정, 결제, 이메일을 **새로 만들어야** 한다(현재 없음). 아래는 그 순서까지 포함한 제안이다.
- 디자인 톤("원장과 인주")에 맞춰, 잠금 표시는 주홍 인주 도장과 종이 페이드로 표현한다. 블러나 모달은 쓰지 않는다.
- 단계: **1단계 = 뉴스레터와 스폰서**(계정 없이 가능), **2단계 = 무료 계정과 AI 한도**, **3단계 = 유료 멤버십**. 데이터가 받쳐 주는 순서다.

### S1. 오늘 호(Issue)

| 적용 | 패턴 | 데이터·구현 |
|---|---|---|
| 오늘 4~5곳 전체 무료, 로그인 없음 | Stratechery·롱블랙의 오늘 무료 | 변경 없음 |
| 호 하단 "내일 받기" 인라인 카드(이메일 1칸 + 인증번호) | Sifted 등록 배너, TLDR | 이메일만 받는다. 이미 구독했거나 닫았다면 14일간 숨긴다(localStorage) |
| 스폰서 1칸: 3번째와 4번째 회사 사이 **또는** 목록 끝, 같은 행 형식에 오른쪽 꼬리표 "광고", 머리에 "함께하는 곳" | TLDR "Together With" + "(Sponsor)" | `sponsor.json`(date, name, line, url). 회사 행과 같은 높이로 두되 순번을 매기지 않고 로고 모노그램을 쓰지 않는다 |
| 내일 예고 1줄("내일: 핀테크 2곳, 독일 1곳") | 롱블랙 공개 예정 | 다음 날 데이터가 미리 생성되어 있을 때만 쓴다. 없으면 생략 |

**피할 것:** 오늘 호 잠금, 카운트다운 타이머(실제로 사라지지 않으므로 거짓 긴박감), 진입 모달, 스폰서를 "에디터 픽"처럼 보이게 하는 것(03 스펙 C1·C2와 충돌).

### S3. 회사 상세(Detail)

| 적용 | 패턴 | 데이터·구현 |
|---|---|---|
| 본문 섹션(개요~투자·시장)은 계속 전체 공개 | Substack식 긴 미리보기의 극단 | 오늘 호와 아카이브를 구분하지 않는다. 공유 URL이 깨지면 안 되기 때문이다 |
| **"한국에서는" 결론 박스(`verdict`, `headline`)와 "비슷한 것들"은 무료, "기회 가설"(누가·쐐기·장벽·한 달 체크리스트)은 멤버 전용** | Sifted Pro 섹션 잠금, Exploding Topics 리포트 잠금 | 잠근 부분은 소제목 4개만 보이게 하고 내용 자리에 종이 페이드와 "멤버에게 열리는 부분" 카드를 둔다. 뒤섞인 텍스트는 쓰지 않는다 |
| 생성 버튼 옆 잔량 "이번 달 새 분석 2회 남음", 실행 전 "2~3분 걸려요" | Gamma의 실행 전 비용, Perplexity의 잔량 | 캐시된 분석(`_lens` 또는 엣지 캐시) 열람은 **잔량을 차감하지 않는다**. 새 생성만 센다. 무료 계정은 월 N회. 로그아웃 상태에서는 "무료 가입하고 분석 요청" |
| 한도 도달 시 "다음 달 1일에 다시 열려요 · 다른 독자가 이미 만든 분석은 계속 볼 수 있어요" + 멤버십 버튼 | ChatGPT 재개 시각 + 대안 | 서버는 현재 IP 기준 한도(4회/10분)를 **계정 기준 월 한도**로 바꿔야 한다 |
| 생성 대기 중에는 진행 단계만 보여 준다(검색 → 링크 확인 → 작성) | 업셀 금지 | 기존 `elapsed`에 단계 문구만 추가 |
| 기사 하단 "이 회사 소식 받기"(저장 알림)는 설치한 PWA에서만 노출 | iOS 웹 푸시 제약 | `display-mode: standalone`에서만 노출. 푸시 권한은 탭할 때 요청 |

**피할 것:** 본문 블러, 뒤섞인 텍스트, 상세 진입 모달, 생성 중 업셀, 캐시된 분석에 과금, "한국에서는" 결론 자체를 잠그는 것(무료로 보이는 가치가 사라진다).

### S4. 탐색(Explore)

| 적용 | 패턴 | 데이터·구현 |
|---|---|---|
| 목록과 기본 필터(섹터·단계·지역)는 무료 | Crunchbase의 존재 노출 | 변경 없음 |
| **멤버 전용 도구:** 표 CSV 내보내기, 복합 필터 저장, "한국 기회" 필터, 펀딩 금액 정렬 | Crunchbase의 결과·내보내기 상한, Exploding Topics의 고급 필터 | 잠근 컬럼이나 버튼에 작은 인주 자물쇠 + "멤버" 텍스트를 붙이고, 누르면 하단 시트로 설명한다 |

**피할 것:** 결과 수 상한(무료 5개 같은 것). 아카이브가 아직 작아(하루 5곳) 상한을 두면 탐색 자체가 망가진다. 표 행을 블러 처리하는 것도 피한다.

### S5. 저장(Saved)

| 적용 | 패턴 | 데이터·구현 |
|---|---|---|
| 저장 무제한, 계정 없이 로컬 저장 | — | 변경 없음 |
| 무료 계정 혜택으로 "기기 간 동기화" 안내 1줄(저장 5개 이상일 때만) | 가입 동기 부여 | localStorage → 서버 동기화는 2단계 |

**피할 것:** 저장 개수 한도(원가 0, 반감만 산다).

### S6. 소개(About)

| 적용 | 패턴 | 데이터·구현 |
|---|---|---|
| "무료로 계속 되는 것 / 멤버가 얻는 것 / 광고 원칙" 표를 공개 | Stratechery의 무료·유료 명시 | 광고 원칙: 한 호 1칸, 소개 회사 선정과 무관, "광고" 표기, AI 소개 본문에 광고주 언급 금지 |
| 가격은 여기와 결제 화면에만 둔다 | 롱블랙·Sifted: 벽에 가격 없음 | — |

### 공통 가입 플로우

1. 벽 카드에서 1차 "카카오로 3초 가입", 2차 "이메일로 가입(인증번호)"을 둔다. Apple은 iOS에서만 노출한다.
2. 가입 후 원래 위치로 돌아간다(`return_url`, 롱블랙 방식).
3. 결제는 별도 화면에서 토스 결제위젯을 쓴다. standalone PWA에서 리다이렉트 복귀를 실기기로 테스트한다.
4. 체험판은 신용카드 없는 7일을 쓴다(Exploding Topics "No credit card required").

---

## 7. 할 것 / 하지 말 것

**할 것**
1. 오늘 호와 회사 본문은 계속 무료로 두고, 잠금은 **아카이브 도구(내보내기·고급 필터)와 AI 기회 가설**에만 둔다.
2. 첫 벽은 **무료 가입**으로 한다. 카카오 → 이메일 인증번호 순서로 두고, 가입 후 원위치로 돌아간다.
3. 잠금 표시는 **종이 페이드 + 인라인 카드 + 소제목 노출**로 한다. 무엇이 잠겼는지 보이게 한다.
4. AI 생성은 **새 생성만 계정 단위 월 한도**로 센다. 실행 전 잔량과 시간, 한도 도달 시 재개일과 무료 대안을 보여 준다.
5. 스폰서는 **한 호 1칸, 같은 행 형식, "광고" 꼬리표, "함께하는 곳" 머리말**로 한다. 광고 원칙을 About에 공개한다.
6. 무료 뉴스레터(이메일 1칸)를 1단계 수익화의 기반으로 삼는다. 스폰서 재고와 유료 전환의 입구가 된다.

**하지 말 것**
1. 하드 페이월, 미터드(월 N개), 오늘 호 잠금. Startup Daily에는 The Information 같은 독점 취재력이 없다.
2. 블러, 뒤섞인 텍스트, 진입 모달. 에디토리얼 톤과 접근성 모두를 해친다.
3. 거짓 긴박감(실제로 잠기지 않는데 카운트다운), 저장 한도.
4. 생성 대기 중 업셀, 캐시된 분석 열람에 과금.
5. "Presented by", "브랜디드" 같은 완곡한 광고 라벨. 광고를 AI 소개 본문에 섞는 재작성형 네이티브 광고.
6. PWA에서 매직링크만으로 로그인하게 하는 것(세션 분리 위험, 실기기 확인 전까지).

---

## 출처

**직접 관찰(2026-10-27~28, 로그아웃)**
- 롱블랙 홈·오늘 노트·지난 노트·가입: https://longblack.co/ , https://longblack.co/note/2157 , https://longblack.co/note/2149 , https://longblack.co/register?return_url=%2Fpayment%2Fmembership-plan
- Sifted 홈·Pro 기사: https://sifted.eu/ , https://sifted.eu/articles/strawberry-browser-1-0/
- The Information 기사: https://www.theinformation.com/articles/amazon-lists-250-million-products-rival-sites-effort-battle-agents
- Substack 유료 글(Lenny's Newsletter): https://www.lennysnewsletter.com/p/how-to-tell-if-a-startup-has-a-moat
- Stratechery About: https://stratechery.com/about/
- TLDR 이슈: https://tldr.tech/tech/2026-10-26
- Exploding Topics 홈: https://explodingtopics.com/
- Hacker Newsletter: https://hackernewsletter.com/ (/sponsor는 404)
- 접근 실패(봇 확인): https://www.morningbrew.com/issues/latest , https://www.crunchbase.com/organization/linear

**문서·보도**
- 롱블랙: https://www.journalist.or.kr/m/m_article.html?no=54421 (2023-10), https://journalist.or.kr/news/article.html?no=50281 , https://www.nextunicorn.kr/newsroom/ea0236f07d40da08
- 퍼블리: https://ditoday.com/?p=66029 , https://www.venturesquare.net/928278/ (2024-06)
- Sifted 페이월: https://pressgazette.co.uk/?p=162752 (2021-02), https://resources.piano.io/?p=11901
- The Information: https://econsultancy.com/will-the-information-s-bold-paywall-strategy-work/ , https://www.journalism.co.uk/why-the-information-chose-to-follow-a-subscription-model/ , https://mequoda.com/digital-publishing-trends/more-subscription-website-growth-leads-to-more-model-offerings
- Stratechery: https://stratechery.com/2014/free-stratechery-daily-email/ , https://fortune.com/ranking/creator-25/2021/ben-thompson-stratechery
- Substack: https://on.substack.com/p/new-tools-paywall-embeds (2021-10), https://faq.substack.com/p/logging-in-to-substack
- Exploding Topics: https://explodingtopics.com/blog/exploding-topics-pro-vs-free (2026-03 갱신), https://www.unite.ai/exploding-topics-review/
- Crunchbase: https://support.crunchbase.com/hc/en-us/articles/360062989313 (검색 스니펫, 본문은 403), https://www.g2.com/products/crunchbase/reviews , https://enrichlayer.com/blog/crunchbase-api-guide
- Medium: https://help.medium.com/hc/en-us/articles/360017581433 , https://help.medium.com/hc/en-us/articles/360006543813-Friend-Links
- ChatGPT: https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- Perplexity(2차): https://vantaige.io/blog/perplexity-ai-tutorial-maximize-your-research-workflows , https://fast.io/resources/perplexity-message-limit.md , https://llmrefs.com/blog/perplexity-free-plan
- Gamma: https://help.gamma.app/en/articles/11047156-what-are-gamma-tokens-and-how-do-they-work , https://www.eesel.ai/en/blog/gamma-pricing , https://www.krea.ai/blog/is-gamma-ai-free-pricing-and-alternatives-in-2026
- TLDR 광고: https://advertise.tldr.tech/ , https://advertise.tldr.tech/newsletter-advertising-best-practices/
- Morning Brew 광고(2차): https://thenewsletternewsletter.beehiiv.com/p/advertising-in-newsletters-morning-brew-part-1-3099 (2023-01), https://theaudiencers.com/deep-dive-into-the-morning-brew-newsletter-andy-griffiths/
- Axios(2차): https://adexchanger.com/the-sell-sider/axios-people-no-time-read-news-engage-ads/ , https://freebeacon.com/politics/axios-running-bloomberg-ads/ , https://digiday.com/media/media-briefing-axios-enters-the-banner-ad-business/
- 뉴닉 광고: https://newneek.co/@newneek/article/16341 , https://www.i-boss.co.kr/ab-74668-4101
- 네이티브 광고 라벨 연구: https://www.sciencedaily.com/releases/2015/12/151218095441.htm , https://en.wikipedia.org/wiki/Native_advertising
- iOS 웹 푸시: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ , https://9to5mac.com/2023/02/16/iphone-web-app-new-features-ios-16-4/
- Apple 외부 결제(미국, 2025-04-30 판결): https://technologylaw.fkks.com/post/102ka4o/apple-violated-u-s-court-order-ending-apples-27-commission-on-external-purcha , https://www.notebookcheck.net/Apple-amends-US-App-Store-guidelines-following-loss-against-Epic-Games-in-legal-dispute.1009335.0.html
- 카카오 로그인: https://developers.kakao.com/docs/latest/ko/kakaologin , https://devtalk.kakao.com/t/topic/136465
- 토스페이먼츠: https://www.tosspayments.com/services/payment-widget , https://www.tosspayments.com/blog/articles/paytech-5 , https://techchat.tosspayments.com/m/1309382914017984542
- 이메일 팝업 트리거(벤더): https://supascribe.com/docs/popup-modal
- 내부 코드: `api/korea-lens.mjs`(엣지 캐시 30일, IP당 4회/10분), `src/screens/Detail.jsx` `KoreaSection`, `src/screens/detail-hooks.jsx` `useKoreaLens`
