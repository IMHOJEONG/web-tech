# Docs Loading UX Policy

## 상태와 범위

- 상태: 적용 중
- 대상: `apps/docs`의 공개 콘텐츠 페이지와 부분 로딩
- 최종 검토: 2026-10-19
- 페이지별 스켈레톤은 로컬 작업 트리에 반영했다. 운영 배포 및 production CLS는 미검증이다.

## Purpose

이 문서는 `apps/docs`에서 로딩 UI를 어떤 기준으로 사용할지 정리합니다.

목표는 다음과 같습니다.

- 같은 순간에 여러 로딩 신호가 경쟁하지 않게 한다
- 사용자가 현재 기다리는 대상이 “페이지 전체”인지 “일부 영역”인지 바로 이해하게 한다
- 문서/콘텐츠 중심 제품에 맞는 차분한 로딩 경험을 유지한다

## Core Principle

`docs` 앱에서는 로딩 UI를 한 가지 역할에 한 가지 신호로 대응합니다.

- 전역 라우트 전환: `top loading bar`
- 섹션/영역 단위 비동기 로딩: `skeleton` 또는 작은 inline loading
- 정말 필요한 경우에만 spinner 사용

즉, 같은 전환에서 `top bar + spinner`를 동시에 강하게 노출하는 패턴은 기본값으로 사용하지 않습니다.

## Why

전역 bar와 원형 spinner를 동시에 보여주면 다음 문제가 생깁니다.

- 사용자가 어떤 로딩이 더 중요한지 판단하기 어렵다
- 전환 상태가 중복으로 느껴진다
- 문서 사이트 특유의 차분한 읽기 경험을 방해한다

`docs`는 읽기 중심 제품이므로, 전역 전환은 시야를 덜 가리는 방식이 더 적합합니다.

## Recommended Patterns

### 1. Global Route Transition

사용 예:

- 페이지 이동
- 탭 이동
- 문서 상세 페이지 전환

권장:

- 상단 `top loading bar`

비권장:

- 화면 한가운데 spinner
- top bar와 spinner 동시 사용

이유:

- 전환이 진행 중임을 충분히 알려주면서도 본문 가독성을 해치지 않는다

### 2. Section / Region Loading

사용 예:

- 카드 리스트 일부 갱신
- 관련 문서 영역 fetch
- 검색 결과 영역만 새로고침

권장:

- skeleton
- 작은 inline loading text

예:

- `Loading articles...`
- `Updating results...`

이유:

- 사용자가 어떤 자리가 채워질지 예측할 수 있다
- 레이아웃 점프가 줄어든다

### 3. Spinner Usage

spinner는 다음 조건에서만 제한적으로 사용합니다.

- 아주 작은 인터랙션 단위
- skeleton이 과한 경우
- 아이콘 크기 수준의 짧은 waiting state

예:

- 버튼 내부 pending state
- 아주 작은 패널 refresh

## Current Interpretation For `apps/docs`

현재 기준 추천은 아래와 같습니다.

- `NextTopLoader`
  - 전역 route transition 전용으로 사용
- 상세 페이지 `Suspense fallback`
  - 단순 spinner보다 skeleton 또는 문맥형 loading text 우선
- 전역 spinner
  - 기본 비활성 또는 사용 지양

## Practical Rule

새 로딩 UI를 넣기 전에 아래 질문으로 판단합니다.

1. 지금 기다리는 것은 페이지 전체인가
2. 아니면 특정 섹션만 갱신되는가
3. 사용자가 미리 레이아웃 형태를 알면 도움이 되는가

판단 기준:

- 페이지 전체면 `top bar`
- 섹션 단위면 `skeleton`
- 아주 작은 액션이면 `spinner`

## 페이지별 골격과 재사용 경계

2026-10-19에는 범용 카드 세 개를 모든 화면에 표시하던 `ContentPending`을 제거하고 페이지 도메인별로 조합한다. 전역 progress bar 정책과 검색 이동 계약은 바꾸지 않는다.

페이지별 골격은 공용 헤더·탐색·푸터를 덮는 전역 로딩 화면이 아니라, 각 페이지의 콘텐츠 영역을 채우는 fallback이다. 홈처럼 정적인 부분을 먼저 표시할 수 있는 화면은 대기 범위를 더 좁힌다.

| 계층                     | 책임                                                | 재사용 대상                                                       |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------------------- |
| shared                   | 로딩 상태 안내와 장식용 막대                        | `PendingStatus`, `SkeletonBlock`                                  |
| entities/document        | 글 미리보기 카드의 골격과 반응형 크기               | `DocumentPreviewSkeleton`, 실제 카드와 공유하는 열·썸네일 클래스  |
| widgets/docs-index       | 검색 패널·필터·결과 목록                            | 실제 `DocsSearchPanel`, 선택 조건 `DocsIndexActiveFilters` 재사용 |
| widgets/content-hub      | Web/Mobile 헤더·카드 그리드, UI/UX 소개·가로형 카드 | `HubHeader`, `UiUxHubHero`와 글 카드 골격                         |
| widgets/m                | 피드의 대표 글·최근 글                              | 글 카드 골격 조합                                                 |
| widgets/category-browser | 카테고리 목록·하위 주제·문서 목록                   | 동일 도메인 안의 index/main/sub 조합                              |
| widgets/article-detail   | 본문과 TOC, 본문 내부 대기                          | 실제 `ArticleContentGrid`, `ArticleBodySkeleton`                  |
| widgets/root-landing     | 홈 최근 글만 대기                                   | 실제 `LatestNotesFrame`                                           |

범용 컴포넌트에 경로 이름별 분기를 계속 추가하지 않는다. 반대로 똑같은 카드 구조를 페이지마다 복사하지도 않는다. 공용 UI 패키지는 수정하지 않으며 블로그의 디자인 토큰과 도메인 지식은 docs 앱 안에 둔다.

### 표시와 데이터 경계

- `/docs`는 query를 정규화한 뒤 `Suspense`를 열어 실제 검색 제목·입력·선택 조건과 같은 크기를 사용한다. 골격 렌더링 함수는 별도의 문서 API·검색 인덱스 조회를 하지 않는다. 기존 Link 이동·prefetch 동작까지 네트워크 요청 0을 보장하는 의미는 아니다.
- 선택한 모음의 이름은 정적 편집 정의에서 얻는다. 모음 선택지의 공개 글 교차 검증은 그대로 유지한다. 정의되지 않은 ID는 ID로 표시하며, 로딩 전후에 이름이 달라지지 않는다.
- Web/Mobile 및 피드는 기존 명시적 `Suspense`와 route loading이 동일한 도메인 골격을 사용한다. `loading.tsx`에는 query나 params를 전달받을 수 없으므로 미확정 문서 제목·결과 수를 가짜 값으로 표시하지 않는다.
- 카테고리는 각 페이지의 명시적 `Suspense`를 사용한다. 상위 `/category/loading.tsx`의 범용 상속 때문에 하위 주제에 다른 골격이 보이는 경로를 제거했다. 상세 문서의 별도 로딩은 유지한다.
- 홈은 문서 조회를 최근 글 컴포넌트로 내려 소개·주제 탐색이 함께 기다리지 않게 한다. 소개·정책 같은 정적 페이지에는 인위적인 대기나 스켈레톤을 추가하지 않는다.
- 최소 표시 시간·의도적인 지연·클라이언트 화면 크기 판별을 넣지 않는다. 캐시와 transition에 따라 기존 화면이 유지되거나 스켈레톤이 보이지 않을 수 있다.

### 화면 안정성과 접근성

실제 화면의 padding·gap·breakpoint·이미지 크기를 재사용하고, 데이터 없이 아는 헤더와 검색 조건은 실제 콘텐츠를 유지한다. 상태 안내는 레이아웃을 밀지 않는 `sr-only`이며 장식 막대는 `aria-hidden`으로 숨긴다. 막대 묶음의 `motion-safe:animate-pulse`는 모션 줄이기에서 비활성화한다. 피드의 미확정 필터 표현은 `inert`와 `aria-hidden`으로 상호작용·낭독 대상에서 제외한다.

문서 제목의 실제 줄 수, 필터 개수, 빈 결과, 이미지·코드·본문 길이는 조회 전 알 수 없다. 따라서 초기 열·헤더·결과 시작점을 맞추는 정책이며 페이지 전체 높이나 CLS 0을 보장하는 정책은 아니다. 전체 목록 수를 추측해 수십 개의 빈 카드를 렌더링하지 않는다.

## 대안과 영향

| 대안                                 | 장점                              | 한계                                                         |
| ------------------------------------ | --------------------------------- | ------------------------------------------------------------ |
| 범용 카드만 사용                     | 변경 비용이 작음                  | 검색·그리드·가로형 카드·본문과 구조가 달라 교체 시 이동이 큼 |
| 모든 페이지 완전 별도 구현           | 개별 화면에 정밀하게 맞출 수 있음 | 카드·색상·접근성·breakpoint 복사본이 서로 어긋나기 쉬움      |
| 공통 부품 + 도메인별 조합, 현재 선택 | 재사용하면서 실제 레이아웃과 연결 | 실제 화면 변경 시 대응 골격·회귀 검사를 함께 관리해야 함     |

이는 기존 로딩 정책의 구현 보강이다. 데이터 조회 계약이나 공용 UI 패키지의 책임을 새로 바꾸는 ADR은 추가하지 않는다.

## 관련 문서

- [페이지별 스켈레톤 로컬 검증](../verification/accessibility/2026-10-19-page-skeletons-local.md)
- [구현 기록](../worklog/2026-10/2026-10-19-page-skeletons.md)
- [문서 목록 순서 검증](../verification/accessibility/2026-10-19-docs-index-order-local.md)
