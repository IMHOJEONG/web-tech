# 본문 H1 경고 전환 검증

## 대상과 조건

- 확인일: 2026-10-25 KST, macOS arm64·mise Node 24.12.0·pnpm 12.14.0.
- 기준 main: `4e80275e5f78863687b78e237c4c6c5e1577641c`. `codex/content-h1-warning-20261025`의 미커밋 수정과 [KAN-37](https://web-tech-service.atlassian.net/browse/KAN-37)을 검증한다.
- 로컬 CLI·공용 ESM/CJS 검증기·NestJS 임시 content 및 fixture 토큰을 사용한다. 운영 env·NAS·Vercel·Railway·웹훅은 사용하지 않았다.
- 기존 NAS 진단 worktree의 미커밋 문서와 다른 세션 작업은 그대로 두고 새 작업 공간을 사용했다.

## 재현 방법

저장소 루트에서 실행한다. HTTP 검사는 로컬 리스너를 허용해야 한다.

```sh
mise exec -- pnpm install --frozen-lockfile --offline
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter @web-tech/docs-content-contract lint
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs exec eslint scripts/validate-content-style.test.mjs --max-warnings 0
mise exec -- pnpm validate:docs
```

공용 검증기 테스트는 타입 검사와 격리된 긴 제목 입력 회귀도 포함한다. docs-backend check는 공용 패키지 build·lint·타입·단위·HTTP E2E·Nest build를 포함한다. UI build는 docs 라이브러리의 의존성 준비이며 공용 UI 소스는 바꾸지 않았다.

## 결과와 증거

동일 입력 `# Original title`을 기준 main 원본과 수정된 ESM 출력에 각각 전달했다. 기준은 failures 2개·warnings 0개, 수정본은 failures 0개·H1 권장 경고 1개다. [동일 입력 전후 결과](../artifacts/2026-10-25-body-h1-warning.json)에 기준 commit·변경 source blob·실제 결과 객체를 기록했다.

| 검사          | 결과                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 공용 계약     | 26개 통과. H1 단독·첫 H1·여러 H1·draft/published 경고, 코드 펜스 안 H1 무경고, 기존 제목 인식/성능 경계 유지                  |
| 로컬 콘텐츠   | 36개 통과. 실제 CLI의 H1 경고 출력·종료0·원문 보존, H1+HTML주석 종료1. 실제 문서 19개 metadata·본문 검사 통과                 |
| 백엔드        | 단위13개·HTTP39개 통과, lint·타입·build 성공. H1 본문 3종의 목록200·상세200·HTML H1 유지·경고 로그·원본 파일 보존             |
| 기존 차단     | HTML주석·H4 첫 제목·H1에서 H4로 건너뛰기·펜스·callout 오류를 목록 제외/상세404로 유지. 필수 metadata·draft/archived 조건 유지 |
| 렌더링·소비자 | docs 라이브러리285개 및 테스트 타입 검사 통과. 기존 로컬 MDX/원격 HTML의 H1 보존·제목 감지 검사 포함                          |
| 저장소        | 153개 통과. 기존 의존성·보안·툴링 회귀 유지                                                                                   |
| 문서·포맷     | 변경 파일 포맷·문서 delta·diff 검사로 확인한다. 원격 CI나 CodeQL 실행을 뜻하지 않는다                                         |

초기 제한 환경에서 로컬 HTTP 검사 10개와 백엔드 E2E는 `listen EPERM`으로 실패했다. 동일 명령을 리스너 허용 환경에서 재실행해 통과했으며 assertion·timeout·retry를 완화하지 않았다. 첫 offline 설치는 sandbox가 다른 빈 store를 선택해 tarball 부재로 실패했으나 기존 store 접근 허용 후 frozen/offline 설치가 성공했다. lockfile과 공급망 정책은 변경하지 않았다. worktree의 prepare 훅 ENOTDIR 안내·dotenv skill 승인 안내는 기존 동작이며 새 승인·훅 변경을 하지 않았다.

실제 CLI fixture의 첫 실행은 macOS 임시 디렉터리 symlink 때문에 main 진입 가드가 실행되지 않아 경고 assertion이 실패했다. fixture 루트를 realpath로 정규화하고 경고 출력·성공 종료·원문 동일성·다른 오류의 실패 종료를 모두 재검사해 통과했다. 종료0만으로 검사를 통과시키지 않았다. 실제 콘텐츠 검사의 기존 placeholder 경고도 숨기거나 공개 문서를 수정하지 않았다.

## 한계와 후속 작업

- H1을 경고로 바꾸는 정책이며 HTML주석·불완전 펜스 등 다른 실패까지 허용하지 않는다. 첫 H4~H6·제목 단계 건너뛰기도 기존 실패다.
- 제목 인식 정규식·줄 단위 범위와 renderer는 변경하지 않는다. setext·JSX/HTML 제목 검사를 새로 도입한 것이 아니다. 자동 H2 변환도 없다.
- NAS에는 변경된 공용 패키지를 포함한 백엔드 이미지가 배포돼야 적용된다. 프론트는 변경 코드 배포가 필요하며 캐시된 결과의 인증 revalidation도 별도다. 기존 이미지나 운영 API에 적용됐다고 표시하지 않는다.
- 전체 Next production build·브라우저 E2E·원격 CI·CodeQL·NAS 배포는 미실행이다. 앞선 404의 Content-Type 경고는 별도 후속이며 이번에 수정하지 않았다.
- 최초 검증 시점에는 커밋·푸시·PR·병합·배포를 실행하지 않았다. 후속 사용자 승인은 이번 변경의 커밋과 작업 브랜치 푸시까지이며 PR·병합·운영 배포는 제외한다. 실제 원격 SHA는 같은 KAN-37 기록에서 확인한다.

## 관련 문서

- [본문 작성 정책](../../architecture/docs-content-authoring-markup-policy.md#본문-제목-계층)
- [기고 가이드](../../runbooks/docs-contributor-guide.md#content-style-rules)
- [작업 기록](../../worklog/2026-10/2026-10-25-body-h1-warning.md)
