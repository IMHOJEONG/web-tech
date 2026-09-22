# 2026-08-19 CI pnpm version source 정리

## 배경

GitHub Actions에서 `pnpm/action-setup`의 `with.version`과 루트
`package.json`의 `packageManager`가 서로 다른 pnpm 버전을 가리키며 CI가 실패했다.

발생한 조합:

- GitHub Actions: `version: 11.3.0`
- `package.json`: `pnpm@11.10.0+sha512...`

`pnpm/action-setup`은 두 위치에 버전이 동시에 지정되어 있고 값이 다르면
패키지 매니저 버전 불일치로 판단한다.

## 결정

pnpm 버전 기준은 루트 `package.json`의 `packageManager` 하나로 둔다.

## 반영

`.github/workflows/ci.yml`

- `pnpm/action-setup` 단계의 `with.version` 제거
- CI는 `packageManager`를 단일 source of truth로 사용

## 이유

- 로컬, CI, 배포 환경의 pnpm 기준을 한 파일에서 확인할 수 있다.
- 브랜치마다 GitHub Actions 하드코딩 버전과 `packageManager` 버전이 어긋나는 문제를 줄인다.
- pnpm 버전을 올릴 때 `package.json`만 갱신하면 되어 운영 부담이 작다.
