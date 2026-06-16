## Vercel Proxy Debugging

이 문서는 `apps/vuln-radar`가 Vercel에 배포된 뒤 `/api/backend/*` 경로에서 장애가 날 때 무엇을 먼저 확인해야 하는지 정리한다.

## 구조 요약

운영 경로는 아래 순서로 흐른다.

```text
Browser
-> https://<frontend>.vercel.app/api/backend/*
-> vercel.json rewrite
-> api/proxy.ts
-> https://<backend-origin>/api/*
```

현재 기준 파일:

- `apps/vuln-radar/vercel.json`
- `apps/vuln-radar/api/proxy.ts`

핵심 env:

- `VULN_RADAR_BACKEND_ORIGIN`
  - 예: `https://your-backend-host.example.com`
  - `/api`를 붙이지 않는다.
- `VULN_RADAR_BACKEND_API_TOKEN`
  - backend가 Bearer 인증을 요구할 때만 사용

## 로컬과 운영 차이

- local dev
  - `vite.config.ts > server.proxy`
- Vercel production
  - `vercel.json` + `api/proxy.ts`

즉, 로컬에서 정상이어도 운영 프록시 계층은 따로 점검해야 한다.

## 먼저 볼 것

### 1. direct backend가 정상인가

먼저 backend를 직접 친다.

```bash
curl -i --max-time 20 'https://your-backend-host.example.com/api/health'
curl -i --max-time 20 -H 'Authorization: Bearer <token>' 'https://your-backend-host.example.com/api/overview'
curl -i --max-time 20 -H 'Authorization: Bearer <token>' 'https://your-backend-host.example.com/api/feed'
curl -i --max-time 20 -H 'Authorization: Bearer <token>' 'https://your-backend-host.example.com/api/watchlist'
curl -i --max-time 20 -H 'Authorization: Bearer <token>' 'https://your-backend-host.example.com/api/ingest/status'
```

여기서 `200`이면 backend는 정상이고, 문제 범위는 Vercel 프록시로 줄어든다.

### 2. 브라우저 응답 코드를 본다

Network 탭에서 `/api/backend/*` 요청의 최종 상태를 본다.

- `200`
  - 프록시 정상
- `401`
  - Bearer 토큰이 없거나 틀림
- `404`
  - backend에 라우트가 없거나 다른 배포본
- `502`
  - proxy 구현 문제
- `504`
  - 예전엔 함수 timeout이었고, 현재는 거의 정리 대상

### 3. Vercel Function Logs를 본다

로그 검색 키워드:

- `"[vuln-radar proxy]"`

우선순위 높은 로그 3개:

- `request received`
- `starting upstream fetch`
- `upstream response received`

확인할 필드:

- `backendOrigin`
- `upstreamUrl`
- `hasAuthorizationHeader`
- `status`

정상 예시:

```text
backendOrigin: https://your-backend-host.example.com
upstreamUrl: https://your-backend-host.example.com/api/overview
hasAuthorizationHeader: true
status: 200
```

## 자주 본 증상과 의미

### `FUNCTION_INVOCATION_TIMEOUT`

초기 원인 후보:

- proxy 함수 시그니처가 Vercel Node 런타임과 맞지 않음
- 잘못된 URL 처리
- self-loop

현재 프록시 구현에서는 이 문제를 정리했으므로, 다시 나오면 최신 배포가 맞는지 먼저 본다.

### `Invalid URL`

원인:

- `request.url`이 절대 URL이 아니라 상대 경로로 들어옴

현재 프록시는 `x-forwarded-proto`, `x-forwarded-host`, `host` 기준으로 origin을 복원한다.

### `request.headers.get is not a function`

원인:

- Vercel Node 함수의 request headers가 표준 `Headers`가 아니라 plain object로 들어옴

현재 프록시는 `Headers`와 object 둘 다 처리한다.

### `ERR_CONTENT_DECODING_FAILED`

원인:

- upstream 압축 응답을 프록시가 다시 전달하면서 `content-encoding` 헤더까지 같이 넘겨 브라우저가 재해석 실패

현재 프록시는:

- `accept-encoding` 제거
- `content-encoding` 제거

를 수행한다.

### `401 Unauthorized`

의미:

- direct backend가 이미 인증을 요구함
- proxy에서 `Authorization` 헤더를 못 붙였거나 토큰 값이 틀림

체크:

- `VULN_RADAR_BACKEND_API_TOKEN` env 이름이 정확한가
- `hasAuthorizationHeader: true`가 찍히는가
- direct backend + same token으로도 `200`이 나는가

### Browser response is `200`, but the app still shows `API Error`

의미:

- HTTP는 성공했지만 프런트가 기대하는 JSON shape로 전달되지 않았을 수 있다.
- 특히 proxy가 upstream body를 잘못 전달하면 브라우저 Network에는 `200`으로 보이지만,
  프런트 `zod` parse는 실패할 수 있다.

대표 증상:

```json
{
  "0": 123,
  "1": 34,
  "2": 103
}
```

원인:

- proxy가 upstream response body를 `Uint8Array`로 받은 뒤
- Vercel/Express `res.send()`가 이를 일반 object처럼 직렬화
- 결과적으로 정상 JSON 대신 숫자 인덱스 object가 브라우저에 전달됨

현재 프록시는:

- `application/json`
- `text/*`
- `application/problem+json`

응답은 `text()`로 그대로 전달한다.

체크:

- 브라우저 Network의 Response 탭에서 body가 정상 JSON인지 본다
- Overview 화면의 에러 상세에서 `parse` 실패가 찍히는지 본다
- 브라우저 콘솔에서 `[vuln-radar api] schema parse failed` 로그와 `issues`를 본다

### Browser response is `200`, but the timestamp still looks old

의미:

- proxy나 네트워크가 아니라 backend read API가 mock fallback을 반환 중일 수 있다.
- 이 경우 `generatedAt`은 최신 ingest 시각이 아니라 seed data 기준 시각일 수 있다.

체크:

- response body에 `dataSource`가 있는지 본다
- `dataSource.kind === "mock"`인지 확인한다
- 브라우저 콘솔에서 `[vuln-radar api] mock fallback response` 경고가 찍히는지 본다
- overview 화면 상단의 mock fallback 안내 문구를 본다

예시:

```json
{
  "generatedAt": "2026-05-18T09:00:00.000Z",
  "dataSource": {
    "kind": "mock",
    "reason": "no_database_rows",
    "message": "Feed is using seed mock data because no ingested database rows are available yet."
  }
}
```

해석:

- `database_unavailable`
  - DB 연결을 못 얻어서 seed mock으로 응답 중
- `no_database_rows`
  - DB 연결은 있지만 아직 ingest 결과 row가 없어서 seed mock으로 응답 중

## 엔드포인트 점검 순서

아래 순서로 보면 가장 빠르다.

1. `/api/backend/health`
2. `/api/backend/overview`
3. `/api/backend/feed`
4. `/api/backend/watchlist`
5. `/api/backend/ingest/status`

의미:

- `health`
  - 기본 연결 확인
- `overview`
  - 대표 read API 확인
- `feed`, `watchlist`
  - 인증/응답 전달 확인
- `ingest/status`
  - backend 라우트 포함 여부 확인

## 운영 체크리스트

Vercel에서 아래를 본다.

1. `VULN_RADAR_BACKEND_ORIGIN`
   - Production scope인지
   - 값이 `https://your-backend-host.example.com` 형태인지
   - `/api`를 붙이지 않았는지
2. `VULN_RADAR_BACKEND_API_TOKEN`
   - backend가 기대하는 값인지
3. env 수정 후 redeploy가 되었는지
4. Function Logs에 최신 배포 로그가 찍히는지

## 현재 프록시가 보장하는 것

현재 `api/proxy.ts`는 아래를 처리한다.

- public prefix `/api/backend` 제거
- internal proxy query(`proxyPath`) 해석
- rewrite 부산물 query(`proxyPath`, `...path`, `path`) 제거
- Bearer 토큰 주입
- 압축 관련 헤더 정리
- JSON/text 응답을 문자열 그대로 전달
- Vercel Node 런타임용 `req, res` 시그니처 대응
- 디버그 로그 유지
- mock fallback 응답은 프런트 콘솔에서 경고로 노출

## 관련 문서

- `docs/003_dev-runtime.md`
- `README.md`
