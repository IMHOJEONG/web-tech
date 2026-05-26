# Content API 인증/장애 대응 운영 Runbook

## 목적

`apps/docs`가 원격 콘텐츠 서버를 `server-to-server` 방식으로 읽을 때 필요한 운영 절차를 정리합니다.

대상 범위:

- `BLOG_CONTENT_API_TOKEN`
- `CONTENT_API_TOKEN`
- NAS reverse proxy의 `Authorization` 헤더 전달
- `401/403`, timeout, DNS 오류 대응
- 홈 `/`와 문서 상세의 장애 처리 기준

## 현재 운영 모델

- `apps/docs` 서버만 원격 콘텐츠 API를 읽습니다.
- 브라우저가 raw content URL을 직접 열면 `401/403`이 나야 합니다.
- 인증 방식은 `Authorization: Bearer <shared-secret>` 입니다.
- endpoint 선택은 한 번에 하나만 사용합니다.
  - 우선순위: `PUBLIC -> INTERNAL -> DEFAULT`

## 확정된 운영 기준

이 문서는 현재 저장소에서 원격 콘텐츠 인증/장애 대응의 기준 문서로 사용합니다.

핵심 기준:

1. read path와 publish path를 분리합니다.
2. `401/403`은 인증 실패로 해석하고 즉시 중단합니다.
3. 현재는 단일 endpoint 선택 정책을 사용합니다.
4. 향후 다중 endpoint 정책이 다시 필요해져도 네트워크 오류에서만 다음 후보를 시도합니다.
5. 홈 `/`와 문서 상세는 서로 다른 장애 처리 기준을 유지합니다.

## 시크릿 배치

프론트:

- env key: `BLOG_CONTENT_API_TOKEN`

백엔드:

- env key: `CONTENT_API_TOKEN`

중요:

- 이름은 달라도 되지만 값은 같아야 합니다.
- 예시 파일이 아닌 실제 비공개 env에만 둡니다.
- 저장소에는 절대 커밋하지 않습니다.

## 권장 토큰 교체 주기

기본 권장:

- 정기 교체: `90일` 주기
- 예외 교체: 아래 이벤트가 있으면 즉시 교체
  - 토큰이 실수로 커밋되었거나 노출됨
  - NAS/배포 환경 접근 권한이 변경됨
  - 운영자가 교체 이력이 불명확하다고 판단함

실무 메모:

- 작은 개인 프로젝트라면 `90일`이 과하지 않으면서도 관리 가능한 기준입니다.
- 너무 잦은 수동 교체는 운영 실수 가능성을 높이므로, 정기 + 이벤트 기반 혼합이 적절합니다.

## 토큰 회전 절차

1. 새 토큰 생성
2. 백엔드 `CONTENT_API_TOKEN` 교체
3. 프론트 `BLOG_CONTENT_API_TOKEN` 교체
4. 백엔드 재시작
5. 프론트 재배포 또는 서버 재시작
6. 아래 검증 수행

권장 검증:

```bash
curl -i https://your-content-host/api/posts \
  -H "Authorization: Bearer <new-token>"
```

기대 결과:

- 새 토큰: `200`
- 토큰 없음: `401` 또는 `403`
- 이전 토큰: `401` 또는 `403`

## Authorization 헤더 전달 검증

가장 먼저 볼 것:

1. reverse proxy가 `Authorization` 헤더를 upstream에 그대로 전달하는가
2. FastAPI가 실제로 `authorization` 값을 받는가

임시 점검용 예시:

```python
print("has auth header:", bool(authorization))
print("token configured:", bool(CONTENT_API_TOKEN))
```

해석:

- `has auth header: False`
  - proxy가 헤더를 안 넘기고 있을 가능성이 큼
- `token configured: False`
  - backend env 주입 실패
- 둘 다 `True`인데 401/403
  - 토큰 값 불일치 가능성이 큼

운영에서는 위 출력 대신 logger를 사용하고, 확인 후 상세 로그는 제거하는 편이 좋습니다.

## 상태 코드 정책

### `401/403`

의미:

- 인증 실패
- 토큰 누락
- 토큰 불일치
- 프록시가 `Authorization`을 누락

정책:

- 즉시 중단
- 다른 endpoint로 fallback 하지 않음

이유:

- 인증 실패를 네트워크 후보 문제로 오해하면 로그가 더 헷갈립니다.
- `public 401 -> internal timeout` 같은 연쇄 오탐을 막아야 합니다.

### `timeout`, `ENOTFOUND`, `EAI_AGAIN`, connection refused`

의미:

- 네트워크 도달성 문제
- DNS 문제
- 대상 서버 down

정책:

- 현재 운영 기준은 단일 endpoint 선택이므로 즉시 실패
- 향후 다중 endpoint 정책이 부활하더라도 이 계열 오류에서만 다음 후보 시도를 허용

### 왜 이렇게 구분하는가

- `401/403`
  - 토큰 누락
  - 토큰 불일치
  - reverse proxy 헤더 누락
  같은 인증/설정 문제일 가능성이 크므로, 다른 후보를 계속 시도할수록 원인 파악만 어려워집니다.
- network 계열 오류
  - 실제로 도달성 차이 때문일 수 있으므로, 미래에 다중 endpoint 정책이 다시 생기면 이 경우에만 다음 후보 시도가 의미가 있습니다.

## 재시작 / 배포 체크리스트

### Frontend

- `.env` 수정 후 `next dev` 완전 재시작
- 배포 환경이면 Vercel/서버 env에도 같은 값 반영
- `apps/docs`는 `server-only` fetch라서 브라우저 devtools에 요청이 안 보인다는 점을 전제

### Backend

- compose/env 수정 후 컨테이너 재시작
- 실제로 `CONTENT_API_TOKEN`이 컨테이너에 주입되었는지 확인

### Proxy

- 도메인/포트가 실제 content backend로 연결되는지 확인
- `Authorization` 헤더 전달 여부 확인

## 빠른 점검 순서

1. 브라우저에서 raw URL 직접 접근
   - `401/403`이면 정상 방향일 수 있음
2. `curl`로 토큰 포함 호출
   - `200`이면 backend는 정상
   - 프론트 env/재시작 문제를 의심
3. 프론트 서버 재시작 여부 확인
4. 배포 env 반영 여부 확인
5. backend env 주입 여부 확인
6. reverse proxy의 `Authorization` 전달 여부 확인

## 홈과 상세의 장애 처리 기준

현재 기준:

- 홈 `/`
  - `latest notes` 원격 fetch 실패 시 섹션 단위 graceful degradation
  - 페이지 전체는 계속 렌더
- 문서 상세 / 목록 핵심 흐름
  - 원격 콘텐츠를 못 읽으면 에러 페이지로 보냄

이 기준은 홈 첫 진입점의 가용성을 높이기 위한 예외 정책입니다.

## 운영자가 바로 써볼 수 있는 검증 명령

토큰 포함 목록 호출:

```bash
curl -i https://your-content-host/api/posts \
  -H "Authorization: Bearer <token>"
```

토큰 없이 목록 호출:

```bash
curl -i https://your-content-host/api/posts
```

본문 호출:

```bash
curl -i https://your-content-host/posts/feed/example-article \
  -H "Authorization: Bearer <token>"
```

판단 기준:

- `200`
  - backend 계약과 인증은 정상 방향
- `401/403`
  - 인증 실패 또는 proxy header 전달 문제
- `404`
  - `markdownPath`와 실제 파일 경로 불일치 가능성

## 관련 문서

- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs-env-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/docs-env-checklist.md)
- [nas-reverse-proxy-security-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/nas-reverse-proxy-security-checklist.md)
- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
