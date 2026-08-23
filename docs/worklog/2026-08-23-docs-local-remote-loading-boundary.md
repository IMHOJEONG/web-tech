# 2026-08-23 Docs Local / Remote Loading Boundary

## 배경

원격 문서 서버가 응답하지 않으면 `/feed`와 문서 목록 화면 전체가 오류 페이지로 전환되는 문제가 있었다.

이 구조에서는 원격 문서 API가 단일 장애점이 되어, 로컬에 포함된 문서까지 사용할 수 없게 된다.

## 변경

- `apps/docs/lib/get-document.ts`
  - 로컬 문서 로드와 원격 문서 로드를 분리했다.
  - 원격 목록 요청 실패 시 빈 원격 목록으로 낮추고 로컬 문서만 렌더링한다.
  - 원격/로컬 문서가 같은 공개 route를 만들면 원격 문서를 우선하고 중복을 제거한다.
  - 원격 상세 요청 실패 시 동일 route의 로컬 문서를 fallback으로 찾는다.
- `apps/docs/lib/get-search-data.ts`
  - 검색 색인도 로컬/원격을 분리했다.
  - 원격 검색 색인 로드 실패 시 로컬 문서만으로 검색을 계속 수행한다.
- `docs/runbooks/content-api-auth-ops-runbook.md`
  - 원격 endpoint fallback과 로컬 렌더링 fallback의 차이를 문서화했다.

## 정책

원격 content API 실패는 원격 문서 영역의 실패로 제한한다.

목록/검색:

- 로컬 문서는 항상 표시 가능한 기본 데이터로 본다.
- 원격 문서 로드가 실패해도 화면 전체를 오류 상태로 보내지 않는다.
- 원격과 로컬의 route가 겹치면 원격 문서를 우선한다.

상세:

- 동일 route의 로컬 문서가 있으면 원격 요청보다 로컬 문서를 먼저 사용한다.
- 로컬 문서가 없는 route만 원격 상세 요청을 시도한다.
- 로컬 문서도 없으면 기존 오류 또는 not found 흐름을 따른다.

## 주의

- `401/403`에서 다른 endpoint 후보를 계속 시도하지 않는 기존 정책은 유지한다.
- 이번 변경은 endpoint fallback이 아니라 local / remote source fallback이다.
- 운영 로그에서는 원격 실패를 계속 남겨야 한다. 화면을 살리는 것과 장애를 숨기는 것은 다르다.

## 2026-08-23 Follow-up

Vercel runtime에서 원격 content API 530 이후 10초 timeout이 발생할 수 있어 추가 조정했다.

- 상세 route는 로컬 문서를 먼저 찾고, 로컬 문서가 없을 때만 원격 상세 요청을 시도한다.
- 원격 content API 요청은 `BLOG_CONTENT_API_TIMEOUT_MS` 기준으로 fail-fast 한다.
- 기본 timeout은 `2500ms`다.
