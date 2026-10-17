# 콘텐츠 게시 검증 CLI의 로컬 검증

## 대상과 조건

- 검증일: 2026-10-08 KST, `feature/docs` 작업 트리. 아직 커밋·배포하지 않은 구현이다.
- Node.js 24.12.0, pnpm 11.10.0, Next.js 16.3.8, Playwright 1.62.1.
- native Node 모의 HTTP 서버와 Next.js production 테스트 서버만 사용했다. NAS·Production에는 POST나 파일 변경을 하지 않았다.
- 기존 다른 작업의 HTTP 스트리밍 초안과 문서 변경은 보존했다. 콘텐츠 작성 규칙 검사는 현재 작업 트리의 18개 파일에 실행했다.

## 재현 방법

저장소의 `apps/docs`에서 실행했다. `mise exec`는 프로젝트의 Node 24를 선택한다.

```bash
mise exec -- pnpm test:content
mise exec -- pnpm typecheck:node-test
mise exec -- pnpm typecheck
mise exec -- pnpm exec eslint scripts/content-publication.ts scripts/content-publication.test.ts scripts/revalidate-content-cache.mjs article-e2e/content-publication-cli.spec.ts
mise exec -- pnpm exec playwright test --config=playwright.article.config.ts --project=article-desktop content-publication-cli.spec.ts content-publication.spec.ts
```

Playwright 설정은 모든 원격 후보를 loopback 테스트 origin으로 바꾼다. fixture 원문을 V1으로 설정하고 인증 만료 후 목록·검색·본문 캐시를 채운다. fixture만 V2로 바꾼 다음 CLI `--verify-only`가 실패하는지 확인하고, 기본 CLI의 POST와 세 공개 GET 검사가 성공하는지 검사한다. finally에서 V1과 캐시를 원복하고 임시 파일·테스트 서버를 정리한다.

실행 명령에서 `--project=article-desktop`처럼 `=`을 사용한다. 최초 시도는 다중값 옵션에 파일명이 project로 흡수되어 실행 전 실패했으며 수정 후 수행했다.

## 결과와 증거

| 검사                    | 관측 결과                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| 콘텐츠 테스트           | 34개 통과. 신규 게시 검증 14개와 기존 20개                                |
| 작성 규칙               | frontmatter·본문 스타일 모두 18개 통과                                    |
| Node 테스트 타입        | `erasableSyntaxOnly` 포함 통과                                            |
| 집중 린트               | 구현·native 테스트·진입점·E2E 4개 파일 통과                               |
| production 빌드         | Playwright webServer의 `pnpm build` 성공                                  |
| 실제 Next CLI           | stale V1에서는 종료 코드 1, 인증된 기본 실행 후 세 검사 fresh·종료 코드 0 |
| 기존 게시 브라우저 검사 | 한국어·영어 각각 통과. desktop 프로젝트 2개                               |

모의 검사에서 확인한 경계:

- hydration script·template·본문 밖 문구, 잘못된 대상 카드·중복 결과, 일부 본문 표식 누락은 성공으로 인정하지 않는다.
- 검색 API의 언어 없는 href와 화면의 언어 포함 링크를 각 계약에 맞게 대조한다.
- 웹훅 200이어도 세 공개 응답이 이전 버전이면 CLI는 실패한다. 여러 순회의 개별 성공을 합쳐 성공하지 않는다.
- POST는 1회만 전송한다. 공개 GET에 인증 헤더를 전달하지 않으며 토큰·본문·임의 upstream 응답값을 CLI 출력에서 제외한다.
- 401/403·429·redirect는 즉시 중단한다. GET 5xx·네트워크 종료·stale은 제한된 재확인만 수행한다.
- 응답 header 이후 멈춘 스트림도 전체 100ms 테스트 예산 안에서 취소된다. 엄격한 wall-clock 성능 SLA가 아니라 deadline 적용을 확인한 시험이다.
- 잘못된 기대값은 POST 전에 실패한다. `--invalidate-only`와 `--verify-only`의 실행 경계를 확인했다.

production 첫 시험은 CLI 게시 확인 자체를 통과한 뒤 stderr 공백 기대값에서 실패했다. Playwright의 `FORCE_COLOR`와 runner의 `NO_COLOR` 충돌 경고였으며 자식 CLI의 `FORCE_COLOR`만 제거해 재검증했다. 서버 로그를 숨기거나 경고 전체를 무시하지 않았다. 최종 E2E 결과는 **3 passed (27.8s)**다.

기존 브라우저 게시 검사 도중 `The destination stream closed early`가 최종 실행에서 4건 기록됐다. CLI 검사 중 발생한 것으로 확인된 로그는 없지만, E2E 통과만으로 네 건을 정상 취소로 확정하지 않는다. UUID와 로그 원문은 공개 artifact에 저장하지 않았다.

증거: [비밀값 없는 실행 결과 요약](../artifacts/2026-10-08-content-publication-verifier.json).

## 한계와 후속 작업

앱 전체 `pnpm typecheck`, 작업 트리 기준 문서 역할·상대 링크 검사, `git diff --check`도 통과했다. 검사를 위해 파일을 스테이징하지 않았다. 테스트용 3111·3112 포트가 실행 후 종료된 것도 확인했다.

- 실제 NAS 파일 변경·배포 보호·Cloudflare·Vercel 캐시 동작과 운영 발행·원복은 미검증이다. 승인된 테스트 글과 원복 계획으로 별도 실행한다.
- 이번 브라우저 범위는 desktop Chromium이다. CLI는 HTML/JSON을 읽으며 DOM hydration·이미지 로딩·다른 기기를 검증하지 않는다.
- 기대값은 운영자가 선택한다. 이전 버전에도 존재하는 문구나 잘못된 페이지·검색어는 잘못된 판정의 원인이 된다. 전체 목록 자동 순회와 자동 원복은 구현하지 않았다.
- 여러 응답은 순차로 조회한다. 모든 독자의 동시 갱신이나 원자적인 게시 트랜잭션을 보장하지 않는다.
- 기존 스트림 로그는 별도 요청 생명주기 조사 과제로 유지한다.

## 관련 문서

- [실행 절차](../../runbooks/docs-content-publication-verification.md)
- [갱신 정책](../../architecture/docs-content-cache-revalidation-policy.md)
- [기존 운영 캐시 검증의 남은 범위](2026-10-04-deployed-search-index-cache.md#남은-범위)
- [작업 기록](../../worklog/2026-10/2026-10-08-content-publication-verifier.md)
