# Docs Remote Payload Observability Runbook

## Purpose

이 문서는 `apps/docs`가 remote content payload schema failure를 어떻게 기록하고 운영에서 어떻게 해석할지 정리한다.

대상 범위:

- remote payload parse failure
- top-level payload shape drift
- field-level contract drift
- local / remote content source selection
- Better Stack 로그 수집 및 알림 설정

## Payload Schema Failure Event

현재 코드에서 payload schema failure는 아래 event shape로 기록한다.

event name:

- `docs.remote_payload_schema_failure`

포함 정보:

- `label`
- `url`
- `payloadSummary`
- `issues`
- `fingerprint`: endpoint와 배열 위치를 제외한 필드 경로를 기준으로 생성한 집계 키

예시:

```json
{
  "event": "docs.remote_payload_schema_failure",
  "label": "public",
  "url": "https://content.example.com/api/posts",
  "payloadSummary": {
    "kind": "object",
    "keys": ["meta", "results"],
    "itemsCount": null,
    "resultsCount": 1
  },
  "issues": "results.0.date: must be a valid date-like value"
}
```

## Content Source Selection Event

목록/검색/상세가 로컬 문서와 원격 문서 중 어떤 소스를 사용했는지는 아래 event name으로 기록한다.

event name:

- `docs.content_source`

예시:

```json
{
  "area": "detail",
  "source": "remote",
  "reason": "remote-detail-found",
  "routePath": "web/browser/local-network-access",
  "includeRemote": true
}
```

목록/검색 예시:

```json
{
  "area": "index",
  "source": "mixed",
  "reason": "remote-index-enabled",
  "includeRemote": true,
  "localCount": 12,
  "remoteCount": 4,
  "totalCount": 16
}
```

필드 의미:

- `area`: `index`, `search`, `detail` 중 하나
- `source`: 최종 렌더링 기준 소스
- `reason`: 선택 이유 또는 fallback 이유
- `routePath`: 상세 페이지 route path
- `includeRemote`: 원격 인덱스 포함 여부
- `localCount`, `remoteCount`, `totalCount`: 목록/검색 병합 결과 확인용 count

주의:

- 토큰, Authorization header, 전체 endpoint URL은 기록하지 않는다.
- 검색어 원문은 기록하지 않고, 검색어 존재 여부만 `[provided]`로 남긴다.
- `local` / `remote` source 정보는 운영 관측용 메타데이터로 취급한다.
- 화면에는 source badge나 source filter를 노출하지 않는다.
- 로딩 경로 확인은 Vercel Runtime Logs 또는 서버 로그의 `docs.content_source`로 한다.

## Vercel Runtime Log Check

Vercel Dashboard:

- Project > Logs에서 `docs.content_source`로 검색한다.

Vercel CLI:

```bash
vercel logs --environment production --query "docs.content_source" --follow
```

특정 배포 URL 기준:

```bash
vercel logs --deployment https://your-deployment.vercel.app --query "docs.content_source" --expand
```

해석 예시:

- `source: "remote"`: 상세가 원격 문서를 사용했다.
- `source: "mixed"`: 목록/검색에서 원격과 로컬 문서를 병합했다.
- `source: "local"` + `reason: "remote-detail-unavailable-local-fallback"`: 원격 상세가 실패해서 로컬 fallback을 사용했다.
- `source: "local"` + `reason: "remote-index-disabled"`: 원격 인덱스가 꺼져 있어 로컬만 사용했다.
- `source: "none"`: 로컬/원격 모두에서 해당 문서를 찾지 못했다.

## What It Means

`docs.remote_payload_schema_failure` 이벤트는 단순 network failure와 다르다.

의미:

- endpoint는 응답했다
- JSON parse도 됐다
- 하지만 응답 shape 또는 field value가 현재 contract와 맞지 않는다

즉 운영 해석은 “서버 down”이 아니라 “upstream contract drift”에 가깝다.

## Typical Failure Types

### Container Shape Drift

예:

- `results` 대신 `data`
- `items` / `results`가 배열이 아님

대응:

- backend contract 변경 여부 확인
- deploy 직후라면 payload wrapper 수정 여부 확인

### Field Value Drift

예:

- `date: "not-a-date"`
- `status: "broken"`
- `readMinutes: 0`

대응:

- producer가 필드 의미를 바꿨는지 확인
- formatter / serializer가 blank string이나 invalid 값을 내보내는지 확인

## First Response Checklist

1. 해당 이벤트의 `label`과 `url` 확인
2. `payloadSummary.keys` 또는 `resultsCount` 확인
3. `issues`에서 첫 번째 깨진 field path 확인
4. backend payload sample을 curl로 재검증
5. 최근 backend deploy / content serializer 변경 여부 확인

## Quick Verification

목록 endpoint 확인:

```bash
curl -i https://your-content-host/api/posts \
  -H "Authorization: Bearer <token>"
```

JSON body를 로컬 파일로 저장해서 wrapper / field를 확인해도 된다.

## Better Stack 연결

2026-09-18 기준 서버용 HTTP ingestion을 사용한다. Next.js 클라이언트 SDK나 Vercel Log Drain은 필요하지 않다.
현재 전송 대상은 `docs.remote_payload_schema_failure` 하나다. 접속 장애, 인증 오류, 정상 요청, 브라우저 오류는 이 연결의 수집 대상이 아니다.

### 1. Source 생성

1. [Better Stack](https://betterstack.com/)에 가입 또는 로그인한다.
2. Telemetry/Logs → Sources → Connect source에서 `heap-forge-docs-production` 소스를 만든다. HTTP 또는 JavaScript/Node.js 수집 소스를 선택한다.
3. Source의 Configure 화면에서 **Source token**과 **Ingesting host**를 확인한다.
4. Ingesting host 앞에 `https://`를 붙인 origin을 사용한다. 대시보드 URL이나 임의의 공통 수집 주소를 사용하지 않는다.

Source token은 로그 쓰기용이며 계정 관리 API token과 다르다. 채팅·Git에 넣지 않는다.

### 2. 환경변수 설정

Vercel 프로젝트 Settings → Environment Variables의 Production 범위에 다음을 등록한 뒤 재배포한다.

```env
DOCS_BETTER_STACK_SOURCE_TOKEN=<Source token>
DOCS_BETTER_STACK_INGESTING_URL=https://<Ingesting host>
DOCS_BETTER_STACK_ENVIRONMENT=production
```

로컬 검증은 `apps/docs/.env.local`에 넣고 `DOCS_BETTER_STACK_ENVIRONMENT=development`로 구분한다.
Preview는 별도 소스를 권장하며 환경 이름은 `preview`로 설정한다. `NODE_ENV=production`만으로 Preview를 실서비스로 분류하지 않는다.
세 값이 모두 설정되어야 전송한다. 토큰과 주소가 모두 없으면 기존 콘솔 로그만 유지한다.
`apps/docs/turbo.json`의 `DOCS_*` 선언과 루트 `turbo.json`의 `globalEnv`에 등록되어 있다.
앱의 선언만으로는 의존 패키지인 `@web-tech/ui`, `@web-tech/docs-content-contract` 빌드에 적용되지 않아 Vercel 환경변수 누락 경고가 발생한다.
루트 선언으로 의존 빌드에도 전달하며, 값 변경 시 전체 task 캐시 키에 반영된다. 실제 토큰 값은 설정 파일에 넣지 않는다.

### 3. 데이터와 전달 보장 범위

- `dt`, `level=error`, `message`, `event`, `service=docs`, `environment`, `fingerprint`, `label`, `url`, `payloadSummary`, `issues`를 전송한다.
- endpoint의 사용자명·비밀번호·query·fragment는 제거한다. 원본 응답 본문과 인증 헤더는 전송하지 않는다.
- `results.0.date`와 `results.12.date`처럼 배열 위치만 다른 오류는 동일 fingerprint로 묶는다.
- 발생 건수 보존을 위해 앱에서 반복 이벤트를 버리지 않는다. 알림 반복 제어는 Better Stack에서 설정한다.
- 전송을 await하여 서버리스 실행 종료 전에 완료를 기다린다. 오류 처리 경로에 최대 약 1초의 네트워크 대기 시간이 추가될 수 있다.
- HTTP 수집 요청은 캐시하지 않고 리다이렉트를 따르지 않으며 재시도하지 않는다.
- quota 초과(402), 인증 오류(403), 네트워크 실패·timeout은 콘솔에 전달 상태만 남기고 기존 로컬 대체 흐름을 유지한다. 실패 시 유실될 수 있으며 영속 큐/재전송은 제공하지 않는다.
- 수집 서버의 응답 본문, token, 전체 fetch 예외는 전달 실패 로그에 기록하지 않는다.

### 4. 집계·알림 만들기

Live tail에서 `event=docs.remote_payload_schema_failure`와 `environment=production`을 필터링한다.
실제 소스에서 생성된 필드 이름을 확인한 뒤 해당 결과로 Chart/Exploration을 만들고 다음 규칙을 시작점으로 삼는다.

| 항목                | 초기 권장 설정                                      |
| ------------------- | --------------------------------------------------- |
| 집계                | 이벤트 수, fingerprint별 그룹                       |
| 검사 주기           | 1분                                                 |
| 조회 구간           | 최근 5분                                            |
| 임계값              | 오류 수가 0보다 큼                                  |
| Confirmation period | 0초: 새 형식 오류를 바로 확인                       |
| 데이터 없음         | Don't start an incident                             |
| Recovery            | 자동 복구를 끄고 정상 콘텐츠 조회 확인 후 수동 해결 |
| 알림 수신           | 본인 이메일부터 시작, 필요 시 Slack 연동            |

오류 이벤트가 더 이상 없다는 것만으로 복구를 판단하지 않는다. 방문 요청 자체가 없을 수도 있다.
인시던트가 열린 동안의 재알림/에스컬레이션 빈도는 수신 정책에서 제한한다. 그룹별 인시던트 생성과 재알림 동작은 테스트 소스로 확인한다.

### 5. 검증 순서

1. `pnpm --filter docs test:lib`로 모의 전송·인증 실패·timeout·집계 키 테스트를 실행한다. 이 테스트는 외부로 로그를 보내지 않는다.
2. 별도 개발 소스에 환경변수를 설정한다.
3. 개발용 콘텐츠 API가 유효한 JSON이지만 계약이 다른 응답을 반환하도록 만든다. 예: `{"data": []}`.
4. `/docs` 또는 `/sitemap.xml`을 요청해 로컬 문서로 응답하는지 확인한다.
5. Live tail에서 이벤트·environment·fingerprint·필드 오류를 확인하고 토큰/원본 본문이 없는지 확인한다.
6. 본인 수신 경로의 테스트 알림을 확인한다. 운영 API를 고의로 망가뜨리지는 않는다.
7. Production 설정 및 재배포 후 실제 로그 수신 상태를 점검한다.

코드 연결 완료와 외부 소스/알림 활성화는 별도다. 소스 생성·환경변수 등록·배포·실제 수신 확인 전에는 운영 알림이 활성화되었다고 판단하지 않는다.

공식 참고:

- [HTTP 로그 수집 API](https://betterstack.com/docs/logs/ingesting-data/http/logs/)
- [Source 생성과 로그 시작](https://betterstack.com/docs/logs/logging-start/)
- [차트·알림 설정](https://betterstack.com/docs/logs/dashboards/alerts/)
- [알림 API의 복구·데이터 없음 정책](https://betterstack.com/docs/logs/api/alerts/update/)

## What Not To Do

- payload schema failure를 network retry 문제로 취급하지 않는다
- 401/403과 동일한 종류의 장애로 묶지 않는다
- raw payload 전체를 무분별하게 로그에 남기지 않는다

이유:

- schema drift와 auth failure는 원인 계층이 다르다
- raw payload 전체 로그는 민감 정보나 노이즈를 늘릴 수 있다

## Related Docs

- [content-api-auth-ops-runbook.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/content-api-auth-ops-runbook.md)
- [docs-search-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-search-api-contract.md)
- [docs-blog-improvement-roadmap.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-blog-improvement-roadmap.md)
