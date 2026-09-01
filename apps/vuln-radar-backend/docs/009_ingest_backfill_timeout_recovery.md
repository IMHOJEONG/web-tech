# ingest backfill timeout 복구 정책

## 배경

배포 환경에서 `POST /api/ingest/sync?lookbackHours=240`처럼
큰 backfill을 실행하면 아래 로그가 발생할 수 있다.

```text
Scheduled ingest sync (startup) failed: The operation was aborted due to timeout
DOMException [TimeoutError]: The operation was aborted due to timeout
```

이는 DB write 자체보다 앞 단계인 upstream fetch에서 발생하는 경우가 많다.
NVD, CISA KEV, EPSS collector가 외부 API를 호출하는 동안
요청 timeout을 넘기면 `AbortSignal.timeout(...)`이 요청을 중단한다.

## 원인

이전 구조의 문제는 세 가지였다.

- source timeout이 코드 안에 `20_000ms`로 고정되어 있었다
- NVD/KEV/EPSS 중 하나라도 실패하면 전체 sync가 실패했다
- 큰 backfill이 어느 source, 어느 단계에서 막혔는지 로그만 보고 알기 어려웠다

특히 `lookbackHours`가 커지면 NVD 조회 대상이 많아지고,
EPSS는 CVE ID를 여러 chunk로 나눠 반복 호출한다.
이때 chunk 하나만 timeout이 나도 전체 sync가 실패할 수 있었다.

## 적용한 근본 조치

### 1. source timeout 설정화

`INGEST_SOURCE_TIMEOUT_MS`를 추가했다.

기본값:

```env
INGEST_SOURCE_TIMEOUT_MS=60000
```

collector는 이 값을 사용해 NVD, CISA KEV, EPSS 요청 timeout을 맞춘다.

### 2. 최대 backfill 창 제한

`INGEST_MAX_LOOKBACK_HOURS`를 추가했다.

기본값:

```env
INGEST_MAX_LOOKBACK_HOURS=240
```

수동 요청의 `lookbackHours`가 이 값을 넘으면 API가 명시적으로 거절한다.
운영 실수로 지나치게 큰 backfill이 실행되는 것을 막기 위한 장치다.

### 3. source별 진행 로그

아래 단위로 로그를 남긴다.

- NVD page 요청 시작/완료
- CISA KEV catalog 요청 시작/완료
- EPSS batch chunk 요청 시작/완료
- source별 성공/실패와 duration
- sync 전체 처리 건수와 실패 source 수

운영 로그에서 `source=nvd`, `source=kev`, `source=epss`를 검색하면
어느 구간이 느린지 바로 확인할 수 있다.

### 4. 부분 성공 응답

이전에는 EPSS 하나가 실패해도 NVD/KEV 데이터 반영이 중단됐다.

현재는 다음처럼 동작한다.

- NVD와 CISA KEV 중 하나라도 성공하면 가능한 데이터는 DB에 반영한다
- EPSS 실패는 `failures`에 남기고 취약점 반영은 계속한다
- EPSS가 실패하면 기존 `epssScore`, `epssPercentile`, `riskScore`, `priority`는 덮어쓰지 않는다
- KEV가 실패하면 기존 `isKev`, `riskScore`, `priority`는 덮어쓰지 않는다
- NVD와 CISA KEV가 둘 다 실패하면 처리할 primary source가 없으므로 전체 실패한다

예시 응답:

```json
{
  "status": "partial",
  "lookbackHours": 72,
  "failures": [
    {
      "sourceId": "epss",
      "stage": "fetch_scores",
      "message": "The operation was aborted due to timeout",
      "fatal": false
    }
  ]
}
```

## 운영 권장값

신뢰성이 중요한 운영 환경은 아래 기준을 권장한다.

```env
INGEST_SCHEDULER_ENABLED=true
INGEST_SYNC_INTERVAL_MINUTES=60
INGEST_SYNC_ON_STARTUP=true
INGEST_LOOKBACK_HOURS=48
INGEST_MAX_LOOKBACK_HOURS=240
INGEST_SOURCE_TIMEOUT_MS=60000
```

## 장애 후 수동 복구 절차

한 번에 큰 backfill을 실행하기보다 창을 점점 넓힌다.

```bash
curl -X POST "https://<backend-host>/api/ingest/sync?lookbackHours=24" \
  -H "Authorization: Bearer <token>"
```

```bash
curl -X POST "https://<backend-host>/api/ingest/sync?lookbackHours=72" \
  -H "Authorization: Bearer <token>"
```

```bash
curl -X POST "https://<backend-host>/api/ingest/sync?lookbackHours=240" \
  -H "Authorization: Bearer <token>"
```

각 단계 후 확인한다.

```bash
curl "https://<backend-host>/api/ingest/status" \
  -H "Authorization: Bearer <token>"
```

## 앞으로의 개선 후보

아직 앱 내부 scheduler는 `setInterval` 기반이다.
단일 인스턴스에서는 동작하지만, 신뢰성이 중요한 운영에서는 장기적으로 아래가 더 낫다.

- 외부 cron이 `POST /api/ingest/sync`를 주기적으로 호출
- 별도 ingest worker를 두고 웹 API와 수집 책임 분리
- Redis/Postgres advisory lock 기반 분산 락 추가
- source별 마지막 성공 시각을 DB에 저장
- source별 실패 횟수와 연속 실패 알림 추가

## 관련 파일

- [app-config.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/config/app-config.ts:1)
- [ingest.service.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/ingest.service.ts:1)
- [nvd.collector.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/collectors/nvd/nvd.collector.ts:1)
- [kev.collector.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/collectors/kev/kev.collector.ts:1)
- [epss.collector.ts](/Users/coder/Desktop/project/web-tech/apps/vuln-radar-backend/src/modules/ingest/collectors/epss/epss.collector.ts:1)
