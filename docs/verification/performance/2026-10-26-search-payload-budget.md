# 원격 검색 목록 크기·대규모 비용 검증

## 대상과 조건

- 확인일: 2026-10-26 KST. 원격 HEAD `3609ff2` 기반 같은 검색 브랜치의 미커밋 보완.
- Node v24.12.0, pnpm12.14.0, Apple M1 Pro. 합성 공개 문서10·100·1000개, 문서별 검색 텍스트512·8192·32768 UTF-8 bytes의9조건.
- 실제 공유 스키마·원격 metadata/search 어댑터·순위 함수를 사용한다. 각 단계 warmup1회 제외 후5회 중앙값·최댓값을 측정했다. p95나 운영 SLO가 아니다.
- loopback HTTP·production E2E에는 synthetic 토큰만 사용했다. 실제 NAS/외부 API/운영 웹훅·인증정보·배포는 변경하지 않았다. 기존 캐시/사용자 동선 E2E·NAS/H1/primary 미커밋은 보존했다.

## 재현 방법

저장소 루트에서 실행한다. backend HTTP·production E2E·일부 저장소 검사는 로컬 리스너와 Chromium 실행 권한이 필요하다.

```sh
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter @web-tech/docs-content-contract lint
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts --reporter=json
mise exec -- pnpm --filter docs exec node --experimental-strip-types scripts/measure-search-payload.ts
mise exec -- pnpm --filter docs exec eslint lib/content-api-request.ts lib/content-api-request.test.ts lib/content-api.ts lib/remote-body-search.test.ts lib/search-payload-fixture.ts lib/search-payload-scale.test.ts scripts/measure-search-payload.ts --max-warnings 0
```

측정은 다른 큰 검사가 끝난 뒤 다시 실행한 마지막 JSON을 채택했다. 네트워크·파일 읽기·Markdown 추출·Next 캐시를 측정하지 않는다. 메모리 최대 사용량이나 동시 요청 처리량도 재지 않았다. 크기 초과 corpus는 HTTP 로더가 수락한 것이 아니라 로컬에서 비용을 비교한 대조군이다.

## 결과와 증거

[정제한 증거](../artifacts/2026-10-26-search-payload-budget.json)에9조건의 원본 측정값·metadata-only 크기·gzip 크기·검색별 일치 수/중앙값/최댓값·소스11개 blob·빌드ID와 회귀 결과를 보존했다. benchmark의 JSON 출력은 합성 데이터의 집계만 포함한다. 원시 production report·테스트 로그는 artifact에 기록한 머신 내부 `/private/tmp/`에만 두고 인증 헤더·환경 파일·본문 원문을 복사하지 않았다.

### 크기와 비용

시간은 ms 중앙값이다. 검색 열은 모든 문서가 일치하는 `event loop` 조건이며 나머지 마지막 문서 본문 전용 키워드1건·미일치0건은 artifact에 있다. 정상/경고/거절 기준은 [ADR-0020](../../architecture/adr-0020-content-posts-byte-budget.md)이며 동일 크기라도 장비·부하에 따라 시간이 달라진다.

| 문서 수 | 본문 bytes/개 | 전체 JSON bytes | 정책   | JSON parse+스키마 | 어댑터 | 전체 일치 순위 |
| ------- | ------------- | --------------- | ------ | ----------------- | ------ | -------------- |
| 10      | 512           | 8,103           | accept | 0.259             | 0.075  | 0.057          |
| 10      | 8192          | 84,903          | accept | 0.155             | 0.069  | 0.442          |
| 10      | 32768         | 330,663         | accept | 0.274             | 0.066  | 1.643          |
| 100     | 512           | 81,273          | accept | 0.956             | 0.409  | 0.46           |
| 100     | 8192          | 849,273         | warn   | 1.334             | 0.238  | 3.754          |
| 100     | 32768         | 3,306,873       | reject | 1.865             | 0.252  | 13.669         |
| 1000    | 512           | 816,573         | warn   | 3.741             | 2.055  | 4.232          |
| 1000    | 8192          | 8,496,573       | reject | 10.32             | 1.805  | 35.953         |
| 1000    | 32768         | 33,072,573      | reject | 22.192            | 1.66   | 139.628        |

100개×8KiB는849,273 bytes로 경고 구간이다. 1000개×512 bytes도816,573 bytes로 허용되므로 문서 수만으로 상한을 정하지 않았다. 1000개×8KiB는8,496,573 bytes, 1000개×32KiB는33,072,573 bytes로 거절된다. 반복적인 합성 텍스트여서 gzip이 실제 블로그보다 과도하게 잘 압축될 수 있다. 전송 크기가 작아도 JSON·파싱·검색 비용은 사라지지 않으며 gzip 크기를 budget으로 쓰지 않는다.

### 회귀

| 범위           | 결과                                          | 관측                                                                                                    |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 공유 계약      | 28개·ESM/CJS build·lint 통과                  | 기존 선택 searchText·구형 payload 유지                                                                  |
| backend        | 단위26개·HTTP42개·lint/type/build 통과        | 정확한 경고·상한 경계, 전체 거절503·수치 로그·응답 인증정보 미노출, 인증이 목록 생성보다 먼저 실행      |
| docs           | 라이브러리301개·앱/테스트 타입·변경 lint 통과 | split UTF-8, 헤더 누락/오류/과소기재, 실제 gzip 해제, 초과 취소·비밀값 없는 오류·local fallback·요청1회 |
| 대규모 정확성  | 1000개×8KiB 대조군 통과                       | 마지막 문서의 본문 끝 키워드가 probe-999로1건, 미일치0건. HTTP 수락을 뜻하지 않음                       |
| 저장소         | 153개 통과                                    | 기존 검사·보안 회귀 유지                                                                                |
| production E2E | 162개 통과, 106.8초                           | retry/skip/flaky·runner errors0. 검색·게시/캐시·상세 등 기존 검사 유지                                  |

backend는 UTF-8 기준 정확히1MiB를 HTTP200으로 반환하고1byte 초과를503으로 반환했다. 프론트는 큰 단일 청크나 누적 청크를 JSON.parse 전에 거절하며 chunk가 열린 동안 cancel도 확인했다. 최초 접속·일반 상세의 읽기 정책을 임의로 바꾸지 않았고 새 상한은 목록 요청에만 적용했다.

초기 새 헤더 fixture의 union 타입 오류는 명시적 Record 배열로 수정했다. 측정 도구의 미사용 변수 경고는 metadata 복사 뒤 필드를 제거하도록 수정했다. UTF-8 마지막 청크 직후 이미 닫힌 stream의 cancel callback을 요구한 첫 assertion은 fixture를 열린 초과 스트림으로 고쳐 실제 중단을 관측했다. 기존 경계·timeout·retry·lint 문턱은 완화하지 않았다.

전체 E2E의 기존 의도한503/중단 로그를 모두 무해하다고 새로 판정하지 않았다. 앱과 테스트 서버3111/3112는 종료됐다. 명시 파일 Prettier·읽기 전용 문서 delta·diff 검사도 통과했으며 인덱스는 비어 있다. 검증 소스11개와 이전 캐시/동선 E2E·NAS/H1/primary 미커밋의 blob 일치를 확인했다.

## 한계와 후속 작업

1MiB는 개인 블로그의 초기 애플리케이션 보호 상한이지 NAS 처리 능력의 실측 한계가 아니다. 설치된 Next `dist/server/lib/incremental-cache/index.js`의 기본 fetch 캐시는 JSON.stringify 항목 길이2MB 초과를 제한하지만 조건·단위·metadata가 달라 이번1MiB 정책이 캐시 적중을 보장하지 않는다.

이번 guard는 backend 원문 전체 읽기·검증/Markdown 파싱을 마친 뒤 동작한다. 단일 큰 응답 청크의 이미 발생한 할당·Next 내부 buffering·힙 최대값도 제한하지 않는다. 상세 HTML·공개 검색 결과의 별도 상한, 실제 corpus 크기·많은 작은 파일·NAS I/O·동시 요청·cold start·운영 경고량은 후속이다. 전체 실패 때 원격 전용 결과·목록 의존 상세가 unavailable이 될 수 있으므로 경고512KiB부터 페이지 단위 목록/별도 검색 인덱스를 검토한다. 콘텐츠를 조용히 자르거나 제한 숫자만 올리지 않는다.

커밋·원격 CI·NAS 이미지 교체·프론트 배포·실제 게시 갱신은 하지 않았다. 기존 사용자 보류 운영 작업도 실행하지 않았다.

## 관련 문서

- [목록 API 계약](../../architecture/blog-content-api-contract.md#목록-응답-크기-제한)
- [ADR-0020](../../architecture/adr-0020-content-posts-byte-budget.md)
- [이전 검색 인덱스 비용 실험](2026-10-03-search-index-cost.md)
- [앞선 본문 검색·사용자 동선 검증](../content/2026-10-26-remote-body-search.md)
- [작업 기록](../../worklog/2026-10/2026-10-26-search-payload-budget.md)
