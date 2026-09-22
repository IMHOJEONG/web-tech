# 공개 글의 저장소 전용 안내 제거

## Summary

블로그 글에 섞인 내부 저장소 실행 안내를 제거하고, 독자가 개발 환경을 몰라도 읽을 수 있도록 정리했다.

## Changed

- CRP 글에서 저장소 소개, pnpm 실행·테스트 명령, localhost 주소와 전용 라우트를 제거했다. 비교 조건과 DevTools 관찰 절차는 유지했다.
- Canvas 글에서 로컬 개발 서버를 전제하는 문장을 제거했다. public에 존재하는 실험 페이지 링크는 유지했다.
- [콘텐츠 작성 정책](../../architecture/docs-content-authoring-markup-policy.md)에 공개 글과 내부 실행 안내의 경계를 추가했다.

## Notes

`apps/docs/data`, `category`, `data-wip`, `backup_files`의 Markdown/MDX에서 저장소 지칭,
내부 경로·명령, 개발 서버 안내 등의 표현을 검색하고 문맥을 확인했다.
기술 개념으로서의 저장소나 실제 개발 경험을 설명하는 문장은 삭제하지 않았다.
내부 도구 실행법은 `docs/examples/critical-rendering-path-lab/README.md`에 이미 있어 그대로 유지했다.
NAS 원격 글은 이번 로컬 파일 점검에 포함되지 않는다.

검증: 콘텐츠 frontmatter·스타일 검사와 diff 공백 검사를 수행한다.

## Open Questions

원격 글까지 점검하려면 해당 원문이 필요하다.

## Next

새 글 검수 시 저장소를 알고 있다는 전제가 본문에 섞이지 않았는지 확인한다.
