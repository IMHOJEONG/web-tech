# 상세 페이지 레이아웃 이동과 모바일 텍스트 지연 진단

## Summary

실제 heap-forge.app 두 상세 페이지에 대해 기본 8회와 모바일 폰트 차단 4회를 추가 측정했다.
운영 UI/설정은 변경하지 않았다. 코드 수정 전 원인 확인 작업이다.

## Changed

- 재현 스크립트: `apps/docs/scripts/trace-deployed-rendering.cjs`
- 원본 증거: `docs/verification/artifacts/2026-09-18-rendering-trace.json`
- LayoutShift sources/좌표, LCP 후보 이력, 본문 높이, CSS/폰트 Resource Timing,
  loadingdone 및 Long Task를 수집했다. 전체 DevTools CPU trace는 아니다.

## Findings

### 1. 큰 CLS는 헤더/본문의 스트리밍 교체와 푸터 이동

desktop 이벤트 루프 run 1, browser run 2에서 동일한 value=1 이동을 재현했다.

- 본문 외곽 DIV: y=0 -> y=65.
- FOOTER: 초기 y=619, height=181에서 화면 밖으로 이동(기록 rect 0).
- 이벤트 루프 run 1: 4.088s 첫 LCP 후보는 푸터 저작권 문구,
  4.358s 큰 shift, 4.368s 실제 본문 P가 LCP 후보로 교체됨.
- 본문 `.mdx-wrapper`는 먼저 height=0 상태로 나타나고 loading UI가 사라질 때 높이가 생김.

현재 `apps/docs/app/[locale]/layout.tsx`의 Header는 fallback 없는 Suspense 안에 있다.
헤더 자리 65px을 예약하지 않아 나중에 헤더가 나오면 아래 요소가 내려간다.
Footer는 먼저 보일 수 있고, 상세 loading UI는 실제 긴 본문과 다른 높이/구조라
본문 등장 시 푸터가 화면 밖으로 밀린다. 이 현상은 이미지 크기 누락과 다르다.

별도로 nav 영역의 작은 shift 약 0.00048도 있었다. 폰트 전환과 관련 가능성이 있으나
value=1의 큰 이동과 분리해서 취급한다. 폰트별 이벤트 시점까지 분리하지 않아 작은 이동의
정확한 원인은 확정하지 않는다.

### 2. 모바일 첫 페인트는 CSS 응답 완료 직후 발생

기본 mobile 4회의 HTML 응답 완료는 0.837–0.889s.
주요 blocking CSS `1vlsvml922t_h.css`는 2.825–3.814s에 완료,
FCP는 2.892–3.892s, 최종 관측 LCP는 3.192–4.204s였다.
CSS encodedBodySize는 22422 bytes지만 폰트 등 다른 요청과 함께 내려받고 있었다.

CSS 완료 직후 55–63ms Long Task가 관측됐다. 수초의 지연을 이 작업만으로 설명할 수 없다.
본문 노드 공개는 첫 페인트보다 대략 300ms 뒤였다. 로컬 설치본 React server 출력 코드의
`$RC/$RV`에도 `$RT+300` 예약 로직이 있다. 관측과 일치하지만 배포 런타임의 모든
스케줄링 경로를 추적한 것은 아니며 이 내부 상수를 패치할 계획은 없다.

### 3. 폰트 18개를 모든 페이지에서 preload

공개 페이지에서 확인한 다운로드 합계(encodedBodySize): **3,302,072 bytes**.

- JetBrains Mono 16종: 1,520,144 bytes.
- Pretendard Variable: 1,756,652 bytes.
- Space Grotesk Variable: 25,276 bytes.

`apps/docs/shared/config/fonts.ts`에 16종의 mono source가 등록되어 있고,
locale layout에서 전역으로 사용한다. `preload: false` 지정 없이 모두 미리 요청된다.
코드 블록이 없는 이벤트 루프 글도 18개를 다운로드했다.
모바일 Pretendard 응답은 약 19.9s, font loadingdone은 약 20s였지만 본문은 3초대에 보였다.
따라서 폰트 완료까지 텍스트 자체가 숨겨지는 FOIT가 주원인이라는 설명은 틀리다.
`display: swap`으로 대체 글꼴이 먼저 보이며, 과도한 요청의 대역폭 경쟁이 개선 후보다.

## 폰트 차단 비교 실험

운영 서버는 그대로 두고 Playwright 요청 라우팅으로 측정 브라우저의 woff2만 abort했다.
모바일 조건은 기존과 같은 390×844, 150ms, 1.6Mbps down, 0.75Mbps up, CPU 4배 제한이다.

| 문서                          | 기본 LCP 2회   | 폰트 차단 LCP 2회 |
| ----------------------------- | -------------- | ----------------- |
| javascript-event-loop-runtime | 3.260 / 3.192s | 2.404 / 2.680s    |
| browser                       | 3.272 / 4.204s | 1.884 / 2.296s    |

차단 실행은 모두 fallback 글꼴이므로 최종 시각 디자인은 정상 페이지와 다르다.
각 조건은 순차 측정이며 TTFB/서버 캐시가 통제되지 않았고, routing은 브라우저 HTTP cache를
비활성화한다(기본도 매회 빈 context). 따라서 동일한 개선 폭을 약속하는 벤치마크가 아니라
폰트 리소스 부담을 줄일 근거다. 불필요한 mono preload만 제거한 실배포 재측정이 필요하다.

## 조치 우선순위

1. Header의 고정 외곽(65px)을 Suspense 밖에 유지하고 pathname 의존 내부만 분리.
   불가하면 같은 높이의 fallback을 먼저 제공한다.
2. 상세 전용 loading shell을 본문/TOC 구조에 맞추고 초기 푸터가 viewport 안으로 올라오지
   않도록 최소 본문 높이를 예약한다. 단순 CLS 숫자를 줄이려고 콘텐츠를 숨기지는 않는다.
3. mono의 전역 preload를 끄고 필요한 weight/style만 유지하거나 variable 폰트로 대체한다.
   본문 폰트는 한글 unicode-range subset 또는 실제 콘텐츠 기반 분할을 별도 검증한다.
4. 동일 브라우저 조건에서 재측정하고 읽기/코드 스타일/접근성/모바일 높이 회귀를 확인한다.

## 재현

```sh
mise exec -- node apps/docs/scripts/trace-deployed-rendering.cjs
NO_FONTS=1 mise exec -- node apps/docs/scripts/trace-deployed-rendering.cjs
```

기본 결과는 `/tmp/docs-trace.json`, 비교 결과는 `/tmp/docs-trace-no-fonts.json`.
`TRACE_OUTPUT`으로 출력 위치를 바꿀 수 있다. 기본 8회, 비교 4회 public 페이지 이동이다.
문서에 기록한 수치는 함께 저장한 원본 JSON으로 검증 가능하다.

## Notes

이번 결과는 Chromium 에뮬레이션의 소수 표본이며 실사용자 p75가 아니다.
50ms 간격 DOM 상태 측정은 CPU가 바쁘면 늦어질 수 있다.
모바일 CLS=0을 모든 모바일 환경에서 이동이 없다는 뜻으로 해석하지 않는다.
수정/배포/커밋/푸시는 하지 않았으며 다른 작업의 미커밋 변경은 유지했다.

## References

- [Next font preload](https://nextjs.org/docs/app/api-reference/components/font#preload)
- [웹 폰트 로드와 리소스 경쟁](https://web.dev/articles/font-best-practices)
- [LCP 단계별 최적화](https://web.dev/articles/optimize-lcp)

## Open Questions

폰트 요청 감소와 안정적인 shell을 각각 적용했을 때의 독립적인 개선 폭,
실물 모바일/한국 네트워크의 field 성능은 후속 확인이 필요하다.

## Next

고정 header shell과 상세 fallback을 먼저 정리한 뒤 mono preload를 줄여 각각 검증한다.
