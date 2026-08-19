# Overview KEV Matrix Initial Paint Notes

## Symptom

`/overview` 첫 진입 시 `KNOWN EXPLOITED VULNERABILITIES (KEV) MATRIX` 구간이 잠깐 비어 보였다가 한 번에 그려지는 현상이 있었다.

## Likely Cause

이 현상은 단순히 `kev` 데이터가 느려서라기보다, 아래 두 가지가 겹치면서 체감되기 쉬웠다.

1. `overview` 상단 섹션이 먼저 보이고, 하단 matrix는 표 형태 DOM과 시각 효과가 더 무거워 paint가 늦게 보일 수 있었다.
2. matrix 패널이 큰 `shadow`와 `backdrop-blur`를 사용하고 있어, 넓은 영역 렌더링 비용이 상대적으로 컸다.

## Applied Fix

### 1. Reserved height + skeleton rows

- `OverviewKevMatrixPanel`에 `min-h-[332px]`를 주어 레이아웃 높이를 먼저 확보했다.
- `kev` 쿼리가 아직 준비되지 않은 동안 table body 대신 skeleton row 4개를 보여주도록 변경했다.
- 이 방식으로 “빈칸이었다가 갑자기 뜨는” 인상을 줄이고, 사용자가 패널 위치를 먼저 인지할 수 있게 했다.

### 2. Reduced paint cost

- matrix 패널의 배경을 더 불투명하게 바꾸고,
- 큰 `backdrop-blur`를 제거하고,
- shadow 강도를 `0 20px 48px`에서 `0 12px 24px` 수준으로 낮췄다.

이 조합은 디자인 톤은 유지하면서도 초기 paint 비용을 낮추는 목적이다.

### 3. Route-level overview skeleton alignment

- 기존에는 `overview` 첫 로딩 시 간단한 단일 loading card만 먼저 보이고, 이후 실제 대시보드 grid 전체가 한 번에 교체되었다.
- 이 구조는 hard reload 시 상단/하단 section 비율이 달라 보여 layout shift 체감이 컸다.
- 현재는 `OverviewLoadingState`를 실제 overview와 거의 같은 grid 골격으로 맞춰, 첫 paint부터 비슷한 비율의 panel skeleton이 보이도록 조정했다.

이 조치는 SSR은 아니지만, CSR 환경에서도 “로딩 레이아웃”과 “실데이터 레이아웃” 차이를 줄이는 목적이다.

## Other Options Considered

### 3. Keep stale data while refetching

설명:
기존 matrix 데이터를 유지한 채, 새 요청 중에는 우측 배지나 작은 loading indicator만 보여주는 방식.

장점:

- 가장 자연스럽다.
- 사용자가 내용이 사라졌다고 느끼지 않는다.

단점:

- “최초 진입”에는 이전 데이터가 없어서 빈 상태 문제를 직접 해결하지는 못한다.

추천 시점:

- 두 번째 방문 이후나 주기적 refetch UX를 다듬을 때 좋다.

### 4. Empty state for no rows

설명:
실제 `kev` 행이 0개일 때 table 대신 명시적인 안내 문구를 보여준다.

장점:

- 데이터가 없는 상황과 렌더링 지연을 구분하기 쉽다.

단점:

- 이번 이슈처럼 “잠깐 비었다가 나타나는” paint 문제 자체를 해결하지는 못한다.

추천 시점:

- API 응답에 따라 `kev.items.length === 0`이 현실적으로 발생할 수 있을 때 추가한다.

### 5. Route-level skeleton shell

설명:
`overview` 전체를 section 단위 skeleton으로 먼저 렌더링하고, 각 데이터가 준비되는 대로 채우는 방식.

장점:

- 초기 UX가 가장 안정적이다.
- 섹션별 loading 전략을 세분화할 수 있다.

단점:

- 현재 구조보다 상태 분기 복잡도가 올라간다.
- 섹션별 에러 처리도 더 세밀하게 나눠야 한다.

추천 시점:

- overview가 더 무거워지거나, 이후 섹션 수가 늘어날 때 검토한다.

### 6. SSR or route-level prefetch

설명:
SSR로 overview 초깃값을 주입하거나, route loader/prefetch로 진입 전에 핵심 데이터를 먼저 확보하는 방식.

장점:

- hard reload 시점의 빈 화면과 CLS를 구조적으로 가장 잘 줄일 수 있다.
- 네트워크가 안정적일 때 첫 화면 완성도가 높다.

단점:

- 현재 CSR 중심 구조보다 라우팅, 배포, 캐시 정책이 복잡해진다.
- 데이터 최신성과 캐시 무효화 정책까지 같이 설계해야 한다.

정책 메모:

- 현재는 즉시 적용 대상은 아니지만, 이후 overview 안정성과 초기 표시 품질을 더 끌어올릴 필요가 있을 때 우선 검토할 후보로 유지한다.

## Recommended Priority

1. `Reserved height + skeleton rows`
2. `Reduced paint cost`
3. `Keep stale data while refetching`
4. `Empty state for zero-row response`
5. `Route-level section skeleton`
6. `SSR or route-level prefetch`

현재는 1번, 2번, 5번의 일부(overview skeleton alignment)를 반영했고, 6번은 향후 정책 후보로 유지한다.
