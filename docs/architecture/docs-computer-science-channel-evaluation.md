# Computer Science Channel Evaluation

## Purpose

이 문서는 `운영체제`, `네트워크`, `자료구조`, `컴퓨터 구조` 같은 컴퓨터 과학 주제를 `apps/docs` 안에서 어떻게 다룰지 정리합니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- `Computer Science` 또는 `CS` 전용 탭을 상단 내비게이션에 바로 추가해야 하는가
- `Web / Mobile / UI/UX`와 다른 성격의 주제를 어떤 단계로 확장해야 하는가
- 언제 하위 분류로 두고, 언제 독립 허브나 탭으로 승격해야 하는가

## Current Judgment

현재 시점에서는 `Computer Science`를 상단 탭으로 바로 추가하지 않는 편이 더 좋습니다.

이유는 다음과 같습니다.

1. 현재 상단 내비게이션은 사용자-facing 목적지가 비교적 명확합니다.
   - `Feed`
   - `Web`
   - `Mobile`
   - `UI/UX`
   - `About`

2. `Computer Science`는 위 채널들과 분류 기준이 다릅니다.
   - `Web / Mobile / UI/UX`는 제품/플랫폼/경험 중심 허브입니다.
   - `Computer Science`는 기반 이론/시스템 지식 중심 허브입니다.

3. 지금 바로 탭을 추가하면 내비게이션 철학이 섞일 수 있습니다.
   - 일부는 제품/플랫폼 분류
   - 일부는 학문/기초 시스템 분류

즉 `좋은 주제`인 것과 `지금 즉시 top-level 탭으로 올리는 것`은 같은 판단이 아닙니다.

## Recommended Rollout

권장 순서는 아래와 같습니다.

### 1. 하위 분류로 먼저 검증

우선은 `docs`와 `feed` 안에서 하위 분류로 검증합니다.

예:

- `OPERATING SYSTEMS`
- `NETWORK`
- `COMPUTER SCIENCE`
- `RUNTIME`
- `SYSTEM DESIGN`

이 단계에서 확인할 것:

- 실제로 글이 꾸준히 쌓이는가
- 검색/피드에서 이 분류가 유의미하게 읽히는가
- 사용자가 `Web` 글과 `CS` 글을 분리해서 소비하는가

### 2. 독립 허브로 실험

문서가 일정량 쌓이면, 상단 탭 전에 별도 허브를 실험합니다.

예:

- `/computer-science`
- `/cs`

이 페이지는:

- 운영체제
- 네트워크
- 자료구조/알고리즘
- 컴퓨터 구조

같은 하위 주제를 묶는 editorial hub가 될 수 있습니다.

이 단계의 목적은 `탭 승격`이 아니라, `정말 독립된 사용자 목적지가 되는지`를 검증하는 것입니다.

### 3. top-level 탭 승격 여부 결정

아래 조건이 맞으면 그때 `Computer Science`를 상단 탭으로 승격할 수 있습니다.

1. 문서량이 충분하다.
   - 최소 5~10개 이상의 독립 문서가 있고, 한 번성 실험이 아니다.

2. 기존 `Web` 채널과 읽기 목적이 명확히 다르다.
   - 예: 브라우저 렌더링은 `Web`
   - 예: TCP/IP, 프로세스, 메모리 관리, 스케줄링은 `Computer Science`

3. 허브 페이지로서도 충분한 밀도를 가진다.
   - featured article
   - recent notes
   - topic clusters
   - cross-links

4. 상단 내비게이션 복잡도를 감수할 가치가 있다.
   - 탭을 추가해도 전체 IA가 더 쉬워지는가
   - 아니면 단지 메뉴만 늘어나는가

## IA Options

### Option A

`Computer Science`를 독립 허브로 두되 상단 탭은 아직 추가하지 않는다.

장점:

- IA 충격이 작다
- 콘텐츠 밀도 검증이 쉽다
- 나중에 탭 승격이 가능하다

단점:

- 발견성이 top-level 탭보다 낮다

### Option B

`Computer Science`를 `Web` 하위 editorial group으로 잠시 둔다.

예:

- browser runtime
- network fundamentals
- operating systems for frontend engineers

장점:

- 현재 채널 구조를 크게 건드리지 않는다
- 웹 엔지니어링 관점의 CS로 맥락화하기 쉽다

단점:

- 운영체제/네트워크처럼 넓은 주제를 `Web` 안에 가두는 인상이 생길 수 있다

### Option C

바로 상단 탭으로 추가한다.

장점:

- 발견성이 가장 높다
- 장기적으로 독립 채널이 될 의지가 분명하다

단점:

- 현재 IA 기준에서 가장 급진적이다
- 콘텐츠 밀도 부족 시 빈 탭처럼 보일 수 있다
- `Web / Mobile / UI/UX`와 성격이 다른 채널이 섞인다

## Recommendation

현재 추천은 `Option A`입니다.

즉:

- 먼저 하위 분류로 운영
- 필요하면 `/computer-science` 독립 허브를 실험
- 충분한 콘텐츠와 사용자 목적이 확인되면 top-level 승격

이 순서가 가장 안전합니다.

## Suggested Scope

초기 범위는 아래 정도가 적절합니다.

- 운영체제
- 네트워크
- 브라우저 아래층 런타임
- 메모리/프로세스/스레드
- 시스템 설계 입문 메모

반면 아래는 너무 이른 범위 확장일 수 있습니다.

- 별도 `Data Structures` 탭 분리
- 별도 `Security` 탭 분리
- 별도 `Algorithms` 탭 분리

처음에는 `Computer Science` umbrella 아래에서 밀도를 만든 뒤 다시 나누는 편이 낫습니다.

## Decision Rule

요약하면:

- `문서 수가 적고 성격 검증이 안 됨`
  - 하위 분류 유지
- `문서 수가 늘고 묶음으로 읽히기 시작함`
  - 독립 허브 실험
- `독립 허브도 충분히 작동함`
  - 상단 탭 승격 검토

한 줄 결론:

`Computer Science 전용 탭은 좋은 방향일 수 있지만, 지금은 바로 추가하기보다 하위 분류 -> 독립 허브 -> top-level 승격 순서가 더 적절합니다.`
