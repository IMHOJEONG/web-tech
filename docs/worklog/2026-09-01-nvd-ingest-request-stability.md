# NVD ingest request stability

## 배경

배포 환경에서 NVD 수집 중 아래 로그가 발생했다.

```text
Ingest source failed: source=nvd, stage=fetch_recent, durationMs=23912, error=terminated
```

`durationMs=23912`는 현재 source timeout 기본값인 `60_000ms`보다 짧다.
따라서 이 케이스는 애플리케이션이 timeout으로 직접 abort한 상황보다는,
NVD 응답 지연 또는 중간 네트워크 연결 종료로 fetch stream이 끊긴 상황에 가깝다.

## 확인 내용

로컬에서 NVD API를 직접 호출해보니 `resultsPerPage=200` 조건에서도
24시간 최근 변경분 응답이 약 20초, 약 5.7MB로 확인됐다.

```bash
curl -sS -L --max-time 30 \
  -D /tmp/nvd_headers_24_small.txt \
  -o /tmp/nvd_body_24_small.json \
  -w 'http_code=%{http_code} time_total=%{time_total} size_download=%{size_download}\n' \
  'https://services.nvd.nist.gov/rest/json/cves/2.0?lastModStartDate=2026-08-31T00%3A00%3A00.000Z&lastModEndDate=2026-09-01T00%3A00%3A00.000Z&resultsPerPage=200&startIndex=0'
```

결과:

```text
http_code=200 time_total=20.272164 size_download=5738286
```

`resultsPerPage=2000` 조건은 60초 이상 응답이 완료되지 않아 수동으로 중단했다.

## 적용 내용

- NVD page size를 `NVD_RESULTS_PER_PAGE`로 설정화했다.
- 기본값을 `2000`에서 `200`으로 낮췄다.
- NVD 일시 실패에 retry/backoff를 추가했다.
- page 사이 delay를 `NVD_REQUEST_PAGE_DELAY_MS`로 설정화했다.
- `GET /api/ingest/status` 응답에 현재 NVD 설정을 노출했다.

## 근본 조치 순서

1. 요청 단위 안정화
   `NVD_RESULTS_PER_PAGE=200`, retry, page delay를 적용한다.

2. 운영 관측 강화
   상태 API와 로그에서 NVD 설정값, page index, 처리량, 실패 사유를 확인한다.

3. NVD API key 적용
   운영 환경에는 `NVD_API_KEY`를 넣고 page delay를 더 짧게 가져간다.

4. source별 checkpoint 저장
   마지막 성공 시각을 source별로 저장해 누락 구간을 자동 복구한다.

5. 수집 작업 분리
   긴 backfill을 HTTP 요청 안에서 처리하지 않고 job worker/queue로 분리한다.

## 관련 파일

- `apps/vuln-radar-backend/src/modules/ingest/collectors/nvd/nvd.collector.ts`
- `apps/vuln-radar-backend/src/config/app-config.ts`
- `apps/vuln-radar-backend/docs/009_ingest_backfill_timeout_recovery.md`
