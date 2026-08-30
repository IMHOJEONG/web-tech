# Docs Source Visibility Policy

## Context

문서 목록과 상세 하단 카드에 `로컬 문서` / `원격 문서` source badge가 노출되어 있었다.

source 정보는 운영자가 콘텐츠 로딩 경로를 확인할 때는 유용하지만, 일반 독자에게는 문서 품질이나 주제를 설명하는 정보가 아니다. 오히려 local / remote라는 구현 세부사항이 화면에 보이면 콘텐츠 탐색 맥락을 흐릴 수 있다.

## Decision

- `docs.content_source` runtime log는 환경 변수와 관계없이 계속 출력한다.
- UI에서는 source badge를 숨긴다.
- UI에서는 `/docs` source filter도 숨긴다.
- 로컬/원격 로딩 경로는 화면이 아니라 runtime log로만 확인한다.

## Implementation

- `/docs` 문서 카드의 source pill을 제거했다.
- 상세 하단 `함께 읽으면 좋은 문서`와 `이어 읽기` 카드의 source pill도 제거했다.
- `/docs` controls bar의 source filter를 제거했다.
- `/docs?source=local|remote` query가 남아 있어도 화면 필터 조건으로 사용하지 않는다.
- source를 언급하던 filtered empty state copy를 독자-facing 문구로 수정했다.

## Notes

source를 확인해야 할 때는 화면이 아니라 Vercel Runtime Logs에서 `docs.content_source`를 검색한다.

관련 문서:

- `docs/runbooks/docs-remote-payload-observability.md`
- `docs/architecture/docs-local-vs-remote-content-policy.md`
