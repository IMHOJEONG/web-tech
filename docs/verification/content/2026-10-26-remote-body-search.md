# 로컬·원격 본문 검색 계약 검증

## 대상과 조건

- 확인일: 2026-10-26 KST. 최신 main `c1e2850cbfdf50bd7761729b32d1af5ffe045596` 기반 `codex/docs-remote-body-search-20261026`의 검증 당시 미커밋 구현. 이후 승인된 커밋 분리는 아래에 구분한다.
- Node 24·pnpm 12.14.0. 공용 ESM/CJS, NestJS 임시 디렉터리·fixture 인증, docs 실제 인덱스/정규화/검색 파이프라인을 모의 fetch로 검사했다.
- 최초 라이브러리 검증에는 NAS·운영 토큰·외부 API·웹훅을 사용하지 않았다. 아래 후속 production 검사는 loopback fixture와 로컬 웹훅만 사용한다. 기존 H1/NAS/primary 미커밋은 보존했다.

## 재현 방법

저장소 루트에서 실행한다. 백엔드 HTTP 검사는 로컬 fixture 리스너를 허용해야 한다.

```sh
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter @web-tech/docs-content-contract lint
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs exec eslint lib/document.types.ts lib/content-api-normalize.ts lib/get-search-data.ts lib/remote-body-search.test.ts --max-warnings 0
```

## 결과와 증거

최종 결과와 소스10개 blob hash는 [검증 증거](../artifacts/2026-10-26-remote-body-search.json)에 보존했다. 신규 회귀 소스는 공용 `index.test.ts`, 백엔드 `markdown-renderer.service.spec.ts`·`app.e2e-spec.ts`, docs `remote-body-search.test.ts`다. fixture는 실제 로컬 파일 파서와 원격 응답 어댑터·검색 순위·발췌를 통과하며 종료 코드뿐 아니라 결과와 요청 경로를 검사한다.

| 범위        | 최종 결과                                                | 핵심 확인                                                                                                                                                  |
| ----------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 공유 계약   | 28개 통과, ESM/CJS build·lint 성공                       | 필드 누락/null/빈 값·잘못된 타입, 기존 생산자 호환                                                                                                         |
| 백엔드      | 단위22개·HTTP40개, lint·타입·Nest build 성공             | 문단/제목/표/링크 라벨/alt/코드 추출, frontmatter 제외, 검증 후 published만 포함, 상세 렌더 보존, 파일 V1→V2→draft 변화                                    |
| docs        | 294개 통과, 앱/Node 테스트 타입·변경 파일 ESLint 성공    | 본문 전용 일치, canonical 원격1개 우선, 과거 로컬 본문 미혼합, 구형 metadata-only, 양쪽 draft/archived 제외, 오류 fallback, 제목/요약 우선순위·안전한 발췌 |
| 요청 경계   | 명시적 local-only는0회, 원격 포함 검색은 query당 목록1회 | 상세 fan-out·retry 없음, 실제 Next 캐시 적중 횟수를 측정한 것은 아님                                                                                       |
| 저장소 회귀 | 153개 통과                                               | 기존 보안·툴링·문서 검사 회귀 유지                                                                                                                         |

초기 docs lint의 `module` 변수 이름 경고는 `bundledModule`로 고쳐 통과했다. 저장소 회귀의 초기2개 실패는 sandbox의 `listen EPERM 127.0.0.1`이었다. 같은 전체153개를 로컬 리스너 허용 환경에서 다시 실행해 통과했다. 규칙·assertion·timeout·retry·의존성 정책은 완화하지 않았다. malformed searchText fixture의 schema 경고는 의도한 fallback 검사이며 실제 API 장애가 아니다.

변경 파일의 Prettier·Git diff 검사를 통과했다. `mise exec -- node /private/tmp/check-search-docs-working-tree-20261026.mjs`는 이 머신의 임시 읽기 전용 검사기로 기존 `check-documentation.mjs`의 validate를 사용해 작업 트리 문서 delta를 검사했다. 이전 NAS/primary 문서까지 보존한 상태에서 통과했으며 인덱스를 쓰지 않았다. 임시 검사기를 저장소 CI 도구로 추가한 것은 아니다.

## 한계와 후속 작업

후속 커밋·푸시 승인으로 계약/백엔드 `a6cce5c`, 프론트 `14a49a1`를 분리했고 훅 검사와 검증 소스10개 blob 일치를 확인했다. artifact의 `local-uncommitted`는 최초 검증 시점이며 원격 CI 성공을 뜻하지 않는다. 정책·검증 기록은 별도 커밋으로 연결한다. 원격 push·PR·CI·운영 검증은 같은 결과로 취급하지 않는다.

최초 검증 시점에는 원격 배포와 캐시 무효화·게시 V1/V2·브라우저 UI를 검사하지 않았다. 이후 로컬 production 관측은 다음 구역으로 구분한다. 실제 NAS/Vercel 배포·캐시 갱신은 여전히 미검증이다. 구형 NAS 이미지에는 아직 검색 텍스트가 없을 수 있다. metadata-only 호환을 성공한 본문 검색으로 표시하지 않는다. 이번에 로컬 MDX 파서·마크업 검색 노이즈·동의어·전문 검색 엔진을 바꾸지는 않았다. payload 크기와 대규모 성능은 다음 byte budget 과제다.

## 본문 검색·웹훅 캐시 production E2E 후속

2026-10-26 사용자 승인으로 기존 `content-publication.spec.ts`의 직접 URL 서버 캐시 검사에 본문 검색을 추가했다. 기준 HEAD는 원격에 푸시된 `3609ff2`이고 이번 테스트 보완은 미커밋이다. synthetic content 서버의 목록/본문에 버전별 `bodyonlypublicationv1needle`·`bodyonlypublicationv2needle`를 넣되 id·slug·경로·제목·요약에는 없음을 확인한다. 검색 어댑터/웹훅/캐시의 운영 코드는 변경하지 않았다.

| 단계                       | 화면 `/ko/docs`, `/en/docs`                                  | `/api/search`                           |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| V1 준비·인증된 무효화 후   | V1 본문 키워드 카드1·발췌 표시, V2 카드0                     | V1 count1·V2 count0                     |
| origin만 V2로 변경         | 캐시 V1 유지, V2는 아직 검색되지 않음                        | V1 count1·V2 count0                     |
| 무토큰·오류·읽기 토큰 웹훅 | 각각401, V1 검색 유지                                        | V1 count1·V2 count0                     |
| 정상 웹훅 후               | 이미 열린 상세 DOM은V1, 다음 요청/새로고침은V2; V1 검색 제거 | V2 count1·V1 count0, 결과 본문·발췌도V2 |

기존 제목/요약 검색·상세 완료·finally의 fixture 원복 검사를 유지했다. API와 화면을 같은 단계에서 비교하며 본문 검색 페이지를 확인한 뒤 상세 화면으로 돌아와 열린 DOM 검사 의도를 유지한다. 모바일390×844·데스크톱1280×800의 ko/en4조건이 모두 통과했다. 게시 CLI2개도 통과했다.

처음에는 새 `[version, otherVersion]` 배열이 number로 넓게 추론돼 TS2345로 production 타입 검사에서 중단됐고 브라우저 테스트는 시작하지 못했다. `as const`로 실제 허용 값1/2를 보존해 수정했다. 타입 검사·timeout·retry·prefetch를 끄거나 완화하지 않았다.

실행한 스크립트 인수 전달에서는 두 파일을 지정했지만 전체 production154개가 실행돼 모두 통과했다. 이후 아래처럼 Playwright CLI에 직접 파일 패턴을 전달해 대상6개를 다시 선택했다. `--list`로6개임을 먼저 확인했고 JSON 결과도6개 성공·실패/skip/flaky0·각 retry0이었다. 이6개는 전체154개와 중복되므로160개의 서로 다른 검사로 합산하지 않는다.

```sh
mise exec -- pnpm --filter docs test:article:prod -- content-publication.spec.ts content-publication-cli.spec.ts
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts content-publication.spec.ts content-publication-cli.spec.ts --list
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts content-publication.spec.ts content-publication-cli.spec.ts --reporter=json
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec eslint article-e2e/content-server.ts article-e2e/content-publication.spec.ts --max-warnings 0
```

Next production 빌드와 앱 타입 검사·변경 파일 ESLint도 성공했다. [추가 증거](../artifacts/2026-10-26-remote-body-search-cache-e2e.json)에 소스2개 blob, 빌드ID, 실제 JSON reporter의 프로젝트·결과·retry·단계별 소요 시간을 보존했다. 원시 report는 이 머신의 `/private/tmp/remote-body-search-cache-e2e-20261026.json`에 생성했고 인증 헤더·환경 파일·본문 원문 전체를 저장소 증거로 복사하지 않았다. 로컬3111/3112 리스너는 검사 종료 후 남아 있지 않았다.

전체 suite의 기존 upstream503·중단 대조군은 의도한 오류 로그를 생성했다. 테스트 통과를 모든 서버 오류 로그가 무해하다는 증거로 쓰지 않으며 이번에 스트림 원인을 새로 확정하지 않았다. 새 본문 검색4조건의 pageerror는0이었다. 실제 NAS 파일 수정·Vercel 배포/웹훅·Router Cache/Link 기반 본문 검색·Safari/Firefox는 이번 후속 검사의 대상이 아니다. 새 구조 결정이 없어 ADR은 추가하지 않는다.

## 실제 검색 제출·카드 이동 production E2E 후속

같은 기준 HEAD `3609ff2`에서 `body-search-navigation.spec.ts`를 추가했다. loopback published fixture의 본문에만 있는 키워드로 ko/en × 헤더/본문 검색 × 모바일/데스크톱8조건을 검사한다. 최초 화면 준비만 `page.goto`를 사용하고 검색은 실제 Enter/submit, 상세는 카드의 Link 클릭, 복귀는 브라우저 뒤로 가기와 빈 결과의 복귀 링크로 검사한다.

- 이전 section·sort·page query 제거와 입력 공백 정규화, 제출 완료·헤더 검색 닫힘을 확인한다.
- 카드1개의 제목·본문 발췌와 상세 본문을 확인하고 supplementary 완료까지 기다린다.
- 뒤로 가기 후 검색어·카드를 복원하고, 없는 본문 키워드의 빈 결과에서 전체 문서로 돌아간다.
- 최초 접속 이후 같은 window 식별자와 main-frame document 요청0·미처리 pageerror0을 확인한다. RSC·prefetch·일반 데이터 요청0이라는 뜻은 아니다.

최초8개는 빈 결과에 본문 검색폼이 있다고 잘못 가정해 `locator.fill`에서30초 timeout으로 실패했다. 실제 화면에는 폼 대신 ‘전체 문서로 돌아가기/Back to all docs’ 링크가 있어 이를 클릭하고 목적지를 확인하도록 테스트만 수정했다. timeout 종료 후 fixture 정리에서 context closed 오류도 동반됐다. 운영 UI·timeout·retry·prefetch 설정은 변경하지 않았다. 수정 후 대상8개는 전부 통과했고 skip/flaky/retry0이었다.

```sh
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts body-search-navigation.spec.ts --reporter=json
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts --reporter=json
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec eslint article-e2e/body-search-navigation.spec.ts --max-warnings 0
```

앱 타입 검사와 신규 파일 ESLint를 통과했다. 전체 production162개도98.8초에 통과했고 skip/flaky/retry·runner errors0이었다. 대상8개는162개에 포함되며170개의 별도 검사로 합산하지 않는다. [사용자 동선 증거](../artifacts/2026-10-26-remote-body-search-navigation.json)에 실제 JSON 결과·단계 시간·소스 blob·빌드ID와 최초 실패를 보존했다. 원시 보고서는 artifact에 적은 머신 내부 `/private/tmp/` 경로에만 두고 인증 헤더·환경 파일·본문 전체는 복사하지 않았다. 검사 종료 후3111/3112 리스너는 없었다.

이번 동선 검사는 웹훅 직후 이미 열린 화면의 Router Cache 자동 갱신·실제 NAS/Vercel·Safari/Firefox 검증을 대신하지 않는다. 기존 suite의 의도한 upstream/abort 로그를 모두 무해하다고 새로 확정한 것도 아니다. 이전 캐시 E2E 파일2개와 관련 없는 NAS/H1/primary 미커밋은 blob 일치로 보존을 확인했으며 커밋·푸시·배포는 하지 않는다.

## 관련 문서

- [ADR-0019](../../architecture/adr-0019-remote-body-search.md)
- [검색 API 계약](../../architecture/docs-search-api-contract.md#본문-검색과-원본-선택)
- [작업 기록](../../worklog/2026-10/2026-10-26-remote-body-search.md)
