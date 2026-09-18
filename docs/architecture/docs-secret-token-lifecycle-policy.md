# Docs Secret And Token Lifecycle Policy

## Status

- Adopted
- Applied scope: `apps/docs`, `apps/docs-backend`, docs 배포/관측 파이프라인
- Last reviewed: 2026-09-18

## 목적

이 문서는 HEAP-FORGE docs 운영에 사용하는 secret과 token을 빠짐없이
식별하고, 생성부터 폐기까지 같은 기준으로 관리하기 위한 상위 정책이다.

핵심 목표는 다음과 같다.

- 실제 secret 값을 Git, 문서, 로그에 남기지 않는다.
- 하나의 token을 서로 다른 용도로 재사용하지 않는다.
- 장기 credential은 소유자, 권한, 만료일과 다음 교체일을 추적한다.
- 노출 사고가 발생하면 정기 일정과 관계없이 즉시 폐기하고 재발급한다.
- 회전 자체가 장애를 만들지 않도록 발급, 배포, 검증, 폐기 순서를 지킨다.

## 관리 원칙

1. **용도별 분리**
   - 콘텐츠 읽기, cache revalidation, 로그 전송과 인프라 관리는 서로 다른
     credential을 사용한다.
2. **최소 권한**
   - read 작업에는 write 권한을 부여하지 않는다.
   - 계정 전체 권한보다 프로젝트, 패키지, zone 단위 권한을 우선한다.
3. **server-only**
   - secret에는 `NEXT_PUBLIC_` 또는 `VITE_` 접두사를 사용하지 않는다.
   - 브라우저 bundle, 응답 body와 client-side log에 secret을 전달하지 않는다.
4. **비공개 저장**
   - Vercel에서는 Production/Preview의 Sensitive environment variable을 사용한다.
   - NAS에서는 repository 밖의 권한 제한 파일과 Docker secret mount를 사용한다.
   - GitHub Actions에서는 repository/environment secret 또는 실행별
     `GITHUB_TOKEN`을 사용한다.
5. **값이 아닌 metadata만 기록**
   - 아래 항목만 secret inventory에 기록한다.
   - 이름, 용도, 소유자, 저장 위치, 권한 범위, 생성일, 마지막 회전일,
     다음 회전일, 만료일과 사용 중인 서비스

## Token Inventory

| Credential group                | 키 또는 저장 위치                                                                | 용도                                              | 기준 수명주기                                           |
| ------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Content API read secret         | Vercel `BLOG_CONTENT_API_TOKEN`, NAS `CONTENT_API_TOKEN_FILE`                    | docs 서버가 목록과 본문 API를 읽음                | 90일마다 회전                                           |
| Revalidation secret             | Vercel `BLOG_CONTENT_REVALIDATE_TOKEN`, NAS `DOCS_CONTENT_REVALIDATE_TOKEN_FILE` | NAS가 Vercel cache tag를 만료                     | 90일마다 회전                                           |
| Better Stack source token       | `DOCS_BETTER_STACK_SOURCE_TOKEN`                                                 | 구조화 로그 ingest                                | 분기별 검토, 180일 이내 교체 또는 source 재발급         |
| Better Auth secret              | `BETTER_AUTH_SECRET`                                                             | 인증 기능이 실제 활성화된 경우 서명/암호화        | 사용 여부를 분기별 확인, 활성화 시 180일 이내 계획 교체 |
| Cloudflare API token            | `CLOUDFLARE_API_TOKEN`                                                           | DNS, Tunnel 또는 배포 자동화가 실제 사용하는 경우 | 만료일을 설정하고 90일 이내 교체                        |
| GHCR NAS pull credential        | NAS의 `GHCR_READ_TOKEN` 등                                                       | private image pull                                | `read:packages`만 허용하고 90일 이내 만료/재발급        |
| GitHub Actions token            | workflow의 `GITHUB_TOKEN`                                                        | GHCR image publish 등                             | 실행마다 발급되므로 수동 회전하지 않음                  |
| Vercel automation bypass secret | Preview 자동 검증을 활성화한 경우의 CI secret                                    | 보호된 Preview 접근                               | 분기별 검토, 노출 또는 소비자 변경 시 즉시 교체         |

표의 주기는 이 저장소의 운영 기준이다. 공급자가 더 짧은 만료 기간을
강제하면 공급자 기준을 따른다. 사용하지 않는 optional credential은 빈 값으로
방치하지 말고 배포 플랫폼과 secret store에서 삭제한다.

### Secret이 아닌 값

다음 값은 공개되어도 되는 구성값이므로 token inventory와 회전 대상이 아니다.

- `DOCS_SITE_URL`, `NEXT_PUBLIC_SITE_URL`
- `BLOG_CONTENT_*_BASE_URL*`
- `DOCS_BETTER_STACK_INGESTING_URL`
- timeout, cache TTL, feature flag

공개 가능하다는 사실과 임의 변경해도 된다는 뜻은 다르다. 이 값은 일반 배포
설정으로 계속 관리한다.

## 회전 주기 해석

정기 회전만으로 보안이 완성되지는 않는다. 매월 값을 바꾸는 것보다 분기별로
다음 사항을 검토하고, 정해진 최대 수명 안에서 안전하게 회전하는 것이 우선이다.

- credential 소유자가 여전히 접근 권한을 가져야 하는가
- 사용 중인 서비스와 환경이 inventory와 일치하는가
- 권한 범위가 실제 작업보다 넓지 않은가
- 만료일과 다음 회전일이 등록돼 있는가
- 최근 `401`, `403`, 비정상 호출 또는 secret scanning 경고가 없는가

다음 이벤트에서는 마지막 회전일과 관계없이 즉시 교체한다.

- Git commit, issue, chat, screenshot 또는 로그에 값이 노출됨
- 노트북, NAS, CI runner 또는 계정이 침해됐을 가능성이 있음
- 운영자나 외부 도구의 접근 권한을 제거함
- 공급자가 노출 가능성 또는 보안 사고를 공지함
- 사용처나 권한 범위를 설명할 수 없는 credential을 발견함

노출된 값은 Git history에서 문자열만 지워도 안전해지지 않는다. 먼저 폐기하고
새 값을 배포한 뒤 history 정리를 별도 수행한다.

## 생성 기준

직접 관리하는 shared secret은 예측 가능한 단어, 날짜 또는 기존 token 일부를
재사용하지 않는다. 최소 256-bit CSPRNG 결과를 사용한다.

NAS secret file 생성 예시:

```bash
umask 077
openssl rand -hex 32 > /volume1/docker/heap-forge/secrets/new_token
```

- 생성 결과를 shell argument, command history 또는 채팅에 붙여 넣지 않는다.
- token 파일 소유자와 권한을 확인하고 container에는 read-only로 mount한다.
- Content API token과 revalidation token은 반드시 서로 다른 값으로 생성한다.

## 공통 회전 절차

공급자가 old/new credential 동시 유효를 지원하면 다음 순서를 사용한다.

1. 기존 credential을 유지한 채 새 credential을 발급한다.
2. 소비자 환경에 새 credential을 등록한다.
3. Vercel 환경변수라면 새 deployment를 생성한다.
4. 새 deployment와 NAS 호출을 검증한다.
5. 이전 credential을 폐기한다.
6. 이전 credential이 `401/403`으로 거부되는지 확인한다.
7. 실제 값 없이 회전 일자, 담당자와 검증 결과만 worklog에 남긴다.

Vercel 환경변수 변경은 기존 deployment에 소급되지 않는다. Production과
Preview에서 같은 credential을 사용한다면 두 환경과 관련 deployment를 모두
확인한 뒤 이전 값을 폐기한다.

## 저장소 전용 회전 절차

### Content API read secret

현재 `docs-backend`는 한 번에 하나의 `CONTENT_API_TOKEN`만 허용한다. 따라서
old/new token의 overlap을 지원하지 않으며 완전한 무중단 회전은 불가능하다.

현재 절차:

1. 새 token 파일을 임시 이름으로 생성한다.
2. NAS token file과 Vercel `BLOG_CONTENT_API_TOKEN` 변경을 같은 작업 창에서
   준비한다.
3. NAS secret을 교체하고 `docs-backend`를 재기동한다.
4. Vercel Sensitive 환경변수를 교체하고 즉시 재배포한다.
5. 새 token을 포함한 `/api/posts`, `/posts/{markdownPath}`가 `200`인지 확인한다.
6. token 없음, 잘못된 token과 이전 token이 `401`인지 확인한다.
7. `/docs`와 원격 상세를 확인하고 Runtime Logs에서 `source: remote`를 확인한다.

이 짧은 불일치 구간에는 원격 콘텐츠가 local fallback으로 낮아질 수 있다.
무중단 회전이 필요해지면 backend가 제한된 overlap 시간 동안 current/next 두
token을 허용하도록 별도 설계한다. 하나의 env에 쉼표로 token을 나열하는 임시
규칙은 도입하지 않는다.

### Revalidation secret

revalidation 실패는 300초 TTL fallback이 보완하므로 다음 순서로 교체한다.

1. Vercel `BLOG_CONTENT_REVALIDATE_TOKEN`을 새 값으로 바꾸고 재배포한다.
2. 새 token으로 `POST /api/revalidate/content`가 `200`인지 확인한다.
3. NAS의 `DOCS_CONTENT_REVALIDATE_TOKEN_FILE`을 같은 값으로 교체한다.
4. NAS publish command로 다시 호출해 `revalidated: true`를 확인한다.
5. 이전 token과 token 없는 요청이 `401`인지 확인한다.

endpoint는 반드시 `POST`와 `Authorization: Bearer`를 사용하며 query string에
token을 넣지 않는다.

## 공급자 Credential 기준

### GitHub와 GHCR

- workflow image publish에는 별도 PAT 대신 실행별 `GITHUB_TOKEN`과 필요한
  최소 `packages: write` 권한을 사용한다.
- NAS private image pull처럼 PAT가 필요한 경우 `read:packages`만 허용하고
  만료일을 설정한다.
- PAT 소유 계정이 바뀌면 만료일 전이라도 새 credential로 교체한다.

### Cloudflare

- 사용자 계정에 묶인 광범위 token보다 지원되는 범위에서는 account-owned
  token을 사용한다.
- zone, account와 작업 권한을 필요한 범위로 제한한다.
- 가능하면 TTL과 NAS/CI egress IP 제한을 함께 설정한다.
- roll은 기존 token을 즉시 무효화하므로 소비자 변경과 같은 작업 창에서
  수행한다.

### Better Stack

- docs 전용 source token을 사용하고 다른 앱과 공유하지 않는다.
- ingest endpoint와 source token을 한 쌍으로 관리한다.
- token 재발급 기능이 없다면 새 source를 만들고 전송을 검증한 후 기존 source를
  중단한다.
- 로그 payload에 Authorization header, token 또는 전체 credential URL을 넣지
  않는다.

## 검증과 감사 기록

회전 후에는 성공 요청만 확인하지 않는다.

- 새 token: 예상 endpoint에서 `200`
- token 없음: `401`
- 잘못된 token: `401`
- 이전 token: 폐기 후 `401`
- 응답: `Cache-Control: private, no-store`
- Content API 응답: `Vary: Authorization`
- 로그: token 값 없이 성공/실패 상태와 UTC timestamp만 기록

worklog에는 다음 형식의 metadata만 남긴다.

```text
credential: content-api-read
rotatedAt: 2026-09-18T00:00:00Z
nextRotationDue: 2026-12-17
environments: production, preview, nas
verification: new=200, missing=401, old=401
operator: repository owner
```

실제 token, 앞/뒤 일부, token 파일 내용과 Authorization header는 기록하지
않는다.

## 정기 운영 체크리스트

### 매월

- GitHub secret scanning과 Dependabot/Security 알림 확인
- Vercel Runtime Logs의 revalidation `401`, `429`, `5xx` 확인
- NAS와 Cloudflare의 비정상 인증 시도 확인

### 분기별

- inventory의 소유자, 권한, 만료일과 미사용 credential 확인
- Content API와 revalidation shared secret 회전
- GHCR/Cloudflare credential 만료 전에 재발급
- Production/Preview/NAS의 값 불일치 검증
- 사용하지 않는 `BETTER_AUTH_SECRET`, `CLOUDFLARE_API_TOKEN` 제거

## 관련 문서

- `docs/runbooks/content-api-auth-ops-runbook.md`
- `docs/runbooks/docs-env-checklist.md`
- `docs/runbooks/docs-backend-nas-deployment.md`
- `docs/architecture/docs-content-cache-revalidation-policy.md`
- `docs/architecture/docs-vercel-platform-operations-policy.md`
- [Vercel: Rotating environment variables](https://vercel.com/docs/environment-variables/rotating-secrets)
- [Vercel: Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [GitHub: Token expiration and revocation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)
- [GitHub: Permissions for GitHub Packages](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)
- [Cloudflare: Roll tokens](https://developers.cloudflare.com/fundamentals/api/how-to/roll-token/)
- [Cloudflare: Restrict tokens](https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/)
