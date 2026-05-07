# 2026-05-07 Content Authoring Pipeline

## Summary

- 글을 하나씩 올리는 운영을 고려해, content authoring/publish 방향을 문서화했다.
- 핵심 결론은 `로컬에서 원격에 직접 접근해 업로드하는 authoring pipeline`을 두되, `앱 런타임의 읽기 경로`와 `글 업로드 경로`를 분리하는 것이다.

## Decision

- `apps/docs`
  - read-only consumer
- authoring / publish workflow
  - write-only producer

즉 앱은 원격 콘텐츠를 읽기만 하고, 글 업로드는 별도 publish workflow가 담당한다.

## Output

- 기준 문서 추가:
  - `docs/architecture/docs-content-authoring-pipeline.md`

## Notes

- 현재 단계에서는 CMS보다 local authoring + explicit publish가 더 적합하다.
- 이후 실제 스크립트가 필요해지면 `docs:validate-post`, `docs:publish-post` 계열 명령 설계를 이어갈 수 있다.
