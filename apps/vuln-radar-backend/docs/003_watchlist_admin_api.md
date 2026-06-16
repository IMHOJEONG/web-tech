# watchlist admin API 운영 가이드

이 문서는 `vuln-radar-backend`에서 watchlist를 운영 중에 어떻게 관리하는지와,
왜 JSON upsert 스크립트보다 admin API를 기본 경로로 선택했는지 정리한다.

## 결론 먼저

- 운영 기본값은 `admin/watchlist` API다.
- JSON upsert 스크립트는 초기 일괄 입력이나 백업성 복원 작업에 더 가깝다.
- 실제 운영에서 watchlist를 자주 바꾸거나 Railway 같은 PaaS에 배포되어 있으면,
  API 방식이 더 단순하고 안전하다.

## 제공 엔드포인트

모든 엔드포인트는 `BackendAuthGuard`를 타므로
`Authorization: Bearer <VULN_RADAR_API_TOKEN>` 헤더가 필요하다.

- `GET /api/admin/watchlist`
- `POST /api/admin/watchlist`
- `PATCH /api/admin/watchlist/:id`
- `DELETE /api/admin/watchlist/:id`

## 왜 admin API를 선택했나

### 1. 배포 환경에서 더 자연스럽다

Railway 같은 PaaS에서는 다음 문제가 자주 생긴다.

- 로컬에서 public DB URL로 직접 write 시 timeout
- private DB host는 로컬에서 접근 불가
- 컨테이너 안에 파일을 임시로 복사해 스크립트를 돌리면 재배포 시 사라질 수 있음

반면 admin API는 이미 떠 있는 backend가 같은 네트워크, 같은 DB 설정으로 처리하므로
운영자가 DB 연결 방식을 따로 신경 쓸 필요가 적다.

### 2. demo seed와 섞이지 않는다

`db:seed`는 demo vulnerability/advisory/epss/alert까지 함께 넣는다.
watchlist만 운영에 반영하고 싶을 때는 과하다.

admin API는 `watchlistEntry`만 직접 다룬다.

### 3. 변경 단위가 작을 때 더 편하다

watchlist는 보통 이런 식으로 조금씩 바뀐다.

- 키워드 1개 추가
- noisy한 항목 1개 비활성화
- product 이름 수정

이런 작업은 JSON 파일 전체를 다시 준비해서 upsert하는 것보다
API 한두 번 호출하는 쪽이 빠르고 실수가 적다.

### 4. UI 연동 경로를 열어둔다

나중에 frontend settings 화면이나 내부 운영 콘솔을 붙일 때도,
이미 CRUD API가 있으면 그대로 연결할 수 있다.

## 언제 JSON upsert가 더 적합한가

API가 항상 정답은 아니다.
아래 경우에는 `watchlist:upsert`도 여전히 유효하다.

- 처음 운영 watchlist를 한 번에 많이 넣을 때
- 기존 watchlist를 파일 기준으로 통째로 맞추고 싶을 때
- 특정 시점의 관심사 구성을 파일로 백업하고 싶을 때

즉:

- 일상 운영: admin API
- 초기 대량 반영 / 복원: JSON upsert

## 운영 순서

### 1. watchlist 추가

```bash
curl -X POST "https://<backend-host>/api/admin/watchlist" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "product",
    "value": "react",
    "enabled": true
  }'
```

현재 validation 규칙:

- `type`
  - `vendor`
  - `product`
  - `ecosystem`
  - `keyword`
- `value`
  - trim 후 lowercase 정규화
- `enabled`
  - 생략 가능, 기본 `true`

### 2. watchlist 목록 확인

```bash
curl "https://<backend-host>/api/admin/watchlist" \
  -H "Authorization: Bearer <token>"
```

응답 예시:

```json
{
  "items": [
    {
      "id": "cm123...",
      "type": "product",
      "value": "react",
      "enabled": true,
      "createdAt": "2026-06-13T12:00:00.000Z",
      "updatedAt": "2026-06-13T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 3. 일부 수정

```bash
curl -X PATCH "https://<backend-host>/api/admin/watchlist/<id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

또는 값 수정:

```bash
curl -X PATCH "https://<backend-host>/api/admin/watchlist/<id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "next.js"
  }'
```

### 4. 삭제

```bash
curl -X DELETE "https://<backend-host>/api/admin/watchlist/<id>" \
  -H "Authorization: Bearer <token>"
```

### 5. ingest 실행

watchlist를 바꾼 뒤에는 다시 sync를 돌려야
새로운 match와 priority가 read-model에 반영된다.

```bash
curl -X POST "https://<backend-host>/api/ingest/sync?lookbackHours=24" \
  -H "Authorization: Bearer <token>"
```

## 운영에서 보는 확인 포인트

- `GET /api/admin/watchlist`
  - 항목이 원하는 상태로 들어갔는지
- `GET /api/ingest/status`
  - storage와 counts가 정상인지
- `GET /api/feed`
  - `matchedWatchlist`가 채워지는지
- `GET /api/overview`
  - watchlist 기반 priority 변화가 보이는지

## 현재 한계

- bulk create/update endpoint는 아직 없다
- CSV/JSON 파일 업로드 API는 아직 없다
- watchlist 변경 후 자동 sync는 아직 없다
  - 지금은 `POST /api/ingest/sync`를 직접 호출해야 한다

즉 현재 단계에서는
`작은 CRUD 작업은 API로`
`대량 초기 반영은 JSON upsert로`
운영하는 것이 가장 현실적이다.
