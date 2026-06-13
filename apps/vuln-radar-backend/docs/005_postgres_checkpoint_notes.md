# PostgreSQL checkpoint 메모

이 문서는 PostgreSQL 로그에서 보이는 `checkpoint starting`, `checkpoint complete`가
무슨 의미인지와, 운영 중 어떤 관점으로 봐야 하는지 정리한다.

## 결론 먼저

- checkpoint는 에러가 아니라 정상적인 데이터베이스 유지 작업이다.
- 메모리(shared buffers)에 있던 dirty page를 디스크에 밀어내고,
  장애 복구 기준점을 정리하는 과정이라고 보면 된다.
- “무조건 한 시간마다” 도는 것은 아니다.
- 자동 checkpoint는 보통 아래 두 조건 중 하나로 발생한다.
  - 시간 기준
  - WAL 증가량 기준

## checkpoint가 언제 도나

자동 checkpoint는 보통 아래 두 가지 축으로 생각하면 된다.

### 1. 시간 기준

`checkpoint_timeout`이 최대 간격을 정한다.

- PostgreSQL 공식 문서 기준 기본값은 `5min`
- 즉 별도 튜닝이 없다면 “최대 5분 간격”으로 자동 checkpoint가 돌 수 있다

### 2. WAL 증가량 기준

`max_wal_size`에 가까워질수록 checkpoint가 더 빨리 일어날 수 있다.

- 공식 문서 기준 기본값은 `1GB`
- WAL이 빨리 쌓이면 시간 간격보다 먼저 checkpoint가 발생할 수 있다

즉 실제 운영에서는:

- 한동안 write가 적으면 시간 기준으로 돌고
- write가 많으면 WAL 기준으로 더 자주 돌 수 있다

## 이것이 "한 시간마다" 도는 건가

아니다. 여기서 헷갈리기 쉬운 것은 `checkpoint 주기`와
`vuln-radar-backend의 ingest 스케줄러 주기`가 서로 다른 개념이라는 점이다.

### PostgreSQL checkpoint

- 데이터베이스 엔진이 내부적으로 수행하는 유지 작업
- 보통 `checkpoint_timeout`과 `max_wal_size`에 의해 결정된다
- PostgreSQL 기본값 관점에서는 흔히 "최대 5분 간격"에 더 가깝다
- 즉 일반적으로 "한 시간마다"라고 보면 안 된다

### `vuln-radar-backend` ingest scheduler

이 프로젝트의 수집 루틴은 backend env로 따로 제어한다.

- `INGEST_SCHEDULER_ENABLED=true`
- `INGEST_SYNC_INTERVAL_MINUTES=1440`
- `INGEST_SYNC_ON_STARTUP=false`

즉 현재 앱 설정 기본값 기준으로는:

- ingest sync는 `24시간마다` 돌도록 해석할 수 있다
- 하지만 PostgreSQL checkpoint는 그 주기와 무관하게 별도로 돈다

한 줄로 구분하면:

- `checkpoint`: DB 내부 정리 작업
- `ingest scheduler`: 우리 앱의 외부 취약점 데이터 수집 작업

## 로그 예시 해석

예시:

```text
checkpoint starting: time
checkpoint complete: wrote 867 buffers (5.3%), wrote 4 SLRU buffers;
0 WAL file(s) added, 0 removed, 1 recycled;
write=86.659 s, sync=0.006 s, total=86.679 s;
sync files=38, longest=0.003 s, average=0.001 s;
distance=7797 kB, estimate=7933 kB;
lsn=0/32CF770, redo lsn=0/3285828
```

### `checkpoint starting: time`

- checkpoint가 시간 기준으로 시작됐다는 뜻
- 즉 `checkpoint_timeout` 조건이 도달했다는 의미

### `wrote 867 buffers (5.3%)`

- shared buffers에서 dirty page 867개를 디스크에 썼다는 뜻
- `(5.3%)`는 전체 버퍼 대비 비율

### `wrote 4 SLRU buffers`

- PostgreSQL 내부 메타데이터용 SLRU 버퍼도 함께 기록했다는 의미
- transaction status 같은 내부 관리 데이터가 여기에 포함될 수 있다

### `0 WAL file(s) added, 0 removed, 1 recycled`

- 새 WAL 파일 추가 없음
- 오래된 WAL 파일 삭제 없음
- WAL 파일 1개는 재사용

이건 보통 정상적이고 효율적인 동작으로 본다.

### `write=86.659 s`

- dirty page를 실제로 디스크로 쓰는 데 걸린 시간
- checkpoint 시간 대부분이 여기서 소비되었다는 뜻

### `sync=0.006 s`

- `fsync` 계열 동기화에 걸린 시간
- 여기서는 매우 짧다

### `total=86.679 s`

- checkpoint 전체 시간
- 거의 `write` 시간이 대부분을 차지한다는 걸 보여준다

### `sync files=38`

- 동기화 대상 파일 수

### `longest=0.003 s`

- 개별 파일 sync 중 가장 오래 걸린 시간

### `average=0.001 s`

- 개별 파일 sync 평균 시간

### `distance=7797 kB`

- 이전 checkpoint 이후 누적된 WAL 양

### `estimate=7933 kB`

- PostgreSQL이 추정한 다음 checkpoint 간 WAL 발생량 예측치

### `lsn=...`

- 현재 WAL 위치

### `redo lsn=...`

- 장애 복구 시 replay 시작 기준 위치

## 이 로그에서 무엇을 봐야 하나

### 1. 에러인지 아닌지

이 로그는 기본적으로 에러가 아니다.

- `LOG`
- `checkpoint starting`
- `checkpoint complete`

형태면 정상 운영 로그로 보는 것이 맞다.

### 2. 시간이 유난히 긴지

특히 아래를 본다.

- `write`
- `sync`
- `total`

이번 예시에서는:

- `write`는 길다
- `sync`는 매우 짧다

즉 병목이 있다면 `fsync`보다
dirty page write 자체 쪽일 가능성이 더 높다.

### 3. checkpoint가 너무 자주 도는지

아래 같은 로그가 자주 보이면 체크포인트가 잦을 수 있다.

- `checkpoint starting: time`
- `checkpoint starting: xlog`

이 경우는 WAL 설정과 write 패턴을 같이 봐야 한다.

## 관련 설정에서 알아둘 것

### `checkpoint_timeout`

- 자동 checkpoint 최대 간격
- 기본값 `5min`

### `checkpoint_completion_target`

- checkpoint를 전체 interval에 얼마나 넓게 펼칠지 정하는 값
- 기본값 `0.9`
- 높을수록 I/O를 더 고르게 분산하려는 성격

### `max_wal_size`

- 자동 checkpoint 전에 WAL이 커질 수 있는 soft limit
- 기본값 `1GB`

### `log_checkpoints`

- checkpoint 관련 로그를 남길지 여부
- 지금 이런 로그가 보인다는 것은 보통 이 설정이 활성화되어 있거나
  서비스 제공자가 관련 로그를 노출하고 있다는 뜻이다

## 지금 프로젝트에서 해석하는 법

`vuln-radar-backend`에서는 아래 작업들이 write를 늘릴 수 있다.

- `POST /api/ingest/sync`
- vulnerability upsert
- advisory upsert
- epss score upsert
- watch match 재계산

즉 ingest 직후 checkpoint 관련 로그가 늘어나는 것은
어느 정도 자연스러운 현상일 수 있다.

운영에서 볼 때는:

1. checkpoint 자체가 찍히는지보다
2. checkpoint 시간이 비정상적으로 길어지는지
3. ingest latency와 같이 튀는지

를 함께 보는 편이 더 유용하다.

## 운영 루틴에서 어떻게 같이 보면 좋은가

공부용으로는 아래 순서로 보면 이해가 쉽다.

### 1. 앱 수집 루틴 확인

- `INGEST_SCHEDULER_ENABLED`가 켜져 있는지
- `INGEST_SYNC_INTERVAL_MINUTES`가 몇 분인지
- `INGEST_SYNC_ON_STARTUP`이 켜져 있는지

즉 "우리 앱이 언제 데이터를 수집하는가"를 먼저 본다.

### 2. ingest 실행 전후 상태 확인

- `GET /api/ingest/status`
- `GET /api/feed`
- `GET /api/overview`

여기서 실제 데이터가 DB에서 읽히는지, mock fallback인지 같이 본다.

### 3. DB 로그는 보조 지표로 본다

- checkpoint가 찍히는지
- checkpoint `write` 시간이 너무 길지 않은지
- ingest 직후에만 일시적으로 늘어나는지

즉 checkpoint 로그는 "앱이 망가졌는지"보다
"DB write 부담이 어느 정도인지"를 보는 지표에 가깝다.

### 4. 이상 징후 판단

아래 조합이면 한 번 더 살펴볼 가치가 있다.

- ingest API 응답이 느려짐
- checkpoint `total` 시간이 계속 김
- checkpoint 로그가 지나치게 자주 반복됨
- read API가 mock fallback으로 돌아감

이 경우는 앱 수집 루틴과 DB write 부담을 같이 보는 편이 좋다.

## 한 줄 요약

- checkpoint는 정상 동작이다
- “한 시간마다”가 아니라 `checkpoint_timeout`과 `max_wal_size`의 영향을 받는다
- 반면 `vuln-radar-backend`의 ingest 수집 루틴은 기본값 기준 `24시간` 간격이다
- 예시 로그에서는 `fsync`보다 write 단계가 대부분 시간을 쓰고 있다

## 참고 문서

- PostgreSQL Write Ahead Log / Checkpoints
  - https://www.postgresql.org/docs/current/runtime-config-wal.html
- PostgreSQL WAL Configuration
  - https://www.postgresql.org/docs/current/wal-configuration.html
