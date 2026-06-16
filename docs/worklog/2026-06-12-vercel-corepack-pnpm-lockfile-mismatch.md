# Vercel Corepack / pnpm Lockfile Mismatch 정리

## 배경

- `docs` 앱을 Vercel에 배포하는 과정에서 아래 로그가 확인되었다.
  - `Detected ENABLE_EXPERIMENTAL_COREPACK=1`
  - `Disabling corepack because it may break your project`
  - `Detected pnpm-lock.yaml 9`
  - `Using pnpm@9.x based on project creation date`
  - `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`

## 이번에 확인한 해석

- root `package.json`에는 `packageManager: pnpm@11.3.0`가 선언되어 있다.
- Vercel 공식 문서 기준으로는 `ENABLE_EXPERIMENTAL_COREPACK=1`과 root `package.json > packageManager`를 함께 사용하면 Corepack으로 package manager 버전을 고정할 수 있다.
- 하지만 이번 로그에서는 Corepack이 실제 install 단계 전에 비활성화되었다.
- Corepack이 꺼지자 Vercel은 `pnpm-lock.yaml` 버전 9를 보고 `pnpm@9.x 또는 pnpm@10.x` 계열로 추정했고, 프로젝트 생성 시점 기반 fallback으로 `pnpm@9.x`를 선택했다.
- 현재 저장소의 lockfile은 `pnpm@11.3.0` 기준과 최신 `overrides/catalog` 구성을 반영하고 있으므로, `pnpm@9.x`의 frozen install에서는 `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`가 발생할 수 있다.

## 이번에 반영한 조치

- `turbo.json`에 아래 설정을 추가했다.

```json
{
  "globalPassThroughEnv": ["COREPACK_HOME"]
}
```

- 목적은 Turbo가 Vercel 빌드 환경에서 Corepack 관련 경로를 잃지 않게 해서, root `packageManager` 선언을 실제 install 단계까지 이어지게 만드는 것이다.

## 로그를 이렇게 읽으면 된다

1. `Detected ENABLE_EXPERIMENTAL_COREPACK=1`
   - Vercel이 Corepack 사용 의도를 인식했다는 뜻
2. `Disabling corepack because it may break your project`
   - 실제 install에는 Corepack을 쓰지 않겠다는 뜻
3. `Detected pnpm-lock.yaml 9`
   - lockfile만 보고는 `pnpm@9`/`pnpm@10` 어느 쪽인지 애매하다는 뜻
4. `Using pnpm@9.x based on project creation date`
   - packageManager pin 대신 fallback heuristics로 버전을 골랐다는 뜻
5. `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`
   - 현재 lockfile이 그 fallback `pnpm` 및 현재 frozen install 조건과 맞지 않는다는 뜻

## 다음 점검 순서

1. Vercel 프로젝트에 `ENABLE_EXPERIMENTAL_COREPACK=1`이 실제로 설정되어 있는지 확인
2. 배포 커밋에 `turbo.json > globalPassThroughEnv: ["COREPACK_HOME"]`가 포함되어 있는지 확인
3. root `package.json > packageManager`가 최신 배포 커밋에 포함되어 있는지 확인
4. 필요하면 Vercel 캐시를 무효화하고 재배포
5. 그래도 같은 로그가 나오면, install 단계에서 실제로 어떤 `pnpm` 버전이 실행되는지 build log 기준으로 다시 확인

## 참고

- Vercel Docs `Configuring a Build`
  - `ENABLE_EXPERIMENTAL_COREPACK=1` 환경 변수와 root `package.json > packageManager`로 Corepack을 사용할 수 있다고 설명한다.
