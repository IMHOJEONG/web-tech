# Docs Feed Filter Policy

## Purpose

이 문서는 `apps/docs`의 `MainFeed` 필터 인터랙션을 어떤 방식으로 운영할지 정리합니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- `MainFeed` 필터 상태는 어디에 저장해야 하는가
- `client filter`, `route transition`, `query string` 중 무엇을 선택하는가
- `Feed` 허브와 `Web / Mobile / UI/UX` 허브의 역할은 어떻게 겹치지 않게 유지하는가

## Core Decision

`MainFeed` 필터 상태는 `query string`으로 표현합니다.

현재 정책:

- `/feed`
  - 전체 큐레이션 피드
- `/feed?topic=web`
  - 웹/엔지니어링 중심 피드
- `/feed?topic=mobile`
  - 모바일 중심 피드
- `/feed?topic=uiux`
  - UI/UX 중심 피드

즉 `Feed`는 하나의 라우트로 유지하고, 그 안의 보기 상태만 query string으로 분기합니다.

## Why Query String

### 1. 상태 공유가 가능하다

URL에 필터 상태가 남기 때문에:

- 새로고침 후에도 상태 유지
- 링크 공유 가능
- 뒤로가기/앞으로가기 경험 일관

### 2. 현재 IA와 잘 맞는다

이미 `docs` 앱은 검색을 `/docs?q=...` 형태로 다루고 있습니다.

그래서 `Feed`도:

- `/feed?topic=...`

형태를 쓰면 탐색 모델이 자연스럽게 맞춰집니다.

### 3. 독립 허브와 역할이 덜 겹친다

이미 다음 라우트가 존재합니다.

- `/web`
- `/mobile`
- `/ui-ux`

여기서 `route transition` 방식으로 `/feed/web` 같은 구조를 만들면:

- `Feed`의 큐레이션 허브 역할
- 각 섹션 허브의 목적

이 서로 더 쉽게 겹칩니다.

반면 query string은:

- `Feed`는 그대로 큐레이션 피드
- `topic`은 그 안의 보기 상태

로 해석할 수 있어 경계가 더 분명합니다.

## Why Not Client Filter

`client filter`는 구현이 빠르지만 다음 한계가 있습니다.

- URL 상태가 남지 않음
- 공유/새로고침/히스토리 경험이 약함
- 서버 렌더와 탐색 컨텍스트 설명력이 떨어짐

즉 프로토타입에는 적합할 수 있지만, `docs` 앱의 탐색 허브에는 덜 적합합니다.

## Why Not Route Transition

`route transition`은 라우트 의미가 강해지는 장점이 있지만, 현재 IA에선 중복 위험이 큽니다.

예:

- `/web`는 이미 웹 허브
- `/feed`는 큐레이션 피드

이 상태에서 `/feed/web`를 추가하면:

- 웹 허브인지
- 피드의 웹 필터 상태인지

의미가 흐려질 수 있습니다.

## Topic Rules

현재 `topic` 값은 아래만 허용합니다.

- `web`
- `mobile`
- `uiux`

유효하지 않은 값은 `all`로 정규화합니다.

즉:

- `/feed?topic=unknown`

은 내부적으로 `/feed`와 같은 의미로 처리합니다.

## Data Interpretation

이 필터는 문서 원문 소스를 바꾸는 것이 아니라, `Feed` 안에서 문서를 어떤 관점으로 재배열/축소해서 보여줄지 정하는 역할입니다.

즉:

- same source
- filtered presentation

구조입니다.

## Relationship To IA

이 정책은 다음 문서와 연결됩니다.

- `docs/architecture/docs-app-information-architecture.md`
- `docs/architecture/docs-feed-and-docs-routing-policy.md`

해석은 다음과 같습니다.

- `Feed`
  - 큐레이션 허브
- `topic`
  - 피드 안의 보기 상태
- `/web`, `/mobile`, `/ui-ux`
  - 독립 허브

즉 필터는 허브를 대체하지 않고, 허브 안의 탐색 밀도를 조절하는 장치입니다.

## Current Implementation Note

현재 구현은:

- query string 기반 필터 상태 연결
- 필터 버튼 active 상태 반영
- 필터 결과가 비어 있을 때 fallback 상태 제공

까지 반영되어 있습니다.

이후 확장 가능성:

- `sort` query 추가
- `tag` query 추가
- 피드 전용 큐레이션 블록도 필터에 맞게 재구성

## Decision Summary

1. `MainFeed` 필터는 `query string`으로 운영한다.
2. `Feed`는 하나의 라우트로 유지한다.
3. `topic`은 피드 안의 보기 상태를 의미한다.
4. `Web / Mobile / UI/UX` 허브는 별도 라우트로 유지한다.
