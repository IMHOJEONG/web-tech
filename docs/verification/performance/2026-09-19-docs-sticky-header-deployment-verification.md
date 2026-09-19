# Sticky header 운영 배포 검증

## 대상과 목적

- 대상: https://heap-forge.app, 배포 커밋 `b509059`.
- Vercel GitHub status에서 배포 완료를 확인한 뒤 읽기 전용으로 검사했다.
- 대상 문서: `/ko/docs/web/javascript-event-loop-runtime`, `/ko/docs/web/browser`.
- 목적: 초기 로딩 레이아웃, 문서 끝까지 sticky 유지, TOC 제목 위치, 성능 회귀 확인.
- 운영 캐시를 강제로 만료시키거나 콘텐츠를 수정하지 않았다.

## 원인과 검증 기준

기존 body의 `size-full`은 높이까지 제한했다. 데스크톱 Browser 문서가 약 6,918px인데 body는 800px여서, 스크롤 시 sticky 헤더가 부모의 끝에 밀려 화면 밖으로 올라갔다. `w-full min-h-screen`으로 변경한 배포에서는 body가 문서 전체 높이로 확장된다.

단순히 제목이 header bottom보다 아래인지 검사하면, header bottom 자체가 음수인 상황도 통과할 수 있다. 따라서 헤더의 top과 높이도 별도로 검사한다.

## 레이아웃 결과

| 화면 | 문서 | body 높이 | 검사 scrollY | 결과 |
| --- | --- | --- | --- | --- |
| 1280x800 | 이벤트 루프 | 2511.98px | 0, 856, 1712, 0 | 통과 |
| 1280x800 | Browser | 6918.27px | 0, 3059, 6118, 0 | 통과 |
| 390x844 | 이벤트 루프 | 3636.05px | 0, 1396, 2792, 0 | 통과 |
| 390x844 | Browser | 9572.73px | 0, 4365, 8729, 0 | 통과 |

16개 위치 모두 header top=0px, height=65px, bottom=65px, 가로 넘침=0px였다. 데스크톱 TOC 마지막 링크 클릭 후 제목 top은 각각 95.72px, 96.09px로 헤더 아래 약 31px 여유가 있었다. 모바일에서는 TOC가 숨겨져 클릭 검사를 하지 않았다.

초기 페인트 이후 레이아웃 샘플은 각각 698, 737, 722, 745개이며 설정한 위반 조건은 없었다. 모바일 Browser는 pending 상태를 관측하지 못했으므로 그 조합의 skeleton 전환을 이번 측정만으로 검증했다고 주장하지 않는다.

## 성능 측정과 한계

측정 완료: 2026-09-19 10:22 KST, Chromium 151.0.7922.34. 12회 모두 HTTP 200, 수집한 브라우저 오류 및 깨진 이미지 없음.

| 프로필 / 문서 | TTFB 중앙값 | LCP 중앙값 | 이전 LCP 중앙값 | 최대 CLS |
| --- | --- | --- | --- | --- |
| 데스크톱 / 이벤트 루프 | 0.736s | 1.228s | 1.560s | 0.000479 |
| 데스크톱 / Browser | 0.649s | 1.156s | 1.324s | 0.000479 |
| 모바일 / 이벤트 루프 | 0.645s | 2.384s | 2.412s | 0 |
| 모바일 / Browser | 0.753s | 1.988s | 2.400s | 0 |

비교 기준은 `../artifacts/2026-09-19-cls-deployment-verification.json`이다. 데스크톱 CLS 최댓값은 이전과 같고 모바일은 모두 0이다. 모바일 Browser LCP는 2.764s, 1.640s, 1.988s로 편차가 있다. 중앙값 감소를 sticky 수정의 성능 개선 효과로 단정하지 않는다. 해당 조합의 TTFB는 이전 0.620s에서 0.753s로 증가했지만, 표본 3회만으로 지속적 회귀인지 판단할 수 없다.

원시 성능 결과 및 레이아웃 요약은 [검증 artifact](../artifacts/2026-09-19-sticky-header-deployment-verification.json)에 저장한다. 성능은 문서 2개, 프로필 2개, 각 3회로 측정한다.

- 성능 측정의 데스크톱은 제한 없음. 모바일은 지연 150ms, 다운로드 1.6Mbps, 업로드 0.75Mbps, CPU 4배 제한이다.
- 별도 레이아웃 스크립트는 데스크톱과 모바일 모두 제한을 적용하며 reduced motion을 활성화한다. 두 스크립트의 소요 시간을 직접 비교하지 않는다.
- 매번 새 브라우저 컨텍스트를 사용하지만 CDN 및 서버 함수 캐시 상태는 통제하지 않는다. 첫 회가 반드시 cold start는 아니다.
- TTFB에는 네트워크 및 서버 대기가 포함된다. 순수 SSR 처리 시간으로 해석하지 않는다.
- LCP는 load 이후 5초까지 관측한 후보이며 CLS도 해당 관측 구간의 값이다. 장시간 사용, 실기기, Safari/Firefox, 실제 사용자 p75를 대표하지 않는다.
- 폰트 요청 완료 때문에 스크립트가 오래 걸리는 것과 화면의 주요 콘텐츠가 늦게 보이는 것은 구분해야 한다.

## 재현 명령

저장소 루트에서 실행한다. 운영 사이트 접근이 가능하고 Playwright Chromium이 설치되어 있어야 한다.

```sh
SHELL_OUTPUT=/tmp/heap-forge-sticky-fixed.json mise exec -- node apps/docs/scripts/verify-deployed-article-shell.cjs
PERF_OUTPUT=/tmp/heap-forge-after-sticky-fix.json mise exec -- node apps/docs/scripts/measure-deployed-performance.mjs
node --check apps/docs/scripts/verify-deployed-article-shell.cjs
```

네트워크 경쟁을 피하기 위해 두 측정은 순차 실행한다. 레이아웃 스크립트는 HTTP 상태, 초기 샘플 위반, 헤더 좌표, 가로 넘침, 데스크톱 TOC 위치가 조건을 어기면 실패 종료한다. 성능 스크립트는 결과 수, 각 error/errors, CLS/LCP를 JSON에서 별도로 확인해야 한다.

## 남은 점검

- 실기기 Safari/Chrome에서 긴 문서 및 회전 시 sticky/가로 넘침 확인.
- 모바일 Browser의 pending 상태 전환은 로컬 지연 fixture 등으로 별도 보장.
- 필드 데이터 누적 후 LCP/CLS p75 확인. 이번 소수 반복값으로 통계적 개선을 단정하지 않음.
