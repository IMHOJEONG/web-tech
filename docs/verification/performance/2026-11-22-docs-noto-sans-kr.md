# Noto Sans KR 적용과 Pretendard 비교

## 대상과 조건

2026-11-22 KST, `7f979040`와 로컬 Noto 적용본을 비교했다. 사용자 선택에 따라 한국어 본문을 Noto Sans KR로 바꾸고 기존 locale CSS 변수에 연결했다. 두 안 모두 자체 호스팅·preload=false·display=swap·Next 기본 fallback 보정을 사용한다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

Google Fonts의 공식 `NotoSansKR[wght].ttf`를 소스 커밋 `4efc2774c63917927efe769ca845def6bd6debae`에 고정하고 Git blob `b386890ba945e1f39448a6b59f20c5d194f58808`과 다운로드 bytes를 대조했다. OFL 원문을 `apps/docs/public/fonts/NotoSansKR-LICENSE.txt`에 함께 둔다. [원본](https://github.com/google/fonts/blob/4efc2774c63917927efe769ca845def6bd6debae/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf) · [라이선스](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt)

## 폰트 파일과 문자 범위

| 파일                       | bytes      | 문자 범위                                       |
| -------------------------- | ---------- | ----------------------------------------------- |
| 기존 Pretendard WOFF2      | 1,756,652  | 11,682 코드 포인트                              |
| 공식 Noto TTF              | 10,414,588 | 23,174 코드 포인트                              |
| Noto 전체 WOFF2 변환 실험  | 3,907,892  | 공식 원본의 전체 범위                           |
| 적용한 Noto WOFF2 부분집합 | 1,053,064  | 기존 본문 폰트와 Noto의 공통 11,628 코드 포인트 |

적용 파일에는 한글 완성형 U+AC00–U+D7A3의 11,172자가 모두 있다. 원본의 가변 굵기 100–900과 레이아웃 기능을 유지했다. 400·600·700의 표본 162회에서 Noto 원본과 부분집합의 글자 윤곽이 일치했다.

Noto 원본에는 기존 Pretendard가 포함하던 일부 공백·제어·특수기호 코드 포인트 54개가 없다. 목록은 artifact에 기록했다. 부분집합 단계에서 지원하는 한글을 제거하지 않았으며, 특수기호 표본에서는 Arial·Helvetica fallback 사용을 Chrome의 실제 platform font 조회로 확인했다. 한자 등 Noto의 추가 범위는 이번 부분집합에 포함하지 않았다. 성능 비교는 이 적용 파일에 대한 결과다.

## 재현 방법

1. 공식 TTF와 OFL을 내려받고 고정 소스의 Git blob 및 SHA-256을 확인한다.
2. 저장소 밖 Python 가상환경의 fontTools 4.68.0·Brotli 1.2.1을 사용한다. Pretendard와 Noto의 cmap 교집합을 선택하고 모든 layout feature·이름 레코드를 유지해 WOFF2로 저장한다. 문자 범위·가변축과 표본 윤곽을 대조한다.
3. 실제 fonts.ts를 쓰는 Next 16.4.6 Webpack 프로덕션 fixture 두 개를 빌드한다. 동일한 한글·영문 문장, 본문 1.05rem·줄 간격 1.75·같은 폭과 여백을 사용한다. 본문 아래에 다음 제목과 문단을 배치해 폰트 전환의 이동도 측정한다.
4. Chromium의 빈 cache에서 ko·en × 390·1280px × 3회 × 두 서체로 24실행한다. 일반 연결·CPU 1배와 RTT 150ms·download 200,000bytes/s·CPU 4배의 느린 연결에서 각각 수행해 총 48실행을 비교한다. 실행 순서는 반복마다 교대한다.
5. 본문 Element Timing의 renderTime, 마지막 LCP, document.fonts.ready 후 두 frame의 시각과 최대 session-window CLS를 기록한다. 폰트 응답 bytes와 다운로드 파일의 해시를 대조한다.
6. 별도 동일 폭 가독성 표본을 Chromium·Firefox·WebKit, 390·1280px에서 렌더한다. 폰트 로드와 overflow를 검사하고 14·16.8px 및 400·600·700의 Chromium 화면 두 폭을 육안으로 확인한다.

제품 검사는 다음 명령으로 수행했다.

```sh
pnpm --filter docs typecheck
pnpm --filter docs exec eslint shared/config/fonts.ts 'app/[locale]/layout.tsx' --max-warnings 0
```

## 결과와 증거

### 한글 성능

각 칸은 Pretendard → Noto의 3회 중앙값이다. CLS는 3회 중 최댓값이다.

| 연결·폭   | 본문 첫 표시 ms | LCP ms    | 웹폰트 준비 ms | CLS        |
| --------- | --------------- | --------- | -------------- | ---------- |
| 느림·390  | 572 → 560       | 572 → 560 | 10,080 → 6,559 | 0 → 0.0051 |
| 느림·1280 | 572 → 580       | 572 → 580 | 10,092 → 6,554 | 0 → 0.0023 |
| 일반·390  | 92 → 60         | 92 → 60   | 131 → 109      | 0 → 0.0051 |
| 일반·1280 | 56 → 64         | 56 → 64   | 102 → 109      | 0 → 0.0023 |

적용한 파일의 응답 body는 703,588bytes, 약 40.1% 작다. 느린 연결의 한글 웹폰트 준비 시간은 약 3.5초 줄었다. 본문 첫 표시와 LCP의 작은 차이는 이 표본의 관측값으로 남기며 운영 성능 개선량으로 일반화하지 않는다. 영어 본문에서는 두 안 모두 한글 폰트를 요청하지 않았다.

폰트 전환 뒤 성능 표본의 한글 문단은 모바일 9 → 10행, 데스크톱 3 → 4행으로 바뀌었다. 아래 문단 위치가 움직여 Noto에서 작은 CLS가 발생했다.

### 가독성 관측

두 서체 모두 육안 표본에서 한글 누락·글자 겹침·잘림이 보이지 않았다. 값/갓·낫/낮·꽃/꽂·자모·숫자와 영문 혼용, 굵은 글씨·작은 본문을 확인했다. 가독성의 선호나 읽기 속도 우열을 입증하는 사용자 실험은 수행하지 않았다.

| 가독성 표본                                  | Pretendard 본문 행수 | Noto 본문 행수 |
| -------------------------------------------- | -------------------- | -------------- |
| 390px 화면, 본문 폭 316px, 세 엔진           | 6                    | 6              |
| 1280px 화면, 본문 폭 556px, Chromium·Firefox | 3                    | 4              |
| 1280px 화면, 본문 폭 556px, WebKit           | 3                    | 3              |

세 엔진·두 폭에서 폰트 로드와 overflow 검사가 통과했다. Chromium 두 폭의 비교 캡처는 저장소 밖에 보관하고 해시를 artifact에 남겼다. 제품 타입·린트도 통과했다. [정제 측정·소스 해시·캡처 해시](../artifacts/2026-11-22-docs-noto-sans-kr.json)

## 한계와 후속 작업

현재 적용은 로컬 미커밋이다. 운영 배포·실제 전체 페이지의 필드 CWV·실기기·다른 OS fallback과 주관적 가독성 평가는 미검증이다. WebKit 결과를 실제 Safari 앱의 CWV로 해석하지 않는다. 새로 고른 서체의 글자 폭과 일부 특수기호 fallback이 달라져 문단·카드의 줄바꿈이 달라질 수 있다.

이번 변경은 본문 폰트 자산과 locale layout 연결이며 공개 CSS 변수·라우팅·공용 UI 계약의 새 결정이 없어 ADR을 추가하지 않았다. OFL은 저작권·라이선스 고지를 포함하며 폰트 단독 판매와 Reserved Font Name 조건을 따른다. 원본의 예약 이름은 Source이고 적용 파일의 primary font name은 Noto Sans KR이다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-docs-noto-sans-kr.md)
- [기존 폰트 로딩 검증](2026-11-22-docs-font-loading.md)
- [Next Font](https://nextjs.org/docs/app/api-reference/components/font)
- [Google Fonts 공식 메타데이터](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/METADATA.pb)
