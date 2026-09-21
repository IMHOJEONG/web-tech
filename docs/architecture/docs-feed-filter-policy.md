# Docs Feed Filter Policy

## Purpose

이 문서는 `apps/docs`의 `MainFeed` 필터를 어떤 방식으로 운영할지 정리합니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- `Feed` 필터 상태는 어디에 저장해야 하는가
- `client filter`, `route transition`, `query string` 중 무엇을 선택하는가
- `Feed`와 `Web / Mobile / UI/UX` 허브의 역할은 어떻게 겹치지 않게 유지하는가

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

이미 검색은 `/docs?q=...` 형태로 운영하고 있습니다.

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

## Web·Mobile 주제 필터

상태: 적용 중. 최종 검토: 2026-09-21. 대상은 `/web`, `/mobile`이며 UI/UX 전용 화면은 변경하지 않는다.

- 큰 정적 소개 카드 대신 짧은 소개, 주제 필터, 글 목록을 보여준다.
- `/web?topic=react`, `/mobile?topic=ios`처럼 현재 채널 안에서 필터링한다. Feed의 `topic=web`과 달리 채널 안의 콘텐츠 태그를 의미한다.
- 기존 공개 목록의 `tags`를 사용하고 태그가 없으면 `topicLabel`을 사용한다. 본문에서 주제를 추측하거나 없는 주제를 미리 노출하지 않는다.
- 주제 값은 NFKC, 앞뒤 공백 제거, 소문자 변환으로 통일한다. 문서 하나의 중복 태그는 한 번만 센다. 서로 다른 의미 표기의 별칭 병합은 하지 않는다.
- 주제 개수는 필터 적용 전 채널 목록에서 계산한다. 여러 태그를 가진 글이 있으므로 주제별 개수 합은 전체 글 수보다 클 수 있다.
- 주제는 글 수 내림차순, 동률일 때 정규화된 값 순으로 표시한다. 처음에는 6개 주제를 보이고 나머지는 펼칠 수 있다. 선택한 주제는 접힌 상태에서도 항상 보인다.
- 글 1개 이하 또는 주제 1개 이하이면 불필요한 필터를 숨긴다. 직접 유효한 주제 URL로 들어왔을 때는 전체 목록으로 돌아갈 필터를 유지한다.
- 알 수 없는 값과 중복 `topic` 파라미터는 전체 목록으로 처리한다. 태그 없는 글도 전체 목록에는 포함한다.
- 기존 최근 6개 제한을 제거한다. 결과 개수와 실제 목록을 일치시키며, 글이 많아지면 필터 후 페이지네이션을 추가 검토한다.
- shadcn의 기존 Radix 기반 `Button asChild`와 locale `Link`를 조합한다. 링크 의미, Enter 이동, 새 탭 열기와 주소 복사를 유지하고 새 의존성은 추가하지 않는다.
- 선택은 체크 표시, `aria-current`, 기존 primary/surface/outline 토큰으로 표현한다. 44px 이상 터치 영역, 키보드 포커스, 모바일 줄바꿈, reduced-motion을 유지한다.
- 필터 결과는 서버에서 계산하고 query 접근은 Suspense 아래에 둔다. 링크 prefetch는 비활성화해 주제마다 불필요한 선행 조회를 만들지 않는다.
- locale과 브라우저 히스토리를 유지한다. canonical은 기존 페이지 정책대로 query 없는 채널 주소를 사용한다.

클라이언트 전용 필터 대신 URL 기반 서버 필터를 선택했다. 전체 본문 데이터를 브라우저에 전달하지 않는 대신 선택 시 서버 응답을 기다리는 비용이 있다. 목록 규모나 지연이 커지면 메타데이터 전용 클라이언트 필터 또는 페이지네이션을 비교한다.

관련 기록: [Web·Mobile 주제 필터 구현](../worklog/2026-09/2026-09-21-channel-topic-filters.md).
