# 2026-05-05 Docs Feed/Docs 라우팅 정리

## 요약

- `/feed`와 `/docs`를 같은 목적의 페이지로 보지 않도록 라우팅 정책을 문서화
- `/feed`는 큐레이션 피드, `/docs`는 문서 인덱스/검색 컨텍스트로 구분
- 정보구조 문서와 검색 정책 문서도 이 기준에 맞춰 보강
- 라우팅 정책 문서에 비교표, 흐름도, 정보 노출 기준까지 추가

## 변경 내용

- `docs/architecture/docs-feed-and-docs-routing-policy.md`
- `docs/architecture/docs-app-information-architecture.md`
- `docs/architecture/docs-search-experience-policy.md`
- `docs/todo/platform-improvement-todo.md`
- `docs/worklog/2026-05-05-docs-feed-and-docs-routing.md`

## 메모

- 이번 작업은 화면 구현 변경보다 라우팅 의미와 페이지 역할 차이를 먼저 문서 기준으로 확정하는 데 목적이 있다.
- 후속으로 `/docs` 전용 인덱스 UI와 `/feed` 전용 큐레이션 UI 차이를 더 키우는 구현 작업이 따라와야 한다.
- 이제 이 문서는 “같은 데이터를 써도 왜 다른 화면이어야 하는가”를 설명하는 기준 문서로 사용할 수 있다.
