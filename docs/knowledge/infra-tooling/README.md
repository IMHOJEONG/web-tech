# Infra / Tooling 지식 정리

## 배운 점

- `pnpm` catalog 도입 후에는 로컬만이 아니라 네트워크 가능한 환경에서 `lockfile-only`도 한 번 더 검증하는 편이 안전하다.
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

## 현재 운영 기준

- `pnpm install --lockfile-only`는 네트워크 가능한 환경 기준으로 재검증 완료
- asset public host는 서버 전용 키를 우선
- docs 관련 env는 build/runtime 경계를 나눠서 점검
- asset public host 우선순위
  1. `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
  2. `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
  3. `BLOG_CONTENT_ASSET_BASE_URL_INTERNAL`
  4. `BLOG_CONTENT_ASSET_BASE_URL`
- package manager 기준
  - workspace `pnpm@11.0.4`
  - CI도 동일 계열로 맞춘 뒤 검증

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
