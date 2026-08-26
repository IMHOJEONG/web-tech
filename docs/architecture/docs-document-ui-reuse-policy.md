# Docs Document UI Reuse Policy

이 문서는 `apps/docs`에서 문서 카드와 문서 메타 UI를 어디까지 공통화할지 정리한다.

## 배경

`/docs`, `/feed`, `/web`, `/mobile`, `/ui-ux`, `/category/*`는 모두 문서 데이터를 보여주지만 화면의 목적이 다르다.

- `/feed`: 읽을 글을 발견하게 만드는 큐레이션 화면
- `/docs`: 빠르게 검색하고 좁히는 문서 인덱스
- `/web`, `/mobile`, `/ui-ux`: 특정 채널의 허브
- `/category/*`: taxonomy 기반 목록

따라서 카드 전체를 하나로 합치면 각 화면의 역할 차이가 흐려질 수 있다. 대신 반복되는 작은 의미 단위를 공통화한다.

## 원칙

1. 카드 레이아웃은 화면별로 유지한다.
2. 문서 메타 표시 규칙은 공통 컴포넌트로 관리한다.
3. 썸네일 fallback, 날짜 포맷, tag/source/read-time 표현은 한 곳에서 바꿀 수 있어야 한다.
4. 공통 컴포넌트는 i18n 메시지를 직접 읽지 않고, 화면 컴포넌트가 번역된 label을 주입한다.
5. 공통화가 `/feed = 발견`, `/docs = 검색/색인`의 역할 차이를 약하게 만들면 분리 상태를 유지한다.

## 현재 공통 UI

- `apps/docs/shared/ui/document-thumbnail.tsx`
  - 문서 썸네일과 fallback 이미지를 관리한다.
  - 기본 fallback은 일반 문서용이며, 로컬 문서 카드에서는 `fallback="local"`을 명시한다.
- `apps/docs/shared/ui/document-date-text.tsx`
  - 문서 날짜를 동일한 `getTime()` 포맷으로 표시한다.
- `apps/docs/shared/ui/document-meta-pills.tsx`
  - `local/remote`, 읽기 시간, topic label, tags 같은 보조 메타를 pill 형태로 표시한다.
  - 번역 문구는 호출부에서 주입한다.

## 화면별 책임

### `/docs`

`DocsIndexCard`는 검색 결과와 인덱스 탐색을 위한 row/card hybrid 레이아웃을 유지한다.

- 제목과 요약이 가장 중요하다.
- `source`, `readMinutes`, `topicLabel`, `tags`는 보조 메타로 낮은 시각 강도를 갖는다.
- 검색 highlight는 `/docs` 카드 안에서 유지한다.

### 채널 허브

`HubPage`와 `MainCard`는 문서를 빠르게 훑는 썸네일 카드 레이아웃을 유지한다.

- 카드 전체 모양은 허브 컨텍스트에 맞게 유지한다.
- 썸네일 fallback과 날짜 포맷만 공통 UI를 사용한다.

### 카테고리 목록

`CategoryDocumentCard`는 taxonomy 목록 카드로 유지한다.

- 라우팅과 목록 밀도는 카테고리 화면이 결정한다.
- 썸네일 fallback과 날짜 포맷은 공통 UI를 사용한다.

## 아직 공통화하지 않는 것

- `/feed`의 editorial 카드 레이아웃
- `/feed` hero image composition
- 검색 highlight 마크업
- 채널 허브의 hero/stat/panel 구성

이 영역은 화면의 성격을 만들기 위한 표현이므로, 아직 공통화하지 않는다.

## 후속 후보

- `DocumentCardMeta` 모델 유틸 추가
  - `readMinutes`, `topicLabel`, `tags`, `contentSource`를 UI에 넘기기 좋은 형태로 정리
- `DocumentListItem` 추가 검토
  - `/docs`와 검색 결과 API consumer가 같은 row형 목록 UI를 쓰게 될 때만 검토
- `DocumentImagePolicy` 문서와 연결
  - 로컬/원격 asset fallback, remotePatterns, blur placeholder 정책을 함께 관리
