# Infra / Tooling 지식 정리

## 배운 점

- `pnpm` catalog 도입 후에는 로컬만이 아니라 네트워크 가능한 환경에서 `lockfile-only`도 한 번 더 검증하는 편이 안전하다.
- workspace package만이 아니라 root `package.json`도 catalog 기준을 같이 쓰면, 도구 체인 버전 기준점이 한 군데로 모여서 drift가 줄어든다.
- `next.config`의 env 해석은 빌드 시점이라서, 배포 env와 로컬 env를 구분해서 봐야 한다.
- `remotePatterns` 문제처럼 보이는 이슈도 실제로는 빌드 타이밍, env 우선순위, 렌더 방식 차이일 수 있다.
- env 키 이름 하나가 build, runtime, client, server 경계를 동시에 건드릴 수 있어서, 변수명과 우선순위를 먼저 문서화하는 편이 사고가 적다.
- “로컬에서는 되는데 배포에서 안 된다” 유형은 대개 네트워크보다 빌드 시점 설정 차이로 풀리는 경우가 많았다.

## 자주 헷갈리는 부분

- `NEXT_PUBLIC_*`는 클라이언트 노출용이지만, 이번 프로젝트에서는 일부 키가 `next.config`와 서버 설정에서 같이 쓰이기도 했다.
- 배포 환경에서 env를 바꿔도 재배포 전까지는 `next.config` 결과가 바뀌지 않는다.
- 네트워크 제한 환경에서는 설치/검증 명령이 부분 성공처럼 보여도 마지막 메타 조회에서 실패할 수 있다.
- `remotePatterns`는 일반 HTML 이미지가 아니라 `next/image`에만 적용된다.
- `NEXT_PUBLIC`를 붙였더니 해결된 것처럼 보여도, 실제 원인은 그 키를 `next.config`가 읽고 있었기 때문일 수 있다.
- Vercel은 `ENABLE_EXPERIMENTAL_COREPACK=1`과 root `package.json > packageManager`가 있어도, Turbo 환경 전달 조건이 맞지 않으면 Corepack을 비활성화하고 자체 heuristics로 `pnpm` 버전을 고를 수 있다.
- `pnpm-lock.yaml` 버전 9는 Vercel 로그에서 `pnpm@9.x 또는 pnpm@10.x`로 해석될 수 있어서, Corepack이 꺼진 상태에서는 최신 `packageManager` 선언보다 낮은 `pnpm`으로 fallback 될 수 있다.

## 현재 운영 기준

- `pnpm install --lockfile-only`는 네트워크 가능한 환경 기준으로 재검증 완료
- root `package.json`의 toolchain 의존성도 catalog를 사용한다.
  - 현재 대상:
    - `@eslint/compat`
    - `eslint`
    - `prettier`
    - `simple-git-hooks`
    - `turbo`
    - `typescript`
- asset public host는 서버 전용 키를 우선
- docs 관련 env는 build/runtime 경계를 나눠서 점검
- asset public host 우선순위
  1. `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
  2. `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
  3. `BLOG_CONTENT_ASSET_BASE_URL_INTERNAL`
  4. `BLOG_CONTENT_ASSET_BASE_URL`
- package manager 기준
  - root `package.json`의 `packageManager`는 `pnpm@11.3.0`
  - Vercel에서는 `ENABLE_EXPERIMENTAL_COREPACK=1`과 함께 `turbo.json > globalPassThroughEnv`에 `COREPACK_HOME`을 포함해 Corepack fallback을 막는다.
  - lockfile 관련 검증은 가능한 한 로컬과 CI/배포 환경 모두 같은 `pnpm` 메이저 버전에서 확인한다.
- GitHub `main` ruleset 기준
  - PR 필수
  - approval 필수는 없음
  - status check 필수
  - conversation resolution 필수
  - force push 차단

## 구현하면서 반복 확인한 패턴

- env 이슈는 “값이 있는가”보다 “누가 그 값을 읽는가”가 더 중요했다.
  - `next.config`
  - 서버 런타임
  - 클라이언트 번들
    세 층을 나눠 봐야 했다.
- 설치/빌드 문제는 로컬 제한 환경과 외부 네트워크 환경을 분리해서 확인해야 했다.
  - 로컬 제한 환경 실패
  - 외부 네트워크에서 재검증 성공
    이라는 패턴이 실제로 있었다.
- image optimize 문제는 asset 서버 응답, env, build 시점 반영, component 종류를 분리해서 보면 훨씬 빨리 원인을 찾을 수 있었다.
- GitHub ruleset은 “리뷰 문화”보다 “main 보호 정책”에 가깝게 해석하는 편이 이 저장소에 맞았다.
  - 사람 승인 강제보다
  - PR 생성
  - 자동 검증
  - 대화 정리
  - 이력 보존
    조합이 더 현실적이었다.
- catalog 확장 여부는 “해당 버전이 여러 앱에 직접 쓰이느냐”보다 “repo 전체 개발 흐름에 버전 기준점으로 작동하느냐”로 판단하는 편이 더 실용적이었다.
  - 예: `turbo`, `prettier`, `simple-git-hooks`는 root-only라도 전체 개발 흐름에 영향을 준다.
- backend 인증은 특별한 요구가 없으면 `Authorization: Bearer <shared-secret>`로 시작하고,
  `401/403`은 fallback이 아니라 설정/인증 문제로 본다.
- 브라우저 앱이 backend shared-secret을 직접 들고 가면 안 된다.
  - 로컬 개발은 `Vite server.proxy`
  - 운영은 reverse proxy / gateway
    가 `Authorization` 헤더를 대신 주입하는 구조가 기본이다.
- monorepo 안의 Nest 서비스는 배포 Dockerfile에서
  - workspace root context
  - `pnpm install --filter <service>...`
  - `pnpm --filter <service> deploy --prod --legacy`
    흐름으로 필요한 패키지만 최종 이미지에 담는 편이 안정적이었다.
- 현재 repo는 `inject-workspace-packages=true`를 전역 정책으로 아직 채택하지 않았기 때문에,
  Railway 배포용 `pnpm deploy`는 `--legacy`가 가장 마찰이 적다.
- Nest 서비스는 `dist/main.js`라고 가정하지 말고 실제 build 산출물 경로를 먼저 확인해야 한다.
  - 현재 `vuln-radar-backend`는 `dist/src/main.js`가 entry다.
- `pnpm deploy`는 package tarball에 포함된 파일만 runtime 쪽으로 가져간다.
  - `.gitignore`에 걸린 `dist`, `generated/prisma`는 기본 상태에선 빠질 수 있다.
  - 이 경우 build는 성공해도 runtime에서 `MODULE_NOT_FOUND`가 난다.
  - 배포 대상 서비스는 `package.json > files`를 명시하는 편이 안전하다.
- Prisma 7 config는 `generate`에도 영향을 준다.
  - 공식 문서 기준 `prisma generate`는 DB URL이 꼭 필요하지 않지만,
    config 로딩 중 `env()`나 custom resolver가 throw하면 generate도 실패한다.
  - 그래서 build-friendly한 config와 runtime-strict한 resolver를 분리하는 편이 안전하다.

## 다음 작업자가 먼저 점검할 것

- `next.config` 관련 이슈가 나면
  - 배포 env 반영 여부
  - 재배포 여부
  - build 시점 해석 키 이름
    순서로 확인
- pnpm/lockfile 이슈가 나면
  - local sandbox 환경인지
  - 외부 네트워크 환경인지
  - workspace pnpm 버전과 CI 버전이 맞는지
    먼저 구분
- Vercel 로그에
  - `Disabling corepack`
  - `Using pnpm@9.x based on project creation date`
  - `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`
    가 같이 보이면, 먼저 `pnpm-lock.yaml` 자체보다 `packageManager`가 실제로 반영되지 못한 상황인지 확인한다.
- root 도구 버전을 올릴 때는
  - root `package.json`
  - `pnpm-workspace.yaml` catalog
  - lockfile 재검증
    세 군데를 같이 본다.
- image optimize 400이 나면
  - 원본 asset URL 200 여부
  - remotePatterns host 포함 여부
  - `<Image />`인지 일반 `<img>`인지
    순서로 확인

## 먼저 보면 좋은 문서

- `docs/worklog/2026-05-25-pnpm-lockfile-only-revalidation.md`
- `docs/worklog/2026-05-21-public-asset-base-server-env-support.md`
- `docs/runbooks/docs-env-checklist.md`
- `docs/worklog/2026-05-15-remote-thumbnail-host-allowlist.md`
- `docs/worklog/2026-05-15-remote-thumbnail-server-base-resolution.md`
- `docs/worklog/2026-05-18-remote-thumbnail-asset-base-only.md`
- `docs/worklog/2026-05-26-main-ruleset-verification.md`
- `docs/worklog/2026-06-12-vercel-corepack-pnpm-lockfile-mismatch.md`
