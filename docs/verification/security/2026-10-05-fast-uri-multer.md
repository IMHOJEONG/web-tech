# fast-uri·multer 보안 업데이트 검증

## 대상과 조건

- 검증일: 2026-10-05, Asia/Seoul.
- 기준: `origin/main`의 `2dde9133a766a08089bcaa5111d2db713dcfc9fa`와 `codex/security-fast-uri-multer`의 미커밋 작업 트리.
- 환경: 로컬 macOS, Node.js `24.12.0`, pnpm `11.10.0`, TypeScript `6.0.3`.
- 대상: `fast-uri@4.1.3`에서 `4.2.1`, `multer@2.3.0`에서 `2.4.0`으로 갱신한 의존성 그래프.
- docs 빌드는 원격 인덱스와 API 주소를 비활성화했다. vuln-radar-backend E2E는 DB와 수집 스케줄러를 비활성화한 mock 환경이다.

## 재현 방법

실행 디렉터리는 저장소 루트다. 설치 스크립트는 실행하지 않고 각 검사를 명시적으로 실행했다.

```bash
mise exec -- pnpm update -r fast-uri multer --lockfile-only --ignore-scripts
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm why -r fast-uri multer
mise exec -- pnpm audit --audit-level low
mise exec -- pnpm validate:catalog
mise exec -- pnpm test:repo
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm test
mise exec -- pnpm --filter docs-backend test:e2e --runInBand
DATABASE_URL= DIRECT_URL= SHADOW_DATABASE_URL= \
INGEST_SCHEDULER_ENABLED=false INGEST_SYNC_ON_STARTUP=false \
mise exec -- pnpm --filter vuln-radar-backend test:e2e --runInBand
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm --filter docs-backend build
mise exec -- pnpm --filter vuln-radar-backend build
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false \
BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= \
BLOG_CONTENT_MARKDOWN_BASE_URL= BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL= BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC= \
mise exec -- pnpm --filter docs build
```

commitlint는 Node.js의 `spawnSync`로 메시지를 stdin에 전달해 검사했다. 정상 메시지 `fix(workspace): update fast-uri and multer security overrides`는 exit 0, 잘못된 메시지 `fix[workspace]: update security overrides`는 exit 1인지 각각 assert했다. 실제 커밋은 만들지 않았다.

## 결과와 증거

Dependabot에서 확인한 4개 경고는 두 패키지에 해당한다. 패치 최소값은 다음 공식 advisory에 근거한다.

| 경고 | 패키지   | 패치 최소값 | 근거                                                                     |
| ---- | -------- | ----------- | ------------------------------------------------------------------------ |
| #331 | fast-uri | 4.1.4       | [GHSA-58mr-gqgx-xq4g](https://github.com/advisories/GHSA-58mr-gqgx-xq4g) |
| #332 | fast-uri | 4.1.4       | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) |
| #334 | fast-uri | 4.1.5       | [GHSA-jvvf-x445-j334](https://github.com/advisories/GHSA-jvvf-x445-j334) |
| #333 | multer   | 2.4.0       | [GHSA-3pph-fpjx-jg34](https://github.com/advisories/GHSA-3pph-fpjx-jg34) |

`fast-uri: ^4.1.5`는 4.1.5 고정이 아니므로 허용되는 `4.2.1`로 해석됐다. `pnpm why`에서 두 패키지 모두 각각 단일 버전으로 확인했다. fast-uri는 Ajv 경로, Multer는 `@nestjs/platform-express`를 통해 두 백엔드에 들어온다. 실제 직접 import·업로드 interceptor 사용처는 찾지 못했지만 전이 의존성이 있다는 사실과 취약점의 실제 도달 가능성은 구분한다.

| 검사                   | 관측 결과                                                             |
| ---------------------- | --------------------------------------------------------------------- |
| frozen-lockfile 설치   | 통과, lockfile 재해석 없음                                            |
| catalog 검사           | manifest 11개 통과                                                    |
| 저장소 검사            | 20개 테스트 통과                                                      |
| lint                   | Turbo 작업 7개 통과                                                   |
| typecheck              | 최초 실패, 라우트 타입 재생성 후 Turbo 작업 9개 통과; 8개는 캐시 결과 |
| 기본 테스트            | contract 20개, docs-backend 13개, vuln-radar-backend 19개 통과        |
| docs-backend E2E       | 18개 통과                                                             |
| vuln-radar-backend E2E | 4개 통과                                                              |
| docs 라이브러리        | 185개 통과                                                            |
| 콘텐츠 검사            | 테스트 20개, 실제 문서 16개 frontmatter·본문 검사 통과                |
| Nest 빌드              | 두 백엔드 모두 통과                                                   |
| docs production 빌드   | 통과, 정적 페이지 28개 생성; 로그에 `remote-index-disabled` 확인      |
| commitlint             | `fix(workspace): ...` exit 0, `fix[workspace]: ...` exit 1 확인       |
| 전체 audit             | 실패, 요청한 두 패키지 경고는 없지만 다른 취약점 5건 잔존             |

첫 타입 검사 실패는 `.next/types/validator.ts`가 main에 없는 이전 브랜치의 `api/push`·`og/article.png` 경로를 참조한 것이다. 앱 코드를 수정하거나 캐시를 삭제하지 않고 다음 명령으로 현재 라우트 타입을 재생성한 뒤 통과했다.

```bash
mise exec -- pnpm --filter docs exec next typegen
mise exec -- pnpm typecheck
```

`pnpm audit --json` 재조회에서도 fast-uri·multer 경고가 없음을 확인했다. 잔여 결과는 critical 1개·high 3개·moderate 1개이며, 이번 범위에 섞지 않고 별도 후속 작업으로 남겼다.

| 잔여 패키지     | 현재 버전 | 심각도   | 패치 최소값 | 공식 경고                                                                |
| --------------- | --------- | -------- | ----------- | ------------------------------------------------------------------------ |
| next            | 16.3.4    | critical | 16.3.6      | [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) |
| brace-expansion | 5.0.9     | high     | 5.0.11      | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) |
| brace-expansion | 5.0.9     | high     | 5.0.10      | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) |
| brace-expansion | 5.0.9     | moderate | 5.0.12      | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) |
| braces          | 3.0.3     | high     | 3.0.4       | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) |

추가 릴리스 조사에서 braces의 `>=3.0.4`는 audit이 반환한 범위일 뿐 실제 패치 버전이 아니었음을 확인했다. 공식 advisory는 패치 없음, registry 최신은 3.0.3이다. [후속 조사](2026-10-05-remaining-advisories.md)의 입력 경계 보강과 패치 추적을 따른다.

## 한계와 후속 작업

- 이번 결과는 로컬 작업 트리 기준이다. 원격 CI, main 병합, Dependabot 경고 종료, Vercel·NAS 배포를 확인한 결과가 아니다.
- Next.js critical은 Node.js `next/og`의 ImageResponse에 공격자가 제어하는 SVG 입력이 들어오는 조건과 관련된다. main의 조사 범위에서 사용처를 찾지 못했지만 다른 브랜치·실제 배포의 안전을 확정한 것은 아니다. 패치와 배포 사용처 조사를 우선 진행한다.
- 실제 파일 업로드 경로가 없으므로 Multer의 중단 업로드 후 잔여 파일 정리를 직접 시험하지 않았다. 백엔드 E2E 통과를 해당 취약점 재현 시험으로 대체하지 않는다.
- 브라우저 E2E, vuln-radar 프런트엔드 production 빌드, 설치 lifecycle 전체 실행은 이번 검증에 포함하지 않았다.
- audit 결과는 조회 시점의 registry advisory에 따라 달라질 수 있다. main 병합 후 다시 조회한다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-05-fast-uri-multer-security-update.md)
- [보안 후속 TODO](../../todo/todo.md#dependency-security)
