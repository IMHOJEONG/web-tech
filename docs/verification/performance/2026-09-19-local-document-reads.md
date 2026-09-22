# 상세 요청의 로컬 문서 읽기 중복 제거 검증

## 대상과 조건

- 날짜: 2026-09-19 KST.
- 기준: `fda9022`, `feature/docs`의 미커밋 작업 트리.
- 환경: Node.js 24, Next.js 16.3.4, Playwright 1.62.1, 로컬 production build/start.
- 운영 NAS 대신 기존 loopback content fixture를 사용했다.
- 대상 요청: `/ko/docs/web/javascript-event-loop-runtime`의 HTML 전체 응답.
- 수정 전 1개 요청, 수정 후 모바일/데스크톱 프로젝트에서 각 2개 요청, 총 4개 요청.
  읽기 검사는 APIRequestContext를 사용하므로 viewport 자체의 영향은 측정하지 않는다.

## 재현 방법

저장소 루트에서 Node.js 24와 Playwright Chromium을 준비한다. 다른 개발 서버나
빌드와 동시에 실행하지 않는다.

```sh
pnpm --filter docs test:article:prod local-document-reads --project=article-mobile
pnpm --filter docs test:article:prod
pnpm --filter docs exec eslint lib/get-document.ts article-e2e/local-io-probe.ts article-e2e/local-document-reads.spec.ts playwright.article.config.ts --max-warnings 0
```

테스트 전용 Node preload가 `fs.readFileSync`, `fs.readdirSync`를 감싸고 요청별
AsyncLocalStorage에서 횟수를 집계한다. 응답 finish 시 계측 JSON을 기록한다.
테스트는 본문과 부가 영역이 있는 응답 전체를 받은 뒤 JSON을 검사하고 attachment로 남긴다.
특정 UUID 헤더가 있는 요청만 기록하므로 다른 테스트의 prefetch는 집계에 섞이지 않는다.

## 결과와 증거

| 측정값                  | 수정 전 | 수정 후 각 요청 |
| ----------------------- | ------- | --------------- |
| 읽은 Markdown 파일 종류 | 15      | 15              |
| 파일 읽기 총횟수        | 30      | 15              |
| 파일당 최대 읽기        | 2       | 1               |
| 디렉터리 조회           | 32      | 16              |

수정 전 회귀 테스트는 `Expected: 1 / Received: 2`로 의도대로 실패했다.
수정 후 연속 요청 각각에서 파일 읽기가 발생하며 모두 파일당 1회를 만족했다.
이는 한 요청 안의 중복 제거이며 요청 간 파일 읽기를 생략한 결과가 아니다.

- 전체 결과: **24 passed (1.0m)**. 기존 상세 16개, 스트리밍 2개, 게시 갱신 4개, 읽기 계측 2개.
- production build의 타입 검사 및 변경 코드 ESLint 통과.
- 기존 prefetch 취소의 `destination stream closed early` 로그는 남아 있으며 숨기지 않았다.
- [집계 증거](../artifacts/2026-09-19-local-document-reads.json): 실제 출력에서 옮긴 횟수. 시각·지연 시간 추정값은 포함하지 않는다.

## 한계와 후속 작업

### 추가 회귀 검증

같은 날짜에 읽기 검사를 로컬 data, 로컬 category, 원격 HTML과 ko/en 경로로
확장했다. 각 경로를 연속 두 번 요청하고, 세 종류의 문서를 동시에 요청하는 검사도
추가했다. 각 테스트는 모바일/데스크톱 프로젝트에서 실행하지만 I/O 검사는 HTTP
요청 기반이므로 기기별 성능 측정으로 해석하지 않는다.

- 전체 production suite: **36 passed (59.8s)**.
- 계측한 30개 요청 모두 `uniqueFiles=15`, `totalReads=15`, `maxReadsPerFile=1`, `directoryReads=16`.
- 관련 문서/이어 읽기 단위 테스트: **9개 통과**. 입력 배열·객체·태그를 동결한 상태에서도 계산이 성공하고 원본이 유지된다.
- 변경 테스트 ESLint 통과. I/O JSON은 Zod로 형식 검증 후 사용하도록 보강했다.
- 기존 prefetch 취소 로그는 남아 있다. 오류 숨김이나 운영 설정 변경은 하지 않았다.

```sh
pnpm --filter docs test:article:prod
pnpm --filter docs exec node --experimental-strip-types --test lib/article-related-documents.test.ts lib/article-reading-navigation.test.ts
```

현재 소비 코드에서는 공유 객체를 변경하는 동작을 발견하지 않았다. 다만 배열 복사는
얕은 복사이므로 향후 문서 객체 변경을 타입 수준에서 방지하려면 readonly 계약을
별도로 검토할 수 있다. 불필요한 deep clone이나 deep freeze는 운영 코드에 추가하지 않았다.

- 파일 I/O 횟수 개선이지 TTFB/LCP 50% 개선을 의미하지 않는다.
- 동기 파싱·본문 렌더링 CPU 비용은 남는다. 요청 간 렌더 결과 캐시는 아직 적용하지 않았다.
- 파일을 실제로 수정하는 시험은 하지 않았으며, 다음 요청의 재읽기와 기존 원격 게시 갱신 테스트를 검증했다.
- 검색/카테고리의 별도 파서, 비동기 fs API, Vercel/NAS 실측은 범위 밖이다.
- 테스트 계측 코드가 포함된 production 테스트 build는 운영 배포 검증의 대체물이 아니다.

## 관련 문서

- [측정·운영 절차](../../runbooks/docs-article-streaming-performance.md)
- [구현 기록](../../worklog/2026-09/2026-09-19-local-document-request-cache.md)
