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

1. 피드와 UI/UX처럼 같은 미리보기 맥락의 카드 표현은 공유할 수 있지만, 검색 인덱스와 taxonomy 카드는 화면별로 유지한다.
2. 문서 메타 표시 규칙은 공통 컴포넌트로 관리한다.
3. 썸네일 fallback, 날짜 포맷, tag/topic/read-time 표현은 한 곳에서 바꿀 수 있어야 한다.
4. 공통 컴포넌트는 i18n 메시지를 직접 읽지 않고, 화면 컴포넌트가 번역된 label을 주입한다.
5. 공통화가 `/feed = 발견`, `/docs = 검색/색인`의 역할 차이를 약하게 만들면 분리 상태를 유지한다.

## 현재 공통 UI

- `apps/docs/entities/document/ui/document-preview-card.tsx`
  - 피드와 UI/UX 목록의 단일 링크·썸네일·제목·요약을 공통으로 표시한다.
  - 데이터 조회, 필터, 큐레이션 순서, 번역은 호출 화면의 책임이다.

- `apps/docs/shared/ui/document-thumbnail.tsx`
  - 문서 썸네일과 fallback 이미지를 관리한다.
  - 기본 fallback은 일반 문서용이며, 로컬 문서 카드에서는 `fallback="local"`을 명시한다.
- `apps/docs/shared/ui/document-date-text.tsx`
  - 문서 날짜를 동일한 `getTime()` 포맷으로 표시한다.
- `apps/docs/shared/ui/document-meta-pills.tsx`
  - 읽기 시간, topic label, tags 같은 보조 메타를 pill 형태로 표시한다.
  - 번역 문구는 호출부에서 주입한다.

## 화면별 책임

### `/docs`

`DocsIndexCard`는 검색 결과와 인덱스 탐색을 위한 row/card hybrid 레이아웃을 유지한다.

- 제목과 요약이 가장 중요하다.
- `readMinutes`, `topicLabel`, `tags`는 보조 메타로 낮은 시각 강도를 갖는다.
- `local/remote` source는 사용자-facing 메타가 아니므로 카드에 표시하지 않는다.
- 검색 highlight는 `/docs` 카드 안에서 유지한다.

### 채널 허브

채널 허브는 문서를 빠르게 훑는 레이아웃을 유지한다. UI/UX 목록에서는 `DocumentPreviewCard`를 사용한다.

- 카드 전체 모양은 허브 컨텍스트에 맞게 유지한다.
- 썸네일 fallback과 날짜 포맷만 공통 UI를 사용한다.

### 카테고리 목록

`CategoryDocumentCard`는 taxonomy 목록 카드로 유지한다.

- 라우팅과 목록 밀도는 카테고리 화면이 결정한다.
- 썸네일 fallback과 날짜 포맷은 공통 UI를 사용한다.

## 본문 목차 공통 UI

로컬 MDX와 원격 HTML 본문은 `widgets/article-toc`의 같은 목록·필터·현재 위치 판정을 사용한다. 원본 heading ID와 링크 정규화 계약은 변경하지 않는다.

- 데스크톱은 기존 왼쪽 sticky 영역을 유지하되 큰 박스 대신 얇은 가이드와 현재 항목 표시를 사용한다. 하위 제목은 상대 깊이로 들여쓰고 긴 제목은 줄바꿈한다.
- 모바일·태블릿은 기본 접힘을 유지한다. 항목 수와 접힌 상태의 현재 제목을 보조 정보로 표시하고, 선택 후 닫힘·본문 제목 포커스 이동을 유지한다. Escape는 닫기와 summary 포커스 복귀를 수행한다.
- 현재 항목은 헤더 아래 읽기 선을 지난 제목으로 계산하고 `aria-current="location"`을 붙인다. 수동 스크롤은 URL hash를 바꾸지 않는다.
- 제목 위치는 레이아웃 크기/폰트 변화 때 측정하고, 스크롤은 프레임당 한 번의 캐시 탐색만 수행한다. 반복되는 동일 위치에서는 상태를 갱신하지 않으며 구독과 예약 프레임을 정리한다.
- 제목 없는 글은 빈 목차 박스 없이 본문을 표시한다. 키보드 포커스, 수정키 클릭, Next history state와 reduced-motion을 보존한다.

2026-11-14 로컬 구현이며 운영 반영은 아니다. 실제 검증 결과는 [공통 목차 검사](../verification/accessibility/2026-11-14-article-toc-ux.md)에 연결한다. 새로운 서버/공개 계약이나 공용 패키지 책임 변경이 없어 별도 ADR은 만들지 않는다.

## 아직 공통화하지 않는 것

- `/feed`의 editorial 배치와 데이터 선택
- `/feed` hero image composition
- 검색 highlight 마크업
- 채널 허브의 hero/stat/panel 구성

이 영역은 화면의 성격을 만들기 위한 표현이므로, 아직 공통화하지 않는다.

## 후속 후보

- `DocumentCardMeta` 모델 유틸 추가
  - `readMinutes`, `topicLabel`, `tags`를 UI에 넘기기 좋은 형태로 정리
- `DocumentListItem` 추가 검토
  - `/docs`와 검색 결과 API consumer가 같은 row형 목록 UI를 쓰게 될 때만 검토
- `DocumentImagePolicy` 문서와 연결
  - 로컬/원격 asset fallback, remotePatterns, blur placeholder 정책을 함께 관리

결정 이유와 적용 범위는 [ADR-0005](adr-0005-document-preview-card-boundary.md)를 따른다.
