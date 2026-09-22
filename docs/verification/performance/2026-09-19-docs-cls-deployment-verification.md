# CLS 수정 배포 검증

## 대상과 조건

`be0fd6a`를 포함한 `2ab3580`의 Vercel web-tech 배포 success 및 운영 HTML 변경을 확인했다.
측정 종료: 2026-09-18 15:09:11 UTC / 2026-09-19 00:09:11 KST.
초기 로딩 시 CLS 약 1.0은 12회 모두 재현되지 않았다. 깊은 스크롤의 sticky header 문제는 별도로 발견했다.

## Changed

검증 스크립트와 원본 결과를 보존했다. 운영 코드 수정/배포/커밋/푸시는 하지 않았다.

- `apps/docs/scripts/verify-deployed-article-shell.cjs`
- `docs/verification/artifacts/2026-09-19-cls-deployment-verification.json`

## 결과와 증거

기존과 같은 새 Chromium context, desktop 1280×800,
mobile 390×844 / 150ms latency / 1.6Mbps down / 0.75Mbps up / CPU 4배 제한.
각 조건 3회 중앙값. 기존 baseline은 폰트 최적화 이후/CLS 수정 이전 값이다.

| 조건 / 글             | 이전 LCP | 이번 LCP | 이번 TTFB | 이번 CLS 최대 |
| --------------------- | -------- | -------- | --------- | ------------- |
| desktop / 이벤트 루프 | 1.424s   | 1.560s   | 0.871s    | 0.000479      |
| desktop / Browser     | 1.268s   | 1.324s   | 0.806s    | 0.000479      |
| mobile / 이벤트 루프  | 2.372s   | 2.412s   | 0.764s    | 0             |
| mobile / Browser      | 2.396s   | 2.400s   | 0.620s    | 0             |

- 모두 HTTP 200, 관측된 pageerror/HTTP 오류/완료된 깨진 이미지 없음.
- desktop 3회에서 작은 CLS 0.000479, 나머지 9회는 0.
- 이전 desktop CLS 최대 1.00018과 같은 큰 이동은 관측되지 않음.
- LCP가 동일하다고 단정하지 않는다. 수십~백여 ms 차이가 있고 TTFB/측정 시각/캐시는
  통제되지 않았다. 소수 실험실 표본이며 field p75가 아니다.

## 공간 유지 검사

두 글 × desktop/mobile 4회 모두 느린 네트워크 및 CPU 제한으로 추가 검사했다.
reduced-motion 환경에서 FCP 이후 16ms 간격으로 geometry를 샘플링했다.

- 샘플 수: 664 / 742 / 673 / 704.
- header height=65px, footer top >= viewport height, 가로 overflow <=1px 조건 위반 0.
- 4회 중 3회에서 실제 article-pending 표시를 관측. 나머지 1회는 로딩 UI 표시를 포착하지 못함.
- 검사 범위는 초기 스크롤 0 상태이며 프레임 전체에 대한 완전한 보장은 아니다.
- 짧은 글의 여백 UX, Safari/실물 기기는 이번에 검증하지 않았다.

## 별도 발견: 깊은 스크롤에서 sticky header 이탈

desktop TOC로 글 하단에 이동했을 때 헤더 bottom=-317px / -4374px로 화면 밖으로 사라졌다.
타깃 제목은 약 96px 지점에 도착했지만 헤더가 남아 있지 않으므로 전체 TOC/header UX 통과로
표시하면 안 된다.

Browser 글에서 별도 좌표 확인:

```text
viewport height: 800px
body height: 800px
body scrollHeight: 6918px
scrollY=0:    header top=0,    bottom=65
scrollY=1500: header top=-765, bottom=-700
```

body의 `flex size-full min-h-screen flex-col`에서 size-full이 height:100%를 만들고,
body 자체는 800px인 채 자식 콘텐츠만 넘친다. sticky 요소가 containing block 끝에
도달하면서 더 이상 viewport 상단에 남을 수 없는 구조와 일치한다.
이 클래스는 이번 CLS 수정 이전부터 존재했다. 새 CLS 회귀라고 단정하지 않는다.

후속 수정 후보: body는 `w-full min-h-screen`으로 자연스럽게 문서 높이만큼 늘어나게 하고,
초기 shell 최소 높이는 유지한다. 수정 후 TOC뿐 아니라 일반 스크롤에서도 header top=0,
height=65px를 함께 검사해야 한다.
기존 TOC 테스트처럼 target top >= header bottom만 확인하면 음수 header bottom으로도 통과한다.

## 재현 방법

```sh
PERF_OUTPUT=/tmp/heap-forge-after-cls.json mise exec -- node apps/docs/scripts/measure-deployed-performance.mjs
mise exec -- node apps/docs/scripts/verify-deployed-article-shell.cjs
```

후자는 public 페이지 4회 이동, 느린 환경 geometry 및 TOC 좌표 기록을 수행한다.
출력 `/tmp/heap-forge-cls-shell-check.json`은 진단값이며 자동 합격 판정을 하지 않는다.
보존한 결과 JSON에는 성능 원본, geometry 요약(최솟값/최댓값·위반 기록), 별도 sticky 진단을 포함한다.

## 한계와 후속 작업

폰트/내비게이션의 작은 이동, 짧은 글의 하단 공간, 실제 사용자 field 지표는 별도 추적한다.

## Next

body 높이 제약과 깊은 스크롤 sticky header 문제를 독립 작업으로 수정하고 회귀 테스트를 보강한다.

## 관련 문서

- [배포 성능 측정 절차](../../runbooks/docs-deployed-performance-measurement.md)
- [Sticky header 후속 검증](2026-09-19-docs-sticky-header-deployment-verification.md)
