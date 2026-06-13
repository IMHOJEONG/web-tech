# backend bootstrap / ops 히스토리 정리

이 문서는 `vuln-radar-backend`를 붙이면서 실제로 겪었던 문제와
그 과정에서 정리된 `NestJS`, `Prisma`, `Railway`, `Vercel proxy`, `watchlist 운영` 기준을
한 곳에 묶어 둔 운영/학습 메모다.

목표는 두 가지다.

- 나중에 같은 문제를 다시 만나도 빠르게 복구할 수 있게 하기
- NestJS 및 인프라를 처음 만지는 사람도 “왜 이렇게 했는지”를 따라갈 수 있게 하기

## 결론 먼저

현재 기준 운영 흐름은 아래로 정리할 수 있다.

1. frontend는 `/api/backend/*`만 호출한다.
2. Vercel proxy가 backend origin으로 전달한다.
3. backend는 `/api/*` 아래에서 auth + read API + ingest API를 제공한다.
4. read API는 DB를 우선 사용하고, 준비 전에는 mock fallback을 사용한다.
5. 운영 watchlist는 JSON 파일보다는 admin API로 관리한다.
6. 외부 source는 push가 아니라 polling 기반으로 수집한다.

## 1. backend를 처음 붙일 때 정한 구조

처음에는 generic Nest 기본 골격에서 출발했지만,
실제 책임은 아래처럼 domain 중심으로 정리했다.

- `health`
  - 연결 상태 확인
- `feeds`
  - frontend read API
- `ingest`
  - 외부 source 수집
- `watchlist`
  - 운영 관심사 관리
- `infra/prisma`
  - DB 연결 복잡도 격리

이렇게 자른 이유는:

- controller가 DB 연결 세부 구현을 알지 않게 하기 위해
- read API와 ingest API를 섞지 않기 위해
- 향후 `scoring`, `alerts`, `SSE`를 붙일 공간을 확보하기 위해

관련 문서:

- `docs/001_nest_structure_and_request_flow.md`

## 2. frontend와 backend 경계

frontend는 외부 취약점 source를 직접 호출하지 않는다.
항상 backend를 통해서만 읽는다.

공개 경로 규칙:

- browser public path
  - `/api/backend/*`
- backend public path
  - `/api/*`

로컬 개발에서는:

- Vite `server.proxy`

운영 배포에서는:

- `vercel.json`
- `api/proxy.ts`

가 같은 공개 경로를 유지한 채 실제 목적지만 바꾼다.

이 구조를 택한 이유:

- browser 코드가 환경마다 달라지지 않게 하기 위해
- CORS 대응을 단순화하기 위해
- backend actual origin을 frontend 코드에 직접 노출하지 않기 위해

## 3. Vercel proxy에서 실제로 겪은 문제

운영 proxy를 붙이면서 아래 문제가 실제로 나왔다.

### 1. dev proxy와 Vercel proxy는 다르다

- `vite.config.ts`의 `server.proxy`는 개발 서버 전용이다
- Vercel production에는 그대로 적용되지 않는다

그래서 운영용 proxy function을 별도로 만들었다.

### 2. catch-all route가 다단계 path에서 불안정했다

초기에는 filesystem catch-all 기반 proxy를 썼지만
`/api/backend/ingest/status` 같은 다단계 path에서 edge 404가 났다.

그래서:

- 단일 `/api/proxy`
- `vercel.json` rewrite에 query로 실제 path를 전달

방식으로 바꿨다.

### 3. Vercel Node runtime과 Web `Response` 스타일이 달랐다

proxy 함수가 `Response`를 return하면 응답이 무시되고
결국 timeout으로 끝나는 문제가 있었다.

그래서 현재는 Node runtime에 맞는 `req, res` 흐름으로 맞췄다.

### 4. upstream body 전달 방식 때문에 JSON이 깨졌다

한때 network tab에는 `200`인데 body가
숫자 인덱스 object처럼 보이는 문제가 있었다.

원인:

- upstream body를 `Uint8Array`처럼 넘겼고
- 런타임이 이를 일반 object처럼 직렬화함

현재는 JSON/text 계열 응답은 문자열 그대로 전달한다.

### 5. data shape 에러와 network 에러는 다르다

`zod` parse failure는 network failure처럼 보여도
실제로는 계약 불일치다.

그래서 frontend에는:

- schema parse failure console log
- query별 에러 상세
- mock fallback 표시

를 추가했다.

관련 문서:

- `apps/vuln-radar/docs/005_vercel_proxy_debugging.md`

## 4. DB fallback과 오래된 날짜 문제

overview/feed/kev/watchlist 응답에서 오래된 날짜가 보였던 이유는
실시간 DB 값이 아니라 mock seed fallback이 내려오고 있었기 때문이다.

현재는 각 read API에 `dataSource` 메타데이터를 포함한다.

- `kind`
  - `database`
  - `mock`
- `reason`
  - `live_read_model`
  - `derived_from_feed`
  - `database_unavailable`
  - `no_database_rows`

이렇게 만든 이유:

- frontend에서 “지금 네트워크는 되는데 왜 날짜가 옛날인가?”를 바로 판단하기 위해
- backend가 DB 미준비/empty 상태를 명시적으로 드러내기 위해

즉 이제는:

- `generatedAt`만 볼 게 아니라
- `dataSource.kind`도 같이 봐야 한다

## 5. ingest / polling 구조에서 이해해야 할 점

이 프로젝트의 ingest는 “실시간 push”가 아니다.

현재 source:

- NVD
- CISA KEV
- FIRST EPSS

모두 pull 기반이다.

그래서 현재 의미의 “live”는:

- source가 우리에게 push해주는 구조가 아니라
- 우리가 주기적으로 당겨와 최신 상태에 가깝게 유지하는 구조

운영 기본 해석:

- `POST /api/ingest/sync`
  - 수동 검증
- `GET /api/ingest/status`
  - freshness 확인
- scheduler
  - 운영 자동화

즉 “실데이터 전환”은 아래 순서를 뜻한다.

1. DB schema 준비
2. watchlist 준비
3. ingest sync 실행
4. read API가 `database` source로 내려오는지 확인

관련 문서:

- `docs/002_live_ingest_and_polling.md`

## 6. Prisma / Railway에서 실제로 걸린 함정

이번 작업에서 가장 헷갈렸던 부분이다.

### 1. internal host는 로컬에서 못 붙는다

`*.railway.internal`은 같은 Railway project 환경 안에서만 쓰는 private host다.

즉 로컬에서 붙으려면:

- internal host가 아니라
- external reachable DB connection 정보

를 써야 한다.

### 2. HTTP 도메인과 DB 접속은 다르다

`*.railway.app` 도메인은 HTTP/HTTPS 서비스 공개용이다.

PostgreSQL 외부 접속은:

- public domain이 아니라
- DB용 external/TCP connection 정보

를 써야 한다.

### 3. `DIRECT_URL`이 있으면 `DATABASE_URL`보다 우선한다

현재 코드에서는:

1. `DIRECT_URL`
2. 없으면 `DATABASE_URL`

순서로 direct connection을 해석한다.

그래서 로컬에서 public DB URL을 넣었다고 생각해도,
`DIRECT_URL`에 예전 internal host가 남아 있으면 계속 internal host를 타게 된다.

### 4. `P1001`, `P1008`, `P2021`은 서로 다른 단계의 오류다

- `P1001`
  - host:port 도달 실패
- `P1008`
  - 연결은 됐지만 query timeout
- `P2021`
  - DB는 연결됐고 query도 날았지만 테이블이 없음

즉:

- `P1001`
  - 네트워크/주소 문제
- `P1008`
  - 외부 DB write path timeout 또는 DB 응답 지연
- `P2021`
  - schema 미반영

### 5. `db:push`와 `ingest sync`는 완전히 다르다

- `db:push`
  - schema 생성/반영
- `ingest sync`
  - 데이터를 source에서 읽어 적재

즉 `WatchlistEntry` 테이블이 없을 때는
먼저 `db:push`가 필요하고,
`ingest sync`가 이를 대신해주지 않는다.

### 6. Prisma generated client는 runtime dependency를 기대한다

실제로 Railway 런타임에서:

- Prisma generated client는 살아 있었지만
- 그 client가 요구하는 runtime helper 패키지가 빠져
- `Prisma client initialization skipped`가 났다

이 문제는 DB 문제가 아니라
배포 runtime dependency 누락 문제였다.

즉 Prisma generated output을 deploy할 때는
generated client가 require하는 런타임 패키지도 함께 있어야 한다.

## 7. watchlist 운영 방식을 바꾼 이유

처음엔 운영용 JSON + upsert 스크립트를 만들었다.

이 방식의 장점:

- 대량 입력에 좋음
- 파일로 백업 가능
- demo seed와 분리 가능

하지만 Railway 같은 운영 환경에선 단점이 컸다.

- 로컬 public DB write timeout 가능성
- 컨테이너 안에 파일을 임시로 넣는 절차가 번거로움
- 재배포 시 파일이 휘발될 수 있음

그래서 운영 기본값은 `admin/watchlist` CRUD API로 바꿨다.

운영 기본:

- `GET /api/admin/watchlist`
- `POST /api/admin/watchlist`
- `PATCH /api/admin/watchlist/:id`
- `DELETE /api/admin/watchlist/:id`

즉 현재 기준은:

- 일상 운영
  - admin API
- 초기 대량 반영 / 복원
  - JSON upsert

관련 문서:

- `docs/003_watchlist_admin_api.md`

## 8. env 파일을 왜 나눴나

처음에는 `.env` 하나에 모든 맥락을 담고 보려 했지만,
로컬과 Railway의 연결 규칙이 달라 헷갈리기 쉬웠다.

그래서 다음처럼 정리했다.

- `.env.example`
  - base local example
- `.env.local.example`
  - 로컬 머신 override 예제
- `.env.railway.example`
  - Railway Variables 참고용

로더도:

- `.env`
- `.env.local`

순서로 읽게 바꿨다.

즉 machine-specific 실험값은 `.env.local`에 두는 편이 더 안전하다.

## 9. 지금 기준 운영 체크리스트

### backend

1. `/api/health`
   - storage 확인
2. `/api/ingest/status`
   - DB freshness 확인
3. `/api/admin/watchlist`
   - CRUD 확인
4. `/api/ingest/sync`
   - 수동 sync 실행
5. `/api/feed`, `/api/overview`, `/api/watchlist`, `/api/kev`
   - 실제 read-model 확인

### frontend

1. `/api/backend/health`
   - proxy 기본 연결
2. overview 화면
   - error panel / source badge / mock fallback 확인
3. network tab
   - 응답 code와 body shape 확인

## 10. 처음 보는 사람이 꼭 기억할 것

- NestJS에서는 controller보다 module/service/repository 경계가 더 중요하다.
- Prisma 오류는 “DB 문제” 하나로 뭉뚱그리면 안 되고, 단계별로 나눠 봐야 한다.
- Railway에서는 HTTP domain, private host, DB external connection을 구분해야 한다.
- `db:push`와 `ingest sync`는 목적이 완전히 다르다.
- 운영 watchlist는 파일보다 API가 더 자연스러운 경우가 많다.
- mock fallback은 실패가 아니라 “계약 보호 장치”이기도 하다.

## 11. 시크릿 관리 메모

문서에는 실제 토큰/운영 호스트를 남기지 않고 모두 placeholder로 유지한다.

- `<backend-host>`
- `<token>`
- `<public-host>`

실제 값은:

- 로컬 `.env.local`
- Railway Variables

같은 비공개 설정 채널에서만 관리하는 것을 기준으로 한다.
