# 로컬·원격 본문 검색 계약 검증

## 대상과 조건

- 확인일: 2026-10-26 KST. 최신 main `c1e2850cbfdf50bd7761729b32d1af5ffe045596` 기반 `codex/docs-remote-body-search-20261026`의 검증 당시 미커밋 구현. 이후 승인된 커밋 분리는 아래에 구분한다.
- Node 24·pnpm 12.14.0. 공용 ESM/CJS, NestJS 임시 디렉터리·fixture 인증, docs 실제 인덱스/정규화/검색 파이프라인을 모의 fetch로 검사했다.
- NAS·운영 토큰·외부 API·웹훅을 사용하지 않았다. 기존 H1/NAS/primary 미커밋은 보존했다.

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

실제 원격 배포와 캐시 무효화·게시 V1/V2·브라우저 UI 검사는 미실행이다. 구형 NAS 이미지에는 아직 검색 텍스트가 없을 수 있다. metadata-only 호환을 성공한 본문 검색으로 표시하지 않는다. 이번에 로컬 MDX 파서·마크업 검색 노이즈·동의어·전문 검색 엔진을 바꾸지는 않았다. payload 크기와 대규모 성능은 다음 byte budget 과제다.

## 관련 문서

- [ADR-0019](../../architecture/adr-0019-remote-body-search.md)
- [검색 API 계약](../../architecture/docs-search-api-contract.md#본문-검색과-원본-선택)
- [작업 기록](../../worklog/2026-10/2026-10-26-remote-body-search.md)
