# Docs Content Rendering Strategy

## Why This Document Exists

`apps/docs`는 원격 콘텐츠를 읽기 시작하면서 Next.js의 정적/동적 렌더링 전략을 명확히 정해야 하는 상태가 되었다.

특히 현재 에러:

- `DYNAMIC_SERVER_USAGE`
- `Route /feed couldn't be rendered statically because it used revalidate: 0 fetch ...`

는 “어떤 데이터는 실시간으로 보고 싶은데, 페이지는 정적으로 빌드하려고 한다”는 충돌에서 나온다.

이 문서는 `apps/docs`의 페이지별 렌더링 전략과 데이터 신선도 기준을 정리한다.

## Current Situation

현재 원격 목록/본문 fetch는 서버 컴포넌트 안에서 실행된다.

- 목록 메타데이터: `/api/posts`
- 본문 HTML: `/posts/{markdownPath}`

Next.js 관점에서 아래 선택지가 있다.

1. `no-store`
   - 항상 최신
   - 페이지는 dynamic
2. `next.revalidate`
   - ISR
   - 일정 주기마다 최신화
3. 완전 static
   - 빌드 시점 고정
   - 원격 콘텐츠에는 잘 안 맞음

## Recommendation Summary

현재 `apps/docs`는 **ISR 중심 전략**이 가장 적합하다.

추천:

- 목록 페이지: ISR
- 상세 페이지: ISR
- 검색 결과 페이지: dynamic 또는 client-side search
- 운영자 preview/디버그: no-store

즉 기본값은:

- `cache: 'no-store'`를 기본 전략으로 쓰지 않는다.
- `next: { revalidate: N }`를 기본 전략으로 둔다.

## Page-by-Page Strategy

### `/feed`

역할:

- 메인 피드
- 최신 글 목록

권장 전략:

- **ISR**

이유:

- 블로그 피드는 초 단위 실시간성이 보통 필요하지 않다.
- 정적 HTML + 일정 주기 재생성이 성능과 안정성에 유리하다.
- 빌드 시점 `DYNAMIC_SERVER_USAGE` 문제를 피할 수 있다.

추천 주기:

- `revalidate: 300`
  - 5분

### `/docs`

역할:

- 전체 문서 피드
- 검색 전 기본 목록

권장 전략:

- 검색어가 없을 때: **ISR**
- 검색어가 있을 때: **dynamic** 또는 client-side search

이유:

- 기본 목록은 `/feed`와 비슷한 성격
- `?q=`가 붙는 서버 검색은 조합이 많아 static과 잘 안 맞음

추천:

- `/docs` 기본 페이지는 ISR
- 서버 검색을 유지하면 `q`가 있을 때만 dynamic
- 문서 수가 크지 않다면 장기적으로는 client-side search도 고려 가능

### `/docs/[channel]/[articleSlug]`

역할:

- 개별 문서 상세

권장 전략:

- **ISR**

이유:

- 상세 본문도 원격 HTML이지만, 대개 분 단위 캐시로 충분
- 모든 상세를 `force-dynamic`으로 두면 서버 비용과 응답 시간 부담이 커짐

추천 주기:

- `revalidate: 300`
  - 피드와 동일
- 또는 `revalidate: 600`
  - 본문 수정 빈도가 낮다면 10분

### Preview / Admin-like Route

역할:

- 운영자가 즉시 최신 상태를 확인

권장 전략:

- **dynamic**
- 필요 시 `no-store`

이유:

- 이 경로는 실시간성이 더 중요

## Data Freshness Tiers

### Tier 1: Very Fresh

예:

- 운영자 preview
- 디버그용 내부 화면

전략:

- `no-store`

### Tier 2: Fresh Enough

예:

- `/feed`
- `/docs`
- `/docs/[channel]/[articleSlug]`

전략:

- `revalidate: 300` 또는 `600`

### Tier 3: Rarely Changing

예:

- About
- 정적 소개 페이지

전략:

- static 또는 긴 revalidate

## Suggested Environment Variable

권장 env:

- `BLOG_CONTENT_REVALIDATE_SECONDS`

예:

```env
BLOG_CONTENT_REVALIDATE_SECONDS=300
```

의미:

- 원격 콘텐츠 fetch의 기본 ISR 주기

장점:

- 로컬/스테이징/운영에서 주기를 다르게 줄 수 있다.

예시:

- local: `60`
- staging: `120`
- production: `300`

## Concrete Recommendation For This Project

현재 프로젝트 기준 최종 추천안:

1. 원격 목록 API fetch: `revalidate: 300`
2. 원격 본문 API fetch: `revalidate: 300`
3. `/feed`: ISR
4. `/docs` 기본: ISR
5. `/docs?q=...`: dynamic 유지 또는 추후 client-side search 전환
6. `/docs/[channel]/[articleSlug]`: ISR
7. preview/debug 경로가 필요하면 별도 dynamic route 추가

## Why Not `force-dynamic` Everywhere

가능은 하지만 권장하지 않는다.

이유:

- 응답 속도/서버 비용이 불필요하게 커진다.
- 블로그 콘텐츠 특성상 과한 실시간성이다.
- 캐시 이점을 버리게 된다.

## Why Not Full Static Everywhere

이것도 현재 구조에는 잘 맞지 않는다.

이유:

- 원격 콘텐츠가 빌드 후에도 바뀔 수 있다.
- 새 글 반영을 위해 매번 재배포가 필요해진다.

## Next Step

코드 반영 시 해야 할 일:

1. `content-api.ts`의 원격 fetch를 `no-store`에서 `next.revalidate` 기반으로 변경
2. `BLOG_CONTENT_REVALIDATE_SECONDS`를 env로 도입
3. 검색 페이지의 dynamic 여부를 별도 결정
4. 필요하면 preview 전용 route 추가

## Current Applied Direction

현재 코드에는 아래 방향이 반영되어 있다.

- 원격 목록 API fetch: `next.revalidate`
- 원격 본문 API fetch: `next.revalidate`
- 기본 revalidate 값: `300초`
- override env: `BLOG_CONTENT_REVALIDATE_SECONDS`

즉 현재 `apps/docs`는 기본적으로 ISR 중심으로 동작하도록 정리된 상태다.
