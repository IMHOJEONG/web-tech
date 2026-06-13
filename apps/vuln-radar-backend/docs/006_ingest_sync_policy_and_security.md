# ingest/sync 운영 정책과 보안 메모

이 문서는 `vuln-radar-backend`의 `ingest/sync`를
어떻게 운영해야 하는지와, 보안 관점에서 무엇을 조심해야 하는지 따로 정리한다.

관련 구현은 아래를 기준으로 이해하면 된다.

- [ingest.controller.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/ingest.controller.ts:1)
- [ingest.service.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/ingest.service.ts:1)
- [ingest-scheduler.service.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/ingest-scheduler.service.ts:1)
- [backend-auth.guard.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/shared/guards/backend-auth.guard.ts:1)
- [app-config.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/config/app-config.ts:1)

## 결론 먼저

- `POST /api/ingest/sync`는 운영에서 직접 데이터를 당겨오는 수동 트리거다.
- scheduler는 같은 로직을 주기적으로 자동 실행하는 래퍼라고 보면 된다.
- 둘 다 강한 쓰기 작업이므로 공개 브라우저 경로처럼 다루면 안 된다.
- 현재 구조는 `단일 인스턴스` 기준으로는 충분하지만,
  replica가 여러 개가 되면 분산 락 또는 별도 worker로 옮기는 편이 안전하다.

## 현재 라우트 정책

`IngestController` 전체가 `BackendAuthGuard`로 보호된다.

- `GET /api/ingest/sources`
- `GET /api/ingest/status`
- `POST /api/ingest/sync`

즉 source/status도 공개 상태 확인 API가 아니라
운영용 관측 API로 보는 편이 맞다.

## 수동 sync와 자동 scheduler의 차이

### 수동 sync

`POST /api/ingest/sync`

용도:

- watchlist를 바꾼 뒤 바로 반영 확인
- 배포 직후 첫 실데이터 적재
- scheduler를 켜기 전 parser/normalization 검증
- 이상 징후가 있을 때 수동 재동기화

특징:

- `lookbackHours`를 쿼리로 줄 수 있다
- 값이 없으면 `INGEST_LOOKBACK_HOURS` 기본값을 사용한다
- 응답에는 처리 건수와 시작/종료 시각이 포함된다

예시:

```bash
curl -X POST "https://<backend-host>/api/ingest/sync" \
  -H "Authorization: Bearer <token>"
```

```bash
curl -X POST "https://<backend-host>/api/ingest/sync?lookbackHours=6" \
  -H "Authorization: Bearer <token>"
```

### 자동 scheduler

`IngestSchedulerService`가 앱 시작 시 interval을 등록한다.

관련 env:

- `INGEST_SCHEDULER_ENABLED`
- `INGEST_SYNC_INTERVAL_MINUTES`
- `INGEST_SYNC_ON_STARTUP`

현재 기본값은 다음과 같다.

- `INGEST_SCHEDULER_ENABLED=true`
- `INGEST_SYNC_INTERVAL_MINUTES=60`
- `INGEST_SYNC_ON_STARTUP=false`

즉 기본 해석은:

- 앱이 떠 있는 동안 60분마다 자동 sync
- 앱이 재시작될 때 즉시 sync는 하지 않음

## 현재 운영 정책 추천

### 1. 초기 배포 직후

- `db:push`로 schema 반영
- `POST /api/admin/watchlist`로 watchlist 준비
- `POST /api/ingest/sync` 수동 1회 실행
- `GET /api/ingest/status`와 read API 확인

이 단계에서는 scheduler를 켜두더라도
첫 확인은 수동 sync 기준으로 보는 편이 좋다.

### 2. 정상화 이후

- scheduler를 켜서 주기 polling 유지
- watchlist가 바뀌면 필요할 때만 수동 sync 추가 실행

즉 운영 기본 흐름은:

1. 평소에는 자동 scheduler
2. 운영 변경 직후에는 수동 sync

### 3. 장애/이상 징후 대응

아래 상황이면 수동 sync를 먼저 시도해볼 수 있다.

- read API freshness가 오래됨
- `dataSource.kind`가 계속 `mock`
- watchlist를 바꿨는데 결과가 반영되지 않음
- scheduler 로그에 실패가 반복됨

## 보안에서 제일 중요한 점

### 1. `VULN_RADAR_API_TOKEN`은 운영 토큰이다

이 토큰은 현재 아래를 보호한다.

- ingest API
- feed/read API
- watchlist admin API

즉 단순 프런트 공개 env처럼 다루면 안 된다.

권장:

- 브라우저 공개 env에 두지 않기
- CI/CD, Railway Variables 같은 서버 측 비밀 저장소에만 두기
- 문서/샘플에는 항상 `<token>` placeholder만 남기기

### 2. 브라우저에서 직접 admin/sync를 두드리지 않는 편이 안전하다

운영상 가장 안전한 기본값은:

- `curl`
- 서버 간 호출
- 보호된 내부 관리 화면

이다.

즉 `POST /api/ingest/sync`와 `POST /api/admin/watchlist`는
일반 사용자 브라우저 기능이 아니라 운영 액션으로 보는 것이 맞다.

### 3. read API도 현재는 운영 토큰 보호 대상이다

현재 구조상 `feed`, `overview`, `watchlist`, `kev`도
같은 backend auth를 탄다.

따라서 프런트가 붙을 때는:

- backend를 직접 공개하지 않고
- server-side proxy가 토큰을 주입하는 구조

가 더 안전하다.

## 현재 구조의 동시성 한계

### 1. 같은 인스턴스 안에서는 중복 실행 방지

`IngestSchedulerService`에는 `syncInFlight` 플래그가 있어서
한 인스턴스 안에서는 scheduler 중복 실행을 피한다.

즉:

- 이전 sync가 아직 끝나지 않았는데
- 다음 interval이 왔다면
- 그 인스턴스에서는 skip한다

### 2. 인스턴스가 여러 개면 분산 락은 없다

현재는 메모리 플래그 기반이라서:

- replica가 2개 이상이면
- 각 인스턴스가 자기 scheduler를 따로 돌릴 수 있다

즉 멀티 인스턴스 환경에서는 아래 중 하나가 필요해진다.

- Redis 기반 분산 락
- 별도 ingest worker 하나로 역할 분리
- queue 기반 단일 consumer 구조

현재 단계에서는 Railway 단일 backend 인스턴스 기준으로 이해하는 편이 맞다.

## 부하와 운영 감각

`syncRecent()`는 아래 write를 수행한다.

- vulnerability upsert
- advisory upsert
- epss score upsert
- watch match delete/upsert

즉 단순 read API보다 무겁다.

운영 감각상 권장:

- 너무 짧은 interval로 scheduler를 돌리지 않기
- watchlist 변경 직후에만 수동 sync를 추가로 사용하기
- ingest 직후 DB 로그와 API 응답 시간을 같이 보기

## `lookbackHours` 정책

`lookbackHours`는 없으면 기본값을 쓴다.

- 기본 env: `INGEST_LOOKBACK_HOURS=24`
- 수동 재검증 시에는 더 짧거나 긴 창으로 조절 가능

권장 기준:

- 평소 운영: 기본값 사용
- 빠른 점검: `6`
- 넓은 재동기화 확인: `24` 또는 `72`

주의:

- lookback이 길수록 NVD fetch 대상이 늘 수 있다
- 운영 중 무심코 큰 값을 자주 넣으면 write 부담이 커질 수 있다

## 운영에서 먼저 보는 것

### 1. scheduler 설정

- `INGEST_SCHEDULER_ENABLED`
- `INGEST_SYNC_INTERVAL_MINUTES`
- `INGEST_SYNC_ON_STARTUP`

### 2. 최근 상태

- `GET /api/ingest/status`

특히 본다:

- `scheduler.enabled`
- `scheduler.intervalMinutes`
- `latest.databaseUpdatedAt`
- `counts.vulnerabilities`
- `counts.enabledWatchlistEntries`

### 3. 수동 sync 결과

`POST /api/ingest/sync` 응답에서 본다:

- `startedAt`
- `completedAt`
- `lookbackHours`
- `counts.nvdVulnerabilities`
- `counts.kevEntries`
- `counts.epssScores`
- `counts.watchMatches`
- `counts.processedVulnerabilities`

### 4. read API 반영 여부

- `/api/feed`
- `/api/overview`
- `/api/watchlist`
- `/api/kev`

그리고 `dataSource.kind`가 `database`인지 본다.

## 권장 운영 체크리스트

### 배포 직후

1. `GET /api/health`
2. `GET /api/admin/watchlist`
3. `POST /api/admin/watchlist`
4. `POST /api/ingest/sync`
5. `GET /api/ingest/status`
6. `GET /api/feed`

### 평소 운영

1. scheduler가 켜져 있는지 확인
2. `latest.databaseUpdatedAt`이 너무 오래되지 않았는지 확인
3. mock fallback이 아닌지 확인
4. 필요할 때만 수동 sync 실행

### 보안 점검

1. `VULN_RADAR_API_TOKEN`이 브라우저 공개 env에 없는지
2. admin/sync 호출이 외부 공개 UI에 직접 묶여 있지 않은지
3. 문서/스크린샷/로그에 실제 토큰을 남기지 않았는지

## 한 줄 요약

- scheduler는 평소 운영용
- `POST /api/ingest/sync`는 수동 운영용
- 둘 다 같은 쓰기 로직을 실행한다
- 현재 보안의 핵심은 `VULN_RADAR_API_TOKEN`을 서버 측 비밀로만 다루는 것이다
- 멀티 인스턴스가 되면 지금 scheduler 구조는 분산 락이 없어 재설계가 필요하다
