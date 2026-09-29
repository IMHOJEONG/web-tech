# 로컬 요청 생명주기 계측 재검증

## 대상과 조건

- 2026-09-26 KST, `feature/docs`의 `1c7bac56a690233d320b1e4a2dc83627b277b3ba`에 기존 미커밋 계측 변경을 포함한 작업 트리.
- Node 24.12.0, Next.js 16.3.4, Playwright 1.62.1. 전체 suite는 Chromium 모바일·데스크톱, 상세 진단은 모바일 한국어 게시 갱신 시나리오다.
- production Next 3111 및 콘텐츠 fixture 3112만 사용했다. 운영 NAS·webhook·외부 로그 수집은 호출하지 않았다.
- 애플리케이션 코드와 판정 정책은 이번 재검증에서 변경하지 않았다. ADR-0008은 운영 적용 전의 제안 상태를 유지한다.

## 재현 방법

동일 checkout의 dev/build를 멈추고 포트를 비운 뒤 저장소 루트에서 순차 실행한다.

```bash
mise exec -- pnpm --filter docs test:article:prod
ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
```

각 명령은 production build를 포함한다. 상세 진단은 `apps/docs/test-results/request-lifecycle/*.json`에 요청별 요약을 기록한다. 다음 Playwright 실행 시 결과가 교체되므로 먼저 보관한다.

## 결과와 증거

| 검사                         | 결과                                                     |
| ---------------------------- | -------------------------------------------------------- |
| 전체 회귀                    | 80 passed (54.7s), build·타입 검사 통과                  |
| 변경 계측 TypeScript ESLint  | 통과                                                     |
| 상세 게시 갱신 진단          | 1 passed (19.2s)                                         |
| 상세 진단의 document 요청    | 21건 완료, 0건 실패                                      |
| 전체 회귀의 스트림 오류 로그 | 8건, 숨기지 않음                                         |
| 상세 진단의 스트림 오류      | 2건 모두 서버 ID 및 브라우저 dispatch와 연결, 미연결 0건 |

두 오류 모두 `/ko/docs/web/article-e2e-remote`의 RSC prefetch 요청이다. HTTP 200 헤더를 보냈지만 `responseFinished=false`, `responseClosed=true`였다. 요청 시작부터 close까지 각각 39.98ms·53.97ms이며, `started → closed → stream error` 순서와 `after-headers` 단계를 기록했다.

관측된 선행 오류는 없지만 관측 범위는 `partial`이고, 이 두 요청의 브라우저 terminal 이벤트는 없었다. 따라서 **정상 취소로 확정하지 않고 unknown / prefetch-cancellation-suspected를 유지**한다. 다른 요청에서 관측한 ERR_ABORTED를 이 두 요청의 증거로 대체하지 않는다.

[정제한 집계와 요청 이벤트](../artifacts/2026-09-26-request-lifecycle-recheck.json)에 서버·브라우저 연결 기록과 원본 로그 SHA-256을 보관했다. 상세 진단의 서버 요약 748개는 completed 695개·unknown 53개이며, 정적 리소스·준비 요청 등을 포함하므로 방문 수나 장애율이 아니다.

원본 임시 로그는 `/tmp/docs-lifecycle-suite-20260926.log`, `/tmp/docs-lifecycle-trace-20260926.log`에 있다. 09-24 결과를 덮어쓰지 않고 별도 증거로 남겼다.

## 한계와 후속 작업

- 테스트 통과는 스트림 오류가 없거나 정상이라는 뜻이 아니다. 이번 결과도 요청 연결과 불완전 종료까지 확인한 것이다.
- 계측은 Playwright preload 전용이며 일반 dev/start와 Vercel 운영에 적용되지 않는다. Preview의 onRequestError·요청 ID·강제 종료 연결 검증은 남아 있다.
- console 부분 관측으로 모든 선행 오류를 포착했다고 보장할 수 없다. 응답 close와 실제 소켓 종료·사용자 수신 완료도 구분한다.
- 진단 모드의 요청 interception과 동기 파일 기록이 실행 시간에 영향을 주므로 이전 실행과 성능을 비교하지 않는다.
- 테스트 서버는 실행 후 종료된다. `.next`에는 fixture build가 남으므로 일반 production 확인 전에는 정상 환경으로 다시 build한다.

## 관련 문서

- [이전 검증](2026-09-24-local-request-lifecycle.md)
- [요청 생명주기 정책](../../architecture/docs-request-lifecycle-logging-policy.md)
- [ADR-0008](../../architecture/adr-0008-request-lifecycle-observability.md)
- [재현 runbook](../../runbooks/docs-article-rendering-regression.md#로컬-요청별-계측)
- [이번 작업 기록](../../worklog/2026-09/2026-09-26-request-lifecycle-recheck.md)
