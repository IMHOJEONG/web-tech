# Docs Remote Payload Observability Runbook

## Purpose

이 문서는 `apps/docs`가 remote content payload schema failure를 어떻게 기록하고 운영에서 어떻게 해석할지 정리한다.

대상 범위:

- remote payload parse failure
- top-level payload shape drift
- field-level contract drift
- alerting / error aggregation 연결 후보

## Current Event

현재 코드에서 payload schema failure는 아래 event shape로 기록한다.

event name:

- `docs.remote_payload_schema_failure`

포함 정보:

- `label`
- `url`
- `payloadSummary`
- `issues`

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

## What It Means

이 이벤트는 단순 network failure와 다르다.

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

## Alerting Recommendation

현재는 structured `console.error`까지 연결되어 있다.

다음 단계 후보:

1. deployment platform log drain에서 event name 필터링
2. Sentry / Datadog 같은 error aggregation에 event forwarding
3. 동일 `url + issues` 반복 발생 시 alert noise dedupe

권장 우선순위:

- 개인/소규모 운영: log query + 수동 확인
- 문서 수와 배포 빈도가 커지면: error aggregation 연결

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
