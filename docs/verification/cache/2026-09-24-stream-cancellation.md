# 게시 갱신 테스트의 스트림 조기 종료 재조사

## 대상과 조건

- 날짜: 2026-09-24 KST. 요청 이벤트의 시간은 UTC다.
- 대상: `1c7bac56a690233d320b1e4a2dc83627b277b3ba` 기반 작업 트리. 기존 Better Stack·Obsidian 미커밋 변경은 포함하거나 수정하지 않았다.
- Node 24.12.0, Next.js 16.3.4, Playwright 1.62.1, Chromium 390×844 모바일, 한국어.
- `content-publication.spec.ts` 한 시나리오를 세 번 순차 실행했다. 매번 production build와 loopback fixture를 시작했다. NAS·운영 webhook은 사용하지 않았다.

## 재현 방법

저장소 루트에서 다른 build·개발 서버를 실행하지 않은 상태로 수행한다. 두 포트 3111·3112가 비어 있어야 한다.

```bash
ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
ARTICLE_STREAM_TRACE=1 ARTICLE_DISABLE_PREFETCH=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
```

첫째·셋째 실행은 모든 요청을 서버로 전달한다. 둘째는 prefetch 헤더가 있는 요청만 Playwright에서 로컬 204 응답으로 대체한다. 세 조건 모두 동일한 route interception을 사용한다. 앱 코드·prefetch 설정·서버 로그 처리는 변경하지 않았다.

## 결과와 증거

| 조건               | 결과             | 서버 조기 종료 로그 | document 완료 / 실패 |
| ------------------ | ---------------- | ------------------- | -------------------- |
| prefetch 전달      | 1 passed (30.5s) | 2                   | 21 / 0               |
| prefetch 로컬 대체 | 1 passed (28.1s) | 0                   | 21 / 0               |
| prefetch 다시 전달 | 1 passed (30.5s) | 2                   | 21 / 0               |

세 실행 모두 V1 캐시 유지, 잘못된 인증의 갱신 거부, 정상 webhook 이후 V2 본문·목록·검색 반영을 검증했다. 브라우저 `pageerror` 부재 검사도 통과했다. 시간은 build를 포함한 Playwright 요약으로 성능 비교 수치가 아니다.

[집계와 오류 주변 이벤트](../artifacts/2026-09-24-stream-cancellation.json)는 로컬 로그에서 추출한 측정값·발췌다. 원본 임시 로그의 SHA-256을 함께 기록했다. 인증 헤더와 query 원문은 수집하지 않는다. 원본 임시 로그는 영구 보관물이 아니다.

첫 실행에서는 다음 순서가 관측됐다.

1. `06:45:33.113Z`: `/ko/docs/web/javascript-event-loop-runtime`의 fetch가 `prefetch=true`, `net::ERR_ABORTED`로 종료.
2. `06:45:33.121Z`: 다음 `/ko/docs` document 요청 시작.
3. 합쳐진 출력에서 `The destination stream closed early.` 로그 출력.
4. `06:45:33.189Z`: `/ko/docs` document 요청 완료.

설치된 Next.js 내부 `dist/compiled/react-dom/cjs/react-dom-server.node.production.js`의 `renderToPipeableStream`은 destination의 `close` 이벤트에 `createCancelHandler(request, "The destination stream closed early.")`를 등록한다(7820행). 핸들러는 렌더링 request를 abort한다(7567행). 이 코드는 오류 문구의 발생 경로를 설명하지만 특정 요청의 종료 원인을 단독으로 증명하지는 않는다.

브라우저 취소 이벤트, prefetch 대체 시 로그 소멸, 전달 복원 시 재발을 종합하면 **이번 fixture 시나리오의 로그는 빠른 화면 이동에 따른 prefetch 응답 취소와 연관된 것**으로 판단한다. 실제 읽는 문서의 본문 렌더링 실패나 webhook 실패로 관측된 것은 아니다.

## 한계와 후속 작업

- 서버 오류에 요청 ID가 없으므로 오류 한 줄과 특정 취소 요청을 일대일로 연결한 것은 아니다. 위 시각은 브라우저 이벤트 시각이며 서버 로그 자체에는 시각이 없다.
- route interception은 브라우저 HTTP 캐시를 비활성화한다. 각 조건 1회인 작은 표본이며 성능·발생률 측정이 아니다.
- 로컬 204는 유효한 RSC payload가 아니다. 해당 대조군에도 prefetch `requestfailed` 이벤트가 발생하며, 이는 사용자 document 실패나 서버 prefetch 처리 실패와 같은 의미가 아니다. 실제 방문 요청은 정상 서버 응답을 사용한다.
- 동일 메시지는 다른 응답 취소 상황에서도 발생할 수 있다. 운영의 본문 누락·document 실패·5xx·지속 timeout과 함께 나타나면 별도 장애로 조사한다. 이번 실험만으로 운영 로그 전체를 무시하지 않는다.
- 로그를 없애려고 전역 catch, 필터 또는 모든 링크의 `prefetch={false}`를 적용하지 않는다. 불필요한 서버 작업 비용이 측정될 때 특정 링크에 한정한 prefetch 정책을 별도 비교한다.
- 테스트 후 fixture build가 남는다. 일반 production 실행 전 실제 환경으로 다시 build한다.

## 관련 문서

- [상세 렌더링 회귀 절차](../../runbooks/docs-article-rendering-regression.md#스트림-조기-종료-진단)
- [09-19 기존 대조 실험](2026-09-19-content-publication-browser-test.md#스트림-조기-종료-후속-추적)
- [이번 작업 기록](../../worklog/2026-09/2026-09-24-stream-cancellation-investigation.md)
