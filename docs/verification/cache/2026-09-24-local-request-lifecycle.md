# 로컬 요청 생명주기 계측 검증

## 대상과 조건

- 날짜: 2026-09-24 KST. artifact 이벤트 시각은 UTC.
- 기준 커밋: `1c7bac56a690233d320b1e4a2dc83627b277b3ba`에 로컬 계측 미커밋 변경을 더한 작업 트리.
- Node 24.12.0, Next.js 16.3.4, Playwright 1.62.1, Chromium 모바일 390×844·데스크톱 1280×800.
- production Next 3111, 콘텐츠 fixture 3112. NAS·운영 webhook·외부 로그 수집은 사용하지 않았다.
- 기존 Better Stack·Obsidian 미커밋 변경은 수정하지 않았다.

## 재현 방법

동일 checkout의 dev/build를 중지하고 3111·3112 포트를 비운 뒤 저장소 루트에서 순차 실행한다.

```bash
mise exec -- pnpm --filter docs test:article:prod
ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
```

첫 명령은 기존 렌더링·게시 갱신과 새로운 계측 테스트를 함께 실행한다. 둘째는 실제 화면을 이동하는 게시 갱신 시나리오의 요청별 진단이다. 테스트 옵션 없이 애플리케이션을 실행하면 계측 preload는 포함되지 않는다.

## 결과와 증거

초기 실행은 새 테스트의 `Promise.withResolvers` 타입 선언이 프로젝트 lib 설정에 없어 build 단계에서 실패했다. 저장소 tsconfig를 변경하지 않고 일반 Promise로 수정했다. 수정 후 중간 전체 suite는 74개가 통과했으며, 이후 오류 단계·버퍼 초과·클라이언트 ID 검사를 추가했다.

최종 전체 suite는 **80 passed (1.2m)**다. 기존 44개에 계측 검증 36개가 추가됐다(같은 HTTP/판정 시나리오는 모바일·데스크톱 project에서 각각 실행). production build와 타입 검사도 이 실행에서 통과했다. 변경 TypeScript 파일의 ESLint도 통과했다. 기본 모드의 기존 스트림 오류 8건은 그대로 출력되며 테스트 성공을 로그 무오류로 해석하지 않는다.

검증 항목:

- 정상 finish 후 close는 완료 1건으로 취급한다.
- 통제된 동일 요청 abort만 cancelled로 분류하고, prefetch 단절·부분 계측은 unknown으로 유지한다.
- 헤더 전/후 렌더링 오류, timeout, 실제 500은 failed로 남긴다. 200으로 시작한 응답도 예외가 아니다.
- upstream 복구 후 완료는 degraded이며 복구만 되고 종료가 없으면 unknown이다.
- 이벤트 버퍼 초과가 뒤늦은 fatal 오류를 감추지 않는다. 종료 후 기록된 오류도 판정에 반영한다.
- 로그 저장 실패가 HTTP 완료를 방해하지 않는지 확인한다.
- 민감값·임의 경로 마스킹, 기록 크기 제한, 요청 ID 독립성, 실제 Next 새로고침·동시 RSC 응답을 검사한다.

### 스트림 오류의 요청 연결

처음에는 request handler만 AsyncLocalStorage로 감쌌으나 응답 종료 이벤트에서 문맥이 없어 스트림 오류 2건이 연결되지 않았다. 테스트 서버의 개별 response 이벤트를 같은 문맥에 연결한 뒤에는 해당 오류를 서버 requestId에 연결할 수 있었다. Next 내부나 전역 ServerResponse prototype을 수정하지 않았다.

브라우저의 response를 기다리면 취소 시 로그가 지연·누락될 수 있어 이미 관측한 response ID만 읽도록 바꿨다. 종료 이벤트 자체가 없는 요청도 있으므로 dispatch 단계에 테스트 전용 clientProbeId를 기록한다. 브라우저 ID를 서버의 고유 requestId로 신뢰하지는 않는다.

최종 진단 실행은 **1 passed (29.0s)**, 실제 document **21건 완료·0건 실패**였다. 서버 스트림 오류 **2건 모두 요청 ID 및 브라우저 dispatch에 연결**됐고, ID 없는 스트림 오류는 0건이었다.

| 경로                              | prefetch | 상태 코드 | finish / close | 요청 시작부터 close까지 | 판정    |
| --------------------------------- | -------- | --------- | -------------- | ----------------------- | ------- |
| `/ko/docs/web/article-e2e-remote` | true     | 200       | false / true   | 135.23ms                | unknown |
| `/ko/docs/web/article-e2e-remote` | true     | 200       | false / true   | 79.03ms                 | unknown |

두 요청 모두 `started → closed → stream error` 순서였으며 오류 단계는 after-headers였다. 관측된 선행 오류는 없지만, Next 관측 범위가 partial이고 브라우저 종료 이벤트도 없어 **정상 취소 확정으로 낮추지 않았다**. 기존 prefetch 대조 실험의 연관성은 유지하되 이번에 확인된 사실은 해당 요청의 불완전한 응답 종료다.

[정제한 집계와 요청 이벤트 원본](../artifacts/2026-09-24-request-lifecycle.json)에 초기 미연결 결과와 최종 연결 결과, 원본 임시 로그 SHA-256을 보관한다. 최종 서버 요약 693개는 정적 리소스·준비 요청 등을 포함해 completed 645개·unknown 48개다. 이 숫자는 화면 방문 수나 장애율이 아니다. 브라우저 `search`는 q 유무, 서버 `queryPresent`는 내부 RSC query까지 포함한 모든 query 유무라 서로 다를 수 있다.

## 한계와 후속 작업

- 계측은 loopback fixture 전용이다. 운영 응답 완료·Vercel 강제 종료·onRequestError 수집·클라이언트 수신 완료는 검증하지 않았다.
- 실제 Next 오류는 console에서 관측한 부분 집합이다. 원본 로그를 숨기지 않으며 잡히지 않은 선행 오류가 없다고 보장하지 않는다.
- synthetic HTTP 시험의 render/timeout은 명시적으로 주입한 분류 신호다. 실제 Vercel deadline이나 모든 Next 렌더러 예외 경로를 재현한 것이 아니다.
- 분산 이벤트 재전송·중복 제거, 운영 retention, 수집 quota, 공유 작업 operationId는 아직 구현하지 않았다. 로컬의 이벤트 ID·순서·bounded buffer만 확인했다.
- 브라우저 진단은 interception을 사용하고 서버는 동기 파일 기록을 한다. 실행 시간과 요청 종료 시간은 성능 비교값이 아니다.
- fixture 결과는 실행마다 달라질 수 있다. 연결할 수 없는 오류는 계속 unknown으로 남기고 실제 문서 실패와 별도로 조사한다.
- 일반 개발 서버를 자동 시작하지 않았다. 테스트 서버는 종료되며 `.next`에는 fixture build가 남는다.

## 관련 문서

- [요청 생명주기 로그 정책](../../architecture/docs-request-lifecycle-logging-policy.md)
- [재현 절차](../../runbooks/docs-article-rendering-regression.md#로컬-요청별-계측)
- [기존 스트림 대조 실험](2026-09-24-stream-cancellation.md)
- [이번 구현 기록](../../worklog/2026-09/2026-09-24-local-request-lifecycle-probe.md)
