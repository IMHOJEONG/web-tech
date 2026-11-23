# 언어별 폰트 요청과 선로딩 실험

## 대상과 조건

2026-11-22 KST, `775eb593` 기준이다. 본문 이미지 변경·정제 기록 16파일을 이 커밋에 포함한 뒤 다음 계획인 폰트 전송량을 측정했다. 커밋의 staged 검사, 실제 훅, 범위 공개 검수와 commitlint가 통과했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

저장소의 `apps/docs/shared/config/fonts.ts`를 그대로 복사하고 같은 폰트 bytes를 사용하는 격리 Next 16.4.6 Webpack 프로덕션 fixture를 빌드했다. 실제 앱의 locale body 폰트 선택과 변수 클래스 연결을 재현했고 한글·영문 합성 문장과 선택적 코드 블록을 사용했다. 전체 블로그 페이지·운영 배포의 측정은 아니다.

Chromium의 새 context에서 390·1280px, ko·en, 코드 블록 유무를 조합한 8조건을 실행했다. 기준과 Pretendard preload=false 복사본을 각각 검사해 총 16실행이다. 각 실행은 빈 브라우저 캐시로 시작하고 document.fonts.ready 및 networkidle 후 font response bytes와 Resource Timing encodedBodySize를 대조했다. 원시 서버 로그와 fixture는 저장소 밖에 보관했다.

## 재현 방법

1. 저장소 밖 모노레포 형태의 fixture에 실제 fonts.ts와 public 폰트 파일을 복사하고 공용 코드 폰트 경로를 연결한다.
2. locale layout에서 실제 앱처럼 mono·pretendard·spaceGrotesk의 variable을 body에 적용한다. 한글은 font-body-ko, 영문은 Inter·sans-serif를 사용하고 제목은 font-display, 코드는 font-jetbrains-mono를 사용한다.
3. 설치된 Next CLI로 `next build <fixture> --webpack`을 수행하고 loopback에 `next start`를 실행한다.
4. 8조건마다 새 Chromium context에서 font 요청·응답 body 길이·preload 수·본문 font-family를 수집한다. 원본 파일 SHA-256과 응답 SHA-256을 대조해 글꼴을 식별한다.
5. 격리 복사본의 Pretendard 정의에 preload=false 하나를 추가해 다시 빌드하고 같은 8조건을 실행한다. 서버와 브라우저를 종료하고 listen socket이 없음을 확인한다.

최초 Turbopack fixture는 /tmp 실제 경로와 외부 symlink 의존성의 root 제한으로 빌드하지 못했다. 실제 저장소의 제품 빌드 실패로 판정하지 않았으며 공식 Webpack 로더로 격리 검사를 완료했다.

## 결과와 증거

두 폭에서 같은 결과를 관측했다. 아래 byte는 응답 body 합계이며 전송 헤더를 포함한 transferSize와 구분한다.

| 언어·코드    | 기준 폰트 bytes | preload 제거 실험 bytes | 결과                                        |
| ------------ | --------------- | ----------------------- | ------------------------------------------- |
| ko·코드 없음 | 1,781,928       | 1,781,928               | Pretendard·Space Grotesk 요청 유지          |
| en·코드 없음 | 1,781,928       | 25,276                  | 본문이 사용하지 않는 Pretendard 요청 제거   |
| ko·코드 있음 | 1,874,092       | 1,874,092               | 위 두 글꼴과 JetBrains Mono Regular 요청    |
| en·코드 있음 | 1,874,092       | 117,440                 | Space Grotesk·JetBrains Mono Regular만 요청 |

기준의 preload는 ko·en 모두 2개였고 실험에서는 1개였다. Pretendard는 1,756,652bytes, Space Grotesk는 25,276bytes, JetBrains Mono Regular는 92,164bytes다. 영어 본문 font-family에는 Pretendard가 없는데도 기준 preload가 해당 파일을 내려받았다. 코드 폰트의 기존 preload=false는 코드가 없는 경우 요청 0개, 있는 경우 필요한 Regular 파일 1개로 동작했다.

[정제 측정과 입력 해시](../artifacts/2026-11-22-docs-font-loading.json)

## 한계와 후속 작업

최초 기록 시점에는 제품 폰트 설정을 변경하지 않았고 격리 복사본에서 preload 제거를 실험했다. 현재 운영 요청량과 LCP·CLS, 느린 연결의 한글 표시 지연, locale 전환, WebKit·Firefox·실기기는 미검증이다. 한국어의 byte가 같아도 요청 발견 시점과 텍스트 표시 시간이 같다는 뜻은 아니다.

다음 적용 비교에서는 선로딩 제거의 한국어 표시 시간과 fallback 기하를 먼저 확인한다. 한국어의 초기 지연이 커지면 언어별 로딩 경계나 문자 범위 분할을 검토한다. unicode-range만 추가해도 preload는 요청을 만들 수 있어 함께 설계해야 한다. Next의 자동 fallback 보정도 이미 켜져 있으므로 font-size-adjust는 실제 기하 비교를 거쳐 판단한다. [Next Font](https://nextjs.org/docs/app/api-reference/components/font) · [폰트 최적화](https://web.dev/articles/font-best-practices?hl=en)

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-docs-font-loading.md)
- [직전 본문 이미지 검증](2026-11-22-docs-article-images.md)
- [현대화 후보 조사](../accessibility/2026-11-21-frontend-modernization-audit.md#접근성-외-항목-재조사)
- [별도 폰트 판단 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## 무료 한글 폰트 대안 조사

2026-11-22에 공식 저장소와 라이선스 원문을 확인했다. 아래 후보는 OFL 1.1로 상업적 사용·웹 임베딩·재배포가 가능하다. 배포본에는 저작권 고지와 라이선스를 유지하고, 폰트 단독 판매와 수정본의 Reserved Font Name 조건을 따른다. [OFL 조건 원문](https://raw.githubusercontent.com/sun-typeface/SUIT/main/LICENSE)

| 후보               | 검토 의견과 제공 정보                                                                                               | 공식 근거                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SUIT               | UI 본문용으로 제작됐다. 현재 기술 블로그의 본문·탐색 UI에는 첫 비교 후보로 권장한다. 스타일 적합성은 검토 의견이다. | [소개](https://github.com/sun-typeface/SUIT) · [라이선스](https://raw.githubusercontent.com/sun-typeface/SUIT/main/LICENSE)                                                           |
| Wanted Sans        | 기하학적인 형태로 제목·본문에 쓸 수 있고 가변 글꼴도 제공한다. 개성 있는 인상을 원하는 경우 비교할 후보다.          | [소개](https://github.com/wanteddev/wanted-sans) · [라이선스](https://raw.githubusercontent.com/wanteddev/wanted-sans/main/OFL.txt)                                                   |
| Spoqa Han Sans Neo | 국문·영문 조합을 고려한 오픈소스 서체다. 일반 웹 본문용 비교 후보다.                                                | [소개](https://github.com/spoqa/spoqa-han-sans) · [라이선스](https://raw.githubusercontent.com/spoqa/spoqa-han-sans/main/LICENSE)                                                     |
| Noto Sans KR       | 한글과 여러 문자 범위를 지원하며 Google Fonts의 가변 글꼴을 제공한다. 다국어 본문용 비교 후보다.                    | [메타데이터](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/METADATA.pb) · [라이선스](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt) |

이번 요청에서는 대안 조사까지 수행했다. 후보의 실제 다운로드 byte, 동일 문장의 줄바꿈·모바일 가독성·코드와의 조화는 미비교이며 새 폰트 파일을 저장소에 추가하지 않았다. 한글 표시·LCP·CLS 비교에는 현재 Pretendard를 사용했다.

## 한글 표시·LCP·CLS 후속 검증과 적용

최초 측정 기록 7파일은 `06adc7a0`에 로컬 커밋했다. 실제 훅, 공개 검수와 commitlint가 통과했다. 이후 사용자 요청에 따라 Pretendard의 preload=false를 제품에 적용했다. 현재 locale의 CSS font-family가 해당 파일의 요청을 결정한다. display=swap과 기존 Next fallback 보정을 사용한다.

### 계측과 표본

설치된 Next 16.4.6의 실제 폰트 설정을 사용하는 격리 프로덕션 fixture의 기준·권장안을 비교했다. 각 안에 ko·en × 390·1280px × 3회로 24실행을 수행했다. 기준과 권장안의 실행 순서는 반복마다 교대했고 각 실행은 새 브라우저 context와 비활성 HTTP cache를 사용했다. Chromium 151.0.7922.34에서 다음 두 조건을 검증했다.

- 짧은 합성 본문에 RTT 150ms, download 200,000bytes/s인 1.6Mbps, upload 93,750bytes/s, CPU 4배 조건을 적용했다.
- 같은 문장을 5회 반복한 동일한 서버 HTML로 일반 연결·CPU 1배 조건을 검사했다.

한글 첫 표시는 body-text Element Timing의 renderTime으로 측정했다. 웹폰트 준비는 document.fonts.ready 후 두 animation frame이 지난 시각으로 별도 수집했다. LCP는 PerformanceObserver의 마지막 largest-contentful-paint 항목이고 CLS는 사용자 입력이 없는 layout-shift에서 1초 간격·5초 길이의 최대 session window로 계산했다. 아래는 각 조건 3회의 중앙값이며 CLS는 관측 최댓값이다.

### 느린 연결의 결과

| 언어·폭 | 본문 첫 표시 ms | LCP ms    | 웹폰트 준비 ms  | CLS   |
| ------- | --------------- | --------- | --------------- | ----- |
| ko·390  | 500 → 500       | 500 → 500 | 10,096 → 10,077 | 0 → 0 |
| ko·1280 | 508 → 500       | 508 → 500 | 10,076 → 10,077 | 0 → 0 |
| en·390  | 508 → 492       | 508 → 492 | 881 → 751       | 0 → 0 |
| en·1280 | 500 → 496       | 500 → 496 | 885 → 756       | 0 → 0 |

### 일반 연결·긴 본문의 결과

| 언어·폭 | 본문 첫 표시 ms | LCP ms  | 웹폰트 준비 ms | CLS   |
| ------- | --------------- | ------- | -------------- | ----- |
| ko·390  | 96 → 36         | 96 → 36 | 97 → 88        | 0 → 0 |
| ko·1280 | 88 → 32         | 88 → 32 | 90 → 82        | 0 → 0 |
| en·390  | 72 → 28         | 72 → 28 | 74 → 59        | 0 → 0 |
| en·1280 | 76 → 32         | 76 → 32 | 75 → 59        | 0 → 0 |

긴 본문 높이도 두 안에서 동일했다. ko는 390px에서 288px, 1280px에서 96px였으며 en은 각각 416·160px였다. 48개 유효 실행에서 CLS는 모두 0이었다. 이 표본에서 한글 표시·LCP·최종 줄바꿈의 악화를 관측하지 않아 preload 제거를 적용했다. 영어의 불필요한 1,756,652bytes 절감은 앞선 요청 검증에서 확인했다. 큰 한글 파일의 다운로드 시간은 이 변경으로 줄어들지 않으며, 느린 조건의 Pretendard 준비에는 약 10초가 걸린다.

처음 긴 본문 harness는 MutationObserver로 문장을 주입했으나 파서와의 실행 순서 때문에 두 안의 문장이 달라졌다. 이 24실행은 유효 표본에서 제외하고 원시 결과를 저장소 밖에 보존했다. 동일 SSR 문장을 양쪽 빌드에 넣은 뒤 위 24실행을 다시 수행했다.

제품 fonts.ts의 타입·린트가 통과했다. 이번 설정 변경의 UI 모양·라우팅·공개 API에 새 결정이 없어 ADR을 추가하지 않았다. 서체 대안은 조사 상태이며 이번 로딩 설정에는 현재 Pretendard를 사용했다. [후속 계측과 최종 소스 해시](../artifacts/2026-11-22-docs-font-loading.json)

이 결과는 통제된 합성 본문의 로컬 실험이다. 표본 3회의 차이를 통계적 효과나 운영 LCP 개선량으로 일반화하지 않는다. 운영 배포·실제 전체 페이지·실기기·다른 OS의 한글 fallback·실제 Safari·Firefox의 CWV는 미검증이다. 제품 적용은 로컬 미커밋 상태다.
