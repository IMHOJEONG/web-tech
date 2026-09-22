# 게시 갱신 브라우저 검증

## 대상과 조건

- 날짜: 2026-09-19 KST.
- 대상: `93810aa` 기반 `feature/docs` 미커밋 작업 트리. 다른 작업의 미커밋 변경도 있으므로 커밋 단위 인증이 아니다.
- 환경: Node.js 24.12.0, Next.js 16.3.4, Playwright 1.62.1, Chromium.
- 조건: 한국어/영어와 390px 모바일/1280px 데스크톱의 게시 갱신 4개 조합.
- 데이터: localhost 원본 fixture, 테스트 전용 인증, TTL 3600초. 운영 서버에는 접속하지 않는다.

## 재현 방법

저장소 루트에서 의존성과 Playwright Chromium이 설치된 상태로 실행한다.
같은 checkout에서 다른 build나 article E2E를 동시에 실행하지 않는다.

```sh
mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts
```

기존 상세 검사까지 함께 실행하려면 파일 인자를 생략한다.
실행 후 `.next`에는 fixture 설정의 build가 남으므로 일반 실행 전 다시 build한다.

## 결과와 증거

게시 갱신 spec 단독 실행은 4개 모두 통과했다. 첫 성공 실행은 47.7초,
부가 영역 렌더링 완료 대기를 추가한 재실행은 52.4초로 종료 코드 0이었다.
시간은 Playwright 실행 요약이며 개별 화면의 렌더링 지연이나 운영 SLA가 아니다.

| 검증                            | 실제 결과                          |
| ------------------------------- | ---------------------------------- |
| 원본만 V2로 변경                | API는 V2, 목록·검색·상세는 V1 유지 |
| 토큰 누락/불일치/읽기 전용 토큰 | 모두 401, V1 유지                  |
| 정상 revalidation 토큰          | 200, `revalidated: true`           |
| webhook 응답 캐시 방지          | 성공·실패 모두 `private, no-store` |
| 이미 열린 상세 화면             | webhook만으로는 V1 DOM 유지        |
| 새로고침과 다음 목록·검색 요청  | 제목·요약·본문 마지막 문장 모두 V2 |
| 새 요약/이전 요약 검색          | 각각 결과 있음/없음                |
| 처리되지 않은 브라우저 오류     | 네 조합 모두 없음                  |

두 차례 초기 전체 실행 시도는 다른 테스트가 3112 포트를 사용하여 시작 전에
중단되었다. 다른 작업의 서버는 종료하지 않았다. 최종 실행은 신규 spec만
대상으로 했으므로 전체 article suite 통과를 뜻하지 않는다.

서버에는 `The destination stream closed early.` 로그가 두 성공 실행 모두
남았다. 부가 영역 DOM까지 기다리는 것만으로 없어지지 않았다. 페이지 이동 시
prefetch/stream 취소가 원인일 가능성은 있지만 원인을 확정하지 않았으며,
오류를 숨기거나 테스트 결과에서 제거하지 않았다. 후속 진단 대상으로 남긴다.

신규 테스트·fixture·config의 ESLint 및 `git diff --check`도 통과했다.
별도의 trace artifact는 통과 시 보존하지 않으며, 이 문서에 명령과 관측 결과를
기록한다. 실패 시 trace 위치는 실행 절차 문서를 따른다.

## 한계와 후속 작업

- 문서 파일 파싱부터 NAS API까지는 fixture가 대체한다. NestJS 실제 파일 감시나 NAS 연결 검증이 아니다.
- 열린 페이지의 자동 갱신과 client Router Cache의 모든 이동 조합은 범위 밖이다.
- 생산 환경 WAF, CDN, Vercel runtime 제한은 별도로 확인해야 한다.
- 아래 후속 추적으로 테스트의 prefetch 취소와 조기 종료 로그 관계를 확인했다. 운영에서 같은 메시지가 발생하면 요청을 다시 구분해야 한다.

## 스트림 조기 종료 후속 추적

2026-09-19 KST, `cc954d4` 기반 작업 트리에서 한국어/모바일 게시 테스트 한 건을
대상으로 비교했다. 앞선 실행의 원인 미확정 기록은 당시 결과로 보존한다.
`cc954d4`는 부가 영역 스트리밍 구현 커밋이며 테스트와 진단 코드는 미커밋 상태다.

| 실행 조건                             | 테스트 결과      | 조기 종료 로그 | document 완료 / 실패 |
| ------------------------------------- | ---------------- | -------------- | -------------------- |
| 원래 요청 흐름 + 브라우저 이벤트 기록 | 1 passed (26.1s) | 2회            | 21 / 0               |
| prefetch만 로컬 204 응답으로 대체     | 1 passed (25.3s) | 0회            | 21 / 0               |
| 동일 route 계측, prefetch 서버 전달   | 1 passed (24.8s) | 2회            | 21 / 0               |

대조군의 실제 기록 일부(UTC):

```text
07:31:42.810 request       /ko/docs/web/javascript-event-loop-runtime fetch prefetch=true
07:31:42.835 requestfailed /ko/docs/web/javascript-event-loop-runtime fetch prefetch=true net::ERR_ABORTED
07:31:42.840 request       /ko/docs document prefetch=false
[WebServer] Error: The destination stream closed early. digest: 3817797001
07:31:42.883 requestfinished /ko/docs document prefetch=false
```

첫 실행에서는 `/ko/docs/web/bytecode`도 다음 페이지 이동 직전에 `ERR_ABORTED`였다.
두 경로는 현재 게시 검증 본문이 아닌 다른 문서다. Next 링크의 prefetch가 실행된 뒤
빠른 화면 이동으로 취소되는 흐름이며, 본문·부가 영역 DOM 완료 대기만으로 이 별도
요청까지 완료되는 것은 아니다.

설치된 Next.js의 `dist/compiled/react-dom/cjs/react-dom-server.node.production.js`에서
`renderToPipeableStream`은 destination의 `close` 이벤트에 해당 메시지를 전달하는
`createCancelHandler`를 등록한다. 이 핸들러는 진행 중 렌더링을 abort한다.
이번 실험은 캐시 무효화 실패가 아니라 prefetch 응답 취소로 발생한 로그라는 판단을
뒷받침한다. 서버 로그에는 요청 ID가 없으므로 특정 오류 한 줄과 특정 취소 요청을
일대일로 연결했다고 주장하지 않는다.

진단 명령은 [회귀 테스트 절차](../../runbooks/docs-article-rendering-regression.md#스트림-조기-종료-진단)를 따른다.
전체 원본 로그는 이번 로컬 세션의 `/tmp/docs-stream-trace.log`,
`/tmp/docs-stream-no-prefetch.log`, `/tmp/docs-stream-control.log`에 저장했다.
임시 파일은 영구 artifact가 아니므로 주요 관측값과 비밀정보 없는 발췌를 위에 남겼다.

각 조건은 한 번씩 실행했다. 테스트의 route interception 자체가 브라우저 HTTP 캐시를
끄므로 마지막 대조군도 같은 interception에서 모든 요청을 그대로 전달했다.
prefetch 대체 모드는 정상 회귀 검증이나 성능 측정 결과로 사용하지 않는다.
앱의 prefetch 동작과 서버 오류 로깅은 변경하지 않았으며 Vercel/NAS에서는 미검증이다.

진단 옵션 없이 전체 suite를 최종 재실행하여 `22 passed (1.0m)`를 확인했다.
정상 모드의 스트림 종료 로그는 그대로 남으며 숨기지 않았다. 진단 spec의 ESLint는
경고 없이 통과했다. 테스트 전용 옵션은 Turbo 캐시 작업이 아니라 직접 실행하는
Playwright 프로세스에서만 읽도록 근거를 명시했다.

## 관련 문서

- [게시 갱신 실행 절차](../../runbooks/docs-article-rendering-regression.md#게시-후-화면-갱신)
- [캐시 프로덕션 통합 시험](../../runbooks/docs-content-cache-production-test.md)
- [변경 이력](../../worklog/2026-09/2026-09-19-content-publication-browser-test.md)
