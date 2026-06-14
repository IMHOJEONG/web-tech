# 로컬 개발 / 데이터 상태 판별 체크리스트

이 문서는 `vuln-radar-backend`를 로컬에서 붙일 때 자주 헷갈리는 지점과,
현재 DB 안 데이터가 `비어 있는지`, `mock seed인지`, `실데이터 ingest 결과인지`
어떻게 판별하는지 빠르게 정리한다.

## 결론 먼저

- `db:push`는 테이블을 만든다. 외부 취약점 데이터는 가져오지 않는다.
- `db:seed`는 demo/mock 성격 데이터를 넣는다.
- `POST /api/ingest/sync`는 실제 `NVD + KEV + EPSS`를 가져와 DB에 넣는다.
- frontend가 로컬에서 `http://localhost:3000/api/backend/...`를 치는 것은 정상이다.
- `VULN_RADAR_BACKEND_ORIGIN`은 브라우저 호출 URL이 아니라 프록시 목적지다.

## 1. 지금 DB 안 데이터는 무엇인가

### 경우 1. `db:push`만 했다

- 테이블만 생성됨
- row는 비어 있을 수 있음
- read API는 `mock fallback`으로 내려갈 가능성이 큼

즉:

- 구조만 준비됨
- 실데이터는 아직 없음

### 경우 2. `db:seed`를 했다

- demo/mock seed row가 DB에 들어감
- 날짜와 예시 CVE가 seed 기준일 수 있음

즉:

- DB에서 읽고 있더라도
- 그것이 운영 실데이터라는 뜻은 아님

### 경우 3. `POST /api/ingest/sync`를 했다

- 실제 upstream source를 pull
- DB에 vulnerability / advisory / epss / watch match가 upsert됨

즉:

- 이때부터 DB 안 데이터는 실데이터에 가깝다

## 2. 가장 빠른 판별 순서

### 1. `dataSource.kind` 보기

feed, overview, kev, watchlist 응답에는 `dataSource`가 있다.

- `kind: "mock"`
  - 현재 응답은 mock fallback
- `kind: "database"`
  - 현재 응답은 DB 기반

주의:

- `database`라고 해도 그 DB row가 seed일 수는 있다
- 즉 `database == 항상 실데이터`는 아니다

### 2. 최근 어떤 작업을 했는지 보기

- `db:push`만 했는지
- `db:seed`를 했는지
- `POST /api/ingest/sync`를 했는지

실무적으로는 이 이력이 가장 강한 힌트다.

### 3. `GET /api/ingest/status` 보기

여기서 아래를 같이 본다.

- `storage`
- `latest.databaseUpdatedAt`
- `latest.upstreamLastModifiedAt`
- `counts.vulnerabilities`

해석:

- `storage: "unavailable"`
  - DB client가 준비되지 않음
- `counts.vulnerabilities: 0`
  - DB가 비어 있을 가능성이 큼
- 최신 시각이 recent ingest와 맞는다
  - 실데이터 ingest가 반영되었을 가능성이 큼

## 3. `db:push`, `db:seed`, `ingest/sync` 차이

### `db:push`

- Prisma schema를 DB에 반영
- 테이블, 컬럼, 인덱스 구조 준비
- 외부 API 호출 없음

비유:

- 그릇 만들기

### `db:seed`

- repo 안 demo/mock 데이터 입력
- 개발 데모나 UI 초기 확인용

비유:

- 샘플 음식 담기

### `POST /api/ingest/sync`

- 실제 upstream source를 조회
- 정규화 후 DB upsert

비유:

- 실제 재료를 가져와서 채우기

## 4. 로컬 Docker Postgres에서 자주 막히는 이유

가장 흔한 원인은 `backend는 localhost:5432로 붙으려 하는데`,
Postgres 컨테이너가 호스트에 5432를 공개하지 않은 경우다.

예를 들어:

- backend `.env`
  - `DATABASE_URL=postgresql://postgres:example@localhost:5432/postgres`
- Docker service
  - `ports:` 없음

이 조합이면 `ECONNREFUSED`가 맞다.

### 해결 1. backend를 호스트에서 실행 중

Postgres service에 포트 공개 필요:

```yaml
ports:
  - "5432:5432"
```

### 해결 2. backend도 같은 Docker 네트워크 안에서 실행 중

그땐 `localhost`가 아니라 service name을 써야 한다.

```env
DATABASE_URL=postgresql://postgres:example@db:5432/postgres
```

## 5. frontend가 왜 `localhost:3000`으로 호출하나

이건 정상이다.

브라우저는 로컬에서 보통 아래만 호출한다.

```text
http://localhost:3000/api/backend/...
```

그리고 Vite dev server가 이를 뒤에서 프록시한다.

즉:

- 브라우저 공개 경로
  - `localhost:3000/api/backend/...`
- 실제 backend 목적지
  - `${VULN_RADAR_BACKEND_ORIGIN}/api/...`

따라서 `VULN_RADAR_BACKEND_ORIGIN`은
브라우저 주소가 아니라 프록시 target이다.

## 6. 로컬 호출이 안 될 때 보는 순서

### 1. backend가 떠 있는지

```bash
curl http://localhost:4000/api/health
```

### 2. frontend dev server가 떠 있는지

```bash
curl http://localhost:3000/api/backend/health
```

### 3. frontend env가 맞는지

- `VULN_RADAR_BACKEND_ORIGIN=http://localhost:4000`
- 또는 Railway backend를 쓸 거면 `https://<backend-host>`

주의:

- `https://<backend-host>:4000`처럼 잘못된 포트를 붙이면 안 될 수 있다

### 4. 토큰이 맞는지

backend는 `VULN_RADAR_API_TOKEN`을 검사하고,
frontend proxy는 `VULN_RADAR_BACKEND_API_TOKEN`을 넣는다.

즉:

- backend expected token
- frontend forwarded token

이 둘이 실제로 같아야 한다.

## 7. scheduler를 24시간으로 바꿨는데 왜 1시간마다 도나

코드 기본값을 바꿔도,
배포 env에 이미 `INGEST_SYNC_INTERVAL_MINUTES=60`이 들어 있으면
그 값이 우선한다.

즉:

- 코드 기본값 `1440`
- 배포 env `60`

이면 실제 런타임은 `60`이다.

가장 빠른 확인 포인트:

- Railway Variables의 실제 값
- 부팅 로그의
  - `Automatic ingest scheduler enabled. Sync runs every ... minutes.`

## 8. 로컬/운영에서 자주 쓰는 판별 질문

### “이 응답이 mock인가?”

- `dataSource.kind === "mock"`인지 본다

### “DB에 row는 있나?”

- `GET /api/ingest/status`
- `counts.vulnerabilities`

### “이 DB 데이터가 seed인가 실데이터인가?”

- 최근에 `db:seed`를 했는지
- `POST /api/ingest/sync`를 했는지
- row의 CVE/날짜/설명 패턴이 seed와 일치하는지

### “frontend가 왜 backend origin으로 직접 안 보이나?”

- 브라우저는 공개 경로만 본다
- 실제 목적지는 dev proxy/Vercel proxy가 뒤에서 연결한다

## 9. 로컬 DB에 실제 데이터 넣고 상세 페이지까지 확인하는 순서

mock 대신 로컬 DB에 실제 ingest 데이터를 넣고
상세 페이지까지 확인하고 싶다면 아래 순서로 보면 된다.

### 1. 로컬 DB와 backend를 먼저 정상화

- Postgres 컨테이너가 실제로 떠 있는지
- backend가 그 DB에 연결되는지
- `db:push`가 끝났는지

먼저 확인:

```bash
curl http://localhost:4000/api/health
```

### 2. watchlist를 최소 1개 넣기

watchlist가 없어도 ingest는 되지만,
실제 매치와 우선순위 확인까지 하려면 하나쯤 넣는 편이 좋다.

예시:

```bash
curl -X POST "http://localhost:4000/api/admin/watchlist" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "product",
    "value": "react",
    "enabled": true
  }'
```

### 3. 실제 ingest 실행

```bash
curl -X POST "http://localhost:4000/api/ingest/sync?lookbackHours=24" \
  -H "Authorization: Bearer <token>"
```

여기서 기대하는 것:

- `counts.processedVulnerabilities`가 0보다 큼
- `counts.nvdVulnerabilities`가 실제로 채워짐

### 4. ingest 상태 확인

```bash
curl "http://localhost:4000/api/ingest/status" \
  -H "Authorization: Bearer <token>"
```

확인 포인트:

- `storage: "database"`
- `counts.vulnerabilities > 0`
- `latest.databaseUpdatedAt` 갱신

### 5. feed에서 실제 CVE ID 확인

```bash
curl "http://localhost:4000/api/feed" \
  -H "Authorization: Bearer <token>"
```

여기서 중요한 점:

- 상세 페이지 확인은 `mock seed CVE`가 아니라
- **지금 feed 응답에 실제로 들어 있는 `cveId`**를 기준으로 해야 한다

즉:

- `CVE-2026-10001`처럼 mock 예시값을 바로 누르면
- 현재 DB에 그 값이 없어서 `404`가 날 수 있다

### 6. 프런트 상세 페이지 확인

frontend가 떠 있다면 아래 공개 경로로 확인한다.

```text
http://localhost:3000/vulnerabilities/<feed에서 본 실제 cveId>
```

또는 overview 화면에서 해당 feed item을 클릭한다.

이때 기대하는 것:

- 상세 페이지가 `404`가 아니라 실제 DB row를 보여줌
- description, CVSS, EPSS, advisory, watchlist match가 렌더링됨

### 7. 상세 404가 나는 경우 해석

`Vulnerability <CVE> was not found.`는 보통 아래 둘 중 하나다.

- 그 CVE가 현재 DB에 실제로 없음
- 목록은 mock인데 상세는 DB 기준으로 찾고 있음

따라서 상세를 점검할 때는 항상:

1. `/api/feed`에서 실제 cveId 확인
2. 그 cveId로 상세 페이지 열기

순서를 권장한다.

## 한 줄 요약

- `db:push`는 구조만 만든다
- `db:seed`는 demo/mock 데이터를 넣는다
- `ingest/sync`는 실데이터를 넣는다
- 로컬 Docker DB는 `localhost:5432` 공개 여부를 먼저 본다
- scheduler 주기는 코드 기본값보다 실제 배포 env가 우선한다
