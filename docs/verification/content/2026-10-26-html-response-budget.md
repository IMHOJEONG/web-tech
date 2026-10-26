# 상세 HTML 응답 크기 제한 검증

## 대상과 조건

- 확인일: 2026-10-26 KST. 기준 원격 HEAD `3609ff2`의 검색 브랜치에서 진행한 미커밋 상세 후속이다.
- Node24·pnpm12.14.0. 별도 HTML 경고512KiB·상한1MiB를 공유 상수·NestJS 생산자·docs 소비자에 적용했다.
- 임시 디렉터리의 합성 published Markdown, 실제 AppModule·MarkdownIt 렌더러·HTTP와 프론트의 실제 원본 선택/정규화 경로를 사용한다. 기존 목록·사용자 동선 E2E·NAS/H1/primary 미커밋은 보존했다.
- 실제 NAS/운영 API·토큰·웹훅·배포는 변경하지 않았다. 생성한 HTML은 공개 글로 게시하지 않는다.

## 재현 방법

저장소 루트에서 실행한다. backend HTTP·production E2E·일부 저장소 검사는 로컬 리스너와 Chromium 실행 권한이 필요하다.

```sh
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter @web-tech/docs-content-contract lint
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec eslint lib/content-api.ts lib/content-api-resilience.test.ts --max-warnings 0
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs-backend exec jest --runInBand --runTestsByPath src/modules/content/content-html-budget.spec.ts --json --outputFile=/private/tmp/html-budget-unit-20261026.json
mise exec -- pnpm --filter docs-backend exec jest --config ./test/jest-e2e.json --runInBand --runTestsByPath test/html-budget.e2e-spec.ts --json --outputFile=/private/tmp/html-budget-http-20261026.json
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts --reporter=json
```

## 결과와 증거

### 전체 HTML의 경계

본문 안의 `<>&` 반복 코드가 실제 escape돼 원문보다 커지는 것을 HTTP로 확인한다. 최종 HTML 크기를 기준으로 padding을 조절해 아래 경계를 만들었다. 단위는 UTF-8 bytes이며 doctype·html/body/article wrapper를 포함한다.

| 렌더 결과 bytes | 기대/관측                        | 본문                                            |
| --------------- | -------------------------------- | ----------------------------------------------- |
| 524288          | 200·생산자 경고 없음 (단위 검사) | 끝 marker·wrapper 유지                          |
| 524289          | 200·생산자 수치 경고             | 끝 marker·wrapper 유지                          |
| 1048576         | 200·생산자 수치 경고             | 정확히 상한의 전체 HTML 반환                    |
| 1048577         | 503·생산자 수치 오류             | 원문/인증값 없는 작은 오류 응답, 절단 본문 없음 |

실제 Markdown 표1000행은 header 포함 `<tr>`1001개와 마지막 `value-999`를 유지했다. frontend도 긴 code2048줄·table1000행을 정규화한 뒤 `CODE_TAIL`·`VALUE_999`를 보존했다. 경계 위 HTML 상세를 거절해도 같은 문서의 검색 텍스트가 목록 상한 안이면 실제 `/api/posts`는200·문서1개와 tail을 유지했다. frontend의 목록/검색도 상세를 요청하지 않고 정상 metadata를 사용했다.

### 오류와 fallback

- 원격 HTML을 헤더 없이 과대하게 보내거나 과대한 Content-Length를 보내면 로컬 사본으로 대체했다.
- 압축 헤더에 작은 Content-Length가 남아 있어도 압축 해제 후처럼 전달된 큰 청크를 검사했다. 이 상세 모의 응답은 gzip 자체를 전송한 시험은 아니며, 기존 공통 reader의 실제 gzip 해제 회귀와 구분한다.
- 같은3조건에서 로컬 사본이 없는 원격 전용 글은 `too-large`를 throw했다. null/없는 글404로 바꾸지 않았다.
- 목록1회·선택한 상세1회만 요청했다. 자동 retry나 다른 문서 상세 fan-out은 없다. 기존 deadline·캐시/웹훅·UI는 바꾸지 않았다.
- size 오류 객체에 Request·Authorization·Bearer가 없음을 검사했다. 백엔드 size 로그는 event·bytes·limitBytes만 기록한다.
- 무인증은 문서 읽기 전에401, 실제 없는 route는404다. 이미 열린 화면의 갱신 정책과 연결 상태는 기존 범위를 유지한다.

### 회귀 결과

공유28·backend 단위31개/HTTP45개·docs 라이브러리307개·저장소153개가 통과했다. shared ESM/CJS/Nest build·앱/테스트 타입·관련 lint도 통과했다. 신규 backend 단위5개·HTTP3개를 JSON reporter로 재검사했고 이8개는 전체 backend31/45개에 포함되는 중복 재검사다. 최종 production E2E162개도98.9초에 통과했고 retry/skip/flaky·runner errors0이었다. 기존 의도한 upstream/중단 로그를 모두 무해하다고 새로 판정한 것은 아니다.

[정제한 증거](../artifacts/2026-10-26-html-response-budget.json)에 경계·실제 JSON reporter·소스8개 blob·빌드ID를 보존했다. 공통 reader/회귀2개는 앞선 목록 작업의 구현을 변경 없이 재사용한 문맥 증거다. 원시 report/log는 artifact에 적은 머신 내부 `/private/tmp/`에만 두고 인증 헤더·환경 파일·실제 콘텐츠는 복사하지 않았다. 테스트 리스너3111/3112는 종료됐다. 읽기 전용 문서 delta·명시 파일 Prettier·diff 검사도 통과했고 인덱스는 비어 있다. 소스8blob 및 기존 목록/동선 E2E·NAS/H1/primary 미커밋 hash를 대조해 보존을 확인했다.

## 한계와 후속 작업

이1MiB는 애플리케이션의 초기 보호 기준이지 실제 NAS 처리 한계·운영 문서 분포·Next 캐시 적중·메모리 OOM 방지를 증명하는 수치가 아니다. 프론트는 원격 응답을 normalize/sanitize하기 전에 제한하지만 backend 원문 읽기·검증/렌더링 비용과 이미 도착한 청크/Next buffering은 제한 이전에 발생한다. normalize·하이라이팅이 생성한 후속 마크업/DOM 크기를 재제한하지 않는다.

외부 이미지·영상 bytes, 로컬 MDX, 공개 검색 결과의 별도 budget, 실제 NAS corpus·동시 부하·cold start·peak 메모리는 미검증이다. 목록 inline body는 기존 목록 상한이 보호하며 우선순위를 바꾸지 않았다. 실제 운영 문서 용량 확인 뒤 배포 여부를 따로 판단해야 한다. 이번 커밋·푸시·PR·운영 조치는 하지 않았다.

## 관련 문서

- [ADR-0021](../../architecture/adr-0021-content-html-byte-budget.md)
- [API 계약](../../architecture/blog-content-api-contract.md#상세-html-응답-크기-제한)
- [앞선 목록 크기 검증](../performance/2026-10-26-search-payload-budget.md)
- [작업 기록](../../worklog/2026-10/2026-10-26-html-response-budget.md)
