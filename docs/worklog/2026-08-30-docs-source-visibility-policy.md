# Docs Source Visibility Policy

## Context

문서 목록과 상세 하단 카드에 `로컬 문서` / `원격 문서` source badge가 노출되어 있었다.

source 정보는 운영자가 콘텐츠 로딩 경로를 확인할 때는 유용하지만, 일반 독자에게는 문서 품질이나 주제를 설명하는 정보가 아니다. 오히려 local / remote라는 구현 세부사항이 화면에 보이면 콘텐츠 탐색 맥락을 흐릴 수 있다.

## Decision

- `docs.content_source` runtime log는 환경 변수와 관계없이 계속 출력한다.
- production UI에서는 source badge를 숨긴다.
- production UI에서는 `/docs` source filter도 숨긴다.
- development UI에서만 source badge와 source filter를 보여 로컬 확인을 돕는다.

## Implementation

- `apps/docs/lib/content-source-visibility.ts`에 UI 노출 조건을 중앙화했다.
- `/docs` 문서 카드의 source pill을 development 환경에서만 렌더링한다.
- 상세 하단 `함께 읽으면 좋은 문서`와 `이어 읽기` 카드의 source pill도 같은 조건을 따른다.
- `/docs` controls bar의 source filter는 development 환경에서만 보인다.

## Notes

production에서 source를 확인해야 할 때는 화면이 아니라 Vercel Runtime Logs에서 `docs.content_source`를 검색한다.

관련 문서:

- `docs/runbooks/docs-remote-payload-observability.md`
- `docs/architecture/docs-local-vs-remote-content-policy.md`
