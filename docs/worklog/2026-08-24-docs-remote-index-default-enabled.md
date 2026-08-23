# Docs Remote Index Default Enabled

## Context

`BLOG_CONTENT_INCLUDE_REMOTE_INDEX`의 기본값을 `true`로 전환했다.

원격 authoring pipeline을 주 콘텐츠 소스로 쓰는 운영 환경에서는 env를 빠뜨렸을 때 원격 문서가 빠지는 동작보다, 원격 문서를 기본 포함하고 필요한 환경에서만 명시적으로 끄는 편이 더 자연스럽다.

## Changes

- `apps/docs/lib/content-api-config.ts`
  - `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`일 때만 원격 인덱스 병합을 끈다.
  - env가 없거나 `true`이면 원격 인덱스를 포함한다.
- `apps/docs/lib/content-api-config.test.ts`
  - env 생략 시 기본값 `true`를 검증한다.
  - `true` / `false` 명시 동작을 검증한다.
- `apps/docs/.env.example`
  - 예시 값을 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`로 변경했다.
- 문서
  - fail-fast 정책, local/remote 콘텐츠 정책, env checklist, auth ops runbook에서 기본값 설명을 갱신했다.

## Policy

기본 운영 정책:

- 목록/검색/상세는 원격 문서를 우선 포함한다.
- 같은 route가 로컬과 원격에 모두 있으면 원격 문서를 우선한다.
- 원격 요청이 실패하면 로컬 문서로 fallback한다.

로컬 전용 또는 원격 장애 격리 점검:

```env
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false
```

이 값을 명시하면 목록/검색은 원격 문서를 합치지 않고, 상세도 로컬 문서를 먼저 사용한다.
