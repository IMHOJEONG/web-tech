# Docs Loading UX Policy

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

## Follow-up

- `apps/docs`의 상세 페이지 fallback을 skeleton 기반으로 바꿀지 검토
- `NextTopLoader`에서 spinner를 끄고 top bar만 유지할지 검토
- 검색 결과/카드 영역에 skeleton 패턴이 필요한지 점검
