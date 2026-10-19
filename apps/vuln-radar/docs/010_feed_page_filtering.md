# Feed Page Filtering

## 배경

`overview`는 전체 위험 상태를 빠르게 판단하는 화면이지만, 실제 운영에서는 개별 취약점을 훑고 좁혀 보는 탐색 화면이 필요하다.
이번 작업에서는 `/feed` 라우트를 열고, 최신 취약점 흐름을 필터링할 수 있는 1차 화면을 추가했다.

## 적용 내용

- `/feed` 라우트를 `TanStack Router`에 등록했다.
- 사이드바의 두 번째 항목을 비활성 경보 버튼에서 실제 `Feed` 링크로 변경했다.
- `getFeed()` 응답을 기준으로 feed page를 구성했다.
- 검색어, priority, severity, KEV 여부 필터를 추가했다.
- 필터/정렬 로직은 `pages/feed/model/feed-filters.ts`로 분리했다.
- `node:test` 기반 모델 테스트와 `test:lib` 스크립트를 추가했다.
- `node --experimental-strip-types` 테스트와 Vite native config loader 경고에 맞춰 `.ts` 확장자 import를 허용하고, `vite.config.ts`의 내부 config import도 확장자 포함 형태로 정리했다.

## 업데이트 요약

현재 `/feed`는 1차 탐색 화면까지 열렸다.
다만 `source` 필터는 아직 데이터 계약이 부족해 바로 붙이지 않는다.
이번 후속 작업에서는 `P0/P1`만으로 판단하지 않도록 `reliability`를 먼저 붙였다.
다음 단계에서는 `011_feed_source_evidence_contract.md`를 기준으로 backend 응답에 `sourceIds`와 `evidence`를 추가한 뒤, frontend source filter를 활성화한다.

## 필터 정책

- 기본 정렬은 `updatedAt` 내림차순이다.
- keyword 검색은 `cveId`, `title`, `priority`, `severity`, `matchedWatchlist`, `kev` 텍스트를 대상으로 한다.
- priority 필터는 `all`, `P0`, `P1`, `P2`, `P3`를 지원한다.
- severity 필터는 `all`, `critical`, `high`, `medium`, `low`를 지원한다.
- KEV 필터는 `all`, `kev`를 지원한다.

## 보류한 범위

`source` 필터는 아직 적용하지 않았다.
현재 feed item 응답은 item 단위 source를 제공하지 않고, feed 전체의 `dataSource`만 제공한다.
따라서 지금 source 필터를 만들면 사용자가 “이 CVE가 어떤 원본에서 왔는지”와 “현재 API가 mock/database 중 어디서 왔는지”를 혼동할 수 있다.

source 필터를 추가하려면 backend feed item에 item 단위 원천 출처가 필요하다.
구체적인 설계 기준은 `011_feed_source_evidence_contract.md`에 정리한다.

- `sourceIds`: 취약점 또는 보조 신호가 확인된 원천 데이터
- `evidence`: priority 계산과 운영 판단에 영향을 준 근거
- `dataSource`: 현재 응답이 database/mock 중 어디서 왔는지 나타내는 런타임 상태

## 다음 후보

- 필터 상태를 URL query string으로 승격한다.
- source 필드를 backend read model에 추가한다.
- feed item에서 `왜 P0/P1인지`를 설명하는 score evidence UI를 추가한다.
