# Docs Secret And Token Lifecycle Policy

## 작업 목적

docs 운영에 사용하는 Content API, cache revalidation, 관측 및 인프라
credential을 하나의 수명주기 정책으로 관리한다.

## 반영 내용

- 필수, 선택, 공급자 자동 관리 token inventory를 구분했다.
- Content API와 revalidation shared secret의 90일 회전 기준을 확정했다.
- Better Stack, Better Auth, Cloudflare와 GHCR credential의 검토/만료 기준을
  추가했다.
- `GITHUB_TOKEN`은 실행마다 발급되므로 수동 회전 대상에서 제외했다.
- 정기 회전 외에 노출, 권한 변경, 운영자 변경 시 즉시 폐기하는 조건을
  명시했다.
- 현재 Content API가 단일 token만 허용해 무중단 회전이 불가능한 한계와
  current/next dual-token 방식의 향후 개선 방향을 기록했다.
- Vercel, NAS, GitHub Actions에서 secret 값을 저장하고 검증하는 기준을
  정리했다.

## 보안 원칙

- 실제 token 값은 문서, 로그와 Git에 남기지 않는다.
- 회전 기록에는 이름, 일시, 환경과 상태 코드만 남긴다.
- 공개 URL과 feature flag는 token inventory에서 제외한다.
- 이전 token이 폐기 후 `401`인지 확인해야 회전이 완료된 것으로 본다.

## 기준 문서

- `docs/architecture/docs-secret-token-lifecycle-policy.md`
