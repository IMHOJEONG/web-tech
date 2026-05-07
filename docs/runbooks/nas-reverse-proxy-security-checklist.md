# NAS Reverse Proxy Security Checklist

## Purpose

이 문서는 NAS 역방향 프록시를 통해 `FastAPI` 또는 콘텐츠 endpoint를 외부에 공개할 때 확인해야 할 보안 기준을 정리합니다.

대상 시나리오:

- NAS 내부에서 Docker로 `FastAPI` 실행
- NAS 역방향 프록시 또는 NAS가 노출하는 80/443 포트를 통해 외부 도메인 연결
- `apps/docs`가 해당 콘텐츠 endpoint를 읽는 구조

## Core Rule

역방향 프록시를 여는 것 자체는 일반적인 방식이다.  
다만 **외부에 무엇을, 어떤 권한으로, 어떤 경로만 열 것인지**를 명확히 제한해야 안전하다.

권장 기본 구조:

1. 외부 클라이언트
2. NAS reverse proxy
3. 내부 HTTP 서비스 (`FastAPI`, content API)

즉:

- 외부에는 NAS reverse proxy만 노출
- 앱 서버나 API 컨테이너는 내부망에만 둔다

## Recommended Exposure Model

### Publicly Allowed

필요할 때만 외부 공개를 허용한다.

예:

- `GET /api/posts`
- `GET /posts/{markdownPath}`

이 경로들은 `read-only` 콘텐츠 소비에 필요한 최소 범위다.

### Not Public By Default

다음은 기본적으로 외부 비공개가 권장된다.

- admin endpoints
- upload/publish endpoints
- write API
- debug endpoints
- health endpoints 중 내부 운영 전용 것
- raw storage path

### Strongly Consider Disabling

FastAPI 기본 문서 경로는 운영에서 열지 않는 편이 안전하다.

- `/docs`
- `/redoc`
- `/openapi.json`

필요 시:

- 내부망/VPN에서만 열거나
- staging에서만 열고 production에서는 닫는다

## HTTPS

### Required

- 외부 노출이면 HTTPS를 기본값으로 사용
- HTTP는 HTTPS로 리다이렉트
- 인증서는 NAS 또는 앞단 프록시에서 관리

### Why

- 로그인/세션뿐 아니라 read-only 콘텐츠 API도 중간자 공격 대상이 될 수 있다
- `apps/docs`가 외부 endpoint를 읽을 때도 TLS가 맞지 않으면 fetch 실패와 보안 리스크가 동시에 생긴다

## Network Boundary

### Recommended

- NAS reverse proxy만 외부 개방
- FastAPI 컨테이너는 내부 포트만 사용
- 컨테이너 포트를 NAS 외부에 직접 publish 하지 않기

예:

- Good
  - NAS reverse proxy -> `api:80`
- Avoid
  - 외부에서 `:8000`으로 FastAPI 직접 접근

### Why

이렇게 해야:

- 보안 정책이 프록시 한 곳에 모이고
- 인증서, 라우팅, 제한 정책을 한 군데서 관리할 수 있다

## Auth / Authorization

### Read vs Write Separation

가장 중요한 기준:

- 읽기 endpoint
- 쓰기 endpoint

를 분리한다.

`apps/docs`는 read-only consumer로 두고, publish/upload는 별도 authoring workflow가 담당해야 한다.

권장:

- read credential은 앱 runtime만
- write credential은 로컬 authoring 또는 CI publish job만

### Do Not

- public reverse proxy 경로에 write API를 함께 열지 않는다
- 앱 runtime이 publish까지 수행하게 두지 않는다

## Route Minimization

역방향 프록시에서는 필요한 host/path만 연결한다.

권장 예:

- `content.example.com/api/posts`
- `content.example.com/posts/*`

지양:

- `content.example.com/*`를 통째로 내부 앱으로 연결

## Rate Limit / Abuse

공개 read endpoint라도 남용 가능성이 있다.

권장:

- 요청 빈도 제한
- 비정상 user-agent / bot 대응
- 필요 시 CDN/WAF 활용

콘텐츠 API는 인증이 없더라도 scraping이나 과도한 요청 대상이 될 수 있다.

## Logging / Audit

최소한 아래 로그는 확인 가능해야 한다.

- 어느 host/path로 요청이 들어왔는지
- 4xx / 5xx 비율
- TLS 오류 빈도
- upstream timeout 여부

프록시 로그와 API 로그를 함께 봐야 원인을 빠르게 좁힐 수 있다.

## App-Side Safety

`apps/docs` 쪽에서는:

- read path만 사용
- endpoint fallback은 read-only 기준으로만 허용
- write path와 절대 섞지 않음

환경변수도:

- `BLOG_CONTENT_*`는 read endpoint 전용
- write/upload endpoint는 별도 authoring 문맥에서만 사용

## Quick Checklist

- [ ] 외부에는 NAS reverse proxy만 노출되어 있는가
- [ ] FastAPI/API 컨테이너가 외부 포트로 직접 열려 있지 않은가
- [ ] HTTPS가 강제되는가
- [ ] 인증서 갱신 경로가 준비되어 있는가
- [ ] 공개 path가 `GET /api/posts`, `GET /posts/*` 수준으로 최소화되어 있는가
- [ ] `/docs`, `/redoc`, `/openapi.json` 공개 여부를 의도적으로 결정했는가
- [ ] write/upload/admin endpoint는 외부 비공개인가
- [ ] 앱 runtime과 publish workflow의 credential이 분리되어 있는가
- [ ] rate limit 또는 최소한의 abuse 대응이 있는가
- [ ] 프록시 로그와 앱 로그를 확인할 수 있는가

## Recommended Decision For This Repo

현재 구조에서는:

- `apps/docs`
  - read-only
- NAS reverse proxy
  - HTTPS / host / path 노출 제어
- authoring/publish workflow
  - write-only

가 가장 안정적이다.

즉:

- 콘텐츠 읽기는 public reverse proxy 경유
- 콘텐츠 쓰기는 로컬/CI에서 별도 수행

으로 분리하는 것이 맞다.

## Related Docs

- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs-env-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/docs-env-checklist.md)
