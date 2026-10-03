# Production 성능 계측 연결 확인

## 대상과 조건

- 확인일: 2026-10-03, KST.
- 커밋: `56698eced968b56f64414bee3b98191b3199a3ac`, `feature/docs`.
- 배포: `<deployment-id>`, Production web-tech, Node 24.x. 실제 배포 ID는 공개 보고서에서 생략한다.
- 공개 요청 3개 및 Playwright Chromium의 독립 세션 2개. 실제 사용자 성능 표본이 아니라 연결 확인용이다.
- Vercel CLI 로그인 후 읽기 전용 프로젝트 API와 Runtime Logs 확인. 활성화·요금제·WAF·캐시 설정을 변경하지 않았다.

## 재현 방법

저장소 루트에서 본인 Vercel 계정으로 로그인한다. 토큰·쿠키를 명령어나 문서에 넣지 않는다.

```sh
vercel logs --project web-tech --scope hojeong-ims-projects --environment production --since 1h --query '<request-id>' --json --limit 20 --no-follow
vercel project inspect web-tech --scope hojeong-ims-projects
```

실제 요청 UUID도 공개 문서에서 생략했다. `<request-id>`는 새 응답의 `x-docs-request-id`로 바꾼다. CLI `--request-id`는 플랫폼 요청 ID 필터이므로 앱의 UUID에는 `--query`를 사용한다. 로그 보관 기간이 지나면 과거 로그를 조회할 수 없다.

## 결과와 증거

- 통과: `/ko/docs?q=React`, `/api/search?q=React`, `/ko/docs/web/javascript-event-loop-runtime`은 HTTP 200. 각각 다른 UUID를 발급하고 입력한 외부 UUID를 덮어썼다.
- 통과: 상세의 응답 요청 ID가 Runtime Logs의 아래 단계 및 `[docs.document_selection]`과 일치한다. 실제 ID는 생략하고 측정값만 유지했다. 선택 결과는 local/found였다.

| stage            | durationMs | outcome |
| ---------------- | ---------: | ------- |
| remote-detail    |      77.12 | success |
| document-load    |     117.07 | success |
| document-select  |     117.23 | success |
| content-render   |     177.24 | success |
| navigation-load  |       1.31 | success |
| navigation-build |      20.01 | success |

원격 조회 함수가 정상적으로 null을 반환해도 remote-detail은 success일 수 있다. 이 요청에서는 로컬 글이 선택됐다. 값은 겹치는 operation span이므로 합산하지 않고 전체 HTTP/CPU/렌더링 시간으로 해석하지 않는다.

- 통과: Speed Insights SDK 스크립트 `/70edc944da847b5f/script.js`는 HTTP 200, JavaScript 12,567 bytes. 빈 placeholder가 아니다. 경로는 배포별로 바뀔 수 있다.
- 관측: 프로젝트 API의 `speedInsights.hasData=false`, `webAnalytics.hasData=true`. hasData=false만으로 기능 비활성화라고 단정하지 않는다. 활성화 UI·플랜·과금·실사용자 지표는 확인하지 않았다.
- 관측: 두 Headless 브라우저 세션에서 Vercel vitals POST는 없었다. 공개 수집 코드에는 `navigator.webdriver` 또는 Headless UA를 감지하는 함수와 수집 시작의 `if(r())return` 조건이 있었다. 봇 감지를 우회하거나 인위적 지표를 주입하지 않았다.
- 미검증: 일반 브라우저 vitals 전송의 성공 응답, Dashboard 표본 반영, 모바일 p75, 서버 오류 hook 및 브라우저 취소의 배포 연결.

## 한계와 후속 작업

일반 브라우저에서 상세·검색을 이용한 뒤 탭을 전환하거나 페이지를 떠나 수집 요청을 확인한다. [공식 문제 해결 안내](https://vercel.com/docs/speed-insights/troubleshooting)는 blur/unload 시점의 전송과 역방향 프록시의 수집 경로 전달을 점검하도록 안내한다. 이 사이트는 Cloudflare RUM 요청도 관측되었으나 그것을 Vercel 수집 성공으로 간주하지 않았다.

프로젝트 Speed Insights 화면에서 활성화·할당량을 확인한 후 실제 모바일 표본을 확보한다. 공개 스크립트 성공만으로 비용 설정이나 데이터 수집 성공을 주장하지 않는다. 기존 Next/원격 로그 전체의 민감정보 정제, 전송 완료·강제 종료 판정은 이번 확인 범위가 아니다.

## 관련 문서

- [측정 절차](../../runbooks/docs-deployed-performance-measurement.md)
- [계측 구현 기록](../../worklog/2026-10/2026-10-03-docs-performance-observation.md)
